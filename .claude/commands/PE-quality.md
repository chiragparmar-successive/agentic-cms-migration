---
description: "Phase E — Quality Loop: Run the approved Playwright behavioral parity suite, SonarQube code quality gate, and Lighthouse CI performance gate against the new stack, with AI self-healing up to 5 iterations before escalating."
argument-hint: "<site-slug>"
---

## `/PE-quality` (PE — Quality Loop)

This command is the phase-level contract only.

### Canonical entrypoint order

1. Command contract: `.claude/commands/PE-quality.md`
2. Canonical agents map: `.claude/agents/PE-quality/AGENT.md`
3. Skill implementation:
   - `.claude/skills/PE-quality/playwright-behavioral-parity/SKILL.md`
   - `.claude/skills/PE-quality/sonarqube-gate/SKILL.md`
   - `.claude/skills/PE-quality/lighthouse-ci-gate/SKILL.md`
   - `.claude/skills/PE-quality/ai-remediation-agent/SKILL.md`

### Agent

- `.claude/agents/PE-quality/AGENT.md`

### Arguments

`$ARGUMENTS` — `<site-slug>`

If slug is missing, stop and ask exactly:

`/PE-quality <site-slug>`
