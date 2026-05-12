---
name: playwright-behavioral-parity
description: Runs the approved Playwright test suite against the new Next.js + Strapi stack to verify behavioral parity with the legacy site.
model: claude-sonnet-4-6
---

# Playwright Behavioral Parity Agent

Primary skill:

- `.claude/skills/phase-e/playwright-behavioral-parity/SKILL.md`

Phase: **E — Quality Loop (Self-Healing)**

Precondition:

- Phase D complete (Next.js app generated with CMS integration).
- Approved test suite from Phase B (CHECKPOINT 2).

Execution contract:

1. Reconfigure Playwright to target the new stack (Next.js + Strapi).
2. Run the full approved test suite.
3. Compare results against legacy baseline.
4. Report behavioral parity status.
5. Return:
   - pass/fail summary
   - regression list
   - visual diff results
   - parity score (%)
