# Testing skills

All Playwright-related skills in this phase live under **`phase-b/`**, keeping Phase B testing capabilities grouped in one location.

## Skills

| Folder                                  | Role                                                                                                                                                 | User-invocable |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `playwright-test-lifecycle/`            | Canonical **plan → generate → heal** lifecycle.                                                                                                      | No             |
| `playwright-official/`                  | Official runner/config baseline; `bootstrap` / `verify` / `run`.                                                                                     | No             |
| `playwright-cli/`                       | Standalone **playwright-cli** command reference + `references/`; optional interactive debugging.                                                     | No             |
| `playwright-exploratory/`               | Crawl every link on a site, capture visual + text baseline, generate a replayable smoke spec. Modes: `crawl <url>` / `replay <site-slug>`.           | Yes            |
| `playwright-pom/`                       | Page Object Model conventions — canonical structure all generated test files must follow. Not invoked directly; read by generator and healer agents. | No             |

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

Full paths use the `.claude/skills/phase-b/` base, for example:

- `.claude/skills/phase-b/playwright-test-lifecycle/SKILL.md`
- `.claude/skills/phase-b/playwright-pom/SKILL.md`

Agents that use these skills live under `.claude/agents/`.
