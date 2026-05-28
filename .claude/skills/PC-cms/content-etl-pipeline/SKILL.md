---
name: content-etl-pipeline
description: Extract content from the source site, transform it to match Strapi schemas, load it into the CMS, and optimise media assets to WebP/AVIF formats.
argument-hint: "<site-slug>"
user-invocable: true
---

# Content ETL Pipeline

Phase: **C — CMS Provisioning** (Step 3 of 4)

Extract → Transform → Load content from the source site into the bootstrapped Strapi CMS, with media optimisation.

## Precondition

- Strapi bootstrapped and running (from `strapi-bootstrapper`)
- Source content extracted (from Phase A `site-crawler` and optional `wp-source-adapter`)
- Content Model Spec approved (CHECKPOINT 1)

## Execution

### Step 1: Extract

Gather source content from:
1. Crawled page data (`output/<site>/docs/research/pages/`)
2. WordPress API data (if available, `output/<site>/docs/research/WP-API-EXTRACTION.md`)
3. Media assets discovered during crawl

### Step 2: Transform

Map extracted content to Strapi schema fields:

1. **Text content** — Map headings, paragraphs, lists to appropriate Strapi fields. Preserve source copy verbatim (no paraphrasing).
2. **Rich text** — Convert HTML to Strapi's rich text format (Markdown or blocks).
3. **Media assets** — Download, optimise, and prepare for upload:
   - Convert images to WebP/AVIF where beneficial
   - Generate responsive sizes (400w, 800w, 1200w)
   - Preserve alt text, captions, credits
4. **Relationships** — Resolve references between content types (populate reference data first).
5. **Metadata** — Map SEO fields, dates, status values.

### Step 3: Load

Load content into Strapi in dependency order:

1. **Reference data first** — Tags, categories, authors (no dependencies)
2. **Media assets** — Upload via Strapi media API
3. **Collection types** — Blog posts, team members, etc. (reference tags/categories/media)
4. **Single types** — Homepage, about page, etc. (reference collection types)

Use Strapi API or bootstrap lifecycle for loading:

```javascript
// Via REST API with auth token
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
};

await fetch(`${STRAPI_URL}/api/<type>`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ data: { ...fields } }),
});
```

### Step 4: Content Parity Verification

After loading, verify:
- Source page text matches Strapi field values (semantic parity)
- Media URLs resolve correctly
- Relationships are wired correctly
- No placeholder/lorem text (only genuine source content)

## Output Contract

- Content loaded into Strapi CMS
- Media assets optimised and uploaded to `output/<site>/cms/public/uploads/`
- Content parity report:
  - Items loaded: N
  - Media processed: N
  - Parity checks passed: N
  - Failures/skips: N (with reasons)

## Downstream

Output feeds into:
- `graphql-layer-validator` (validates loaded content is queryable)
