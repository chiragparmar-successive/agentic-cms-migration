# React Best Practices

Vendored copy of the Vercel React Best Practices skill, adapted for use inside this workspace.

This is a **read-only reference skill** — no build pipeline runs here. The original upstream repo (`vercel-labs/agent-skills`) ships a `pnpm`-based generator that compiles `rules/` into `AGENTS.md`; we keep only the resulting artifacts and consume them directly.

## Files in this skill

- `SKILL.md` — short, prioritized rule index used by agents (entry point)
- `AGENTS.md` — full compiled guide with all rules expanded (reference doc)
- `rules/` — individual rule files (one per rule, source of truth for `AGENTS.md`)
  - `_sections.md` — section metadata (titles, impacts, descriptions)
  - `_template.md` — template for new rules
  - `<area>-<description>.md` — individual rules

## How agents use it

1. Read `SKILL.md` to scan the prioritized rule catalogue.
2. Open the matching rule file under `rules/<area>-<description>.md` for detail and code examples.
3. Use `AGENTS.md` only when you need the full guide in one document.

## Rule areas (filename prefixes)

- `async-` — Eliminating Waterfalls (CRITICAL)
- `bundle-` — Bundle Size Optimization (CRITICAL)
- `server-` — Server-Side Performance (HIGH)
- `client-` — Client-Side Data Fetching (MEDIUM-HIGH)
- `rerender-` — Re-render Optimization (MEDIUM)
- `rendering-` — Rendering Performance (MEDIUM)
- `js-` — JavaScript Performance (LOW-MEDIUM)
- `advanced-` — Advanced Patterns (LOW)

## Re-syncing from upstream

If you want to update from the upstream repo, do it there with `pnpm install && pnpm build`, then copy `SKILL.md`, `AGENTS.md`, and `rules/` into this folder. `skills-lock.json` at the repo root tracks the upstream source and content hash.

## Acknowledgments

Originally created by [@shuding](https://x.com/shuding) at [Vercel](https://vercel.com).
