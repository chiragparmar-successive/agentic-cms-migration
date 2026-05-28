---
description: "Phase B — Test-First Contract: Crawl the legacy site, capture visual baseline, generate a full Playwright test suite, establish a green baseline, and gate on human approval before the suite becomes the immutable behavioral contract for migration."
argument-hint: "<legacy-site-url>"
---

## `/PB-test` (PB — Test-First Contract)

This command is the phase-level contract only.

### Canonical entrypoint order

1. Command contract: `.claude/commands/PB-test.md`
2. Canonical agents map: `.claude/agents/PB-test/AGENT.md`
3. Skill implementation:
   - `.claude/skills/PB-test/playwright-exploratory/SKILL.md`
   - `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
   - `.claude/skills/PB-test/playwright-official/SKILL.md`
   - `.claude/skills/PB-test/playwright-cli/SKILL.md`
   - `.claude/skills/PB-test/playwright-pom/SKILL.md`
   - `.claude/skills/PB-test/playwright-report/SKILL.md`

### Agent

- `.claude/agents/PB-test/AGENT.md`

### Arguments

`$ARGUMENTS` — `<legacy-site-url>`

If URL is missing, stop and ask exactly:

`/PB-test <legacy-site-url>`
