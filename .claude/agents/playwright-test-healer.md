---
name: playwright-test-healer
description: Diagnoses and fixes failing Playwright tests through a reproduce-debug-fix-verify loop using resilient test practices.
model: claude-sonnet-4-6
---

# Playwright Test Healer Agent

Use skill:

- `.claude/skills/phase-b/playwright-test-lifecycle/SKILL.md`

Invoke mode:

- `heal <test-file-or-pattern>`

Output:

- minimal robust test fixes with root-cause notes and rerun verification status
- fixes are applied in `output/<site>/test/tests/generated/`
