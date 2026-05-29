#!/usr/bin/env node
import fs from 'node:fs/promises';
import { runStrapiImport } from './lib/strapi-importer-core.mjs';
import { requireStrapiEnv } from './lib/env.mjs';
import { loadSiteConfig } from './lib/site-config.mjs';
import { profilePaths } from './lib/migration-profile.mjs';

const [, , siteSlug] = process.argv;
if (!siteSlug) {
  console.error('Usage: STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>');
  process.exit(1);
}

const config = await loadSiteConfig(siteSlug);
const paths = profilePaths(config, 'full');
try { await fs.access(paths.normalizedFile); }
catch { console.error(`Missing ${paths.normalizedFile}. Run generated output/<site>/wp-migration/run-full-migration.mjs first.`); process.exit(1); }

try {
  const { strapiUrl, strapiToken } = await requireStrapiEnv({ migrationDir: config.migrationDir });
  const result = await runStrapiImport(config, { profileId: 'full', strapiUrl, strapiToken, skipCachedMedia: false });
  console.log('[import-full] OK');
  console.log('  id-map:', result.paths.idMapFile);
  console.log('  log:', result.paths.logFile);
  console.log('  results:', JSON.stringify(result.log.results, null, 2));
} catch (err) {
  console.error('[import-full] FAILED', err.message);
  process.exit(1);
}
