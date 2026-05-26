#!/usr/bin/env node
/**
 * Command 1 — Preview setup: content model + sample data to review in Strapi.
 * Not a sync/incremental tool. Full migration is a separate command (migrate-full.mjs).
 *
 * Usage:
 *   node scripts/wp-migration/migrate-sample.mjs <site-slug> <wordpress-url>
 *   node scripts/wp-migration/migrate-sample.mjs <site-slug> <wordpress-url> --import
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireStrapiEnv } from './lib/env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');

const [, , siteSlug, wpUrl, ...rest] = process.argv;
const doImport = rest.includes('--import');

if (!siteSlug || !wpUrl) {
  console.error(
    'Usage: node scripts/wp-migration/migrate-sample.mjs <site-slug> <wordpress-url> [--import]'
  );
  process.exit(1);
}

function runNode(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))));
  });
}

async function main() {
  const pipeline = path.join(__dirname, 'pipeline.mjs');
  const schema = path.join(__dirname, 'generate-schema.mjs');
  const importPreview = path.join(__dirname, 'import-preview-to-strapi.mjs');

  console.log('[migrate-sample] Step 1 — content model (preview profile)');
  await runNode(pipeline, [siteSlug, wpUrl, 'all', '--preview']);

  console.log('[migrate-sample] generating Strapi schemas from preview analysis');
  await runNode(schema, [siteSlug]);

  if (!doImport) {
    console.log('');
    console.log('Next: restart Strapi, then import preview rows:');
    console.log(
      `  STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-preview-to-strapi.mjs ${siteSlug}`
    );
    console.log('');
    console.log('After WP-1 / WP-2 approval, run the separate full migration:');
    console.log(`  node scripts/wp-migration/migrate-full.mjs ${siteSlug} ${wpUrl} --import`);
    return;
  }

  requireStrapiEnv();
  console.log('[migrate-sample] importing preview data into Strapi');
  await runNode(importPreview, [siteSlug]);
}

main().catch((err) => {
  console.error('[migrate-sample] FAILED', err.message);
  process.exit(1);
});
