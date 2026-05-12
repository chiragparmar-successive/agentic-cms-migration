# Agents

All agent files live **flat** in this directory — `.claude/agents/<name>.md`. No subdirectories.

## Files — by Phase

### Phase A — Reverse Engineering

| Agent | Description |
|-------|-------------|
| `site-crawler.md` | Crawls DOM, routes, media, and sitemaps from legacy site |
| `wp-source-adapter.md` | Optional WordPress REST API extraction (WP-JSON, ACF, taxonomies) |
| `content-model-inferencer.md` | AI-powered content model inference via Claude API |

### Phase B — Test-First Contract

| Agent | Description |
|-------|-------------|
| `playwright-suite-generator.md` | AI-generates Playwright test suite from approved model spec |
| `baseline-runner.md` | Runs tests against legacy site to establish green baseline |
| `playwright-test-orchestrator.md` | Routes work to planner / generator / healer |
| `playwright-test-planner.md` | Creates scenario test plans (plan mode) |
| `playwright-test-generator.md` | Generates runnable test files from plans (generate mode) |
| `playwright-test-healer.md` | Diagnoses and fixes failing tests (heal mode) |
| `playwright-official.md` | Playwright bootstrap, config verification, and run standards |

### Phase C — CMS Provisioning

| Agent | Description |
|-------|-------------|
| `strapi-schema-generator.md` | Generates Strapi 5 JSON schemas from approved content model spec |
| `strapi-bootstrapper.md` | Bootstraps Strapi with schemas, GraphQL, roles & permissions |
| `content-etl-pipeline.md` | Extracts, transforms, and loads content + media optimisation |
| `graphql-layer-validator.md` | Introspects GraphQL and runs graphql-codegen |

### Phase D — Frontend Generation

| Agent | Description |
|-------|-------------|
| `nextjs-scaffolder.md` | Scaffolds Next.js 16 project (TS strict, Tailwind, App Router, RSC) |
| `cms-adapter-generator.md` | Generates ICMSAdapter interface + StrapiAdapter implementation |
| `page-component-generator.md` | AI-generates RSC pages / layouts / components via Claude API |
| `route-validator.md` | Validates URL parity between source and target |

### Phase E — Quality Loop (Self-Healing)

| Agent | Description |
|-------|-------------|
| `playwright-behavioral-parity.md` | Runs behavioral parity tests against new stack |
| `sonarqube-gate.md` | Runs SonarQube code quality gate |
| `lighthouse-ci-gate.md` | Runs Lighthouse CI performance gate |
| `ai-remediation-agent.md` | AI-powered file patch generation (max 5 iterations) |

## Design Rules

- Keep specialist agents thin and task-focused.
- Put shared behavior and standards in **skills**, not duplicated in agents.
- Phase ordering is strict: A → B → C → D → E.
- Human checkpoints (1–4) gate phase transitions; agents must pause at checkpoints.

## Canonical Skill Paths

| Phase | Skill |
|-------|-------|
| A — Crawl | `.claude/skills/phase-a/site-crawler/SKILL.md` |
| A — WP Adapter | `.claude/skills/phase-a/wp-source-adapter/SKILL.md` |
| A — Inferencer | `.claude/skills/phase-a/content-model-inferencer/SKILL.md` |
| B — Suite Gen | `.claude/skills/phase-b/playwright-suite-generator/SKILL.md` |
| B — Baseline | `.claude/skills/phase-b/baseline-runner/SKILL.md` |
| B — Lifecycle | `.claude/skills/phase-b/playwright-test-lifecycle/SKILL.md` |
| B — Official | `.claude/skills/phase-b/playwright-official/SKILL.md` |
| B — CLI | `.claude/skills/phase-b/playwright-cli/SKILL.md` |
| C — Schema Gen | `.claude/skills/phase-c/strapi-schema-generator/SKILL.md` |
| C — Bootstrap | `.claude/skills/phase-c/strapi-bootstrapper/SKILL.md` |
| C — ETL | `.claude/skills/phase-c/content-etl-pipeline/SKILL.md` |
| C — GraphQL | `.claude/skills/phase-c/graphql-layer-validator/SKILL.md` |
| D — Scaffold | `.claude/skills/phase-d/nextjs-scaffolder/SKILL.md` |
| D — CMS Adapter | `.claude/skills/phase-d/cms-adapter-generator/SKILL.md` |
| D — Page Gen | `.claude/skills/phase-d/page-component-generator/SKILL.md` |
| D — Route Val | `.claude/skills/phase-d/route-validator/SKILL.md` |
| E — Playwright | `.claude/skills/phase-e/playwright-behavioral-parity/SKILL.md` |
| E — SonarQube | `.claude/skills/phase-e/sonarqube-gate/SKILL.md` |
| E — Lighthouse | `.claude/skills/phase-e/lighthouse-ci-gate/SKILL.md` |
| E — Remediation | `.claude/skills/phase-e/ai-remediation-agent/SKILL.md` |
| Orchestrator | `.claude/skills/orchestrators/fullstack-builder/SKILL.md` |

## Mandatory Output Location

All artifacts must be created under:

- `output/<site>/` with phase-specific subfolders:
  - `test/` — Playwright plans, specs, generated tests, results
  - `cms/` — Strapi project
  - `frontend/` — Next.js project
  - `reports/` — Quality gate reports (SonarQube, Lighthouse, remediation logs)
