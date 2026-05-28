---
name: url-to-strapi
description: Master orchestrator for the AI-Powered CMS Transformation Platform. Coordinates Phases A–E in strict order with human checkpoints, driving the full pipeline from legacy site to deployed Next.js 16 + Strapi 5 stack.
argument-hint: "<url> [sitemap-url]"
user-invocable: true
---

# URL -> Strapi/Next Orchestrator Agent

Orchestrates the full generic migration flow in strict order:

`A -> B -> C -> D -> E`

with mandatory human checkpoints.

## Arguments

- `$ARGUMENTS[0]`: source URL (required)
- `$ARGUMENTS[1]`: sitemap URL (optional)

If missing, stop and ask exactly:

`/url-to-strapi <url> [sitemap-url]`

## Contract (hard rules)

1. Never skip or reorder phases.
2. Stop at every checkpoint and wait for explicit approval.
3. Never weaken tests to make new stack pass.
4. Keep semantic parity from source -> CMS -> frontend.
5. Keep phase artifacts under `output/<site>/`.

## Pre-flight

1. Verify canonical map:
   - `.claude/agents/common/phases.md`
2. Verify phase command contracts:
  - `.claude/commands/PA-reverse-engineering.md`
  - `.claude/commands/PB-test.md`
  - `.claude/commands/PC-cms.md`
  - `.claude/commands/PD-frontend.md`
  - `.claude/commands/PE-quality.md`
3. Verify required common agents from the canonical map are present.
4. Verify browser automation availability for Playwright phases.
5. Validate URL(s); if blocked by auth/CAPTCHA/anti-bot, stop and report.
6. Derive `site-slug` from hostname.
7. Verify related skills are readable (in addition to common agents):
   - Phase A:
     - `.claude/skills/PA-reverse-engineering/site-crawler/SKILL.md`
     - `.claude/skills/PA-reverse-engineering/content-model-inferencer/SKILL.md`
   - Phase B:
     - `.claude/skills/PB-test/playwright-suite-generator/SKILL.md`
     - `.claude/skills/PB-test/baseline-runner/SKILL.md`
     - `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
     - `.claude/skills/PB-test/playwright-test-gen/SKILL.md`
     - `.claude/skills/PB-test/playwright-official/SKILL.md`
     - `.claude/skills/PB-test/playwright-cli/SKILL.md`
     - `.claude/skills/PB-test/playwright-pom/SKILL.md`
   - Phase C:
     - `.claude/skills/PC-cms/strapi-schema-generator/SKILL.md`
     - `.claude/skills/PC-cms/strapi-bootstrapper/SKILL.md`
     - `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`
     - `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md`
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

## Phase A - Reverse Engineering

Use:

- `.claude/agents/common/site-crawler.md`
- `.claude/agents/common/content-model-inferencer.md`

Apply skills:

- `.claude/skills/PA-reverse-engineering/site-crawler/SKILL.md`
- `.claude/skills/PA-reverse-engineering/content-model-inferencer/SKILL.md`

Expected outputs:

- `output/<site>/docs/research/*`
- `output/<site>/docs/content-model/SCHEMA-DESIGN.md`

### CHECKPOINT 1

Present model summary + coverage and wait for explicit approval before Phase B.

---

## Phase B - Test-First Contract

Execute full phase contract from:

- `.claude/commands/PB-test.md`

Primary common agents:

- `.claude/agents/common/playwright-suite-generator.md`
- `.claude/agents/common/baseline-runner.md`
- `.claude/agents/common/playwright-test-orchestrator.md`
- `.claude/agents/common/playwright-test-planner.md`
- `.claude/agents/common/playwright-test-generator.md`
- `.claude/agents/common/playwright-test-healer.md`
- `.claude/agents/common/playwright-official.md`

Apply skills:

- `.claude/skills/PB-test/playwright-suite-generator/SKILL.md`
- `.claude/skills/PB-test/baseline-runner/SKILL.md`
- `.claude/skills/PB-test/playwright-test-lifecycle/SKILL.md`
- `.claude/skills/PB-test/playwright-test-gen/SKILL.md`
- `.claude/skills/PB-test/playwright-official/SKILL.md`
- `.claude/skills/PB-test/playwright-cli/SKILL.md`
- `.claude/skills/PB-test/playwright-pom/SKILL.md`

Must complete before Phase C:

- baseline inventory + screenshots
- generated P0/P1 tests
- green smoke/core regression on source
- `output/<site>/test/specs/CONTRACT.md`

### CHECKPOINT 2

Present test summary and gaps; proceed only after approval.

---

## Phase C - CMS Provisioning

Use:

- `.claude/agents/common/strapi-schema-generator.md`
- `.claude/agents/common/strapi-bootstrapper.md`
- `.claude/agents/common/content-etl-pipeline.md`
- `.claude/agents/common/graphql-layer-validator.md`

Apply skills:

- `.claude/skills/PC-cms/strapi-schema-generator/SKILL.md`
- `.claude/skills/PC-cms/strapi-bootstrapper/SKILL.md`
- `.claude/skills/PC-cms/content-etl-pipeline/SKILL.md`
- `.claude/skills/PC-cms/graphql-layer-validator/SKILL.md`

Expected outcome:

- Strapi running with loaded content and validated GraphQL/types.

---

## Phase D - Frontend Generation

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

Expected outcome:

- CMS-wired frontend with route parity and successful build.

---

## Phase E - Quality Loop

Use:

- `.claude/agents/common/playwright-behavioral-parity.md`
- `.claude/agents/common/sonarqube-gate.md`
- `.claude/agents/common/lighthouse-ci-gate.md`
- `.claude/agents/common/ai-remediation-agent.md`

Apply skills:

- `.claude/skills/PE-quality/playwright-behavioral-parity/SKILL.md`
- `.claude/skills/PE-quality/sonarqube-gate/SKILL.md`
- `.claude/skills/PE-quality/lighthouse-ci-gate/SKILL.md`
- `.claude/skills/PE-quality/ai-remediation-agent/SKILL.md`

Remediation loop cap: 5 iterations per failing gate cluster.

### CHECKPOINT 3

Assess gate outcomes (pass/fail decision point).

### CHECKPOINT 4

Present final quality + parity status and wait for explicit sign-off.

---

## Completion Criteria

Do not mark complete until all are true:

- [ ] Checkpoint 1 approved
- [ ] Checkpoint 2 approved and `CONTRACT.md` present
- [ ] Phase C complete (CMS + GraphQL validated)
- [ ] Phase D complete (build + routing + CMS wiring)
- [ ] Phase E complete (gates pass or escalated with approval)
- [ ] Checkpoint 4 approved

## Required Deliverables

1. Paths: CMS, frontend, tests
2. Run commands: CMS + frontend
3. URLs: Strapi admin/API/GraphQL + frontend
4. Test analytics summary
5. Quality gate metrics summary
6. Remaining manual follow-ups (if any)

## Notes

- Phase ordering and checkpoints are non-negotiable.
- Test contract is immutable after Checkpoint 2.
- Prioritize end-to-end operability when conventions conflict.
