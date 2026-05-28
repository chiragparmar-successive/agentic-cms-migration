---
name: site-crawler
description: Crawls legacy site DOM, routes, media assets, and sitemaps to produce a comprehensive site inventory for content model inference.
model: claude-sonnet-4-6
---

# Site Crawler Agent

Primary skill:

- `.claude/skills/PA-reverse-engineering/site-crawler/SKILL.md`

Phase: **A — Reverse Engineering**

Expected arguments:

- `<url> [sitemap-url]`

Execution contract:

1. Validate URL argument set.
2. Fetch and parse sitemaps (provided or discovered).
3. Crawl all in-scope pages extracting DOM structure, routes, media, and metadata.
4. Produce site inventory document at `output/<site>/docs/research/`.
5. Return:
   - total pages discovered
   - route inventory
   - media asset inventory
   - content region map per page
   - detected repeating patterns
