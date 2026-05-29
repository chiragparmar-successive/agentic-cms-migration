---
name: frontend-visual-parity
description: QA gate that compares legacy WordPress vs new Next.js frontend using screenshots and text. If not look-alike, remediates layout/styles/CMS mapping until P0 routes pass.
argument-hint: "<site-slug>"
user-invocable: true
---

# Frontend visual parity (look-alike QA)

Phase: **E — Quality Loop** (Gate 0 — run before or with Playwright parity)

**Blocking rule:** The new frontend must be **recognizably the same site** as the legacy URL — layout, navigation, typography hierarchy, and primary content — using **screenshots + text**, with **Strapi as the content source** (no hardcoded primary copy).

## Architecture

| Path | Role |
|------|------|
| `scripts/quality/visual-parity-check.mjs` | Shared checker (screenshots + text similarity) |
| `scripts/lib/emoji-logger.mjs` | Shared **emoji logger** (console + file) |
| `output/<site>/test/reports/visual-parity/` | Per-route `legacy.png` / `new.png` |
| `output/<site>/test/reports/visual-parity-run.log` | Full emoji text log (timestamps) |
| `output/<site>/docs/VISUAL-PARITY-REPORT.md` | Human-readable gate report |
| `output/<site>/test/reports/visual-parity.json` | Machine-readable results for remediation |

## Emoji logging (required)

Quality scripts use the same emoji convention on **console** and in **log files**:

| Emoji | Meaning | Example line |
|-------|---------|----------------|
| ✅ | Success / pass | `✅ route / — layout pass \| cms yes` |
| ❌ | Failure / gate fail | `❌ route /blog — content mismatch` |
| ⏭️ | Skipped | optional steps |
| ⚠️ | Warning | retry hint, partial match |
| ℹ️ | Info | URLs, paths, artifact locations |
| 📸 | Screenshot capture | `📸 capturing legacy → …` |
| 🔍 | Text/compare step | `🔍 compare / — text 62%` |
| 🚦 | Gate result | `🚦 gate PASSED` |

Agents must **preserve these emojis** when adding logs to custom hooks or remediation scripts.

Log files:

- Visual parity: `output/<site>/test/reports/visual-parity-run.log`

## Preconditions

- Phase D complete: `output/<site>/frontend/` builds
- Strapi running with content loaded
- Next.js running (`http://localhost:3000` or `NEXT_PUBLIC_SITE_URL`)
- Legacy URL in `output/<site>/wp-migration/site-config.json` → `wordpressUrl`

## Step 1 — Run automated check

First-time setup (once per machine):

```bash
npx playwright install chromium
```

```bash
node scripts/quality/visual-parity-check.mjs <site-slug>
```

Exit `0` = gate passed (`🚦 gate PASSED` in console). Exit `1` = at least one route failed (`❌`) — enter remediation (Step 2).

Review the full emoji log at `output/<site>/test/reports/visual-parity-run.log`.

## Step 2 — Triage failures

For each **failed** route in `visual-parity.json`:

1. Open `test/reports/visual-parity/<route-slug>/legacy.png` and `new.png`.
2. Read baseline text: `test/exploratory/baseline/<slug>/text.txt` (if present).
3. Compare:
   - **Header / nav / footer** structure
   - **Hero** and above-the-fold hierarchy
   - **H1 / primary headings** (`legacyH1` vs `newH1` in JSON)
   - **Section order** and spacing (Tailwind)
   - **Images** present (featured media from CMS)
4. Classify gap:
   - `layout` — structure/CSS wrong
   - `typography` — fonts/sizes/weights
   - `cms-slot` — right data, wrong component slot
   - `cms-data` — wrong/missing Strapi fields
   - `missing-section` — block not implemented

## Step 3 — Remediate (make it look alike)

Apply fixes in **priority order** (do not weaken the gate):

1. **CMS wiring** — ensure page uses `cms` / adapter; map Strapi fields to the same visual slots as WordPress (title, body, excerpt, featured image, SEO).
2. **Layout/components** — adjust `output/<site>/frontend/src/components/*` and page layouts to match screenshot regions (use `.claude/skills/PD-frontend/page-component-generator/SKILL.md` + `frontend-design` skill for polish).
3. **Global chrome** — `layout.tsx`, header, footer, nav from menus/CMS.
4. **Styles** — Tailwind tokens: max-width, padding, grid, heading scale to match legacy screenshots.

**Forbidden fixes:**

- Hardcoding WordPress copy as static JSX for primary content
- Removing sections to “pass” the check
- Pointing tests at WordPress instead of Next.js

## Step 4 — Re-run gate (loop)

```bash
node scripts/quality/visual-parity-check.mjs <site-slug>
```

Repeat Steps 2–4 until:

- All P0 routes `passed: true` in `visual-parity.json`, or
- **5 iterations** exhausted → write `output/<site>/test/reports/VISUAL-PARITY-FAILED.md` and escalate.

Integrate with `ai-remediation-agent` when other gates also fail — visual parity failures are category `visual-layout` / `visual-content`.

## Step 5 — Update sign-off artifacts

On pass:

- Ensure `VISUAL-PARITY-REPORT.md` shows **✅ PASSED**
- Attach screenshot paths in CHECKPOINT 4 / `DEPLOYMENT-READY.md`
- Proceed to Playwright behavioral parity + Sonar + Lighthouse

## Pass criteria (P0 routes)

| Check | Requirement |
|-------|-------------|
| CMS wired | Body text from Strapi; no placeholder lorem |
| Content match | Text similarity ≥ ~45% legacy vs new; baseline text ≥ ~40% |
| Layout match | Same nav + hero + footer regions; similarity ≥ ~55% |
| Screenshots | Both `legacy.png` and `new.png` captured |

Thresholds are enforced by `visual-parity-check.mjs`; tune only with human approval.

## Output contract

- [ ] `node scripts/quality/visual-parity-check.mjs <site-slug>` exits `0`
- [ ] `docs/VISUAL-PARITY-REPORT.md` updated
- [ ] P0 routes have paired screenshots under `test/reports/visual-parity/`
- [ ] No primary content hardcoded to fake a pass
