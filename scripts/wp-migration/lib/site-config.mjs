import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson, wpMigrationDir, repoRoot } from './utils.mjs';
import {
  buildDefaultSiteConfig,
  DEFAULT_STRAPI,
  ENGINE_VERSION,
} from './defaults.mjs';

export const SITE_CONFIG_FILE = 'site-config.json';
export const FULL_RUNNER_FILE = 'run-full-migration.mjs';

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
    throw new Error(
      `Missing ${file}. Run wordpress-to-strapi.mjs for this site first.`
    );
  }
}

export async function initSiteConfig({ siteSlug, wordpressUrl }) {
  const migrationDir = wpMigrationDir(siteSlug);
  await fs.mkdir(migrationDir, { recursive: true });
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

  await writeJson(file, config);
  return config;
}

/** Merge Strapi content types from structure-analysis.json */
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

  const byKind = new Map(
    (config.strapi.contentTypes || []).map((ct) => [ct.kind, ct])
  );

  for (const ct of analysis.collectionTypes || []) {
    const kind =
      ct.apiId === 'page' || ct.kind === 'singleType' && ct.apiId === 'page'
        ? 'page'
        : ct.apiId.replace(/-/g, '_');
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

const RUNNER_TEMPLATE = `#!/usr/bin/env node
/**
 * AUTO-GENERATED — full WordPress → Strapi data migration for this site.
 * Does not recreate content models or schemas.
 *
 * Usage (from this directory):
 *   node run-full-migration.mjs
 *   STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<token> node run-full-migration.mjs --import
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runFullDataMigration } from '{{ENGINE_IMPORT}}';

const migrationDir = path.dirname(fileURLToPath(import.meta.url));

await runFullDataMigration({ migrationDir, argv: process.argv });
`;

/** Write runnable migration script into output/<site>/wp-migration/ */
export async function generateFullMigrationRunner(siteSlugOrDir) {
  const migrationDir = resolveMigrationDir(siteSlugOrDir);
  const config = await loadSiteConfig(migrationDir);
  const engineRoot = path.join(repoRoot(), 'scripts/wp-migration');
  const engineImport = path
    .relative(migrationDir, path.join(engineRoot, 'lib/run-full-migration.mjs'))
    .replace(/\\\\/g, '/');

  const runnerPath = path.join(migrationDir, FULL_RUNNER_FILE);
  const content = RUNNER_TEMPLATE.replace('{{ENGINE_IMPORT}}', engineImport);
  await fs.writeFile(runnerPath, content, { utf8 });
  try {
    await fs.chmod(runnerPath, 0o755);
  } catch {
    /* windows */
  }

  config.fullMigrationRunner = FULL_RUNNER_FILE;
  config.runnerGeneratedAt = new Date().toISOString();
  await writeJson(siteConfigPath(migrationDir), config);

  return { runnerPath, config };
}

export function emptyIdMapFromConfig(config) {
  const map = {
    category: {},
    tag: {},
    author: {},
    media: {},
  };
  for (const ct of config.strapi?.contentTypes || DEFAULT_STRAPI.contentTypes) {
    if (ct.import !== false) map[ct.idMapKey] = {};
  }
  return map;
}

export function getContentTypeMapping(config, kind) {
  return (config.strapi?.contentTypes || []).find((ct) => ct.kind === kind);
}
