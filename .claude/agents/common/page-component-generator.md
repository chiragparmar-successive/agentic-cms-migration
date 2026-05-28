---
name: page-component-generator
description: AI-generates RSC pages, layouts, and components via Claude API based on design references and CMS data contracts.
model: claude-sonnet-4-6
---

# Page + Component Generator Agent

Primary skill:

- `.claude/skills/PD-frontend/page-component-generator/SKILL.md`

Phase: **D — Frontend Generation**

Precondition:

- CMS adapter generated (from `cms-adapter-generator`).
- Design references available from Phase A crawl.

Execution contract:

1. Analyze design references and content model.
2. Generate RSC pages for each route using Claude API.
3. Generate shared layout components (header, footer, navigation).
4. Generate content-specific components (cards, heroes, grids).
5. Wire all components to CMS adapter.
6. Apply Vercel best practices (RSC boundaries, async patterns, bundle optimisation).
7. Return:
   - generated page count
   - generated component count
   - CMS integration status per route
