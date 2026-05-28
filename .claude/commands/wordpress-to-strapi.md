---
description: WordPress → Strapi full-stack partial E2E (default) — CMS + Playwright + Next.js + quality gates. Same Phase B/D/E as url-to-strapi.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests] [--import]"
---

## `/wordpress-to-strapi`

Run full end-to-end by default: CMS migration + frontend generation + Playwright execution + reports + quality gates.

This command is intentionally lightweight and acts as the command-level contract only.
All phase/runtime details are canonicalized in:

- `.claude/agents/wp-to-strapi/AGENT.md`

### Canonical entrypoint order

1. Command contract: `.claude/commands/wordpress-to-strapi.md`
2. Canonical agents map: `.claude/agents/wp-to-strapi/AGENT.md`
3. Common phase index: `.claude/agents/common/phases.md`

### Agent

- `.claude/agents/wp-to-strapi/AGENT.md`

### Arguments

`$ARGUMENTS` — WordPress URL; optional `--cms-only`, `--skip-tests`, `--import`.

Site slug must be derived dynamically from the provided URL hostname (lowercase, dots replaced with `-`).
Example: `https://example.com` → `example-com`

### Flow and completion details

- Phases, runtime script chain, outputs, and completion criteria:
  `.claude/agents/wp-to-strapi/AGENT.md`

If the URL is missing, stop and ask exactly:

`/wordpress-to-strapi <wordpress-url>`
