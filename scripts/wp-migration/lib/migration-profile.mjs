import path from 'node:path';
import { wpMigrationDir } from './utils.mjs';
import { resolveMigrationDir } from './site-config.mjs';

export const PROFILES = {
  preview: {
    id: 'preview',
    label: 'preview',
    sample: true,
    ownsContentModel: true,
  },
  full: {
    id: 'full',
    label: 'full',
    sample: false,
    ownsContentModel: false,
  },
};

export function resolveProfile(profileId, config) {
  const fromConfig = config?.profiles?.[profileId];
  const fallback = PROFILES[profileId];
  if (!fallback && !fromConfig) {
    throw new Error(`Unknown migration profile "${profileId}". Use "preview" or "full".`);
  }
  return { ...fallback, ...fromConfig, id: profileId };
}

function migrationRoot(siteSlugOrConfig) {
  if (typeof siteSlugOrConfig === 'object' && siteSlugOrConfig.migrationDir) {
    return siteSlugOrConfig.migrationDir;
  }
  if (typeof siteSlugOrConfig === 'string' && siteSlugOrConfig.includes('/')) {
    return resolveMigrationDir(siteSlugOrConfig);
  }
  return wpMigrationDir(
    typeof siteSlugOrConfig === 'string' ? siteSlugOrConfig : siteSlugOrConfig.siteSlug
  );
}

/** Absolute paths for a profile under output/<site>/wp-migration/ */
export function profilePaths(siteSlugOrConfig, profileId) {
  const config =
    typeof siteSlugOrConfig === 'object' ? siteSlugOrConfig : null;
  const siteSlug =
    config?.siteSlug ?? (typeof siteSlugOrConfig === 'string' ? siteSlugOrConfig : null);
  const profile = resolveProfile(profileId, config);
  const root = migrationRoot(siteSlugOrConfig ?? siteSlug);
  const base = path.join(root, profile.id);

  return {
    profile,
    root,
    base,
    siteSlug: config?.siteSlug ?? siteSlug,
    rawDir: path.join(base, 'raw'),
    rawFile: path.join(base, 'raw/wp-export.json'),
    normalizedDir: path.join(base, 'normalized'),
    normalizedFile: path.join(base, 'normalized/content.json'),
    syncDir: path.join(base, 'sync'),
    idMapFile: path.join(base, 'sync/id-map.json'),
    logFile: path.join(base, 'sync/import-log.json'),
    analysisDir: path.join(root, 'analysis'),
    structureAnalysisFile: path.join(root, 'analysis/structure-analysis.json'),
    unknownBlocksFile: path.join(root, 'analysis/unknown-blocks.json'),
    reviewDir: path.join(root, 'review'),
  };
}
