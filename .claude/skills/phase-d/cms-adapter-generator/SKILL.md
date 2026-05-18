---
name: cms-adapter-generator
description: Generates a CMS adapter layer with an ICMSAdapter interface and StrapiAdapter implementation for type-safe, decoupled CMS data access in the Next.js frontend.
argument-hint: "<site-slug>"
user-invocable: true
---

# CMS Adapter Generator

Phase: **D — Frontend Generation** (Step 2 of 4)

Generate a type-safe CMS data access layer that decouples the frontend from the specific CMS implementation.

## Precondition

- Next.js project scaffolded (from `nextjs-scaffolder`)
- GraphQL types generated (from `graphql-layer-validator`)
- Strapi running with content (from Phase C)

## Execution

### Step 1: Generate Pagination + Filter Types

Create `src/lib/cms/params.ts`:

```typescript
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

### Step 2: Generate ICMSAdapter Interface

Create `src/lib/cms/adapter.ts` with full pagination and filter support on every list method.

**Rules:**
- Every list method accepts `PaginationParams` (never fetch unbounded lists)
- Every collection list method accepts a typed filter object
- Every list method returns `PaginatedResult<T>` (total count required for pagination UI)
- Single-type methods return `T | null` (never throw on missing CMS content — return null)
- All media URL methods use the adapter, never construct URLs inline in components

```typescript
import type { PaginationParams, SortParams, PaginatedResult } from './params';

// ── Derive these filter types from the actual content model spec ──────────
export interface HotelFilters {
  prefecture?: string;
  search?: string;              // name full-text search
  minDiscount?: number;
  maxDiscount?: number;
}

export interface ICMSAdapter {
  // Collection types — always paginated
  getHotels(
    filters?: HotelFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<PaginatedResult<HotelListItem>>;

  getHotel(slug: string): Promise<Hotel | null>;
  getHotelSlugs(): Promise<string[]>;

  // Single types — return null when not yet seeded (never throw)
  getHomePage(): Promise<HomePage | null>;
  getHotelsPage(): Promise<HotelsPage | null>;
  getContactPage(): Promise<ContactPage | null>;
  getPrivacyPolicyPage(): Promise<PrivacyPolicyPage | null>;
  getTermsPage(): Promise<TermsPage | null>;

  // Media — prefix relative Strapi paths to absolute URLs
  getMediaUrl(path: string | null | undefined): string | undefined;

  // Prefetch helpers for static generation
  getAllHotelSlugs(): Promise<string[]>;
}
```

**Adapt the method signatures above to match the actual content model spec. Every collection type in the spec must have a paginated list method and a single-item method.**

### Step 3: Generate StrapiAdapter Implementation

Create `src/lib/cms/strapi.ts`.

Key implementation requirements:

1. **Pagination — use Strapi's GraphQL pagination meta:**

```typescript
const GET_HOTELS_QUERY = `
  query GetHotels(
    $filters: HotelFiltersInput
    $pagination: PaginationArg
    $sort: [String]
  ) {
    hotels(filters: $filters, pagination: $pagination, sort: $sort) {
      documentId
      name
      slug
      prefecture
      discount_percentage
      thumbnail_image { url alternativeText }
    }
    hotels_connection(filters: $filters) {
      pageInfo { total pageSize page pageCount }
    }
  }
`;
```

Map the result to `PaginatedResult<HotelListItem>`:

```typescript
async getHotels(
  filters?: HotelFilters,
  pagination?: PaginationParams,
  sort?: SortParams
): Promise<PaginatedResult<HotelListItem>> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 12;

  const strapiFilters: Record<string, unknown> = {};
  if (filters?.prefecture) strapiFilters['prefecture'] = { eq: filters.prefecture };
  if (filters?.search) strapiFilters['name'] = { containsi: filters.search };
  if (filters?.minDiscount) strapiFilters['discount_percentage'] = { gte: filters.minDiscount };

  const sortArg = sort ? [`${sort.field}:${sort.direction}`] : ['name:asc'];

  const data = await strapiQuery<{
    hotels: StrapiHotelListItem[];
    hotels_connection: { pageInfo: { total: number; pageSize: number; page: number; pageCount: number } };
  }>(GET_HOTELS_QUERY, {
    filters: Object.keys(strapiFilters).length ? strapiFilters : undefined,
    pagination: { page, pageSize },
    sort: sortArg,
  });

  const { total, pageCount } = data.hotels_connection.pageInfo;
  const items = data.hotels.map(mapHotelListItem);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount,
    hasNextPage: page < pageCount,
    hasPrevPage: page > 1,
  };
}
```

2. **Single-type null handling — never throw on unseeded content:**

```typescript
async getHomePage(): Promise<HomePage | null> {
  try {
    const data = await strapiQuery<{ homePage: StrapiHomePage | null }>(
      GET_HOME_PAGE_QUERY
    );
    if (!data.homePage) return null;
    return mapHomePage(data.homePage);
  } catch {
    return null;  // CMS unreachable or content not seeded — degrade gracefully
  }
}
```

3. **Media URL helper — centralised, never inline:**

```typescript
getMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
  return `${base}${path}`;
}
```

4. **Distinct field mappers — keep raw Strapi shapes separate from frontend types:**

```typescript
function mapHotelListItem(h: StrapiHotelListItem): HotelListItem { ... }
function mapHotel(h: StrapiHotelFull): Hotel { ... }
function mapHomePage(h: StrapiHomePage): HomePage { ... }
```

### Step 4: Generate Type Definitions

Create `src/lib/cms/types.ts`.

**Rules:**
- Define one TypeScript interface per content type from the content model spec
- Match field names to their frontend-friendly camelCase equivalents (not Strapi snake_case)
- Media fields use `{ url: string; alternativeText?: string }` not `string`
- RichText fields use `unknown` — the caller must call a block renderer
- Never use `any`

```typescript
export interface HotelListItem {
  documentId: string;
  name: string;
  slug: string;
  prefecture: string;
  nearestStation?: string;
  officialWebsiteUrl?: string;
  discountPercentage: number;
  thumbnailImage?: { url: string; alternativeText?: string };
}

export interface Hotel extends HotelListItem {
  overview: unknown;      // Strapi Blocks — use extractTextFromBlocks() to render
  roomTypes: unknown;
  accommodationInfo: unknown;
  guidelines: unknown;
  heroImages?: { url: string; alternativeText?: string }[];
  facilities?: { name: string; available: boolean }[];
}

// Single-type interfaces — all fields optional where content may be unseeded
export interface HomePage {
  heroTagline?: string;
  introHeadline?: string;
  introBody?: unknown;
  heroBannerDesktop?: { url: string; alternativeText?: string };
  heroBannerMobile?: { url: string; alternativeText?: string };
  whyChooseBenefits?: { icon?: { url: string }; title: string; description: string }[];
  reservationSteps?: { stepNumber: number; title: string; description?: string }[];
  missionHeadline?: string;
  missionBody?: unknown;
  destinationPhotos?: { image?: { url: string }; regionName: string; prefecture?: string }[];
  corporateHeadline?: string;
  corporateBody?: unknown;
}

// Add one interface per single type in the content model spec
```

### Step 5: Wire Into App

Create `src/lib/cms/index.ts`:

```typescript
export { StrapiAdapter } from './strapi';
export type { ICMSAdapter } from './adapter';
export * from './types';
export * from './params';

// Singleton — import `cms` everywhere
import { StrapiAdapter } from './strapi';
export const cms = new StrapiAdapter();
```

### Step 6: Verify Type Safety

```bash
cd output/<site>/frontend
npx tsc --noEmit
```

Zero errors required before moving to page-component-generator.

## Design Principles

### Adapter Pattern — swap CMS without touching pages
The `ICMSAdapter` interface enables swapping Strapi for any other CMS (Contentful, Sanity, etc.) by writing a new implementation class. Pages import only `cms` and the types — never raw GraphQL or fetch calls.

### Paginated by default — never unbounded fetches
Every list method is paginated. Default page size is 12 for UI grids. The `PaginatedResult<T>` wrapper gives the UI everything it needs to render pagination controls without a second query.

### Graceful degradation for single types
Single-type pages may not be seeded yet during development. The adapter returns `null` instead of throwing — pages must handle `null` by rendering a helpful empty-state UI or CMS admin prompt, never by crashing.

### Filter/sort at the CMS layer — not in the browser
Filtering and sorting happen in the GraphQL query, not in JavaScript after a full fetch. This keeps the payload small and the query fast regardless of collection size.

## Output Contract

- `src/lib/cms/params.ts` — pagination/filter/sort types
- `src/lib/cms/adapter.ts` — ICMSAdapter interface
- `src/lib/cms/strapi.ts` — StrapiAdapter implementation
- `src/lib/cms/types.ts` — frontend-friendly type definitions
- `src/lib/cms/index.ts` — barrel export + singleton
- TypeScript compiles with zero errors
- All list methods paginated (no unbounded fetches)
- All single-type methods return null gracefully

## Downstream

Output feeds into:
- `page-component-generator` (uses adapter to fetch CMS data)
