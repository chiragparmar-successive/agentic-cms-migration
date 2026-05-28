import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson } from './utils.mjs';
import { profilePaths } from './migration-profile.mjs';
import { findByWpId, strapiRequest } from './strapi-client.mjs';
import { loadSiteConfig, emptyIdMapFromConfig } from './site-config.mjs';
import { runHook } from './hooks.mjs';

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
  const mediaKey = 'media';
  if (skipCached && idMap[mediaKey]?.[wpId]) {
    return { action: 'skipped', id: idMap[mediaKey][wpId] };
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
  if (!idMap[mediaKey]) idMap[mediaKey] = {};
  idMap[mediaKey][wpId] = file.id;
  return { action: 'uploaded', id: file.id };
}

/**
 * @param {object|string} configOrSlug
 * @param {{ profileId: string; strapiUrl: string; strapiToken: string; skipCachedMedia?: boolean }} options
 */
export async function runStrapiImport(configOrSlug, options) {
  const config =
    typeof configOrSlug === 'string'
      ? await loadSiteConfig(configOrSlug)
      : configOrSlug;

  const { profileId, strapiUrl, strapiToken, skipCachedMedia = true } = options;
  await runHook(config, 'preImport', { step: 'import', profileId, strapiUrl });
  const paths = profilePaths(config, profileId);
  const strapi = config.strapi;

  await fs.mkdir(paths.syncDir, { recursive: true });

  const normalized = await readJson(paths.normalizedFile);
  if (normalized.meta?.profile && normalized.meta.profile !== profileId) {
    throw new Error(
      `Normalized profile mismatch: expected "${profileId}", got "${normalized.meta.profile}".`
    );
  }

  let idMap = emptyIdMapFromConfig(config);
  try {
    idMap = { ...emptyIdMapFromConfig(config), ...(await readJson(paths.idMapFile)) };
  } catch {
    /* first import */
  }

  const log = {
    startedAt: new Date().toISOString(),
    strapiUrl,
    profile: profileId,
    siteSlug: config.siteSlug,
    results: {},
  };

  const tax = strapi.taxonomies ?? {};
  for (const cat of normalized.taxonomies?.categories || []) {
    const t = tax.category ?? { api: 'categories', idMapKey: 'category' };
    await upsertEntry(
      strapiUrl,
      strapiToken,
      t.api,
      cat.id,
      {
        wpId: cat.id,
        wpSourceType: 'category',
        name: cat.name,
        slug: cat.slug,
        parentWpId: cat.parent || null,
      },
      idMap,
      t.idMapKey
    );
  }
  log.results.categories = Object.keys(idMap[tax.category?.idMapKey ?? 'category'] || {}).length;

  for (const tag of normalized.taxonomies?.tags || []) {
    const t = tax.tag ?? { api: 'tags', idMapKey: 'tag' };
    await upsertEntry(
      strapiUrl,
      strapiToken,
      t.api,
      tag.id,
      {
        wpId: tag.id,
        wpSourceType: 'tag',
        name: tag.name,
        slug: tag.slug,
      },
      idMap,
      t.idMapKey
    );
  }
  log.results.tags = Object.keys(idMap[tax.tag?.idMapKey ?? 'tag'] || {}).length;

  const authors = strapi.authors ?? { api: 'authors', idMapKey: 'author' };
  for (const author of normalized.authors || []) {
    await upsertEntry(
      strapiUrl,
      strapiToken,
      authors.api,
      author.wpId,
      {
        wpId: author.wpId,
        wpSourceType: 'author',
        name: author.name,
        slug: author.slug,
        url: author.url,
      },
      idMap,
      authors.idMapKey
    );
  }
  log.results.authors = Object.keys(idMap[authors.idMapKey] || {}).length;

  log.results.media = { uploaded: 0, skipped: 0, errors: 0 };
  for (const media of normalized.media || []) {
    try {
      const r = await uploadMedia(strapiUrl, strapiToken, media, idMap, {
        skipCached: skipCachedMedia,
      });
      if (r.action === 'uploaded') log.results.media.uploaded += 1;
      else log.results.media.skipped += 1;
    } catch (err) {
      log.results.media.errors += 1;
      console.warn(`[media] wp:${media.wpId}`, err.message);
    }
  }

  const contentStats = {};
  const importable = (strapi.contentTypes || []).filter((ct) => ct.import !== false);

  for (const ct of importable) {
    contentStats[ct.idMapKey] = { created: 0, updated: 0 };
  }

  const catKey = tax.category?.idMapKey ?? 'category';
  const tagKey = tax.tag?.idMapKey ?? 'tag';
  const authorKey = strapi.authors?.idMapKey ?? 'author';
  const mediaKey = strapi.media?.idMapKey ?? 'media';

  for (const item of normalized.items || []) {
    const ct = importable.find((c) => c.kind === item.kind);
    if (!ct) continue;

    const categoryIds = (item.categoryIds || [])
      .map((id) => idMap[catKey]?.[id])
      .filter(Boolean);
    const tagIds = (item.tagIds || []).map((id) => idMap[tagKey]?.[id]).filter(Boolean);
    const authorId = item.authorId ? idMap[authorKey]?.[item.authorId] : null;
    const featuredImage = item.featuredMediaId
      ? idMap[mediaKey]?.[item.featuredMediaId]
      : null;

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
      const r = await upsertEntry(
        strapiUrl,
        strapiToken,
        ct.strapiApi,
        item.wpId,
        payload,
        idMap,
        ct.idMapKey
      );
      const stats = contentStats[ct.idMapKey];
      stats[r.action === 'created' ? 'created' : 'updated'] += 1;
    } catch (err) {
      console.warn(`[${ct.idMapKey}] wp:${item.wpId} ${item.slug}`, err.message);
    }
  }

  log.results.content = contentStats;
  log.finishedAt = new Date().toISOString();

  await writeJson(paths.idMapFile, idMap);
  await writeJson(paths.logFile, log);
  await runHook(config, 'postImport', {
    step: 'import',
    profileId,
    strapiUrl,
    paths,
    log,
  });

  return { paths, log, config };
}
