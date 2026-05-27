---
description: WordPress → Strapi full-stack partial E2E (default) — CMS + Playwright + Next.js + quality gates. Same Phase B/D/E as fullstack-builder.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests] [--import]"
---

## `/wordpress-to-strapi`

**Important:** Running only `wordpress-to-strapi.mjs` does **not** create the frontend. That script covers **Phase W (CMS)** only. With **no flags**, you must continue the orchestrator through **Phase B, D, and E** (same skills as `/fullstack-builder`).

### Default (no flags) — same stack as fullstack

| Phase | What runs | Same as fullstack? |
|-------|-----------|-------------------|
| W | WP extract → model → schemas → Strapi bootstrap → preview import | WordPress-specific (replaces A+C) |
| B | `.claude/commands/phase-b.md` on legacy WP URL | Yes |
| D | `nextjs-scaffolder` → `cms-adapter-generator` → `page-component-generator` → `route-validator` | Yes |
| E | `playwright-behavioral-parity`, `sonarqube-gate`, `lighthouse-ci-gate`, `ai-remediation-agent` | Yes |

Opt out: `--cms-only` (W only), `--skip-tests` (W + D + E).

### Phase W — scripts (agent runs these)

```bash
SITE=wordpress-zcwowkggsk4k08cgsgwo4c8w-sakha-cloud
WP_URL=https://wordpress-zcwowkggsk4k08cgsgwo4c8w.sakha.cloud/

node scripts/wp-migration/wordpress-to-strapi.mjs "$SITE" "$WP_URL"
# restart Strapi, then:
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
  node scripts/wp-migration/wordpress-to-strapi.mjs "$SITE" "$WP_URL" --import
```

Creates under `output/<site>/`:

- `wp-migration/` (preview data, analysis, `site-config.json`)
- `cms/` (after `strapi-bootstrapper` + schema apply)
- `run-full-migration.mjs` (full data later)

**Do not stop here** if the user expected a frontend — proceed to Phase B/D/E below.

### Phase D — frontend (orchestrator only)

**CMS-powered:** All copy, images, SEO, and nav labels must come from Strapi via `cms` adapter — no hardcoded site content.

**Look like original:** After generation, compare each P0 route against `wordpressUrl` (from `wp-migration/site-config.json`) vs `http://localhost:3000`; write `docs/VISUAL-PARITY-REPORT.md` and fix until layout/content match (without hardcoding copy).

After WP-2 and CHECKPOINT 2 (if tests ran), run skills in order:

1. `.claude/skills/phase-d/nextjs-scaffolder/SKILL.md` → `output/<site>/frontend/`
2. `.claude/skills/phase-d/cms-adapter-generator/SKILL.md` → `docs/CMS-ADAPTER-COVERAGE.md`
3. `.claude/skills/phase-d/page-component-generator/SKILL.md` → `docs/FRONTEND-CMS-WIRING.md` + visual compare vs original URL
4. `.claude/skills/phase-d/route-validator/SKILL.md`

Then: `npm run build`, Phase E parity tests, `npm run report` (PDF).

### Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

### Arguments

`$ARGUMENTS` — WordPress URL; optional `--cms-only`, `--skip-tests`, `--import`.

Site slug for this host: `wordpress-zcwowkggsk4k08cgsgwo4c8w-sakha-cloud`

If the URL is missing, stop and ask:

`/wordpress-to-strapi <wordpress-url>`
