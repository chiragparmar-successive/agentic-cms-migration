---
name: playwright-test-healer
description: Diagnoses and fixes failing Playwright tests through a reproduce-debug-fix-verify loop using resilient test practices.
model: claude-sonnet-4-6
---

# Playwright Test Healer Agent

Use skills:

- `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
- `.claude/skills/PB-test/playwright-pom/SKILL.md`

Invoke mode:

- `heal <test-file-or-pattern>`

Output:

- minimal, robust test fixes with root-cause notes and rerun status
- fixes applied in `output/<site>/test/tests/generated/`
