---
name: cms-adapter-generator
description: Generates a CMS adapter layer with an ICMSAdapter interface and StrapiAdapter implementation for type-safe, decoupled CMS data access in the Next.js frontend.
argument-hint: "<site-slug>"
user-invocable: true
---

# CMS Adapter Generator

Phase: **D — Frontend Generation** (Step 2 of 4)

Generate a type-safe CMS data access layer that decouples the frontend from the specific CMS implementation.

**Every page in Phase D must consume content only through this adapter.** No page may bypass `cms` to read static JSON or hardcoded copy. Strapi (populated in Phase W/C) is the single source of truth for all user-visible text and media URLs.

## Precondition

- Next.js project scaffolded (from `nextjs-scaffolder`)
- GraphQL types generated (from `graphql-layer-validator`)
- Strapi running with content (from Phase C)
- `output/<site>/frontend/.env.local` exists with at least:
  - `STRAPI_GRAPHQL_URL`
  - `STRAPI_REST_URL` (if REST/media helpers are used)
  - `STRAPI_API_TOKEN` (when content requires auth)
  - commented `STRAPI_ADMIN_EMAIL` / `STRAPI_ADMIN_PASSWORD` lines for local reference

## Execution

### Step 1: Generate ICMSAdapter Interface

Create `src/lib/cms/adapter.ts`:

```typescript
export interface ICMSAdapter {
  // Collection type methods
  getPosts(params?: QueryParams): Promise<Post[]>;
  getPost(slug: string): Promise<Post | null>;
  getTeamMembers(): Promise<TeamMember[]>;
  // ... one method per content type from spec

  // Single type methods
  getHomePage(): Promise<HomePage>;
  getAboutPage(): Promise<AboutPage>;
  // ... one method per single type

  // Media
  getMediaUrl(path: string): string;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  filters?: Record<string, unknown>;
  populate?: string | string[];
}
```

### Step 2: Generate StrapiAdapter Implementation

Create `src/lib/cms/strapi.ts`:

```typescript
import type { ICMSAdapter, QueryParams } from './adapter';

export class StrapiAdapter implements ICMSAdapter {
  private graphqlUrl: string;
  private restBase: string;
  private token?: string;

  constructor() {
    this.graphqlUrl =
      process.env.STRAPI_GRAPHQL_URL ?? 'http://localhost:1337/graphql';
    this.restBase = process.env.STRAPI_REST_URL ?? 'http://localhost:1337/api';
    this.token = process.env.STRAPI_API_TOKEN;
  }

  // Prefer GraphQL for content reads; use REST only when required (e.g. uploads).

  private async fetchRest<T>(endpoint: string, params?: QueryParams): Promise<T> {
    const url = new URL(endpoint, this.restBase.endsWith('/') ? this.restBase : `${this.restBase}/`);
    // Add query params...
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(url.toString(), { headers, next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`CMS fetch failed: ${res.status}`);
    return res.json();
  }

  // Implement all ICMSAdapter methods...
}

export const cms = new StrapiAdapter();
```

### Step 2.5: Enforce CMS API folder layout

Ensure the CMS layer follows this structure:

```text
src/lib/cms/
  client.ts
  adapter.ts
  strapi.ts
  index.ts
  types.ts
  queries/
  mappers/
```

### Step 3: Generate Type Definitions

Create `src/lib/cms/types.ts` using generated GraphQL types:

```typescript
// Re-export generated types with frontend-friendly names
export type { BlogPost as Post } from '@/generated/graphql';
export type { TeamMember } from '@/generated/graphql';
// ...
```

### Step 3.5: Env contract verification (required)

Before implementation:

1. Read `output/<site>/frontend/.env.local` — all CMS URLs/tokens must come from env.
2. Ensure adapter reads **only**:
   - `STRAPI_GRAPHQL_URL` (primary)
   - `STRAPI_REST_URL` (optional REST/media)
   - `STRAPI_API_TOKEN` (server-side)
3. Do **not** read `STRAPI_ADMIN_EMAIL` / `STRAPI_ADMIN_PASSWORD` in runtime code — those are commented reference lines for developers only.
4. If env is missing, copy from `.env.local.example` and fill from Phase C bootstrap output.

### Step 4: Wire Into App

Create `src/lib/cms/index.ts`:

```typescript
export { cms } from './strapi';
export type { ICMSAdapter } from './adapter';
export * from './types';
```

### Step 5: Verify Type Safety

```bash
cd output/<site>/frontend
npx tsc --noEmit
```

### Step 6: CMS Coverage Matrix (required)

Before handing off to `page-component-generator`, create `output/<site>/docs/CMS-ADAPTER-COVERAGE.md`:

| Content type (Strapi) | Adapter method | Used by route(s) |
|-----------------------|----------------|------------------|
| e.g. `api::page.page` | `getPage(slug)` | `/about`, `/contact` |
| e.g. `api::article.article` | `getPost(slug)` | `/blog/[slug]` |

Rules:

- One adapter method per collection/single type from the approved content model
- Methods must return populated fields needed for layout (title, slug, body, SEO, media, dynamic zones/components)
- `getMediaUrl()` must resolve Strapi upload URLs for `next/image`
- No static fallback content as primary source in page-level rendering paths

### Step 7: Dynamic data verification (required)

Before handoff:

1. Change one Strapi content entry (title/body/CTA) for a P0 page.
2. Reload frontend page.
3. Verify updated value is rendered from adapter response.
4. If content does not change, treat as integration failure.

## Design Principle: Adapter Pattern

The `ICMSAdapter` interface enables:
- **CMS-agnostic frontend** — swap Strapi for Contentful, Sanity, etc. by implementing a new adapter
- **Type safety** — all CMS data is typed at compile time
- **Testability** — mock the adapter for unit tests

## Output Contract

- `src/lib/cms/adapter.ts` — ICMSAdapter interface
- `src/lib/cms/strapi.ts` — StrapiAdapter implementation
- `src/lib/cms/types.ts` — Type definitions
- `src/lib/cms/index.ts` — Barrel export
- `src/lib/cms/client.ts` — CMS API client
- `src/lib/cms/queries/*` — query documents/builders
- `src/lib/cms/mappers/*` — mapping functions
- `output/<site>/docs/CMS-ADAPTER-COVERAGE.md` — content type → method → route map
- TypeScript compiles with zero errors
- All Strapi content types used on the site have a corresponding adapter method (no orphan types)
- Dynamic-data verification passed (no static primary content)
- Adapter uses env-driven `STRAPI_GRAPHQL_URL` / `STRAPI_REST_URL` (no hardcoded localhost in source)

## Downstream

Output feeds into:
- `page-component-generator` (uses adapter to fetch CMS data)
