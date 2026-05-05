---
name: playwright-official
description: Official Playwright baseline wrapper integrated into this repository's lifecycle architecture.
argument-hint: "<task> [task-args]"
user-invocable: true
---

# Playwright Official

This skill is the official Playwright compatibility layer for this repo.

Imported package location:

- `.claude/skills/testing/playwright-official/.playwright/`

Lifecycle compatibility:

- Keep planner/generator/healer ownership in `playwright-test-lifecycle`.
- Keep all artifacts under `output/<site>/test/`.

## Tasks

- `bootstrap <site>`: initialize or verify canonical Playwright config
- `verify <site>`: validate official config + command compatibility
- `run <site> [pattern]`: execute tests using official runner commands

## Official Baseline

- Use `@playwright/test` and `playwright.config.ts`.
- Use `npx playwright test`, `npx playwright test --ui`, `npx playwright show-report`.
- Prefer resilient locators (`getByRole`, `getByLabel`, `getByText`) and web-first assertions.
- Keep `testDir`, `outputDir`, and reporters local to `output/<site>/test/`.

---
name: playwright-official
description: Official Playwright skill profile imported from Playwright documentation and adapted for this repository's lifecycle compatibility constraints.
argument-hint: "<task> [task-args]"
user-invocable: true
---

# Playwright Official Skill (Imported Baseline)

Use this skill as the official Playwright compatibility layer for your existing testing system.

This skill does not replace your current lifecycle. It standardizes implementation choices to official Playwright patterns while preserving:

- `.claude/skills/testing/playwright-test-lifecycle/SKILL.md`
- `.claude/agents/testing/playwright-test-orchestrator.agent.md`
- site-isolated output in `output/<site>/test/`

## Tasks

- `bootstrap <site>`: initialize/update Playwright project structure and config
- `verify <site>`: validate config and command compatibility
- `run <site> [pattern]`: run tests using official CLI patterns

## Imported From Official Docs

Imported and aligned from:

- `https://playwright.dev/docs/intro`
- `https://playwright.dev/docs/test-configuration`
- `https://playwright.dev/docs/best-practices`

## Official Baseline (Mandatory)

1. Use `@playwright/test` runner and official config file `playwright.config.ts`.
2. Keep `testDir`, `outputDir`, and reporter output paths under `output/<site>/test/`.
3. Prefer semantic locators (`getByRole`, `getByLabel`, `getByText`) and avoid brittle CSS selectors.
4. Use auto-waiting and web-first assertions (`await expect(locator).toBeVisible()`).
5. Use tracing/screenshots/video only as needed, with artifacts kept in site-local test output.
6. Use official CLI for execution:
   - `npx playwright test`
   - `npx playwright test --ui`
   - `npx playwright test --project=<name>`
   - `npx playwright show-report`
   - `npx playwright --version`

## Compatibility Rules With Existing Lifecycle

1. `plan/generate/heal` ownership remains in `playwright-test-lifecycle`.
2. Generated tests still live in `output/<site>/test/tests/generated/`.
3. Planner output remains `output/<site>/test/specs/ui-complete-plan.md`.
4. Healer still patches only generated tests unless explicitly requested.
5. No root-level `test-results/` or `playwright-report/`.

## Required Config Checks

Verify these in `output/<site>/test/playwright.config.ts`:

- `testDir` resolves inside `output/<site>/test/tests`
- `outputDir: 'test-results'`
- HTML reporter uses `playwright-report` folder
- JUnit/JSON reporter output remains under `reports/`
- projects include at least one Chromium profile
- `trace: 'on-first-retry'` preferred baseline for CI-friendly debugging
- `forbidOnly` enabled on CI (`!!process.env.CI`)
- retries/workers configured for CI stability

## Best-Practice Enforcement Checklist

During `verify`, confirm:

1. Tests assert user-visible behavior, not implementation details.
2. Tests are isolated and do not depend on prior test state.
3. Locators prioritize role/label/text/test-id and avoid brittle CSS/XPath where possible.
4. Assertions are web-first (`await expect(locator)...`) and not manual visibility checks.
5. Third-party integrations are mocked/stubbed where appropriate.
6. CI runs use Linux and targeted browser install strategy when possible.

## Output Contract

For each run, report:

- project path used
- command executed
- files created/updated
- pass/fail summary
- compatibility status with lifecycle conventions
- official-doc conformance status (pass/warn/fail)

