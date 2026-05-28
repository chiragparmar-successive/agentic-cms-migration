---
name: lighthouse-ci-gate
description: Runs Lighthouse CI against the generated Next.js frontend and enforces performance, accessibility, best-practice, and SEO score thresholds.
argument-hint: "<site-slug>"
user-invocable: true
---

# Lighthouse CI Performance Gate

Phase: **E — Quality Loop** (Gate 3 of 3)

Analyse frontend performance, accessibility, best practices, and SEO using Lighthouse CI.

## Precondition

- SonarQube gate results available
- Next.js frontend running (`npm run dev` or `npm run start`)

## Execution

### Step 1: Install Lighthouse CI

```bash
npm install -g @lhci/cli
```

### Step 2: Configure Lighthouse CI

Create `lighthouserc.js` in project root:

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blog',
        'http://localhost:3000/about',
        // ... key routes from route inventory
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'output/<site>/reports/lighthouse/',
    },
  },
};
```

### Step 3: Run Lighthouse CI

```bash
lhci autorun --config lighthouserc.js
```

### Step 4: Performance Thresholds

| Category | Minimum Score | Severity |
|---|---|---|
| Performance | ≥ 80 | Blocking |
| Accessibility | ≥ 90 | Blocking |
| Best Practices | ≥ 90 | Blocking |
| SEO | ≥ 90 | Blocking |

### Step 5: Common Performance Issues to Flag

- **LCP > 2.5s** — Largest Contentful Paint too slow
- **CLS > 0.1** — Layout shift detected
- **FID/INP > 200ms** — Interaction delay
- **Unoptimised images** — Missing `next/image`, oversized assets
- **Render-blocking resources** — Undeferred scripts/styles
- **Missing `<meta>` tags** — SEO metadata gaps
- **Missing ARIA labels** — Accessibility gaps
- **HTTP/2 not used** — Protocol inefficiency

### Step 6: Report

```markdown
# Lighthouse CI Performance Gate Report

## Status: PASS / FAIL

## Scores by Route
| Route | Performance | Accessibility | Best Practices | SEO | Status |
|---|---|---|---|---|---|
| / | 92 | 95 | 100 | 98 | ✅ |
| /blog | 85 | 93 | 95 | 96 | ✅ |
| /about | 78 | 91 | 90 | 94 | ❌ (perf) |

## Key Metrics
| Metric | Value | Threshold | Status |
|---|---|---|---|
| LCP | 1.8s | < 2.5s | ✅ |
| CLS | 0.05 | < 0.1 | ✅ |
| INP | 120ms | < 200ms | ✅ |

## Failing Audits
- ...

## Remediation Recommendations
- ...
```

## Output Contract

- Lighthouse scores per route
- Overall gate status (pass/fail)
- Detailed report at `output/<site>/reports/lighthouse-gate.md`
- Lighthouse HTML reports in `output/<site>/reports/lighthouse/`
- Performance bottleneck list
- Remediation recommendations

## Downstream

Results feed into:
- CHECKPOINT 3 gate decision
- `ai-remediation-agent` (for automated fixes)
