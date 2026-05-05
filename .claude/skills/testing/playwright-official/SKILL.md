---
name: playwright-official
description: Official Playwright baseline wrapper integrated into this repository's lifecycle architecture. Standardizes config, locator, and runner conventions while preserving the planner -> generator -> healer flow owned by playwright-test-lifecycle.
argument-hint: "<task> [task-args]"
user-invocable: true
---

# Playwright Official

Official Playwright compatibility layer for this repo. This skill does **not** replace the existing lifecycle; it standardizes implementation choices to official Playwright patterns while preserving:

- `.claude/skills/testing/playwright-test-lifecycle/SKILL.md`
- `.claude/agents/testing/playwright-test-orchestrator.agent.md`
- site-isolated output in `output/<site>/test/`

## Tasks

- `bootstrap <site>`: initialize or verify the canonical Playwright project structure and config under `output/<site>/test/`
- `verify <site>`: validate config and command compatibility against the official baseline
- `run <site> [pattern]`: execute tests using the official runner commands

## Imported From Official Docs

Aligned with:

- `https://playwright.dev/docs/intro`
- `https://playwright.dev/docs/test-configuration`
- `https://playwright.dev/docs/best-practices`

## Official Baseline (Mandatory)

1. Use the `@playwright/test` runner and an official `playwright.config.ts`.
2. Keep `testDir`, `outputDir`, and reporter output paths under `output/<site>/test/`.
3. Prefer semantic locators (`getByRole`, `getByLabel`, `getByText`); avoid brittle CSS/XPath selectors.
4. Use auto-waiting and web-first assertions (`await expect(locator).toBeVisible()`).
5. Use tracing/screenshots/video only as needed; keep artifacts site-local.
6. Use the official CLI for execution:
   - `npx playwright test`
   - `npx playwright test --ui`
   - `npx playwright test --project=<name>`
   - `npx playwright show-report`
   - `npx playwright --version`

## Compatibility Rules With Existing Lifecycle

1. `plan/generate/heal` ownership remains in `playwright-test-lifecycle`.
2. Generated tests still live in `output/<site>/test/tests/generated/`.
3. Planner output remains `output/<site>/test/specs/ui-complete-plan.md`.
4. The healer patches only generated tests unless explicitly requested otherwise.
5. No root-level `test-results/` or `playwright-report/`.

## Required Config Checks

Verify these in `output/<site>/test/playwright.config.ts`:

- `testDir` resolves inside `output/<site>/test/tests`
- `outputDir: 'test-results'` (relative to the config file)
- HTML reporter uses `playwright-report` folder
- JUnit/JSON reporter output remains under `reports/`
- projects include at least one Chromium profile
- `trace: 'on-first-retry'` as the preferred CI-friendly baseline
- `forbidOnly` enabled on CI (`!!process.env.CI`)
- retries/workers configured for CI stability

## Best-Practice Enforcement Checklist

During `verify`, confirm:

1. Tests assert user-visible behavior, not implementation details.
2. Tests are isolated and do not depend on prior test state.
3. Locators prioritize role/label/text/test-id and avoid brittle CSS/XPath where possible.
4. Assertions are web-first (`await expect(locator)...`) and not manual visibility checks.
5. Third-party integrations are mocked/stubbed where appropriate.
6. CI runs use Linux and a targeted browser install strategy when possible.

## Output Contract

For each run, report:

- project path used
- command executed
- files created/updated
- pass/fail summary
- compatibility status with lifecycle conventions
- official-doc conformance status (pass/warn/fail)
