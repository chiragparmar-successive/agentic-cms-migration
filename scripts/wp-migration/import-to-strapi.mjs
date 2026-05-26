#!/usr/bin/env node
/**
 * Step 2 — Sync WordPress content into a running Strapi instance (idempotent).
 * Safe to run multiple times; matches rows by wpId.
 *
 * Prerequisite:
 *   - Strapi running with schemas applied (generate-schema + restart)
 *   - API token with create/update on all types + upload
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> \
 *     node scripts/wp-migration/import-to-strapi.mjs <site-slug>
 *
 * Re-fetch WordPress then import:
 *   STRAPI_URL=... STRAPI_API_TOKEN=... \
 *     node scripts/wp-migration/import-to-strapi.mjs <site-slug> <wp-url> --refresh
 */
import { importToStrapi } from './lib/strapi-import.mjs';

const [, , siteSlug, wpUrl, ...rest] = process.argv;
const refresh = rest.includes('--refresh');

const strapiUrl = process.env.STRAPI_URL;
const strapiToken = process.env.STRAPI_API_TOKEN;

if (!siteSlug) {
  console.error(
    'Usage: STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-to-strapi.mjs <site-slug> [wp-url] [--refresh]'
  );
  process.exit(1);
}

if (!strapiUrl || !strapiToken) {
  console.error('Missing STRAPI_URL or STRAPI_API_TOKEN environment variables.');
  process.exit(1);
}

if (refresh && !wpUrl) {
  console.error('--refresh requires <wordpress-url> as second argument.');
  process.exit(1);
}

try {
  const result = await importToStrapi(siteSlug, {
    strapiUrl,
    strapiToken,
    refreshWp: refresh,
    wpUrl,
  });
  console.log('[import-to-strapi] OK');
  console.log('  id-map:', result.idMapPath);
  console.log('  log:', result.logPath);
  console.log('  results:', JSON.stringify(result.log.results, null, 2));
} catch (err) {
  console.error('[import-to-strapi] FAILED', err.message);
  process.exit(1);
}
