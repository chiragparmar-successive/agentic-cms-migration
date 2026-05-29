# WordPress → Strapi (analysis + schema)

## Primary command

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
```

Initializes:

- `output/<site>/wp-migration/site-config.json`
- Preview extract / normalize / detect / review under `wp-migration/preview/`
- Generated Strapi schemas under `output/<site>/cms/`

Use `/wordpress-to-strapi <url>` for the full orchestrated flow (Phases W → C → B → D → E).

## Content loading (Phase C)

Load WordPress content into Strapi via `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`.

## Architecture

| Path | Role |
|------|------|
| `scripts/wp-migration/lib/*` | Shared engine (extract, normalize, detect, schema) |
| `output/<site>/wp-migration/*` | Per-site config, preview data, analysis |

## Per-site artifacts

- `preview/raw/wp-export.json`
- `preview/normalized/content.json`
- `analysis/structure-analysis.json`
- `review/REVIEW-MAPPING.md`

## Project-specific hooks

`output/<site>/wp-migration/site-config.json` → `hooks` → `output/<site>/wp-migration/scripts/*.mjs`

Supported hooks: `preExtract`, `postExtract`, `preNormalize`, `postNormalize`
