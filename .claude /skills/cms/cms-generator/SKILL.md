---
name: cms-generator
description: Reverse-engineer content models from a live website and generate Strapi schema definitions plus corresponding React/Next.js UI components. Extracts content structure, relationships, and metadata from one page URL plus an optional sitemap, then initializes a Strapi project with fully-configured content types and starter components. Use this when you want to scaffold a headless CMS setup from an existing website. Requires one argument (target URL) and accepts an optional second argument (sitemap URL).
argument-hint: "<url> [sitemap-url]"
user-invocable: true
---

# Strapi Schema Generator

You are about to reverse-engineer and rebuild the content structure of the site defined by **$ARGUMENTS** as a complete Strapi headless CMS running in the `/cms` folder.

This skill requires one argument and accepts an optional second argument:

- `$ARGUMENTS[0]` = Canonical page URL on the target site (used as origin and baseline)
- `$ARGUMENTS[1]` = Sitemap URL (optional)

If argument count is not 1 or 2, stop and ask the user to provide:
`cms-generator <url> [sitemap-url]`

Execution contract:

1. If provided, fetch and parse the sitemap URL from `$ARGUMENTS[1]`; otherwise try common sitemap locations (e.g. `/sitemap.xml`, `/sitemap_index.xml`) and fall back to in-site crawling from `$ARGUMENTS[0]`
2. Extract all page URLs from sitemap(s) (and nested sitemaps, if present) or from controlled in-site crawl results
3. Keep only in-scope HTML pages on the same origin
4. Remove duplicates, query-tracking variants, and non-HTML/document links
5. Analyze EACH page to extract content structure, data types, and relationships
6. Design a normalized Strapi content model that maps site content to reusable collection types and single types
7. Initialize a Strapi boilerplate in `/cms` with full TypeScript configuration
8. Create Content-Type Definition (CTD) files for every identified content type in `/cms/src/api/`
9. Populate seed data/demo content for testing the CMS
10. Document the schema and API structure
11. Verify the CMS is fully operational with a running development server
12. Ensure extracted source content is written into Strapi with exact text/media parity for modeled fields (no paraphrasing, no placeholder text unless source is unavailable and explicitly noted)

This is not a simple data dump. You are a **content architect** — as you inspect each page, you extract its underlying data model, identify reusable components, normalize relationships, and design a schema that scales beyond the source site.

## What Gets Created

```
/cms                           # Strapi headless CMS boilerplate
├── src/
│   ├── api/                   # Auto-generated content types
│   ├── config/                # Server, plugins, middleware
│   ├── admin/                 # Admin UI customization
│   └── components/            # Reusable Strapi components
├── public/uploads/            # Media files uploaded via admin
├── docs/                       # Schema documentation
├── .env                        # Environment variables
├── package.json
└── tsconfig.json

Admin UI:     http://localhost:1337/admin
REST API:     http://localhost:1337/api
GraphQL:      http://localhost:1337/graphql
```

After `/cms` is set up, you can optionally create a separate frontend project elsewhere that consumes the API.

## Scope Defaults

The target scope is all in-scope pages discovered from `$ARGUMENTS[1]` when provided (sitemap URL), otherwise from discovered sitemap endpoints or controlled in-site crawl from `$ARGUMENTS[0]`. `$ARGUMENTS[0]` defines canonical domain/origin and acts the seed for initial content structure analysis. Unless the user specifies otherwise, use these defaults:

- **Content extraction:** All text, media, relationships, and structured data visible on pages
- **Content fidelity:** Preserve exact source copy for modeled content fields (headings, paragraphs, labels, CTA text, metadata, alt text) unless normalization requires structural decomposition only
- **Data modeling:** Normalized Strapi collection types (reusable content models) plus single types (unique pages like homepage, about)
- **Component generation:** React/Next.js components with TypeScript that fetch and render from Strapi API
- **Backend:** Strapi v4+ with SQLite (development) and PostgreSQL configuration template
- **Frontend:** Next.js 14+ with App Router, TypeScript, and API route integration
- **In scope:** Content structure, data relationships, taxonomy, media assets
- **Out of scope:** User authentication (initially), real database data population, payment integration

If the user provides additional instructions (custom fields, specific integrations, modified data structure), honor those over the defaults.

## Pre-Flight

1. **Browser automation is required.** Check for available browser MCP tools (Chrome MCP, Playwright MCP, Browserbase MCP, Puppeteer MCP, etc.). Use whichever is available — if multiple exist, prefer Chrome MCP. If none are detected, ask the user which browser tool they have and how to connect it. This skill cannot work without browser automation.

2. Validate arguments strictly:
   - `$ARGUMENTS[0]` must be a valid URL
   - If present, `$ARGUMENTS[1]` must be a valid sitemap URL
   - `$ARGUMENTS[0]` must be reachable via browser MCP; `$ARGUMENTS[1]` must be reachable only if provided
   - If sitemap URLs are used, sitemap pages must resolve to the same hostname as `$ARGUMENTS[0]` unless user explicitly allows cross-domain pages

3. Create a NEW Strapi boilerplate in `/cms`:

   ```
   /cms
   ├── src/
   │   ├── api/                   # Content types & routes (empty, will be populated)
   │   ├── components/            # Reusable Strapi components (empty, will be populated)
   │   ├── config/
   │   │   ├── server.ts
   │   │   ├── middlewares.ts
   │   │   ├── plugins.ts
   │   │   ├── database.ts
   │   │   └── admin.ts
   │   ├── admin/
   │   ├── extensions/
   │   └── schema.d.ts
   ├── public/                    # Uploaded assets
   ├── .env.example
   ├── package.json
   ├── tsconfig.json
   ├── README.md
   └── .gitignore
   ```

4. Initialize Strapi boilerplate:

   ```bash
   cd /cms
   npx create-strapi-app@latest . --typescript --quickstart
   ```

5. Create documentation structure inside `/cms`:

   ```
   /cms
   ├── docs/
   │   ├── research/
   │   │   ├── CONTENT-STRUCTURE.md
   │   │   ├── pages/
   │   │   │   └── <route-slug>/
   │   │   │       ├── CONTENT-MAP.md
   │   │   │       └── BEHAVIORS.md
   │   │   └── DATA-RELATIONSHIPS.md
   │   ├── content-model/
   │   │   ├── SCHEMA-DESIGN.md
   │   │   ├── collection-types/
   │   │   └── single-types/
   │   └── api-spec/
   │       ├── ENDPOINTS.md
   │       └── TYPES.md
   ```

6. Verify boilerplate builds:

   ```bash
   npm run build
   ```

   Set `/cms` as the working directory for all subsequent commands, files, docs, and scripts.

## Guiding Principles

These principles separate a well-designed schema from a tangled mess:

### 1. **Normalize First, Model Second**

Don't map HTML directly to Strapi fields. First, identify the underlying data — what IS this content? A blog post has title, body, author, tags, publication date. These are content CONCEPTS, not HTML elements.

Normalization means:

- Identify repeated content patterns (e.g., "team member" cards appear in 5 pages → single Team collection type)
- Extract relationships (e.g., blog posts have authors → `blog_post.author` relationship to Author type)
- Define single sources of truth (shared taxonomy, shared metadata, shared media)
- Model reusable components (e.g., CTA blocks, testimonial cards, feature grids)

When you see the same pattern twice, you've found a collection type. Don't create separate models for "HomepageFeatures" and "ProductPageFeatures" if they're structurally identical — create one "Feature" type and reuse it.

### 2. **Content Types Before Implementation**

Every Strapi content type gets a specification document in `docs/content-model/` BEFORE any implementation. This spec is the contract:

- What fields does this type have?
- What are their data types (string, rich-text, relation, media, component)?
- Are fields required? Translatable?
- What are the field validation rules and defaults?
- What components/sub-structures does it contain?
- How does it relate to other types?

The spec file is your source of truth. Implementation must match the spec exactly.

### 3. **Relationships Over Duplication**

If the same author appears on 10 blog posts, they have ONE author record with many posts linked to it via a `posts` relation. Don't duplicate author data across posts.

Conversely, if data is unique to one context and never reused, embed it. A single post's publication metadata doesn't need a separate type if it's never queried independently.

### 4. **Rich-Text Blocks Over Monolithic HTML**

Pages with mixed content (text + images + embedded quotes) should use Strapi's "Dynamic Zones" or component arrays, not a single rich-text field containing everything. This allows:

- Structured querying ("get all testimonials on this page")
- Flexible layout control ("re-order blocks without touching the HTML")
- Component reuse ("this testimonial component appears in 3 blocks on 2 pages")

### 5. **Media as First-Class Citizens**

Images, videos, and documents aren't just file URLs. They have alt text, captions, credit, dimensions, and usage context. Create a Media component that wraps assets with their metadata, rather than storing bare URLs.

### 6. **Enumerate Every State and Variant**

If a component has multiple visual states (featured vs. regular, draft vs. published, dark vs. light background), model those states as fields or component variants.

Examples:

- Blog post: has `status` (draft, published, archived) field
- Card: has `variant` field (minimal, rich, featured)
- CTA: has `style` field (primary, secondary, outlined)

The React component reads these and conditionally renders. The field is the source of truth, not the component's internal logic.

### 7. **API Design Mirrors Component Needs**

Every React component needs specific data. Design API responses to match — include exactly what the component queries, no less, no more.

If the "blog list" component needs title, excerpt, author name, and thumbnail, the endpoint should return exactly those fields (plus relationships). Don't return the entire post body.

Use Strapi's `populate` strategy to specify which relations and fields are included per request.

## Phase 1: Reconnaissance

Navigate first to `$ARGUMENTS[0]` with browser MCP, then analyze every URL from discovered scope sources (provided sitemap, discovered sitemap, or controlled in-site crawl).

### Page Analysis

For each page, extract:

1. **Content regions** — Identify distinct regions that contain structured content:
   - Header/hero (usually global, appears on every page)
   - Main content area (page-specific)
   - Sidebar/supporting content
   - Footer (usually global)
   - Any modal/overlay content

2. **Content elements** — For each region, enumerate every piece of data:
   - Headings, subheadings (with hierarchy)
   - Paragraphs, lists, quotes
   - Images (with alt text, captions)
   - Videos, embedded media
   - Links (internal, external)
   - Forms, interactive elements
   - Metadata (dates, authors, categories, tags)
   - Capture verbatim text values for CMS population (no rewrite)

3. **Repetition detection** — Mark patterns that repeat across pages:
   - "Team member card" appears on `/about`, `/leadership`, `/team`
   - "Blog post excerpt" appears on `/blog`, `/insights`, homepage
   - "CTA section" appears on multiple pages
   - "Testimonial" appears in 3 different contexts

4. **Relationships** — Identify connections between content:
   - Blog post → Author (many-to-one)
   - Blog post → Tags (many-to-many)
   - Product → Category (many-to-one)
   - Page → Hero image (one-to-one)

5. **Media inventory** — Extract all images, videos, documents:
   - Note their context (hero, body, card, background)
   - Collect alt text, captions, credits
   - Track dimensions/aspect ratios

6. **Metadata** — Extract machine-readable data:
   - Publication dates, update dates
   - SEO metadata (meta descriptions, keywords)
   - Status indicators (draft, featured, archived)
   - Author/contributor info
   - Translations or language variants

Use this browser extraction script to enumerate content automatically:

```javascript
// Run via browser MCP to discover content structure
(function () {
  const result = {
    url: window.location.href,
    title: document.title,
    headings: [...document.querySelectorAll("h1, h2, h3, h4")].map((h) => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim().slice(0, 200),
      id: h.id || null,
    })),
    paragraphs: [...document.querySelectorAll("p")].slice(0, 10).map((p) => ({
      text: p.textContent.trim().slice(0, 300),
    })),
    images: [...document.querySelectorAll("img")].map((img) => ({
      src: img.src || img.currentSrc,
      alt: img.alt,
      title: img.title,
      width: img.naturalWidth,
      height: img.naturalHeight,
      inContext:
        img.closest('[class*="hero"], [class*="card"], [class*="section"]')
          ?.className || "unknown",
    })),
    videos: [...document.querySelectorAll("video")].map((v) => ({
      src: v.src || v.querySelector("source")?.src,
      poster: v.poster,
      title: v.title,
    })),
    links: [...document.querySelectorAll("a[href]")].slice(0, 30).map((a) => ({
      text: a.textContent.trim().slice(0, 100),
      href: a.href,
      target: a.target || "_self",
    })),
    structured: {
      jsonLd: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].map((s) => JSON.parse(s.textContent)),
      metaTags: [
        ...document.querySelectorAll("meta[name], meta[property]"),
      ].map((m) => ({
        name: m.getAttribute("name") || m.getAttribute("property"),
        content: m.content,
      })),
    },
  };
  return JSON.stringify(result, null, 2);
})();
```

### Content Structure Document

For each page, create `docs/research/pages/<route-slug>/CONTENT-MAP.md`:

```markdown
# <Page Title> Content Structure

## URL

<route URL>

## Page Type

<Type: homepage, landing, listing, detail, archive, etc.>

## Content Regions (top to bottom)

### Region: Header

- Type: Global (shared across all pages)
- Elements:
  - Logo (image)
  - Navigation menu (links)
  - Search bar (interactive)
  - CTA button (primary)

### Region: Hero

- Type: Page-specific
- Elements:
  - Headline (text): "..."
  - Subheadline (text): "..."
  - Background image: `https://...`
  - CTA button: "..." → `/link`

### Region: Features Grid

- Type: Repeated pattern (also on `/products`, homepage)
- Elements: 6 cards, each containing:
  - Icon (SVG or image)
  - Title (text)
  - Description (text)
  - Link (optional)

### Region: Blog Posts

- Type: Dynamic list
- Elements: Up to 10 blog post cards, each with:
  - Title
  - Author name
  - Publish date
  - Excerpt
  - Thumbnail image
  - Category tag(s)

### Region: Footer

- Type: Global
- Elements: [content]

## Detected Repeating Patterns

- Feature Card (appears in 5 places across 3 pages)
- Blog Post Excerpt (appears in 3 places)
- Testimonial Quote (appears on 2 pages)

## Metadata & Relationships

- Author: [not visible, check schema]
- Tags: productivity, engineering, design
- Related posts: [links to other posts]

## Media Assets

| Element         | Source      | Alt Text | Dimensions |
| --------------- | ----------- | -------- | ---------- |
| Hero background | https://... | "..."    | 1920x600   |
| Feature icon 1  | https://... | "..."    | 80x80      |
```

### Global Content Patterns Document

Create `docs/research/CONTENT-STRUCTURE.md` that summarizes patterns across ALL pages:

```markdown
# Content Structure Analysis

## Discovered Content Types (Candidates for Strapi Models)

### Collection Types (Reusable, appear multiple times)

- **BlogPost**: Blog post excerpt + full post; appears on /blog, /category/\*, homepage; has author, tags, dates
- **TeamMember**: Team card; appears on /team, /about, /leadership; has role, bio, social links, photo
- **Feature**: Feature card with icon; appears on /features, /pricing, homepage; has icon, title, description
- **Testimonial**: Quote + attribution; appears on /testimonials, /homepage, /pricing; has quote, author, role, photo
- **Project**: Portfolio/case study item; appears on /work, /portfolio; has images, description, link, tags

### Single Types (Unique pages)

- **Homepage**: Full homepage with hero, features, blog preview, CTA, testimonials
- **About**: About page with hero, team section, timeline, company info
- **BlogIndex**: Blog listing page with filters, search
- **Pricing**: Pricing page with tier cards, FAQ

### Global Components

- **Header/Navigation**: Logo, menu, CTA
- **Footer**: Links, social, newsletter signup
- **SEO Metadata**: Meta title, description, og:image, canonical
- **Hero Section**: Headline, subheadline, background image, CTA

## Relationship Map
```

HomePage
├── Hero (single) → Image
├── Features (array) → Feature type (0..many)
├── BlogPreview (array) → BlogPost type (0..5)
├── Testimonials (array) → Testimonial type (0..3)
└── CTA (single) → CTABlock component

BlogPost
├── Author (relation) → TeamMember type (1..1)
├── Tags (relation) → Tag type (0..many)
├── FeaturedImage (single) → Image
└── RelatedPosts (relation) → BlogPost type (0..5)

TeamMember
├── Photo (single) → Image
├── SocialLinks (array) → SocialLink component

Feature
├── Icon (single) → Image or SVG
└── [no relations]

```

## Field Inventory

| Type | Field | Data Type | Required? | Notes |
|------|-------|-----------|-----------|-------|
| BlogPost | title | String(200) | Yes | SEO: max 60 chars for preview |
| BlogPost | slug | String(200) | Yes | Unique, auto-generated from title |
| BlogPost | excerpt | String(500) | Yes | SEO: meta description |
| BlogPost | body | Rich Text | Yes | Markdown or Strapi blocks |
| BlogPost | featuredImage | Media | Yes | 1200x600 recommended |
| BlogPost | author | Relation (TeamMember) | Yes | Many-to-one |
| BlogPost | tags | Relation (Tag) | No | Many-to-many |
| BlogPost | publishedAt | DateTime | Yes | Auto-set on publish |
| BlogPost | status | Enum | Yes | draft, published, archived |

## Media Asset Sources

- All images stored in `backend/public/uploads/`
- Image dimensions: [inventory of typical sizes]
- Image formats: WebP preferred, JPG fallback
```

### Relationship & Dependency Map

Create `docs/research/DATA-RELATIONSHIPS.md` showing how content types connect:

```markdown
# Data Relationship Map

## Entity Relationship Diagram (text format)
```

Author (1) ──────→ (many) BlogPost
├── (many) Tags
└── (1) FeaturedImage

Category (1) ───────→ (many) BlogPost
└── (1) Author

Image (1) ───────→ (many) BlogPost
Image (1) ───────→ (many) TeamMember
Image (1) ───────→ (many) Feature

HomePage
├── Features[] → Feature[] (0..many)
├── BlogPosts[] → BlogPost[] (0..5, latest)
└── Testimonials[] → Testimonial[] (0..3)

```

## Cardinality Matrix

| From | To | Cardinality | Description |
|------|----|----|---|
| BlogPost | Author | N:1 | Each post has one author |
| BlogPost | Tag | N:M | Posts can have many tags; tags can label many posts |
| HomePage | BlogPost | N:M | Homepage features a selection of posts |
| TeamPage | TeamMember | 1:M | Team page displays all members |

## Circular Dependencies

- None detected (good state)

## Data Dependencies for Rendering

Which content must be populated before others can be rendered:

1. **Required first:** Tag, Author, Category (reference data)
2. **Then:** Image (assets that may be referenced)
3. **Then:** BlogPost, Feature, TeamMember (content types that reference the above)
4. **Finally:** HomePage (single type that references content types)
```

## Phase 2: Content Model Design

Design the normalized Strapi schema. This is done in `docs/content-model/SCHEMA-DESIGN.md` BEFORE implementation.

### Collection Types Specification

For each repeating content pattern, create a spec:

```markdown
# Collection Type: BlogPost

## Purpose

Reusable blog post model used on:

- `/blog` listing page
- `/blog/[slug]` detail page
- Homepage blog preview section
- Category archive pages
- Author profile page

## Fields

### Basic Info

- **title** (String, 200 chars max)
  - Required: Yes
  - Validation: Min 5 chars, Max 200 chars
  - Help text: "Blog post headline, optimized for search (50-60 chars recommended)"
  - Default: null

- **slug** (String, 200 chars, unique)
  - Required: Yes
  - Auto-generated from title
  - Allow customization after generation
  - Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
  - Help text: "URL-friendly version of title (auto-generated)"
  - Default: null

- **excerpt** (String, 500 chars max)
  - Required: Yes
  - Validation: Max 500 chars
  - Help text: "Summary shown in listings and search results (160 chars max recommended)"
  - Default: null

### Content

- **body** (Rich Text)
  - Required: Yes
  - Format: Markdown or Strapi block format
  - Allow image upload: Yes
  - Toolbar: heading, bold, italic, link, list, quote, code, blockquote
  - Help text: "Main article content"

- **featuredImage** (Media, single)
  - Required: Yes
  - Allowed MIME types: image/\*
  - Recommended dimensions: 1200x600
  - Responsive variants: [ { width: 400 }, { width: 800 }, { width: 1200 } ]

### Metadata

- **author** (Relation - TeamMember, many-to-one)
  - Required: Yes
  - Help text: "Post author"

- **tags** (Relation - Tag, many-to-many)
  - Required: No
  - Max: 5 tags
  - Help text: "Categorize post (optional)"

- **category** (Relation - Category, many-to-one)
  - Required: Yes
  - Help text: "Primary category"

- **publishedAt** (DateTime)
  - Required: Yes
  - Auto-set to current time when status becomes "published"
  - Help text: "Publication date (auto-set on publish)"

- **updatedAt** (DateTime, system managed)
  - Auto-managed by Strapi

### Status & SEO

- **status** (Enumeration)
  - Required: Yes
  - Enum values: draft, published, archived
  - Default: draft
  - Help text: "Draft posts don't appear on site"

- **seoTitle** (String, 60 chars max)
  - Required: No
  - Default: Uses title field if empty
  - Help text: "Override page title in search results (60 chars max)"

- **seoDescription** (String, 160 chars max)
  - Required: No
  - Default: Uses excerpt if empty
  - Help text: "Override search snippet (160 chars max)"

- **seoKeywords** (String, 200 chars)
  - Required: No
  - Comma-separated
  - Help text: "Target keywords (optional, comma-separated)"

## Relations to Other Types

- **author** → TeamMember (N:1, required)
- **tags** → Tag (N:M, optional)
- **category** → Category (N:1, required)
- **relatedPosts** → BlogPost (N:M, auto-generated or manual curation)

## API Usage

### Get single post (for detail page)
```

GET /api/blog-posts?filters[slug][$eq]=my-post&populate=\*

```
Returns: title, slug, body, author{name, photo}, tags, featuredImage, publishedAt

### Get post list (for archive/listing)
```

GET /api/blog-posts?pagination[pageSize]=10&populate=author,tags,featuredImage&sort=-publishedAt&filters[status][$eq]=published

```
Returns: title, slug, excerpt, author{name}, tags, featuredImage, publishedAt

### Get 5 latest for homepage preview
```

GET /api/blog-posts?pagination[pageSize]=5&populate=author,tags,featuredImage&sort=-publishedAt&filters[status][$eq]=published

```
Returns: [same fields as list]

## Validation Rules

- Title: 5-200 chars, required
- Slug: unique, auto-generated from title, customizable
- Excerpt: max 500 chars, required
- Body: required, min 100 chars
- Author: required, must reference existing TeamMember
- Tags: optional, max 5
- Status: required, must be one of enum values
- publishedAt: must be in past or present (not future-dated)
- seoTitle: max 60 chars (search result truncates at ~60)
- seoDescription: max 160 chars (search result shows ~160)

## Lifecycle Hooks (Strapi lifecycles.js)

- **beforeCreate**: Auto-set slug from title if not provided
- **beforeUpdate**: If status changes to "published", auto-set publishedAt to now
- **afterCreate**: Trigger cache invalidation for blog homepage

## Search & Filtering

- Indexed fields: title, slug, excerpt, author.name, tags.name
- Default sort: publishedAt descending (newest first)
- Filterable fields: status, author, category, tags, publishedAt

## Content Type File Location

`backend/src/api/blog-post/content-types/blog-post/schema.json`
```

### Single Types Specification

For unique pages like homepage, create specs:

```markdown
# Single Type: HomePage

## Purpose

The website homepage — unique, one instance only.

## Sections (Strapi Dynamic Zone or Component Array)

### Hero Section

- Type: Component (reusable across other pages)
- Fields:
  - headline (String, 100 chars)
  - subheadline (String, 200 chars)
  - backgroundImage (Media)
  - ctaText (String, 30 chars)
  - ctaLink (String, URL)

### Featured Features

- Type: Component array
- Items: 0..6 Feature (references Collection Type Feature)
- Display order: orderable

### Latest Blog Posts

- Type: Relation array to BlogPost
- Limit: 0..5
- Auto-populated: Latest 5 by publishedAt
- Or manual curation: Allow editor to select specific posts

### Testimonials Section

- Type: Component array
- Items: 0..4 Testimonial (references Collection Type)

### CTA Section

- Type: Component (single)
- Fields:
  - headline
  - description
  - buttonText
  - buttonLink
  - backgroundColor (color picker)

## Fields

### SEO

- **seoTitle** (String)
- **seoDescription** (String)
- **seoImage** (Media)

## API Response
```

GET /api/home?populate=\*

```

Returns full homepage data with all relations expanded.

## Content Type File Location

`backend/src/api/home-page/content-types/home-page/schema.json`
```

### Components Specification

For reusable sub-structures, define as Strapi Components:

```markdown
# Strapi Component: FeatureCard

## Purpose

Reusable card component used in features grid, pricing, homepage.

## Fields

- **icon** (Media, single image) - Required
- **title** (String, 100 chars) - Required
- **description** (String, 300 chars) - Required
- **link** (String, URL) - Optional
- **linkText** (String, 30 chars, default: "Learn more") - Optional

## File Location

`backend/src/components/content/feature-card.json`

## Used By

- Feature (collection type, array of these)
- HomePage (component)
- ProductPage (single type)
```

### Schema Design Document Template

In `docs/content-model/SCHEMA-DESIGN.md`, compile all type specs:

```markdown
# Content Model Design

## Overview

- **Collection Types:** 5 (BlogPost, TeamMember, Feature, Testimonial, Project)
- **Single Types:** 4 (HomePage, AboutPage, BlogIndexPage, PricingPage)
- **Components:** 8 (FeatureCard, Hero, Testimonial, SocialLink, CTA, MediaBlock, etc.)
- **Total Fields:** ~80 across all types
- **Relationships:** 15 (N:1, N:M, hierarchical)

## Collection Type: BlogPost

[full spec as above]

## Collection Type: TeamMember

[full spec]

... [more types]

## Single Type: HomePage

[full spec]

... [more single types]

## Component: FeatureCard

[full spec]

... [more components]

## Data Validation Rules

[comprehensive validation matrix]

## API Endpoint Summary

| Endpoint                | Purpose     | Query Params                        |
| ----------------------- | ----------- | ----------------------------------- |
| GET /api/blog-posts     | List posts  | pagination, populate, filters, sort |
| GET /api/blog-posts/:id | Single post | populate                            |
| POST /api/blog-posts    | Create post | -                                   |
| ...                     | ...         | ...                                 |

## Database Schema Notes

- SQLite for dev (included with Strapi quickstart)
- PostgreSQL for production
- No custom migrations required (Strapi handles schema)
```

### Storage Strategy

Create `docs/content-model/MEDIA-STRATEGY.md`:

```markdown
# Media Asset Strategy

## Image Organization
```

public/uploads/
├── blog-posts/
│ ├── featured-images/
│ └── body-images/
├── team-members/
│ └── photos/
├── features/
│ └── icons/
├── testimonials/
│ └── author-photos/
└── site-assets/
├── logos/
├── backgrounds/
└── icons/

```

## Image Optimization

- **Large images (hero, featured):** 1200px wide, WebP + JPG fallback
- **Medium images (cards, thumbnails):** 400-600px wide
- **Icons:** SVG preferred, PNG as fallback (80x80 at 2x)
- **Compression:** Lossless for PNG, ~80% quality for JPEG

## File Naming Convention

- Lowercase, hyphens, descriptive: `blog-post-about-strapi-api-design.jpg`
- Include dimensions for clarity: `hero-1920x600.webp`
- No spaces, special characters, or camelCase

## Strapi Media Manager

- Enable automatic image resizing/responsive images
- Configured in `backend/src/config/plugins.js`
- Formats: `.webp`, `.jpg`, `.png` (auto-conversion on upload)
```

## Phase 3: Foundation Build

Initialize Strapi boilerplate and establish configuration.

### Strapi Boilerplate Setup

In `/cms/`:

1. **Strapi is already installed** (via create-strapi-app):

   ```bash
   cd /cms
   npm install
   npm run build
   ```

2. **TypeScript configuration**: Strapi with `--typescript` flag includes tsconfig.json. Verify:

   ```bash
   npx tsc --noEmit
   ```

3. **Create API folder structure**:

   ```bash
   # Strapi auto-generates these, but ensure structure is in place
   src/api/
   ├── blog-post/
   │   ├── content-types/blog-post/
   │   │   └── schema.json
   │   ├── controllers/blog-post.ts
   │   ├── routes/blog-post.ts
   │   └── services/blog-post.ts
   ├── team-member/
   ├── feature/
   ├── testimonial/
   ├── project/
   ├── home-page/
   ├── about-page/
   ├── tag/
   └── category/
   ```

4. **Environment configuration** (`/cms/.env`):

   ```env
   # Server
   HOST=0.0.0.0
   PORT=1337
   APP_KEYS=<auto-generated>
   API_TOKEN_SALT=<auto-generated>
   ADMIN_JWT_SECRET=<auto-generated>
   JWT_SECRET=<auto-generated>

   # Database
   DATABASE_CLIENT=sqlite
   DATABASE_FILENAME=.tmp/data.db

   # (Add PostgreSQL config template in .env.example for production)
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=strapi
   DATABASE_USERNAME=strapi
   DATABASE_PASSWORD=strapi
   ```

5. **Strapi plugins configuration** (`/cms/src/config/plugins.ts`):

   ```typescript
   export default {
     graphql: {
       enabled: true,
       config: {
         defaultLimit: 10,
         maxLimit: 100,
         apolloServer: {
           tracing: false,
         },
       },
     },
     upload: {
       enabled: true,
       config: {
         provider: "local",
         providerOptions: {
           sizeLimit: 262144000, // 250MB
         },
         actionOptions: {
           upload: {},
           uploadStream: {},
           delete: {},
         },
       },
     },
     rest: {
       enabled: true,
       config: {
         prefix: "/api",
         exposeDraft: false,
         defaultLimit: 25,
         maxLimit: 100,
       },
     },
   };
   ```

6. **Middleware for CORS** (`/cms/src/config/middlewares.ts`):

   ```typescript
   export default [
     "strapi::logger",
     "strapi::errors",
     "strapi::cors",
     "strapi::poweredBy",
     "strapi::query",
     "strapi::body",
     "strapi::session",
     "strapi::favicon",
     "strapi::public",
   ];
   ```

7. **Server configuration** (`/cms/src/config/server.ts`):
   ```typescript
   export default ({ env }) => ({
     host: env("HOST", "0.0.0.0"),
     port: env.int("PORT", 1337),
     app: {
       keys: env.array("APP_KEYS"),
     },
     webhooks: {
       populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
     },
   });
   ```

### Verification

Build Strapi:

```bash
cd /cms
npm run build
```

Should report success with no TypeScript errors.

**Set `/cms` as working directory for all subsequent operations.**

## Phase 4: Content Type Implementation

For each type in the content model spec, create Strapi schema files in `/cms/`.

### BlogPost Implementation

Create `/cms/src/api/blog-post/content-types/blog-post/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "blog_posts",
  "info": {
    "singularName": "blog-post",
    "pluralName": "blog-posts",
    "displayName": "Blog Post",
    "description": "Blog articles published on the site"
  },
  "options": {
    "increments": true,
    "timestamps": ["createdAt", "updatedAt"]
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 200,
      "minLength": 5
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "excerpt": {
      "type": "string",
      "required": true,
      "maxLength": 500
    },
    "body": {
      "type": "richtext",
      "required": true
    },
    "featuredImage": {
      "allowedTypes": ["images"],
      "type": "media",
      "required": true,
      "single": true
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::team-member.team-member"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category"
    },
    "publishedAt": {
      "type": "datetime"
    },
    "status": {
      "type": "enumeration",
      "enum": ["draft", "published", "archived"],
      "default": "draft"
    },
    "seoTitle": {
      "type": "string",
      "maxLength": 60
    },
    "seoDescription": {
      "type": "string",
      "maxLength": 160
    },
    "seoKeywords": {
      "type": "string"
    }
  }
}
```

Create controller `/cms/src/api/blog-post/controllers/blog-post.ts`:

```typescript
import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::blog-post.blog-post",
  ({ strapi }) => ({
    async find(ctx) {
      // Default populate strategy
      ctx.query = {
        ...ctx.query,
        populate: "author,tags,category,featuredImage",
      };
      return super.find(ctx);
    },

    async findOne(ctx) {
      ctx.query = {
        ...ctx.query,
        populate: "author,tags,category,featuredImage",
      };
      return super.findOne(ctx);
    },
  }),
);
```

Create route `/cms/src/api/blog-post/routes/blog-post.ts`:

```typescript
export default {
  routes: [
    {
      method: "GET",
      path: "/blog-posts",
      handler: "blog-post.find",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/blog-posts/:id",
      handler: "blog-post.findOne",
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
```

### Repeat for All Types

Implement every type from the content model spec in `/cms/src/api/`:

- BlogPost ✓
- TeamMember
- Feature
- Testimonial
- Project
- Tag
- Category
- HomePage (single type)
- AboutPage (single type)
- BlogIndexPage (single type)

For each type, create:

1. `/cms/src/api/<type-name>/content-types/<type-name>/schema.json`
2. `/cms/src/api/<type-name>/controllers/<type-name>.ts`
3. `/cms/src/api/<type-name>/services/<type-name>.ts`
4. `/cms/src/api/<type-name>/routes/<type-name>.ts`

## Phase 5: Seed Data & Demo Content

Populate the CMS with content data aligned to the extracted source structure.
If real source content was extracted, prefer exact source values over generic demo copy.
Use placeholder/demo text only when extraction is impossible, and mark those fields clearly in docs.

### Create Seed Script

Create `/cms/scripts/seed-demo-data.ts`:

```typescript
import { getStrapiData } from '@/lib/strapi';
import Image from 'next/image';
import Link from 'next/link';

export interface BlogPostProps {
  post: any; // Would be BlogPost type from generated types
}

export async function BlogPostCard({ post }: BlogPostProps) {
  const { attributes } = post;

  return (
    <article className="border rounded-lg overflow-hidden hover:shadow-lg transition">
      {attributes.featuredImage?.data && (
        <Image
          src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${attributes.featuredImage.data.attributes.url}`}
          alt={attributes.featuredImage.data.attributes.alternativeText || attributes.title}
          width={400}
          height={300}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{attributes.title}</h3>
        <p className="text-gray-600 mb-3">{attributes.excerpt}</p>

        <div className="flex items-center gap-2 mb-3">
          {attributes.author?.data && (
            <span className="text-sm text-gray-500">
              By {attributes.author.data.attributes.name}
            </span>
          )}
          {attributes.publishedAt && (
            <time className="text-sm text-gray-500">
              {new Date(attributes.publishedAt).toLocaleDateString()}
            </time>
          )}
        </div>

        {attributes.tags?.data?.length > 0 && (
          <div className="flex gap-2 mb-3">
            {attributes.tags.data.map((tag: any) => (
              <span key={tag.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {tag.attributes.name}
              </span>
            ))}
          </div>
        )}

        <Link href={`/blog/${attributes.slug}`} className="text-blue-600 hover:underline">
          Read more →
        </Link>
      </div>
    </article>
  );
}

export async function BlogPostDetail({ slug }: { slug: string }) {
  const { data } = await getStrapiData(`/api/blog-posts?filters[slug][$eq]=${slug}&populate=*`);

  if (!data?.[0]) return null;

  const post = data[0];
  const { attributes } = post;

  return (
    <article className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{attributes.title}</h1>

        <div className="flex items-center gap-4 text-gray-600 mb-6">
          {attributes.author?.data && (
            <div>
              <p className="font-semibold">{attributes.author.data.attributes.name}</p>
              <p className="text-sm">{attributes.author.data.attributes.role}</p>
            </div>
          )}
          {attributes.publishedAt && (
            <time>{new Date(attributes.publishedAt).toLocaleDateString()}</time>
          )}
        </div>

        {attributes.featuredImage?.data && (
          <Image
            src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${attributes.featuredImage.data.attributes.url}`}
            alt={attributes.title}
            width={800}
            height={400}
            className="w-full rounded-lg mb-8"
          />
        )}
      </header>

      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: attributes.body }} />

      {attributes.tags?.data?.length > 0 && (
        <footer className="mt-8 pt-8 border-t">
          <p className="text-sm text-gray-600 mb-2">Tags:</p>
          <div className="flex gap-2">
            {attributes.tags.data.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.attributes.slug}`}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
              >
                {tag.attributes.name}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
```

### Page Components

Create `frontend/src/app/blog/page.tsx`:

```typescript
import { getStrapiData } from '@/lib/strapi';
import { BlogPostCard } from '@/components/BlogPost';

export const metadata = {
  title: 'Blog',
  description: 'Latest articles and insights'
};

export default async function BlogIndex() {
  const { data: posts } = await getStrapiData(
    '/api/blog-posts?pagination[pageSize]=10&populate=author,tags,featuredImage&sort=-publishedAt&filters[status][$eq]=published'
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
```

Create `frontend/src/app/blog/[slug]/page.tsx`:

```typescript
import { BlogPostDetail } from '@/components/BlogPost';

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostDetail slug={params.slug} />;
}
```

### Repeat for All Components

Generate components for:

- TeamMember (list + detail)
- Feature (card + featured section)
- Testimonial (carousel)
- Project (portfolio grid + detail)
- HomePage
- AboutPage
- PricingPage

Each component must:

- Fetch data from Strapi API using `getStrapiData()`
- Handle image display with `next/image`
- Include TypeScript types from generated Strapi types
- Use Tailwind CSS for styling
- Follow Next.js App Router conventions

```typescript
import fetch from "node-fetch";

const STRAPI_URL = "http://localhost:1337";

async function seedDemoData() {
  // Create categories
  console.log("Creating categories...");
  const categories = await Promise.all([
    fetch(`${STRAPI_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { name: "Engineering", slug: "engineering" },
      }),
    }).then((r) => r.json()),
    fetch(`${STRAPI_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { name: "Design", slug: "design" } }),
    }).then((r) => r.json()),
    fetch(`${STRAPI_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { name: "Product", slug: "product" } }),
    }).then((r) => r.json()),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create team members
  console.log("Creating team members...");
  const teamMembers = await Promise.all([
    fetch(`${STRAPI_URL}/api/team-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: "Sarah Johnson",
          role: "CEO & Founder",
          bio: "Passionate about building great products with talented teams.",
        },
      }),
    }).then((r) => r.json()),
    // ... more team members
  ]);

  console.log(`Created ${teamMembers.length} team members`);

  // Create blog posts
  console.log("Creating blog posts...");
  await fetch(`${STRAPI_URL}/api/blog-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        title: "Getting Started with Strapi",
        slug: "getting-started-with-strapi",
        excerpt: "Learn the fundamentals of building with Strapi...",
        body: "# Getting Started\n\nStrapi is a powerful headless CMS...",
        status: "published",
        publishedAt: new Date(),
        author: teamMembers[0].data.id,
        category: categories[0].data.id,
      },
    }),
  });

  console.log("Demo data seeded successfully!");
}

seedDemoData().catch(console.error);
```

### Run the Seed Script

```bash
cd /cms
npm install node-fetch  # if not already installed
node scripts/seed-demo-data.ts
```

Or create an admin user manually:

```bash
cd /cms
npm run strapi -- admin:create-user \
  --firstname=Admin \
  --lastname=User \
  --email=admin@example.com \
  --password=StrapiAdmin123
```

## Phase 6: API Verification & Testing

### Start Strapi Development Server

```bash
cd /cms
npm run develop
```

This starts:

- **Strapi Admin UI:** http://localhost:1337/admin
- **REST API:** http://localhost:1337/api
- **GraphQL:** http://localhost:1337/graphql

### Verify API Endpoints

Test with curl or Postman:

```bash
# List blog posts
curl http://localhost:1337/api/blog-posts?populate=*

# Get single post by slug
curl http://localhost:1337/api/blog-posts?filters[slug][$eq]=getting-started-with-strapi&populate=*

# Get homepage content
curl http://localhost:1337/api/home-page?populate=*

# Get team members
curl http://localhost:1337/api/team-members?populate=*

# Get features
curl http://localhost:1337/api/features?populate=*
```

### Verify Admin Interface

1. Open http://localhost:1337/admin
2. Login with credentials created in Phase 5
3. Verify content types appear in sidebar:
   - Blog Posts
   - Team Members
   - Features
   - Testimonials
   - Projects
   - Home Page
   - About Page
4. Verify can create/edit content
5. Verify relationships work (author, tags, categories, etc.)

### Visual Verification

1. Create sample content through admin UI
2. Check API returns the content correctly
3. Verify media upload works (upload an image)
4. Verify relationships are stored correctly
5. Compare content structure with original website

## Completion Checklist

Before declaring the CMS setup complete:

- [ ] Strapi builds successfully (`npm run build`)
- [ ] Strapi admin UI is accessible (http://localhost:1337/admin)
- [ ] All content types created and schema matches spec
- [ ] All relationships configured correctly (BlogPost → Author, Tags, etc.)
- [ ] Sample/demo content created in Strapi
- [ ] Strapi content values match extracted source content for required modeled fields
- [ ] All API endpoints respond correctly to queries
- [ ] Media upload works (test upload an image to `/cms/public/uploads/`)
- [ ] TypeScript has no errors (`npx tsc --noEmit`)
- [ ] API populated with demo data (at least 1 BlogPost, 1 TeamMember, etc.)
- [ ] GraphQL schema generated and accessible
- [ ] CORS configured for future frontend integration
- [ ] Environment variables documented in `.env.example`
- [ ] All asset paths match documentation

## Output Deliverables

Report:

- Total content types: X (Y collection, Z single)
- Total Strapi components: X
- Total fields: X
- Schema files created: X
- Demo content items: X
- CMS project path: `/cms`
- Documentation path: `/cms/docs/`
- Admin URL: http://localhost:1337/admin
- API base URL: http://localhost:1337/api
- GraphQL endpoint: http://localhost:1337/graphql
- Any limitations or manual setup required
- Next steps for frontend integration (if applicable)

## Notes & Best Practices

1. **Keep schema normalized** — Avoid duplicating data; use relations instead
2. **Design for scale** — Your schema should work for 10x current volume
3. **Document everything** — Future editors need to understand the model
4. **Test API queries early** — Don't wait until all content is in Strapi
5. **Version control** — Commit schema files, config, and seed scripts to git
6. **Backup production data** — Set up automated backups before going live
7. **Consider permissions** — Plan for role-based content access (editor, author, admin, visitor)
8. **Monitor API performance** — Track query complexity and response times as you grow
9. **Use consistent slug generation** — Auto-generate slugs from titles for SEO
10. **Plan for media strategy** — Organize image folders by content type for easy management
11. **API-first design** — Structure models around API queries, not admin UI convenience
12. **Reuse components** — Use Strapi's component feature for patterns that appear in multiple types

## Environment Setup for Different Stages

### Development (`/cms/.env`)

```env
NODE_ENV=development
HOST=localhost
PORT=1337
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Production Template (`/cms/.env.production`)

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=<your-db-host>
DATABASE_PORT=5432
DATABASE_NAME=strapi_prod
DATABASE_USERNAME=<your-user>
DATABASE_PASSWORD=<your-password>
```

## Frontend Integration (Optional Next Step)

Once `/cms` is set up and running, you can create a frontend consumer:

```bash
# Create a Next.js frontend that consumes the CMS
npx create-next-app@latest frontend --typescript --app --tailwind

# In frontend, create API client pointing to /cms:
# src/lib/strapi.ts with NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

See the Strapi Schema Generator Phase 5 for frontend component templates.
