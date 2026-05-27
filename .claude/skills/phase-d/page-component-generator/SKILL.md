---
name: page-component-generator
description: AI-generates RSC pages, layouts, and components via Claude API based on design references, route inventory, and CMS data contracts. Applies Vercel best practices for server/client boundaries, async patterns, and bundle optimisation.
argument-hint: "<site-slug>"
user-invocable: true
---

# Page + Component Generator

Phase: **D — Frontend Generation** (Step 3 of 4)

Generate all pages, layouts, and components for the Next.js 16 App Router project, wired to the CMS adapter.

**Core rule:** All user-visible content (headings, body copy, nav labels, CTAs, images, SEO metadata, lists, cards) MUST come from Strapi via `cms` / `ICMSAdapter`. The frontend is a **presentation layer** over CMS data — not a static marketing site with placeholder copy.

## Precondition

- CMS adapter generated (from `cms-adapter-generator`)
- Design references available (preferred: Phase A crawl; fallback: Phase B exploratory baseline)
- Route inventory available (preferred: Phase A `site-crawler`; fallback: Phase B exploratory `index.json`)
- Content Model Spec approved (CHECKPOINT 1)

## Input

- Route inventory (preferred): `output/<site>/docs/research/CONTENT-STRUCTURE.md`
- Route inventory (fallback): `output/<site>/test/exploratory/baseline/index.json`
- Design references (preferred): `output/<site>/docs/research/pages/`
- Design references (fallback): `output/<site>/test/exploratory/baseline/**/screenshot.png` + `text.txt`
- CMS adapter: `output/<site>/frontend/src/lib/cms/`
- Generated types: `output/<site>/frontend/src/generated/graphql.ts`
- Vercel skill packs (quality guardrails):
  - `.claude/skills/frontend/vercel/next-best-practices/SKILL.md`
  - `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md`
  - `.claude/skills/frontend/vercel/next-cache-components/SKILL.md`

## CMS-powered content (mandatory)

### Allowed

- Fetch all page/section data in **Server Components** via `import { cms } from '@/lib/cms'`
- Map CMS fields → props on presentational components (`Hero`, `RichText`, `BlogList`, etc.)
- Static UI chrome only: layout grid classes, spacing tokens, icon names, animation toggles
- `generateMetadata()` / `generateStaticParams()` driven by CMS fields
- Empty states when CMS returns no data (`notFound()`, minimal “no content” message — no fake marketing copy)

### Forbidden

- Hardcoded headlines, paragraphs, blog posts, team bios, prices, or nav item labels in `page.tsx` or section components
- Lorem ipsum, “Welcome to our site”, or demo arrays used as the primary content source
- Duplicating WordPress copy into TS/JS constants instead of reading Strapi
- Client-side `fetch` to Strapi for content that should be server-fetched (unless interactivity requires it)

### Verification (per page)

Before marking a page complete:

1. Remove or grep for forbidden patterns: no large string literals that mirror site copy
2. Confirm the page breaks or shows empty state if Strapi is down / entry missing (proves CMS dependency)
3. Confirm rendered text matches Strapi preview import for that route (same slug/title/body)

Record results in `output/<site>/docs/FRONTEND-CMS-WIRING.md` (one row per route: adapter method, content type, pass/fail).

## Execution

### Step 0: Enforce Visual Reference Coverage (required)

If `output/<site>/docs/research/pages/` does not exist (common in WordPress-only flows), you MUST use the Phase B exploratory baseline as the design reference source:

- Screenshots: `output/<site>/test/exploratory/baseline/**/screenshot.png`
- Per-route visible text: `output/<site>/test/exploratory/baseline/**/text.txt`

If neither preferred nor fallback design references exist, STOP and run Phase B exploratory crawl first (see `.claude/commands/phase-b.md`).

### Step 1: Route-to-Page Mapping

Map every source route to a Next.js App Router page:

| Source Route | Next.js Path | Page Type |
|---|---|---|
| `/` | `app/page.tsx` | Single type (HomePage) |
| `/blog` | `app/blog/page.tsx` | Collection list |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Collection detail |
| `/about` | `app/about/page.tsx` | Single type |
| ... | ... | ... |

### Step 2: Generate Shared Layouts

Create layout components that match the source site structure:

- `app/layout.tsx` — Root layout (HTML shell, fonts, global providers)
- `src/components/layouts/Header.tsx` — Navigation, logo, CTA
- `src/components/layouts/Footer.tsx` — Footer links, social, newsletter
- `src/components/layouts/Navigation.tsx` — Nav menu with mobile responsive

### Step 3: Generate Section Components

Create reusable section components from content model:

- `src/components/sections/Hero.tsx` — Hero section (headline, CTA, background)
- `src/components/sections/FeatureGrid.tsx` — Feature cards grid
- `src/components/sections/BlogList.tsx` — Blog post listing
- `src/components/sections/TestimonialSlider.tsx` — Testimonials
- ... (one per reusable content pattern from spec)

### Step 4: Generate Page Files

For each route, create a page that:

1. Fetches data from CMS adapter (server-side)
2. Renders section components with CMS data
3. Exports metadata using Next.js Metadata API
4. Uses RSC by default (`'use client'` only where needed)

Example page pattern:

```typescript
import { cms } from '@/lib/cms';
import { Hero } from '@/components/sections/Hero';
import { FeatureGrid } from '@/components/sections/FeatureGrid';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const page = await cms.getHomePage();
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription,
  };
}

export default async function HomePage() {
  const page = await cms.getHomePage();
  return (
    <>
      <Hero data={page.hero} />
      <FeatureGrid features={page.features} />
    </>
  );
}
```

### Step 5: Apply Vercel Quality Gates

For every component, enforce:

1. **RSC boundaries** — `'use client'` only for interactive components
2. **Async patterns** — `Promise.all` for parallel data fetching, no waterfalls
3. **Suspense boundaries** — `loading.tsx` and `<Suspense>` for streaming
4. **Image optimisation** — `next/image` with responsive sizes
5. **Font optimisation** — `next/font` for web fonts
6. **Bundle hygiene** — direct imports, dynamic imports for heavy client modules
7. **Composition patterns** — compound components, explicit variants, no boolean-prop explosion

### Step 6: CMS Integration Verification

For each generated page:

1. Verify CMS adapter call returns data
2. Verify rendered content matches source (semantic parity)
3. Verify media URLs resolve correctly
4. Verify metadata is populated from CMS

### Step 7: Visual Parity Checklist (required)

For the top P0 routes (home + primary landing + one content detail page), ensure:

1. **Layout parity** — header/nav/footer structure matches the reference screenshots (positioning + hierarchy, not pixel perfection).
2. **Typography + spacing** — base font scale, heading sizes, and section spacing are consistent with references.
3. **Navigation parity** — key links/CTAs exist and work.
4. **Content parity** — primary headings and above-the-fold text match baseline `text.txt` **and** match live Strapi data (CMS is source of truth; baseline is the acceptance target).

### Step 8: Compare with original URL (required after generation)

After `npm run build` and with Next.js + Strapi running locally:

1. **Source of truth URL** — read from `output/<site>/wp-migration/site-config.json` → `wordpressUrl` (WordPress flows) or Phase A/B legacy URL.
2. **Target URL** — `http://localhost:3000` (or `playwright.config.ts` `baseURL`).
3. For each P0 route, open **legacy URL** and **new frontend** side by side (or use Playwright screenshots):
   - Capture full-page screenshot of legacy route
   - Capture same route on Next.js
   - Compare: layout regions, nav, hero, primary H1/H2, image presence, footer
4. **Fix loop** — adjust Tailwind/layout/components until the new site is recognizably the same brand/layout as the original. Do not “fix” by hardcoding copy; fix structure/styles and ensure CMS fields populate the right slots.
5. Write `output/<site>/docs/VISUAL-PARITY-REPORT.md`:

```markdown
# Visual Parity Report

| Route | Legacy URL | New URL | CMS wired | Layout match | Content match | Notes |
|-------|------------|---------|-----------|--------------|---------------|-------|
| /     | ...        | ...     | yes       | pass/partial | pass/partial  | ...   |
```

Gate: **no route may ship with `CMS wired: no`** or `Content match: fail` on P0 routes.

## Output Contract

- Generated pages in `output/<site>/frontend/src/app/`
- Generated components in `output/<site>/frontend/src/components/`
- Generation report:
  - Pages generated: N
  - Components generated: N
  - Routes covered: N/N
  - CMS integration status per route
  - Vercel quality gate compliance
  - Visual parity notes for P0 routes (what matched / what diverged)
- `output/<site>/docs/FRONTEND-CMS-WIRING.md` — per-route CMS adapter usage
- `output/<site>/docs/VISUAL-PARITY-REPORT.md` — legacy URL vs new frontend comparison

## Downstream

Output feeds into:
- `route-validator` (confirms URL parity)
