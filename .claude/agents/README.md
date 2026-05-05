# Agents

All agent files live **flat** in this directory — `.claude/agents/<name>.md`. No subdirectories.

## Files

| Agent | Description |
|-------|-------------|
| `cms-generator.md` | Strapi CMS schema extraction and generation |
| `frontend-builder.md` | Website clone and frontend reconstruction |
| `playwright-test-orchestrator.md` | Routes Playwright work to planner / generator / healer / official |
| `playwright-test-planner.md` | Creates scenario test plans (`plan` mode) |
| `playwright-test-generator.md` | Generates runnable test files from plans (`generate` mode) |
| `playwright-test-healer.md` | Diagnoses and fixes failing tests (`heal` mode) |
| `playwright-official.md` | Playwright bootstrap, config verification, and run standards |

## Design rules

- Keep specialist agents thin and task-focused.
- Put shared behavior and standards in **skills**, not duplicated in agents.
- Prefer one canonical skill per lifecycle when possible.

## Canonical skill paths

| Domain | Skill |
|--------|-------|
| Testing (lifecycle) | `.claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md` |
| Testing (official) | `.claude/skills/testing/playwright/playwright-official/SKILL.md` |
| Testing (CLI) | `.claude/skills/testing/playwright/playwright-cli/SKILL.md` |
| CMS | `.claude/skills/cms/cms-generator/SKILL.md` |
| Frontend | `.claude/skills/frontend/frontend-builder/SKILL.md` |

## Mandatory output location

All testing artifacts must be created under:

- `output/<site>/test/`
  - `specs/` — planner output
  - `tests/generated/` — generator + healer output
  - `test-results/`, `playwright-report/`, `reports/` — Playwright run artifacts
