---
name: fullstack-builder
description: Master orchestrator for the AI-Powered CMS Transformation Platform. Coordinates Phases A–E in strict order with human checkpoints, driving the full pipeline from legacy site to deployed Next.js 16 + Strapi 5 stack.
argument-hint: "<url> [sitemap-url]"
user-invocable: true
---

# Fullstack Master Builder

Orchestrate the end-to-end CMS transformation pipeline:

```
SOURCE INPUT → PHASE A → CHECKPOINT 1 → PHASE B → CHECKPOINT 2 → PHASE C → PHASE D → PHASE E → CHECKPOINT 3 → CHECKPOINT 4 → TARGET STACK
```

## Arguments

- `$ARGUMENTS[0]` = Canonical website URL (required)
- `$ARGUMENTS[1]` = Sitemap URL (optional but recommended)

If arguments are missing, stop and ask:
`fullstack-builder <url> [sitemap-url]`

## Contract

You MUST:

1. Execute phases in strict order: A → B → C → D → E.
2. Pause at every human checkpoint and wait for explicit approval.
3. Never skip a phase or checkpoint.
4. Never weaken test assertions to make the new stack pass.
5. Enforce semantic content parity between source → CMS → frontend.
6. Track and report status at every phase transition.

## Pre-Flight

1. Verify dependent skills exist and are readable:
   - Phase A: `.claude/skills/phase-a/site-crawler/SKILL.md`
   - Phase A: `.claude/skills/phase-a/wp-source-adapter/SKILL.md`
   - Phase A: `.claude/skills/phase-a/content-model-inferencer/SKILL.md`
   - Phase B command: `.claude/commands/phase-b.md`
   - Phase B: `.claude/skills/testing/playwright/playwright-exploratory/SKILL.md`
   - Phase B: `.claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md`
   - Phase B: `.claude/skills/testing/playwright/playwright-official/SKILL.md`
   - Phase B: `.claude/skills/testing/playwright/playwright-cli/SKILL.md`
   - Phase B: `.claude/skills/testing/playwright/playwright-pom/SKILL.md`
   - Phase C: `.claude/skills/phase-c/strapi-schema-generator/SKILL.md`
   - Phase C: `.claude/skills/phase-c/strapi-bootstrapper/SKILL.md`
   - Phase C: `.claude/skills/phase-c/content-etl-pipeline/SKILL.md`
   - Phase C: `.claude/skills/phase-c/graphql-layer-validator/SKILL.md`
   - Phase D: `.claude/skills/phase-d/nextjs-scaffolder/SKILL.md`
   - Phase D: `.claude/skills/phase-d/cms-adapter-generator/SKILL.md`
   - Phase D: `.claude/skills/phase-d/page-component-generator/SKILL.md`
   - Phase D: `.claude/skills/phase-d/route-validator/SKILL.md`
   - Phase E: `.claude/skills/phase-e/playwright-behavioral-parity/SKILL.md`
   - Phase E: `.claude/skills/phase-e/sonarqube-gate/SKILL.md`
   - Phase E: `.claude/skills/phase-e/lighthouse-ci-gate/SKILL.md`
   - Phase E: `.claude/skills/phase-e/ai-remediation-agent/SKILL.md`
   - Vercel: `.claude/skills/frontend/vercel/next-best-practices/SKILL.md`
   - Vercel: `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md`
   - Vercel: `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md`
     If any are missing, **stop and report** which prerequisites are unavailable.

2. Verify browser automation MCP is available.

3. Validate URL argument(s). If the source site is behind auth wall, CAPTCHA, or anti-bot protection, **stop and report**.

4. Define project slug from target hostname (or user-provided name).

---

## Phase A — Reverse Engineering

### A.1: Site Crawling

Use `site-crawler` skill:

- Crawl all pages from URL/sitemap
- Extract DOM, routes, media, sitemaps
- Produce site inventory in `output/<site>/docs/research/`

### A.2: WordPress Adapter (optional)

Use `wp-source-adapter` skill — only if WordPress detected:

- Extract content via WP-JSON REST API
- Map WP data structures to content model candidates

### A.3: Content Model Inference

Use `content-model-inferencer` skill:

- Analyse crawled data and produce Content Model Spec
- Generate `output/<site>/docs/content-model/SCHEMA-DESIGN.md`

### ✋ CHECKPOINT 1 — Human Approves Content Model Spec

Present to human:

- Content Model Spec summary (types, fields, relationships)
- Coverage assessment
- **Wait for explicit approval before proceeding.**

---

## Phase 2: Test-First Contract (Phase B)

**Execute Phase B in full — identical to running `/phase-b <url>` standalone.**

Read and follow `.claude/commands/phase-b.md` exactly. Do not shortcut or skip any step.

Phase B uses all five Playwright skills in order:

1. `playwright-exploratory` — full-site crawl + full-page baseline screenshots
2. `playwright-test-lifecycle` — plan → generate → heal lifecycle
3. `playwright-official` — Playwright project conventions
4. `playwright-cli` — browser automation via MCP
5. `playwright-pom` — page object model for all generated specs

Phase B steps that MUST complete before moving to Phase 3:

- Exploratory crawl complete — `output/<site>/test/exploratory/baseline/index.json` written
- Baseline screenshots captured for all crawled routes
- Test plan saved to `output/<site>/test/specs/ui-complete-plan.md`
- All P0 and P1 scenarios have generated test files
- Smoke and core regression suites pass against the legacy site
- **CHECKPOINT 2 gate passed** — human has approved the test suite
- `output/<site>/test/specs/CONTRACT.md` written

Do not proceed to Phase 3 until `CONTRACT.md` exists and Checkpoint 2 is approved.

All Playwright artifacts confined to `output/<site>/test/` — never at the repo root.

### ✋ CHECKPOINT 2 — Human Approves Test Suite

Follow Step 7 of `.claude/commands/phase-b.md`. Present to human:

- Scenario summary (ID / priority / status) and final pass-rate analytics
- Paths to generated tests and exploratory baseline screenshots
- Any `test.fixme()` gaps with reasons
- **Write `CONTRACT.md` only after explicit approval** (Step 8 of `phase-b.md`)
- **After approval, the test suite becomes an immutable behavioral contract.**
- **Wait for explicit approval before proceeding.**

---

## Phase C — CMS Provisioning

### C.1: Schema Generation

Use `strapi-schema-generator` skill:

- Generate Strapi 5 JSON schemas from approved Content Model Spec

### C.2: Strapi Bootstrap

Use `strapi-bootstrapper` skill:

- Initialise Strapi 5 project in `output/<site>/cms/`
- Apply schemas, enable GraphQL, configure roles & permissions
- Verify build and dev server

### C.3: Content ETL

Use `content-etl-pipeline` skill:

- Extract content from source
- Transform to match Strapi schemas
- Load into CMS with media optimisation (WebP/AVIF)
- Verify content parity

### C.4: GraphQL Validation

Use `graphql-layer-validator` skill:

- Introspect GraphQL schema
- Run graphql-codegen for TypeScript types
- Verify type coverage

---

## Phase D — Frontend Generation

### D.1: Next.js Scaffolding

Use `nextjs-scaffolder` skill:

- Initialise Next.js 16 project (TS strict, Tailwind, App Router, RSC)
- Set up environment variables for CMS

### D.2: CMS Adapter

Use `cms-adapter-generator` skill:

- Generate ICMSAdapter interface + StrapiAdapter implementation
- Wire into Next.js app

### D.3: Page + Component Generation

Use `page-component-generator` skill:

- Generate RSC pages, layouts, components via Claude API
- Wire to CMS adapter
- Apply Vercel best practices

### D.4: Route Validation

Use `route-validator` skill:

- Confirm URL parity between source and target
- Block Phase E if missing routes exist

---

## Phase E — Quality Loop (Self-Healing)

### E.1: Playwright Behavioral Parity

Use `playwright-behavioral-parity` skill:

- Run approved test suite against new stack
- Compare with legacy baseline
- Report regressions

### E.2: SonarQube Code Quality Gate

Use `sonarqube-gate` skill:

- Analyse code quality
- Enforce quality thresholds

### E.3: Lighthouse CI Performance Gate

Use `lighthouse-ci-gate` skill:

- Analyse performance, accessibility, best practices, SEO
- Enforce score thresholds

### ✋ CHECKPOINT 3 — All Gates Pass?

If **ALL gates pass** → proceed to CHECKPOINT 4.

If **ANY gate fails** → trigger AI Remediation:

### E.4: AI Remediation (max 5 iterations)

Use `ai-remediation-agent` skill:

- Analyse failures, generate patches, apply fixes
- Re-run all quality gates
- Iterate up to 5 times
- If still failing after 5 iterations → escalate to human

### ✋ CHECKPOINT 4 — Pre-Deployment Sign-Off

Present to human:

- All quality gate results
- Content parity status
- Visual parity screenshots
- Route coverage
- Remediation summary (if iterations were used)
- **Wait for explicit approval to deploy.**

---

## End-to-End Acceptance Criteria

Do not mark complete until ALL are true:

- [ ] Phase A: Content Model Spec approved (CHECKPOINT 1)
- [ ] Phase B: `CONTRACT.md` present, test suite approved (CHECKPOINT 2), green smoke/core regression on legacy site
- [ ] Phase C: Strapi builds, runs, content loaded, GraphQL validated
- [ ] Phase D: Next.js builds, runs, all routes covered, CMS wired
- [ ] Phase E: All quality gates pass (or max iterations with human acceptance)
- [ ] CHECKPOINT 4: Pre-deployment sign-off received
- [ ] Source site content matches CMS content (semantic parity)
- [ ] Frontend UI renders CMS content correctly
- [ ] No blocking TypeScript/build errors in either app
- [ ] Environment variables documented
- [ ] Start commands documented for both apps

## Required Deliverables

At completion, provide:

1. **Project paths:** CMS path, Frontend path
2. **Run commands:** CMS dev command, Frontend dev command
3. **URLs:** Strapi admin, Strapi API base, GraphQL endpoint, Frontend app URL
4. **Integration proof:** Endpoints queried, pages confirmed rendering API data
5. **Test analytics:**
   - Total tests, passed, failed, skipped
   - Pass rate (%)
   - Failures by category
   - Remediation iterations used out of max (e.g., "2/5")
   - Unresolved failures and recommended next steps (if any)
6. **Quality gate results:** SonarQube metrics, Lighthouse scores per route
7. **Any remaining manual steps**

## Notes

- CMS schema is authoritative; frontend conforms to it.
- Phase ordering is strict — never skip or reorder.
- Human checkpoints are non-negotiable — never bypass.
- Test suite is immutable after CHECKPOINT 2 — fix implementation, not tests.
- AI Remediation has a hard cap of 5 iterations — escalate after that.
- If conflicts arise between child skills, prioritise end-to-end operability.
