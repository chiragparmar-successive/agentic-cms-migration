---
description: "Phase E — Quality Loop: Run the approved Playwright behavioral parity suite, SonarQube code quality gate, and Lighthouse CI performance gate against the new stack, with AI self-healing up to 5 iterations before escalating."
argument-hint: "<site-slug>"
---

## Phase E — Quality Loop (Self-Healing)

Run this phase **after Phase D is complete and the Next.js frontend is running against the populated Strapi CMS**.
The approved test suite from Phase B is the immutable behavioral contract — fix the implementation, never the tests.

### Skills Used (in order)

1. `.claude/skills/phase-e/playwright-behavioral-parity/SKILL.md` — run approved suite against new stack
2. `.claude/skills/phase-e/sonarqube-gate/SKILL.md` — code quality analysis and gate enforcement
3. `.claude/skills/phase-e/lighthouse-ci-gate/SKILL.md` — performance, accessibility, SEO gate
4. `.claude/skills/phase-e/ai-remediation-agent/SKILL.md` — AI patch generation for failing gates (max 5 iterations)

Arguments: $ARGUMENTS

---

## Step 1 — Preconditions

1. Verify all four skill files listed above are readable.
2. Validate the site slug argument. If missing, stop and ask: `phase-e <site-slug>`
3. Confirm `output/<site>/test/specs/CONTRACT.md` exists — the immutable behavioral contract from Phase B. If it does not, **stop** — Phase B must be completed and approved first.
4. Confirm `output/<site>/frontend/` exists and `npm run build` passes.
5. Confirm Strapi is running and the GraphQL endpoint responds.
6. Confirm the Next.js dev (or production preview) server is running and the homepage responds.

---

## Step 2 — Playwright Behavioral Parity

Follow `playwright-behavioral-parity` skill:

- Run the **full approved test suite** from `output/<site>/test/` against the new Next.js stack
- Compare results against the legacy baseline screenshots from `output/<site>/test/exploratory/baseline/`
- Report regressions — any test that passed on legacy but fails on new stack

After the run, produce analytics:

| Metric              | Value |
| ------------------- | ----- |
| Total tests         |       |
| Passed              |       |
| Failed              |       |
| Skipped             |       |
| Pass rate (%)       |       |
| Visual regressions  |       |

If all tests pass → proceed directly to Step 3.
If any tests fail → record failures and continue to Step 5 (AI Remediation) after all gates are run.

**Never modify test files to make them pass. Fix the implementation.**

---

## Step 3 — SonarQube Code Quality Gate

Follow `sonarqube-gate` skill against `output/<site>/frontend/`:

- Analyse code quality (bugs, vulnerabilities, code smells, coverage)
- Enforce quality gate thresholds
- Report gate status: **PASSED** or **FAILED** with metric breakdown

---

## Step 4 — Lighthouse CI Performance Gate

Follow `lighthouse-ci-gate` skill against the running Next.js app:

- Analyse performance, accessibility, best practices, and SEO for key routes
- Enforce score thresholds
- Report gate status: **PASSED** or **FAILED** with per-route scores

---

## Step 5 — CHECKPOINT 3: Gate Assessment

Assess all three gate results:

**If ALL gates pass** → proceed to CHECKPOINT 4 (Step 7).

**If ANY gate fails** → enter AI Remediation loop (Step 6).

---

## Step 6 — AI Remediation Loop (max 5 iterations)

Follow `ai-remediation-agent` skill for each failing gate:

For each iteration (up to 5):

1. Analyse failure output — identify root cause
2. Generate targeted patches for `output/<site>/frontend/` (and `output/<site>/cms/` if needed)
3. Apply patches
4. Re-run only the failing gate(s)
5. If gate now passes, mark resolved and continue to next failing gate
6. If gate still fails, increment iteration counter and repeat

Track per-gate iteration count. Report after each iteration:

| Gate              | Status  | Iteration |
| ----------------- | ------- | --------- |
| Playwright parity |         |           |
| SonarQube         |         |           |
| Lighthouse CI     |         |           |

**After 5 iterations with a gate still failing** → stop remediation and escalate to human with a detailed failure report. Do not attempt a 6th iteration.

After all gates pass (or max iterations reached), re-run the full Playwright suite one final time to confirm no regressions from patches.

---

## Step 7 — CHECKPOINT 4 (Pre-Deployment Sign-Off)

**Pause** and present to the user:

- All quality gate results (final status per gate)
- Playwright analytics table (final run)
- Visual parity screenshots (any regressions flagged)
- Route coverage report
- Remediation summary: iterations used per gate (e.g. "2/5"), patches applied
- Any gates that failed after max iterations with recommended next steps

Then ask:

> "Phase E complete. All quality gates have been assessed.
> Do you approve for deployment? (yes / no / request changes)"

- **yes** → write `output/<site>/DEPLOYMENT-READY.md` and report Phase E done
- **no / request changes** → implement changes, re-run affected gates, re-present for approval

---

## Step 8 — Write DEPLOYMENT-READY.md

On approval, write `output/<site>/DEPLOYMENT-READY.md`:

```markdown
# Phase E — Deployment Ready Sign-Off

- **Site:** <site-slug>
- **Approved:** <date>
- **Playwright pass rate:** <X>%
- **SonarQube gate:** PASSED
- **Lighthouse CI gate:** PASSED

## Quality Gate Summary

| Gate              | Status | Key Metrics |
| ----------------- | ------ | ----------- |
| Playwright parity |        |             |
| SonarQube         |        |             |
| Lighthouse CI     |        |             |

## Remediation Summary

- Iterations used: <n>/5
- Patches applied: <list>

## Start Commands

- CMS: `cd output/<site>/cms && npm run develop`
- Frontend: `cd output/<site>/frontend && npm run dev`

## URLs

- Strapi admin: <url>
- GraphQL endpoint: <url>
- Frontend: <url>
```

---

## ⛔ STOP — Phase E ends here

**Do NOT trigger deployment.** Deployment requires explicit user action outside this pipeline.

Phase E is a standalone phase. When invoked as `/phase-e`, it completes at `DEPLOYMENT-READY.md` and stops.

---

## Acceptance Criteria

Do not mark Phase E complete until all are true:

- [ ] `CONTRACT.md` confirmed present before starting
- [ ] Playwright behavioral parity suite run against new stack
- [ ] Visual regression comparison completed
- [ ] SonarQube quality gate run
- [ ] Lighthouse CI gate run for key routes
- [ ] All failing gates entered AI remediation loop (max 5 iterations)
- [ ] Gates that failed after max iterations escalated to human
- [ ] Final Playwright suite re-run after any patches
- [ ] Human approved at CHECKPOINT 4
- [ ] `DEPLOYMENT-READY.md` written with gate results and start commands
- [ ] Test files were NEVER modified to make gates pass — only implementation was changed
- [ ] Phase E stopped — deployment was NOT triggered
