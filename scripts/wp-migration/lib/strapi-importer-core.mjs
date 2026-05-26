import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson } from './utils.mjs';
import { profilePaths } from './migration-profile.mjs';
import { findByWpId, strapiRequest } from './strapi-client.mjs';

export function emptyIdMap() {
  return {
    category: {},
    tag: {},
    author: {},
    media: {},
    article: {},
    page: {},
  };
}

async function upsertEntry(baseUrl, token, plural, wpId, payload, idMap, mapKey) {
  const existing = await findByWpId(baseUrl, token, plural, wpId);
  const data = { data: payload };

  if (existing) {
    const putPath = existing.documentId
      ? `/api/${plural}/${existing.documentId}`
      : `/api/${plural}/${existing.id}`;
    const updated = await strapiRequest(baseUrl, token, 'PUT', putPath, data);
    const id = updated?.data?.id ?? existing.id;
    idMap[mapKey][wpId] = id;
    return { action: 'updated', id };
  }

  const created = await strapiRequest(baseUrl, token, 'POST', `/api/${plural}`, data);
  const id = created?.data?.id;
  idMap[mapKey][wpId] = id;
  return { action: 'created', id };
}

async function uploadMedia(baseUrl, token, mediaItem, idMap, { skipCached }) {
  const wpId = mediaItem.wpId;
  if (skipCached && idMap.media[wpId]) {
    return { action: 'skipped', id: idMap.media[wpId] };
  }

  const res = await fetch(mediaItem.url);
  if (!res.ok) throw new Error(`Failed to download media ${mediaItem.url}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const urlPath = new URL(mediaItem.url).pathname;
  const filename = path.basename(urlPath) || `wp-media-${wpId}.jpg`;

  const form = new FormData();
  form.append('files', new Blob([buffer]), filename);
  form.append(
    'fileInfo',
    JSON.stringify({
      alternativeText: mediaItem.alt || '',
      caption: mediaItem.title || '',
      name: mediaItem.title || filename,
    })
  );

  const uploadRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Media upload failed: ${JSON.stringify(uploadJson)}`);
  }

  const file = Array.isArray(uploadJson) ? uploadJson[0] : uploadJson;
  idMap.media[wpId] = file.id;
  return { action: 'uploaded', id: file.id };
}

/**
 * Import normalized WordPress JSON into Strapi for one profile.
 * Each profile has its own id-map — preview and full never share sync state.
 */
export async function runStrapiImport(siteSlug, options) {
  const {
    profileId,
    strapiUrl,
    strapiToken,
    skipCachedMedia = true,
  } = options;

  const paths = profilePaths(siteSlug, profileId);
  await fs.mkdir(paths.syncDir, { recursive: true });

  const normalized = await readJson(paths.normalizedFile);
  if (normalized.meta?.profile && normalized.meta.profile !== profileId) {
    throw new Error(
      `Normalized data profile mismatch: expected "${profileId}", got "${normalized.meta.profile}". Re-run extract for this profile.`
    );
  }

  let idMap = emptyIdMap();
  try {
    idMap = { ...emptyIdMap(), ...(await readJson(paths.idMapFile)) };
  } catch {
    /* first import for this profile */
  }

  const log = {
    startedAt: new Date().toISOString(),
    strapiUrl,
    profile: profileId,
    results: {},
  };

  for (const cat of normalized.taxonomies?.categories || []) {
    await upsertEntry(
      strapiUrl,
      strapiToken,
      'categories',
      cat.id,
      {
        wpId: cat.id,
        wpSourceType: 'category',
        name: cat.name,
        slug: cat.slug,
        parentWpId: cat.parent || null,
      },
      idMap,
      'category'
    );
  }
  log.results.categories = Object.keys(idMap.category).length;

  for (const tag of normalized.taxonomies?.tags || []) {
    await upsertEntry(
      strapiUrl,
      strapiToken,
      'tags',
      tag.id,
      {
        wpId: tag.id,
        wpSourceType: 'tag',
        name: tag.name,
        slug: tag.slug,
      },
      idMap,
      'tag'
    );
  }
  log.results.tags = Object.keys(idMap.tag).length;

  for (const author of normalized.authors || []) {
    await upsertEntry(
      strapiUrl,
      strapiToken,
      'authors',
      author.wpId,
      {
        wpId: author.wpId,
        wpSourceType: 'author',
        name: author.name,
        slug: author.slug,
        url: author.url,
      },
      idMap,
      'author'
    );
  }
  log.results.authors = Object.keys(idMap.author).length;

  log.results.media = { uploaded: 0, skipped: 0, errors: 0 };
  for (const media of normalized.media || []) {
    try {
      const r = await uploadMedia(strapiUrl, strapiToken, media, idMap, { skipCached: skipCachedMedia });
      if (r.action === 'uploaded') log.results.media.uploaded += 1;
      else log.results.media.skipped += 1;
    } catch (err) {
      log.results.media.errors += 1;
      console.warn(`[media] wp:${media.wpId}`, err.message);
    }
  }

  const contentStats = { article: { created: 0, updated: 0 }, page: { created: 0, updated: 0 } };

  for (const item of normalized.items || []) {
    if (item.kind !== 'article' && item.kind !== 'page') continue;
    const plural = item.kind === 'page' ? 'pages' : 'articles';
    const mapKey = item.kind === 'page' ? 'page' : 'article';

    const categoryIds = (item.categoryIds || [])
      .map((id) => idMap.category[id])
      .filter(Boolean);
    const tagIds = (item.tagIds || []).map((id) => idMap.tag[id]).filter(Boolean);
    const authorId = item.authorId ? idMap.author[item.authorId] : null;
    const featuredImage = item.featuredMediaId ? idMap.media[item.featuredMediaId] : null;

    const payload = {
      wpId: item.wpId,
      wpSourceType: item.wpType,
      sourceLink: item.link,
      title: item.title,
      slug: item.slug,
      body: item.body,
      excerpt: item.excerpt || '',
      publishedAt: item.publishedAt,
      seo: item.seo || {},
      categories: categoryIds.length ? categoryIds : undefined,
      tags: tagIds.length ? tagIds : undefined,
      author: authorId || undefined,
      featuredImage: featuredImage || undefined,
    };

    try {
      const r = await upsertEntry(strapiUrl, strapiToken, plural, item.wpId, payload, idMap, mapKey);
      contentStats[mapKey][r.action === 'created' ? 'created' : 'updated'] += 1;
    } catch (err) {
      console.warn(`[${mapKey}] wp:${item.wpId} ${item.slug}`, err.message);
    }
  }

  log.results.content = contentStats;
  log.finishedAt = new Date().toISOString();

  await writeJson(paths.idMapFile, idMap);
  await writeJson(paths.logFile, log);

  return { paths, log };
}
