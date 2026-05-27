---
name: route-validator
description: Validates URL parity between the source site and the generated Next.js app. Confirms all source routes have corresponding target routes before entering the quality loop.
argument-hint: "<site-slug>"
user-invocable: true
---

# Route Validator

Phase: **D — Frontend Generation** (Step 4 of 4)

Confirm every source URL has a matching route in the generated Next.js app before proceeding to Phase E testing.

## Precondition

- Frontend pages generated (from `page-component-generator`)
- Route inventory from Phase A `site-crawler`

## Execution

### Step 1: Load Source Route Inventory

Read the route inventory from `output/<site>/docs/research/CONTENT-STRUCTURE.md`.
Extract all discovered source URLs and their page types.

### Step 2: Enumerate Target Routes

Scan the Next.js `app/` directory to enumerate all generated routes:

```bash
find output/<site>/frontend/src/app -name "page.tsx" -o -name "page.ts" | sort
```

Map file paths to URL patterns:
- `app/page.tsx` → `/`
- `app/blog/page.tsx` → `/blog`
- `app/blog/[slug]/page.tsx` → `/blog/:slug`
- `app/about/page.tsx` → `/about`

### Step 3: Compare Routes

For each source route:
1. Find matching target route (exact or dynamic segment match)
2. Classify result:
   - **Matched** — source route has a corresponding target page
   - **Missing** — source route has no target page (must be fixed before Phase E)
   - **Extra** — target has routes not in source (acceptable, document them)
   - **Renamed** — URL changed (may break tests, document redirect)

### Step 4: Dynamic Route Validation

For dynamic routes (e.g., `/blog/[slug]`):
1. Verify the route handles all known slugs from source
2. Check that `generateStaticParams` or dynamic rendering covers the full set
3. Test at least one concrete URL per dynamic pattern

### Step 5: Report

Generate route parity report:

```markdown
# Route Parity Report

## Summary
- Source routes: N
- Matched: N
- Missing: N
- Extra: N

## Matched Routes
| Source URL | Target Route | Status |
|---|---|---|
| / | app/page.tsx | ✅ |
| /blog | app/blog/page.tsx | ✅ |
| /blog/:slug | app/blog/[slug]/page.tsx | ✅ |

## Missing Routes (MUST FIX)
| Source URL | Expected Target |
|---|---|

## Extra Routes (OK)
| Target Route | Notes |
|---|---|
```

### Step 6: CMS + visual gate (before Phase E)

Confirm alongside route parity:

1. `output/<site>/docs/FRONTEND-CMS-WIRING.md` exists and all P0 routes are `pass`
2. `output/<site>/docs/VISUAL-PARITY-REPORT.md` exists with legacy URL vs new frontend comparison

Block Phase E if P0 routes have `CMS wired: no` or `Content match: fail`.

### Step 7: Gate Decision

- If **missing routes = 0** and CMS/visual gates pass: Route parity confirmed, proceed to Phase E.
- If **missing routes > 0**: Report missing routes and block Phase E until fixed.

## Output Contract

- Route parity report at `output/<site>/docs/ROUTE-PARITY-REPORT.md`
- Pass/fail status
- Missing routes list (if any)

## Downstream

Output feeds into:
- Phase E: `playwright-behavioral-parity` (tests run against validated routes)
