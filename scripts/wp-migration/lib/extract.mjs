import { fetchJson, fetchAllPages, writeJson, ensureDir } from './utils.mjs';
import { SAMPLE_LIMITS } from './sample-limits.mjs';
import { profilePaths, resolveProfile } from './migration-profile.mjs';

const CORE_RESOURCES = ['posts', 'pages', 'categories', 'tags', 'media', 'users'];

export async function extractWordPress(siteSlug, wpUrl, options = {}) {
  const profileId = options.profile ?? 'preview';
  const profile = resolveProfile(profileId);
  const sample = options.sample ?? profile.sample;
  const limits = options.limits ?? SAMPLE_LIMITS;
  const paths = profilePaths(siteSlug, profileId);

  const base = wpUrl.replace(/\/$/, '');
  await ensureDir(paths.rawDir);

  await fetchJson(`${base}/wp-json/wp/v2/`);

  const types = await fetchJson(`${base}/wp-json/wp/v2/types`);
  const customTypes = Object.entries(types)
    .filter(([, meta]) => meta.rest_base && !CORE_RESOURCES.includes(meta.rest_base))
    .map(([, meta]) => meta.rest_base);

  const data = {
    meta: {
      sourceUrl: base,
      extractedAt: new Date().toISOString(),
      engine: 'wp-migration/scripts',
      profile: profileId,
      sampleLimits: sample ? limits : null,
    },
    types: {},
    taxonomies: {},
    menus: null,
    acf: null,
  };

  for (const resource of CORE_RESOURCES) {
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
  return { paths, counts: summarizeCounts(data) };
}

function summarizeCounts(data) {
  const counts = {};
  for (const [key, value] of Object.entries(data.types)) {
    counts[key] = Array.isArray(value) ? value.length : 0;
  }
  return counts;
}
