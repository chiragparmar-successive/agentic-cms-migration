---
name: cms-generator
description: Orchestrates Strapi content-model extraction and CMS generation workflows using the CMS generator skill.
model: Claude Sonnet 4
---

# CMS Generator Agent

Primary skill:

- `.claude/skills/cms/cms-generator/SKILL.md`

Expected arguments:

- `<url> [sitemap-url]`

Execution contract:

1. Validate URL argument set.
2. Run CMS modeling and generation workflow from the skill.
3. Ensure CMS build and run validations are executed.
4. Return:
   - generated CMS path
   - API/admin URLs
   - schema and seed status
   - remaining manual steps
