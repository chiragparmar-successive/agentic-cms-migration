/**
 * Retry imports listed in output/<site>/wp-migration/full/sync/failed-imports.json
 */
import { loadSiteConfig } from './site-config.mjs';
import { profilePaths } from './migration-profile.mjs';
import { readJson, writeJson } from './utils.mjs';
import { requireStrapiEnv } from './env.mjs';
import { emptyIdMapFromConfig } from './site-config.mjs';
import { findByWpId, strapiRequest } from './strapi-client.mjs';
import { createMigrationLogger } from './migration-logger.mjs';
import { recordImportFailure, writeFailedImports } from './import-failures.mjs';
import { upsertMediaFromRecord } from './strapi-importer-media.mjs';

async function retryEntry(baseUrl, token, record, idMap, logger) {
  const { entity, wpId, strapiApi, idMapKey, payload, source } = record;
  const label = `${entity} wp:${wpId}`;

  if (entity === 'media') {
    return upsertMediaFromRecord(baseUrl, token, source, idMap, logger);
  }

  if (!payload || !strapiApi || !idMapKey) {
    return { action: 'failed', error: 'missing payload or strapiApi in failed record' };
  }

  try {
    const existing = await findByWpId(baseUrl, token, strapiApi, wpId);
    const data = { data: payload };

    if (existing) {
      const putPath = existing.documentId
        ? `/api/${strapiApi}/${existing.documentId}`
        : `/api/${strapiApi}/${existing.id}`;
      const updated = await strapiRequest(baseUrl, token, 'PUT', putPath, data);
      const id = updated?.data?.id ?? existing.id;
      if (!idMap[idMapKey]) idMap[idMapKey] = {};
      idMap[idMapKey][wpId] = id;
      logger.upsert(entity, label, 'updated', `strapi:${id}`);
      return { action: 'updated', id };
    }

    const created = await strapiRequest(baseUrl, token, 'POST', `/api/${strapiApi}`, data);
    const id = created?.data?.id;
    if (!idMap[idMapKey]) idMap[idMapKey] = {};
    idMap[idMapKey][wpId] = id;
    logger.upsert(entity, label, 'created', `strapi:${id}`);
    return { action: 'created', id };
  } catch (err) {
    logger.upsert(entity, label, 'failed', err.message);
    return { action: 'failed', error: err.message };
  }
}

/**
 * @param {{ migrationDir: string }} options
 */
export async function runRetryFailedImport({ migrationDir }) {
  const config = await loadSiteConfig(migrationDir);
  const paths = profilePaths(config, 'full');
  const logger = createMigrationLogger('[retry-failed]', { logFile: paths.runLogFile });

  await logger.beginRun(`retry-failed — ${config.siteSlug}`);

  let failedBody;
  try {
    failedBody = await readJson(paths.failedFile);
  } catch {
    throw new Error(`Missing ${paths.failedFile}. Run full migration first.`);
  }

  const records = failedBody.records || [];
  if (records.length === 0) {
    logger.ok('retry', 'failed-imports', 'nothing to retry');
    await logger.flush();
    return { config, passed: true, retried: 0, remaining: 0, paths };
  }

  const { strapiUrl, strapiToken } = await requireStrapiEnv({ migrationDir });
  let idMap = emptyIdMapFromConfig(config);
  try {
    idMap = { ...idMap, ...(await readJson(paths.idMapFile)) };
  } catch {
    /* empty */
  }

  logger.banner(`Retry ${records.length} failed record(s)`);
  const stillFailed = [];
  let ok = 0;

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    logger.step(i + 1, records.length, record.entity);
    const r = await retryEntry(strapiUrl, strapiToken, record, idMap, logger);
    if (r.action === 'failed') {
      recordImportFailure(stillFailed, {
        ...record,
        error: r.error,
        failedAt: new Date().toISOString(),
      });
    } else {
      ok += 1;
    }
  }

  await writeJson(paths.idMapFile, idMap);
  await writeFailedImports(paths, config, 'full', stillFailed);

  logger.summary([
    ['retried ok', ok],
    ['still failed', stillFailed.length],
    ['failed file', paths.failedFile],
    ['run log', paths.runLogFile],
  ]);
  await logger.flush();

  const passed = stillFailed.length === 0;
  return { config, passed, retried: ok, remaining: stillFailed.length, paths };
}
