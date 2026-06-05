---
name: content-model-inferencer
description: AI-powered content model inference using Claude API. Analyzes crawled site data and optional WP API data to produce a canonical content model specification with collection types, single types, components, relationships, and field inventories.
argument-hint: "<site-slug>"
user-invocable: true
---

# Content Model Inferencer

Phase: **A — Reverse Engineering** (Step 3 of 3)

Analyze all extracted site data and produce a canonical **Content Model Spec** — the foundational document that drives all downstream phases (testing, CMS provisioning, frontend generation).

## Input

- Site inventory from `site-crawler` at `output/<site>/docs/research/`
- Optional WordPress API data from `wp-source-adapter`
- Product Spec Doc (PSD) if provided by user

## Execution

### Step 1: Pattern Analysis

Analyze crawled content to identify:

1. **Collection type candidates** — content that repeats across pages with consistent structure (blog posts, team members, products, testimonials, FAQs)
2. **Single type candidates** — unique pages with one-off structure (homepage, about, contact)
3. **Component candidates** — reusable sub-structures within pages (hero sections, CTA blocks, feature cards, social links)
4. **Relationships** — connections between content types (post → author, product → category)

### Step 2: Content Model Design

For each identified type, define:

- Field name, data type, required/optional, validation rules
- Relationships with cardinality (1:1, 1:N, N:M)
- Component composition (which components belong to which types)
- Data dependencies (which types must be populated first)

#### HTML Decomposition Rule (mandatory — Strapi-first modeling)

**Never map source HTML blobs (WordPress `post_content`, page-builder output, ACF wysiwyg) directly to a single `bodyHtml`/`richtext` field by default.** WordPress stores everything as one HTML string; Strapi's ideal model is structured fields, components, and dynamic zones. Model the content as if designing Strapi from scratch — do not impose WordPress's storage shape onto Strapi.

For every HTML body encountered, analyze its internal structure first:

1. **Decompose when structure exists.** If the HTML contains distinct semantic sections or repeated patterns, break it into dedicated fields/components:
   - Hero/banner markup (h1 + subtitle + image + button) → `Hero` component with `heading`, `subheading`, `image`, `cta` fields
   - Repeated card/list patterns (features, services, team, testimonials, FAQs) → repeatable component or separate collection type
   - CTA blocks → `CtaStrip` component (`heading`, `buttonText`, `buttonUrl`)
   - Image galleries/sliders → `media` (multiple) or `Gallery` component
   - Embedded videos, quotes, stats, accordions → typed components
   - Mixed-section pages (typical WP pages) → `dynamiczone` composed of the above components
2. **Keep rich text only when it is genuinely prose.** Flowing article/blog body copy (paragraphs, inline headings, inline images that are part of the narrative) stays a single `richtext` field — decomposing prose would harm authoring.
3. **Hybrid is common and correct.** A blog post may be `title` + `excerpt` + `coverImage` + `richtext body`; a marketing page is usually a `dynamiczone` of components with little or no raw rich text.
4. **Decision test:** would a content editor want to edit this piece as a distinct field in the Strapi admin (and would the frontend render it as a distinct element)? If yes → its own field/component. If it's only meaningful as flowing copy → rich text.

Record every decomposition decision (and every "kept as rich text" decision with its justification) in the Field Inventory `Notes` column so CHECKPOINT 1 reviewers can audit the modeling.

### Step 3: Produce Content Model Spec

Create `output/<site>/docs/content-model/SCHEMA-DESIGN.md` with:

```markdown
# Content Model Specification

## Overview
- Collection Types: N
- Single Types: N
- Components: N
- Total Fields: N
- Relationships: N

## Collection Types
### <TypeName>
- Purpose: <where used>
- Fields: <field inventory table>
- Relations: <relationship list>
- API endpoints: <expected query patterns>

## Single Types
### <TypeName>
...

## Components
### <ComponentName>
...

## Relationship Map
<entity relationship diagram>

## Data Dependencies
<population order>

## Field Inventory
| Type | Field | Data Type | Required | Validation | Notes |
```

### Step 4: Media Strategy

Create `output/<site>/docs/content-model/MEDIA-STRATEGY.md`:

- Image organisation by content type
- Optimisation targets (WebP/AVIF, responsive sizes)
- File naming conventions

## CHECKPOINT 1 — Human Approval Gate

After producing the Content Model Spec:

1. **Present the spec to the human** with a summary:
   - Total types (collection + single + components)
   - Key relationships
   - Coverage assessment (what source content is modeled vs. deferred)
2. **Wait for explicit approval** before proceeding to Phase B.
3. If the human requests changes, iterate on the spec and re-present.
4. **Do not proceed to Phase B until CHECKPOINT 1 is cleared.**

## Output Contract

- `output/<site>/docs/content-model/SCHEMA-DESIGN.md` — canonical content model spec
- `output/<site>/docs/content-model/MEDIA-STRATEGY.md` — media asset strategy
- `output/<site>/docs/content-model/collection-types/` — per-type detailed specs
- `output/<site>/docs/content-model/single-types/` — per-single-type specs
- CHECKPOINT 1 status

## Downstream

Output feeds into:
- Phase B: `playwright-suite-generator` (tests are derived from the content model)
- Phase C: `strapi-schema-generator` (CMS schemas match the spec exactly)
- Phase D: `page-component-generator` (components match the content model)
