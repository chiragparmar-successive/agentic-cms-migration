---
name: site-crawler
description: Crawl a legacy website to extract DOM structure, routes, media assets, and sitemaps. Produces a comprehensive site inventory for downstream content model inference.
argument-hint: "<url> [sitemap-url]"
user-invocable: true
---

# Site Crawler

Phase: **A — Reverse Engineering** (Step 1 of 3)

Crawl the target website to produce a complete inventory of pages, content regions, media assets, and structural patterns.

## Arguments

- `$ARGUMENTS[0]` = Canonical page URL (required)
- `$ARGUMENTS[1]` = Sitemap URL (optional)

If arguments are missing, stop and ask:
`site-crawler <url> [sitemap-url]`

## Pre-Flight

1. **Browser automation is required.** Check for available browser MCP tools (Playwright MCP, Chrome MCP, etc.). If none are detected, ask the user which browser tool they have. This skill cannot work without browser automation.

2. Validate arguments:
   - `$ARGUMENTS[0]` must be a valid, reachable URL
   - If provided, `$ARGUMENTS[1]` must be a valid sitemap URL
   - If the source site is behind auth wall, CAPTCHA, or anti-bot protection, **stop and report**

## Execution

### Step 1: Sitemap Discovery

1. If `$ARGUMENTS[1]` provided, fetch and parse it (handle nested sitemaps).
2. Otherwise, try common locations: `/sitemap.xml`, `/sitemap_index.xml`, `/robots.txt`.
3. If no sitemap found, fall back to controlled in-site crawl from `$ARGUMENTS[0]`.

### Step 2: Page Crawl

For each discovered URL:

1. Navigate via browser MCP.
2. Extract DOM structure using the content extraction script (see below).
3. Record route path, page type, and content regions.
4. Capture all media assets (images, videos, documents) with metadata.
5. Detect repeating patterns across pages.

### Step 3: Content Extraction Script

Run via browser MCP on each page:

```javascript
(function () {
  const result = {
    url: window.location.href,
    title: document.title,
    headings: [...document.querySelectorAll("h1, h2, h3, h4")].map((h) => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim().slice(0, 200),
      id: h.id || null,
    })),
    paragraphs: [...document.querySelectorAll("p")].slice(0, 20).map((p) => ({
      text: p.textContent.trim().slice(0, 300),
    })),
    images: [...document.querySelectorAll("img")].map((img) => ({
      src: img.src || img.currentSrc,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
    })),
    links: [...document.querySelectorAll("a[href]")].slice(0, 50).map((a) => ({
      text: a.textContent.trim().slice(0, 100),
      href: a.href,
    })),
    structured: {
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)),
      metaTags: [...document.querySelectorAll("meta[name], meta[property]")].map((m) => ({
        name: m.getAttribute("name") || m.getAttribute("property"),
        content: m.content,
      })),
    },
  };
  return JSON.stringify(result, null, 2);
})();
```

### Step 4: Output Documents

Create under `output/<site>/docs/research/`:

1. **`CONTENT-STRUCTURE.md`** — Global content patterns across all pages
2. **`DATA-RELATIONSHIPS.md`** — Relationship and dependency map
3. **`pages/<route-slug>/CONTENT-MAP.md`** — Per-page content region map
4. **`pages/<route-slug>/BEHAVIORS.md`** — Per-page interactive behaviors

## Output Contract

- Route inventory with page types
- Content region map per page (header, hero, main, sidebar, footer)
- Media asset inventory with metadata
- Detected repeating patterns (candidates for collection types)
- Structural/relationship candidates
- All content text captured verbatim (no rewriting)

## Downstream

Output feeds into:
- `wp-source-adapter` (if WordPress detected)
- `content-model-inferencer` (always)
