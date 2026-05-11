---
name: fullstack-builder
description: Orchestrate playwright test planning/generation first, then CMS and frontend build, then execute and iterate failing tests with analytics until all critical flows pass.
argument-hint: "<url> [sitemap-url]"
user-invocable: true
---

# Fullstack Master Builder

Build an end-to-end delivery pipeline with this strict order:

1. Playwright test cases first
2. CMS generation (Strapi)
3. Frontend generation/integration (Next.js)
4. Test execution + analytics
5. Re-iterate failed tests until green

This master skill coordinates these skills/agents:

- `phase-b` (full Playwright test-first contract — crawl, baseline, plan, generate, heal, checkpoint)
- `cms-generator`
- `frontend-builder`

## Arguments

Accept:

- `$ARGUMENTS[0]` = canonical website URL (required)
- `$ARGUMENTS[1]` = sitemap URL (optional but recommended)

If arguments are missing, stop and ask for:
`fullstack-builder <url> [sitemap-url]`

## Contract

You MUST:

1. Create Playwright test plan and test cases before building CMS/frontend.
2. Build CMS second (source of structured content truth).
3. Build frontend third and wire it to CMS APIs.
4. Execute Playwright tests against the integrated app.
5. Produce analytics for pass/fail, flaky patterns, and root-cause categories.
6. Re-iterate failed test cases (heal/fix/re-run) until all required tests pass.
7. Never declare done while required tests are still failing.
8. Enforce exact content parity across source -> CMS -> frontend output.

## Phase 1: Preconditions

1. Verify dependent skills exist and are readable:
   - `.claude/commands/phase-b.md` (Phase B canonical definition)
   - `.claude/skills/testing/playwright/playwright-exploratory/SKILL.md`
   - `.claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md`
   - `.claude/skills/testing/playwright/playwright-official/SKILL.md`
   - `.claude/skills/testing/playwright/playwright-cli/SKILL.md`
   - `.claude/skills/testing/playwright/playwright-pom/SKILL.md`
   - `.claude/skills/cms/cms-generator/SKILL.md`
   - `.claude/skills/frontend/frontend-builder/SKILL.md`
   - `.claude/skills/frontend/vercel/next-best-practices/SKILL.md`
   - `.claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md`
   - `.claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md`
2. Verify browser automation MCP is available before reverse engineering.
3. Validate URL argument(s).
4. Define a project slug from target hostname (or user-provided name).

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

## Phase 3: Build Backend (Strapi)

Follow `cms-generator` instructions with the same argument set.

Expected backend output:

- `/cms` Strapi project
- content types and relations
- sample/demo content
- docs in `/cms/docs`

Required backend checks:

- `npm install` in `/cms`
- `npm run build`
- `npm run develop` starts without fatal errors
- Admin and API endpoints reachable:
  - `http://localhost:1337/admin`
  - `http://localhost:1337/api`

## Phase 4: Build Frontend (Next.js)

Follow `frontend-builder` instructions for page structure and visual rebuild.
Before implementation, apply Vercel skill packs as mandatory quality gates:

1. `next-best-practices` for Next.js architecture/runtime/file conventions.
2. `vercel-react-best-practices` for performance, waterfalls, bundle control, and rerender hygiene.
3. `vercel-composition-patterns` for scalable component API design.
4. `next-cache-components` where Next.js 16 cache components are enabled.

Then enforce integration changes:

1. Replace any mock/local data usage with Strapi API fetches.
2. Add typed API client helper (example: `src/lib/strapi.ts`).
3. Add `.env.local` with:
   - `NEXT_PUBLIC_STRAPI_URL=http://localhost:1337`
4. Update route pages/components to query Strapi endpoints for:
   - list pages
   - detail pages
   - shared/global sections (hero, nav/footer data when modeled)
5. Ensure image URLs and media handling are Strapi-compatible.
6. Ensure frontend UI text/media is rendered from Strapi data and matches extracted source content exactly.

Required frontend checks:

- `npm install`
- `npm run build`
- `npm run dev` starts cleanly
- No unresolved API runtime errors in server/client logs
- No blocking violations against Vercel quality gates:
  - RSC/server-client boundary correctness
  - async/data waterfall prevention
  - bundle and script loading strategy
  - image/font optimization patterns

## Phase 5: API Connection Validation

Perform concrete connectivity tests:

1. Direct API test from terminal:
   - `curl http://localhost:1337/api/<known-content-type>?populate=*`
2. Frontend data rendering test:
   - Load at least one listing page fed by Strapi.
   - Load at least one detail page fed by Strapi.
3. Cross-check:
   - Data created/seeded in Strapi appears in Next.js UI.
4. Handle CORS if needed in Strapi config and re-test.
5. Run content parity checks on representative pages/sections:
   - Source page text/media vs Strapi stored fields
   - Strapi API response vs rendered frontend UI
   - Any mismatch must be corrected before completion

## Phase 5.5: Design References Verification (Mandatory)

Before final completion, verify screenshot artifacts exist:

1. Ensure `docs/design-references/pages/` exists in the frontend project.
2. For EACH discovered route slug, ensure:
   - `docs/design-references/pages/<route-slug>/desktop-full.png`
   - `docs/design-references/pages/<route-slug>/mobile-full.png`
   - `docs/design-references/pages/<route-slug>/manifest.json`
3. Ensure section captures exist:
   - `docs/design-references/pages/<route-slug>/sections/*.png`
4. If any expected screenshot is missing, STOP and re-run capture for that page before marking success.

## Phase 6: Playwright Execution, Analytics, and Re-iteration Loop

Run generated tests only after CMS + frontend are integrated.

Execution loop:

1. Execute test suites (smoke first, then broader regression) from `output/<site>/test` using that folder's `playwright.config.ts` so `test-results/` and reporters stay under `output/<site>/test/`.
2. Collect results:
   - pass count
   - fail count
   - flaky/retry-prone tests
   - failure classes (locator, timing, data mismatch, API error, assertion mismatch)
3. Produce analytics summary per run:
   - pass rate (%)
   - failure breakdown by category
   - top unstable scenarios
4. For failed tests:
   - apply `heal` mode fixes
   - adjust implementation or test robustness as required
   - re-run failed tests, then full required suite
5. Ask to reiterate failed cases and continue loop until perfect:
   - "X tests failed. Reiterate healing and rerun now?"
   - On approval, continue automatically.
6. Stop only when required tests pass with no blocking failures.

## Phase 7: End-to-End Acceptance Criteria

Do not mark complete until all are true:

- [ ] Strapi builds and runs
- [ ] Next.js builds and runs
- [ ] Frontend requests Strapi successfully
- [ ] Source site content matches Strapi content (exact text/media for modeled fields)
- [ ] Frontend UI matches Strapi content exactly (no placeholder/lorem/paraphrased copy)
- [ ] At least one collection and one single-type (or equivalent page model) render in UI
- [ ] Media URLs resolve correctly in frontend
- [ ] Design references generated for every page in `docs/design-references/pages/`
- [ ] No blocking TypeScript/build errors in either app
- [ ] Environment variables documented
- [ ] Start commands documented for both apps
- [ ] Required Playwright suites pass (no blocking failures)
- [ ] Final analytics report is delivered
- [ ] Vercel frontend quality gates applied and validated

## Required Deliverables

At completion, provide:

1. Project paths:
   - CMS path
   - Frontend path
2. Run commands:
   - CMS dev command
   - Frontend dev command
3. URLs:
   - Strapi admin
   - Strapi API base
   - Frontend app URL
4. Integration proof:
   - Endpoint(s) queried
   - Page(s) confirmed to render API data
5. Screenshot proof:
   - total page screenshots
   - total section screenshots
   - missing/failed captures (if any)
6. Test analytics:
   - total tests, passed, failed, skipped
   - pass rate (%)
   - failures by category
   - flaky tests (if detected)
   - iterations required to reach green
7. Any remaining manual steps.

## Notes

- CMS schema is authoritative; frontend should conform to it.
- Prefer reusable components and normalized relations.
- If the frontend skill says backend is out of scope, override that here: backend is mandatory in this master workflow.
- If conflicts arise between child skills, prioritize end-to-end operability (working API-connected website) over pixel-perfect completeness.
- If test and implementation disagree, fix the root cause, not only the assertion surface.
