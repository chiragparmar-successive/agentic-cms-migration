---
name: nextjs-scaffolder
description: Scaffold a Next.js 16 project with TypeScript strict mode, Tailwind CSS, App Router, and React Server Components. Sets up the project foundation for CMS-driven frontend generation.
argument-hint: "<site-slug>"
user-invocable: true
---

# Next.js 16 Scaffolder

Phase: **D — Frontend Generation** (Step 1 of 4)

Create the Next.js project foundation with production-ready defaults.

## Precondition

- Phase C complete (Strapi + GraphQL ready)

## Execution

### Step 1: Initialise Project

```bash
cd output/<site>
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint
```

### Step 2: TypeScript Strict Mode

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Step 3: Environment Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:<port>
STRAPI_API_TOKEN=<token>
```

Use the actual CMS port from Phase C — never hardcode 1337.

### Step 4: Project Structure

```
output/<site>/frontend/
  src/
    app/
      layout.tsx              # root layout — Header + Footer + global fonts
      page.tsx                # homepage
      loading.tsx             # root-level skeleton
      error.tsx               # root-level error boundary
      not-found.tsx           # 404 page
      <collection>/
        page.tsx              # listing page (server component)
        loading.tsx           # skeleton for listing
      <collection>/[slug]/
        page.tsx              # detail page
        loading.tsx           # skeleton for detail
      api/
        ...                   # route handlers
    components/
      ui/                     # design-system primitives (Skeleton, Badge, Spinner)
      sections/               # page-section components
      layouts/                # Header, Footer, Navigation
    lib/
      cms/
        adapter.ts            # ICMSAdapter interface
        strapi.ts             # StrapiAdapter implementation
        params.ts             # PaginationParams, PaginatedResult, FilterParams
        types.ts              # frontend-friendly type definitions
        index.ts              # barrel export + singleton
      utils/
        blocks.ts             # extractTextFromBlocks(blocks: unknown): string
        url.ts                # prefixStrapiUrl(path: string | null): string | undefined
    generated/
      graphql.ts              # from graphql-codegen
    styles/
      globals.css
  public/
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

### Step 5: ISR Configuration per Route Type

Set revalidation in `next.config.ts` defaults, then override per page:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '1337' },
      // add source site hostname so crawled image URLs work during ETL phase
    ],
  },
};
export default nextConfig;
```

Per-page revalidation rules (applied in `page-component-generator`):

| Route type | Strategy | `revalidate` value |
|---|---|---|
| Collection listing | ISR | `60` (1 minute) |
| Collection detail | ISR + `generateStaticParams` | `300` (5 minutes) |
| Single type (homepage, about) | ISR | `600` (10 minutes) |
| Static pages (privacy, terms) | ISR | `86400` (24 hours) |

Export the constant at the top of each page file:

```typescript
export const revalidate = 60;
```

### Step 6: Shared Primitive Components

Scaffold these before `page-component-generator` runs so it can import them:

#### `src/components/ui/Skeleton.tsx`

```typescript
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
```

#### `src/components/ui/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <p className="text-xl font-semibold text-gray-700">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

#### `src/components/ui/Pagination.tsx`

```typescript
import Link from 'next/link';

interface PaginationProps {
  page: number;
  pageCount: number;
  baseUrl: string;            // e.g. "/hotels"
  searchParams?: Record<string, string>;  // preserve existing filters
}

export function Pagination({ page, pageCount, baseUrl, searchParams = {} }: PaginationProps) {
  if (pageCount <= 1) return null;

  function buildUrl(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) });
    return `${baseUrl}?${params.toString()}`;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-10">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Previous
        </Link>
      )}
      <span className="text-sm text-gray-600 px-2">
        Page {page} of {pageCount}
      </span>
      {page < pageCount && (
        <Link
          href={buildUrl(page + 1)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
```

#### `src/components/ui/ImageWithFallback.tsx`

```typescript
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fallbackLabel?: string;   // displayed in placeholder when no image
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackLabel,
  fill = false,
  className = '',
  sizes,
  priority = false,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {fallbackLabel && (
          <p className="text-xs text-gray-500 font-medium">{fallbackLabel}</p>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
```

#### `src/lib/utils/blocks.ts`

```typescript
interface BlockNode {
  type?: string;
  text?: string;
  children?: BlockNode[];
}

export function extractTextFromBlocks(blocks: unknown): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  function walk(node: BlockNode): string {
    if (node.text) return node.text;
    if (node.children) return node.children.map(walk).join(' ');
    return '';
  }
  return (blocks as BlockNode[]).map(walk).filter(Boolean).join('\n\n');
}
```

#### `src/app/loading.tsx` (root-level)

```typescript
import { SkeletonCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="py-10 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
```

#### `src/app/error.tsx`

```typescript
'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
      <p className="text-gray-600 text-sm mb-6 max-w-sm">
        We couldn&apos;t load this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
```

#### `src/app/not-found.tsx`

```typescript
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <p className="text-6xl font-black text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-600 text-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
```

### Step 7: Vercel Best Practices Setup

Apply vendored skill packs as quality foundations:

1. `next-best-practices` — file conventions, RSC boundaries, metadata
2. `vercel-react-best-practices` — performance, bundle, rerender hygiene
3. `vercel-composition-patterns` — component API design
4. `next-cache-components` — cache components (when enabled)

### Step 8: Build Verification

```bash
cd output/<site>/frontend
npm install
npm run build
npx tsc --noEmit
```

Build must succeed with zero errors and zero TypeScript errors before proceeding.

## Output Contract

- Scaffolded project at `output/<site>/frontend/`
- Build succeeds with zero errors
- TypeScript strict mode enabled
- Tailwind configured
- App Router + RSC defaults
- Shared UI primitives: `Skeleton`, `SkeletonCard`, `SkeletonDetail`, `EmptyState`, `Pagination`, `ImageWithFallback`
- Shared utils: `extractTextFromBlocks`, per-route `loading.tsx` + `error.tsx` + `not-found.tsx`
- ISR revalidation constants defined per route type
- Environment variables documented in `.env.local` and `.env.example`

## Downstream

Output feeds into:
- `cms-adapter-generator` (adds CMS data layer)
