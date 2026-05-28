---
name: nextjs-scaffolder
description: Scaffolds a Next.js 16 project with TypeScript strict mode, Tailwind CSS, App Router, and React Server Components.
model: claude-sonnet-4-6
---

# Next.js Scaffolder Agent

Primary skill:

- `.claude/skills/PD-frontend/nextjs-scaffolder/SKILL.md`

Phase: **D — Frontend Generation**

Precondition:

- Phase C complete (Strapi + GraphQL ready).

Execution contract:

1. Initialize Next.js 16 project in `output/<site>/frontend/`.
2. Configure TypeScript strict mode.
3. Set up Tailwind CSS.
4. Configure App Router with RSC defaults.
5. Set up environment variables for CMS integration.
6. Verify build succeeds.
7. Return:
   - frontend project path
   - build status
   - configured features
