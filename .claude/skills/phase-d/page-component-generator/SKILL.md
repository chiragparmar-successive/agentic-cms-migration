---
name: page-component-generator
description: AI-generates RSC pages, layouts, and components via Claude API based on design references, route inventory, and CMS data contracts. Applies Vercel best practices for server/client boundaries, async patterns, and bundle optimisation.
argument-hint: "<site-slug>"
user-invocable: true
---

# Page + Component Generator

Phase: **D — Frontend Generation** (Step 3 of 4)

Generate all pages, layouts, and components for the Next.js 16 App Router project, wired to the CMS adapter.

## Precondition

- CMS adapter generated (from `cms-adapter-generator`)
- Design references available from Phase A crawl
- Route inventory from `site-crawler`
- Content Model Spec approved (CHECKPOINT 1)

## Input

- Route inventory: `output/<site>/docs/research/CONTENT-STRUCTURE.md`
- Design references: `output/<site>/docs/research/pages/`
- CMS adapter: `output/<site>/frontend/src/lib/cms/`
- Generated types: `output/<site>/frontend/src/generated/graphql.ts`
- Vercel skill packs (quality guardrails):
  - `.claude/skills/frontend/vercel/next-best-practices/SKILL.md`
  - `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md`
  - `.claude/skills/frontend/vercel/next-cache-components/SKILL.md`

## Execution

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

## Output Contract

- Generated pages in `output/<site>/frontend/src/app/`
- Generated components in `output/<site>/frontend/src/components/`
- Generation report:
  - Pages generated: N
  - Components generated: N
  - Routes covered: N/N
  - CMS integration status per route
  - Vercel quality gate compliance

## Downstream

Output feeds into:
- `route-validator` (confirms URL parity)
