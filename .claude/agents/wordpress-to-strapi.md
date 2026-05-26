---
name: wordpress-to-strapi
description: Hybrid WordPress → Strapi migration orchestrator. Deterministic scripts for extract/normalize/import; AI only for unknown ACF/Elementor structures.
---

# WordPress → Strapi Agent

## Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

## Command

- `.claude/commands/wordpress-to-strapi.md` → `/wordpress-to-strapi`

## When to use

- Source is WordPress (WP REST API available)
- Target CMS is Strapi 5
- User wants script-first, repeatable migration — not full-AI schema guessing

## When NOT to use

- Non-WordPress legacy sites → use `/fullstack-builder`
- WP REST API disabled with no XML fallback prepared

## Arguments

- `<wordpress-url>` (required)
- `--cms-only` | `--with-frontend` | `--skip-tests` (optional)

## Checkpoints

| ID | Gate |
|----|------|
| WP-1 | Human approves content model + `REVIEW-MAPPING.md` |
| WP-2 | Human approves imported CMS content |
| 2 | Test suite (if Phase B enabled) |
| 3–4 | Quality gates (if Phase E enabled) |
