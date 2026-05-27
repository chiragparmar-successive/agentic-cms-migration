import { readJson, writeJson, stripHtml } from './utils.mjs';
import { profilePaths } from './migration-profile.mjs';
import { loadSiteConfig } from './site-config.mjs';
import { DEFAULT_WORDPRESS } from './defaults.mjs';

/**
 * @param {object|string} configOrSlug
 * @param {{ profile?: string }} [options]
 */
export async function normalizeWordPress(configOrSlug, options = {}) {
  const config =
    typeof configOrSlug === 'string'
      ? await loadSiteConfig(configOrSlug)
      : configOrSlug;

  const profileId = options.profile ?? 'preview';
  const paths = profilePaths(config, profileId);
  const typeMapping =
    config.wordpress?.typeMapping ?? DEFAULT_WORDPRESS.typeMapping;

  const raw = await readJson(paths.rawFile);
  const items = [];
  const taxonomies = {
    categories: normalizeTaxonomy(raw.types.categories),
    tags: normalizeTaxonomy(raw.types.tags),
  };

  for (const [wpType, universalKind] of Object.entries(typeMapping)) {
    const batch = raw.types[wpType];
    if (!Array.isArray(batch)) continue;
    for (const entry of batch) {
      items.push(normalizeEntry(entry, universalKind, wpType));
    }
  }

  for (const [typeName, batch] of Object.entries(raw.types)) {
    if (typeMapping[typeName] || !Array.isArray(batch)) continue;
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
      profile: profileId,
      siteSlug: config.siteSlug,
      sampleLimits: raw.meta?.sampleLimits ?? null,
      itemCount: items.length,
    },
    items,
    taxonomies,
    media,
    authors: Array.isArray(raw.types.users)
      ? raw.types.users.map(normalizeAuthor)
      : [],
  };

  await writeJson(paths.normalizedFile, payload);
  return { paths, config, itemCount: items.length };
}

function normalizeEntry(entry, kind, wpType) {
  const seo = entry.yoast_head_json || {};

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
    acf: entry.acf || entry.meta?.acf || null,
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
