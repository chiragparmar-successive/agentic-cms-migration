# Claude workspace

Two layers:

- **`skills/`** — reusable capabilities (what to do)
- **`agents/`** — orchestration entry points (when and how to route work)

Agent files are **flat** in `agents/` (no subdirectories). Skills are grouped by domain under `skills/`.

## Directory tree

```text
.claude/
  README.md
  settings.local.json
  commands/
    fullstack-builder.md              # /fullstack-builder slash command
  agents/
    README.md
    cms-generator.md
    frontend-builder.md
    playwright-official.md
    playwright-test-orchestrator.md
    playwright-test-planner.md
    playwright-test-generator.md
    playwright-test-healer.md
  skills/
    README.md
    cms/
      cms-generator/
        SKILL.md
    frontend/
      frontend-builder/
        SKILL.md
      vercel/                             # vendored packs (tracked in skills-lock.json)
        cra-to-next-migration/
        next-best-practices/
        next-cache-components/
        vercel-composition-patterns/
        vercel-react-best-practices/
    orchestrators/
      fullstack-builder/
        SKILL.md
    testing/
      README.md
      playwright/
        playwright-cli/
          SKILL.md
          references/
        playwright-official/
          SKILL.md
        playwright-test-lifecycle/
          SKILL.md
```

## Conventions

- **Slash commands:** `commands/<name>.md` — Claude Code reads this directory to populate `/` suggestions.
- **Agents are flat:** `agents/<name>.md` — no subdirectories, no `.agent.md` suffix.
- **Model IDs:** use canonical IDs (`claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`).
- **One skill, one folder:** `skills/<domain>/<skill-name>/SKILL.md`.
- **Orchestrators** live only under `skills/orchestrators/` (pipeline coordination, not a separate agent domain).
- **Vendor rules** stay under `skills/frontend/vercel/` so core skills stay stable.

## Operating rules

- Add new reusable behavior under `skills/<domain>/<skill-name>/SKILL.md`.
- Add new agents as `agents/<name>.md` (flat).
- Keep specialist agents thin; keep framework rules in skills.
- Prefer one canonical skill per tightly coupled lifecycle (e.g. `playwright-test-lifecycle` for plan / generate / heal).
- `playwright-cli` is a **standalone** CLI reference under `skills/testing/playwright/`; it is not part of the planner → generator → healer chain but can be used for interactive debugging.
