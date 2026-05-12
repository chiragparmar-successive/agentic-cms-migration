---
name: wp-source-adapter
description: Optional WordPress source adapter that extracts content via WP-JSON REST API including posts, taxonomies, ACF fields, and custom post types.
model: claude-sonnet-4-6
---

# WordPress Source Adapter Agent

Primary skill:

- `.claude/skills/phase-a/wp-source-adapter/SKILL.md`

Phase: **A — Reverse Engineering** (optional)

Expected arguments:

- `<wordpress-url>`

Precondition:

- Only invoked when the source site is detected as WordPress (wp-json endpoint available).

Execution contract:

1. Detect WordPress REST API availability at `<url>/wp-json/wp/v2/`.
2. Extract posts, pages, custom post types, taxonomies, ACF fields, menus.
3. Map WordPress data structures to normalized content model candidates.
4. Return:
   - extracted content types with field inventories
   - taxonomy mappings
   - ACF field group definitions
   - media library inventory
