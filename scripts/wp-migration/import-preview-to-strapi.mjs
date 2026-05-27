#!/usr/bin/env node
import fs from 'node:fs/promises';
import { runStrapiImport } from './lib/strapi-importer-core.mjs';
import { requireStrapiEnv } from './lib/env.mjs';
import { loadSiteConfig } from './lib/site-config.mjs';
import { profilePaths } from './lib/migration-profile.mjs';

const [, , siteSlug] = process.argv;
if (!siteSlug) {
  console.error('Usage: STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-preview-to-strapi.mjs <site-slug>');
  process.exit(1);
}

const config = await loadSiteConfig(siteSlug);
const paths = profilePaths(config, 'preview');
try { await fs.access(paths.normalizedFile); }
catch { console.error(`Missing ${paths.normalizedFile}. Run wordpress-to-strapi.mjs first.`); process.exit(1); }

try {
  const { strapiUrl, strapiToken } = requireStrapiEnv();
  const result = await runStrapiImport(config, { profileId: 'preview', strapiUrl, strapiToken });
  console.log('[import-preview] OK');
  console.log('  id-map:', result.paths.idMapFile);
  console.log('  log:', result.paths.logFile);
  console.log('  results:', JSON.stringify(result.log.results, null, 2));
} catch (err) {
  console.error('[import-preview] FAILED', err.message);
  process.exit(1);
}
