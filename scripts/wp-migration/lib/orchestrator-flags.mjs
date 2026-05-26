/**
 * /wordpress-to-strapi orchestrator scope.
 *
 * Default (no flags): CMS partial E2E + Phase B tests + Phase D frontend + Phase E quality.
 * Opt out with --cms-only and/or --skip-tests.
 */

/** @typedef {'full-stack-partial' | 'cms-only'} OrchestratorMode */

/**
 * @param {string[]} argv
 * @returns {{
 *   cmsOnly: boolean;
 *   skipTests: boolean;
 *   runTests: boolean;
 *   runFrontend: boolean;
 *   runQualityGates: boolean;
 *   mode: OrchestratorMode;
 * }}
 */
export function parseOrchestratorFlags(argv = process.argv) {
  const cmsOnly = argv.includes('--cms-only');
  const skipTests = argv.includes('--skip-tests');

  return {
    cmsOnly,
    skipTests,
    runTests: !skipTests,
    runFrontend: !cmsOnly,
    runQualityGates: !cmsOnly,
    mode: cmsOnly ? 'cms-only' : 'full-stack-partial',
  };
}

/** @param {ReturnType<typeof parseOrchestratorFlags>} flags */
export function formatOrchestratorPlan(flags) {
  const lines = [
    `Mode: ${flags.mode}`,
    `Phase W (CMS partial E2E): yes`,
    `Phase B (Playwright tests): ${flags.runTests ? 'yes' : 'no (--skip-tests)'}`,
    `Phase D (Next.js frontend): ${flags.runFrontend ? 'yes' : 'no (--cms-only)'}`,
    `Phase E (quality gates): ${flags.runQualityGates ? 'yes' : 'no (--cms-only)'}`,
  ];
  return lines.join('\n');
}
