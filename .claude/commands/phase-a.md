---
description: "Phase A — Reverse Engineering: Crawl the legacy site, optionally extract WordPress content, infer a canonical content model, and gate on human approval before the spec is used downstream."
argument-hint: "<legacy-site-url> [sitemap-url]"
---

## Phase A — Reverse Engineering

Run this phase against the **legacy source site** before any migration work begins.
The Content Model Spec produced here becomes the authoritative schema used by Phase C to provision Strapi.

### Skills Used (in order)

1. `.claude/skills/phase-a/site-crawler/SKILL.md` — full-site crawl, DOM, routes, media, sitemaps
2. `.claude/skills/phase-a/wp-source-adapter/SKILL.md` — WordPress REST API extraction (optional, only if WP detected)
3. `.claude/skills/phase-a/content-model-inferencer/SKILL.md` — AI-powered content model inference

Arguments: $ARGUMENTS

---

## Step 1 — Preconditions

1. Verify all three skill files listed above are readable.
2. Validate and normalise the URL argument (add `https://` if scheme is missing). If missing, stop and ask: `phase-a <url> [sitemap-url]`
3. Derive `<site>` slug: lowercase hostname, dots and slashes replaced with `-`.
4. Confirm output root: `output/<site>/docs/` (create if absent).
5. If the site is behind an auth wall, CAPTCHA, or anti-bot protection — **stop and report**; do not attempt to crawl.

---

## Step 2 — Site Crawl

Follow `site-crawler` skill against the legacy URL.

Produce the full site inventory:

- `output/<site>/docs/research/routes.json` — all discovered URLs
- `output/<site>/docs/research/pages/` — per-page DOM snapshots, visible text, media references
- `output/<site>/docs/research/sitemap.json` — parsed sitemap if available
- `output/<site>/docs/research/assets.json` — media asset inventory

After crawl completes, report:

- Total pages discovered and crawled
- Any pages that failed or were skipped
- Detected CMS / platform (WordPress, custom, static, etc.)

---

## Step 3 — WordPress Adapter (conditional)

**Only run this step if WordPress was detected in Step 2.**

Follow `wp-source-adapter` skill:

- Extract posts, pages, taxonomies, ACF fields, and custom post types via WP-JSON REST API
- Map WP data structures to content model candidates
- Write structured extraction to `output/<site>/docs/research/wp-extract.json`

If WordPress is not detected, skip this step and note it in the summary.

---

## Step 4 — Content Model Inference

Follow `content-model-inferencer` skill:

- Analyse all crawled data (and WP extract if present)
- Identify content types, fields, relationships, and media patterns
- Produce the canonical Content Model Spec

Save to: `output/<site>/docs/content-model/SCHEMA-DESIGN.md`

The spec must include for each content type:

- Name, slug, description
- Field list with types, constraints, and optionality
- Relationships to other types
- Sample data / examples from the source site

---

## Step 5 — CHECKPOINT 1 (Human Approval Gate)

**Pause** and present to the user:

- Content Model Spec summary (types, field counts, relationships)
- Coverage assessment — what % of source pages are covered by the model
- Any ambiguous or inferred fields with low confidence
- Path to `output/<site>/docs/content-model/SCHEMA-DESIGN.md`

Then ask:

> "Phase A complete. The Content Model Spec is ready to become the authoritative schema for CMS provisioning.
> Do you approve? (yes / no / request changes)"

- **yes** → write `output/<site>/docs/content-model/APPROVED.md` (copy of SCHEMA-DESIGN.md with approval stamp) and report Phase A done
- **no / request changes** → implement changes, re-run inference if needed, re-present for approval

---

## Step 6 — Write APPROVED.md

On approval, write `output/<site>/docs/content-model/APPROVED.md`:

```markdown
# Phase A — Approved Content Model Spec

- **Site:** <legacy-site-url>
- **Approved:** <date>
- **Content types:** <count>

## Content Model

<full contents of SCHEMA-DESIGN.md>
```

---

## ⛔ STOP — Phase A ends here

**Do NOT proceed to Phase B, Phase C, Phase D, or Phase E.**

Phase A is a standalone phase. When invoked as `/phase-a`, it completes at `APPROVED.md` and stops.

Phase B is only triggered by:
- The `fullstack-builder` orchestrator (which runs Phases A → B → C → D → E in sequence)
- Explicit user invocation: `/phase-b`

---

## Acceptance Criteria

Do not mark Phase A complete until all are true:

- [ ] Site crawl completed — `routes.json` written
- [ ] Per-page DOM snapshots captured
- [ ] WordPress extraction completed (or skipped with reason)
- [ ] Content Model Spec written to `SCHEMA-DESIGN.md`
- [ ] All major content types identified with fields and relationships
- [ ] Human has approved at Checkpoint 1
- [ ] `APPROVED.md` written
- [ ] All artifacts confined to `output/<site>/docs/`
- [ ] Phase A stopped — Phase B was NOT triggered
