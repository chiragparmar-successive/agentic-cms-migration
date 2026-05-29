#!/usr/bin/env node
/**
 * Shared engine: capture legacy vs new frontend screenshots + text; write parity report.
 * Project artifacts: output/<site>/test/reports/visual-parity/*
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');

function slugifyRoute(route) {
  if (route === '/' || route === '') return 'home';
  return route.replace(/^\//, '').replace(/\//g, '_') || 'home';
}

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function wordSet(text) {
  return new Set(normalizeText(text).split(' ').filter((w) => w.length > 2));
}

/** Jaccard similarity on words */
function textSimilarity(a, b) {
  const A = wordSet(a);
  const B = wordSet(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) {
    if (B.has(w)) inter += 1;
  }
  return inter / (A.size + B.size - inter);
}

async function readJsonSafe(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function resolveRoutes(siteDir) {
  const indexFile = path.join(siteDir, 'test/exploratory/baseline/index.json');
  const index = await readJsonSafe(indexFile);
  if (index?.pages?.length) {
    const routes = index.pages
      .map((p) => p.path || p.url?.replace(/^https?:\/\/[^/]+/, '') || '/')
      .filter(Boolean);
    const unique = [...new Set(routes)];
    return unique.slice(0, 12);
  }
  return ['/', '/blog', '/about'].filter(Boolean);
}

async function capturePage(browser, url, outDir, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(500);
    const screenshotPath = path.join(outDir, `${label}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const bodyText = await page.locator('body').innerText();
    const h1 = await page.locator('h1').first().innerText().catch(() => '');
    return { screenshotPath, bodyText, h1 };
  } finally {
    await page.close();
  }
}

/**
 * @param {string} siteSlug
 */
export async function runVisualParityCheck(siteSlug) {
  const siteDir = path.join(repoRoot, 'output', siteSlug);
  const configFile = path.join(siteDir, 'wp-migration/site-config.json');
  const config = await readJsonSafe(configFile);
  if (!config?.wordpressUrl) {
    throw new Error(`Missing ${configFile} or wordpressUrl`);
  }

  const legacyBase = config.wordpressUrl.replace(/\/$/, '');
  const newBase = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const routes = await resolveRoutes(siteDir);
  const reportDir = path.join(siteDir, 'test/reports/visual-parity');
  const outJson = path.join(siteDir, 'test/reports/visual-parity.json');
  const outMd = path.join(siteDir, 'docs/VISUAL-PARITY-REPORT.md');

  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(path.dirname(outMd), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];
  let passed = true;

  console.log('[visual-parity] legacy:', legacyBase);
  console.log('[visual-parity] new:    ', newBase);

  for (const route of routes) {
    const slug = slugifyRoute(route);
    const routeDir = path.join(reportDir, slug);
    await fs.mkdir(routeDir, { recursive: true });

    const legacyUrl = `${legacyBase}${route.startsWith('/') ? route : `/${route}`}`;
    const newUrl = `${newBase}${route.startsWith('/') ? route : `/${route}`}`;

    console.log(`[visual-parity] 📸 ${route}`);

    let legacyCap;
    let newCap;
    try {
      legacyCap = await capturePage(browser, legacyUrl, routeDir, 'legacy');
    } catch (err) {
      legacyCap = { error: err.message };
    }
    try {
      newCap = await capturePage(browser, newUrl, routeDir, 'new');
    } catch (err) {
      newCap = { error: err.message };
    }

    const baselineTextFile = path.join(
      siteDir,
      'test/exploratory/baseline',
      slug,
      'text.txt'
    );
    let baselineText = '';
    try {
      baselineText = await fs.readFile(baselineTextFile, 'utf8');
    } catch {
      baselineText = legacyCap.bodyText || '';
    }

    const similarity = legacyCap.bodyText && newCap.bodyText
      ? textSimilarity(legacyCap.bodyText, newCap.bodyText)
      : 0;
    const baselineSim = newCap.bodyText
      ? textSimilarity(baselineText, newCap.bodyText)
      : 0;

    const contentMatch =
      !legacyCap.error &&
      !newCap.error &&
      similarity >= 0.45 &&
      baselineSim >= 0.4;
    const layoutMatch = contentMatch && similarity >= 0.55;
    const cmsWired =
      !newCap.error &&
      normalizeText(newCap.bodyText).length > 80 &&
      !/lorem ipsum|placeholder|coming soon/i.test(newCap.bodyText);

    const routePass = contentMatch && layoutMatch && cmsWired;
    if (!routePass) passed = false;

    const status = routePass ? '✅ pass' : '❌ fail';
    console.log(
      `[visual-parity] ${status} ${route} — sim ${(similarity * 100).toFixed(0)}% baseline ${(baselineSim * 100).toFixed(0)}%`
    );

    results.push({
      route,
      legacyUrl,
      newUrl,
      legacyScreenshot: legacyCap.screenshotPath || null,
      newScreenshot: newCap.screenshotPath || null,
      textSimilarity: similarity,
      baselineTextSimilarity: baselineSim,
      legacyH1: legacyCap.h1 || '',
      newH1: newCap.h1 || '',
      cmsWired,
      layoutMatch: layoutMatch ? 'pass' : 'partial',
      contentMatch: contentMatch ? 'pass' : 'fail',
      passed: routePass,
      errors: {
        legacy: legacyCap.error || null,
        new: newCap.error || null,
      },
    });
  }

  await browser.close();

  const report = {
    checkedAt: new Date().toISOString(),
    siteSlug,
    legacyBase,
    newBase,
    passed,
    routes: results,
    remediationSkill:
      '.claude/skills/PE-quality/frontend-visual-parity/SKILL.md',
  };

  await fs.writeFile(outJson, JSON.stringify(report, null, 2));

  const mdRows = results
    .map(
      (r) =>
        `| ${r.route} | ${r.legacyUrl} | ${r.newUrl} | ${r.cmsWired ? 'yes' : 'no'} | ${r.layoutMatch} | ${r.contentMatch} | ${r.passed ? 'pass' : '**FAIL**'} | ${(r.textSimilarity * 100).toFixed(0)}% |`
    )
    .join('\n');

  const md = `# Visual Parity Report

Generated: ${report.checkedAt}

**Gate:** ${passed ? '✅ PASSED' : '❌ FAILED'} — P0 routes must pass before Phase E sign-off.

| Route | Legacy URL | New URL | CMS wired | Layout | Content | Status | Text sim |
|-------|------------|---------|-----------|--------|---------|--------|----------|
${mdRows}

## Screenshots

${results
  .map(
    (r) =>
      `### ${r.route}\n- Legacy: \`${r.legacyScreenshot || 'n/a'}\`\n- New: \`${r.newScreenshot || 'n/a'}\`\n`
  )
  .join('\n')}

## If failed

1. Open legacy + new screenshots side by side.
2. Follow \`.claude/skills/PE-quality/frontend-visual-parity/SKILL.md\` remediation loop.
3. Re-run: \`node scripts/quality/visual-parity-check.mjs ${siteSlug}\`
`;

  await fs.writeFile(outMd, md);

  return { passed, report, paths: { reportDir, outJson, outMd } };
}

const siteSlug = process.argv[2];
if (!siteSlug) {
  console.error('Usage: node scripts/quality/visual-parity-check.mjs <site-slug>');
  process.exit(1);
}

const { passed, paths } = await runVisualParityCheck(siteSlug);
console.log(`[visual-parity] report: ${paths.outMd}`);
if (!passed) process.exit(1);
