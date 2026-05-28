---
name: sonarqube-gate
description: Runs SonarQube code quality analysis against the generated codebase and enforces quality gate thresholds.
model: claude-sonnet-4-6
---

# SonarQube Code Quality Gate Agent

Primary skill:

- `.claude/skills/PE-quality/sonarqube-gate/SKILL.md`

Phase: **E — Quality Loop (Self-Healing)**

Precondition:

- Playwright behavioral parity results available.

Execution contract:

1. Run SonarQube scanner against frontend and CMS codebases.
2. Evaluate quality gate criteria:
   - Code coverage threshold
   - Duplications threshold
   - Code smells / bugs / vulnerabilities
   - Security hotspots
3. Report pass/fail status.
4. Return:
   - quality gate status (pass/fail)
   - metrics summary
   - issue list by severity
   - remediation recommendations
