---
name: page-component-generator
description: AI-generates RSC pages, layouts, and components via Claude API based on design references, route inventory, and CMS data contracts. Applies Vercel best practices for server/client boundaries, async patterns, and bundle optimisation.
argument-hint: "<site-slug>"
user-invocable: true
---

# Page + Component Generator

Phase: **D — Frontend Generation** (Step 3 of 4)

Generate all pages, layouts, and components for the Next.js App Router project, wired to the CMS adapter.

## Precondition

- CMS adapter generated (from `cms-adapter-generator`)
- Design references available from Phase A crawl
- Route inventory from `site-crawler`
- Content Model Spec approved (CHECKPOINT 1)
- Shared UI primitives scaffolded (from `nextjs-scaffolder`)

## Input

- Route inventory: `output/<site>/docs/research/CONTENT-STRUCTURE.md`
- Per-page content maps: `output/<site>/docs/research/pages/<slug>/CONTENT-MAP.md`
- Per-page behaviors: `output/<site>/docs/research/pages/<slug>/BEHAVIORS.md`
- CMS adapter: `output/<site>/frontend/src/lib/cms/`
- Shared primitives: `output/<site>/frontend/src/components/ui/`
- Vercel skill packs (quality guardrails):
  - `.claude/skills/frontend/vercel/next-best-practices/SKILL.md`
  - `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md`
  - `.claude/skills/frontend/vercel/next-cache-components/SKILL.md`

---

## Mandatory Rules (apply before writing any component)

### Rule 1 — Zero hardcoded CMS content

**Never declare static arrays or objects for content that belongs in the CMS.**

Bad — hardcoded data defeats the entire purpose of a CMS:
```typescript
// ❌ WRONG
const benefits = [
  { title: "Up to 40% off", description: "..." },
  { title: "Wide range of facilities", description: "..." },
];
```

Good — fetch from adapter, show empty state if not seeded:
```typescript
// ✅ CORRECT
const page = await cms.getHomePage();
if (!page) return <CmsNotSeeded section="Home Page" />;
const benefits = page.whyChooseBenefits ?? [];
```

If a single-type page's content is not yet seeded in the CMS, render a clear in-app prompt:

```typescript
function CmsNotSeeded({ section }: { section: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-gray-500 text-sm">
        Content for <strong>{section}</strong> is not yet seeded in the CMS.
      </p>
      <a
        href={`${process.env.NEXT_PUBLIC_STRAPI_URL}/admin`}
        className="text-amber-700 underline text-sm mt-1 block"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Strapi admin to add content
      </a>
    </div>
  );
}
```

**Exception:** UI labels, placeholder text, and copy that is part of the design system (button labels, form placeholders, error messages) may be hardcoded. Only semantic CMS content (text, images, structured data from the content model) must come from the adapter.

### Rule 2 — Pagination on every collection listing

Every page rendering a collection type **must** implement server-side pagination:

```typescript
// Collection listing page — reads page from URL search params
interface HotelsPageProps {
  searchParams: Promise<{ page?: string; prefecture?: string; search?: string }>;
}

export const revalidate = 60;

export default async function HotelsPage({ searchParams }: HotelsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const filters = {
    prefecture: params.prefecture,
    search: params.search,
  };

  const result = await cms.getHotels(filters, { page, pageSize: 12 });

  return (
    <>
      <FilterBar selected={filters} />
      <HotelGrid hotels={result.items} />
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        baseUrl="/hotels"
        searchParams={{ ...filters }}
      />
      <p className="text-center text-sm text-gray-500 mt-2">
        {result.total} properties
      </p>
    </>
  );
}
```

Default page size is 12 for 3-column grids. Adjust for 2-column or 4-column grids accordingly.

### Rule 3 — Search and filter UI for collection listing pages

Every collection listing page must include a `FilterBar` component with:
- Free-text search input (debounced, updates URL `?search=`)
- At least one facet filter derived from the content model (e.g., prefecture dropdown for hotels)
- Clear filters button when any filter is active
- Result count label

The `FilterBar` is a **Client Component** (`'use client'`) because it handles user input. It updates URL search params using `useRouter` and `useSearchParams` from `next/navigation`:

```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface FilterBarProps {
  prefectures?: string[];   // derived from CMS data, passed from page
  selected: { prefecture?: string; search?: string };
}

export function FilterBar({ prefectures = [], selected }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // reset to page 1 on filter change
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="search"
        placeholder="Search hotels…"
        defaultValue={selected.search ?? ''}
        onChange={(e) => update('search', e.target.value || undefined)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56"
      />
      {prefectures.length > 0 && (
        <select
          value={selected.prefecture ?? ''}
          onChange={(e) => update('prefecture', e.target.value || undefined)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All prefectures</option>
          {prefectures.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}
      {(selected.prefecture || selected.search) && (
        <button
          onClick={() => router.push('?')}
          className="text-sm text-gray-500 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
```

Wrap `FilterBar` in `<Suspense>` on the page because it uses `useSearchParams`:

```typescript
<Suspense fallback={<div className="h-12" />}>
  <FilterBar prefectures={allPrefectures} selected={filters} />
</Suspense>
```

### Rule 4 — Suspense + loading.tsx on every route

Every page with a data fetch must have a sibling `loading.tsx` using the skeleton primitives from the scaffolder:

```typescript
// src/app/hotels/loading.tsx
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function HotelsLoading() {
  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
```

```typescript
// src/app/[slug]/loading.tsx
import { SkeletonDetail } from '@/components/ui/Skeleton';

export default function HotelDetailLoading() {
  return <SkeletonDetail />;
}
```

### Rule 5 — ImageWithFallback everywhere, never emoji placeholders

Use `ImageWithFallback` from `src/components/ui/ImageWithFallback.tsx` for every image that may be missing from the CMS. Pass a `fallbackLabel` that describes the content (e.g., the hotel name or region).

```typescript
// ✅ CORRECT
<div className="relative h-44 w-full">
  <ImageWithFallback
    src={hotel.thumbnailImage?.url}
    alt={hotel.thumbnailImage?.alternativeText ?? hotel.name}
    fallbackLabel={hotel.name}
    fill
    className="object-cover"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
</div>
```

```typescript
// ❌ WRONG — emoji placeholder is poor UX
<span className="text-4xl">🏨</span>
```

### Rule 6 — ISR revalidation export on every page

Every page file must export `revalidate` using the values from the scaffolder:

```typescript
export const revalidate = 60;  // listing pages
export const revalidate = 300; // detail pages
export const revalidate = 600; // homepage / single types
export const revalidate = 86400; // static legal pages
```

Dynamic collection detail pages must also export `generateStaticParams` and set `dynamicParams = true` so new slugs added after build are served with ISR rather than returning 404:

```typescript
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await cms.getAllHotelSlugs();
  return slugs.map((slug) => ({ slug }));
}
```

### Rule 7 — Error boundary at section level for unreliable CMS sections

Wrap independently-fetched sections in `<Suspense>` with isolated async components so a single section failure doesn't crash the page:

```typescript
// Page-level parallel fetching — wrap each in Suspense
export default async function HotelDetailPage({ params }) {
  const { slug } = await params;

  return (
    <div>
      <Suspense fallback={<SkeletonDetail />}>
        <HotelDetailContent slug={slug} />
      </Suspense>
    </div>
  );
}

async function HotelDetailContent({ slug }: { slug: string }) {
  const hotel = await cms.getHotel(slug);
  if (!hotel) notFound();
  // ... render
}
```

---

## Step 1: Route-to-Page Mapping

Map every source route to a Next.js App Router page. Derive from the route inventory:

| Source Route | Next.js Path | Page Type | ISR |
|---|---|---|---|
| `/` | `app/page.tsx` | Single type (HomePage) | 600s |
| `/hotels` | `app/hotels/page.tsx` | Collection list | 60s |
| `/hotels/[slug]` | `app/hotels/[slug]/page.tsx` | Collection detail | 300s |
| `/about` | `app/about/page.tsx` | Single type | 600s |
| `/contact` | `app/contact/page.tsx` | Single type | 3600s |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | Static legal | 86400s |
| `/terms` | `app/terms/page.tsx` | Static legal | 86400s |
| ... | ... | ... | ... |

**Adapt to the actual route inventory from Phase A.**

## Step 2: Generate Shared Layouts

Create layout components that match the source site structure from the Phase A design references:

- `app/layout.tsx` — Root layout: imports Header, Footer, sets site-level fonts and global metadata
- `src/components/layouts/Header.tsx` — Navigation, logo, CTA — **match source site visual design**
- `src/components/layouts/Footer.tsx` — Footer links, social, copyright — **match source site visual design**

Layout components are RSC unless they contain interactive elements (mobile menu toggle → `'use client'`).

## Step 3: Generate Section Components

Create reusable section components from the content model spec. Each component:
- Accepts a typed prop (the relevant CMS type from `types.ts`)
- Never fetches data itself — receives data from the parent page
- Is an RSC unless interactive

Derive sections from `CONTENT-MAP.md` for each page. Common patterns:

```
src/components/sections/
  Hero.tsx              — hero banner (image + tagline + CTA)
  BenefitGrid.tsx       — why-choose cards
  StepList.tsx          — numbered reservation steps
  HotelGrid.tsx         — paginated hotel listing grid
  HotelCard.tsx         — single hotel card (used inside HotelGrid)
  FacilitiesTable.tsx   — hotel facilities with available/unavailable markers
  DestinationGrid.tsx   — region photo grid linking to filtered hotel list
  ReservationForm.tsx   — contact/reservation form (client component)
  FilterBar.tsx         — search + facet filters (client component)
  Pagination.tsx        — page navigation (uses shared ui/Pagination)
  RichTextRenderer.tsx  — renders Strapi Blocks JSON to HTML
```

## Step 4: Generate Page Files

### Single-type page pattern (e.g., HomePage)

```typescript
import { cms } from '@/lib/cms';
import { Hero } from '@/components/sections/Hero';
import { BenefitGrid } from '@/components/sections/BenefitGrid';
import { StepList } from '@/components/sections/StepList';
import { DestinationGrid } from '@/components/sections/DestinationGrid';
import { CmsNotSeeded } from '@/components/ui/CmsNotSeeded';
import type { Metadata } from 'next';

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await cms.getHomePage();
  return {
    title: page?.seoTitle ?? 'TabiPass',
    description: page?.seoDescription ?? '',
  };
}

export default async function HomePage() {
  const page = await cms.getHomePage();

  if (!page) return <CmsNotSeeded section="Home Page" />;

  return (
    <>
      <Hero
        tagline={page.heroTagline}
        bannerDesktop={page.heroBannerDesktop}
        bannerMobile={page.heroBannerMobile}
      />
      <BenefitGrid benefits={page.whyChooseBenefits ?? []} />
      <StepList steps={page.reservationSteps ?? []} />
      <DestinationGrid destinations={page.destinationPhotos ?? []} />
    </>
  );
}
```

### Collection listing page pattern (e.g., HotelsPage)

```typescript
import { Suspense } from 'react';
import { cms } from '@/lib/cms';
import { HotelGrid } from '@/components/sections/HotelGrid';
import { FilterBar } from '@/components/sections/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Hotels | TabiPass',
  description: 'Browse premium Japanese hotels exclusive to TabiPass members.',
};

interface Props {
  searchParams: Promise<{ page?: string; prefecture?: string; search?: string }>;
}

export default async function HotelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const filters = {
    prefecture: params.prefecture,
    search: params.search,
  };

  const [result, cmsPage] = await Promise.all([
    cms.getHotels(filters, { page, pageSize: 12 }),
    cms.getHotelsPage(),
  ]);

  // Derive prefecture list for filter dropdown from the first full page
  const allHotels = await cms.getHotels({}, { page: 1, pageSize: 200 });
  const prefectures = [...new Set(allHotels.items.map((h) => h.prefecture))].sort();

  return (
    <>
      {/* Hero — from CMS or graceful fallback */}
      <section className="bg-[#1a1a2e] text-white py-14 text-center">
        <h1 className="text-3xl font-extrabold">
          {cmsPage?.listingHeadline ?? 'Recommended travel destinations'}
        </h1>
      </section>

      <div className="py-10 px-4 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<div className="h-12" />}>
            <FilterBar prefectures={prefectures} selected={filters} />
          </Suspense>

          {result.items.length === 0 ? (
            <EmptyState
              title="No hotels found"
              description="Try adjusting your filters or search term."
            />
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">{result.total} properties</p>
              <HotelGrid hotels={result.items} />
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                baseUrl="/hotels"
                searchParams={{ ...filters }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
```

### Static/legal page pattern (e.g., PrivacyPolicyPage)

```typescript
import { cms } from '@/lib/cms';
import { RichTextRenderer } from '@/components/sections/RichTextRenderer';
import { CmsNotSeeded } from '@/components/ui/CmsNotSeeded';
import type { Metadata } from 'next';

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await cms.getPrivacyPolicyPage();
  return { title: page?.title ?? 'Privacy Policy | TabiPass' };
}

export default async function PrivacyPolicyPage() {
  const page = await cms.getPrivacyPolicyPage();

  if (!page) return <CmsNotSeeded section="Privacy Policy Page" />;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      {page.lastUpdated && (
        <p className="text-sm text-gray-500 mb-6">
          Last updated: {new Date(page.lastUpdated).toLocaleDateString()}
        </p>
      )}
      <RichTextRenderer content={page.content} />
    </article>
  );
}
```

## Step 5: RichText Renderer

Create `src/components/sections/RichTextRenderer.tsx` to render Strapi Blocks JSON into semantic HTML:

```typescript
interface BlockNode {
  type: string;
  children?: BlockNode[];
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  level?: number;
  url?: string;
  image?: { url: string; alternativeText?: string; width?: number; height?: number };
  format?: 'ordered' | 'unordered';
}

interface RichTextRendererProps {
  content: unknown;
  className?: string;
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  if (!content || !Array.isArray(content)) {
    return null;
  }

  function renderInline(node: BlockNode): React.ReactNode {
    let text: React.ReactNode = node.text ?? '';
    if (node.bold) text = <strong>{text}</strong>;
    if (node.italic) text = <em>{text}</em>;
    if (node.underline) text = <u>{text}</u>;
    if (node.type === 'link' && node.url) {
      return (
        <a href={node.url} className="text-amber-800 underline">
          {node.children?.map(renderInline)}
        </a>
      );
    }
    return text;
  }

  function renderBlock(block: BlockNode, index: number): React.ReactNode {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {block.children?.map(renderInline)}
          </p>
        );
      case 'heading': {
        const Tag = `h${block.level ?? 2}` as 'h1' | 'h2' | 'h3' | 'h4';
        return (
          <Tag key={index} className="font-bold text-gray-900 mt-6 mb-3">
            {block.children?.map(renderInline)}
          </Tag>
        );
      }
      case 'list':
        return block.format === 'ordered' ? (
          <ol key={index} className="list-decimal ml-6 mb-4 space-y-1">
            {block.children?.map((item, i) => (
              <li key={i} className="text-gray-700">{item.children?.map(renderInline)}</li>
            ))}
          </ol>
        ) : (
          <ul key={index} className="list-disc ml-6 mb-4 space-y-1">
            {block.children?.map((item, i) => (
              <li key={i} className="text-gray-700">{item.children?.map(renderInline)}</li>
            ))}
          </ul>
        );
      case 'image':
        return block.image ? (
          <figure key={index} className="my-6">
            <img
              src={block.image.url}
              alt={block.image.alternativeText ?? ''}
              width={block.image.width}
              height={block.image.height}
              className="rounded-lg max-w-full"
            />
          </figure>
        ) : null;
      default:
        return null;
    }
  }

  return (
    <div className={`prose prose-gray max-w-none ${className}`}>
      {(content as BlockNode[]).map(renderBlock)}
    </div>
  );
}
```

## Step 6: Apply Vercel Quality Gates

For every component, enforce:

1. **RSC boundaries** — `'use client'` only for interactive components (forms, filters, dropdowns, modals)
2. **Async patterns** — `Promise.all` for parallel fetches on the same page, no sequential awaits
3. **Suspense boundaries** — `loading.tsx` per route + `<Suspense>` around client components that use `useSearchParams`
4. **Image optimisation** — `next/image` (or `ImageWithFallback`) with `fill` + `sizes`, never raw `<img>` for CMS images
5. **Font optimisation** — `next/font` for any web fonts used in the design
6. **Bundle hygiene** — direct imports, dynamic imports for heavy client libraries
7. **Composition patterns** — typed props, no boolean-prop explosion, compound components where needed

## Step 7: Visual Fidelity Verification

For each generated page, verify it matches the source design references from Phase A:

1. Open the relevant `output/<site>/docs/research/pages/<slug>/CONTENT-MAP.md`
2. Check every content region is present and rendering CMS data (not static hardcoded copy)
3. Use the Playwright MCP to take a screenshot of the generated page
4. Compare visual structure against the source site screenshot
5. Fix any structural discrepancies (missing sections, wrong layout, incorrect colors)

A page is not complete until:
- All content regions from the CONTENT-MAP are rendered
- All images use `ImageWithFallback` (no emoji, no raw broken `<img>`)
- A `loading.tsx` skeleton exists for the route
- ISR `revalidate` is exported
- `generateMetadata` is implemented from CMS data
- TypeScript compiles with zero errors

## Output Contract

- Generated pages in `output/<site>/frontend/src/app/`
- Generated components in `output/<site>/frontend/src/components/`
- Generation report at `output/<site>/frontend/PAGES-GENERATED.md`:
  - Pages generated: N
  - Components generated: N
  - Routes covered: N/N
  - Pagination: implemented / not applicable per route
  - Search/filter: implemented / not applicable per route
  - CMS integration status per route (wired / null-guarded / stub)
  - Vercel quality gate compliance
  - ISR strategy per route

## Downstream

Output feeds into:
- `route-validator` (confirms URL parity)
