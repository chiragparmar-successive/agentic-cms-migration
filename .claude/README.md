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
      playwright-test-planner.agent.md
      playwright-test-generator.agent.md
      playwright-test-healer.agent.md
  skills/
    README.md
    orchestrators/
      fullstack-master-builder/
        SKILL.md
      turborepo/
        SKILL.md
    frontend/
      frontend-generator/
        SKILL.md
      vercel/
        vercel-react-best-practices/
          AGENTS.md
        vercel-composition-patterns/
          SKILL.md
        next-best-practices/
          SKILL.md
        next-cache-components/
          SKILL.md
        cra-to-next-migration/
          SKILL.md
    cms/
      cms-generator/
        SKILL.md
    testing/
      playwright-test-lifecycle/
        SKILL.md
```

## Operating Rules

- Add new reusable behavior under `skills/<domain>/<skill-name>/SKILL.md`.
- Add workflow routers under `agents/<domain>/`.
- Keep specialist agents thin; keep framework rules in skills.
- Prefer one canonical skill per tightly-coupled lifecycle.
- Vercel guidance lives under `skills/frontend/vercel/` and augments existing flows without replacing orchestrators.
