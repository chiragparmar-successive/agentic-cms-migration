# WordPress → Strapi Migration Engine

**Two standalone steps** you can run separately — including re-running import later.

| Step | Script | What it does |
|------|--------|----------------|
| **1. Schema** | `generate-schema.mjs` | WordPress structure → Strapi `schema.json` files |
| **2. Data sync** | `import-to-strapi.mjs` | WordPress content → running Strapi (repeatable) |

Principle: **AI suggests. Code executes.**

---

## One-time setup (per site)

```bash
cd /Users/inno/Downloads/agentic-cms-migration

SITE=wordpress-zcwowkggsk4k08cgsgwo4c8w-sakha-cloud
WP_URL=https://wordpress-zcwowkggsk4k08cgsgwo4c8w.sakha.cloud/

# Pull WordPress data + analyze structure
node scripts/wp-migration/pipeline.mjs "$SITE" "$WP_URL" all
```

---

## Step 1 — Schema transfer (run once, or when WP structure changes)

```bash
node scripts/wp-migration/generate-schema.mjs "$SITE"
```

Writes Strapi schemas to:

- `output/<site>/cms/src/api/` (if Strapi project exists), or
- `output/<site>/wp-migration/strapi-schemas/api/` (fallback)

Manifest: `output/<site>/wp-migration/strapi-schemas/SCHEMA-MANIFEST.json`

Then **restart Strapi** so it loads new content types:

```bash
cd output/<site>/cms && npm run develop
```

---

## Step 2 — Data transfer (run anytime, as often as you need)

Strapi must be running. Create an API token in Strapi admin (Settings → API Tokens, full access).

```bash
export STRAPI_URL=http://localhost:1337
export STRAPI_API_TOKEN=your-token

node scripts/wp-migration/import-to-strapi.mjs "$SITE"
```

**Re-fetch WordPress, then sync again** (e.g. next day):

```bash
node scripts/wp-migration/import-to-strapi.mjs "$SITE" "$WP_URL" --refresh
```

### How repeat runs work

- Each row has a stable `wpId` field in Strapi.
- Script loads `output/<site>/wp-migration/sync/id-map.json`.
- Existing `wpId` → **UPDATE**; new `wpId` → **CREATE**.
- Safe to run daily/weekly without duplicating posts.

Logs: `output/<site>/wp-migration/sync/import-log.json`

---

## Other commands

```bash
# Validate AI component suggestions
node scripts/wp-migration/validate-ai.mjs <site-slug>

# Individual pipeline steps
node scripts/wp-migration/pipeline.mjs <site-slug> <wp-url> extract|normalize|detect|review
```

## Environment

Copy `scripts/wp-migration/.env.example` — set `STRAPI_URL` and `STRAPI_API_TOKEN` for imports.

Requires Node.js 18+.

## Cursor orchestration

For guided end-to-end flow with checkpoints:

```
/wordpress-to-strapi https://wordpress-zcwowkggsk4k08cgsgwo4c8w.sakha.cloud/ --cms-only
```

That command uses these scripts for schema + import.
