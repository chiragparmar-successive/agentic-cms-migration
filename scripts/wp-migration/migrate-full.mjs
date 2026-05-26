#!/usr/bin/env node
/**
 * Command 2 — Full WordPress → Strapi data migration (standalone).
 * Does NOT sync or continue from preview — uses wp-migration/full/ artifacts only.
 * Schemas must already exist from migrate-sample (preview analysis).
 *
 * Usage:
 *   node scripts/wp-migration/migrate-full.mjs <site-slug> <wordpress-url>
 *   node scripts/wp-migration/migrate-full.mjs <site-slug> <wordpress-url> --import
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
    'Usage: node scripts/wp-migration/migrate-full.mjs <site-slug> <wordpress-url> [--import]'
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
  const importFull = path.join(__dirname, 'import-full-to-strapi.mjs');

  console.log('[migrate-full] extracting complete WordPress dataset (full profile)');
  await runNode(pipeline, [siteSlug, wpUrl, 'all', '--full']);

  if (!doImport) {
    console.log('');
    console.log('Next: import full dataset (separate from preview id-map):');
    console.log(
      `  STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/import-full-to-strapi.mjs ${siteSlug}`
    );
    return;
  }

  requireStrapiEnv();
  console.log('[migrate-full] importing full dataset into Strapi');
  await runNode(importFull, [siteSlug]);
}

main().catch((err) => {
  console.error('[migrate-full] FAILED', err.message);
  process.exit(1);
});
