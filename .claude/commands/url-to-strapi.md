---
description: Orchestrate the full CMS transformation pipeline — Phase A (Reverse Engineering) → Phase B (Test-First Contract) → Phase C (CMS Provisioning) → Phase D (Frontend Generation) → Phase E (Quality Loop) with human checkpoints at each gate.
argument-hint: "<url> [sitemap-url]"
---

## `/url-to-strapi`

Run the full CMS transformation pipeline for non-WordPress sites.

This command is intentionally lightweight and acts as the command-level contract only.
All phase/runtime details are canonicalized in:

- `.claude/agents/url-to-strapi/AGENT.md`

### Canonical entrypoint order

1. Command contract: `.claude/commands/url-to-strapi.md`
2. Canonical agents map: `.claude/agents/url-to-strapi/AGENT.md`

### Agent

- `.claude/agents/url-to-strapi/AGENT.md`

### Arguments

`$ARGUMENTS` — first argument: target site URL; optional second: sitemap URL.

### Flow and completion details

- Phases, checkpoints, and completion criteria:
  `.claude/agents/url-to-strapi/AGENT.md`

If the URL is missing, stop and ask exactly:

`/url-to-strapi <url> [sitemap-url]`
