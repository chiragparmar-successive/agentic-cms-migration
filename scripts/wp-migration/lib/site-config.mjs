import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson, wpMigrationDir } from './utils.mjs';
import { buildDefaultSiteConfig, DEFAULT_STRAPI } from './defaults.mjs';

export const SITE_CONFIG_FILE = 'site-config.json';

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

