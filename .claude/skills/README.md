# Skills Folder Structure

Use this layout to keep skills modular, discoverable, and easy to compose.

## Current Active Structure

```text
.claude/skills/
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

## Optional Future Split Targets

Use these only when complexity demands additional decomposition.

- `frontend/foundation-extractor`
- `frontend/section-builder`
- `frontend/qa-diff-checker`
- `cms/model-designer`
- `cms/schema-implementer`
- `cms/seed-and-verify`

## Practical Rules For Skill Splitting

- Keep one clear responsibility per skill (single phase or lifecycle segment).
- Split when a skill exceeds about 300-400 lines OR mixes extraction, implementation, and QA in one file.
- Keep orchestrators thin: they coordinate child skills, verify contracts, and report readiness.
- Put reusable prompts/templates in `_shared/` so domain skills stay short.
- Prefer domain folders (`frontend`, `cms`, `orchestrators`) over feature-name sprawl.
- Exception: keep a single lifecycle skill when modes are tightly coupled and share the same conventions/toolchain.
- Keep vendor/framework guidance isolated in subfolders (for example `frontend/vercel`) so core orchestration remains stable.

## Current-to-Target Mapping

- `fullstack-master-builder` -> target home: `orchestrators/fullstack-master-builder`
- `frontend/frontend-generator` -> keep as primary frontend orchestration skill
- `cms/cms-generator` -> keep as primary CMS orchestration skill

## Minimal Next Split (If Needed)

If you want immediate maintainability gains, split in this order:

1. `frontend-generator` -> `foundation-extractor`, `section-builder`, `qa-diff-checker`
2. `cms-generator` -> `model-designer`, `schema-implementer`, `seed-and-verify`
3. Keep `fullstack-master-builder` as a coordinator only

This gives better reuse, parallelization, and easier prompt maintenance without changing behavior.
