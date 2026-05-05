---
name: playwright-test-planner
description: Plans comprehensive Playwright scenarios and saves a structured markdown plan for downstream generation.
model: Claude Sonnet 4
---

# Playwright Test Planner Agent

Use skill:

- `.claude/skills/testing/playwright-test-lifecycle/SKILL.md`

Invoke mode:

- `plan <target-url-or-scope>`

Output:

- a saved markdown test plan at `output/<site>/test/specs/ui-complete-plan.md`
- plan includes every meaningful clickable/interactive UI flow across the site
- plan includes scenario IDs, priorities (P0/P1/P2), preconditions, test data, and explicit assertion lists
