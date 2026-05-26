---
name: wordpress-to-strapi
description: Hybrid WordPress → Strapi end-to-end migration. 70% deterministic scripts, 30% AI for unknown structures only. Bootstraps Strapi 5, imports content, optional Next.js frontend and quality gates.
argument-hint: "<wordpress-url> [--cms-only] [--with-frontend] [--skip-tests]"
user-invocable: true
---

# WordPress → Strapi Migration (Hybrid Orchestrator)

Production-grade migration: **scripts execute**, **AI interprets unknowns only**.

Does **not** replace `/fullstack-builder` — use this command when the source is WordPress and Strapi is the target CMS.

## Arguments

- `$ARGUMENTS[0]` = WordPress site URL (required)
- Optional flags (any order after URL):
  - `--cms-only` — Strapi + content import only (skip Phase D/E)
  - `--with-frontend` — include Phase D (Next.js) after CMS (default without `--cms-only`)
  - `--skip-tests` — skip Phase B test contract (faster MVP; not recommended for production)

If URL is missing, stop and ask:

`wordpress-to-strapi <wordpress-url> [--cms-only] [--with-frontend] [--skip-tests]`

## Architecture

```
SCRIPTS → Extract → Normalize → Detect
              ↓
         unknown-blocks?
              ↓ yes
         AI Interpreter → validate-ai.mjs
              ↓
    CHECKPOINT WP-1 (optional mapping review)
              ↓
    generate-schema.mjs  ← STEP 1: schema transfer (standalone)
              ↓
    strapi-bootstrapper + restart Strapi
              ↓
    import-to-strapi.mjs  ← STEP 2: data transfer (re-runnable alone)
              ↓
         CHECKPOINT WP-2
              ↓
    [optional] Phase B → Phase D → Phase E
              ↓
    Review mapping dashboard
```

## AI vs Code boundaries

| Step | AI % | Owner |
|------|------|--------|
| WP extraction | 0% | `scripts/wp-migration/pipeline.mjs` |
| Normalization | 0% | scripts |
| Structure detection | 0% | scripts |
| Unknown ACF/Elementor | ~70% | `wp-ai-interpreter` |
| AI validation | 0% | `validate-ai.mjs` |
| Schema files | 0% | `strapi-schema-generator` |
| Strapi bootstrap | 0% | `strapi-bootstrapper` |
| Content import | 0% | `content-etl-pipeline` + normalized JSON |
| Frontend | ~40% | `page-component-generator` (optional) |

**AI must NOT:** upload content, assign Strapi IDs, migrate media binaries, or write production DB rows directly.

## Pre-Flight

1. Verify skills exist (stop if missing):
   - `.claude/skills/phase-a/wp-ai-interpreter/SKILL.md`
   - `.claude/skills/phase-a/content-model-inferencer/SKILL.md`
   - `.claude/skills/phase-c/strapi-schema-generator/SKILL.md`
   - `.claude/skills/phase-c/strapi-bootstrapper/SKILL.md`
   - `.claude/skills/phase-c/content-etl-pipeline/SKILL.md`
   - `.claude/skills/phase-c/graphql-layer-validator/SKILL.md`
   - If `--with-frontend` or default full mode: Phase D + E skills
   - If tests enabled: `.claude/commands/phase-b.md`

2. Verify Node.js 18+ and `scripts/wp-migration/pipeline.mjs` exists.

3. Define `site-slug` from hostname (e.g. `example.com` → `example-com`).

4. Verify WP REST API: `GET <url>/wp-json/wp/v2/` returns 200. If not, stop and report.

---

## Phase W1 — Extract (scripts, 0% AI)

```bash
node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> extract
```

Output: `output/<site>/wp-migration/raw/wp-export.json`

Also produce human summary at `output/<site>/docs/research/WP-API-EXTRACTION.md` (inventory + counts).

---

## Phase W2 — Normalize (scripts, 0% AI)

```bash
node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> normalize
```

Output: `output/<site>/wp-migration/normalized/content.json`

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

## Phase W8 — Data transfer (standalone script, re-runnable)

**Step 2 — run anytime (does not require full orchestrator):**

```bash
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
  node scripts/wp-migration/import-to-strapi.mjs <site-slug>
```

**Refresh from WordPress then sync:**

```bash
STRAPI_URL=... STRAPI_API_TOKEN=... \
  node scripts/wp-migration/import-to-strapi.mjs <site-slug> <wordpress-url> --refresh
```

- Source: `output/<site>/wp-migration/normalized/content.json`
- Idempotent: matches `wpId` → update or create
- State: `wp-migration/sync/id-map.json`, `sync/import-log.json`

Import order: categories → tags → authors → media → articles → pages.

Do **not** use AI for this step. `content-etl-pipeline` skill is fallback only if script import fails.

### ✋ CHECKPOINT WP-2 — Human approves imported content

Present import counts, failed rows, sample parity checks.

**Wait for explicit approval before optional frontend/tests.**

---

## Phase W9 — GraphQL validation

Use `graphql-layer-validator` after CMS is populated.

---

## Optional Phase B — Test contract

Unless `--skip-tests`:

Read and follow `.claude/commands/phase-b.md` using the **public WordPress front-end URL** (same host as WP URL).

Requires CHECKPOINT 2 (test suite approval) before frontend/quality if continuing to Phase E.

---

## Optional Phase D — Frontend (`--with-frontend` or default when not `--cms-only`)

1. `nextjs-scaffolder`
2. `cms-adapter-generator`
3. `page-component-generator` — AI suggests layout mapping; code scaffolds routes
4. `route-validator`

---

## Optional Phase E — Quality loop

When frontend exists and tests approved:

- `playwright-behavioral-parity`
- `sonarqube-gate`
- `lighthouse-ci-gate`
- `ai-remediation-agent` (max 5 iterations)

Use CHECKPOINTs 3–4 from `fullstack-builder` when Phase E runs.

---

## Phase W10 — Review dashboard (MVP)

Human review artifact (required at end):

- `output/<site>/wp-migration/review/REVIEW-MAPPING.md`
- `output/<site>/wp-migration/review/mapping-review.json`

Future: UI dashboard; for now JSON + markdown with Approve / Edit / Reject workflow documented in REVIEW-MAPPING.md.

---

## MVP phases (default first run)

**Phase 1 (scripts only):** posts, pages, media, categories — enabled by default pipeline.

**Phase 2:** ACF interpretation via W4 when unknown blocks exist.

**Phase 3:** Elementor + advanced layouts (same AI path, larger unknown-blocks).

**Phase 4:** Review dashboard workflow (WP-1 / WP-2 checkpoints).

---

## Deliverables

1. **Paths:** `output/<site>/cms/`, optional `output/<site>/frontend/`
2. **Migration artifacts:** `wp-migration/` raw, normalized, analysis, review
3. **Commands:** Strapi dev, optional Next dev, re-run incremental extract
4. **URLs:** WP source, Strapi admin, GraphQL endpoint, optional frontend
5. **Import + mapping status:** counts, pending review rows, failed imports

## Incremental sync (repeatable)

When WordPress content changed later, **only run the import script** (with optional refresh):

```bash
STRAPI_URL=... STRAPI_API_TOKEN=... \
  node scripts/wp-migration/import-to-strapi.mjs <site-slug> <wordpress-url> --refresh
```

No need to regenerate schemas unless WP field structure changed.

## Failure handling

| Failure | Action |
|---------|--------|
| WP API 403 | Report; offer XML export path (manual) |
| validate-ai fails | Fix interpretations; max 2 retries → human |
| Import row fails | Log in IMPORT-REPORT; do not skip checkpoint |
| AI hallucinates type names | Rejected by validate-ai.mjs |

## Relation to `/fullstack-builder`

- `fullstack-builder` — generic legacy URL + full A→E pipeline
- `wordpress-to-strapi` — WordPress-specific hybrid engine + Strapi focus
- Shared downstream skills (Strapi, ETL, optional Next.js)
- **Neither command modifies the other**
