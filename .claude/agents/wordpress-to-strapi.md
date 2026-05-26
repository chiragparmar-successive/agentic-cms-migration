---
name: wordpress-to-strapi
description: Hybrid WordPress → Strapi migration. Command 1 = content model + preview data. Command 2 = standalone full migration (not sync).
---

# WordPress → Strapi Agent

## Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

## Commands

| Slash command | Role |
|---------------|------|
| `/wordpress-to-strapi` | **Command 1** — preview profile: schemas + sample rows |
| `/wordpress-to-strapi-full` | **Command 2** — full profile: complete migration (isolated) |

- `.claude/commands/wordpress-to-strapi.md`
- `.claude/commands/wordpress-to-strapi-full.md`

## When to use

- Source is WordPress (WP REST API available)
- Target CMS is Strapi 5
- User wants script-first, repeatable migration — not full-AI schema guessing

## When NOT to use

- Non-WordPress legacy sites → use `/fullstack-builder`
- WP REST API disabled with no XML fallback prepared

## Arguments

- `<wordpress-url>` (required)
- `--cms-only` | `--with-frontend` | `--skip-tests` (optional, command 1)

## Checkpoints

| ID | Gate |
|----|------|
| WP-1 | Human approves content model + `REVIEW-MAPPING.md` |
| WP-2 | Human approves **preview** content in Strapi |
| 2 | Test suite (if Phase B enabled) |
| 3–4 | Quality gates (if Phase E enabled) |

Run command 2 only after WP-1 and WP-2.
