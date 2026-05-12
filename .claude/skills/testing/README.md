# Testing skills

All Playwright-related skills live under **`playwright/`** so this domain can grow (e.g. other runners) without mixing folders at the `testing/` root.

## Skills

| Folder | Role | User-invocable |
|--------|------|----------------|
| `playwright/playwright-test-lifecycle/` | Canonical **plan → generate → heal** lifecycle. | No |
| `playwright/playwright-official/` | Official runner/config baseline; `bootstrap` / `verify` / `run`. | No |
| `playwright/playwright-cli/` | Standalone **playwright-cli** command reference + `references/`; optional interactive debugging. | No |
| `playwright/playwright-exploratory/` | Crawl every link on a site, capture visual + text baseline, generate a replayable smoke spec. Modes: `crawl <url>` / `replay <site-slug>`. | Yes |
| `playwright/playwright-pom/` | Page Object Model conventions — canonical structure all generated test files must follow. Not invoked directly; read by generator and healer agents. | No |

## Skill relationships

```
playwright-exploratory (crawl)
        │  produces route inventory
        ▼
playwright-test-lifecycle (plan → generate → heal)
        │  generates spec files that follow
        ▼
playwright-pom (POM structure & conventions)
        │  specs run via
        ▼
playwright-official (runner config & bootstrap)
```

## Path convention

Full paths always include the `playwright/` segment, for example:

- `.claude/skills/testing/playwright/playwright-test-lifecycle/SKILL.md`
- `.claude/skills/testing/playwright/playwright-pom/SKILL.md`

Agents that use these skills live under `.claude/agents/testing/playwright/`.
