# Skills Layout

Skills are grouped by **phase** first, then by **skill name**. Entry point for each skill is always **`SKILL.md`** in its folder.

## Tree (summary)

```text
.claude/skills/
  README.md
  common/
    phases.md
  PA-reverse-engineering/                          # Reverse Engineering
    site-crawler/SKILL.md
    wp-source-adapter/SKILL.md
    wp-ai-interpreter/SKILL.md
    content-model-inferencer/SKILL.md
  PB-test/                          # Test-First Contract
    playwright-suite-generator/SKILL.md
    baseline-runner/SKILL.md
    playwright-test-lifecycle/SKILL.md
    playwright-official/SKILL.md
    playwright-cli/SKILL.md
    playwright-pom/SKILL.md

  PC-cms/                          # CMS Provisioning
    strapi-schema-generator/SKILL.md
    strapi-bootstrapper/SKILL.md
    content-etl-pipeline/SKILL.md
    graphql-layer-validator/SKILL.md
  PD-frontend/                          # Frontend Generation
    nextjs-scaffolder/SKILL.md
    cms-adapter-generator/SKILL.md
    page-component-generator/SKILL.md
    route-validator/SKILL.md
  PE-quality/                          # Quality Loop (Self-Healing)
    frontend-visual-parity/SKILL.md
    playwright-behavioral-parity/SKILL.md
    sonarqube-gate/SKILL.md
    lighthouse-ci-gate/SKILL.md
    ai-remediation-agent/SKILL.md
  orchestrators/
    url-to-strapi/SKILL.md
    wordpress-to-strapi/SKILL.md
  frontend/
    vercel/                         # read-only vendored packs (see skills-lock.json)
      cra-to-next-migration/
      next-best-practices/
      next-cache-components/
      vercel-composition-patterns/
      vercel-react-best-practices/
```

## Phase Flow

```
Phase A → CHECKPOINT 1 → Phase B → CHECKPOINT 2 → Phase C → Phase D → Phase E → CHECKPOINT 3 → (PASS → CHECKPOINT 4) / (FAIL → AI Remediation → retry)
```

Canonical phase map:

- `.claude/agents/common/phases.md`

## Design Principles

- One clear responsibility per skill (one phase step).
- Consider splitting past ~300–400 lines or when extraction + implementation + QA are mixed.
- Orchestrators stay thin: coordinate child skills, verify contracts, report status.
- Phase folders (`PA-reverse-engineering` through `PE-quality`) keep skills aligned with the pipeline.
- Keep vendor/framework guidance under `frontend/vercel/` so phase skills stay stable.
- Human checkpoints (1–4) are non-negotiable gates; no skill may bypass them.

## Vendored Skills

Folders under `frontend/vercel/` are pinned in **`skills-lock.json`** at the repo root. Re-sync from upstream, then update hashes there.

## Checkpoints

| Checkpoint | Location       | Gate                                                         |
| ---------- | -------------- | ------------------------------------------------------------ |
| 1          | End of Phase A | Human approves Content Model Spec                            |
| 2          | End of Phase B | Human approves Test Suite (immutable behavioral contract)    |
| 3          | Phase E gate   | All quality gates pass (Playwright + SonarQube + Lighthouse) |
| 4          | End of Phase E | Pre-Deployment Sign-Off (human approves for deploy)          |
