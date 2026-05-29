/**
 * Full data migration engine (shared) — invoked by output/<site>/wp-migration/run-full-migration.mjs
 */
import { loadSiteConfig } from './site-config.mjs';
import { extractWordPress } from './extract.mjs';
import { normalizeWordPress } from './normalize.mjs';
import { runStrapiImport } from './strapi-importer-core.mjs';
import { requireStrapiEnv } from './env.mjs';
import { profilePaths } from './migration-profile.mjs';
import { readJson } from './utils.mjs';
import { createMigrationLogger } from './migration-logger.mjs';
import { verifyImport } from './import-verify.mjs';

const LOG = '[run-full-migration]';

/**
 * @param {{ migrationDir: string; argv?: string[] }} options
 */
export async function runFullDataMigration({ migrationDir, argv = process.argv }) {
  const config = await loadSiteConfig(migrationDir);
  const paths = profilePaths(config, 'full');
  const extractOnly = argv.includes('--extract-only');
  const verifyOnly = argv.includes('--verify');
  const logger = createMigrationLogger(LOG, { logFile: paths.runLogFile });

  await logger.beginRun(`full migration — ${config.siteSlug}`);

  logger.banner(`Full data migration — ${config.siteSlug}`);
  logger.info(`WordPress: ${config.wordpressUrl}`);
  logger.info(`Profile: full (data only — no content modeling)`);
  logger.info(`Engine: scripts/wp-migration/lib/*`);
  logger.info(`Output: ${migrationDir}`);

  if (verifyOnly) {
    const normalized = await readJson(paths.normalizedFile);
    let idMap = {};
    try {
      idMap = await readJson(paths.idMapFile);
    } catch {
      throw new Error(`Missing ${paths.idMapFile}. Run full migration first.`);
    }
    const { strapiUrl, strapiToken } = await requireStrapiEnv({ migrationDir });
    logger.banner('Verification only');
    const v = await verifyImport(config, {
      strapiUrl,
      strapiToken,
      normalized,
      idMap,
      logger: createMigrationLogger('[verify]', { logFile: paths.runLogFile }),
    });
    await logger.flush();
    return {
      config,
      imported: false,
      verifyOnly: true,
      passed: v.passed,
      verification: v.verification,
      paths,
    };
  }

  logger.step(1, extractOnly ? 1 : 2, 'extract + normalize');
  await extractWordPress(config, { profile: 'full' });
  await normalizeWordPress(config, { profile: 'full' });
  logger.ok('extract', 'normalize', 'complete');

  if (extractOnly) {
    logger.info(`normalized: ${paths.normalizedFile}`);
    logger.info('Import is skipped in --extract-only mode');
    await logger.flush();
    return { config, imported: false, passed: true, paths };
  }

  const { strapiUrl, strapiToken } = await requireStrapiEnv({ migrationDir });
  logger.step(2, 2, `import + verify → Strapi (${strapiUrl})`);

  const importLogger = createMigrationLogger('[import]', { logFile: paths.runLogFile });
  await importLogger.beginRun('import phase');
  const result = await runStrapiImport(config, {
    profileId: 'full',
    strapiUrl,
    strapiToken,
    skipCachedMedia: true,
    verify: true,
    logger: importLogger,
  });

  if (result.passed) {
    logger.ok('complete', 'migration', `log: ${paths.runLogFile}`);
  } else {
    logger.fail('complete', 'migration', `see ${paths.failedFile} and ${paths.runLogFile}`);
  }

  logger.info(`artifacts:`);
  logger.info(`  run log: ${paths.runLogFile}`);
  logger.info(`  import log: ${paths.logFile}`);
  logger.info(`  failed: ${paths.failedFile}`);
  logger.info(`  id-map: ${paths.idMapFile}`);

  await logger.flush();

  return { config, imported: true, passed: result.passed, paths, result };
}
