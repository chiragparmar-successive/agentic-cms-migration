# Skills Folder Structure

Use this layout to keep skills modular, discoverable, and easy to compose.

## Current Active Structure

```text
.claude/skills/
  README.md
  playwright-cli/                # standalone CLI reference (not in lifecycle chain)
    SKILL.md
    references/
  orchestrators/
    fullstack-builder/
      SKILL.md                   # plan -> CMS -> frontend -> test/heal loop
  frontend/
    frontend-builder/
      SKILL.md                   # canonical Next.js implementation flow
    vercel/                      # vendored Vercel skill packs (read-only)
      vercel-react-best-practices/
        SKILL.md
        AGENTS.md                # compiled long-form reference
        rules/
      vercel-composition-patterns/
        SKILL.md
        AGENTS.md
        rules/
      next-best-practices/
        SKILL.md
        *.md                     # topic pages referenced by SKILL.md
      next-cache-components/
        SKILL.md
      cra-to-next-migration/
        SKILL.md
        rules/
  cms/
    cms-generator/
      SKILL.md                   # Strapi schema + seed (no frontend)
  testing/
    playwright-official/
      SKILL.md                   # official Playwright baseline wrapper
    playwright-test-lifecycle/
      SKILL.md                   # plan / generate / heal modes
```

## Practical Rules For Skill Splitting

- Keep one clear responsibility per skill (single phase or lifecycle segment).
- Split when a skill exceeds ~300-400 lines OR mixes extraction, implementation, and QA in one file.
- Keep orchestrators thin: they coordinate child skills, verify contracts, and report readiness.
- Prefer domain folders (`frontend`, `cms`, `orchestrators`) over feature-name sprawl.
- Exception: keep a single lifecycle skill when modes are tightly coupled and share the same conventions/toolchain (e.g. `playwright-test-lifecycle`).
- Keep vendor/framework guidance isolated in subfolders (e.g. `frontend/vercel/`) so core orchestration remains stable.

## Vendored Skills

Skills under `frontend/vercel/` are vendored read-only copies tracked by `skills-lock.json` at the repo root. To re-sync, run the upstream build (`pnpm install && pnpm build`) in the source repo and copy the resulting `SKILL.md`, `AGENTS.md`, and `rules/` back into the matching folder here, then update the hash in `skills-lock.json`.
