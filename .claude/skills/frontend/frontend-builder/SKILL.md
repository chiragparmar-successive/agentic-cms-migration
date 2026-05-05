---
name: frontend-builder
description: Build and integrate Next.js frontend from design references and CMS contracts while enforcing Vercel best practices.
argument-hint: "<url> [sitemap-url]"
user-invocable: true
---

# Frontend Builder

Generate or refine a Next.js frontend that matches extracted design/content and integrates with CMS data.

This skill is the canonical frontend implementation flow and MUST remain compatible with:

- `.claude/skills/orchestrators/fullstack-master-builder/SKILL.md`
- `.claude/skills/cms/cms-generator/SKILL.md`

## Mandatory Vercel Augmentation

For every implementation/refactor pass, apply these skills as guardrails:

1. `.claude/skills/frontend/vercel/next-best-practices/SKILL.md`
2. `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md`
3. `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md`
4. `.claude/skills/frontend/vercel/next-cache-components/SKILL.md` (when project uses Next.js 16+ cache components)
5. `.claude/skills/frontend/vercel/cra-to-next-migration/SKILL.md` (only when migrating CRA input)

Do not replace existing architecture; use these to improve implementation quality, performance, and maintainability.

## Contract

You MUST:

1. Preserve existing project structure and domain architecture.
2. Implement pages/components from captured references with reusable composition.
3. Integrate CMS data contracts without mock fallback for production paths.
4. Enforce Vercel patterns for RSC boundaries, async/data fetching, metadata, images/fonts, and bundling.
5. Ensure no regressions in existing routes and critical flows.

## Implementation Workflow

### Phase 1: Inputs and Scope

1. Validate target URL/sitemap inputs.
2. Identify route inventory and page priority (home, key listings, key details, conversion pages).
3. Confirm CMS contract endpoints and field mappings before component wiring.

### Phase 2: Architecture Preservation

1. Keep existing app-level conventions and folder layout.
2. Reuse existing shared UI primitives and section components.
3. Prefer composition patterns over boolean-prop explosion:
   - compound components
   - explicit variants
   - context only where state is truly shared

### Phase 3: Vercel-Conformant Next.js Build

Apply `next-best-practices` and `vercel-react-best-practices` directly:

1. Keep server/client boundaries explicit (`'use client'` only where needed).
2. Avoid data waterfalls (`Promise.all`, preload, Suspense boundaries).
3. Use route/file conventions (`layout.tsx`, `loading.tsx`, `error.tsx`, metadata APIs).
4. Use `next/image` and `next/font` optimization patterns.
5. Avoid bundle bloat (direct imports, dynamic imports for heavy client-only modules).
6. Keep server logic on server and minimize serialized props.

### Phase 4: CMS Integration

1. Implement a typed API layer (for example `src/lib/strapi.ts`) with normalized fetch helpers.
2. Replace placeholder/mock content with CMS responses for all required routes.
3. Ensure list/detail/global blocks are API-backed and render exact modeled content.
4. Validate media URL resolution and responsive image behavior.

### Phase 5: Performance and Caching

1. Use React/Next caching patterns where safe and deterministic.
2. For Next.js 16+ projects using cache components:
   - enable and use cache components intentionally
   - add `use cache`/`cacheLife`/`cacheTag` only where data can be cached safely
3. Keep runtime data (`cookies`, `headers`) out of cached scopes unless using allowed private patterns.

### Phase 6: Validation

Required checks:

- `npm install`
- `npm run build`
- `npm run dev`
- No blocking runtime/API errors in console logs
- Representative routes render CMS-backed content correctly

## Acceptance Criteria

Do not mark complete until all are true:

- [ ] Frontend builds and runs without blocking errors
- [ ] Required routes are implemented and wired to CMS
- [ ] No critical design-content drift on key routes
- [ ] Vercel best-practice checks applied (RSC boundaries, async/data, bundle, media)
- [ ] Performance anti-patterns avoided (waterfalls, oversized client bundles, unnecessary rerenders)

