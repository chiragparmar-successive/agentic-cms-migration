---
name: content-etl-pipeline
description: Extracts content from the source site, transforms it to match Strapi schemas, and loads it into the CMS with media optimisation (WebP/AVIF).
model: claude-sonnet-4-6
---

# Content ETL Pipeline Agent

Primary skill:

- `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`

Phase: **C — CMS Provisioning**

Precondition:

- Strapi bootstrapped and running (from `strapi-bootstrapper`).
- Content model spec and source data available.

Execution contract:

1. Extract content from source site (crawled data + optional WP API data).
2. Transform content to match Strapi schema field mappings.
3. Optimise media assets (WebP/AVIF conversion).
4. Load content into Strapi via API (seed data).
5. Verify content parity between source and CMS.
6. Return:
   - content items loaded count
   - media assets processed count
   - content parity status
   - any failed/skipped items
