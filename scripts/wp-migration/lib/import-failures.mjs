import { writeJson } from './utils.mjs';

/**
 * @param {object[]} bucket
 * @param {object} record
 */
export function recordImportFailure(bucket, record) {
  bucket.push({
    entity: record.entity,
    wpId: record.wpId,
    strapiApi: record.strapiApi ?? null,
    idMapKey: record.idMapKey ?? null,
    error: record.error,
    source: record.source ?? null,
    payload: record.payload ?? null,
    failedAt: new Date().toISOString(),
  });
}

/**
 * Persist failed records for later retry (project output path).
 */
export async function writeFailedImports(paths, config, profileId, records) {
  const body = {
    meta: {
      updatedAt: new Date().toISOString(),
      siteSlug: config.siteSlug,
      profile: profileId,
      count: records.length,
      retryCommand: 'node run-retry-failed.mjs',
    },
    records,
  };
  await writeJson(paths.failedFile, body);
  return body;
}
