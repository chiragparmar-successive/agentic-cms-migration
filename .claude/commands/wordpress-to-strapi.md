---
description: Hybrid WordPress → Strapi end-to-end migration — deterministic extract/normalize/import (70%) plus AI only for unknown ACF/Elementor blocks (30%). Optional Next.js frontend and Playwright quality gates.
argument-hint: "<wordpress-url> [--cms-only] [--with-frontend] [--skip-tests]"
---

## `/wordpress-to-strapi`

**Cursor slash command:** `/wordpress-to-strapi https://yoursite.com`  
Optional flags: `--cms-only`, `--with-frontend`, `--skip-tests`

Runs the **hybrid migration orchestrator** — separate from `/fullstack-builder` (generic legacy URL pipeline).

### Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

### Core principle

**AI suggests. Code executes.**

Scripts handle extraction, normalization, schema generation, and content import. AI runs only for structures flagged in `unknown-blocks.json`.

### Standalone scripts (recommended workflow)

**Step 1 — Schema (once):**

```bash
node scripts/wp-migration/generate-schema.mjs <site-slug>
```

**Step 2 — Data sync (run anytime, repeatable):**

```bash
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
  node scripts/wp-migration/import-to-strapi.mjs <site-slug> [wordpress-url] [--refresh]
```

**Prepare WP data:**

```bash
node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> all
```

See `scripts/wp-migration/README.md` for full details.

### Arguments

`$ARGUMENTS` — WordPress URL plus optional flags listed above.

If the URL is missing, stop and ask:

`/wordpress-to-strapi <wordpress-url> [--cms-only] [--with-frontend] [--skip-tests]`
