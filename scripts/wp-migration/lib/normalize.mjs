import path from 'node:path';
import { readJson, writeJson, wpMigrationDir, stripHtml } from './utils.mjs';

const WP_TO_UNIVERSAL = {
  posts: 'article',
  pages: 'page',
};

export async function normalizeWordPress(siteSlug) {
  const outDir = wpMigrationDir(siteSlug);
  const raw = await readJson(path.join(outDir, 'raw/wp-export.json'));

  const items = [];
  const taxonomies = {
    categories: normalizeTaxonomy(raw.types.categories),
    tags: normalizeTaxonomy(raw.types.tags),
  };

  for (const [wpType, universalKind] of Object.entries(WP_TO_UNIVERSAL)) {
    const batch = raw.types[wpType];
    if (!Array.isArray(batch)) continue;
    for (const entry of batch) {
      items.push(normalizeEntry(entry, universalKind, wpType));
    }
  }

  for (const [typeName, batch] of Object.entries(raw.types)) {
    if (WP_TO_UNIVERSAL[typeName] || !Array.isArray(batch)) continue;
    for (const entry of batch) {
      items.push(normalizeEntry(entry, 'custom', typeName));
    }
  }

  const media = Array.isArray(raw.types.media)
    ? raw.types.media.map(normalizeMedia)
    : [];

  const payload = {
    meta: {
      normalizedAt: new Date().toISOString(),
      sourceUrl: raw.meta?.sourceUrl,
      itemCount: items.length,
    },
    items,
    taxonomies,
    media,
    authors: Array.isArray(raw.types.users)
      ? raw.types.users.map(normalizeAuthor)
      : [],
  };

  const outPath = path.join(outDir, 'normalized/content.json');
  await writeJson(outPath, payload);
  return { outPath, itemCount: items.length };
}

function normalizeEntry(entry, kind, wpType) {
  const seo = entry.yoast_head_json || {};
  const acf = entry.acf || entry.meta?.acf || null;

  return {
    id: `wp:${wpType}:${entry.id}`,
    wpId: entry.id,
    wpType,
    kind,
    slug: entry.slug,
    title: entry.title?.rendered || entry.title || '',
    body: entry.content?.rendered || '',
    excerpt: entry.excerpt?.rendered || '',
    status: entry.status,
    publishedAt: entry.date,
    modifiedAt: entry.modified,
    link: entry.link,
    featuredMediaId: entry.featured_media || null,
    categoryIds: entry.categories || [],
    tagIds: entry.tags || [],
    authorId: entry.author,
    seo: {
      title: seo.title || entry.title?.rendered || '',
      description: seo.description || stripHtml(entry.excerpt?.rendered || ''),
      canonical: seo.canonical || entry.link,
    },
    blocks: entry.content?.block_version ? entry.content : null,
    acf,
    rawMeta: {
      type: entry.type,
      template: entry.template,
      meta: entry.meta,
    },
  };
}

function normalizeMedia(entry) {
  return {
    id: `wp:media:${entry.id}`,
    wpId: entry.id,
    url: entry.source_url,
    mime: entry.mime_type,
    alt: entry.alt_text || '',
    title: entry.title?.rendered || '',
    width: entry.media_details?.width,
    height: entry.media_details?.height,
  };
}

function normalizeAuthor(entry) {
  return {
    id: `wp:user:${entry.id}`,
    wpId: entry.id,
    name: entry.name,
    slug: entry.slug,
    url: entry.url,
  };
}

function normalizeTaxonomy(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    parent: t.parent || null,
    count: t.count,
  }));
}
