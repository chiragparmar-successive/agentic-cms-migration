# Agents Folder Structure

Use this structure for agent orchestration:

```text
.claude/agents/
  README.md
  frontend/
    README.md
    frontend-builder.agent.md
  cms/
    README.md
    cms-generator.agent.md
  testing/
    README.md
    playwright-test-orchestrator.agent.md
    playwright-official.agent.md
    playwright-test-planner.agent.md
    playwright-test-generator.agent.md
    playwright-test-healer.agent.md
```

## Design Rules

- Keep orchestration in one top-level agent per domain.
- Keep specialist agents thin and task-focused.
- Put shared behavior and standards in skills, not duplicated in agents.
- Prefer one canonical skill per lifecycle when possible.

## Current Canonical Skill

- `.claude/skills/testing/playwright-test-lifecycle/SKILL.md`
  - Modes: `plan`, `generate`, `heal`
