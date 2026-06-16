---
description: WordPress → Strapi full-stack partial E2E (default) — CMS analysis/schema + Playwright + Next.js + quality gates.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests]"
---

## `/wordpress-to-strapi`

Run full end-to-end by default: schema/CMS setup in Phase W, **content load via Phase C ETL**, then frontend + quality phases.

This is the only canonical entrypoint for initial project bootstrapping.

### Canonical entrypoint order

1. Command contract: `.claude/commands/wordpress-to-strapi.md`
2. Canonical agents map: `.claude/agents/wordpress-to-strapi/AGENT.md`
3. Common phase index: `.claude/agents/common/phases.md`

### Agent

update

- `.claude/agents/wordpress-to-strapi/AGENT.md`

### Arguments

`$ARGUMENTS` — WordPress URL; optional `--cms-only`, `--skip-tests`.

Site slug must be derived dynamically from the provided URL hostname (lowercase, dots replaced with `-`).

### Flow

`W -> C (ETL) -> B -> D -> E` — see `.claude/agents/wordpress-to-strapi/AGENT.md`

### Modeling rule (Strapi-first)

Do **not** copy the WordPress storage shape into Strapi. Never map `post_content`/page-builder/ACF wysiwyg HTML to a single `bodyHtml`/`richtext` blob by default. Forget the WordPress structure and model content as if designing Strapi from scratch — decompose HTML into typed fields, components, and dynamic zones; keep `richtext` only for genuine flowing prose (e.g., a blog article body). This is hard rule 9 in `AGENT.md` and is reviewed at CHECKPOINT WP-1.

If the URL is missing, stop and ask exactly:

`/wordpress-to-strapi <wordpress-url>`
