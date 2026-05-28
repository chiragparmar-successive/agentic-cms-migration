---
name: wp-source-adapter
description: Optional WordPress source adapter that extracts structured content via WP-JSON REST API including posts, pages, taxonomies, ACF fields, custom post types, and menus.
argument-hint: "<wordpress-url>"
user-invocable: true
---

# WordPress Source Adapter

Phase: **A — Reverse Engineering** (Step 2 of 3, optional)

Extract structured content from WordPress sites via the WP-JSON REST API. This adapter supplements the `site-crawler` output with API-level data when the source is WordPress.

## Activation

This skill is **optional** — only invoked when:
- The `site-crawler` detects WordPress (wp-json endpoint, `wp-content` paths, or WordPress meta generator tag)
- The user explicitly identifies the source as WordPress

## Arguments

- `$ARGUMENTS[0]` = WordPress site URL (required)

## Pre-Flight

1. Verify WP-JSON availability: `GET <url>/wp-json/wp/v2/`
2. If the endpoint returns 403 or is disabled, fall back to DOM-only extraction from `site-crawler`.
3. Check for known plugin APIs:
   - ACF: `GET <url>/wp-json/acf/v3/`
   - WooCommerce: `GET <url>/wp-json/wc/v3/`
   - Yoast SEO: check meta tags in crawler output
   - WPML: check for language switcher

## Execution

### Step 1: Core Content Extraction

```
GET /wp-json/wp/v2/posts?per_page=100&_embed
GET /wp-json/wp/v2/pages?per_page=100&_embed
GET /wp-json/wp/v2/categories?per_page=100
GET /wp-json/wp/v2/tags?per_page=100
GET /wp-json/wp/v2/media?per_page=100
GET /wp-json/wp/v2/users?per_page=100
GET /wp-json/wp/v2/menus (if available)
GET /wp-json/wp/v2/types (discover custom post types)
```

For each discovered custom post type:
```
GET /wp-json/wp/v2/<custom-type>?per_page=100&_embed
```

### Step 2: ACF Field Groups (if available)

```
GET /wp-json/acf/v3/options
GET /wp-json/acf/v3/posts/<id>
GET /wp-json/acf/v3/pages/<id>
```

Map ACF field types to Strapi equivalents:
- `text` → `string`
- `textarea` → `text`
- `wysiwyg` → `richtext`
- `image` → `media`
- `gallery` → `media (multiple)`
- `relationship` → `relation`
- `repeater` → `component (repeatable)`
- `flexible_content` → `dynamiczone`
- `group` → `component`

### Step 3: Taxonomy Mapping

Extract full taxonomy hierarchy:
- Categories (hierarchical)
- Tags (flat)
- Custom taxonomies

Map to Strapi equivalents:
- Hierarchical taxonomy → Collection type with self-referencing parent relation
- Flat taxonomy → Collection type with many-to-many relations

### Step 4: Menu Structure

Extract navigation menus and map to Strapi navigation model.

## Output Contract

Produce `output/<site>/docs/research/WP-API-EXTRACTION.md`:

- Post types inventory with field maps
- Taxonomy structure
- ACF field group definitions (if available)
- Menu structures
- User/author mappings
- Media library inventory
- Recommended Strapi type mappings

## Downstream

Output feeds into:
- `content-model-inferencer` (combined with `site-crawler` data)
