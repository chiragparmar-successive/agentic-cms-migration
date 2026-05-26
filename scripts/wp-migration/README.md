# WordPress → Strapi Migration Engine

## Commands

| Cursor command               | Script                          | What runs                                            |
| ---------------------------- | ------------------------------- | ---------------------------------------------------- |
| `/wordpress-to-strapi`       | `wordpress-to-strapi.mjs`       | **E2E partial** — model, schemas, import capped data |
| `/wp-to-strapi-db-migration` | `wp-to-strapi-db-migration.mjs` | **Data only** — full WP import, no modeling          |

---

## 1. `/wordpress-to-strapi` — E2E partial (default: full stack)

**No flags** = CMS + Playwright tests + Next.js frontend + quality gates.

| Flag           | Effect        |
| -------------- | ------------- |
| _(none)_       | W + B + D + E |
| `--cms-only`   | Phase W only  |
| `--skip-tests` | W + D + E     |

```bash
SITE=your-site-slug
WP_URL=https://yoursite.com/

node scripts/wp-migration/wordpress-to-strapi.mjs "$SITE" "$WP_URL"

cd output/$SITE/cms && npm run develop

export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your-token
node scripts/wp-migration/wordpress-to-strapi.mjs "$SITE" "$WP_URL" --import
```

Includes: extract (capped) → normalize → detect → review → `generate-schema.mjs` → partial import.

Data: `wp-migration/preview/`, analysis: `wp-migration/analysis/`.

---

## 2. `/wp-to-strapi-db-migration` — Data only

After WP-1 / WP-2 approval:

```bash
node scripts/wp-migration/wp-to-strapi-db-migration.mjs "$SITE" "$WP_URL" --import
```

Includes: full extract → normalize → import only.  
**Skips:** detect, review, `generate-schema.mjs`.

Data: `wp-migration/full/`.

---

## Low-level imports

| Script                         | When                                |
| ------------------------------ | ----------------------------------- |
| `import-preview-to-strapi.mjs` | Partial rows (command 1)            |
| `import-full-to-strapi.mjs`    | Full dataset (command 2)            |
| `pipeline.mjs … --preview`     | Preview profile steps               |
| `pipeline.mjs … --full`        | Full profile extract/normalize only |

Legacy aliases: `migrate-sample.mjs`, `migrate-full.mjs`.

---

Skill: `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`
