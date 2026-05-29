---
name: wordpress-to-strapi
description: WordPress → Strapi engine for structure analysis, schema generation, and CMS bootstrap. Content loading uses content-etl-pipeline (Phase C).
---

# WordPress → Strapi Agent

## Commands

- `/wordpress-to-strapi`

## Key scripts

- `scripts/wp-migration/wordpress-to-strapi.mjs` — bootstrap (extract, detect, schema generation)
- `scripts/wp-migration/pipeline.mjs` — extract / normalize / detect / review
- `scripts/wp-migration/generate-schema.mjs` — apply Strapi schemas from analysis

## Content loading

Use **Phase C** — `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`.

## Project output

- `output/<site>/wp-migration/site-config.json`
- `output/<site>/wp-migration/preview/` — sample extract/normalize artifacts
- `output/<site>/wp-migration/analysis/`
