---
description: "Phase A — Reverse Engineering: Crawl the legacy site, optionally extract WordPress or url content, infer a canonical content model, and gate on human approval before the spec is used downstream."
argument-hint: "<legacy-site-url> [sitemap-url]"
---

## `/PA-reverse-engineering` (PA — Reverse Engineering)

This command is the phase-level contract only.

### Canonical entrypoint order

1. Command contract: `.claude/commands/PA-reverse-engineering.md`
2. Canonical agents map: `.claude/agents/PA-reverse-engineering/AGENT.md`
3. Skill implementation:
   - `.claude/skills/PA-reverse-engineering/site-crawler/SKILL.md`
   - `.claude/skills/PA-reverse-engineering/wp-source-adapter/SKILL.md`
   - `.claude/skills/PA-reverse-engineering/content-model-inferencer/SKILL.md`

### Agent

- `.claude/agents/PA-reverse-engineering/AGENT.md`

### Arguments

`$ARGUMENTS` — `<legacy-site-url> [sitemap-url]`

If URL is missing, stop and ask exactly:

`/PA-reverse-engineering <legacy-site-url> [sitemap-url]`
