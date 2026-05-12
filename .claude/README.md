# Claude Workspace — AI-Powered CMS Transformation Platform

Two layers:

- **`skills/`** — reusable capabilities grouped by phase (what to do)
- **`agents/`** — orchestration entry points (when and how to route work)

Agent files are **flat** in `agents/` (no subdirectories). Skills are grouped by phase under `skills/`.

## End-to-End Phase Flow

```
SOURCE INPUT ──→ PHASE A ──→ PHASE B ──→ PHASE C ──→ PHASE D ──→ PHASE E ──→ TARGET STACK
                  │            │            │            │            │
              Reverse      Test-First     CMS        Frontend    Quality
             Engineering    Contract    Provisioning  Generation    Loop
                  │            │            │            │       (Self-Healing)
              CHECKPOINT 1  CHECKPOINT 2    │            │     CHECKPOINT 3 → CHECKPOINT 4
              (Human ✋)    (Human ✋)      │            │     (Human ✋)     (Human ✋)
```

### Source Input

- Legacy CMS UI URL / Sitemap (WordPress, Drupal, Sitecore, AEM)
- Product Spec Doc (PSD — migration config)

### Phase A — Reverse Engineering

Crawl, extract, and infer the content model from the legacy site.

| Skill | Description |
|-------|-------------|
| `site-crawler` | DOM + routes + media + sitemaps extraction |
| `wp-source-adapter` | Optional WordPress REST API adapter (WP-JSON, ACF, taxonomies) |
| `content-model-inferencer` | AI-powered content model inference via Claude API |

**CHECKPOINT 1** — Human approves Content Model Spec before proceeding.

### Phase B — Test-First Contract

Generate and validate a behavioral test suite against the legacy site.

| Skill | Description |
|-------|-------------|
| `playwright-suite-generator` | AI-generated test suite (route / content / SEO / ARIA / visual) |
| `baseline-runner` | Run against legacy site, establish green baseline + visual snapshots |
| `playwright-test-lifecycle` | Unified plan / generate / heal workflow |
| `playwright-official` | Official Playwright config, locator, and runner standards |
| `playwright-cli` | Interactive browser-CLI reference for ad-hoc debugging |

**CHECKPOINT 2** — Human approves Test Suite (immutable behavioral contract).
Ensure good pass percentage on source URL before proceeding.

### Phase C — CMS Provisioning

Build, bootstrap, and populate the target Strapi 5 CMS.

| Skill | Description |
|-------|-------------|
| `strapi-schema-generator` | Canonical content model spec → Strapi 5 JSON schemas |
| `strapi-bootstrapper` | Apply schemas + GraphQL plugin + roles & permissions |
| `content-etl-pipeline` | Extract → Transform → Load content + media WebP/AVIF optimisation |
| `graphql-layer-validator` | Introspect + graphql-codegen type generation |

### Phase D — Frontend Generation

Scaffold and generate the Next.js 16 frontend wired to CMS.

| Skill | Description |
|-------|-------------|
| `nextjs-scaffolder` | Next.js 16 project init (TypeScript strict + Tailwind + App Router + RSC) |
| `cms-adapter-generator` | ICMSAdapter interface + StrapiAdapter implementation |
| `page-component-generator` | AI-generated RSC pages / layouts / components via Claude API |
| `route-validator` | Confirm URL parity between source and target pre-test |

Vercel vendored skill packs (under `skills/frontend/vercel/`) remain available as quality guardrails.

### Phase E — Quality Loop (Self-Healing)

Automated quality gates with AI-powered remediation.

| Skill | Description |
|-------|-------------|
| `playwright-behavioral-parity` | Run Playwright tests against new stack for behavioral parity |
| `sonarqube-gate` | SonarQube code quality gate |
| `lighthouse-ci-gate` | Lighthouse CI performance gate |
| `ai-remediation-agent` | Claude API tool-use agent that generates file patches (max 5 iterations) |

**CHECKPOINT 3** — All gates pass? If FAIL → AI Remediation Agent → retry loop.
**CHECKPOINT 4** — Pre-Deployment Sign-Off (human approves for deploy).

### Target Stack

- Next.js 16 App (App Router + RSC + Strapi Integration)
- Strapi 5 CMS (GraphQL API)

## Directory Tree

```text
.claude/
  README.md
  commands/
    fullstack-builder.md
  agents/
    README.md
    site-crawler.md
    wp-source-adapter.md
    content-model-inferencer.md
    playwright-suite-generator.md
    baseline-runner.md
    playwright-test-orchestrator.md
    playwright-test-planner.md
    playwright-test-generator.md
    playwright-test-healer.md
    playwright-official.md
    strapi-schema-generator.md
    strapi-bootstrapper.md
    content-etl-pipeline.md
    graphql-layer-validator.md
    nextjs-scaffolder.md
    cms-adapter-generator.md
    page-component-generator.md
    route-validator.md
    playwright-behavioral-parity.md
    sonarqube-gate.md
    lighthouse-ci-gate.md
    ai-remediation-agent.md
  skills/
    README.md
    phase-a/
      site-crawler/SKILL.md
      wp-source-adapter/SKILL.md
      content-model-inferencer/SKILL.md
    phase-b/
      playwright-suite-generator/SKILL.md
      baseline-runner/SKILL.md
      playwright-test-lifecycle/SKILL.md
      playwright-official/SKILL.md
      playwright-cli/SKILL.md
    phase-c/
      strapi-schema-generator/SKILL.md
      strapi-bootstrapper/SKILL.md
      content-etl-pipeline/SKILL.md
      graphql-layer-validator/SKILL.md
    phase-d/
      nextjs-scaffolder/SKILL.md
      cms-adapter-generator/SKILL.md
      page-component-generator/SKILL.md
      route-validator/SKILL.md
    phase-e/
      playwright-behavioral-parity/SKILL.md
      sonarqube-gate/SKILL.md
      lighthouse-ci-gate/SKILL.md
      ai-remediation-agent/SKILL.md
    orchestrators/
      fullstack-builder/SKILL.md
    frontend/
      vercel/                         # vendored packs (tracked in skills-lock.json)
        cra-to-next-migration/
        next-best-practices/
        next-cache-components/
        vercel-composition-patterns/
        vercel-react-best-practices/
```

## Conventions

- **Slash commands:** `commands/<name>.md` — Claude Code reads this directory to populate `/` suggestions.
- **Agents are flat:** `agents/<name>.md` — no subdirectories.
- **Model IDs:** use canonical IDs (`claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5-20251001`).
- **One skill, one folder:** `skills/<phase>/<skill-name>/SKILL.md`.
- **Orchestrators** live under `skills/orchestrators/` (pipeline coordination).
- **Vendor rules** stay under `skills/frontend/vercel/` so phase skills stay stable.
- **Phase ordering is strict:** A → B → C → D → E. No phase may start before its predecessor's checkpoint is cleared.
- **Checkpoints are human gates:** The pipeline pauses for human approval at checkpoints 1–4. No automation may bypass them.

## Operating Rules

- Add new reusable behavior under `skills/<phase>/<skill-name>/SKILL.md`.
- Add new agents as `agents/<name>.md` (flat).
- Keep specialist agents thin; keep framework rules in skills.
- Each phase owns its skills; cross-phase dependencies use the orchestrator.
- The quality loop (Phase E) is self-healing with max 5 AI remediation iterations before escalating to human.
