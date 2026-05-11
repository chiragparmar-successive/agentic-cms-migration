# Skills layout

Skills are grouped by **domain** first, then by **skill name**. Entry point for each skill is always **`SKILL.md`** in its folder.

## Tree (summary)

```text
.claude/skills/
  README.md
  cms/
    cms-generator/
      SKILL.md
  frontend/
    frontend-builder/
      SKILL.md
    vercel/                         # read-only vendored packs (see skills-lock.json)
      cra-to-next-migration/
      next-best-practices/
      next-cache-components/
      vercel-composition-patterns/
      vercel-react-best-practices/
  orchestrators/
    fullstack-builder/
      SKILL.md
    playwright-test-gen/
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

## Splitting and layering

- One clear responsibility per skill (one phase or lifecycle segment).
- Consider splitting past ~300–400 lines or when extraction + implementation + QA are mixed.
- Orchestrators stay thin: coordinate child skills, verify contracts, report status.
- Prefer domain folders (`cms`, `frontend`, `testing`) over many top-level feature names.
- Keep vendor/framework guidance under `frontend/vercel/` so orchestration and core skills do not churn with upstream packs.

## Vendored skills

Folders under `frontend/vercel/` are pinned in **`skills-lock.json`** at the repo root. Re-sync from upstream, then update hashes there.
