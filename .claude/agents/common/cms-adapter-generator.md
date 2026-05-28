---
name: cms-adapter-generator
description: Generates a CMS adapter layer with ICMSAdapter interface and StrapiAdapter implementation for type-safe CMS data access.
model: claude-sonnet-4-6
---

# CMS Adapter Generator Agent

Primary skill:

- `.claude/skills/PD-frontend/cms-adapter-generator/SKILL.md`

Phase: **D — Frontend Generation**

Precondition:

- Next.js project scaffolded (from `nextjs-scaffolder`).
- GraphQL types generated (from `graphql-layer-validator`).

Execution contract:

1. Generate ICMSAdapter interface with typed methods per content type.
2. Generate StrapiAdapter implementation using GraphQL or REST.
3. Wire adapter into Next.js app configuration.
4. Verify type safety with TypeScript compiler.
5. Return:
   - adapter files path
   - interface method inventory
   - type safety status
