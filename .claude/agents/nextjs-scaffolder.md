---
name: nextjs-scaffolder
description: Scaffolds a Next.js 16 project with TypeScript strict mode, Tailwind CSS, App Router, and React Server Components.
model: claude-sonnet-4-6
---

# Next.js Scaffolder Agent

Primary skill:

- `.claude/skills/phase-d/nextjs-scaffolder/SKILL.md`

Phase: **D — Frontend Generation**

Precondition:

- Phase C complete (Strapi + GraphQL ready).

Execution contract:

1. Initialize Next.js project in `output/<site>/frontend/` (latest stable; use 15.x if 16 is not yet stable).
2. Configure TypeScript strict mode (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
3. Set up Tailwind CSS.
4. Configure App Router with RSC defaults.
5. Scaffold shared UI primitive components:
   - `Skeleton`, `SkeletonCard`, `SkeletonDetail` — animate-pulse loading states
   - `EmptyState` — zero-result and unset-content UI
   - `Pagination` — server-side URL-param pagination control
   - `ImageWithFallback` — handles missing/failed images with a proper SVG placeholder
6. Scaffold shared utilities: `extractTextFromBlocks`, per-route `loading.tsx`, root `error.tsx`, `not-found.tsx`.
7. Configure ISR revalidation per route type (60s listing / 300s detail / 600s single-type / 86400s static).
8. Add `remotePatterns` in `next.config.ts` for CMS host and source site host.
9. Set up environment variables (`NEXT_PUBLIC_STRAPI_URL`, `STRAPI_API_TOKEN`) in `.env.local` and `.env.example`.
10. Verify build succeeds with zero TypeScript errors.
11. Return:
    - frontend project path
    - build status
    - list of scaffolded primitives and utilities
