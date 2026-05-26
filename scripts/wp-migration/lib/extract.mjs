import path from 'node:path';
import { fetchJson, fetchAllPages, writeJson, wpMigrationDir, ensureDir } from './utils.mjs';

const CORE_RESOURCES = ['posts', 'pages', 'categories', 'tags', 'media', 'users'];

export async function extractWordPress(siteSlug, wpUrl) {
  const base = wpUrl.replace(/\/$/, '');
  const outDir = wpMigrationDir(siteSlug);
  await ensureDir(path.join(outDir, 'raw'));

  await fetchJson(`${base}/wp-json/wp/v2/`);

  const types = await fetchJson(`${base}/wp-json/wp/v2/types`);
  const customTypes = Object.entries(types)
    .filter(([key, meta]) => meta.rest_base && !CORE_RESOURCES.includes(meta.rest_base))
    .map(([, meta]) => meta.rest_base);

  const data = {
    meta: {
      sourceUrl: base,
      extractedAt: new Date().toISOString(),
      engine: 'wp-migration/scripts',
    },
    types: {},
    taxonomies: {},
    menus: null,
    acf: null,
  };

  for (const resource of CORE_RESOURCES) {
    try {
      data.types[resource] = await fetchAllPages(base, resource);
    } catch (err) {
      data.types[resource] = { error: String(err.message) };
    }
  }

  for (const restBase of customTypes) {
    try {
      data.types[restBase] = await fetchAllPages(base, restBase);
    } catch (err) {
      data.types[restBase] = { error: String(err.message) };
    }
  }

  try {
    data.acf = await fetchJson(`${base}/wp-json/acf/v3/`);
  } catch {
    data.acf = null;
  }

  const rawPath = path.join(outDir, 'raw/wp-export.json');
  await writeJson(rawPath, data);
  return { rawPath, counts: summarizeCounts(data) };
}

function summarizeCounts(data) {
  const counts = {};
  for (const [key, value] of Object.entries(data.types)) {
    counts[key] = Array.isArray(value) ? value.length : 0;
  }
  return counts;
}
