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

- playwright-test-lifecycle (plan/generate/heal)
- cms-generator
- frontend-builder

## Arguments

Accept:

- $ARGUMENTS[0] = canonical website URL (required)
- $ARGUMENTS[1] = sitemap URL (optional but recommended)

If arguments are missing, stop and ask for:

fullstack-builder <url> [sitemap-url]

## Contract

You MUST:

1. Create Playwright test plan and test cases before building CMS/frontend.
2. Build CMS second (source of structured content truth).
3. Build frontend third and wire it to CMS APIs.
4. Execute Playwright tests against the integrated app.
5. Produce analytics for pass/fail, flaky patterns, and root-cause categories.
6. Re-iterate failed test cases (heal/fix/re-run) until all required tests pass or max healing iterations (3) are reached.
7. Never declare done while required tests are still failing, unless the healing iteration cap has been reached — in that case, report remaining failures and recommended next steps.
8. Enforce semantic content parity across source -> CMS -> frontend output (matching text and media for modeled content fields; whitespace normalization, rich-text sanitization, and image URL rewrites from CMS processing are acceptable).

## Phase 1: Preconditions

1. Verify dependent skills exist and are readable. If any are missing, **stop and report** which prerequisites are unavailable:
   - .claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md
   - .claude/skills/testing/playwright/playwright-official/SKILL.md
   - .claude/skills/cms/cms-generator/SKILL.md
   - .claude/skills/frontend/frontend-builder/SKILL.md (contains name: frontend-builder)
   - .claude/skills/frontend/vercel/next-best-practices/SKILL.md
   - .claude/skills/frontend/vercel/vercel-react-best-practices/SKILL.md
   - .claude/skills/frontend/vercel/vercel-composition-patterns/SKILL.md

2. Verify browser automation MCP is available before reverse engineering.

3. Validate URL argument(s). If the source site is behind an auth wall, CAPTCHA, or anti-bot protection, **stop and report** to the user.

4. Define a project slug from target hostname (or user-provided name).

## Phase 2: Test Planning and Test-Case Generation (Playwright First)

Use playwright-test-lifecycle in this sequence:

1. plan <target-url-or-scope>
   - create canonical test plan covering:
     - happy paths
     - key edge/negative cases
     - navigation and conversion-critical flows

2. generate <test-suite> <test-name> <test-file> <seed-file>
   - generate runnable scenario specs from the plan
   - ensure framework conventions, semantic locators, and structured logging

3. Define minimum required suites to pass before completion:
   - smoke
   - core regression
   - CMS-content rendering validations

   Non-blocking suites (reported but do not gate completion):
   - visual regression
   - optional edge-case flows

Mandatory output for this phase:

- Planned scenarios count
- Generated test files list
- Coverage notes (what is intentionally deferred)
- All Playwright project files, plans, specs, and run artifacts confined to output/<site>/test/ (including test-results/, reports, and traces; never at the monorepo root)

## Phase 3: Build Backend (Strapi)

Follow cms-generator instructions with the same argument set.

Expected backend output:

- /cms Strapi project
- content types and relations
- sample/demo content
- docs in /cms/docs

Required backend checks:

- npm install in /cms
- npm run build
- npm run develop starts without fatal errors
- If default port 1337 is occupied, use an alternative port and update all references accordingly
- Admin and API endpoints reachable:
  - http://localhost:<port>/admin
  - http://localhost:<port>/api

## Phase 4: Build Frontend (Next.js)

Follow frontend-builder instructions for page structure and visual rebuild.
Treat backend generation as mandatory regardless of frontend skill defaults.

Before implementation, apply Vercel skill packs as mandatory quality gates:

1. next-best-practices for Next.js architecture/runtime/file conventions.
2. vercel-react-best-practices for performance, waterfalls, bundle control, and rerender hygiene.
3. vercel-composition-patterns for scalable component API design.
4. next-cache-components where Next.js 16 cache components are enabled.

Then enforce integration changes:

1. Replace any mock/local data usage with Strapi API fetches.
2. Add typed API client helper (example: src/lib/strapi.ts).
3. Add .env.local with:
   - NEXT_PUBLIC_STRAPI_URL=http://localhost:<port>
   (Use the actual CMS port from Phase 3 — never hardcode a port number)
4. Update route pages/components to query Strapi endpoints for:
   - list pages
   - detail pages
   - shared/global sections (hero, nav/footer data when modeled)
5. Ensure image URLs and media handling are Strapi-compatible.
6. Ensure frontend UI text/media is rendered from Strapi data and matches extracted source content (semantic parity for modeled fields).

Required frontend checks:

- npm install
- npm run build
- npm run dev starts cleanly
- No unresolved API runtime errors in server/client logs
- No blocking violations against Vercel quality gates:
  - RSC/server-client boundary correctness
  - async/data waterfall prevention
  - bundle and script loading strategy
  - image/font optimization patterns

## Phase 5: API Connection Validation

Perform concrete connectivity tests:

1. Direct API test from terminal:
   - curl http://localhost:<port>/api/<known-content-type>?populate=*

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

## Phase 6: Design References Verification (Mandatory)

Before final completion, verify screenshot artifacts exist:

1. Ensure docs/design-references/pages/ exists in the frontend project.

2. For each canonical navigable route discovered from sitemap and primary navigation (exclude pagination, query-param variants, auth routes, and dynamically generated pages), ensure:
   - docs/design-references/pages/<route-slug>/desktop-full.png
   - docs/design-references/pages/<route-slug>/mobile-full.png
   - docs/design-references/pages/<route-slug>/manifest.json

3. Ensure section captures exist:
   - docs/design-references/pages/<route-slug>/sections/*.png

4. If any expected screenshot is missing, STOP and re-run capture for that page before marking success.

## Phase 7: Playwright Execution, Analytics, and Re-iteration Loop

Run generated tests only after CMS + frontend are integrated.

Execution loop (max 3 healing iterations):

1. Execute test suites (smoke first, then broader regression) from output/<site>/test using that folder's playwright.config.ts so test-results/ and reporters stay under output/<site>/test/.

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
   - apply heal mode fixes:
     - locator repair (update selectors to match current DOM)
     - timeout tuning (increase waits for slow-loading elements)
     - data correction (fix CMS seed data or API query mismatches)
     - code fix (correct frontend/backend bugs causing assertion failures)
     - test adjustment (fix incorrect test assumptions — never weaken assertions just to pass)
   - adjust implementation or test robustness as required
   - re-run failed tests, then full required suite

5. Re-iterate automatically without user approval. If after 3 healing iterations blocking failures remain, stop the loop and report:
   - which tests are still failing
   - failure categories
   - recommended manual investigation steps

6. Abort immediately (without using remaining iterations) if:
   - CMS or frontend server is unreachable
   - authentication barriers block test execution
   - anti-bot protection prevents page access
   - failures are caused by external dependencies outside project control

7. Stop only when required (blocking) tests pass with no blocking failures, or when the iteration cap / abort condition is reached.

## Phase 8: End-to-End Acceptance Criteria

Do not mark complete until all are true:

- [ ] Strapi builds and runs
- [ ] Next.js builds and runs
- [ ] Frontend requests Strapi successfully
- [ ] Source site content matches Strapi content (semantic parity for modeled fields)
- [ ] Frontend UI matches Strapi content (no placeholder/lorem/paraphrased copy)
- [ ] At least one collection and one single-type (or equivalent page model) render in UI
- [ ] Media URLs resolve correctly in frontend
- [ ] Design references generated for every in-scope page in docs/design-references/pages/
- [ ] No blocking TypeScript/build errors in either app
- [ ] Environment variables documented
- [ ] Start commands documented for both apps
- [ ] Required (blocking) Playwright suites pass — or iteration cap reached with failures reported
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
   - iterations used out of max (e.g., "2/3")
   - unresolved failures and recommended next steps (if any)

7. Any remaining manual steps.

## Notes

- CMS schema is authoritative; frontend should conform to it.
- Prefer reusable components and normalized relations.
- If the frontend skill says backend is out of scope, override that here: backend is mandatory in this master workflow.
- If conflicts arise between child skills, prioritize end-to-end operability (working API-connected website) over pixel-perfect completeness.
- If test and implementation disagree, fix the root cause, not only the assertion surface.