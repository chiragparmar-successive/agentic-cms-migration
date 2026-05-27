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
