# Testing skills

All Playwright-related skills live under **`playwright/`** so this domain can grow (e.g. other runners) without mixing folders at the `testing/` root.

## Skills

| Folder | Role |
|--------|------|
| `playwright/playwright-test-lifecycle/` | Canonical **plan → generate → heal** lifecycle (`SKILL.md`). |
| `playwright/playwright-official/` | Official runner/config baseline; `bootstrap` / `verify` / `run`. |
| `playwright/playwright-cli/` | Standalone **playwright-cli** command reference + `references/`; optional interactive debugging. |

## Path convention

Full paths always include the `playwright/` segment, for example:

- `.claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md`

Agents that use these skills live under `.claude/agents/testing/playwright/`.
