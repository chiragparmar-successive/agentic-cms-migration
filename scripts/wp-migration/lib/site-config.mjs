import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson, wpMigrationDir, repoRoot } from './utils.mjs';
import { buildDefaultSiteConfig, DEFAULT_STRAPI } from './defaults.mjs';

export const SITE_CONFIG_FILE = 'site-config.json';
export const FULL_RUNNER_FILE = 'run-full-migration.mjs';
export const RETRY_RUNNER_FILE = 'run-retry-failed.mjs';

export function siteConfigPath(migrationDir) {
  return path.join(migrationDir, SITE_CONFIG_FILE);
}

export function resolveMigrationDir(siteSlugOrDir) {
  if (siteSlugOrDir.includes('/') || siteSlugOrDir.endsWith('wp-migration')) {
    return path.resolve(siteSlugOrDir);
  }
  return wpMigrationDir(siteSlugOrDir);
}

export async function loadSiteConfig(siteSlugOrDir) {
  const migrationDir = resolveMigrationDir(siteSlugOrDir);
  const file = siteConfigPath(migrationDir);
  try {
    const config = await readJson(file);
    config.migrationDir = migrationDir;
    return config;
  } catch {
    throw new Error(`Missing ${file}. Run wordpress-to-strapi.mjs for this site first.`);
  }
}

export async function initSiteConfig({ siteSlug, wordpressUrl }) {
  const migrationDir = wpMigrationDir(siteSlug);
  await fs.mkdir(migrationDir, { recursive: true });
  await fs.mkdir(path.join(migrationDir, 'scripts'), { recursive: true });
  const file = siteConfigPath(migrationDir);

  let config;
  try {
    config = await readJson(file);
    config.wordpressUrl = wordpressUrl;
    config.siteSlug = siteSlug;
    config.migrationDir = migrationDir;
  } catch {
    config = buildDefaultSiteConfig({ siteSlug, wordpressUrl, migrationDir });
  }

  config.scriptsDir ??= 'scripts';
  config.hooks ??= {};
  config.hooks.preExtract ??= null;
  config.hooks.postExtract ??= null;
  config.hooks.preNormalize ??= null;
  config.hooks.postNormalize ??= null;
  config.hooks.preImport ??= null;
  config.hooks.postImport ??= null;

  await writeJson(file, config);
  return config;
}

export async function syncSiteConfigFromAnalysis(siteSlugOrDir) {
  const migrationDir = resolveMigrationDir(siteSlugOrDir);
  const config = await loadSiteConfig(migrationDir);
  const analysisFile = path.join(migrationDir, 'analysis/structure-analysis.json');

  let analysis;
  try {
    analysis = await readJson(analysisFile);
  } catch {
    await writeJson(siteConfigPath(migrationDir), config);
    return config;
  }

  const byKind = new Map((config.strapi.contentTypes || []).map((ct) => [ct.kind, ct]));

  const wpKinds = new Set(Object.values(config.wordpress?.typeMapping || {}));
  const SKIP_CONTENT_API_IDS = new Set([
    'category',
    'categories',
    'tag',
    'tags',
    'media',
    'author',
    'authors',
    'user',
    'users',
    'navigation',
    'navigations',
  ]);

  for (const ct of analysis.collectionTypes || []) {
    if (SKIP_CONTENT_API_IDS.has(ct.apiId)) continue;

    const kind = ct.apiId === 'page' || (ct.kind === 'singleType' && ct.apiId === 'page')
      ? 'page'
      : ct.apiId.replace(/-/g, '_');

    if (wpKinds.size > 0 && !wpKinds.has(kind) && kind !== 'page') continue;

    const strapiApi = pluralizeApi(ct.apiId);
    const existing = byKind.get(kind) || {
      kind,
      strapiApi,
      idMapKey: kind === 'page' ? 'page' : kind,
      import: true,
    };
    existing.strapiApi = strapiApi;
    existing.schemaName = ct.name;
    existing.apiId = ct.apiId;
    byKind.set(kind, existing);
  }

  config.strapi.contentTypes = [...byKind.values()];
  config.analysisSyncedAt = new Date().toISOString();
  await writeJson(siteConfigPath(migrationDir), config);
  return config;
}

function pluralizeApi(apiId) {
  if (apiId.endsWith('s')) return apiId;
  if (apiId === 'category') return 'categories';
  return `${apiId}s`;
}

const RUNNER_HEADER = `#!/usr/bin/env node
/**
 * PROJECT-SPECIFIC runner — thin wrapper only.
 * Shared engine: scripts/wp-migration/lib/*
 * Site data + artifacts: output/<site>/wp-migration/*
 */
`;

const FULL_RUNNER_TEMPLATE = `${RUNNER_HEADER}
/**
 * Full migration (default): extract → normalize → upsert → verify
 *
 *   node run-full-migration.mjs
 *   node run-full-migration.mjs --extract-only
 *   node run-full-migration.mjs --verify
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runFullDataMigration } from '{{ENGINE_FULL}}';

const migrationDir = path.dirname(fileURLToPath(import.meta.url));
const result = await runFullDataMigration({ migrationDir, argv: process.argv });
if (result.passed === false) process.exit(1);
`;

const RETRY_RUNNER_TEMPLATE = `${RUNNER_HEADER}
/**
 * Retry failed records from full/sync/failed-imports.json
 *
 *   node run-retry-failed.mjs
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runRetryFailedImport } from '{{ENGINE_RETRY}}';

const migrationDir = path.dirname(fileURLToPath(import.meta.url));
const result = await runRetryFailedImport({ migrationDir });
if (result.passed === false) process.exit(1);
`;

export async function generateFullMigrationRunner(siteSlugOrDir) {
  const migrationDir = resolveMigrationDir(siteSlugOrDir);
  const config = await loadSiteConfig(migrationDir);
  const engineRoot = path.join(repoRoot(), 'scripts/wp-migration');
  const engineFull = path
    .relative(migrationDir, path.join(engineRoot, 'lib/run-full-migration.mjs'))
    .replace(/\\/g, '/');
  const engineRetry = path
    .relative(migrationDir, path.join(engineRoot, 'lib/retry-failed-import.mjs'))
    .replace(/\\/g, '/');

  const runnerPath = path.join(migrationDir, FULL_RUNNER_FILE);
  const retryPath = path.join(migrationDir, RETRY_RUNNER_FILE);

  await fs.writeFile(
    runnerPath,
    FULL_RUNNER_TEMPLATE.replace('{{ENGINE_FULL}}', engineFull),
    { encoding: 'utf8' }
  );
  await fs.writeFile(
    retryPath,
    RETRY_RUNNER_TEMPLATE.replace('{{ENGINE_RETRY}}', engineRetry),
    { encoding: 'utf8' }
  );
  try {
    await fs.chmod(runnerPath, 0o755);
    await fs.chmod(retryPath, 0o755);
  } catch {}

  config.fullMigrationRunner = FULL_RUNNER_FILE;
  config.retryFailedRunner = RETRY_RUNNER_FILE;
  config.runnerGeneratedAt = new Date().toISOString();
  await writeJson(siteConfigPath(migrationDir), config);

  return { runnerPath, retryPath, config };
}

export function emptyIdMapFromConfig(config) {
  const map = { category: {}, tag: {}, author: {}, media: {} };
  for (const ct of config.strapi?.contentTypes || DEFAULT_STRAPI.contentTypes) {
    if (ct.import !== false) map[ct.idMapKey] = {};
  }
  return map;
}
