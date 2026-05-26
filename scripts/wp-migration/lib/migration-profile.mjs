import path from 'node:path';
import { wpMigrationDir } from './utils.mjs';

/**
 * Two isolated migration profiles — no shared sync state between them.
 *
 * preview: /wordpress-to-strapi E2E partial (content model + capped data)
 * full:    /wp-to-strapi-dn-migration data-only (no content modeling)
 */
export const PROFILES = {
  preview: {
    id: 'preview',
    label: 'preview',
    sample: true,
    /** Structure analysis + schemas come from preview only */
    ownsContentModel: true,
  },
  full: {
    id: 'full',
    label: 'full',
    sample: false,
    ownsContentModel: false,
  },
};

export function resolveProfile(profileId) {
  const profile = PROFILES[profileId];
  if (!profile) {
    throw new Error(`Unknown migration profile "${profileId}". Use "preview" or "full".`);
  }
  return profile;
}

/** Absolute paths for a profile under output/<site>/wp-migration/ */
export function profilePaths(siteSlug, profileId) {
  const profile = resolveProfile(profileId);
  const root = wpMigrationDir(siteSlug);
  const base = path.join(root, profile.id);

  return {
    profile,
    root,
    base,
    rawDir: path.join(base, 'raw'),
    rawFile: path.join(base, 'raw/wp-export.json'),
    normalizedDir: path.join(base, 'normalized'),
    normalizedFile: path.join(base, 'normalized/content.json'),
    syncDir: path.join(base, 'sync'),
    idMapFile: path.join(base, 'sync/id-map.json'),
    logFile: path.join(base, 'sync/import-log.json'),
    /** Shared artifacts (preview-only writers) */
    analysisDir: path.join(root, 'analysis'),
    structureAnalysisFile: path.join(root, 'analysis/structure-analysis.json'),
    unknownBlocksFile: path.join(root, 'analysis/unknown-blocks.json'),
    reviewDir: path.join(root, 'review'),
  };
}
