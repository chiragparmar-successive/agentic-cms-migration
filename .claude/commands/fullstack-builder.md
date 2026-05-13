---
description: Orchestrate the full CMS transformation pipeline — Phase A (Reverse Engineering) → Phase B (Test-First Contract) → Phase C (CMS Provisioning) → Phase D (Frontend Generation) → Phase E (Quality Loop) with human checkpoints at each gate.
argument-hint: "<url> [sitemap-url]"
---

## `/fullstack-builder`

**Cursor slash command:** `/fullstack-builder` — pass the same arguments as below (e.g. `/fullstack-builder https://example.com` or `/fullstack-builder https://example.com https://example.com/sitemap.xml`).

Orchestrate the full CMS transformation pipeline using the master skill below.

### Skill

- `.claude/skills/orchestrators/fullstack-builder/SKILL.md`

### Arguments

`$ARGUMENTS` — first argument: target site URL; optional second: sitemap URL.

If the URL is missing, stop and ask: `/fullstack-builder <url> [sitemap-url]`
