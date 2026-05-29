---
description: "Phase D — Frontend Generation: Scaffold a Next.js 15 app on Node 22, generate CMS adapter/API structure, build RSC pages/components with dynamic CMS data, and validate route parity."
argument-hint: "<site-slug>"
---

## Phase D — Frontend Generation

Run this phase **after Phase C is complete and the Strapi CMS is running with content loaded**.
The generated frontend must run on **Next.js 15 + Node.js 22**, achieve URL parity with the legacy site, and render CMS-backed dynamic content (no static primary content).

### Skills Used (in order)

1. `.claude/skills/PD-frontend/nextjs-scaffolder/SKILL.md` — scaffold Next.js 15 on Node 22 (TS strict, Tailwind, App Router, RSC)
2. `.claude/skills/PD-frontend/cms-adapter-generator/SKILL.md` — generate ICMSAdapter interface + StrapiAdapter
3. `.claude/skills/PD-frontend/page-component-generator/SKILL.md` — AI-generate RSC pages, layouts, components
4. `.claude/skills/PD-frontend/route-validator/SKILL.md` — verify URL parity between source and generated app
5. `.claude/skills/PD-frontend/vercel/next-best-practices/SKILL.md` — Vercel Next.js best practices
6. `.claude/skills/PD-frontend/vercel/vercel-react-best-practices/SKILL.md` — Vercel React best practices
7. `.claude/skills/PD-frontend/vercel/vercel-composition-patterns/SKILL.md` — Vercel composition patterns

Arguments: $ARGUMENTS

---

## Step 1 — Preconditions

1. Verify all skill files listed above are readable.
2. Validate the site slug argument. If missing, stop and ask: `PD-frontend <site-slug>`
3. Confirm `output/<site>/docs/content-model/APPROVED.md` exists (content model from Phase A).
4. Confirm Strapi is built and accessible — check that the GraphQL endpoint responds. If Strapi is not running, **stop** — Phase C must be completed first.
5. Confirm `output/<site>/cms/generated/` contains GraphQL TypeScript types from Phase C.
6. Confirm output root: `output/<site>/frontend/` (create if absent).
7. Confirm runtime/tooling constraints for frontend:
   - Node.js 22.x
   - Next.js 15.x (not 16)

---

## Step 2 — Next.js Scaffolding

Follow `nextjs-scaffolder` skill:

- Initialise Next.js 15 project in `output/<site>/frontend/`
- TypeScript strict mode, Tailwind CSS, App Router, React Server Components
- Configure environment files: `.env.local.example` (committed) + `.env.local` (gitignored)
- Store Strapi base URLs, GraphQL URL, API token, and site identity in env
- Store Strapi admin email/password as **commented lines** in `.env.local` for local visibility (never hardcode in components)
- Document keys in `output/<site>/docs/FRONTEND-ENV.md`
- Enforce best-practice CMS folder layout for API calling:
  - `src/lib/cms/client.ts` (HTTP/GraphQL client)
  - `src/lib/cms/adapter.ts` (ICMSAdapter contract)
  - `src/lib/cms/strapi.ts` (Strapi adapter implementation)
  - `src/lib/cms/queries/` (query documents/builders)
  - `src/lib/cms/mappers/` (DTO -> UI mapping)
  - `src/lib/cms/types.ts` (typed models)

After scaffolding, verify:

- `npm run build` exits cleanly
- Dev server starts and homepage responds

---

## Step 3 — CMS Adapter

Follow `cms-adapter-generator` skill:

- Generate `ICMSAdapter` interface typed against the approved content model
- Generate `StrapiAdapter` implementation backed by the Strapi GraphQL endpoint
- Wire the adapter into the Next.js app via `src/lib/cms/index.ts`
- Verify the adapter fetches live data from the running Strapi instance
- Verify no page calls static mock/demo data for primary content

---

## Step 4 — Page and Component Generation

Follow `page-component-generator` skill, applying all three Vercel skills as guardrails:

- For each route in the approved content model and legacy route inventory:
  - Generate an RSC page in `app/` using App Router conventions
  - Generate layout components where applicable
  - Wire each page to the CMS adapter — no hardcoded primary content
  - Apply Vercel best practices (streaming, `loading.tsx`, `error.tsx`, image optimisation)
- Generate shared components (navigation, footer, cards, etc.) as RSC where possible, `"use client"` only when required

After generation:

- Run `npm run build` — must exit cleanly with no TypeScript errors
- Confirm dev server renders each generated page with live CMS data
- Confirm data is dynamic: update one CMS entry and verify frontend reflects the change without code edits

---

## Step 5 — Route Validation

Follow `route-validator` skill:

- Compare all URLs from `output/<site>/docs/research/routes.json` (legacy crawl) against the Next.js app router
- Produce a parity report: matched routes vs. missing routes
- Write report to `output/<site>/frontend/reports/route-parity.md`

**If any legacy routes are missing**, generate the missing pages before proceeding. Do not advance to Phase E with unresolved route gaps.

After validation, report:

- Total legacy routes
- Matched routes
- Missing routes (if any, with remediation plan)
- Extra/new routes (acceptable)

---

## Step 6 — Summary

Present to the user:

- Frontend dev URL
- Strapi admin URL, GraphQL endpoint
- Route parity report summary
- `npm run build` status
- Any remaining TypeScript errors or warnings
- Path to `output/<site>/frontend/`

---

## ⛔ STOP — Phase D ends here

**Do NOT proceed to Phase E.**

Phase D is a standalone phase. When invoked as `/PD-frontend`, it completes after route validation and stops.

Phase E is only triggered by:

- The `url-to-strapi` orchestrator (which runs Phases A → B → C → D → E in sequence)
- Explicit user invocation: `/PE-quality`

---

## Acceptance Criteria

Do not mark Phase D complete until all are true:

- [ ] Strapi confirmed running before starting
- [ ] Next.js 15 project scaffolded in `output/<site>/frontend/`
- [ ] Node.js 22 runtime used
- [ ] TypeScript strict mode enabled
- [ ] Tailwind CSS configured
- [ ] App Router with RSC enabled
- [ ] `.env.local.example` + `.env.local` document all required variables (admin creds commented)
- [ ] `FRONTEND-ENV.md` lists runtime URLs and env keys
- [ ] CMS folder structure implemented under `src/lib/cms/` (client/adapter/strapi/queries/mappers/types)
- [ ] `ICMSAdapter` interface generated
- [ ] `StrapiAdapter` implementation wired and fetching live data
- [ ] RSC pages generated for all content types and routes
- [ ] No static primary content — all page data flows from CMS adapter dynamically
- [ ] Dynamic-data check passed (CMS mutation reflected on frontend)
- [ ] `npm run build` succeeds with no blocking TypeScript errors
- [ ] Route parity report written — no missing legacy routes
- [ ] Initial `VISUAL-PARITY-REPORT.md` drafted (full gate runs in Phase E via `visual-parity-check.mjs`)
- [ ] All artifacts confined to `output/<site>/frontend/`
- [ ] Phase D stopped — Phase E was NOT triggered
