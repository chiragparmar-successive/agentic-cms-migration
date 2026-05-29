# WordPress → Strapi Migration Engine

## Architecture

| Path | Role |
|------|------|
| `scripts/wp-migration/lib/*` | Shared migration engine (all sites) |
| `output/<site>/wp-migration/*` | Per-site config, runners, normalized data, logs |

Generated runners under `output/<site>/wp-migration/` are thin wrappers that import `scripts/wp-migration/lib/*`.

## Initial setup

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
```

Creates `site-config.json`, `run-full-migration.mjs`, and `run-retry-failed.mjs`.

## Full data migration (default imports)

```bash
cd output/<site>/wp-migration
node run-full-migration.mjs
```

| Flag | Effect |
|------|--------|
| _(default)_ | Extract + normalize + **upsert** + verify |
| `--extract-only` | WordPress JSON only — no Strapi writes |
| `--verify` | Count verification only |

```bash
node run-retry-failed.mjs   # retry full/sync/failed-imports.json
```

Env: `STRAPI_URL` + `STRAPI_API_TOKEN`, or auto-load from `../frontend/.env.local`.

## Per-site artifacts

- `full/sync/migration-run.log` — full text log (`✅` / `❌` / `⏭️`)
- `full/sync/import-log.json` — structured results + verification
- `full/sync/failed-imports.json` — failed `source` + `payload` for retry
- `full/sync/id-map.json` — WordPress → Strapi id map

Skill: `.claude/skills/PA-reverse-engineering/wp-data-migration/SKILL.md`

## Project-specific hooks

`output/<site>/wp-migration/site-config.json` → `hooks` → `output/<site>/wp-migration/scripts/*.mjs`
