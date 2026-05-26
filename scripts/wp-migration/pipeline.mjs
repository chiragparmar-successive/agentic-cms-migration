#!/usr/bin/env node
/**
 * WordPress data pipeline for one migration profile (preview or full).
 *
 * Preview (default): content modeling — extract + normalize + detect + review
 * Full: data pull only — extract + normalize (schemas come from preview)
 *
 * Usage:
 *   node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> [step] [--preview|--full]
 */
import { extractWordPress } from './lib/extract.mjs';
import { normalizeWordPress } from './lib/normalize.mjs';
import { detectStructure } from './lib/detect.mjs';
import { generateReviewMapping } from './lib/review.mjs';
import { slugFromUrl } from './lib/utils.mjs';
import { profileFromArgv } from './lib/sample-limits.mjs';
import { resolveProfile } from './lib/migration-profile.mjs';

const VALID_STEPS = new Set(['extract', 'normalize', 'detect', 'review', 'all']);
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));
const [siteSlugArg, wpUrl, stepArg] = positional;
const step = stepArg && VALID_STEPS.has(stepArg) ? stepArg : 'all';
const profileId = profileFromArgv();

if (!wpUrl) {
  console.error(
    'Usage: node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> [extract|normalize|detect|review|all] [--preview|--full]'
  );
  process.exit(1);
}

const siteSlug = siteSlugArg || slugFromUrl(wpUrl);
const profile = resolveProfile(profileId);

async function main() {
  console.log(`[pipeline] profile: ${profileId}`);

  const defaultSteps =
    profileId === 'full' ? ['extract', 'normalize'] : ['extract', 'normalize', 'detect', 'review'];
  const steps = step === 'all' ? defaultSteps : [step];

  for (const s of steps) {
    if (s === 'extract') {
      const result = await extractWordPress(siteSlug, wpUrl, { profile: profileId });
      console.log('[extract] OK', result.paths.rawFile, result.counts);
    } else if (s === 'normalize') {
      const result = await normalizeWordPress(siteSlug, { profile: profileId });
      console.log('[normalize] OK', result.paths.normalizedFile, `items=${result.itemCount}`);
    } else if (s === 'detect') {
      if (profileId === 'full') {
        console.warn('[detect] skipped for full profile — use preview analysis for schemas');
        continue;
      }
      const result = await detectStructure(siteSlug, { profile: profileId });
      console.log('[detect] OK', result.analysisPath, `unknown=${result.unknownCount}`);
    } else if (s === 'review') {
      if (profileId === 'full') {
        console.warn('[review] skipped for full profile');
        continue;
      }
      const result = await generateReviewMapping(siteSlug, { profile: profileId });
      console.log('[review] OK', result.mappingPath, result.markdownPath);
    } else {
      console.error(`Unknown step: ${s}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[pipeline] FAILED', err.message);
  process.exit(1);
});
