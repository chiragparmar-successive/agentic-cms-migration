---
description: WordPress → Strapi data-only full migration. No content modeling — imports complete WP dataset into existing Strapi schemas after /wordpress-to-strapi.
argument-hint: "<wordpress-url> [--import]"
---

## `/wp-to-strapi-dn-migration`

**Data-only migration** — pulls **all** WordPress content and imports it into Strapi.

| Step | Included |
|------|----------|
| Full WordPress extract + normalize | Yes |
| Detect / review / generate-schema | **No** |
| Import full dataset | Yes (`--import`) |

**Prerequisite:** `/wordpress-to-strapi` finished (schemas exist, partial data reviewed).

Uses `wp-migration/full/` — separate from partial E2E data in `wp-migration/preview/`.

### Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md` — **Data-only migration** section

### Script

```bash
node scripts/wp-migration/wp-to-strapi-dn-migration.mjs <site-slug> <wordpress-url> --import
```

### Arguments

`$ARGUMENTS` — WordPress URL (required). Optional `--import` when `STRAPI_URL` and `STRAPI_API_TOKEN` are set.

If the URL is missing, stop and ask:

`/wp-to-strapi-dn-migration <wordpress-url>`
