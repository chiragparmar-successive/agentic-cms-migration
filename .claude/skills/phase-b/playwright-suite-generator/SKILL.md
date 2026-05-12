---
name: playwright-suite-generator
description: AI-generates a comprehensive Playwright test suite from the approved content model spec using Claude API. Covers route, content, SEO, ARIA, and visual regression tests.
argument-hint: "<site-slug>"
user-invocable: true
---

# Playwright Suite Generator

Phase: **B — Test-First Contract** (Step 1 of 2)

Generate a comprehensive Playwright test suite that serves as the **behavioral contract** for the migration. Tests are written against the legacy site first, then re-run against the new stack in Phase E.

## Precondition

- **CHECKPOINT 1 must be cleared** — Content Model Spec approved by human.

## Input

- Approved Content Model Spec from `output/<site>/docs/content-model/SCHEMA-DESIGN.md`
- Source site URL from Phase A
- Route inventory from `site-crawler`

## Execution

### Step 1: Test Plan Generation

Using the content model spec and route inventory, generate test scenarios covering:

1. **Route parity tests** — Every source route has a corresponding test
2. **Content rendering tests** — CMS content appears correctly on each page
3. **SEO metadata tests** — Title, description, OG tags, canonical URLs
4. **ARIA/accessibility tests** — Landmark roles, labels, keyboard navigation
5. **Visual regression baselines** — Screenshot comparisons per route

### Step 2: Test Suite Structure

Generate test files under `output/<site>/test/tests/generated/`:

```text
output/<site>/test/
  tests/generated/
    route-parity.spec.ts
    content-home.spec.ts
    content-blog-list.spec.ts
    content-blog-detail.spec.ts
    seo-metadata.spec.ts
    aria-accessibility.spec.ts
    visual-regression.spec.ts
    navigation.spec.ts
    ...
```

### Step 3: Test Quality Standards

All generated tests must follow the conventions from `playwright-test-lifecycle`:

- Semantic locators (`getByRole`, `getByLabel`, `getByText`)
- One scenario per file
- JSDoc + step comments
- Structured logging
- Deterministic assertions (no speculative logic)
- Bilingual-safe for multilingual sites

### Step 4: Hand off to Baseline Runner

After generation, the `baseline-runner` executes these tests against the legacy site.

## Output Contract

- Test plan at `output/<site>/test/specs/ui-complete-plan.md`
- Generated test files in `output/<site>/test/tests/generated/`
- Coverage summary (routes covered, test types, scenario count)

## Downstream

Output feeds into:
- `baseline-runner` (runs tests against legacy site)
- Phase E: `playwright-behavioral-parity` (re-runs same tests against new stack)
