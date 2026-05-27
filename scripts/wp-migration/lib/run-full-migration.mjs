/**
 * Full data migration engine — invoked by generated run-full-migration.mjs in output.
 */
import { loadSiteConfig } from './site-config.mjs';
import { extractWordPress } from './extract.mjs';
import { normalizeWordPress } from './normalize.mjs';
import { runStrapiImport } from './strapi-importer-core.mjs';
import { requireStrapiEnv } from './env.mjs';

const LOG = '[run-full-migration]';

/**
 * @param {{ migrationDir: string; argv?: string[] }} options
 */
export async function runFullDataMigration({ migrationDir, argv = process.argv }) {
  const config = await loadSiteConfig(migrationDir);
  const doImport = argv.includes('--import');

  console.log(`${LOG} site: ${config.siteSlug}`);
  console.log(`${LOG} wordpress: ${config.wordpressUrl}`);
  console.log(`${LOG} profile: full (data only — no content modeling)`);

  console.log(`${LOG} (1/2) extract + normalize`);
  await extractWordPress(config, { profile: 'full' });
  await normalizeWordPress(config, { profile: 'full' });

  if (!doImport) {
    console.log('');
    console.log(`${LOG} Extract/normalize done. Import with:`);
    console.log(
      `  STRAPI_URL=... STRAPI_API_TOKEN=... node ${config.fullMigrationRunner || 'run-full-migration.mjs'} --import`
    );
    return { config, imported: false };
  }

  const { strapiUrl, strapiToken } = requireStrapiEnv();
  console.log(`${LOG} (2/2) import into Strapi`);
  const result = await runStrapiImport(config, {
    profileId: 'full',
    strapiUrl,
    strapiToken,
    skipCachedMedia: false,
  });

  console.log(`${LOG} complete`);
  console.log('  id-map:', result.paths.idMapFile);
  console.log('  log:', result.paths.logFile);
  return { config, imported: true, result };
}
