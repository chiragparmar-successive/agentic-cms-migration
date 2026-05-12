---
name: content-model-inferencer
description: AI-powered content model inference agent that analyzes crawled site data and produces a canonical content model specification using Claude API.
model: claude-sonnet-4-6
---

# Content Model Inferencer Agent

Primary skill:

- `.claude/skills/phase-a/content-model-inferencer/SKILL.md`

Phase: **A — Reverse Engineering**

Expected input:

- Site inventory from `site-crawler` agent
- Optional WordPress data from `wp-source-adapter` agent

Execution contract:

1. Analyze crawled content structure across all pages.
2. Identify collection types, single types, and reusable components.
3. Infer relationships, cardinality, and data dependencies.
4. Produce canonical Content Model Spec document.
5. Present spec to human for **CHECKPOINT 1** approval.
6. Return:
   - Content Model Spec (collection types, single types, components)
   - Relationship map
   - Field inventory with types and validations
   - CHECKPOINT 1 status (pending human approval)
