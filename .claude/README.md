# Claude Workspace Layout

This folder is organized into two layers:

- `skills/`: reusable capabilities (what to do)
- `agents/`: orchestration entry points (when/how to do it)

## Current Active Structure

```text
.claude/
  README.md
  settings.local.json
  agents/
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
  skills/
    README.md
    playwright-cli/
      SKILL.md
      references/                # standalone CLI reference docs
    orchestrators/
      fullstack-builder/
        SKILL.md
    frontend/
      frontend-builder/
        SKILL.md
      vercel/                    # vendored Vercel skill packs (read-only)
        vercel-react-best-practices/
          SKILL.md
          AGENTS.md              # compiled long-form reference
          rules/
        vercel-composition-patterns/
          SKILL.md
          AGENTS.md
          rules/
        next-best-practices/
          SKILL.md
          *.md                   # topic pages referenced by SKILL.md
        next-cache-components/
          SKILL.md
        cra-to-next-migration/
          SKILL.md
          rules/
    cms/
      cms-generator/
        SKILL.md
    testing/
      playwright-official/
        SKILL.md
      playwright-test-lifecycle/
        SKILL.md
```

## Operating Rules

- Add new reusable behavior under `skills/<domain>/<skill-name>/SKILL.md`.
- Add workflow routers under `agents/<domain>/`.
- Keep specialist agents thin; keep framework rules in skills.
- Prefer one canonical skill per tightly-coupled lifecycle.
- Vercel guidance lives under `skills/frontend/vercel/` and augments existing flows without replacing orchestrators.
- The `skills/playwright-cli/` skill is a standalone CLI reference; it is not part of the planner -> generator -> healer chain but can be consulted for interactive browser automation.
