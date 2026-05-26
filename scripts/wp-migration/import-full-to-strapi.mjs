#!/usr/bin/env node
/**
 * Import full WordPress dataset into Strapi (command 2 — standalone migration).
 * Uses wp-migration/full/ only — does not read or update preview sync state.
 *
 * Prerequisite: preview setup complete (schemas + WP-1/WP-2). Run migrate-full.mjs first
 * to extract/normalize full volume into wp-migration/full/.
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
 *     node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>
 */
import { runStrapiImport } from './lib/strapi-importer-core.mjs';
import { requireStrapiEnv } from './lib/env.mjs';
import { profilePaths } from './lib/migration-profile.mjs';
import fs from 'node:fs/promises';

const [, , siteSlug] = process.argv;

if (!siteSlug) {
  console.error(
    'Usage: STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>'
  );
  process.exit(1);
}

const paths = profilePaths(siteSlug, 'full');

try {
  await fs.access(paths.normalizedFile);
} catch {
  console.error(`Missing ${paths.normalizedFile}. Run migrate-full.mjs first.`);
  process.exit(1);
}

try {
  const { strapiUrl, strapiToken } = requireStrapiEnv();
  const result = await runStrapiImport(siteSlug, {
    profileId: 'full',
    strapiUrl,
    strapiToken,
    skipCachedMedia: false,
  });
  console.log('[import-full] OK');
  console.log('  profile: full');
  console.log('  id-map:', result.paths.idMapFile);
  console.log('  log:', result.paths.logFile);
  console.log('  results:', JSON.stringify(result.log.results, null, 2));
} catch (err) {
  console.error('[import-full] FAILED', err.message);
  process.exit(1);
}
