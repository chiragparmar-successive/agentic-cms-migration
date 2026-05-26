---
name: wordpress-to-strapi
description: Hybrid WordPress → Strapi end-to-end migration. 70% deterministic scripts, 30% AI for unknown structures only. Bootstraps Strapi 5, imports content, optional Next.js frontend and quality gates.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests]"
user-invocable: true
---

# WordPress → Strapi Migration (Hybrid Orchestrator)

Production-grade migration: **scripts execute**, **AI interprets unknowns only**.

Does **not** replace `/fullstack-builder` — use this command when the source is WordPress and Strapi is the target CMS.

## Two commands

| Command                      | What it does                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `/wordpress-to-strapi`       | **E2E partial** — content model, schemas, Strapi bootstrap, import **capped** WP data |
| `/wp-to-strapi-db-migration` | **Data only** — full WP extract + import; **no** detect, review, or schema generation |

| Path          | `/wordpress-to-strapi`             | `/wp-to-strapi-db-migration`    |
| ------------- | ---------------------------------- | ------------------------------- |
| WP export     | `wp-migration/preview/raw/`        | `wp-migration/full/raw/`        |
| Normalized    | `wp-migration/preview/normalized/` | `wp-migration/full/normalized/` |
| Import state  | `preview/sync/id-map.json`         | `full/sync/id-map.json`         |
| Content model | `wp-migration/analysis/` + schemas | **Skipped** — reuses command 1  |

Script entrypoints:

- `scripts/wp-migration/wordpress-to-strapi.mjs`
- `scripts/wp-migration/wp-to-strapi-db-migration.mjs`

Partial caps: 5 posts, 3 pages, 10 categories, 5 tags, 5 media, 2 users (`lib/sample-limits.mjs`).

**Never run `/wp-to-strapi-db-migration` before `/wordpress-to-strapi` completes** (schemas + WP-1 / WP-2).

## Arguments

- `$ARGUMENTS[0]` = WordPress site URL (required)
- Optional flags (any order after URL):
  - **`--cms-only`** — CMS partial E2E only; skip Phase B, D, and E
  - **`--skip-tests`** — skip Phase B (still runs frontend + quality unless `--cms-only`)

Parse flags with the same rules as `scripts/wp-migration/lib/orchestrator-flags.mjs` and write/read `output/<site>/wp-migration/orchestrator-plan.json`.

### Default (no flags) — full stack partial

When the user passes **only the URL**, run **everything**:

| Phase | Included | Skills / commands                                                                              |
| ----- | -------- | ---------------------------------------------------------------------------------------------- |
| W     | Yes      | `wordpress-to-strapi.mjs`, bootstrap, partial import                                           |
| B     | Yes      | `.claude/commands/phase-b.md`, Playwright suite on **legacy WP URL**                           |
| D     | Yes      | `nextjs-scaffolder`, `cms-adapter-generator`, `page-component-generator`, `route-validator`    |
| E     | Yes      | `playwright-behavioral-parity`, `sonarqube-gate`, `lighthouse-ci-gate`, `ai-remediation-agent` |

Human checkpoints still apply: WP-1, WP-2, CHECKPOINT 2 (tests), CHECKPOINT 3–4 (quality).

Pass orchestrator flags through to the script when invoking it:

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wp-url> [--import] [--cms-only] [--skip-tests]
```

If URL is missing, stop and ask:

`wordpress-to-strapi <wordpress-url> [--cms-only] [--skip-tests]`

Data-only command: `.claude/commands/wp-to-strapi-db-migration.md` (never runs B/D/E)

## Architecture

```
/wordpress-to-strapi — DEFAULT (no flags) = full stack partial
  Phase W: wordpress-to-strapi.mjs
    Extract (capped) → Normalize → Detect → Review
          ↓ unknown-blocks? → AI → validate-ai
          ↓ CHECKPOINT WP-1
    generate-schema.mjs → strapi-bootstrapper → restart Strapi
          ↓ import-preview-to-strapi.mjs
          ↓ CHECKPOINT WP-2
  Phase B: phase-b.md (Playwright tests vs legacy WP) → CHECKPOINT 2
  Phase D: nextjs-scaffolder → cms-adapter → pages → route-validator
  Phase E: behavioral parity → sonar → lighthouse → remediation loop

  --cms-only     → Phase W only
  --skip-tests   → Phase W + D + E (no B)

/wp-to-strapi-db-migration — DATA ONLY (no content modeling, no B/D/E)
  wp-to-strapi-db-migration.mjs
  Extract (all) → Normalize → import-full-to-strapi.mjs
```

## AI vs Code boundaries

| Step                  | AI % | Owner                                                        |
| --------------------- | ---- | ------------------------------------------------------------ |
| WP extraction         | 0%   | `scripts/wp-migration/pipeline.mjs`                          |
| Normalization         | 0%   | scripts                                                      |
| Structure detection   | 0%   | scripts                                                      |
| Unknown ACF/Elementor | ~70% | `wp-ai-interpreter`                                          |
| AI validation         | 0%   | `validate-ai.mjs`                                            |
| Schema files          | 0%   | `strapi-schema-generator`                                    |
| Strapi bootstrap      | 0%   | `strapi-bootstrapper`                                        |
| Preview import        | 0%   | `import-preview-to-strapi.mjs`                               |
| Full migration import | 0%   | `import-full-to-strapi.mjs`                                  |
| Frontend              | ~40% | `page-component-generator` (default; skip with `--cms-only`) |
| Playwright tests      | 0%   | Phase B (default; skip with `--skip-tests` or `--cms-only`)  |
| Quality gates         | 0%   | Phase E (default; skip with `--cms-only`)                    |

**AI must NOT:** upload content, assign Strapi IDs, migrate media binaries, or write production DB rows directly.

## Pre-Flight

1. Verify skills exist (stop if missing):
   - `.claude/skills/phase-a/wp-ai-interpreter/SKILL.md`
   - `.claude/skills/phase-a/content-model-inferencer/SKILL.md`
   - `.claude/skills/phase-c/strapi-schema-generator/SKILL.md`
   - `.claude/skills/phase-c/strapi-bootstrapper/SKILL.md`
   - `.claude/skills/phase-c/content-etl-pipeline/SKILL.md`
   - `.claude/skills/phase-c/graphql-layer-validator/SKILL.md`
   - Phase D + E skills (required unless `--cms-only`)
   - Phase B command (required unless `--skip-tests` or `--cms-only`)

2. Verify Node.js 18+ and `scripts/wp-migration/pipeline.mjs` exists.

3. Define `site-slug` from hostname (e.g. `example.com` → `example-com`).

4. Verify WP REST API: `GET <url>/wp-json/wp/v2/` returns 200. If not, stop and report.

---

## Phase W1 — Extract (scripts, 0% AI)

**E2E partial (`/wordpress-to-strapi`):**

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
```

**Data only (`/wp-to-strapi-db-migration`):**

```bash
node scripts/wp-migration/wp-to-strapi-db-migration.mjs <site-slug> <wordpress-url>
```

Output: `output/<site>/wp-migration/{preview|full}/raw/wp-export.json` (`meta.profile`)

Also produce human summary at `output/<site>/docs/research/WP-API-EXTRACTION.md` (inventory + counts).

---

## Phase W2 — Normalize (scripts, 0% AI)

```bash
node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> normalize
```

Output: `output/<site>/wp-migration/preview/normalized/content.json` (or `full/` for command 2)

Universal fields: `title`, `body`, `slug`, `seo`, taxonomies, media refs.

---

## Phase W3 — Detect structure (scripts, 0% AI)

```bash
node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> detect
```

Outputs:

- `analysis/structure-analysis.json` — deterministic collection types, components, relations
- `analysis/unknown-blocks.json` — flagged ACF flexible / Elementor / Gutenberg blocks

---

## Phase W4 — AI interpretation (only if required)

If `unknown-blocks.json` → `meta.requiresAi === true`:

1. Follow `.claude/skills/phase-a/wp-ai-interpreter/SKILL.md`
2. Run `node scripts/wp-migration/validate-ai.mjs <site-slug>`

If no unknown blocks, skip W4 entirely.

---

## Phase W5 — Merge content model (code-first, AI assists)

1. Read `structure-analysis.json` + optional `validated/ai-interpretations.json`
2. Deterministically merge into draft spec at `output/<site>/docs/content-model/SCHEMA-DESIGN.md`
3. Use `content-model-inferencer` **only** to refine narrative sections and relationship notes — **not** to replace script-derived types/fields
4. Run review artifact:

```bash
node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> review
```

Output: `wp-migration/review/REVIEW-MAPPING.md` + `mapping-review.json`

### ✋ CHECKPOINT WP-1 — Human approves model + field mapping

Present:

- Collection/single types from deterministic analysis
- AI-suggested components (if any), with validation status
- `REVIEW-MAPPING.md` table
- MVP coverage: posts, pages, media, categories (Phase 1)

**Wait for explicit approval before Strapi schema generation.**

---

## Phase W6 — Schema transfer (standalone script, 0% AI)

**Step 1 — run once (or when WP structure changes):**

```bash
node scripts/wp-migration/generate-schema.mjs <site-slug>
```

Reads `analysis/structure-analysis.json`, writes Strapi 5 schemas + `strapi-schemas/SCHEMA-MANIFEST.json`.

If no Strapi project yet, use `strapi-bootstrapper` first, then re-run `generate-schema.mjs` so files land in `output/<site>/cms/src/api/`.

**Restart Strapi** after schema changes.

Optional: merge with `strapi-schema-generator` skill if human edited `SCHEMA-DESIGN.md`.

---

## Phase W7 — Strapi bootstrap (scripts via skill)

Use `strapi-bootstrapper` if `output/<site>/cms/` does not exist:

- GraphQL enabled, roles configured
- API token created for import script
- Verify `npm run develop` after schemas applied

---

## Phase W8 — Import

**E2E partial import (after schema + Strapi restart):**

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wp-url> --import
```

Or: `import-preview-to-strapi.mjs <site-slug>`

**Data-only full import (`/wp-to-strapi-db-migration`):**

```bash
node scripts/wp-migration/wp-to-strapi-db-migration.mjs <site-slug> <wp-url> --import
```

- Preview source: `wp-migration/preview/normalized/content.json`
- Full source: `wp-migration/full/normalized/content.json`
- Each profile has its own `sync/id-map.json` (no cross-profile reads)
- Within a profile: idempotent by `wpId` on re-import

Import order: categories → tags → authors → media → articles → pages.

Do **not** use AI for imports. `content-etl-pipeline` is fallback only if scripts fail.

### ✋ CHECKPOINT WP-2 — Human approves imported content

Present import counts, failed rows, sample parity checks.

**Wait for explicit approval before Phase B / D / E** (when those phases are enabled in `orchestrator-plan.json`).

---

## Phase W9 — GraphQL validation

Use `graphql-layer-validator` after CMS is populated.

---

## Phase B — Test contract (default: ON)

**Run unless** `--skip-tests` or `--cms-only`.

Read and follow `.claude/commands/phase-b.md` using the **public WordPress front-end URL** (same host as WP URL).

### ✋ CHECKPOINT 2 — Human approves Playwright test suite

Required before Phase D when tests are enabled.

---

## Phase D — Frontend (default: ON)

**Run unless** `--cms-only`.

After WP-2 and CHECKPOINT 2 (when tests ran):

1. `nextjs-scaffolder`
2. `cms-adapter-generator`
3. `page-component-generator` — AI suggests layout mapping; code scaffolds routes
4. `route-validator`

---

## Phase E — Quality loop (default: ON)

**Run unless** `--cms-only`.

When frontend exists (and tests approved if Phase B ran):

- `playwright-behavioral-parity`
- `sonarqube-gate`
- `lighthouse-ci-gate`
- `ai-remediation-agent` (max 5 iterations)

### ✋ CHECKPOINTs 3–4

Use CHECKPOINTs 3–4 from `fullstack-builder` when Phase E runs.

---

## Phase W10 — Review dashboard (MVP)

Human review artifact (required at end):

- `output/<site>/wp-migration/review/REVIEW-MAPPING.md`
- `output/<site>/wp-migration/review/mapping-review.json`

Future: UI dashboard; for now JSON + markdown with Approve / Edit / Reject workflow documented in REVIEW-MAPPING.md.

---

## MVP phases (default first run)

**E2E partial:** `/wordpress-to-strapi` — content model + capped data.

**Full data only:** `/wp-to-strapi-db-migration` after WP-1 + WP-2 (no content modeling).

**Phase 3:** ACF interpretation via W4 when unknown blocks exist.

**Phase 4:** Elementor + advanced layouts (same AI path, larger unknown-blocks).

**Phase 5:** Review dashboard workflow (WP-1 / WP-2 checkpoints).

---

## Deliverables

1. **Paths:** `output/<site>/cms/`, `output/<site>/frontend/` (default), Playwright suite (default)
2. **Migration artifacts:** `wp-migration/preview/`, `analysis/`, `review/`, `orchestrator-plan.json`
3. **Commands:** Strapi dev, Next dev, Playwright test run (unless `--cms-only`)
4. **URLs:** WP source, Strapi admin, GraphQL endpoint, frontend dev URL
5. **Status:** import counts, test baseline, quality gate results

## Re-running imports

Re-import **within the same profile** after re-extract:

```bash
# Preview refresh
node scripts/wp-migration/pipeline.mjs <site-slug> <wp-url> all --preview
STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-preview-to-strapi.mjs <site-slug>

# Full refresh
node scripts/wp-migration/pipeline.mjs <site-slug> <wp-url> all --full
STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>
```

Do not mix profiles. Regenerate schemas only when WP structure changes (preview detect).

## Failure handling

| Failure                    | Action                                       |
| -------------------------- | -------------------------------------------- |
| WP API 403                 | Report; offer XML export path (manual)       |
| validate-ai fails          | Fix interpretations; max 2 retries → human   |
| Import row fails           | Log in IMPORT-REPORT; do not skip checkpoint |
| AI hallucinates type names | Rejected by validate-ai.mjs                  |

## Relation to `/fullstack-builder`

- `fullstack-builder` — generic legacy URL + full A→E pipeline
- `wordpress-to-strapi` — WordPress-specific hybrid engine + Strapi focus
- Shared downstream skills (Strapi, ETL, optional Next.js)
- **Neither command modifies the other**
