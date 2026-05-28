---
description: "Phase D — Frontend Generation: Scaffold a Next.js 15 app on Node 22, generate the CMS adapter, AI-generate RSC pages/components, enforce dynamic CMS data, and validate route parity."
argument-hint: "<site-slug>"
---

## `/PD-frontend` (PD — Frontend Generation)

This command is the phase-level contract only.

### Canonical entrypoint order

1. Command contract: `.claude/commands/PD-frontend.md`
2. Canonical agents map: `.claude/agents/PD-frontend/AGENT.md`
3. Skill implementation:
   - `.claude/skills/PD-frontend/nextjs-scaffolder/SKILL.md`
   - `.claude/skills/PD-frontend/cms-adapter-generator/SKILL.md`
   - `.claude/skills/PD-frontend/page-component-generator/SKILL.md`
   - `.claude/skills/PD-frontend/route-validator/SKILL.md`
   - `.claude/skills/PD-frontend/vercel/next-best-practices/SKILL.md`
   - `.claude/skills/PD-frontend/vercel/vercel-react-best-practices/SKILL.md`
   - `.claude/skills/PD-frontend/vercel/vercel-composition-patterns/SKILL.md`

### Agent

- `.claude/agents/PD-frontend/AGENT.md`

### Arguments

`$ARGUMENTS` — `<site-slug>`

If slug is missing, stop and ask exactly:

`/PD-frontend <site-slug>`
