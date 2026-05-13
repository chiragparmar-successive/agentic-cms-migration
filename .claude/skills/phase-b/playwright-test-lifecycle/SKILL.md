---
name: playwright-test-lifecycle
description: Unified Playwright testing skill for planning scenarios, generating framework-compliant TypeScript tests, and healing failing tests with systematic debugging.
argument-hint: "<mode> [mode-specific-arguments]"
disable-model-invocation: true
user-invocable: true
---

# Playwright Test Lifecycle Skill

Use this as a single skill for the full Playwright workflow in the Playwright Enterprise Framework:

- `plan`: discover flows and produce a structured test plan
- `generate`: execute a scenario and write a test file
- `heal`: debug and fix failing Playwright tests

## Project Layout (Mandatory)

Create and use a test project at:

- `output/<site>/test` (use this path relative to the workspace root; do not scatter test files at repo root)

Where `<site>` is a stable slug from the target hostname (e.g. `tabipass-jp` for `tabipass.jp`).

**Isolation rule:** Every file produced by planning, generation, execution, healing, or reporting for that site must live under `output/<site>/test/`. Nothing test-related may be written to the workspace root (no root-level `test-results/`, `playwright-report/`, or ad-hoc spec dumps).

Required artifact structure:

```text
output/<site>/
  cms/
  frontend/
  test/
    playwright.config.ts
    package.json
    tsconfig.json
    specs/
      ui-complete-plan.md
    tests/
      seed.spec.ts
      generated/
        <scenario>.spec.ts
    screenshots/
      baseline/              # captured during plan phase — one PNG per route/state
        <route-slug>.png
        <route-slug>-<state>.png
    test-results/
      ...                    # Playwright outputDir: failures, attachments, traces
    playwright-report/       # optional HTML reporter outputFolder
    reports/                 # optional junit/json summaries
    traces/                  # optional if you pin trace export path explicitly
    .auth/                   # optional storageState files (gitignore)
    fixtures/
    config/
```

All planner output goes in `specs/`.
All generated tests go in `tests/generated/`.
All healing updates patch files in `tests/generated/`.
All Playwright run output (`test-results`, HTML report, junit, blob report) stays under this same `test/` directory.

### Playwright config (mandatory)

The `playwright.config.ts` inside `output/<site>/test/` must keep outputs inside that folder (paths relative to the config file):

- Set `outputDir: 'test-results'` so failures, screenshots, and trace zips land in `output/<site>/test/test-results/`.
- Configure reporters so artifacts do not escape the tree, for example:
  - HTML: `['html', { outputFolder: 'playwright-report', open: 'never' }]`
  - JUnit: `['junit', { outputFile: 'reports/junit.xml' }]` (ensure `reports/` exists or is created).
- Set `testDir: 'tests'` (or explicitly include `tests/generated` only if you split; default should still resolve under `test/`).

### How to run tests (mandatory)

Always run Playwright with the config in the site test project so outputs resolve correctly:

- Preferred: `cd output/<site>/test && npx playwright test`
- Or: `npx playwright test -c output/<site>/test/playwright.config.ts` from repo root

Never run `npx playwright test` from the repo root using a root-level config that writes `test-results/` at the monorepo root for site-specific suites.

## Playwright Agent Workflow Alignment

Follow the Playwright planner -> generator -> healer chain:

1. Planner explores and creates markdown plan.
2. Generator converts plan into executable Playwright tests.
3. Healer executes and repairs failing tests in a loop.

Use this flow exactly as documented in Playwright Test Agents guidance.

## Professional Quality Profile (Mandatory)

Use a professional testing standard:

- exhaustive but prioritized coverage
- zero placeholder assumptions
- verifiable selectors only
- explicit preconditions, test data, and assertions
- bilingual-safe assertions for multilingual websites

Never write vague plans like "verify section is visible" without:

- where it is on the page
- how it is reached
- what exact element confirms success
- what fallback locator/assertion is used

## Mode Selection

Choose exactly one mode per run:

- `plan` when no reliable scenario plan exists yet
- `generate` when a scenario is already defined and needs a spec file
- `heal` when a test is failing or flaky
- `audit` after all generation is done — compares plan vs generated specs and fills gaps

Do not run `generate` before scenario requirements are clear.
Do not run `heal` before reproducing the failure.
Do not run `audit` before at least one generation pass has completed.

## Required Conventions

All generated code must follow these rules. The canonical structure is defined in `.claude/skills/phase-b/playwright-pom/SKILL.md` — read it before generating any test or page object.

1. **Imports** use path aliases only.
   - Spec files: import `test` and `expect` from `@fixtures/pages.fixture` — never directly from `@playwright/test`.
   - Page/component files: import `Page`, `Locator`, `expect` from `@playwright/test`; import `logger` from `@utils/core`.
   - Do not use relative imports anywhere.
2. **Page Object Model (mandatory)**
   - Every spec imports page objects via `@fixtures/pages.fixture` fixture injection.
   - Never call `page.locator()`, `page.getByRole()`, etc. directly inside a `test()` body.
   - Locators live in page/component objects as `get` getters.
   - Actions live as `async` methods on page/component objects.
   - Assertions live as `assertX()` methods on page/component objects.
   - See `playwright-pom/SKILL.md` for full structure and naming rules.
3. **Functions** use named arrow exports only.
   - No default exports.
   - No function declarations for exported helpers.
4. **Naming**
   - Spec files: `<scenario-id>.spec.ts` (kebab-case)
   - Page files: `<route-name>.page.ts`
   - Component files: `<component-name>.component.ts`
   - Classes/types: `PascalCase`
   - Variables/functions: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
5. **Logging**
   - Use `logger.info(...)` and `logger.error(...)`.
   - Never use `console.log(...)`.
6. **Test shape**
   - Wrap tests in `test.describe("<suite> <tags>", () => {})`.
   - Keep one scenario per file.
7. **Documentation**
   - Add JSDoc at the top of every spec, page, and component file (scenario ID, priority, route).
   - Add step descriptions in every `test.step()` call.
8. **Async and reliability**
   - Always await async operations.
   - Do not use deprecated patterns.
9. **Error handling**
   - Log and rethrow errors; do not swallow failures.
10. **No guessed selectors**
    - Do not write any locator without first inspecting the DOM via `browser_snapshot`.
    - Document the chosen locator strategy in a comment on the getter if CSS was required.
11. **Localization-safe testing**
    - For multilingual UI, assert using stable role/structure first, then language-specific text.
    - For Japanese/English variants, include at least one assertion per locale-critical flow.
12. **Test steps**
    - Wrap every action group and assertion inside `test.step('<description>', async () => { ... })`.
    - Step descriptions must be human-readable and match the plan step or page method name.
    - One `test.step` per logical action group — do not wrap trivial single-line awaits unless they are assertions.

## Modes

### Mode: plan

Purpose: create comprehensive scenario plans for UI/API/BDD/visual/accessibility/performance coverage.

**Scope limits (mandatory):**

- Document at most **15 P0 scenarios** and **20 P1 scenarios** per crawl session.
- Any flow beyond these limits must be captured as a **P2 stub**: route + one-line description only — no full step list.
- Never expand a stub into a full scenario during planning; defer to a subsequent plan run.
- This prevents context overflow and keeps the plan auditable.

Workflow:

1. Run `planner_setup_page` once before other planner browser steps.
2. Crawl the website UI comprehensively:
   - every nav item
   - every visible button
   - every link
   - every form input/select/checkbox/radio
   - modal/drawer/dropdown triggers
   - pagination/filter/sort controls
   - auth/account/cart/checkout flows if present
3. **Capture baseline screenshots (mandatory):** After navigating to each distinct route or triggering each significant UI state (open modal, filled form, error state), call `browser_take_screenshot` and save the result to `output/<site>/test/screenshots/baseline/<route-slug>.png` (or `<route-slug>-<state>.png` for states). Use kebab-case slugs derived from the path (e.g. `/guest-pay` → `guest-pay.png`, modal open → `home-modal-open.png`). Create the `screenshots/baseline/` directory before saving the first file.
4. Build a page-by-page interaction inventory and convert each flow into scenarios.
5. Include happy, edge, negative, validation, and cross-page journey scenarios.
6. Include explicit expected outcomes and data prerequisites per scenario.
7. Reference the captured baseline screenshot path in each scenario's **Assertions** section so generators can wire `toHaveScreenshot()` to the correct file.
8. Save the complete markdown plan to:
   - `output/<site>/test/specs/ui-complete-plan.md`
     via `planner_save_plan`.

### Optional: Requirements Enrichment (auto — reads from `input/` context)

If requirements context was passed from the orchestrator (content read from `input/` files):

1. Read the requirements file. Accept Markdown, plain text, Word-exported text — any format.
2. Extract every user story, acceptance criterion, or named requirement. Recognise these patterns:
   - `US-NNN:` or `US NNN` prefixed lines
   - `As a <role> I want to <action>` sentences
   - `- [ ] <requirement>` checklist items
   - `The system shall / must / should <behaviour>` lines
   - Section headings followed by bullet lists of criteria
3. For each extracted requirement:
   - Find the most relevant scenario in the plan (by route, keywords, or flow).
   - Add `**User Story**: <id> — <title>` to the scenario's detail block.
   - Append any acceptance criteria not already covered to the scenario's **Assertions** list.
4. If a user story has no matching UI scenario, add a new scenario at the appropriate priority (P0 for "must/shall", P1 for "should").
5. After the plan is saved, write `output/<site>/test/specs/brd-context.md`:
   ```markdown
   ## <US-ID>: <Title>

   Mapped: <comma-separated scenario IDs>
   ```
   One `##` block per user story. This file feeds the PDF traceability matrix.
6. Log summary: `N requirements extracted, M mapped, K new scenarios added`.

If requirements context is null (no files in `input/`), skip this section entirely — do not mention it in the output.

Plan must include these sections in order:

1. Application Overview
2. Route Inventory
3. Interaction Inventory (click/hover/input/submit/modal/tab/filter)
4. Scenario Matrix (P0/P1/P2 priority)
5. Detailed Scenarios
6. Risks and Known Unknowns
7. Requirement Coverage (only if `--brd` was provided — one row per user story with mapped scenario IDs)

Detailed scenario format (mandatory):

- **ID**: `UI-<route>-<number>`
- **Priority**: `P0|P1|P2`
- **Type**: `smoke|regression|negative|localization|accessibility`
- **Route**: exact URL/path
- **Preconditions**
- **Test Data**
- **Steps** (numbered, unambiguous)
- **Assertions** (numbered; exact expected outcomes)
- **Failure Signals** (what qualifies as fail)

### Mode: generate

Purpose: generate one scenario test file from plan steps.

Workflow:

1. Review the scenario requirements from the saved plan at `output/<site>/test/specs/ui-complete-plan.md` and the conventions in this SKILL.md.
2. Run `generator_setup_page` for scenario initialization.
3. Execute each scenario step and verification via browser tools.
4. Read execution logs using `generator_read_log`.
5. Immediately call `generator_write_test` with framework-compliant code.
6. Write generated test files into:
   - `output/<site>/test/tests/generated/`
7. Immediately run the generated test(s).
8. If any generated test fails, switch to `heal` loop automatically:
   - diagnose
   - patch
   - rerun failed tests
   - rerun required suite
9. Complete `generate` only when tests pass or a blocker is explicitly documented.

Generation quality gates (mandatory):

1. One test file per scenario ID from plan.
2. Scenario ID appears in test title, JSDoc header, and describe block.
3. Assertions must map to scenario assertions one-to-one.
4. Before writing any locator, inspect DOM via `browser_snapshot` and place it in a page/component getter — never inline in the spec.
5. Check if a page object already exists for the target route (`output/<site>/test/pages/<route>.page.ts`); reuse it, or create it before writing the spec.
6. Update `fixtures/pages.fixture.ts` when a new page or component is created.
7. For content-heavy pages, include structural assertions (counts, visibility, state changes) in page object assertion methods.
8. Include negative and guard assertions as `assertX()` methods on the page object.
9. Avoid comments like "assuming ..." in final tests.
10. Do not stop after file generation; execution is mandatory.
11. If execution fails, healing iteration is mandatory.
12. Every action group and assertion must be wrapped in `test.step('<description>', async () => { ... })`.

### Mode: heal

Purpose: diagnose and remediate failing tests with reproducible fixes.

**Iteration cap (mandatory):**

- Each test gets at most **3 targeted fix attempts** with distinct strategies.
- After 3 attempts still failing:
  1. Mark the test `test.fixme('reason: <root-cause>. Blocked by: <blocker>')`.
  2. Log the failure summary (attempt count, strategies tried, last error).
  3. Move on — do not loop indefinitely.
- Exception: if root cause is `app-defect` (the application itself is broken), mark `test.fixme()` immediately on the first attempt and surface it to the user without consuming iterations.

Workflow:

1. Run failing tests (`test_run`) and identify failures.
2. Debug each failure (`test_debug`) and inspect traces/snapshots/logs/network data.
3. Determine root cause (selector drift, timing, assertions, data/env, config).
4. Apply targeted fixes while preserving framework conventions.
5. Re-run and iterate (up to 3 attempts per test); mark `test.fixme()` if still failing after limit.
6. Keep reruns focused on failing specs first, then run full suite.

Healing quality gates:

- classify failures before patching: `locator`, `timing`, `data`, `navigation`, `app-defect`
- for `locator` failures: fix the getter in the **page/component object**, not the spec file
- patch smallest safe surface first
- rerun: failed test -> related group -> full required suite
- append concise fix note per patched method/getter
- never exceed 3 fix attempts per test before marking `test.fixme()`
- after fixing a shared page object, run the full suite to catch regressions in other specs that use it

### Mode: audit

Purpose: compare the plan against generated spec files, identify any missing scenarios, and generate them.

This mode is the quality gate between test generation and PDF reporting. It ensures the plan is fully reflected in the test suite.

Workflow:

1. **Read the plan** — parse `output/<site>/test/specs/ui-complete-plan.md` and extract all scenario IDs using the pattern `**ID**: UI-<ROUTE>-<NN>`. Collect priority for each ID.

2. **Read generated specs** — scan `output/<site>/test/tests/generated/*.spec.ts`. For each file:
   - Extract the scenario ID from the filename (normalise to `UI-ROUTE-NN` uppercase)
   - Confirm the ID appears in the test title inside the file (use this as the authoritative source if they differ)
   - Mark the scenario as `generated`

3. **Compute coverage diff**:

   ```
   missing = { id | id in planned_P0_P1 AND id not in generated }
   extra   = { id | id in generated AND id not in planned }
   ```

   P2 stubs with no step list are excluded from `missing` — they are intentionally deferred.

4. **Log coverage table** (always, even if coverage is 100%):

   ```
   Planned P0  : N  |  Generated P0  : N  |  Missing P0  : N
   Planned P1  : N  |  Generated P1  : N  |  Missing P1  : N
   P2 stubs    : N  (deferred — not generated)
   Coverage    : NN%
   ```

5. **Generate missing scenarios** — for each missing P0/P1 scenario:
   - Locate its full detail block in the plan.
   - Run `generate` mode for that scenario (same quality gates apply).
   - Immediately run the generated test and heal if needed (3-attempt cap).
   - Update the coverage table entry to `generated ✓` or `fixme (reason)`.

6. **Re-run full suite** after all missing specs are generated.

7. **Final report** — produce a markdown summary block:
   ```
   Coverage Audit — Final
   ──────────────────────────────────────────
   Planned (P0+P1)       : N
   Generated (P0+P1)     : N    [NN%]
   Previously missing    : N → [list of IDs]
     Now generated       : N
     Marked fixme        : N  (reasons listed below)
   P2 stubs deferred     : N
   Extra (unplanned)     : N
   ──────────────────────────────────────────
   Gaps with reasons:
   - UI-NAV-02  : test.fixme — app-defect, contact endpoint returns 500
   - UI-HOME-07 : test.fixme — auth required, credentials not available in CI
   ──────────────────────────────────────────
   ```

Audit quality gates:

- Every P0 and P1 scenario must be generated or have a documented gap reason
- Extra specs (in `generated/` but not in the plan) must be flagged to the user — they may be duplicates or orphans
- Do not modify the plan during audit — only read it
- Do not rewrite existing passing specs during audit — only create new ones for missing IDs

## Output Contract

### For `plan`

- Output is a saved markdown test plan for downstream generation.
- Includes scenario title, tags, type, numbered steps, expected outcomes, and data needs.
- Scenarios are isolated and runnable in any order.
- Plan file path is `output/<site>/test/specs/ui-complete-plan.md`.
- Must include scenario IDs, priorities, and explicit assertion lists.
- Must include baseline screenshots saved to `output/<site>/test/screenshots/baseline/` — one PNG per route and per significant UI state visited during crawling.
- Each scenario's Assertions section must reference the corresponding baseline screenshot path when a visual assertion is applicable.

### For `generate`

The generated file must:

- contain exactly one test case
- use an fs-safe kebab-case filename
- place the test in a describe block matching the top-level test-plan suite
- use a test title matching the scenario name
- include JSDoc comments and step comments
- use path alias imports only
- include structured logger lifecycle events
- apply semantic locators and TypeScript typing
- incorporate best-practice hints from generator logs
- live under `output/<site>/test/tests/generated/`
- include deterministic assertions and no speculative placeholder logic
- include run result summary (passed/failed) for generated scenarios
- include healing changes when failures were auto-fixed

### For `heal`

- Preserve path aliases and logger usage.
- Replace brittle selectors with semantic or resilient alternatives.
- Keep fixes minimal, robust, and typed.
- Revalidate after each fix.
- Patch test files in `output/<site>/test/tests/generated/`.

### For `audit`

- Output is a coverage summary markdown block (logged to console and saved to `output/<site>/test/specs/coverage-audit.md`).
- Lists planned count, generated count, missing IDs, and gap reasons.
- Every missing P0/P1 scenario is either generated or has a documented reason.
- Does not modify the plan or any existing passing spec.
- New specs created during audit follow identical conventions to Phase 4 generation.

## Tooling

Use the Playwright test MCP toolset across planning, generation, and healing:

- browser actions (`browser_click`, `browser_type`, `browser_navigate`, etc.)
- browser diagnostics (`browser_console_messages`, `browser_network_requests`, `browser_snapshot`, `browser_evaluate`)
- locator support (`browser_generate_locator`)
- planner lifecycle (`planner_setup_page`, `planner_save_plan`)
- generator lifecycle (`generator_setup_page`, `generator_read_log`, `generator_write_test`)
- healing lifecycle (`test_list`, `test_run`, `test_debug`)

## Arguments

Use these mode-specific forms:

- `plan <target-url-or-scope>`
- `generate <test-suite> <test-name> <test-file> <seed-file>`
- `audit <site-slug>`
- `heal <test-file-or-pattern>`

If inputs are missing, request only the missing mode arguments.

Requirements enrichment in `plan` mode is auto-triggered when the orchestrator passes input-folder content. It is never triggered by a flag in this skill directly.

## Non-goals

- Do not introduce framework-breaking shortcuts to make tests pass.
- Do not rewrite unrelated test files during a healing run.
- Do not weaken assertions without documenting why.
- Do not skip untested interactive UI regions.
- Do not ship low-detail plans/tests that cannot be audited line-by-line.
- Do not write `test-results/`, `playwright-report/`, trace blobs, or reporter output outside `output/<site>/test/`.
- Do not write baseline screenshots outside `output/<site>/test/screenshots/baseline/`.

## Site-Specific Guidance (tabipass.jp style sites)

For content-rich Japanese travel portals with mixed JP/EN UI:

- cover top navigation (JP + EN labels)
- cover login modal open/close/invalid auth flow
- cover region filters and resulting hotel list changes
- cover contact navigation and policy/terms modal routes
- cover footer duplication and repeated nav blocks without false-positive duplicates

## Reference Docs

- `.claude/skills/phase-b/playwright-pom/SKILL.md` — **canonical POM structure** every generated test and page object must follow
- `.claude/skills/phase-b/playwright-report/SKILL.md` — **client-presenting PDF report generation** (cover, KPIs, charts, failure analysis, coverage, traceability) run after every test execution
- `.claude/skills/phase-b/playwright-official/SKILL.md` — official Playwright baseline this lifecycle stays compatible with
- `.claude/skills/phase-b/playwright-cli/SKILL.md` — interactive browser-CLI reference for ad-hoc planning/debugging
- `.claude/skills/phase-b/playwright-cli/references/spec-driven-testing.md` — supplementary plan/generate/heal CLI workflow
- `.claude/skills/phase-b/playwright-cli/references/playwright-tests.md` — running and debugging Playwright tests via CLI

When the Playwright Enterprise Framework is the host project, also follow its in-repo conventions for path aliases (e.g. `@fixtures/*`, `@utils/*`, `@config/*`), TypeScript style, and logger usage; these aren't shipped with this skill but are required by rules 1–4 above when those aliases exist.
