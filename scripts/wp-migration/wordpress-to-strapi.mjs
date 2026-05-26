#!/usr/bin/env node
/**
 * /wordpress-to-strapi — End-to-end partial migration (CMS scripts).
 *
 * CMS path: extract → normalize → detect → review → generate-schema → (optional) import
 *
 * With no flags, the orchestrator also runs Phase B (tests), Phase D (frontend),
 * and Phase E (quality) after CMS checkpoints — see lib/orchestrator-flags.mjs.
 *
 * Usage:
 *   node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url> [flags]
 *   node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url> --import
 *
 * Flags: --cms-only | --skip-tests  (default = full stack partial)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireStrapiEnv } from './lib/env.mjs';
import { parseOrchestratorFlags, formatOrchestratorPlan } from './lib/orchestrator-flags.mjs';
import { writeJson, wpMigrationDir } from './lib/utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const LOG = '[wordpress-to-strapi]';

const [, , siteSlug, wpUrl, ...rest] = process.argv;
const doImport = rest.includes('--import');
const flags = parseOrchestratorFlags(process.argv);

if (!siteSlug || !wpUrl) {
  console.error(
    `Usage: node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url> [--import] [--cms-only] [--skip-tests]`
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
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(script)} exited ${code}`))));
  });
}

async function main() {
  await writeJson(path.join(wpMigrationDir(siteSlug), 'orchestrator-plan.json'), {
    generatedAt: new Date().toISOString(),
    siteSlug,
    wordpressUrl: wpUrl,
    ...flags,
  });

  console.log(`${LOG} Orchestrator plan:\n${formatOrchestratorPlan(flags)}\n`);

  const pipeline = path.join(__dirname, 'pipeline.mjs');
  const schema = path.join(__dirname, 'generate-schema.mjs');
  const importPreview = path.join(__dirname, 'import-preview-to-strapi.mjs');

  console.log(`${LOG} E2E partial — content model + sample data`);
  console.log(`${LOG} (1/3) WordPress extract → normalize → detect → review`);
  await runNode(pipeline, [siteSlug, wpUrl, 'all', '--preview']);

  console.log(`${LOG} (2/3) Generate Strapi schemas from content model`);
  await runNode(schema, [siteSlug]);

  if (!doImport) {
    console.log('');
    console.log(`${LOG} CMS scripts done. Agent continues with:`);
    if (flags.runTests) console.log('  - Phase B: Playwright test suite (.claude/commands/phase-b.md)');
    console.log('  - Strapi bootstrap + restart, then re-run with --import');
    if (flags.runFrontend) {
      console.log('  - Phase D: Next.js frontend (after WP-2)');
      if (flags.runQualityGates) console.log('  - Phase E: quality gates');
    }
    console.log('');
    console.log(`  STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/wordpress-to-strapi.mjs ${siteSlug} ${wpUrl} --import`);
  } else {
    requireStrapiEnv();
    console.log(`${LOG} (3/3) Import partial WordPress data into Strapi`);
    await runNode(importPreview, [siteSlug]);
    console.log(`${LOG} CMS import complete.`);
    if (flags.runTests || flags.runFrontend) {
      console.log(`${LOG} Continue orchestrator phases per orchestrator-plan.json`);
    }
  }

  if (!flags.runFrontend && !flags.runTests) {
    console.log(`${LOG} --cms-only: skipping tests, frontend, and quality gates.`);
  }
}

main().catch((err) => {
  console.error(`${LOG} FAILED`, err.message);
  process.exit(1);
});
