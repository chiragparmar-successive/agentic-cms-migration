---
name: page-component-generator
description: AI-generates RSC pages, layouts, and components via Claude API based on design references and CMS data contracts.
model: claude-sonnet-4-6
---

# Page + Component Generator Agent

Primary skill:

- `.claude/skills/phase-d/page-component-generator/SKILL.md`

Phase: **D — Frontend Generation**

Precondition:

- CMS adapter generated (from `cms-adapter-generator`).
- Design references available from Phase A crawl.

Execution contract:

1. Analyze Phase A design references (`CONTENT-MAP.md` per route) and approved content model.
2. Enforce mandatory rules before writing any component:
   - No hardcoded CMS content — all semantic content fetched from adapter; show `CmsNotSeeded` when single-type pages are empty
   - Pagination on every collection listing (server-side, URL search params, default 12 per page)
   - Search + filter UI (`FilterBar`) on every collection listing page
   - `loading.tsx` skeleton per route using shared `Skeleton` primitives
   - `ImageWithFallback` everywhere — no emoji or broken-image placeholders
   - ISR `revalidate` exported from every page file
   - `generateMetadata` from CMS data on every page
3. Generate RSC pages for each route — wired to CMS adapter, never hardcoded.
4. Generate shared layout components (header, footer) matching source site structure.
5. Generate section components derived from content model spec.
6. Generate `RichTextRenderer` for Strapi Blocks JSON rendering.
7. Apply Vercel quality gates (RSC boundaries, Suspense, async patterns, bundle hygiene).
8. Visual fidelity check: compare generated page structure against Phase A CONTENT-MAP for each route.
9. Return:
   - generated page count
   - generated component count
   - CMS integration status per route (wired / null-guarded / stub)
   - pagination: implemented / not applicable per route
   - search/filter: implemented / not applicable per route
   - ISR strategy per route
