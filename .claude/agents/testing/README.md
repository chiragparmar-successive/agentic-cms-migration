# Testing Agents

Testing agents use a hub-and-spoke model:

- Orchestrator: routes work to the right specialist
- Specialists: execute one phase each

## Files

- `playwright-test-orchestrator.agent.md`
- `playwright-test-planner.agent.md`
- `playwright-test-generator.agent.md`
- `playwright-test-healer.agent.md`

## Canonical Skill Dependency

All testing agents depend on:

- `.claude/skills/testing/playwright-test-lifecycle/SKILL.md`

## Mandatory Output Location

All testing artifacts must be created under the site test project root:

- `output/<site>/test`

With:

- `specs/` for planner output
- `tests/generated/` for generator + healer output
- `test-results/`, `playwright-report/`, `reports/`, and any traces or attachments from Playwright runs (configure `playwright.config.ts` with `outputDir` and reporter paths so nothing is written at the monorepo root)

Do not create root-level `test-results/` or `playwright-report/` for site-specific work.

## Routing Intent

- Planning request -> planner
- Test creation request -> generator
- Failing/flaky test request -> healer
