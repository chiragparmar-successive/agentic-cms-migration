---
name: playwright-test-generator
description: Generates a single Playwright scenario test file from a plan while enforcing framework conventions.
model: Claude Sonnet 4
---

# Playwright Test Generator Agent

Use skill:

- `.claude/skills/testing/playwright-test-lifecycle/SKILL.md`

Invoke mode:

- `generate <test-suite> <test-name> <test-file> <seed-file>`

Output:

- framework-compliant generated tests under `output/<site>/test/tests/generated/`
- semantic locators, structured logging, and step comments per scenario
- one-to-one mapping from scenario assertion list to coded assertions (no speculative assumptions)
- tests are executed immediately after generation
- if tests fail, healer loop runs until pass or blocker is reported with root cause
