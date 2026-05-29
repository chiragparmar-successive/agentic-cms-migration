---
name: ai-remediation-agent
description: AI-powered remediation agent that analyses quality gate failures and generates targeted file patches using Claude API tool-use. Runs in a self-healing retry loop with a maximum of 5 iterations.
argument-hint: "<site-slug>"
user-invocable: true
---

# AI Remediation Agent

Phase: **E — Quality Loop** (Self-Healing — triggered on CHECKPOINT 3 FAIL)

Automatically diagnose and fix quality gate failures through AI-generated file patches.

## Precondition

- CHECKPOINT 3 failed — one or more quality gates did not pass:
  - **Frontend visual parity** (screenshots/content not look-alike)
  - Playwright behavioral parity regressions
  - SonarQube quality gate failures
  - Lighthouse CI performance gate failures

## Retry Loop Contract

```
iteration = 0
MAX_ITERATIONS = 5

while iteration < MAX_ITERATIONS:
    // 1. Run all quality gates
    visual_result = run frontend-visual-parity
    playwright_result = run playwright-behavioral-parity
    sonarqube_result = run sonarqube-gate
    lighthouse_result = run lighthouse-ci-gate

    // 2. Check if all pass
    if all gates pass:
        proceed to CHECKPOINT 4 (Pre-Deployment Sign-Off)
        break

    // 3. Analyse failures
    failures = collect all gate failures

    // 4. Generate and apply patches
    patches = generate_patches(failures)
    apply_patches(patches)

    iteration++

if iteration == MAX_ITERATIONS and failures remain:
    escalate to human with full failure report
```

## Execution

### Step 1: Collect Failure Reports

Read from `output/<site>/reports/` and docs:
- `docs/VISUAL-PARITY-REPORT.md` + `test/reports/visual-parity.json` — look-alike failures
- `test/reports/visual-parity/*/legacy.png` + `new.png` — screenshot pairs
- `behavioral-parity.md` — Playwright regression list
- `sonarqube-gate.md` — Code quality issues
- `lighthouse-gate.md` — Performance issues

### Step 2: Classify Failures

| Source | Category | Examples | Typical Fix |
|---|---|---|---|
| Visual | `visual-layout` | Nav/hero/footer wrong vs legacy screenshot | Fix layout.tsx, header/footer components |
| Visual | `visual-content` | H1/body mismatch vs legacy text | CMS mapping + typography, not static copy |
| Visual | `visual-cms-slot` | Data present but wrong region | Remap adapter fields to component slots |
| Playwright | `locator` | Selector doesn't match | Update component class/role |
| Playwright | `timing` | Element loads too slow | Add loading state, increase timeout |
| Playwright | `data-mismatch` | CMS content differs | Fix ETL mapping or CMS seed |
| Playwright | `assertion` | Page structure changed | Fix component layout |
| Playwright | `app-defect` | Bug in generated code | Fix component logic |
| SonarQube | `bug` | Null pointer, logic error | Fix code |
| SonarQube | `vulnerability` | XSS, injection risk | Add sanitisation |
| SonarQube | `code-smell` | Complexity, duplication | Refactor |
| Lighthouse | `performance` | Large bundle, slow LCP | Optimise images, split code |
| Lighthouse | `accessibility` | Missing ARIA labels | Add ARIA attributes |
| Lighthouse | `seo` | Missing meta tags | Add metadata |

Static-data rule:

- If frontend uses hardcoded primary content instead of CMS-backed data, classify as `data-mismatch` / `app-defect`.
- This is a blocking quality issue in Phase E and must be remediated before sign-off.

### Step 3: Generate Patches

For each failure, use Claude API tool-use to:

1. Read the relevant source file
2. Understand the failure context
3. Generate a minimal, targeted patch
4. Validate the patch doesn't break existing passing tests

Patch strategy — fix in this priority order:
1. **Visual parity** — layout/chrome/CMS slots to match legacy screenshots (`frontend-visual-parity` skill)
2. **Data fixes** — CMS content mismatches (fix in ETL or seed)
3. **Code fixes** — Bugs, vulnerabilities, missing attributes
4. **Performance fixes** — Image optimisation, code splitting, caching
5. **Style fixes** — Layout, accessibility, SEO metadata

Data integrity requirement:

- Remediation must include checks that user-visible data is dynamic (CMS/API sourced) and not static literals/placeholders in frontend code.

### Step 4: Apply Patches

Apply each patch to the source file. Track:
- File path
- Change description
- Failure category addressed
- Before/after diff

### Step 5: Re-run Quality Gates

After applying all patches for this iteration:
1. Re-run `node scripts/quality/visual-parity-check.mjs <site-slug>`
2. Re-run Playwright behavioral parity
3. Re-run SonarQube gate
4. Re-run Lighthouse CI gate
5. Compare results with previous iteration

### Step 6: Iteration Reporting

For each iteration, log:

```markdown
# Remediation Iteration N/5

## Patches Applied
| File | Change | Category | Addresses |
|---|---|---|---|
| src/components/Hero.tsx | Added alt text | accessibility | LHCI audit img-alt |
| src/app/blog/page.tsx | Fixed data fetch | app-defect | PW regression blog-list |

## Gate Results After Patches
| Gate | Before | After | Delta |
|---|---|---|---|
| Playwright | 85% pass | 92% pass | +7% |
| SonarQube | 3 bugs | 1 bug | -2 |
| Lighthouse Perf | 78 | 84 | +6 |

## Remaining Failures
- ...
```

## Escalation

If after 5 iterations failures remain:

1. Generate comprehensive failure report
2. Classify remaining failures as:
   - **Fixable by human** — complex logic, design decisions
   - **Infrastructure** — requires env/config changes
   - **Known limitation** — acceptable tradeoff, document it
3. Present to human for **CHECKPOINT 4** decision:
   - Accept with known limitations → deploy
   - Reject → manual intervention required

## CHECKPOINT 3 → CHECKPOINT 4 Flow

```
CHECKPOINT 3: All gates pass?
  ├── PASS → CHECKPOINT 4: Pre-Deployment Sign-Off (human approval)
  └── FAIL → AI Remediation Agent (max 5 iterations)
              ├── All gates pass → CHECKPOINT 4
              └── Max iterations reached → Escalate to human
                    ├── Human accepts → CHECKPOINT 4
                    └── Human rejects → Manual fix cycle
```

## Output Contract

- Patches applied per iteration with diffs
- Gate results per iteration
- Final remediation report at `output/<site>/reports/remediation-summary.md`
- CHECKPOINT 3/4 status
- Explicit "static vs dynamic data" validation result with impacted files/routes

## Important Constraints

- **Never weaken tests** — Fix the implementation, not the test assertions
- **Minimal patches** — Change as little code as possible per fix
- **Preserve type safety** — All patches must pass TypeScript compiler
- **Preserve architecture** — Don't restructure components or change patterns
- **Track everything** — Every patch must be logged with rationale
