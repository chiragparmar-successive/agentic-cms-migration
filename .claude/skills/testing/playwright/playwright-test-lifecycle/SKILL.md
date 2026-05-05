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

Do not run `generate` before scenario requirements are clear.
Do not run `heal` before reproducing the failure.

## Required Conventions

All generated code must follow these rules:

1. **Imports** use path aliases only.
   - Use: `@fixtures/test.fixtures`, `@utils/core`, `@config/config.manager`
   - Do not use relative imports.
2. **Functions** use named arrow exports only.
   - No default exports.
   - No function declarations for exported helpers.
3. **Naming**
   - Files: `kebab-case.spec.ts`
   - Classes/types: `PascalCase`
   - Variables/functions: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
4. **Logging**
   - Use `logger.info(...)` and `logger.error(...)`.
   - Never use `console.log(...)`.
5. **Test shape**
   - Wrap tests in `test.describe("<suite> <tags>", () => {})`.
   - Keep one scenario per file.
6. **Locators**
   - Prefer semantic locators (`getByRole`, `getByText`, `getByLabel`).
   - Use CSS selectors only when necessary.
7. **Documentation**
   - Add JSDoc for test suite and test case.
   - Add step comments before each scenario step.
8. **Async and reliability**
   - Always await async operations.
   - Do not use deprecated patterns.
9. **Error handling**
   - Log and rethrow errors; do not swallow failures.
10. **No guessed selectors**
   - Do not use speculative locator patterns.
   - If a selector is uncertain, inspect DOM/snapshot first and document chosen locator strategy.
11. **Localization-safe testing**
   - For multilingual UI, assert using stable role/structure first, then language-specific text.
   - For Japanese/English variants, include at least one assertion per locale-critical flow.

## Modes

### Mode: plan

Purpose: create comprehensive scenario plans for UI/API/BDD/visual/accessibility/performance coverage.

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
3. Build a page-by-page interaction inventory and convert each flow into scenarios.
4. Include happy, edge, negative, validation, and cross-page journey scenarios.
5. Include explicit expected outcomes and data prerequisites per scenario.
6. Save the complete markdown plan to:
   - `output/<site>/test/specs/ui-complete-plan.md`
   via `planner_save_plan`.

Plan must include these sections in order:

1. Application Overview
2. Route Inventory
3. Interaction Inventory (click/hover/input/submit/modal/tab/filter)
4. Scenario Matrix (P0/P1/P2 priority)
5. Detailed Scenarios
6. Risks and Known Unknowns

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
2. Scenario ID appears in test title and comment header.
3. Assertions must map to scenario assertions one-to-one.
4. Replace fragile `getByText`-only checks with role/label/test-id-first strategy when possible.
5. For content-heavy pages, include structural assertions (counts, visibility, state changes), not only static text checks.
6. Include negative and guard assertions where relevant (e.g., invalid login remains blocked).
7. Avoid comments like "assuming ..." in final tests.
8. Do not stop after file generation; execution is mandatory.
9. If execution fails, healing iteration is mandatory.

### Mode: heal

Purpose: diagnose and remediate failing tests with reproducible fixes.

Workflow:

1. Run failing tests (`test_run`) and identify failures.
2. Debug each failure (`test_debug`) and inspect traces/snapshots/logs/network data.
3. Determine root cause (selector drift, timing, assertions, data/env, config).
4. Apply targeted fixes while preserving framework conventions.
5. Re-run and iterate until pass, or mark as `test.fixme()` with a clear reason.
6. Keep reruns focused on failing specs first, then run full suite.

Healing quality gates:

- classify failures before patching: `locator`, `timing`, `data`, `navigation`, `app-defect`
- patch smallest safe surface first
- rerun: failed test -> related group -> full required suite
- append concise fix note per patched test

## Output Contract

### For `plan`

- Output is a saved markdown test plan for downstream generation.
- Includes scenario title, tags, type, numbered steps, expected outcomes, and data needs.
- Scenarios are isolated and runnable in any order.
- Plan file path is `output/<site>/test/specs/ui-complete-plan.md`.
- Must include scenario IDs, priorities, and explicit assertion lists.

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
- `heal <test-file-or-pattern>`

If inputs are missing, request only the missing mode arguments.

## Non-goals

- Do not introduce framework-breaking shortcuts to make tests pass.
- Do not rewrite unrelated test files during a healing run.
- Do not weaken assertions without documenting why.
- Do not skip untested interactive UI regions.
- Do not ship low-detail plans/tests that cannot be audited line-by-line.
- Do not write `test-results/`, `playwright-report/`, trace blobs, or reporter output outside `output/<site>/test/`.

## Site-Specific Guidance (tabipass.jp style sites)

For content-rich Japanese travel portals with mixed JP/EN UI:

- cover top navigation (JP + EN labels)
- cover login modal open/close/invalid auth flow
- cover region filters and resulting hotel list changes
- cover contact navigation and policy/terms modal routes
- cover footer duplication and repeated nav blocks without false-positive duplicates

## Reference Docs

- `.claude/skills/testing/playwright/playwright-official/SKILL.md` — official Playwright baseline this lifecycle stays compatible with
- `.claude/skills/testing/playwright/playwright-cli/SKILL.md` — interactive browser-CLI reference for ad-hoc planning/debugging
- `.claude/skills/testing/playwright/playwright-cli/references/spec-driven-testing.md` — supplementary plan/generate/heal CLI workflow
- `.claude/skills/testing/playwright/playwright-cli/references/playwright-tests.md` — running and debugging Playwright tests via CLI

When the Playwright Enterprise Framework is the host project, also follow its in-repo conventions for path aliases (e.g. `@fixtures/*`, `@utils/*`, `@config/*`), TypeScript style, and logger usage; these aren't shipped with this skill but are required by rules 1–4 above when those aliases exist.
