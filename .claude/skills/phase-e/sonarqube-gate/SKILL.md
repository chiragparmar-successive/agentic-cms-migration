---
name: sonarqube-gate
description: Runs SonarQube code quality analysis against the generated frontend and CMS codebases. Enforces quality gate thresholds for bugs, vulnerabilities, code smells, duplication, and coverage.
argument-hint: "<site-slug>"
user-invocable: true
---

# SonarQube Code Quality Gate

Phase: **E — Quality Loop** (Gate 2 of 3)

Analyse code quality of generated codebases and enforce minimum quality thresholds.

## Precondition

- Playwright behavioral parity results available
- Frontend and CMS codebases generated

## Execution

### Step 1: Configure SonarQube Scanner

Create `sonar-project.properties` in project root:

```properties
sonar.projectKey=<site-slug>-migration
sonar.projectName=<Site Name> CMS Migration
sonar.sources=output/<site>/frontend/src,output/<site>/cms/src
sonar.exclusions=**/node_modules/**,**/generated/**,**/*.spec.ts,**/*.test.ts
sonar.typescript.lcov.reportPaths=output/<site>/frontend/coverage/lcov.info
sonar.javascript.lcov.reportPaths=output/<site>/cms/coverage/lcov.info
```

### Step 2: Run Scanner

```bash
npx sonar-scanner \
  -Dsonar.host.url=${SONAR_HOST_URL:-http://localhost:9000} \
  -Dsonar.token=${SONAR_TOKEN}
```

If SonarQube server is not available, fall back to local static analysis using ESLint with security and quality plugins:

```bash
cd output/<site>/frontend && npx eslint src/ --ext .ts,.tsx --format json -o ../reports/eslint-frontend.json
cd output/<site>/cms && npx eslint src/ --ext .ts --format json -o ../reports/eslint-cms.json
```

### Step 3: Quality Gate Thresholds

| Metric | Threshold | Severity |
|---|---|---|
| Bugs | 0 critical/blocker | Blocking |
| Vulnerabilities | 0 critical/blocker | Blocking |
| Security Hotspots | All reviewed | Blocking |
| Code Smells | < 50 per project | Warning |
| Duplication | < 5% | Warning |
| Coverage | > 60% (if tests exist) | Warning |
| Maintainability Rating | A or B | Warning |

### Step 4: Report

```markdown
# SonarQube Quality Gate Report

## Status: PASS / FAIL

## Metrics
| Metric | Frontend | CMS | Threshold | Status |
|---|---|---|---|---|
| Bugs | N | N | 0 critical | ✅/❌ |
| Vulnerabilities | N | N | 0 critical | ✅/❌ |
| Code Smells | N | N | < 50 | ✅/❌ |
| Duplication | N% | N% | < 5% | ✅/❌ |

## Issues by Severity
### Critical (MUST FIX)
- ...
### Major
- ...
### Minor
- ...

## Remediation Recommendations
- ...
```

## Output Contract

- Quality gate status (pass/fail)
- Metrics report at `output/<site>/reports/sonarqube-gate.md`
- Issue list by severity with file locations
- Remediation recommendations

## Downstream

Results feed into:
- CHECKPOINT 3 gate decision
- `ai-remediation-agent` (for automated fixes)
