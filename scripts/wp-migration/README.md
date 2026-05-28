# WordPress → Strapi Migration Engine

## Primary command

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
```

This command initializes a generalized config and generates:

- `output/<site>/wp-migration/site-config.json`
- `output/<site>/wp-migration/run-full-migration.mjs`

## Run full data migration

```bash
node output/<site>/wp-migration/run-full-migration.mjs --import
```

## Engine code (generalized, root)

- `scripts/wp-migration/lib/*`

## Dynamic, per-site output

- `output/<site>/wp-migration/*`

## Project-specific scripts (per-site)

Keep shared engine code in `scripts/wp-migration/lib/*`, and put site-specific behavior in:

- `output/<site>/wp-migration/scripts/*.mjs`

Enable hooks via `output/<site>/wp-migration/site-config.json`:

```json
{
  "hooks": {
    "preNormalize": "scripts/pre-normalize.mjs",
    "postImport": "scripts/post-import.mjs"
  }
}
```

Supported hooks:

- `preExtract`, `postExtract`
- `preNormalize`, `postNormalize`
- `preImport`, `postImport`

Each hook module must `default export` an async function.
