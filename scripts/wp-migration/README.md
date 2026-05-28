# WordPress → Strapi Migration Engine

## Primary command

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
```

This command initializes a generalized config and generates:

- `output/<site>/wp-migration/site-config.json`
- `output/<site>/wp-migration/run-full-migration.mjs`

Use this only for initial setup/bootstrap when URL is required.

## Run full data migration

```bash
cd output/<site>/wp-migration
node run-full-migration.mjs --import
```

This is the project-specific rerun path and does not require passing the WordPress URL again.

## Engine code (generalized, root)

- `scripts/wp-migration/lib/*`

## Dynamic, per-site output

- `output/<site>/wp-migration/*`

## Entry and ownership model

- Command-only entrypoint for initial run: `/wordpress-to-strapi <wordpress-url>`
- Common/shared logic stays in `scripts/wp-migration/*`
- Project-specific runtime and overrides stay in `output/<site>/wp-migration/*`

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
