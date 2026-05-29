---
description: WordPress → Strapi full-stack partial E2E (default) — CMS + Playwright + Next.js + quality gates. Same Phase B/D/E as url-to-strapi.
argument-hint: "<wordpress-url> [--cms-only] [--skip-tests] [--import]"
---

## `/wordpress-to-strapi`

Run full end-to-end by default: schema/CMS setup first, then frontend + quality phases, then full data migration at the end.
This is the only canonical entrypoint for initial project bootstrapping.

This command is intentionally lightweight and acts as the command-level contract only.
All phase/runtime details are canonicalized in:

- `.claude/agents/wordpress-to-strapi/AGENT.md`

### Canonical entrypoint order

1. Command contract: `.claude/commands/wordpress-to-strapi.md`
2. Canonical agents map: `.claude/agents/wordpress-to-strapi/AGENT.md`
3. Common phase index: `.claude/agents/common/phases.md`

### Agent

- `.claude/agents/wordpress-to-strapi/AGENT.md`

### Arguments

`$ARGUMENTS` — WordPress URL; optional `--cms-only`, `--skip-tests`, `--import`.

Site slug must be derived dynamically from the provided URL hostname (lowercase, dots replaced with `-`).
Example: `https://example.com` → `example-com`

### Flow and completion details

- Phases, runtime script chain, outputs, and completion criteria:
  `.claude/agents/wordpress-to-strapi/AGENT.md`

If the URL is missing, stop and ask exactly:

`/wordpress-to-strapi <wordpress-url>`

### General vs project-specific execution

1. **Initial run (general/common engine)**  
   Use this command with URL:
   - `/wordpress-to-strapi <wordpress-url>`
2. **Follow-up data migration (project-specific runner)**  
   Data migration runs from generated script in output (no URL required):
   - `cd output/<site>/wp-migration`
   - `node run-full-migration.mjs` (default: upsert + `✅`/`❌` logs + verify; artifacts in `full/sync/`)

Command requirement:

- On completion of initial `/wordpress-to-strapi`, always print the exact next command for the generated project-specific runner under `output/<site>/wp-migration/`.
