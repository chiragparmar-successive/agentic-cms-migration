# WordPress → Strapi Migration Engine

Two **separate commands** with **isolated data directories** — full migration is not a sync of preview.

| | Command 1 | Command 2 |
|---|-----------|-----------|
| **Purpose** | Content model + preview rows in Strapi | Migrate entire WordPress site |
| **Cursor** | `/wordpress-to-strapi` | `/wordpress-to-strapi-migrate` |
| **Script** | `migrate-sample.mjs` | `migrate-full.mjs` |
| **WP data** | `wp-migration/preview/` | `wp-migration/full/` |
| **Strapi state** | `preview/sync/id-map.json` | `full/sync/id-map.json` |
| **Schemas** | Generated from preview analysis | Reuses preview schemas |

Principle: **AI suggests. Code executes.**

---

## Command 1 — Preview (content model + sample data)

```bash
SITE=your-site-slug
WP_URL=https://yoursite.com/

node scripts/wp-migration/migrate-sample.mjs "$SITE" "$WP_URL"

cd output/$SITE/cms && npm run develop

export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your-token
node scripts/wp-migration/migrate-sample.mjs "$SITE" "$WP_URL" --import
```

Preview caps: 5 posts, 3 pages, 10 categories, 5 tags, 5 media, 2 users (`lib/sample-limits.mjs`).

**Artifacts (preview only):**

- `wp-migration/preview/raw/wp-export.json`
- `wp-migration/preview/normalized/content.json`
- `wp-migration/analysis/` — structure from preview (shared, used for schemas)
- `wp-migration/review/REVIEW-MAPPING.md` — WP-1 checkpoint

---

## Command 2 — Full migration (standalone)

Run only after WP-1 / WP-2 approve the content model and preview data.

```bash
node scripts/wp-migration/migrate-full.mjs "$SITE" "$WP_URL" --import
```

Or in two steps:

```bash
node scripts/wp-migration/migrate-full.mjs "$SITE" "$WP_URL"
STRAPI_URL=... STRAPI_API_TOKEN=... \
  node scripts/wp-migration/import-full-to-strapi.mjs "$SITE"
```

**Artifacts (full only):**

- `wp-migration/full/raw/wp-export.json`
- `wp-migration/full/normalized/content.json`
- `wp-migration/full/sync/id-map.json`

Full import matches Strapi rows by `wpId` within the **full** profile only. It does not read preview `id-map.json`.

---

## Low-level scripts

| Script | Profile |
|--------|---------|
| `pipeline.mjs … --preview` | preview (default): extract, normalize, detect, review |
| `pipeline.mjs … --full` | full: extract, normalize only |
| `generate-schema.mjs` | from `analysis/` (preview) |
| `import-preview-to-strapi.mjs` | preview import |
| `import-full-to-strapi.mjs` | full migration import |

`import-to-strapi.mjs` is deprecated.

---

## Environment

Copy `scripts/wp-migration/.env.example`. Requires Node.js 18+.

---

## Cursor

```
/wordpress-to-strapi https://yoursite.com/ --cms-only
```

After checkpoints:

```
/wordpress-to-strapi-migrate https://yoursite.com/
```

Skill: `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`
