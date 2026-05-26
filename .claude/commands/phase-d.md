---
description: "Phase D — Frontend Generation: Scaffold a Next.js 16 app, generate the CMS adapter, AI-generate RSC pages and components, and validate route parity against the legacy site."
argument-hint: "<site-slug>"
---

## Phase D — Frontend Generation

Run this phase **after Phase C is complete and the Strapi CMS is running with content loaded**.
The generated Next.js app must achieve URL parity with the legacy site and render all CMS content correctly.

### Skills Used (in order)

1. `.claude/skills/phase-d/nextjs-scaffolder/SKILL.md` — scaffold Next.js 16 (TS strict, Tailwind, App Router, RSC)
2. `.claude/skills/phase-d/cms-adapter-generator/SKILL.md` — generate ICMSAdapter interface + StrapiAdapter
3. `.claude/skills/phase-d/page-component-generator/SKILL.md` — AI-generate RSC pages, layouts, components
4. `.claude/skills/phase-d/route-validator/SKILL.md` — verify URL parity between source and generated app
5. `.claude/skills/frontend/vercel/next-best-practices/SKILL.md` — Vercel Next.js best practices
6. `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md` — Vercel React best practices
7. `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md` — Vercel composition patterns

Arguments: $ARGUMENTS

---

## Step 1 — Preconditions

1. Verify all skill files listed above are readable.
2. Validate the site slug argument. If missing, stop and ask: `phase-d <site-slug>`
3. Confirm `output/<site>/docs/content-model/APPROVED.md` exists (content model from Phase A).
4. Confirm Strapi is built and accessible — check that the GraphQL endpoint responds. If Strapi is not running, **stop** — Phase C must be completed first.
5. Confirm `output/<site>/cms/generated/` contains GraphQL TypeScript types from Phase C.
6. Confirm output root: `output/<site>/frontend/` (create if absent).

---

## Step 2 — Next.js Scaffolding

Follow `nextjs-scaffolder` skill:

- Initialise Next.js 16 project in `output/<site>/frontend/`
- TypeScript strict mode, Tailwind CSS, App Router, React Server Components
- Configure environment variables for Strapi API base URL and GraphQL endpoint
- Document `.env.example` with required variables

After scaffolding, verify:

- `npm run build` exits cleanly
- Dev server starts and homepage responds

---

## Step 3 — CMS Adapter

Follow `cms-adapter-generator` skill:

- Generate `ICMSAdapter` interface typed against the approved content model
- Generate `StrapiAdapter` implementation backed by the Strapi GraphQL endpoint
- Wire the adapter into the Next.js app (`lib/cms.ts` or equivalent)
- Verify the adapter fetches live data from the running Strapi instance

---

## Step 4 — Page and Component Generation

Follow `page-component-generator` skill, applying all three Vercel skills as guardrails:

- For each route in the approved content model and legacy route inventory:
  - Generate an RSC page in `app/` using App Router conventions
  - Generate layout components where applicable
  - Wire each page to the CMS adapter — no hardcoded content
  - Apply Vercel best practices (streaming, `loading.tsx`, `error.tsx`, image optimisation)
- Generate shared components (navigation, footer, cards, etc.) as RSC where possible, `"use client"` only when required

After generation:

- Run `npm run build` — must exit cleanly with no TypeScript errors
- Confirm dev server renders each generated page with live CMS data

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

Phase D is a standalone phase. When invoked as `/phase-d`, it completes after route validation and stops.

Phase E is only triggered by:
- The `fullstack-builder` orchestrator (which runs Phases A → B → C → D → E in sequence)
- Explicit user invocation: `/phase-e`

---

## Acceptance Criteria

Do not mark Phase D complete until all are true:

- [ ] Strapi confirmed running before starting
- [ ] Next.js 16 project scaffolded in `output/<site>/frontend/`
- [ ] TypeScript strict mode enabled
- [ ] Tailwind CSS configured
- [ ] App Router with RSC enabled
- [ ] `.env.example` documents all required variables
- [ ] `ICMSAdapter` interface generated
- [ ] `StrapiAdapter` implementation wired and fetching live data
- [ ] RSC pages generated for all content types and routes
- [ ] No hardcoded content — all data flows from CMS adapter
- [ ] `npm run build` succeeds with no blocking TypeScript errors
- [ ] Route parity report written — no missing legacy routes
- [ ] All artifacts confined to `output/<site>/frontend/`
- [ ] Phase D stopped — Phase E was NOT triggered
