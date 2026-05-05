# React Composition Patterns

Vendored copy of the Vercel Composition Patterns skill, adapted for use inside this workspace.

This is a **read-only reference skill** — no build pipeline runs here. The upstream repo (`vercel-labs/agent-skills`) ships a `pnpm`-based generator that compiles `rules/` into `AGENTS.md`; we keep only the resulting artifacts and consume them directly.

## Files in this skill

- `SKILL.md` — short, prioritized rule index used by agents (entry point)
- `AGENTS.md` — full compiled guide with all rules expanded (reference doc)
- `rules/` — individual rule files (one per rule, source of truth for `AGENTS.md`)
  - `_sections.md` — section metadata (titles, impacts, descriptions)
  - `_template.md` — template for new rules
  - `<area>-<description>.md` — individual rules

## Rule areas (filename prefixes)

- `architecture-` — Component Architecture (HIGH)
- `state-` — State Management (MEDIUM)
- `patterns-` — Implementation Patterns (MEDIUM)
- `react19-` — React 19 APIs (MEDIUM)

Priority labels match `SKILL.md`. If you change priorities here, update `SKILL.md` (and `_sections.md` upstream) so they stay in sync.

## Rules

### Component Architecture

- `architecture-avoid-boolean-props.md` — don't add boolean props to customize behavior
- `architecture-compound-components.md` — structure complex components with shared context

### State Management

- `state-lift-state.md` — move state into provider components for sibling access
- `state-context-interface.md` — define a generic interface (state, actions, meta)
- `state-decouple-implementation.md` — providers are the only place that knows how state is managed

### Implementation Patterns

- `patterns-children-over-render-props.md` — prefer children over render-X props
- `patterns-explicit-variants.md` — create explicit variant components instead of boolean toggles

### React 19 APIs

- `react19-no-forwardref.md` — `forwardRef` is no longer required in React 19

## Core Principles

1. **Composition over configuration** — instead of adding props, let consumers compose.
2. **Lift your state** — keep state in providers, not trapped in components.
3. **Compose your internals** — subcomponents access context, not props.
4. **Explicit variants** — prefer `ThreadComposer` / `EditComposer` over a single `Composer` with `isThread`.

## Re-syncing from upstream

Update upstream with `pnpm install && pnpm build`, then copy `SKILL.md`, `AGENTS.md`, and `rules/` into this folder. `skills-lock.json` at the repo root tracks the upstream source and content hash.
