#!/usr/bin/env node
import { extractWordPress } from './lib/extract.mjs';
import { normalizeWordPress } from './lib/normalize.mjs';
import { detectStructure } from './lib/detect.mjs';
import { generateReviewMapping } from './lib/review.mjs';
import { slugFromUrl } from './lib/utils.mjs';
import { profileFromArgv } from './lib/sample-limits.mjs';
import { initSiteConfig, loadSiteConfig } from './lib/site-config.mjs';
import { runHook } from './lib/hooks.mjs';

const VALID_STEPS = new Set(['extract', 'normalize', 'detect', 'review', 'all']);
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));
const [siteSlugArg, wpUrl, stepArg] = positional;
const step = stepArg && VALID_STEPS.has(stepArg) ? stepArg : 'all';
const profileId = profileFromArgv();

if (!wpUrl) {
  console.error('Usage: node scripts/wp-migration/pipeline.mjs <site-slug> <wordpress-url> [extract|normalize|detect|review|all]');
  process.exit(1);
}

const siteSlug = siteSlugArg || slugFromUrl(wpUrl);

async function main() {
  await initSiteConfig({ siteSlug, wordpressUrl: wpUrl });
  const config = await loadSiteConfig(siteSlug);
  console.log(`[pipeline] profile: ${profileId}`);

  const steps = step === 'all' ? ['extract', 'normalize', 'detect', 'review'] : [step];

  for (const s of steps) {
    if (s === 'extract') {
      await runHook(config, 'preExtract', { step: 'extract', profileId });
      const result = await extractWordPress(config, { profile: profileId });
      await runHook(config, 'postExtract', { step: 'extract', profileId, result });
      console.log('[extract] OK', result.paths.rawFile, result.counts);
    } else if (s === 'normalize') {
      await runHook(config, 'preNormalize', { step: 'normalize', profileId });
      const result = await normalizeWordPress(config, { profile: profileId });
      await runHook(config, 'postNormalize', { step: 'normalize', profileId, result });
      console.log('[normalize] OK', result.paths.normalizedFile, `items=${result.itemCount}`);
    } else if (s === 'detect') {
      const result = await detectStructure(config, { profile: profileId });
      console.log('[detect] OK', result.analysisPath, `unknown=${result.unknownCount}`);
    } else if (s === 'review') {
      const result = await generateReviewMapping(config, { profile: profileId });
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
