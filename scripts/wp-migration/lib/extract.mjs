import { fetchJson, fetchAllPages, writeJson, ensureDir } from './utils.mjs';
import { profilePaths, resolveProfile } from './migration-profile.mjs';
import { DEFAULT_SAMPLE_LIMITS } from './defaults.mjs';
import { loadSiteConfig } from './site-config.mjs';

/**
 * @param {object} config — site-config (or site slug string for legacy CLI)
 * @param {{ profile?: string; sample?: boolean }} [options]
 */
export async function extractWordPress(config, options = {}) {
  if (typeof config === 'string') {
    config = await loadSiteConfig(config);
    if (typeof options === 'string') {
      options = { profile: 'preview' };
      config.wordpressUrl = arguments[1] || config.wordpressUrl;
    }
  }

  const profileId = options.profile ?? 'preview';
  const profile = resolveProfile(profileId, config);
  const sample = options.sample ?? profile.sample;
  const limits = config.sampleLimits ?? DEFAULT_SAMPLE_LIMITS;
  const paths = profilePaths(config, profileId);
  const coreResources = config.wordpress?.coreResources ?? [
    'posts',
    'pages',
    'categories',
    'tags',
    'media',
    'users',
  ];

  const base = config.wordpressUrl.replace(/\/$/, '');
  await ensureDir(paths.rawDir);

  await fetchJson(`${base}/wp-json/wp/v2/`);

  const types = await fetchJson(`${base}/wp-json/wp/v2/types`);
  const customTypes = Object.entries(types)
    .filter(([, meta]) => meta.rest_base && !coreResources.includes(meta.rest_base))
    .map(([, meta]) => meta.rest_base);

  const data = {
    meta: {
      sourceUrl: base,
      extractedAt: new Date().toISOString(),
      engine: 'wp-migration/scripts',
      profile: profileId,
      siteSlug: config.siteSlug,
      sampleLimits: sample ? limits : null,
    },
    types: {},
    taxonomies: {},
    menus: null,
    acf: null,
  };

  for (const resource of coreResources) {
    try {
      const maxItems = sample ? limits[resource] ?? limits.customType : null;
      data.types[resource] = await fetchAllPages(base, resource, { maxItems });
    } catch (err) {
      data.types[resource] = { error: String(err.message) };
    }
  }

  for (const restBase of customTypes) {
    try {
      const maxItems = sample ? limits.customType : null;
      data.types[restBase] = await fetchAllPages(base, restBase, { maxItems });
    } catch (err) {
      data.types[restBase] = { error: String(err.message) };
    }
  }

  try {
    data.acf = await fetchJson(`${base}/wp-json/acf/v3/`);
  } catch {
    data.acf = null;
  }

  await writeJson(paths.rawFile, data);
  return { paths, config, counts: summarizeCounts(data) };
}

function summarizeCounts(data) {
  const counts = {};
  for (const [key, value] of Object.entries(data.types)) {
    counts[key] = Array.isArray(value) ? value.length : 0;
  }
  return counts;
}
