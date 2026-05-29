---
name: wp-data-migration
description: Full WordPress → Strapi data migration with default upsert import, per-record emoji logging, file logs, failed-import retry, and verification.
argument-hint: "<site-slug>"
user-invocable: true
---

# WordPress full data migration

## Architecture

| Location | Responsibility |
|----------|----------------|
| `scripts/wp-migration/lib/*` | **Shared engine** (extract, normalize, upsert, verify, retry) |
| `output/<site>/wp-migration/*` | **Project-specific** config, runners, data, logs |

Runners in output are **thin wrappers** only — they import the shared engine.

## Preconditions

- `output/<site>/wp-migration/site-config.json`
- Strapi running with schemas + `wpId` fields
- `output/<site>/frontend/.env.local` with `STRAPI_GRAPHQL_URL` + `STRAPI_API_TOKEN` (auto-loaded)

## Commands

```bash
cd output/<site>/wp-migration

# Default: extract + normalize + upsert + verify
node run-full-migration.mjs

# Extract/normalize JSON only (no Strapi writes)
node run-full-migration.mjs --extract-only

# Verify counts only
node run-full-migration.mjs --verify

# Retry items in failed-imports.json
node run-retry-failed.mjs
```

## Artifacts (per site, under output)

| File | Purpose |
|------|---------|
| `full/normalized/content.json` | Normalized WordPress data |
| `full/sync/id-map.json` | WordPress id → Strapi id |
| `full/sync/import-log.json` | Structured stats + errors + verification |
| `full/sync/failed-imports.json` | **Failed records** with `source`, `payload`, `error` for retry |
| `full/sync/migration-run.log` | **Full text log** (emoji lines, timestamps) |

## Behavior

- **Upsert** by `wpId` for all entities; media skips when already in id-map
- Console + `migration-run.log`: `✅` created/updated, `⏭️` skipped, `❌` failed
- Exit `1` on import errors or failed verification
- Fix failures → `node run-retry-failed.mjs` (rewrites `failed-imports.json` with remaining failures)

## Output contract

- [ ] `node run-full-migration.mjs` exits `0`
- [ ] `full/sync/failed-imports.json` → `meta.count` is `0`
- [ ] `full/sync/import-log.json` → `verification.passed` is `true`
