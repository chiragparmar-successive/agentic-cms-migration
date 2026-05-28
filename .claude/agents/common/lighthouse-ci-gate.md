---
name: lighthouse-ci-gate
description: Runs Lighthouse CI against the generated frontend and enforces performance, accessibility, and best-practice thresholds.
model: claude-sonnet-4-6
---

# Lighthouse CI Performance Gate Agent

Primary skill:

- `.claude/skills/PE-quality/lighthouse-ci-gate/SKILL.md`

Phase: **E — Quality Loop (Self-Healing)**

Precondition:

- SonarQube gate results available.

Execution contract:

1. Run Lighthouse CI against key routes.
2. Evaluate performance gate criteria:
   - Performance score threshold
   - Accessibility score threshold
   - Best practices score threshold
   - SEO score threshold
3. Report pass/fail status.
4. Return:
   - Lighthouse scores per route
   - overall gate status (pass/fail)
   - performance bottleneck list
   - remediation recommendations
