import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson, wpMigrationDir } from './utils.mjs';
import { extractWordPress } from './extract.mjs';
import { normalizeWordPress } from './normalize.mjs';

const ID_MAP_FILE = 'sync/id-map.json';
const LOG_FILE = 'sync/import-log.json';

function authHeaders(token) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function strapiRequest(baseUrl, token, method, apiPath, body) {
  const url = `${baseUrl.replace(/\/$/, '')}${apiPath}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || text || res.statusText;
    throw new Error(`Strapi ${method} ${apiPath} → ${res.status}: ${msg}`);
  }
  return json;
}

async function findByWpId(baseUrl, token, plural, wpId) {
  const q = `/api/${plural}?filters[wpId][$eq]=${wpId}&pagination[pageSize]=1`;
  const res = await strapiRequest(baseUrl, token, 'GET', q);
  const row = res?.data?.[0];
  return row ? { id: row.id, documentId: row.documentId } : null;
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

async function uploadMedia(baseUrl, token, mediaItem, idMap) {
  const wpId = mediaItem.wpId;
  if (idMap.media[wpId]) {
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

function emptyIdMap() {
  return {
    category: {},
    tag: {},
    author: {},
    media: {},
    article: {},
    page: {},
  };
}

export async function importToStrapi(siteSlug, options) {
  const { strapiUrl, strapiToken, refreshWp, wpUrl } = options;
  const outDir = wpMigrationDir(siteSlug);
  const syncDir = path.join(outDir, 'sync');
  await fs.mkdir(syncDir, { recursive: true });

  if (refreshWp && wpUrl) {
    await extractWordPress(siteSlug, wpUrl);
    await normalizeWordPress(siteSlug);
  }

  const normalized = await readJson(path.join(outDir, 'normalized/content.json'));
  const idMapPath = path.join(outDir, ID_MAP_FILE);

  let idMap = emptyIdMap();
  try {
    idMap = { ...emptyIdMap(), ...(await readJson(idMapPath)) };
  } catch {
    /* first run */
  }

  const log = {
    startedAt: new Date().toISOString(),
    strapiUrl,
    results: {},
  };

  // 1. Taxonomies
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

  // 2. Authors
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

  // 3. Media
  log.results.media = { uploaded: 0, skipped: 0, errors: 0 };
  for (const media of normalized.media || []) {
    try {
      const r = await uploadMedia(strapiUrl, strapiToken, media, idMap);
      if (r.action === 'uploaded') log.results.media.uploaded += 1;
      else log.results.media.skipped += 1;
    } catch (err) {
      log.results.media.errors += 1;
      console.warn(`[media] wp:${media.wpId}`, err.message);
    }
  }

  // 4. Articles & pages
  const contentStats = { article: { created: 0, updated: 0 }, page: { created: 0, updated: 0 } };

  for (const item of normalized.items || []) {
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

  await writeJson(idMapPath, idMap);
  await writeJson(path.join(outDir, LOG_FILE), log);

  return { idMapPath, logPath: path.join(outDir, LOG_FILE), log };
}
