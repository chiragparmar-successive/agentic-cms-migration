---
name: playwright-test-planner
description: Plans comprehensive Playwright scenarios and saves a structured markdown plan for downstream generation.
model: claude-sonnet-4-6
---

# Playwright Test Planner Agent

Use skill:

- `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`

Invoke mode:

- `plan <target-url-or-scope>`

Output:

- saved markdown plan at `output/<site>/test/specs/ui-complete-plan.md`
- plan covers meaningful interactive UI flows
- plan includes scenario IDs, priorities (P0/P1/P2), preconditions, test data, and explicit assertions
