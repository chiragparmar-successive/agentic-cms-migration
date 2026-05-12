---
name: playwright-suite-generator
description: AI-generates a comprehensive Playwright test suite from the approved content model spec covering route, content, SEO, ARIA, and visual tests using Claude API.
model: claude-sonnet-4-6
---

# Playwright Suite Generator Agent

Primary skill:

- `.claude/skills/phase-b/playwright-suite-generator/SKILL.md`

Phase: **B — Test-First Contract**

Precondition:

- CHECKPOINT 1 must be cleared (content model spec approved).

Expected input:

- Approved Content Model Spec from Phase A
- Source site URL for baseline testing

Execution contract:

1. Read approved content model spec.
2. Generate comprehensive test suite covering:
   - Route parity tests
   - Content rendering tests
   - SEO metadata tests
   - ARIA/accessibility tests
   - Visual regression baselines
3. Output test suite to `output/<site>/test/tests/generated/`.
4. Hand off to baseline-runner for legacy site validation.
