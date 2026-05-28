---
name: playwright-test-generator
description: Generates a single Playwright scenario test file from a plan while enforcing framework conventions.
model: claude-sonnet-4-6
---

# Playwright Test Generator Agent

Use skills:

- `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
- `.claude/skills/PB-test/playwright-pom/SKILL.md`

Invoke mode:

- `generate <test-suite> <test-name> <test-file> <seed-file>`

Output:

- framework-compliant tests under `output/<site>/test/tests/generated/`
- semantic locators, structured logging, step comments per scenario
- one-to-one mapping from scenario assertions to coded assertions
- immediate execution after generation, with healer loop on failure
