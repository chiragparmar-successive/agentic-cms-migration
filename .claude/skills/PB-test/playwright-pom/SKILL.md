---
name: playwright-pom
description: Page Object Model (POM) structure and conventions for all generated Playwright tests. Every test file must import page objects — never use raw page.locator() calls directly in tests.
user-invocable: false
---

# Playwright Page Object Model (POM) Skill

All generated Playwright tests in this framework use a strict Page Object Model. This skill defines the canonical structure every page object, component object, and test file must follow.

## Why POM

- Tests read as user actions, not DOM queries
- Locator changes are fixed in one place, not scattered across specs
- `test.step()` descriptions map directly to page/component method names
- Consistent shape makes healing predictable: selector drift = update the page object, not the test

---

## Directory Layout

```
output/<site>/test/
  pages/
    base.page.ts               # Abstract base every page extends
    <route-name>.page.ts       # One file per major route/page
  components/
    <component-name>.component.ts  # Reusable UI blocks (nav, modal, footer, form)
  fixtures/
    pages.fixture.ts           # Injects instantiated page objects into every test
  tests/
    generated/
      <scenario-id>.spec.ts    # Tests import from @pages/* and @components/* only
```

Path aliases (must be in `tsconfig.json`):

```json
"@pages/*":      ["pages/*"],
"@components/*": ["components/*"]
```

---

## Base Page (`pages/base.page.ts`)

Every page object extends `BasePage`. Do not duplicate navigation or load-wait logic.

```ts
import { Page, Locator } from "@playwright/test";
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

---

## Page Object Structure

One file per major route. File name: `<route-name>.page.ts`. Class name: `<RouteName>Page`.

```ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "@pages/base.page";
import { logger } from "@utils/core";

export class LoginPage extends BasePage {
  // ── Locators (getters, never stored in constructor) ──────────────────────

  get dialog(): Locator {
    return this.page.getByRole("dialog", { name: "Sign in" });
  }

  get emailInput(): Locator {
    return this.dialog.getByRole("textbox", { name: "Email" });
  }

  get passwordInput(): Locator {
    return this.dialog.getByRole("textbox", { name: "Password" });
  }

  get submitButton(): Locator {
    return this.dialog.getByRole("button", { name: "Log In" });
  }

  get errorMessage(): Locator {
    return this.dialog.getByRole("alert");
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    logger.info("Opening login page");
    await this.goto("/login");
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    logger.info(`Filling credentials for ${email}`);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    logger.info("Submitting login form");
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  // ── Assertions ───────────────────────────────────────────────────────────

  async assertDialogVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async assertErrorVisible(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) await expect(this.errorMessage).toContainText(message);
  }

  async assertDialogHidden(): Promise<void> {
    await expect(this.dialog).toBeHidden();
  }
}
```

---

## Component Object Structure

One file per reusable UI block. File name: `<component-name>.component.ts`. Class name: `<ComponentName>Component`.

Components receive `page: Page` directly — they do **not** extend `BasePage`.

```ts
import { Page, Locator, expect } from "@playwright/test";
import { logger } from "@utils/core";

export class NavComponent {
  constructor(private readonly page: Page) {}

  get nav(): Locator {
    return this.page.getByRole("navigation");
  }

  navLink(label: string): Locator {
    return this.nav.getByRole("link", { name: label });
  }

  async clickLink(label: string): Promise<void> {
    logger.info(`Clicking nav link: ${label}`);
    await this.navLink(label).click();
  }

  async assertLinkVisible(label: string): Promise<void> {
    await expect(this.navLink(label)).toBeVisible();
  }
}
```

---

## Pages Fixture (`fixtures/pages.fixture.ts`)

Inject all page objects as typed fixtures so tests never call `new XPage(page)` directly.

```ts
import { test as base } from "@playwright/test";
import { LoginPage } from "@pages/login.page";
import { HomePage } from "@pages/home.page";
import { NavComponent } from "@components/nav.component";

type Pages = {
  loginPage: LoginPage;
  homePage: HomePage;
  nav: NavComponent;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  nav: async ({ page }, use) => use(new NavComponent(page)),
});

export { expect } from "@playwright/test";
```

---

## Test File Structure

Every generated spec must follow this exact shape — no exceptions.

```ts
/**
 * UI-LOGIN-01: Valid credentials log the user in
 * Priority: P0 | Type: smoke
 * Route: /login
 */
import { test, expect } from "@fixtures/pages.fixture";
import { logger } from "@utils/core";

test.describe("Login @smoke", () => {
  /**
   * UI-LOGIN-01 — assert successful login redirects to dashboard
   */
  test("UI-LOGIN-01: valid credentials log the user in", async ({
    loginPage,
    homePage,
  }) => {
    await test.step("Open login page", async () => {
      logger.info("Starting UI-LOGIN-01");
      await loginPage.open();
      await loginPage.assertDialogVisible();
    });

    await test.step("Submit valid credentials", async () => {
      await loginPage.login(
        "user@example.com",
        process.env.TEST_PASSWORD ?? "",
      );
    });

    await test.step("Assert redirect to dashboard", async () => {
      await homePage.assertWelcomeBannerVisible();
      await loginPage.assertDialogHidden();
    });
  });
});
```

**Rules enforced by this shape:**

- Import `test` and `expect` from `@fixtures/pages.fixture`, never from `@playwright/test` directly in spec files.
- Never call `new XPage(page)` inside a test — use fixture injection.
- Never call `page.locator()`, `page.getByRole()`, etc. directly in a test — delegate to page/component methods.
- Every `test.step()` description matches a page/component method name or maps to a plan step.
- `logger.info()` at the start of each test and inside action methods; `logger.error()` in catch blocks.

---

## Naming Conventions

| Artifact        | Convention                | Example                        |
| --------------- | ------------------------- | ------------------------------ |
| Page file       | `kebab-case.page.ts`      | `home.page.ts`                 |
| Component file  | `kebab-case.component.ts` | `nav.component.ts`             |
| Fixture file    | `kebab-case.fixture.ts`   | `pages.fixture.ts`             |
| Spec file       | `<scenario-id>.spec.ts`   | `ui-login-01.spec.ts`          |
| Page class      | `<Name>Page`              | `HomePage`                     |
| Component class | `<Name>Component`         | `NavComponent`                 |
| Locator getter  | `camelCase` noun          | `submitButton`, `emailInput`   |
| Action method   | `camelCase` verb          | `login()`, `fillCredentials()` |
| Assert method   | `assertX()`               | `assertDialogVisible()`        |

---

## Rules for Generator Agent

When generating a test for a new route:

1. **Check if the page object exists** at `output/<site>/test/pages/<route>.page.ts`.
   - If it does, read it and reuse existing locators/actions.
   - If it does not, create it before writing the spec.
2. **Inspect the DOM** via `browser_snapshot` before defining any locator.
3. **Add only the locators and methods needed** by the current scenario — do not pre-fill speculative methods.
4. **If a component is shared** across pages (e.g. nav, footer, modal), place it in `components/` and import it in each page object that uses it.
5. **Update `fixtures/pages.fixture.ts`** whenever a new page/component is created.
6. **Never bypass the fixture** — if a page object doesn't exist yet, create it; do not use `page.getByRole()` inline in the spec.

---

## Rules for Healer Agent

When fixing a failing test:

1. **Locate the broken locator in the page object**, not the spec file.
2. Fix the getter/method in the page object; the spec file should not change unless the scenario steps themselves changed.
3. If a locator is unstable across multiple scenarios, consider adding a `data-testid` fallback in the page object getter with a comment explaining why.
4. After fixing, run the failing spec, then the full suite to confirm no regressions in shared page objects.

---

## Reference

- `playwright-test-lifecycle/SKILL.md` — plan / generate / heal workflow
- `playwright-test-gen/SKILL.md` — bootstrap and orchestration
- `utils/core.ts` — logger used by all page objects and specs
