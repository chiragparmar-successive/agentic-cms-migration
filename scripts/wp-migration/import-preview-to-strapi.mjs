#!/usr/bin/env node
/**
 * Import preview/sample WordPress data into Strapi (command 1 — after schema setup).
 * Uses wp-migration/preview/ only — independent from full migration state.
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
 *     node scripts/wp-migration/import-preview-to-strapi.mjs <site-slug>
 */
import { runStrapiImport } from './lib/strapi-importer-core.mjs';
import { requireStrapiEnv } from './lib/env.mjs';
import { profilePaths } from './lib/migration-profile.mjs';
import fs from 'node:fs/promises';

const [, , siteSlug] = process.argv;

if (!siteSlug) {
  console.error(
    'Usage: STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-preview-to-strapi.mjs <site-slug>'
  );
  process.exit(1);
}

const paths = profilePaths(siteSlug, 'preview');

try {
  await fs.access(paths.normalizedFile);
} catch {
  console.error(`Missing ${paths.normalizedFile}. Run wordpress-to-strapi.mjs first.`);
  process.exit(1);
}

try {
  const { strapiUrl, strapiToken } = requireStrapiEnv();
  const result = await runStrapiImport(siteSlug, {
    profileId: 'preview',
    strapiUrl,
    strapiToken,
  });
  console.log('[import-preview] OK');
  console.log('  profile: preview');
  console.log('  id-map:', result.paths.idMapFile);
  console.log('  log:', result.paths.logFile);
  console.log('  results:', JSON.stringify(result.log.results, null, 2));
} catch (err) {
  console.error('[import-preview] FAILED', err.message);
  process.exit(1);
}
