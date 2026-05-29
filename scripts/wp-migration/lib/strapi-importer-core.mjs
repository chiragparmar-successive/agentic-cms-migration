import fs from 'node:fs/promises';
import { readJson, writeJson } from './utils.mjs';
import { profilePaths } from './migration-profile.mjs';
import { findByWpId, strapiRequest } from './strapi-client.mjs';
import { loadSiteConfig, emptyIdMapFromConfig } from './site-config.mjs';
import { runHook } from './hooks.mjs';
import { createMigrationLogger } from './migration-logger.mjs';
import { verifyImport } from './import-verify.mjs';
import { recordImportFailure, writeFailedImports } from './import-failures.mjs';
import { upsertMediaFromRecord } from './strapi-importer-media.mjs';

async function upsertEntry(baseUrl, token, plural, wpId, payload, idMap, mapKey, logger, entityLabel) {
  const label = `${entityLabel} wp:${wpId}`;
  try {
    const existing = await findByWpId(baseUrl, token, plural, wpId);
    const data = { data: payload };

    if (existing) {
      const putPath = existing.documentId
        ? `/api/${plural}/${existing.documentId}`
        : `/api/${plural}/${existing.id}`;
      const updated = await strapiRequest(baseUrl, token, 'PUT', putPath, data);
      const id = updated?.data?.id ?? existing.id;
      idMap[mapKey][wpId] = id;
      logger.upsert(entityLabel, label, 'updated', `strapi:${id}`);
      return { action: 'updated', id };
    }

    const created = await strapiRequest(baseUrl, token, 'POST', `/api/${plural}`, data);
    const id = created?.data?.id;
    idMap[mapKey][wpId] = id;
    logger.upsert(entityLabel, label, 'created', `strapi:${id}`);
    return { action: 'created', id };
  } catch (err) {
    logger.upsert(entityLabel, label, 'failed', err.message);
    return { action: 'failed', error: err.message };
  }
}

function contentTypesForItems(config, normalized) {
  const kindsInData = new Set((normalized.items || []).map((i) => i.kind));
  return (config.strapi.contentTypes || []).filter(
    (ct) => ct.import !== false && kindsInData.has(ct.kind)
  );
}

/**
 * @param {object|string} configOrSlug
 * @param {{ profileId: string; strapiUrl: string; strapiToken: string; skipCachedMedia?: boolean; verify?: boolean; logger?: ReturnType<createMigrationLogger> }} options
 */
export async function runStrapiImport(configOrSlug, options) {
  const { profileId } = options;
  const config =
    typeof configOrSlug === 'string'
      ? await loadSiteConfig(configOrSlug)
      : configOrSlug;

  const paths = profilePaths(config, profileId);
  const {
    profileId: _pid,
    strapiUrl,
    strapiToken,
    skipCachedMedia = true,
    verify = true,
    logger = createMigrationLogger('[import]', { logFile: paths.runLogFile }),
  } = options;

  await runHook(config, 'preImport', { step: 'import', profileId, strapiUrl });
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
    transfers: [],
    errors: [],
  };
  const failedRecords = [];

  logger.banner(`Import → Strapi (${profileId})`);

  const tax = strapi.taxonomies ?? {};
  const taxTotal =
    (normalized.taxonomies?.categories?.length || 0) +
    (normalized.taxonomies?.tags?.length || 0) +
    (normalized.authors?.length || 0);
  let step = 0;

  for (const cat of normalized.taxonomies?.categories || []) {
    step += 1;
    logger.step(step, taxTotal, 'category');
    const t = tax.category ?? { api: 'categories', idMapKey: 'category' };
    const catPayload = {
      wpId: cat.id,
      wpSourceType: 'category',
      name: cat.name,
      slug: cat.slug,
      parentWpId: cat.parent || null,
    };
    const r = await upsertEntry(
      strapiUrl,
      strapiToken,
      t.api,
      cat.id,
      catPayload,
      idMap,
      t.idMapKey,
      logger,
      'category'
    );
    if (r.action === 'failed') {
      log.errors.push({ type: 'category', wpId: cat.id, error: r.error });
      recordImportFailure(failedRecords, {
        entity: 'category',
        wpId: cat.id,
        strapiApi: t.api,
        idMapKey: t.idMapKey,
        error: r.error,
        source: cat,
        payload: catPayload,
      });
    }
  }
  log.results.categories = Object.keys(idMap[tax.category?.idMapKey ?? 'category'] || {}).length;

  for (const tag of normalized.taxonomies?.tags || []) {
    step += 1;
    logger.step(step, taxTotal, 'tag');
    const t = tax.tag ?? { api: 'tags', idMapKey: 'tag' };
    const tagPayload = {
      wpId: tag.id,
      wpSourceType: 'tag',
      name: tag.name,
      slug: tag.slug,
    };
    const r = await upsertEntry(
      strapiUrl,
      strapiToken,
      t.api,
      tag.id,
      tagPayload,
      idMap,
      t.idMapKey,
      logger,
      'tag'
    );
    if (r.action === 'failed') {
      log.errors.push({ type: 'tag', wpId: tag.id, error: r.error });
      recordImportFailure(failedRecords, {
        entity: 'tag',
        wpId: tag.id,
        strapiApi: t.api,
        idMapKey: t.idMapKey,
        error: r.error,
        source: tag,
        payload: tagPayload,
      });
    }
  }
  log.results.tags = Object.keys(idMap[tax.tag?.idMapKey ?? 'tag'] || {}).length;

  const authors = strapi.authors ?? { api: 'authors', idMapKey: 'author' };
  for (const author of normalized.authors || []) {
    step += 1;
    logger.step(step, taxTotal, 'author');
    const authorPayload = {
      wpId: author.wpId,
      wpSourceType: 'author',
      name: author.name,
      slug: author.slug,
      url: author.url,
    };
    const r = await upsertEntry(
      strapiUrl,
      strapiToken,
      authors.api,
      author.wpId,
      authorPayload,
      idMap,
      authors.idMapKey,
      logger,
      'author'
    );
    if (r.action === 'failed') {
      log.errors.push({ type: 'author', wpId: author.wpId, error: r.error });
      recordImportFailure(failedRecords, {
        entity: 'author',
        wpId: author.wpId,
        strapiApi: authors.api,
        idMapKey: authors.idMapKey,
        error: r.error,
        source: author,
        payload: authorPayload,
      });
    }
  }
  log.results.authors = Object.keys(idMap[authors.idMapKey] || {}).length;

  log.results.media = { uploaded: 0, skipped: 0, failed: 0 };
  const mediaList = normalized.media || [];
  let mediaIdx = 0;
  for (const media of mediaList) {
    mediaIdx += 1;
    logger.step(mediaIdx, mediaList.length, 'media');
    const r = await upsertMediaFromRecord(strapiUrl, strapiToken, media, idMap, logger);
    if (r.action === 'uploaded') log.results.media.uploaded += 1;
    else if (r.action === 'skipped') log.results.media.skipped += 1;
    else if (r.action === 'failed') {
      log.results.media.failed += 1;
      log.errors.push({ type: 'media', wpId: media.wpId, error: r.error });
      recordImportFailure(failedRecords, {
        entity: 'media',
        wpId: media.wpId,
        strapiApi: 'upload',
        idMapKey: 'media',
        error: r.error,
        source: media,
        payload: null,
      });
    }
  }

  const importable = contentTypesForItems(config, normalized);
  const contentStats = {};
  for (const ct of importable) {
    contentStats[ct.idMapKey] = { created: 0, updated: 0, failed: 0 };
  }

  const catKey = tax.category?.idMapKey ?? 'category';
  const tagKey = tax.tag?.idMapKey ?? 'tag';
  const authorKey = strapi.authors?.idMapKey ?? 'author';
  const mediaKey = strapi.media?.idMapKey ?? 'media';

  const items = normalized.items || [];
  let itemIdx = 0;
  for (const item of items) {
    const ct = importable.find((c) => c.kind === item.kind);
    if (!ct) continue;

    itemIdx += 1;
    logger.step(itemIdx, items.length, ct.idMapKey);

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

    const r = await upsertEntry(
      strapiUrl,
      strapiToken,
      ct.strapiApi,
      item.wpId,
      payload,
      idMap,
      ct.idMapKey,
      logger,
      ct.idMapKey
    );

    const stats = contentStats[ct.idMapKey];
    if (r.action === 'created') stats.created += 1;
    else if (r.action === 'updated') stats.updated += 1;
    else if (r.action === 'failed') {
      stats.failed += 1;
      log.errors.push({ type: ct.idMapKey, wpId: item.wpId, slug: item.slug, error: r.error });
      recordImportFailure(failedRecords, {
        entity: ct.idMapKey,
        wpId: item.wpId,
        strapiApi: ct.strapiApi,
        idMapKey: ct.idMapKey,
        error: r.error,
        source: item,
        payload,
      });
    }
  }

  log.results.content = contentStats;
  log.finishedAt = new Date().toISOString();
  log.transferStats = { ...logger.stats };
  log.failedCount = failedRecords.length;

  await writeJson(paths.idMapFile, idMap);
  await writeJson(paths.logFile, log);
  const failedBody = await writeFailedImports(paths, config, profileId, failedRecords);
  if (failedRecords.length > 0) {
    logger.warn(`${failedRecords.length} failed — retry: node run-retry-failed.mjs`);
    logger.info(`failed file: ${paths.failedFile}`);
  } else {
    await writeFailedImports(paths, config, profileId, []);
  }

  logger.summary([
    ['categories', log.results.categories],
    ['tags', log.results.tags],
    ['authors', log.results.authors],
    ['media uploaded', log.results.media.uploaded],
    ['media skipped', log.results.media.skipped],
    ['media failed', log.results.media.failed],
    ['import errors', log.errors.length],
    ['failed file', paths.failedFile],
    ['run log', paths.runLogFile],
  ]);

  let verification = null;
  if (verify) {
    logger.banner('Verification');
    const verifyLogger = createMigrationLogger('[verify]', { logFile: logger.logFile });
    const v = await verifyImport(config, {
      strapiUrl,
      strapiToken,
      normalized,
      idMap,
      logger: verifyLogger,
    });
    verification = v.verification;
    log.verification = verification;
    await writeJson(paths.logFile, log);

    if (!v.passed) {
      logger.fail('verify', 'import', 'count mismatch — see checks above');
    } else {
      logger.ok('verify', 'import', 'all counts match');
    }
  }

  await runHook(config, 'postImport', {
    step: 'import',
    profileId,
    strapiUrl,
    paths,
    log,
    verification,
  });

  await logger.flush();

  return {
    paths,
    log,
    config,
    failed: failedBody,
    passed: log.errors.length === 0 && (verification?.passed !== false),
    verification,
  };
}
