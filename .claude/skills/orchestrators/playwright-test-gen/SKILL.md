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

If the URL is missing, stop and ask:
`playwright-test-gen <url>`

## Contract

You MUST:

1. Derive a stable `<site>` slug from the target hostname (e.g. `example-com` for `example.com`).
2. Confine **all** output to `output/<site>/test/` — no files at the repo root.
3. Complete phases in order: Preconditions → Plan → Bootstrap → Generate → Execute → Heal.
4. Never declare done while any P0 test is failing.

---

## Phase 1: Preconditions

1. Verify dependent skills are readable:
   - `.claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md`
   - `.claude/skills/testing/playwright/playwright-official/SKILL.md`
   - `.claude/skills/testing/playwright/playwright-cli/SKILL.md`
2. Verify browser automation is available (MCP Playwright tools or `playwright-cli`).
3. Validate and normalise the URL argument (add `https://` if scheme is missing).
4. Derive `<site>` slug: lowercase hostname, dots and slashes replaced with `-`.
5. Confirm output directory: `output/<site>/test/` (create if absent).

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

---

## Phase 3: Project Bootstrap

Set up the Playwright project at `output/<site>/test/` if it does not already exist.

Required files:

### `package.json`

```json
{
  "name": "<site>-tests",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "report": "playwright show-report playwright-report"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "typescript": "latest"
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
      "@utils/*":    ["utils/*"],
      "@config/*":   ["config/*"],
      "@pages/*":    ["pages/*"],
      "@components/*": ["components/*"]
    }
  },
  "include": ["**/*.ts"]
}
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  timeout: 30_000,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  use: {
    baseURL: '<target-url>',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Replace `<target-url>` with the normalised URL from Phase 1.

### Seed test — `tests/seed.spec.ts`

```ts
import { test } from '@playwright/test';

test('seed', async ({ page }) => {
  await page.goto('/');
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
import { Page } from '@playwright/test';
import { logger } from '@utils/core';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    logger.info(`Navigating to ${path}`);
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
```

### `fixtures/pages.fixture.ts` (required — update as pages are added)

Start with a minimal fixture; the generator extends it with each new page object:

```ts
import { test as base } from '@playwright/test';

// Import page objects here as they are created, e.g.:
// import { HomePage } from '@pages/home.page';

type Pages = {
  // homePage: HomePage;
};

export const test = base.extend<Pages>({
  // homePage: async ({ page }, use) => use(new HomePage(page)),
});

export { expect } from '@playwright/test';
```

### Directory scaffold

Create these directories (add `.gitkeep` if needed):

```
output/<site>/test/
  pages/
  components/
  fixtures/
  utils/
  config/
  tests/
    generated/
  specs/
  reports/
  test-results/
```

Run `npm install` inside `output/<site>/test/` and confirm Playwright installs cleanly.

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
- Follow the full POM structure defined in `.claude/skills/testing/playwright/playwright-pom/SKILL.md`.

---

## Phase 5: Execution, Analytics, and Heal Loop

### Execution

Run from the site test folder so all output stays contained:

```bash
cd output/<site>/test && npx playwright test
```

Run smoke suite first, then full regression.

### Analytics (produce per run)

| Metric | Value |
|--------|-------|
| Total tests | |
| Passed | |
| Failed | |
| Skipped | |
| Pass rate (%) | |
| Failure categories | locator / timing / data / navigation / app-defect |
| Flaky tests | |
| Iterations to green | |

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

## Phase 6: Acceptance Criteria

Do not mark complete until all are true:

- [ ] `npm install` succeeded in `output/<site>/test/`
- [ ] Plan saved to `output/<site>/test/specs/ui-complete-plan.md`
- [ ] All P0 scenarios have a generated test file
- [ ] All P1 scenarios have a generated test file (or explicitly deferred with reason)
- [ ] Smoke suite passes
- [ ] Core regression suite passes
- [ ] No blocking failures remain
- [ ] Analytics report delivered
- [ ] All test artifacts confined to `output/<site>/test/`

---

## Required Deliverables

At completion, provide:

1. **Site slug** and **output path** (`output/<site>/test/`)
2. **Run commands**:
   - `cd output/<site>/test && npx playwright test`
   - `cd output/<site>/test && npm run test:smoke`
3. **Plan summary**: scenario counts by priority and type
4. **Test file list**: all generated `.spec.ts` paths
5. **Final analytics**: total / passed / failed / skipped / pass rate / iterations
6. **Known gaps**: any scenarios deferred or marked `test.fixme()` with reasons

---

## Notes

- Never write `test-results/`, `playwright-report/`, trace blobs, or reporter output outside `output/<site>/test/`.
- If the target site has auth, create a `tests/.auth/` state file via the seed and reuse it in fixtures — never hardcode credentials in test files.
- For multilingual sites, include at least one assertion per locale-critical flow; prefer role/structure locators over language-specific text.
- If a selector is uncertain, always inspect the DOM snapshot first; place the locator in the page object getter with a comment explaining the strategy.
- Fix root causes, not assertion surfaces.
- All generated tests must follow the POM structure defined in `.claude/skills/testing/playwright/playwright-pom/SKILL.md` — read it before generating any page object or spec file.
