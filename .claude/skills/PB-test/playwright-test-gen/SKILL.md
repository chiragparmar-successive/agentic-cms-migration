---
name: playwright-test-gen
description: Explore a live website and produce a complete, runnable Playwright test suite using the plan → generate → heal lifecycle.
argument-hint: "<url>"
user-invocable: true
---

# Playwright Test Generator

Given a URL, this skill crawls the live site, builds a structured test plan, generates TypeScript test files, executes them, and iterates until all tests are green.

It coordinates:

- `playwright-test-lifecycle` (plan / generate / heal)
- `playwright-cli` (browser exploration)
- `playwright-official` (Playwright baseline conventions)

## Arguments

- `$ARGUMENTS[0]` = target URL (required, e.g. `https://example.com`)
- `--title <string>` = custom PDF report title (optional, defaults to `"Test Execution Report — <site>"`)

If the URL is missing, stop and ask: `playwright-test-gen <url>`

**Input documents are auto-detected** — no flag needed. Drop any BRD, user story, or requirements files into the `input/` folder at the project root before running. The skill reads them automatically. If the folder is empty, it runs in URL-only mode with no change in behaviour.

## Contract

You MUST:

1. Derive a stable `<site>` slug from the target hostname (e.g. `example-com` for `example.com`).
2. Confine **all** output to `output/<site>/test/` — no files at the repo root.
3. Complete phases in order: Preconditions → Plan → Bootstrap → Generate → Execute → Heal → Coverage Audit → PDF Report.
4. Never declare done while any P0 test is failing.
5. Always run the coverage audit after generation — it is mandatory, not optional.
6. Always generate the PDF report as the final step — do not skip it.

---

## Phase 1: Preconditions

1. Verify dependent skills are readable:
   - `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
   - `.claude/skills/PB-test/playwright-official/SKILL.md`
   - `.claude/skills/PB-test/playwright-cli/SKILL.md`
   - `.claude/skills/PB-test/playwright-report/SKILL.md`
2. Verify browser automation is available (MCP Playwright tools or `playwright-cli`).
3. Validate and normalise the URL argument (add `https://` if scheme is missing).
4. Derive `<site>` slug: lowercase hostname, dots and slashes replaced with `-`.
5. Confirm output directory: `output/<site>/test/` (create if absent).
6. **Auto-detect input documents**:
   - Scan the `input/` folder at the project root for any readable files (`.md`, `.txt`, `.csv`, `.html`).
   - If one or more files are found, read and merge their full contents into a single requirements context string. Log: `Found N input file(s): [filenames]`.
   - If the folder is empty or absent, set requirements context to `null` and log: `No input documents found — running in URL-only mode`.
   - Never abort if `input/` is missing or empty — it is always optional.
   - Do not read `.gitkeep`, `README.md`, or binary files from `input/`.

---

## Phase 2: Site Exploration and Test Planning

Follow `playwright-test-lifecycle` in **plan** mode.

Exploration checklist — crawl and document:

- Every top-level nav link and sub-menu item
- All CTAs, buttons, and interactive controls
- Every form (fields, validation rules, submit behaviour)
- Modal / drawer / dropdown triggers
- Auth flows (login, logout, registration, password reset)
- Pagination, filtering, and sorting controls
- Key user journeys end-to-end (e.g. search → detail → conversion)
- Error and empty states

**Scope limits (mandatory):**

- Document at most **15 P0 scenarios** and **20 P1 scenarios** per crawl session.
- Any flow beyond these limits must be a **P2 stub**: route + one-line description only.
- Never expand stubs during this phase; defer to a subsequent plan run.

Plan output (mandatory):

- Save to `output/<site>/test/specs/ui-complete-plan.md`
- Must include all six sections defined in `playwright-test-lifecycle`:
  1. Application Overview
  2. Route Inventory
  3. Interaction Inventory
  4. Scenario Matrix (P0 / P1 / P2)
  5. Detailed Scenarios (with IDs, priorities, steps, assertions, failure signals)
  6. Risks and Known Unknowns
- Minimum required suites before completion: **smoke**, **core regression**

### Requirements Enrichment (auto — uses `input/` context from Phase 1)

If the requirements context from Phase 1 is **not null** (files were found in `input/`):

1. The context is already merged — use it directly.
2. Extract every user story, acceptance criterion, or requirement. Recognise all of these formats:
   - `US-NNN:` or `US NNN` prefixed lines
   - `As a <role> I want to <action>` sentences
   - `- [ ] <requirement>` checklist items
   - `FR-N.N The system shall / must / should <behaviour>` lines
   - Plain paragraphs or bullet lists describing expected behaviour
3. For each extracted requirement, identify the closest matching scenario in the plan by route, keywords, or described flow.
4. Add `**User Story**: <id> — <title>` to that scenario's detail block.
5. Append any acceptance criteria not already in the scenario's **Assertions** list.
6. If a requirement has no matching scenario, create a new P0 (for "must/shall") or P1 (for "should") scenario.
7. Save the traceability index to `output/<site>/test/specs/brd-context.md`:

   ```markdown
   ## US-001: Title of user story

   Mapped: UI-LOGIN-01, UI-LOGIN-02

   ## US-002: Title of user story

   Mapped: UI-HOME-03
   ```

8. Log: `N requirements extracted, M mapped to existing scenarios, K new scenarios created from requirements`.

If requirements context is null (no files in `input/`), skip this entire section silently.

---

## Phase 3: Project Bootstrap

Set up the Playwright project at `output/<site>/test/` if it does not already exist.

Required files:

### `package.json`

```json
{
  "name": "<site>-tests",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "report": "playwright show-report playwright-report",
    "report:pdf": "node scripts/generate-report.mjs",
    "report:pdf:titled": "node scripts/generate-report.mjs --title"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "typescript": "latest",
    "fast-xml-parser": "^4.3.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@fixtures/*": ["fixtures/*"],
      "@utils/*": ["utils/*"],
      "@config/*": ["config/*"],
      "@pages/*": ["pages/*"],
      "@components/*": ["components/*"]
    }
  },
  "include": ["**/*.ts"]
}
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  outputDir: "test-results",
  timeout: 30_000,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "reports/junit.xml" }],
  ],
  use: {
    baseURL: "<target-url>",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

Replace `<target-url>` with the normalised URL from Phase 1.

### Seed test — `tests/seed.spec.ts`

```ts
import { test } from "@playwright/test";

test("seed", async ({ page }) => {
  await page.goto("/");
});
```

### `utils/core.ts` (required — create during bootstrap)

```ts
export const logger = {
  info: (msg: string, ...args: unknown[]): void => {
    console.info(`[INFO] ${msg}`, ...args);
  },
  error: (msg: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${msg}`, ...args);
  },
};
```

This file must exist before any page object or spec is written. Every generated file imports `logger` from `@utils/core`.

### `pages/base.page.ts` (required — create during bootstrap)

```ts
import { Page } from "@playwright/test";
import { logger } from "@utils/core";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    logger.info(`Navigating to ${path}`);
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
```

### `fixtures/pages.fixture.ts` (required — update as pages are added)

Start with a minimal fixture; the generator extends it with each new page object:

```ts
import { test as base } from "@playwright/test";

// Import page objects here as they are created, e.g.:
// import { HomePage } from '@pages/home.page';

type Pages = {
  // homePage: HomePage;
};

export const test = base.extend<Pages>({
  // homePage: async ({ page }, use) => use(new HomePage(page)),
});

export { expect } from "@playwright/test";
```

### `scripts/generate-report.mjs` (required — create during bootstrap)

Copy the full script template verbatim from `.claude/skills/PB-test/playwright-report/SKILL.md`. Do not truncate or paraphrase it — the script must be complete and runnable.

Before editing or reviewing the script, read **`.claude/skills/PB-test/playwright-report/PROMPT.md`** — that is the authoritative prompt for the report (10-section anatomy, narrative tone, deterministic failure-category rules, visual standards, and the quality acceptance checklist). `playwright-report/SKILL.md` carries the canonical script; `PROMPT.md` carries the intent it must satisfy.

### Directory scaffold

Create these directories (add `.gitkeep` if needed):

```
output/<site>/test/
  pages/
  components/
  fixtures/
  utils/
  config/
  scripts/
  tests/
    generated/
  specs/
  reports/
  test-results/
```

Run `npm install` inside `output/<site>/test/` and confirm Playwright and `fast-xml-parser` install cleanly.

---

## Phase 4: Test Generation

For each scenario in the plan (P0 first, then P1, then P2):

Follow `playwright-test-lifecycle` in **generate** mode:

1. Read scenario from `output/<site>/test/specs/ui-complete-plan.md`.
2. Run seed in `--debug=cli` mode and attach browser session.
3. Walk every scenario step interactively via `playwright-cli`.
4. Write the generated test to `output/<site>/test/tests/generated/<scenario-id>.spec.ts`.
5. One test file per scenario ID. One `test()` call per file.
6. Immediately run the generated test after writing it.
7. If it fails, enter heal loop (Phase 5) before moving to the next scenario.

Generation quality gates (all mandatory):

- Scenario ID appears in the describe block title and JSDoc header.
- Assertions map one-to-one to `expect:` bullets in the plan.
- Before writing any locator, inspect DOM via `browser_snapshot` and put it in a page/component getter.
- Check for an existing page object at `pages/<route>.page.ts`; reuse or create before writing the spec.
- Spec files import `test` and `expect` from `@fixtures/pages.fixture` — never from `@playwright/test` directly.
- No `page.locator()` / `page.getByRole()` calls inside spec bodies — delegate to page object methods.
- Structural assertions (counts, visibility, state changes) live as `assertX()` methods on page objects.
- Negative/guard assertions included for validation and auth-blocked flows.
- Every action group and assertion wrapped in `test.step('<description>', async () => { ... })`.
- `logger.info` / `logger.error` used instead of `console.log`.
- Path alias imports only (`@fixtures/`, `@utils/`, `@config/`, `@pages/`, `@components/`).
- Update `fixtures/pages.fixture.ts` whenever a new page or component object is created.
- Follow the full POM structure defined in `.claude/skills/PB-test/playwright-pom/SKILL.md`.

---

## Phase 5: Execution, Analytics, and Heal Loop

### Execution

Run from the site test folder so all output stays contained:

```bash
cd output/<site>/test && npx playwright test
```

Run smoke suite first, then full regression.

### Analytics (produce per run)

| Metric              | Value                                             |
| ------------------- | ------------------------------------------------- |
| Total tests         |                                                   |
| Passed              |                                                   |
| Failed              |                                                   |
| Skipped             |                                                   |
| Pass rate (%)       |                                                   |
| Failure categories  | locator / timing / data / navigation / app-defect |
| Flaky tests         |                                                   |
| Iterations to green |                                                   |

### Heal loop

For each failing test, follow `playwright-test-lifecycle` in **heal** mode:

1. Reproduce the failure (`test_run` on the single file).
2. Debug (`test_debug` / snapshot / console / network).
3. Classify root cause: `locator` · `timing` · `data` · `navigation` · `app-defect`.
4. For `locator` failures: fix the getter in the **page/component object** — do not patch the spec directly.
5. Apply minimal fix — no sleeps, no `networkidle`, no weakened assertions without documentation.
6. Re-run failed test → related group → full suite (shared page objects may affect other specs).
7. Each test gets at most **3 fix attempts with distinct strategies** before being marked `test.fixme()`.
8. `app-defect` root cause → mark `test.fixme()` immediately on first attempt.

Stop only when all P0 and P1 tests pass with no blocking failures.

---

## Phase 6: Coverage Audit

Follow `playwright-test-lifecycle` in **audit** mode.

This phase runs after all generation and healing is complete. It compares the plan against the generated spec files and ensures nothing from the plan was silently skipped.

### Step 1 — Build the plan inventory

Read `output/<site>/test/specs/ui-complete-plan.md` and extract every scenario ID. Use this pattern: lines matching `**ID**: UI-<ROUTE>-<NN>` or `### UI-<ROUTE>-<NN>`.

Produce a list of all planned scenario IDs grouped by priority:

```
P0: UI-HOME-01, UI-HOME-02, UI-LOGIN-01
P1: UI-HOME-03, UI-HOME-04, UI-NAV-01
P2: UI-TNC-01 (stub), UI-HOME-09 (stub)
```

### Step 2 — Build the generated inventory

Scan `output/<site>/test/tests/generated/` for all `.spec.ts` files.

For each file, extract the scenario ID from:

1. The filename (e.g. `ui-home-01.spec.ts` → `UI-HOME-01`)
2. The test title inside the file (e.g. `test('UI-HOME-01: ...'` — use this as the authoritative ID if filename and title differ)

Produce a list of all generated scenario IDs.

### Step 3 — Diff

```
missing  = planned_ids  - generated_ids   (in plan but no spec file)
extra    = generated_ids - planned_ids    (spec exists but no plan entry — unexpected)
covered  = intersection
```

Log a coverage table:

```
Coverage Audit
──────────────────────────────
Planned scenarios  : 15
Generated specs    : 12
Missing            : 3  → UI-NAV-02, UI-CONTACT-02, UI-HOME-07
Extra (unplanned)  : 0
Coverage           : 80%
──────────────────────────────
```

### Step 4 — Generate missing scenarios

For each missing scenario (P0 and P1 only; P2 stubs are intentionally deferred):

1. Find the scenario in `ui-complete-plan.md` — read its full detail block.
2. Check if it was marked as a stub (P2 with no step list) — if so, skip and log `Skipped P2 stub: <id>`.
3. Otherwise, run `playwright-test-lifecycle generate` for that scenario exactly as in Phase 4.
4. Immediately run the generated test and heal if it fails (same 3-attempt cap applies).
5. After each generated missing spec, re-check the inventory (the scenario is no longer missing).

### Step 5 — Re-run the full suite

After all missing scenarios are generated, run the full suite once more:

```bash
cd output/<site>/test && npx playwright test
```

### Step 6 — Final coverage report

Log the final state:

```
Coverage Audit — Final
──────────────────────────────────────────
Planned (P0+P1)    : 14
Generated (P0+P1)  : 14  ✓ fully covered
P2 stubs deferred  : 3
Extra (unplanned)  : 0
──────────────────────────────────────────
Previously missing : UI-NAV-02, UI-CONTACT-02, UI-HOME-07
  → UI-NAV-02     : generated and passing ✓
  → UI-CONTACT-02 : generated, marked test.fixme() — app-defect (contact form 500s)
  → UI-HOME-07    : generated and passing ✓
──────────────────────────────────────────
```

If coverage is less than 100% of P0+P1 after this phase, every gap must have a documented reason (fixme, blocked, out-of-scope). Do not proceed to Phase 7 until this condition is met.

---

## Phase 7: PDF Report Generation

Follow `.claude/skills/PB-test/playwright-report/SKILL.md` for the runnable script and `.claude/skills/PB-test/playwright-report/PROMPT.md` for the authoritative prompt (content, tone, visual rules, acceptance checklist).

Run this phase after every full test execution — both mid-cycle (after heal iterations) and at final delivery.

The output is **not** a basic results dump. It is a client-presenting PDF with: cover + verdict badge, executive KPI cards, donut/stacked-bar/horizontal-bar charts, failure-category breakdown, performance percentiles, suite breakdown, coverage audit gauge, requirements traceability matrix, and a full appendix.

Steps:

1. Confirm `reports/junit.xml` exists and is non-empty. If missing, re-run tests with the JUnit reporter enabled.
2. Run the report generator:
   ```bash
   cd output/<site>/test && npm run report:pdf
   ```
   Or with a custom title (use the `--title` argument if provided by the user):
   ```bash
   cd output/<site>/test && node scripts/generate-report.mjs --title "<custom title>"
   ```
3. Verify the script exits with code 0. If it exits non-zero, read the error output, fix the issue, and re-run.
4. Verify `reports/client-report-<timestamp>.pdf` exists and is > 50 KB.
5. Run the **full** quality checklist from `playwright-report/SKILL.md`:
   - Cover page renders the verdict badge ✓
   - KPI totals reconcile (Total = Passed + Failed + Skipped) ✓
   - Pass rate = passed / (total - skipped), one decimal ✓
   - Every chart legend matches its data colours ✓
   - Failure count in summary equals rows in Failure Analysis table ✓
   - No "undefined" / "null" / "NaN" / "[object Object]" anywhere ✓
   - PDF > 50 KB ✓
   - Page numbers appear on every page after the cover ✓
6. If `specs/brd-context.md` exists, confirm the Requirements Traceability section rendered with at least one row.
7. If `specs/coverage-audit.md` exists, confirm the Coverage Audit gauge + bar chart rendered.
8. Confirm `reports/summary.json` was also written (machine-readable counterpart to the PDF).
9. Report the PDF path to the user: `output/<site>/test/reports/client-report-<timestamp>.pdf`

**Do not mark the run complete until the PDF passes all quality checks.**

---

## Phase 8: Acceptance Criteria

Do not mark complete until all are true:

- [ ] `npm install` succeeded in `output/<site>/test/`
- [ ] Plan saved to `output/<site>/test/specs/ui-complete-plan.md`
- [ ] All P0 scenarios have a generated test file
- [ ] All P1 scenarios have a generated test file (or explicitly deferred with documented reason)
- [ ] Coverage audit ran and produced a final coverage report
- [ ] Every missing P0/P1 scenario was generated or has a documented gap reason
- [ ] Smoke suite passes
- [ ] Core regression suite passes
- [ ] No blocking failures remain without documented reason
- [ ] `reports/junit.xml` exists and is non-empty
- [ ] PDF report generated at `reports/client-report-<timestamp>.pdf`
- [ ] PDF passes all quality checks (size > 50 KB, accurate counts, no placeholder text, all charts render)
- [ ] `reports/summary.json` exists alongside the PDF
- [ ] If `input/` had files: `specs/brd-context.md` exists and traceability section is in the PDF
- [ ] If coverage audit ran: `specs/coverage-audit.md` exists and Coverage section is in the PDF
- [ ] All test artifacts confined to `output/<site>/test/`

---

## Required Deliverables

At completion, provide:

1. **Site slug** and **output path** (`output/<site>/test/`)
2. **Run commands**:
   - `cd output/<site>/test && npx playwright test`
   - `cd output/<site>/test && npm run test:smoke`
   - `cd output/<site>/test && npm run report:pdf`
3. **Plan summary**: scenario counts by priority and type
4. **Coverage audit result**: planned / generated / missing / gaps with reasons
5. **Test file list**: all generated `.spec.ts` paths
6. **Final analytics**: total / passed / failed / skipped / pass rate / iterations
7. **PDF report path**: `output/<site>/test/reports/client-report-<timestamp>.pdf`
8. **Known gaps**: any scenarios deferred or marked `test.fixme()` with reasons
9. **Requirements coverage** (only if `input/` had files): requirements covered / partial / blocked

---

## Notes

- The `input/` folder is at the project root (same level as `output/`). Drop requirements files there before running — the skill reads them automatically.
- Never write `test-results/`, `playwright-report/`, trace blobs, or reporter output outside `output/<site>/test/`.
- If the target site has auth, create a `tests/.auth/` state file via the seed and reuse it in fixtures — never hardcode credentials in test files.
- For multilingual sites, include at least one assertion per locale-critical flow; prefer role/structure locators over language-specific text.
- If a selector is uncertain, always inspect the DOM snapshot first; place the locator in the page object getter with a comment explaining the strategy.
- Fix root causes, not assertion surfaces.
- All generated tests must follow the POM structure defined in `.claude/skills/PB-test/playwright-pom/SKILL.md` — read it before generating any page object or spec file.
