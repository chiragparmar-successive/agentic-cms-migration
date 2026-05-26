---
name: sonarqube-gate
description: Runs SonarQube code quality analysis against the generated frontend and CMS codebases. Enforces quality gate thresholds for bugs, vulnerabilities, code smells, duplication, and coverage.
argument-hint: "<site-slug>"
user-invocable: true
---

# SonarQube Code Quality Gate

Phase: **E — Quality Loop** (Gate 2 of 3)

Analyse code quality of the generated Next.js frontend and Strapi CMS codebases and enforce minimum quality thresholds before deployment.

---

## Preconditions

- `output/<site>/frontend/` exists and `npm run build` passes (Phase D complete)
- `output/<site>/cms/` exists and Strapi builds (Phase C complete)
- Playwright behavioral parity results are available (Phase E Step 2 complete)

---

## Step 1 — Detect or Start SonarQube Server

### 1.1 Check for existing server

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/api/system/status
```

If this returns `200` with `"status":"UP"` → server is running, skip to Step 2.

If not reachable → proceed to 1.2.

### 1.2 Start SonarQube via Docker

Check Docker is available:

```bash
docker --version
```

If Docker is available, start SonarQube Community Edition:

```bash
docker run -d \
  --name sonarqube-cms-migration \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:community
```

Wait for SonarQube to become ready — it takes ~60 seconds on first start. Poll every 10 seconds until `status` is `UP`:

```bash
until curl -s http://localhost:9000/api/system/status | grep -q '"status":"UP"'; do
  echo "Waiting for SonarQube..."; sleep 10
done
echo "SonarQube is ready."
```

If Docker is **not** available → fall back to ESLint static analysis (see Step 6).

### 1.3 Create authentication token

On first run, the default credentials are `admin` / `admin`. Generate a token via the API:

```bash
curl -s -u admin:admin -X POST \
  "http://localhost:9000/api/user_tokens/generate?name=cms-migration-token" \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4
```

Save the returned token — it will be used in all subsequent API calls and scanner runs as `$SONAR_TOKEN`.

If the admin password has already been changed, stop and ask the user to provide `SONAR_TOKEN` and `SONAR_HOST_URL` as environment variables.

---

## Step 2 — Generate Coverage Reports

Coverage data improves SonarQube analysis. Attempt to generate it; if tests do not exist, continue without coverage.

### 2.1 Frontend coverage

```bash
cd output/<site>/frontend
npm run test -- --coverage --coverageReporters=lcov --passWithNoTests 2>/dev/null || true
```

Check if `output/<site>/frontend/coverage/lcov.info` was created. Note result (present / absent).

### 2.2 CMS coverage (if applicable)

```bash
cd output/<site>/cms
npm run test -- --coverage 2>/dev/null || true
```

Check if `output/<site>/cms/coverage/lcov.info` was created. Note result (present / absent).

---

## Step 3 — Configure sonar-project.properties

Create `sonar-project.properties` at the **workspace root** (not inside frontend or cms):

```properties
sonar.projectKey=<site-slug>-cms-migration
sonar.projectName=<site-slug> CMS Migration
sonar.projectVersion=1.0

# Sources — both frontend and CMS
sonar.sources=output/<site>/frontend/src,output/<site>/cms/src
sonar.tests=output/<site>/frontend/tests,output/<site>/test/tests

# Exclusions
sonar.exclusions=\
  **/node_modules/**,\
  **/.next/**,\
  **/generated/**,\
  **/*.spec.ts,\
  **/*.test.ts,\
  **/playwright-report/**,\
  **/coverage/**,\
  **/build/**,\
  **/dist/**

# TypeScript
sonar.javascript.file.suffixes=.js,.jsx
sonar.typescript.file.suffixes=.ts,.tsx

# Coverage — include only if files were generated in Step 2
# (remove the lines below if coverage/lcov.info does not exist)
sonar.javascript.lcov.reportPaths=output/<site>/frontend/coverage/lcov.info

# Encoding
sonar.sourceEncoding=UTF-8
```

**Important:** If `output/<site>/cms/src` does not exist (Strapi stores code elsewhere), remove that path from `sonar.sources` and add the actual Strapi source directory instead (commonly `output/<site>/cms/` with appropriate exclusions).

If `coverage/lcov.info` was not generated in Step 2, remove the `sonar.javascript.lcov.reportPaths` line to avoid a scanner error.

---

## Step 4 — Run sonar-scanner

### 4.1 Install sonar-scanner (if not present)

```bash
npx --yes sonar-scanner --version 2>/dev/null || npm install -g sonar-scanner
```

### 4.2 Execute scan

Run from the workspace root where `sonar-project.properties` was created:

```bash
npx sonar-scanner \
  -Dsonar.host.url=${SONAR_HOST_URL:-http://localhost:9000} \
  -Dsonar.token=${SONAR_TOKEN}
```

The scanner will output a task URL at the end of the run, e.g.:

```
INFO: More about the report processing at http://localhost:9000/api/ce/task?id=<task-id>
```

Capture the `task-id` from this line — needed in Step 5.

If the scanner exits non-zero, read the full error output:
- `Authentication failed` → SONAR_TOKEN is wrong; ask user to verify.
- `Project not found` → the project key doesn't exist yet; SonarQube auto-creates it on first scan, so this should not occur.
- `Source files not found` → fix paths in `sonar-project.properties` and re-run.

---

## Step 5 — Poll for Quality Gate Result

SonarQube processes analysis asynchronously. Poll the task status until it completes, then fetch the quality gate result.

### 5.1 Poll task completion

```bash
TASK_ID=<captured-task-id>
STATUS=""
until [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELLED" ]; do
  STATUS=$(curl -s -u ${SONAR_TOKEN}: \
    "http://localhost:9000/api/ce/task?id=${TASK_ID}" \
    | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Task status: $STATUS"
  sleep 5
done
```

If `STATUS` is `FAILED` or `CANCELLED` → the analysis itself failed (not a quality gate failure). Read the error from the API response and report it. Do not proceed to gate result.

### 5.2 Fetch quality gate status

```bash
curl -s -u ${SONAR_TOKEN}: \
  "http://localhost:9000/api/qualitygates/project_status?projectKey=<site-slug>-cms-migration"
```

The response includes:
- `projectStatus.status` — `OK` (gate passed) or `ERROR` (gate failed)
- `projectStatus.conditions[]` — per-metric details: metric name, comparator, threshold, actual value, status

Parse this response to build the report in Step 7.

### 5.3 Fetch issue counts by severity

```bash
# Bugs
curl -s -u ${SONAR_TOKEN}: \
  "http://localhost:9000/api/issues/search?projectKeys=<site-slug>-cms-migration&types=BUG&severities=BLOCKER,CRITICAL&ps=1" \
  | grep -o '"total":[0-9]*' | cut -d: -f2

# Vulnerabilities
curl -s -u ${SONAR_TOKEN}: \
  "http://localhost:9000/api/issues/search?projectKeys=<site-slug>-cms-migration&types=VULNERABILITY&severities=BLOCKER,CRITICAL&ps=1" \
  | grep -o '"total":[0-9]*' | cut -d: -f2

# Code smells
curl -s -u ${SONAR_TOKEN}: \
  "http://localhost:9000/api/issues/search?projectKeys=<site-slug>-cms-migration&types=CODE_SMELL&ps=1" \
  | grep -o '"total":[0-9]*' | cut -d: -f2
```

---

## Step 6 — ESLint Fallback (no Docker / no SonarQube)

Use this path **only** if SonarQube is unavailable.

### 6.1 Install ESLint quality plugins

```bash
cd output/<site>/frontend
npm install --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-plugin-security \
  eslint-plugin-sonarjs
```

### 6.2 Create ESLint config for quality scan

Create `output/<site>/frontend/.eslintrc.quality.json`:

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": { "project": "./tsconfig.json" },
  "plugins": ["@typescript-eslint", "security", "sonarjs"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "sonarjs/cognitive-complexity": ["error", 15],
    "sonarjs/no-duplicate-string": "warn",
    "sonarjs/no-identical-functions": "error",
    "sonarjs/no-redundant-boolean": "error"
  }
}
```

### 6.3 Run ESLint and capture output

```bash
cd output/<site>/frontend
npx eslint src/ --ext .ts,.tsx \
  --config .eslintrc.quality.json \
  --format json \
  -o ../../reports/eslint-quality.json 2>/dev/null
echo "ESLint exit code: $?"
```

### 6.4 Evaluate pass/fail from ESLint output

Parse `eslint-quality.json`:
- Count `errorCount` and `warningCount` across all files
- **FAIL** if total `errorCount` > 0 (errors map to blocker/critical issues)
- **WARN** if total `warningCount` > 10
- **PASS** if `errorCount` = 0

Report clearly that this is an ESLint fallback, not a full SonarQube scan, and recommend setting up SonarQube for production gating.

---

## Step 7 — Quality Gate Thresholds

Apply these thresholds to the results from Step 5 (SonarQube) or Step 6 (ESLint fallback):

| Metric | Threshold | Blocking |
|---|---|---|
| Bugs (BLOCKER/CRITICAL) | 0 | Yes |
| Vulnerabilities (BLOCKER/CRITICAL) | 0 | Yes |
| Security Hotspots reviewed | 100% | Yes |
| Code Smells | < 50 total | No (warning) |
| Duplication | < 5% | No (warning) |
| Coverage | > 60% (only if lcov.info present) | No (warning) |
| Maintainability Rating | A or B | No (warning) |

**Gate result:**
- Any blocking threshold breached → gate status = **FAILED**
- All blocking thresholds met → gate status = **PASSED** (warnings are noted but do not block)

---

## Step 8 — Write Report

Write the quality gate report to `output/<site>/reports/sonarqube-gate.md`:

```markdown
# SonarQube Quality Gate Report

- **Site:** <site-slug>
- **Date:** <timestamp>
- **Analysis method:** SonarQube <version> | ESLint fallback
- **Gate status:** PASSED / FAILED

## Metrics Summary

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Bugs (blocker/critical) | <n> | 0 | PASS/FAIL |
| Vulnerabilities (blocker/critical) | <n> | 0 | PASS/FAIL |
| Security Hotspots | <n> reviewed / <total> | 100% | PASS/FAIL |
| Code Smells | <n> | < 50 | PASS/WARN |
| Duplication | <n>% | < 5% | PASS/WARN |
| Coverage | <n>% | > 60% | PASS/WARN/N/A |
| Maintainability | <rating> | A or B | PASS/WARN |

## Blocking Issues (must fix before deployment)

### Bugs
- <file>:<line> — <rule> — <message>

### Vulnerabilities
- <file>:<line> — <rule> — <message>

## Warnings (non-blocking)

### Code Smells
- <file>:<line> — <rule> — <message>

## Remediation Recommendations

For each blocking issue, provide:
1. File path and line number
2. What the issue is
3. Concrete fix with corrected code snippet
```

Populate every section from the actual API responses or ESLint JSON — do not leave placeholder text in the written file.

---

## Output Contract

- `output/<site>/reports/sonarqube-gate.md` — written and fully populated
- Gate status returned to Phase E Step 5 (CHECKPOINT 3): **PASSED** or **FAILED**
- If FAILED: issue list with file locations passed to `ai-remediation-agent`

## Downstream

- Gate status feeds CHECKPOINT 3 decision in Phase E
- Blocking issues feed `ai-remediation-agent` for automated patch generation
- Final gate status included in `DEPLOYMENT-READY.md`
