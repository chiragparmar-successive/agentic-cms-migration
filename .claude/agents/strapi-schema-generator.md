---
name: strapi-schema-generator
description: Generates Strapi 5 JSON schema files from the approved canonical content model specification.
model: claude-sonnet-4-6
---

# Strapi Schema Generator Agent

Primary skill:

- `.claude/skills/phase-c/strapi-schema-generator/SKILL.md`

Phase: **C — CMS Provisioning**

Precondition:

- CHECKPOINT 1 cleared (content model spec approved).
- CHECKPOINT 2 cleared (test suite approved).

Expected input:

- Approved Content Model Spec from Phase A

Execution contract:

1. Read canonical content model spec.
2. Generate Strapi 5 schema.json files for all collection types and single types.
3. Generate Strapi component definitions.
4. Create controller, route, and service files per content type.
5. Return:
   - generated schema file paths
   - content type count (collection + single + components)
   - field count
