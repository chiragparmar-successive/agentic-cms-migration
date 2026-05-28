---
name: wp-ai-interpreter
description: AI interpretation layer for WordPress migration. Maps ONLY unknown ACF flexible layouts, Elementor JSON, and messy HTML blocks to Strapi components. Never uploads content or creates relations.
argument-hint: "<site-slug>"
user-invocable: false
---

# WordPress AI Interpreter (Suggestion Layer Only)

**Principle:** AI suggests. Code executes.

This skill runs **only** when the deterministic pipeline flags unknown structures.

## Activation

Invoke when `output/<site>/wp-migration/analysis/unknown-blocks.json` has `meta.requiresAi === true`.

Do **not** run when `unknown-blocks.json` is empty or missing.

## Input

- `output/<site>/wp-migration/analysis/unknown-blocks.json`
- `output/<site>/wp-migration/analysis/structure-analysis.json` (context only)

## Forbidden (never do via AI)

- Upload content to Strapi
- Create relations or assign IDs
- Migrate media files
- Generate production `schema.json` files directly
- Import posts/pages into the database

## Execution

### Step 1: Read unknown blocks only

Send **only** entries from `unknown-blocks.json` — not the full WordPress export.

Batch in groups of ≤10 blocks if the file is large.

### Step 2: Produce component suggestions

For each unknown block, infer:

- `component` name (PascalCase, stable naming — reuse names for identical layouts)
- `fields` array with `name` (camelCase) and `type` (Strapi field types only)

Allowed Strapi field types:

`string`, `text`, `richtext`, `email`, `integer`, `float`, `decimal`, `date`, `datetime`, `boolean`, `json`, `media`, `relation`, `component`, `dynamiczone`, `uid`

Example AI output shape:

```json
{
  "components": [
    {
      "name": "HeroBanner",
      "category": "sections",
      "repeatable": false,
      "sourcePath": "acf.hero_section",
      "fields": [
        { "name": "heading", "type": "string", "required": true },
        { "name": "buttonText", "type": "string", "required": false }
      ]
    }
  ]
}
```

### Step 3: Write output

Save to `output/<site>/wp-migration/ai/ai-interpretations.json`.

### Step 4: Validate with scripts (mandatory)

Run:

```bash
node scripts/wp-migration/validate-ai.mjs <site-slug>
```

If validation fails:

1. Fix naming/types in `ai-interpretations.json`
2. Re-run `validate-ai.mjs`
3. After 2 failed attempts, stop and request human review

## Naming consistency rules

- Same `acf_fc_layout` value → same component name every time
- Prefer descriptive names: `HeroBanner`, `FeatureGrid`, `CtaStrip`
- Never invent different names for the same layout across items

## Downstream

Validated output at `validated/ai-interpretations.json` merges into Content Model Spec by the `wordpress-to-strapi` orchestrator (deterministic merge step).
