#!/usr/bin/env node
/**
 * Step 1 — Generate Strapi schema files from WordPress structure analysis.
 *
 * Prerequisite:
 *   node scripts/wp-migration/pipeline.mjs <site-slug> <wp-url> detect
 *
 * Usage:
 *   node scripts/wp-migration/generate-schema.mjs <site-slug>
 */
import { generateStrapiSchemas } from './lib/strapi-schema.mjs';

const [, , siteSlug] = process.argv;

if (!siteSlug) {
  console.error('Usage: node scripts/wp-migration/generate-schema.mjs <site-slug>');
  process.exit(1);
}

try {
  const result = await generateStrapiSchemas(siteSlug);
  console.log('[generate-schema] OK');
  console.log('  types:', result.typeCount);
  console.log('  schemas:', result.apiRoot);
  console.log('  manifest:', result.manifestPath);
  console.log('');
  console.log('Next: restart Strapi (npm run develop), then run content-etl-pipeline (Phase C)');
} catch (err) {
  console.error('[generate-schema] FAILED', err.message);
  process.exit(1);
}
