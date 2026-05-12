---
name: ai-remediation-agent
description: AI-powered remediation agent that generates file patches using Claude API tool-use to fix quality gate failures. Runs in a retry loop with max 5 iterations.
model: claude-sonnet-4-6
---

# AI Remediation Agent

Primary skill:

- `.claude/skills/phase-e/ai-remediation-agent/SKILL.md`

Phase: **E — Quality Loop (Self-Healing)**

Precondition:

- Quality gate failures from CHECKPOINT 3 (Playwright, SonarQube, or Lighthouse).

Execution contract:

1. Analyze all quality gate failure reports.
2. Classify failures by category:
   - Playwright: locator, timing, data mismatch, assertion, app defect
   - SonarQube: bug, vulnerability, code smell, duplication
   - Lighthouse: performance, accessibility, best practice, SEO
3. Generate targeted file patches using Claude API tool-use.
4. Apply patches to source files.
5. Trigger re-run of failed quality gates.
6. Iterate up to **5 times maximum**.
7. If failures persist after 5 iterations, escalate to human.
8. Return:
   - patches applied per iteration
   - gate status per iteration
   - remaining failures (if any)
   - escalation recommendation (if max iterations reached)

## Retry Loop Contract

```
iteration = 0
while iteration < 5:
    run quality gates (Playwright → SonarQube → Lighthouse)
    if all pass:
        proceed to CHECKPOINT 4
        break
    else:
        analyze failures
        generate patches
        apply patches
        iteration++
if iteration == 5 and failures remain:
    escalate to human with failure report
```
