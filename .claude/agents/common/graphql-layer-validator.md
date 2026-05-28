---
name: graphql-layer-validator
description: Validates the Strapi GraphQL layer by introspecting the schema and running graphql-codegen to generate TypeScript types.
model: claude-sonnet-4-6
---

# GraphQL Layer Validator Agent

Primary skill:

- `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md`

Phase: **C — CMS Provisioning**

Precondition:

- Strapi running with content seeded (from `content-etl-pipeline`).

Execution contract:

1. Introspect Strapi GraphQL endpoint.
2. Validate all content types are exposed in the schema.
3. Run graphql-codegen to generate TypeScript types.
4. Verify generated types match content model spec.
5. Output types to `output/<site>/frontend/src/generated/graphql.ts`.
6. Return:
   - GraphQL schema validation status
   - generated types file path
   - type coverage report
