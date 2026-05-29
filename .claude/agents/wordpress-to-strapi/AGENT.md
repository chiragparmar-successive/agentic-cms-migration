---
name: wordpress-to-strapi
description: WordPress-specialized orchestrator for staged migration: schema/CMS + sample content first, then tests, frontend, and quality gates.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests]"
user-invocable: true
---

# WordPress -> Strapi/Next Orchestrator Agent

WordPress-specialized orchestration flow in strict order:

`W -> C -> B -> D -> E` (with mode-based skips)

with mandatory human checkpoints.

## Arguments

- `$ARGUMENTS[0]`: WordPress URL (required)
- Optional flags:
  - `--cms-only`: run only Phase W (+ Phase C ETL if needed)
  - `--skip-tests`: skip Phase B and continue with D -> E

If missing, stop and ask exactly:

`/wordpress-to-strapi <wordpress-url> [--cms-only] [--skip-tests]`

## Contract (hard rules)

1. Never skip WP-1/WP-2 checkpoints.
2. Never run downstream phases before required approvals.
3. Never weaken parity tests to force pass.
4. Frontend must be CMS-backed and dynamic (no static primary content).
5. Keep all artifacts under `output/<site>/`.
6. Initial entrypoint is command-only: `/wordpress-to-strapi ...` (do not treat agent/script as user entrypoint).
7. Separate common engine vs project-specific output strictly:
   - common engine: `scripts/wp-migration/*`
   - project-specific: `output/<site>/wp-migration/*` (config, preview data, analysis)
8. Schema inference happens in Phase W; **content load** uses Phase C `content-etl-pipeline` only.

## Runtime modes

| Mode        | Trigger                      | Execution path |
| ----------- | ---------------------------- | -------------- |
| Default E2E | `/wordpress-to-strapi <url>` | W -> C -> B -> D -> E |
| CMS only    | add `--cms-only`             | W -> C only           |
| Skip tests  | add `--skip-tests`           | W -> C -> D -> E      |

## Detailed Execution Steps (canonical order)

1. **Start from command only**  
   Run `/wordpress-to-strapi <wordpress-url>` to initialize the project and derive `site-slug`.

2. **Create CMS foundation (Strapi project/bootstrap)**  
   Create/configure CMS runtime and roles/permissions for the target project.

3. **Generate schema from WordPress structure (AI + deterministic analysis)**  
   Use extracted/normalized/detected WordPress structure to infer content model and generate Strapi schema.

4. **Apply schema to CMS + validate GraphQL/types**  
   Apply generated schema to Strapi, restart CMS, and validate GraphQL/types/contracts.

5. **Load sample content (Phase C ETL)**  
   Use `content-etl-pipeline` with preview/normalized WordPress data so Phase B/D can proceed.

6. **Run frontend flow (Phase D)**  
   Generate Next.js frontend from CMS adapter contracts and enforce dynamic CMS data usage.

7. **Run quality flow (Phase E)**  
   Execute parity + Sonar + Lighthouse + remediation loop to stabilize the generated stack.

8. **Hand off to Phase B / D / E**  
   After Phase W, continue with test contract, frontend generation, and quality gates (visual look-alike required in Phase E).

Script entrypoints:

- `scripts/wp-migration/wordpress-to-strapi.mjs`
- `scripts/wp-migration/pipeline.mjs`
- `scripts/wp-migration/generate-schema.mjs`

## Pre-flight

1. Verify canonical map:
   - `.claude/agents/common/phases.md`
2. Verify phase command contracts:
   - `.claude/commands/PB-test.md`
   - `.claude/commands/PD-frontend.md`
   - `.claude/commands/PE-quality.md`
3. Validate URL and derive `site-slug` from hostname.
4. Verify WordPress API responds:
   - `GET <wordpress-url>/wp-json/wp/v2/`
5. Verify Node.js runtime for scripts and frontend:
   - WP scripts compatible (`node` available)
   - frontend target Node.js 22
6. Verify required common agents are readable:
   - `.claude/agents/common/wordpress-to-strapi.md`
   - `.claude/agents/common/content-model-inferencer.md`
   - `.claude/agents/common/strapi-schema-generator.md`
   - `.claude/agents/common/strapi-bootstrapper.md`
   - `.claude/agents/common/content-etl-pipeline.md`
   - `.claude/agents/common/graphql-layer-validator.md`
   - `.claude/agents/common/playwright-suite-generator.md` (when Phase B runs)
   - `.claude/agents/common/baseline-runner.md` (when Phase B runs)
   - `.claude/agents/common/playwright-test-orchestrator.md` (when Phase B runs)
   - `.claude/agents/common/playwright-test-planner.md` (when Phase B runs)
   - `.claude/agents/common/playwright-test-generator.md` (when Phase B runs)
   - `.claude/agents/common/playwright-test-healer.md` (when Phase B runs)
   - `.claude/agents/common/playwright-official.md` (when Phase B runs)
   - `.claude/agents/common/nextjs-scaffolder.md` (unless `--cms-only`)
   - `.claude/agents/common/cms-adapter-generator.md` (unless `--cms-only`)
   - `.claude/agents/common/page-component-generator.md` (unless `--cms-only`)
   - `.claude/agents/common/route-validator.md` (unless `--cms-only`)
   - `.claude/agents/common/playwright-behavioral-parity.md` (unless `--cms-only`)
   - `.claude/agents/common/sonarqube-gate.md` (unless `--cms-only`)
   - `.claude/agents/common/lighthouse-ci-gate.md` (unless `--cms-only`)
   - `.claude/agents/common/ai-remediation-agent.md` (unless `--cms-only`)
7. Verify related skills are readable:
   - WP/CMS:
     - `.claude/skills/PA-reverse-engineering/content-model-inferencer/SKILL.md`
     - `.claude/skills/PA-reverse-engineering/wp-ai-interpreter/SKILL.md`
     - `.claude/skills/PC-cms/strapi-schema-generator/SKILL.md`
     - `.claude/skills/PC-cms/strapi-bootstrapper/SKILL.md`
     - `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`
     - `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md`
   - Phase B:
     - `.claude/skills/PB-test/playwright-suite-generator/SKILL.md`
     - `.claude/skills/PB-test/baseline-runner/SKILL.md`
     - `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
     - `.claude/skills/PB-test/playwright-test-gen/SKILL.md`
     - `.claude/skills/PB-test/playwright-official/SKILL.md`
     - `.claude/skills/PB-test/playwright-cli/SKILL.md`
     - `.claude/skills/PB-test/playwright-pom/SKILL.md`
   - Phase D:
     - `.claude/skills/PD-frontend/nextjs-scaffolder/SKILL.md`
     - `.claude/skills/PD-frontend/cms-adapter-generator/SKILL.md`
     - `.claude/skills/PD-frontend/page-component-generator/SKILL.md`
     - `.claude/skills/PD-frontend/route-validator/SKILL.md`
     - `.claude/skills/PD-frontend/vercel/next-best-practices/SKILL.md`
     - `.claude/skills/PD-frontend/vercel/vercel-react-best-practices/SKILL.md`
     - `.claude/skills/PD-frontend/vercel/vercel-composition-patterns/SKILL.md`
   - Phase E:
     - `.claude/skills/PE-quality/playwright-behavioral-parity/SKILL.md`
     - `.claude/skills/PE-quality/sonarqube-gate/SKILL.md`
     - `.claude/skills/PE-quality/lighthouse-ci-gate/SKILL.md`
     - `.claude/skills/PE-quality/ai-remediation-agent/SKILL.md`

If any prerequisite is missing, stop and report exactly what is missing.

---

## Phase W - WordPress CMS Migration

Use:

- `.claude/agents/common/wordpress-to-strapi.md`
- `.claude/agents/common/content-model-inferencer.md`
- `.claude/agents/common/strapi-schema-generator.md`
- `.claude/agents/common/strapi-bootstrapper.md`
- `.claude/agents/common/content-etl-pipeline.md`
- `.claude/agents/common/graphql-layer-validator.md`

Apply skills:

- `.claude/skills/PA-reverse-engineering/content-model-inferencer/SKILL.md`
- `.claude/skills/PA-reverse-engineering/wp-ai-interpreter/SKILL.md` (only for unknown structures)
- `.claude/skills/PC-cms/strapi-schema-generator/SKILL.md`
- `.claude/skills/PC-cms/strapi-bootstrapper/SKILL.md`
- `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`
- `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md`

Expected outputs:

- `output/<site>/wp-migration/preview/`
- `output/<site>/wp-migration/analysis/`
- `output/<site>/wp-migration/review/REVIEW-MAPPING.md`
- `output/<site>/docs/content-model/SCHEMA-DESIGN.md`
- `output/<site>/cms/generated/` (types/contracts)

### CHECKPOINT WP-1

Present schema + mapping summary and wait for explicit approval before schema apply.

### Post-W handoff (required)

After Phase W (schema applied, Strapi running), run **Phase C content ETL** then:

- Phase B: `/PB-test <site-slug>`
- Phase D: `/PD-frontend <site-slug>`
- Phase E: `/PE-quality <site-slug>` (includes visual look-alike check)

Content load skill: `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`

---

## Phase B - Test-First Contract (default on)

Run unless `--skip-tests` or `--cms-only`.

Execute phase contract from:

- `.claude/commands/PB-test.md`

Primary common agents:

- `.claude/agents/common/playwright-suite-generator.md`
- `.claude/agents/common/baseline-runner.md`
- `.claude/agents/common/playwright-test-orchestrator.md`
- `.claude/agents/common/playwright-test-planner.md`
- `.claude/agents/common/playwright-test-generator.md`
- `.claude/agents/common/playwright-test-healer.md`
- `.claude/agents/common/playwright-official.md`

Must complete before Phase D:

- baseline snapshots and route inventory
- generated P0/P1 suite
- green baseline run on source
- `output/<site>/test/specs/CONTRACT.md`

### CHECKPOINT 2

Present test coverage/parity summary and proceed only after approval.

---

## Phase D - Frontend Generation (default on)

Run unless `--cms-only`.

Use:

- `.claude/agents/common/nextjs-scaffolder.md`
- `.claude/agents/common/cms-adapter-generator.md`
- `.claude/agents/common/page-component-generator.md`
- `.claude/agents/common/route-validator.md`

Apply skills:

- `.claude/skills/PD-frontend/nextjs-scaffolder/SKILL.md`
- `.claude/skills/PD-frontend/cms-adapter-generator/SKILL.md`
- `.claude/skills/PD-frontend/page-component-generator/SKILL.md`
- `.claude/skills/PD-frontend/route-validator/SKILL.md`
- `.claude/skills/PD-frontend/vercel/next-best-practices/SKILL.md`
- `.claude/skills/PD-frontend/vercel/vercel-react-best-practices/SKILL.md`
- `.claude/skills/PD-frontend/vercel/vercel-composition-patterns/SKILL.md`

Rules:

- Next.js 15 + Node.js 22 for generated frontend stack.
- All user-visible content must come from Strapi via adapter (dynamic CMS data only).
- No hardcoded primary content in pages/components.
- Visual/content parity must be measured against WordPress source.

Required artifacts:

- `output/<site>/docs/CMS-ADAPTER-COVERAGE.md`
- `output/<site>/docs/FRONTEND-CMS-WIRING.md`
- `output/<site>/docs/VISUAL-PARITY-REPORT.md`

---

## Phase E - Quality Loop (default on)

Run unless `--cms-only`.

Use:

- `.claude/agents/common/frontend-visual-parity.md` — **look-alike gate first**
- `.claude/agents/common/playwright-behavioral-parity.md`
- `.claude/agents/common/sonarqube-gate.md`
- `.claude/agents/common/lighthouse-ci-gate.md`
- `.claude/agents/common/ai-remediation-agent.md`

Apply skills:

- `.claude/skills/PE-quality/frontend-visual-parity/SKILL.md`
- `.claude/skills/PE-quality/playwright-behavioral-parity/SKILL.md`
- `.claude/skills/PE-quality/sonarqube-gate/SKILL.md`
- `.claude/skills/PE-quality/lighthouse-ci-gate/SKILL.md`
- `.claude/skills/PE-quality/ai-remediation-agent/SKILL.md`

**Visual QA (required):** If the frontend does not look like the WordPress site, run `node scripts/quality/visual-parity-check.mjs <site-slug>`, compare screenshots, fix components/CMS mapping, re-run until pass (max 5 loops).

Remediation loop cap: 5 iterations per failing gate cluster.

### CHECKPOINT 3

Assess gate outcomes and decide pass/fail/escalation path.

### CHECKPOINT 4

Present final parity + quality status and wait for explicit sign-off.

### CHECKPOINT WP-2

After Phase C ETL, present content parity summary and wait for explicit approval before Phase B.

---

## Completion Criteria

Do not mark complete until all are true:

- [ ] WP-1 approved
- [ ] If Phase B ran: Checkpoint 2 approved and `CONTRACT.md` present
- [ ] If Phase D ran: frontend build/routes/CMS wiring complete
- [ ] If Phase E ran: quality gates passed or escalated with explicit approval
- [ ] WP-2 approved (Phase C content ETL, if run)
- [ ] Final Checkpoint 4 approved (for end-to-end path)

## Required Deliverables

1. Paths:
   - `output/<site>/cms/`
   - `output/<site>/frontend/` (unless `--cms-only`)
   - `output/<site>/test/` (if Phase B/E ran)
2. WordPress migration artifacts:
   - `wp-migration/preview/`
   - `wp-migration/analysis/`
   - `wp-migration/review/`
3. Frontend and parity docs (if Phase D/E ran):
   - `CMS-ADAPTER-COVERAGE.md`
   - `FRONTEND-CMS-WIRING.md`
   - `VISUAL-PARITY-REPORT.md`
4. Runtime URLs:
   - WordPress source URL
   - Strapi admin URL + GraphQL endpoint
   - Frontend URL (if generated)
5. Quality status:
   - content ETL parity summary
   - test summary
   - quality gate outcomes
   - remediation iteration count
## Failure Handling

| Failure | Action |
| --- | --- |
| WP API blocked/auth failed | Stop and report; request export credentials or alternate source |
| Unknown-structure AI validation fails | Retry with constrained mapping; escalate after cap |
| Content ETL errors | Fix Phase C `content-etl-pipeline`; verify schema + Strapi permissions |
| Frontend not look-alike | Run `visual-parity-check.mjs`; fix Phase D; re-run Phase E |
| Route/parity mismatch in D/E | Return to Phase D mapping; rerun validations |
| Quality gate unresolved after remediation cap | Produce failure report and escalate |

## Relation to URL Flow

- `url-to-strapi` remains the generic source orchestrator (`A -> E`).
- `wordpress-to-strapi` is WordPress-specialized hybrid orchestration (`W -> C -> B -> D -> E`).
- Both share downstream quality expectations and immutable checkpoint behavior.
