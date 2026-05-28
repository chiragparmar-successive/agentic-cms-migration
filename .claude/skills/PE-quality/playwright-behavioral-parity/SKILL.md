---
name: playwright-behavioral-parity
description: Runs the approved Playwright test suite (from Phase B) against the new Next.js + Strapi stack to verify behavioral parity with the legacy site. Compares results against the legacy baseline.
argument-hint: "<site-slug>"
user-invocable: true
---

# Playwright Behavioral Parity

Phase: **E — Quality Loop** (Gate 1 of 3)

Re-run the immutable test suite from Phase B against the new stack to verify behavioral parity.

## Precondition

- Phase D complete (Next.js app generated, routes validated)
- Approved test suite from Phase B (CHECKPOINT 2) — tests must NOT be modified
- New stack running: Next.js frontend + Strapi CMS
- Legacy baseline results available from `baseline-runner`

## Execution

### Step 1: Reconfigure for New Stack

Update `output/<site>/test/playwright.config.ts`:

```typescript
export default defineConfig({
  // Point to new stack instead of legacy site
  use: {
    baseURL: 'http://localhost:3000', // Next.js dev server
  },
  // ... keep all other config unchanged
});
```

### Step 2: Run Full Test Suite

```bash
cd output/<site>/test
npx playwright test
```

### Step 3: Compare Against Legacy Baseline

**Legacy URL:** For WordPress migrations, use `output/<site>/wp-migration/site-config.json` → `wordpressUrl` as the canonical original site. Playwright `baseURL` for the new stack must be the Next.js app only — never point tests at WordPress after Phase D.

**Content expectation:** Tests assert behavior and visible content that Strapi supplies. If a test fails because the frontend shows hardcoded copy instead of CMS data, classify as `data` / app-defect and fix the page to use `cms` — do not weaken assertions.

### Step 3.5: Dynamic Data Validation (No Static Content)

Run explicit checks that frontend data is dynamic and CMS-backed:

1. Verify key pages fetch/render data via CMS adapter calls (no hardcoded primary copy arrays/constants).
2. Confirm at least one content mutation in Strapi is reflected on frontend without code changes.
3. Flag static placeholders or frozen literals in user-visible sections as a regression.
4. Classify failures as `data-mismatch` or `app-defect` and route to remediation.

For each test:
1. Compare pass/fail status with legacy baseline
2. For visual regression tests, compare new screenshots against legacy baselines (same path on `wordpressUrl` vs `localhost:3000`)
3. Classify results:
   - **Parity** — test passes on both legacy and new stack
   - **Regression** — test passed on legacy but fails on new stack
   - **Improvement** — test failed on legacy but passes on new stack (document)
   - **Known exception** — documented legacy issue, acceptable difference

### Step 4: Report

```markdown
# Behavioral Parity Report

## Summary
- Total tests: N
- Passed (parity): N
- Regressions: N
- Improvements: N
- Known exceptions: N
- Parity score: N%

## Regressions (MUST FIX)
| Test | Legacy Status | New Status | Failure Category |
|---|---|---|---|

## Visual Regression Diffs
| Route | Diff % | Status |
|---|---|---|
```

### Step 5: Failure Classification

Classify each regression by category:
- `locator` — selector no longer matches DOM
- `timing` — element loads slower/faster
- `data-mismatch` — CMS content differs from source
- `assertion` — page structure changed
- `app-defect` — genuine bug in generated code
- `missing-route` — route not implemented

## Output Contract

- Parity test results in `output/<site>/test/test-results/`
- Behavioral parity report at `output/<site>/reports/behavioral-parity.md`
- Regression list for remediation
- Parity score (%)
- Dynamic data validation status (PASS/FAIL) with evidence in report

## Important

The test suite is **immutable** after CHECKPOINT 2. Failures must be fixed in the implementation (CMS content, frontend code, adapter logic), never by weakening tests.

## Downstream

Results feed into:
- CHECKPOINT 3 gate decision (combined with SonarQube + Lighthouse)
- `ai-remediation-agent` (if regressions exist)
