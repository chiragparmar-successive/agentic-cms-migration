---
description: "Phase E — Quality Loop: Frontend visual look-alike gate (screenshots + content), Playwright parity, SonarQube, Lighthouse CI, with AI self-healing up to 5 iterations."
argument-hint: "<site-slug>"
---

## `/PE-quality` (PE — Quality Loop)

This command is the phase-level contract only.

### Canonical entrypoint order

1. Command contract: `.claude/commands/PE-quality.md`
2. Canonical agents map: `.claude/agents/PE-quality/AGENT.md`
3. Skill implementation:
   - `.claude/skills/PE-quality/frontend-visual-parity/SKILL.md`
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
