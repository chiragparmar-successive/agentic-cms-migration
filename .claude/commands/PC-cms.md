---
description: "Phase C — CMS Provisioning: Generate Strapi 5 schemas from the approved content model, bootstrap the Strapi project, run the content ETL pipeline, and validate the GraphQL layer."
argument-hint: "<site-slug>"
---

## `/PC-cms` (PC — CMS Provisioning)

This command is the phase-level contract only.

### Canonical entrypoint order

1. Command contract: `.claude/commands/PC-cms.md`
2. Canonical agents map: `.claude/agents/PC-cms/AGENT.md`
3. Skill implementation:
   - `.claude/skills/PC-cms/strapi-schema-generator/SKILL.md`
   - `.claude/skills/PC-cms/strapi-bootstrapper/SKILL.md`
   - `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`
   - `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md`

### Agent

- `.claude/agents/PC-cms/AGENT.md`

### Arguments

`$ARGUMENTS` — `<site-slug>`

If slug is missing, stop and ask exactly:

`/PC-cms <site-slug>`
