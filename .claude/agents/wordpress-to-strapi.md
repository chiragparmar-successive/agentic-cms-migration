---
name: wordpress-to-strapi
description: WordPress → Strapi. Default = full partial stack (CMS + tests + frontend + quality). /wp-to-strapi-dn-migration = data-only full import.
---

# WordPress → Strapi Agent

## Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

## Commands

| Slash command | Default scope |
|---------------|----------------|
| `/wordpress-to-strapi` | **No flags** → CMS partial + Phase B + D + E |
| `/wordpress-to-strapi --cms-only` | CMS partial only |
| `/wordpress-to-strapi --skip-tests` | CMS + frontend + quality (no Playwright baseline) |
| `/wp-to-strapi-dn-migration` | Full data import only (no modeling, no B/D/E) |

## Scripts

- `scripts/wp-migration/wordpress-to-strapi.mjs`
- `scripts/wp-migration/wp-to-strapi-dn-migration.mjs`
- `scripts/wp-migration/lib/orchestrator-flags.mjs`

## Checkpoints

WP-1, WP-2, CHECKPOINT 2 (tests), CHECKPOINTs 3–4 (quality) — per skill.
