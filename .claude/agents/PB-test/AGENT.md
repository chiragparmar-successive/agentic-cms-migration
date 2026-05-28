---
description: "Phase B — Test-First Contract: Crawl the legacy site, capture visual baseline, generate a full Playwright test suite, establish a green baseline, and gate on human approval before the suite becomes the immutable behavioral contract for migration."
argument-hint: "<legacy-site-url>"
---

## Phase B — Test-First Contract

Run this phase against the **legacy source site** before any migration work begins.
The test suite produced here becomes the immutable behavioral contract that Phases C, D, and E must satisfy.

### Skills Used (in order)

1. `.claude/skills/PB-test/playwright-exploratory/SKILL.md` — full-site crawl + baseline screenshots
2. `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md` — plan → generate → heal lifecycle
3. `.claude/skills/PB-test/playwright-official/SKILL.md` — Playwright project conventions
4. `.claude/skills/PB-test/playwright-cli/SKILL.md` — browser automation via MCP
5. `.claude/skills/PB-test/playwright-pom/SKILL.md` — page object model structure
6. `.claude/skills/PB-test/playwright-report/SKILL.md` — client-presenting PDF report (run after every test execution)

Arguments: $ARGUMENTS

---

## Step 1 — Preconditions

1. Verify all six skill files listed above are readable.
2. Verify browser automation is available (MCP Playwright tools).
3. Validate and normalise the URL argument (add `https://` if scheme is missing). If missing, stop and ask: `PB-test <url>`
4. Derive `<site>` slug: lowercase hostname, dots and slashes replaced with `-`.
5. Confirm output root: `output/<site>/test/` (create if absent).

---

## Step 2 — Exploratory Crawl + Visual Baseline

Follow `playwright-exploratory` in **crawl** mode against the legacy URL.

This produces:

- `output/<site>/test/exploratory/baseline/index.json` — full route manifest
- `output/<site>/test/exploratory/baseline/<slug>/screenshot.png` — full-page screenshot per route
- `output/<site>/test/exploratory/baseline/<slug>/text.txt` — visible text per route
- `output/<site>/test/exploratory/specs/exploratory-crawl.spec.ts` — replayable smoke spec

These screenshots are the **visual baseline** for Phase E regression comparison. Do not skip this step.

After crawl completes, report:

- Total pages discovered and crawled
- Any pages that failed or were skipped
- Path to `index.json`

---

## Step 3 — Test Planning

Follow `playwright-test-lifecycle` in **plan** mode.

Use `output/<site>/test/exploratory/baseline/index.json` as the starting route inventory — do not re-crawl routes already discovered.

Plan must cover:

- All routes from the exploratory crawl
- Content rendering (headings, body copy, media, structured data)
- SEO signals (title, meta description, canonical, OG tags)
- ARIA / accessibility landmarks and roles
- All CTAs, forms, auth flows, navigation, interactive controls
- Key user journeys end-to-end

Follow scope limits from `playwright-test-lifecycle`: max 15 P0, 20 P1 scenarios per session. P2 are stubs.

Save plan to: `output/<site>/test/specs/ui-complete-plan.md`

---

## Step 4 — Project Bootstrap

Set up the Playwright project at `output/<site>/test/` following `playwright-official` conventions.

Required files: `package.json`, `tsconfig.json`, `playwright.config.ts`, `utils/core.ts`, `pages/base.page.ts`, `fixtures/pages.fixture.ts`, and directory scaffold.

Run `npm install` and confirm Playwright installs cleanly.

---

## Step 5 — Test Generation

Follow `playwright-test-lifecycle` in **generate** mode.

For each scenario (P0 first, then P1):

- Read scenario from `output/<site>/test/specs/ui-complete-plan.md`
- Explore via `playwright-cli` (browser MCP tools)
- Write test to `output/<site>/test/tests/generated/<scenario-id>.spec.ts`
- Follow full POM structure from `playwright-pom` — no inline locators in spec bodies
- Run immediately after writing; enter heal loop on failure

---

## Step 6 — Execution + Heal Loop

Follow `playwright-test-lifecycle` in **heal** mode for any failures.

Run smoke suite first, then full regression:

```
cd output/<site>/test && npx playwright test
```

Stop only when all P0 and P1 tests pass with no blocking failures. Produce analytics table:

| Metric              | Value |
| ------------------- | ----- |
| Total tests         |       |
| Passed              |       |
| Failed              |       |
| Skipped             |       |
| Pass rate (%)       |       |
| Iterations to green |       |

**After the test run completes, you must immediately proceed to Step 6.5 to generate the reports. Do not jump to Step 7.**

---

## Step 6.5 — Report Generation

> **You must execute every sub-step below before moving to Step 7. Do not skip this step. Do not proceed to the checkpoint until both the HTML report and the PDF report exist on disk.**

### 6.5.1 — Verify `playwright.config.ts` has all three reporters

Open `output/<site>/test/playwright.config.ts` and confirm the `reporter` array contains exactly these three entries. If any are missing, add them now and **re-run the full test suite** before continuing:

```ts
reporter: [
  ["list"],
  ["html", { outputFolder: "playwright-report", open: "never" }],
  ["junit", { outputFile: "reports/junit.xml" }],
],
```

### 6.5.2 — Verify `reports/junit.xml` exists and is non-empty

```bash
# Must print a non-empty XML file. If this fails, fix the reporter config and re-run tests.
cat output/<site>/test/reports/junit.xml
```

If the file is missing or empty, do not proceed — fix the config and re-run `npx playwright test`.

### 6.5.3 — Verify `scripts/generate-report.mjs` exists at the workspace root

```bash
ls scripts/generate-report.mjs
```

If the file is missing, copy the full script verbatim from `.claude/skills/PB-test/playwright-report/SKILL.md` into `scripts/generate-report.mjs` at the workspace root now.

### 6.5.4 — Ensure root `package.json` has the required dependencies

Confirm `package.json` at the workspace root lists `@playwright/test` and `fast-xml-parser` in `devDependencies`. If either is missing, add it and run `npm install` at the workspace root.

### 6.5.5 — Run the report generator

Execute this command from the workspace root (substitute the actual site slug):

```bash
node scripts/generate-report.mjs --site <site-slug>
```

This command **must exit with code 0**. If it exits non-zero, read the full error output, fix the issue, and re-run. Do not proceed to Step 7 until it succeeds.

### 6.5.6 — Verify both report files exist

After the script exits successfully, confirm both files are present:

```bash
ls output/<site>/test/reports/client-report-*.pdf
ls output/<site>/test/playwright-report/index.html
```

- The PDF must be **> 10 KB**. If it is smaller, the render failed — re-run the script.
- The HTML report at `playwright-report/index.html` is written by `npx playwright test` automatically. If it is missing, the HTML reporter was not active — fix the config and re-run tests.

Only after both files are confirmed on disk may you proceed to Step 7.

---

## Step 7 — CHECKPOINT 2 (Human Approval Gate)

After all P0 and P1 tests are green and reports are generated, **pause** and present:

- Scenario summary (ID / priority / description / status)
- Final pass rate and analytics table
- All generated test file paths
- All baseline screenshot paths from Step 2
- Any scenarios marked `test.fixme()` with reasons
- Path to generated PDF: `output/<site>/test/reports/client-report-<timestamp>.pdf`
- Path to HTML report: `output/<site>/test/playwright-report/index.html`

Then ask:

> "Phase B complete. The test suite is ready to become the immutable behavioral contract for this migration.
> Do you approve? (yes / no / request changes)"

- **yes** → write `CONTRACT.md` and report Phase B done
- **no / request changes** → implement changes, re-run affected tests, re-present for approval

---

## Step 8 — Write CONTRACT.md

On approval, write `output/<site>/test/specs/CONTRACT.md`:

```markdown
# Phase B — Approved Behavioral Contract

- **Site:** <legacy-site-url>
- **Approved:** <date>
- **Pass rate:** <X>%

## Scenario Summary

| ID  | Priority | Description | Status |
| --- | -------- | ----------- | ------ |

## Test Files

- tests/generated/<id>.spec.ts

## Baseline Snapshots

- exploratory/baseline/<slug>/screenshot.png

## Reports

- reports/client-report-<timestamp>.pdf
- playwright-report/index.html

## Known Gaps

- <any fixme'd tests with reason>
```

---

## ⛔ STOP — Phase B ends here

**Do NOT proceed to Phase C, Phase D, or Phase E.**

Phase B is a standalone phase. When invoked as `/PB-test`, it completes at `CONTRACT.md` and stops.

Phase C is only triggered by:

- The `url-to-strapi` orchestrator (which runs Phases A → B → C → D → E in sequence with human checkpoints)
- Explicit user invocation: `/PC-cms` or `url-to-strapi`

If you are running inside `url-to-strapi`, it will direct you to Phase C after CHECKPOINT 2. Otherwise, report Phase B complete and wait for the user's next instruction.

---

## Acceptance Criteria

Do not mark Phase B complete until all are true:

- [ ] Exploratory crawl completed — `index.json` written
- [ ] Baseline screenshots captured for all crawled routes
- [ ] Plan saved to `output/<site>/test/specs/ui-complete-plan.md`
- [ ] All P0 scenarios have a generated test file
- [ ] All P1 scenarios have a generated test file (or deferred with reason)
- [ ] Smoke suite passes
- [ ] Core regression suite passes
- [ ] `playwright-report/index.html` exists (HTML report)
- [ ] `reports/junit.xml` exists and is non-empty
- [ ] `reports/client-report-<timestamp>.pdf` exists and is > 10 KB (PDF report)
- [ ] Human has approved at Checkpoint 2
- [ ] `CONTRACT.md` written with PDF and HTML report paths included
- [ ] All artifacts confined to `output/<site>/test/`
- [ ] Phase B stopped — Phase C was NOT triggered
