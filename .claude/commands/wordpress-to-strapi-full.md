---
description: Standalone full WordPress → Strapi data migration (command 2). Not a sync of preview — separate profile, paths, and import. Run after /wordpress-to-strapi and WP-1/WP-2 approval.
argument-hint: "<wordpress-url> [--import]"
---

## `/wordpress-to-strapi-full`

**Not a sync.** This is a **separate migration command** that:

- Re-extracts **all** WordPress REST data into `wp-migration/full/`
- Imports using `full/sync/id-map.json` only (never reads preview sync state)
- Reuses Strapi **schemas** from command 1 (`/wordpress-to-strapi`)

### Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md` — **Command 2 — Full migration**

### Script

```bash
node scripts/wp-migration/migrate-full.mjs <site-slug> <wordpress-url> --import
```

Import only (after extract step already ran):

```bash
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
  node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>
```

### Arguments

`$ARGUMENTS` — WordPress URL (required). Optional `--import`.

If URL is missing, stop and ask:

`/wordpress-to-strapi-full <wordpress-url>`
