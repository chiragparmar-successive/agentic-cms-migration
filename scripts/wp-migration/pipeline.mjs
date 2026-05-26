#!/usr/bin/env node
/**
 * WordPress migration script pipeline.
 * Usage: node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> [extract|normalize|detect|all]
 */
import { extractWordPress } from './lib/extract.mjs';
import { normalizeWordPress } from './lib/normalize.mjs';
import { detectStructure } from './lib/detect.mjs';
import { generateReviewMapping } from './lib/review.mjs';
import { slugFromUrl } from './lib/utils.mjs';

const [, , siteSlugArg, wpUrl, step = 'all'] = process.argv;

if (!wpUrl) {
  console.error(
    'Usage: node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> [extract|normalize|detect|review|all]'
  );
  process.exit(1);
}

const siteSlug = siteSlugArg || slugFromUrl(wpUrl);

async function main() {
  const steps = step === 'all' ? ['extract', 'normalize', 'detect', 'review'] : [step];

  for (const s of steps) {
    if (s === 'extract') {
      const result = await extractWordPress(siteSlug, wpUrl);
      console.log('[extract] OK', result.rawPath, result.counts);
    } else if (s === 'normalize') {
      const result = await normalizeWordPress(siteSlug);
      console.log('[normalize] OK', result.outPath, `items=${result.itemCount}`);
    } else if (s === 'detect') {
      const result = await detectStructure(siteSlug);
      console.log('[detect] OK', result.analysisPath, `unknown=${result.unknownCount}`);
    } else if (s === 'review') {
      const result = await generateReviewMapping(siteSlug);
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
