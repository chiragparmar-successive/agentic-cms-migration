---
description: WordPress → Strapi full-stack partial E2E (default) — CMS model, sample data, Playwright tests, Next.js frontend, quality gates. Opt out with --cms-only or --skip-tests.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests]"
---

## `/wordpress-to-strapi`

**Default (no flags):** runs the **complete partial stack** — not CMS-only.

| Phase                                   | Default | Opt out        |
| --------------------------------------- | ------- | -------------- |
| CMS partial E2E (model + capped import) | Yes     | —              |
| Phase B — Playwright tests (legacy WP)  | Yes     | `--skip-tests` |
| Phase D — Next.js frontend              | Yes     | `--cms-only`   |
| Phase E — quality gates                 | Yes     | `--cms-only`   |

**Partial data only** — full WordPress volume is `/wp-to-strapi-db-migration` (data-only, no B/D/E).

### Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

### Script (CMS steps)

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
STRAPI_URL=... STRAPI_API_TOKEN=... \
  node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url> --import
```

Pass the same flags to the script when running: `[--cms-only] [--skip-tests]`.

Orchestrator plan: `output/<site>/wp-migration/orchestrator-plan.json`

### Arguments

`$ARGUMENTS` — WordPress URL; optional `--cms-only`, `--skip-tests`.

If the URL is missing, stop and ask:

`/wordpress-to-strapi <wordpress-url>`
