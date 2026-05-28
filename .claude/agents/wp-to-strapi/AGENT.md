---
name: wordpress-to-strapi
description: Hybrid WordPress → Strapi end-to-end migration. 70% deterministic scripts, 30% AI for unknown structures only. Bootstraps Strapi 5, imports content, optional Next.js frontend and quality gates.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests]"
user-invocable: true
---

# WordPress -> Strapi Migration (Hybrid Agent)

Production path for WordPress sources: scripts do deterministic work, AI is used only for unknown structures.

## Canonical role

- Entry command: `.claude/commands/wordpress-to-strapi.md`
- This file is the canonical execution flow for that command.
- Canonical agent map: `.claude/agents/common/phases.md`
- Downstream phase contracts:
  - `.claude/commands/PB-test.md`
  - `.claude/commands/PD-frontend.md`
  - `.claude/commands/PE-quality.md`

## Arguments

- Required: `$ARGUMENTS[0]` = WordPress URL
- Optional:
  - `--cms-only` -> run WordPress CMS migration only (W phases only)
  - `--skip-tests` -> skip Phase B, still run D + E

If URL is missing, stop and ask exactly:

`/wordpress-to-strapi <wordpress-url> [--cms-only] [--skip-tests] [--import]`

## Runtime modes

| Mode             | Trigger                            | Result                     |
| ---------------- | ---------------------------------- | -------------------------- |
| Partial E2E      | `/wordpress-to-strapi <url>`       | W + B + D + E by default   |
| CMS only         | add `--cms-only`                   | W only                     |
| Skip tests       | add `--skip-tests`                 | W + D + E                  |
| Full data import | generated `run-full-migration.mjs` | data-only import, no B/D/E |

Script entrypoints:

- `scripts/wp-migration/wordpress-to-strapi.mjs`
- `output/<site>/wp-migration/run-full-migration.mjs` (generated after initial run)

Never run `run-full-migration.mjs` before the main command completes WP-1 and WP-2.

## Phase graph

`W -> (optional B) -> (optional D) -> (optional E)`

Checkpoint gates:

- `WP-1` model mapping approval
- `WP-2` import approval
- `CHECKPOINT 2` test contract approval (if Phase B runs)
- `CHECKPOINT 3/4` quality and pre-deploy approval (if Phase E runs)

No downstream phase may start before its required checkpoint.

## Pre-flight

1. Validate WordPress URL and derive `site-slug` from hostname.
2. Verify Node.js 18+ and migration scripts exist.
3. Verify WP API responds: `GET <url>/wp-json/wp/v2/`.
4. Verify canonical agent routing map exists and is readable:
   - `.claude/agents/common/phases.md`
5. Verify required common agents are readable:
   - `.claude/agents/common/wordpress-to-strapi.md`
   - `.claude/agents/common/content-model-inferencer.md`
   - `.claude/agents/common/strapi-schema-generator.md`
   - `.claude/agents/common/strapi-bootstrapper.md`
   - `.claude/agents/common/content-etl-pipeline.md`
   - `.claude/agents/common/graphql-layer-validator.md`
   - `.claude/agents/common/nextjs-scaffolder.md` (unless `--cms-only`)
   - `.claude/agents/common/cms-adapter-generator.md` (unless `--cms-only`)
   - `.claude/agents/common/page-component-generator.md` (unless `--cms-only`)
   - `.claude/agents/common/route-validator.md` (unless `--cms-only`)
   - `.claude/agents/common/playwright-behavioral-parity.md` (unless `--cms-only`)
   - `.claude/agents/common/playwright-test-planner.md` (when Phase B runs)
   - `.claude/agents/common/playwright-test-generator.md` (when Phase B runs)
   - `.claude/agents/common/playwright-test-healer.md` (when Phase B runs)
   - `.claude/agents/common/sonarqube-gate.md` (unless `--cms-only`)
   - `.claude/agents/common/lighthouse-ci-gate.md` (unless `--cms-only`)
   - `.claude/agents/common/ai-remediation-agent.md` (unless `--cms-only`)

If any required prerequisite is missing, stop and report exactly what is missing.

## Phase W (WordPress CMS migration)

### W1 Extract (deterministic)

Run:

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url>
```

Outputs include raw export under `output/<site>/wp-migration/preview/raw/`.

### W2 Normalize (deterministic)

Run pipeline normalize and produce normalized content under `preview/normalized/`.

### W3 Detect structure (deterministic)

Produce:

- `analysis/structure-analysis.json`
- `analysis/unknown-blocks.json`

### W4 AI interpretation (conditional)

Only if unknown blocks are present:

1. Run `.claude/agents/common/wordpress-to-strapi.md` for unknown-block interpretation path
2. Run `validate-ai.mjs`

Skip entirely when unknown blocks are absent.

### W5 Merge model + review

Merge deterministic analysis with validated AI interpretations into:

- `output/<site>/docs/content-model/SCHEMA-DESIGN.md`
- `output/<site>/wp-migration/review/REVIEW-MAPPING.md`

#### CHECKPOINT WP-1

Require explicit human approval of schema + mapping before schema generation.

### W6 Schema transfer

Run:

```bash
node scripts/wp-migration/generate-schema.mjs <site-slug>
```

Restart Strapi after schema changes.

### W7 Strapi bootstrap

Use `.claude/agents/common/strapi-bootstrapper.md` when CMS project is absent. Ensure GraphQL and roles are configured.

### W8 Import

Partial import:

```bash
node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wp-url> --import
```

Data-only full import uses generated runner.

Import order: categories -> tags -> authors -> media -> articles -> pages.

#### CHECKPOINT WP-2

Require explicit human approval after import counts + parity checks.

### W9 GraphQL validation

Run `.claude/agents/common/graphql-layer-validator.md` once CMS data is loaded.

## Phase B (default on)

Run unless `--skip-tests` or `--cms-only`.

- Execute `.claude/commands/PB-test.md` against legacy WordPress URL.
- Require `CHECKPOINT 2` approval before Phase D.

## Phase D (default on)

Run unless `--cms-only`.

Use:

1. `.claude/agents/common/nextjs-scaffolder.md`
2. `.claude/agents/common/cms-adapter-generator.md`
3. `.claude/agents/common/page-component-generator.md`
4. `.claude/agents/common/route-validator.md`

Rules:

- All site content must come from Strapi via adapter (no hardcoded primary content).
- Use WordPress URL from `site-config.json` as canonical visual parity baseline.
- Produce:
  - `docs/CMS-ADAPTER-COVERAGE.md`
  - `docs/FRONTEND-CMS-WIRING.md`
  - `docs/VISUAL-PARITY-REPORT.md`

## Phase E (default on)

Run unless `--cms-only`.

Use quality stack:

- `.claude/agents/common/playwright-behavioral-parity.md`
- `.claude/agents/common/sonarqube-gate.md`
- `.claude/agents/common/lighthouse-ci-gate.md`
- `.claude/agents/common/ai-remediation-agent.md` (max 5 iterations)

Require:

- HTML report
- JUnit XML
- PDF report (`npm run report`)

If major visual/content mismatch remains after gates, return to D and re-run parity.

## Deliverables

1. Paths:
   - `output/<site>/cms/`
   - `output/<site>/frontend/` (unless `--cms-only`)
   - `output/<site>/test/` (when tests enabled)
2. Migration artifacts:
   - `wp-migration/preview/`
   - `wp-migration/analysis/`
   - `wp-migration/review/`
   - `wp-migration/orchestrator-plan.json`
3. Docs:
   - `CMS-ADAPTER-COVERAGE.md`
   - `FRONTEND-CMS-WIRING.md`
   - `VISUAL-PARITY-REPORT.md`
4. Runtime URLs:
   - WordPress source URL
   - Strapi admin URL
   - GraphQL endpoint
   - Frontend URL (if generated)
5. Quality status:
   - import counts
   - test summary
   - gate outcomes
   - remediation iterations

## Failure handling

| Failure                 | Action                                           |
| ----------------------- | ------------------------------------------------ |
| WP API 403              | Stop and report, offer manual XML export path    |
| validate-ai fails       | Fix interpretations, max 2 retries then escalate |
| import row fails        | Log in import report and block checkpoint        |
| unresolved quality gate | escalate after remediation cap                   |

## Relation to URL flow

- `url-to-strapi` is generic source orchestration.
- `wordpress-to-strapi` is WordPress-specialized hybrid flow.
- They share downstream phase capabilities but keep independent entry contracts.
