---
description: "Phase C — CMS Provisioning: Generate Strapi 5 schemas from the approved content model, bootstrap the Strapi project, run the content ETL pipeline, and validate the GraphQL layer."
argument-hint: "<site-slug>"
---

## Phase C — CMS Provisioning

Run this phase **after Phase A is complete and `APPROVED.md` exists**.
The approved Content Model Spec from Phase A drives schema generation and content loading.

### Skills Used (in order)

1. `.claude/skills/PC-cms/strapi-schema-generator/SKILL.md` — generate Strapi 5 JSON schemas from the approved spec
2. `.claude/skills/PC-cms/strapi-bootstrapper/SKILL.md` — initialise Strapi 5 project, apply schemas, enable GraphQL
3. `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md` — extract, transform, load content with media optimisation
4. `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md` — introspect schema, run graphql-codegen, verify types

Arguments: $ARGUMENTS

---

## Step 1 — Preconditions

1. Verify all four skill files listed above are readable.
2. Validate the site slug argument. If missing, stop and ask: `PC-cms <site-slug>`
3. Confirm `output/<site>/docs/content-model/APPROVED.md` exists. If it does not, **stop** — Phase A must be completed and approved first.
4. Confirm output root: `output/<site>/cms/` (create if absent).

---

## Step 2 — Schema Generation

Follow `strapi-schema-generator` skill:

- Read `output/<site>/docs/content-model/APPROVED.md`
- Generate Strapi 5 JSON schema files for every content type in the approved spec
- Write schemas to `output/<site>/cms/schemas/`

After generation, report:

- Total schemas generated
- Any content types with missing or ambiguous field mappings
- Path to generated schema directory

---

## Step 3 — Strapi Bootstrap

Follow `strapi-bootstrapper` skill:

- Initialise a Strapi 5 project in `output/<site>/cms/`
- Apply all generated schemas from Step 2
- Enable the GraphQL plugin
- Configure roles and permissions (public read access for content types)
- Run `npm run build` and verify the build succeeds
- Start the dev server and confirm it is reachable

After bootstrap, report:

- Strapi admin URL
- Strapi API base URL
- GraphQL endpoint URL
- Any build warnings or errors

---

## Step 4 — Content ETL Pipeline

Follow `content-etl-pipeline` skill:

- Extract content from the legacy source site
- Transform it to match the Strapi schemas
- Optimise media assets (convert to WebP/AVIF where supported)
- Load all content into the running Strapi instance via REST API
- Verify content parity by spot-checking loaded records against source

After ETL, report:

- Records loaded per content type
- Media assets processed and optimised
- Any content items that failed to load (with reasons)
- Parity verification summary

---

## Step 5 — GraphQL Validation

Follow `graphql-layer-validator` skill:

- Introspect the live Strapi GraphQL schema
- Run `graphql-codegen` to generate TypeScript types from the schema
- Write generated types to `output/<site>/cms/generated/`
- Verify type coverage matches all content types in the approved spec

After validation, report:

- Total types generated
- Any content types missing from the GraphQL schema
- Path to generated TypeScript types

---

## Step 6 — Summary

Present to the user:

- Strapi admin URL, API base URL, GraphQL endpoint
- Records loaded per content type
- Media optimisation stats
- GraphQL type coverage
- Path to `output/<site>/cms/`
- Any unresolved issues

---

## ⛔ STOP — Phase C ends here

**Do NOT proceed to Phase D or Phase E.**

Phase C is a standalone phase. When invoked as `/PC-cms`, it completes after GraphQL validation and stops.

Phase D is only triggered by:

- The `url-to-strapi` orchestrator (which runs Phases A → B → C → D → E in sequence)
- Explicit user invocation: `/PD-frontend`

---

## Acceptance Criteria

Do not mark Phase C complete until all are true:

- [ ] `output/<site>/docs/content-model/APPROVED.md` confirmed present before starting
- [ ] Strapi 5 JSON schemas generated for all approved content types
- [ ] Strapi project initialised in `output/<site>/cms/`
- [ ] GraphQL plugin enabled
- [ ] Strapi build succeeds with no blocking errors
- [ ] Strapi dev server starts and is reachable
- [ ] All content loaded via ETL pipeline
- [ ] Media assets optimised (WebP/AVIF)
- [ ] GraphQL schema introspected — TypeScript types generated
- [ ] Type coverage verified against approved content model
- [ ] All artifacts confined to `output/<site>/cms/`
- [ ] Phase C stopped — Phase D was NOT triggered
