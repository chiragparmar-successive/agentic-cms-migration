import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { XMLParser } from 'fast-xml-parser';

// ── Resolve site root from --site argument ────────────────────────────────────

const siteArg  = process.argv.indexOf('--site');
const siteSlug = siteArg !== -1 ? process.argv[siteArg + 1] : null;

if (!siteSlug) {
  console.error('[report] ERROR: --site <slug> is required.');
  console.error('[report] Usage: node scripts/generate-report.mjs --site <site-slug> [--title "Report Title"]');
  console.error('[report] Example: node scripts/generate-report.mjs --site ccfl-dev-payagovcp-com');
  process.exit(1);
}

const ROOT        = resolve(import.meta.dirname, '..', 'output', siteSlug, 'test');
const JUNIT_PATH  = join(ROOT, 'reports', 'junit.xml');
const REPORTS_DIR = join(ROOT, 'reports');

const titleArg    = process.argv.indexOf('--title');
const reportTitle = titleArg !== -1 ? process.argv[titleArg + 1] : 'Test Execution Report';
const timestamp   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT_HTML    = join(REPORTS_DIR, `client-report-${timestamp}.html`);
const OUT_PDF     = join(REPORTS_DIR, `client-report-${timestamp}.pdf`);

if (!existsSync(JUNIT_PATH)) {
  console.error(`[report] ERROR: ${JUNIT_PATH} not found. Run tests first.`);
  process.exit(1);
}

const xml    = readFileSync(JUNIT_PATH, 'utf-8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text' });
const parsed = parser.parse(xml);

const rootSuites = parsed.testsuites?.testsuite ?? parsed.testsuite ?? [];
const suites     = Array.isArray(rootSuites) ? rootSuites : [rootSuites];

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pageLabel(suiteName) {
  const area = (suiteName.match(/ui-([a-z]+)-\d+/i) ?? [])[1] ?? '';
  const labels = {
    auth: 'Authentication', contact: 'Contact Us', home: 'Home',
    nav: 'Navigation', navigation: 'Navigation', portal: 'Portal',
    dashboard: 'Dashboard', login: 'Login', register: 'Registration',
    search: 'Search', profile: 'Profile', settings: 'Settings',
    checkout: 'Checkout', cart: 'Cart', product: 'Product',
    faq: 'FAQ', about: 'About', hero: 'Hero', seo: 'SEO',
    exp: 'Experience', edu: 'Education', skills: 'Skills',
    proj: 'Projects', theme: 'Theme', reset: 'Password Reset',
    guestpay: 'Guest Pay', lang: 'Language',
  };
  return labels[area.toLowerCase()] ?? (area ? area.charAt(0).toUpperCase() + area.slice(1) : 'General');
}

function humanDescription(name) {
  const afterColon = name.split(':').slice(1).join(':').trim();
  if (afterColon) return afterColon.charAt(0).toUpperCase() + afterColon.slice(1);
  return name.replace(/^[\w-]+\s*›\s*[\w-]+:\s*/, '').trim() || name;
}

function fmtDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '—';
  const s = parseFloat(seconds);
  if (s < 1)  return `${Math.round(s * 1000)}ms`;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function extractText(el) {
  if (!el) return null;
  if (typeof el === 'string') return el.slice(0, 600);
  return (el['#text'] ?? el['@_message'] ?? '').slice(0, 600);
}

function humanizeError(raw) {
  if (!raw) return null;
  const t = raw;

  if (/toBeVisible\(\).*failed|element.*not found|waiting for.*selector/i.test(t))
    return 'An expected element was not visible on the page. The UI may not have loaded correctly or the element is hidden.';
  if (/toHaveText\(\)|toContainText\(\)/i.test(t))
    return 'The displayed text did not match what was expected. The page content may have changed.';
  if (/toHaveURL\(\)|expected.*url|navigate.*url/i.test(t))
    return 'The page did not navigate to the expected URL after the action was performed.';
  if (/toBeChecked\(\)/i.test(t))
    return 'A checkbox or radio button was not in the expected selected state.';
  if (/toBeEnabled\(\)|toBeDisabled\(\)/i.test(t))
    return 'A form element was not in the expected enabled or disabled state.';
  if (/toHaveCount\(\)/i.test(t))
    return 'The number of matching elements on the page did not match the expected count.';
  if (/toHaveValue\(\)/i.test(t))
    return 'A form field did not contain the expected value.';
  if (/Timeout.*exceeded|waiting.*timeout|locator\..*Timeout/i.test(t))
    return 'The test timed out waiting for an element or action to complete. The page may be slow or unresponsive.';
  if (/net::ERR_CONNECTION_REFUSED/i.test(t))
    return 'The application was unreachable — connection was refused. The server may be down.';
  if (/net::ERR_NAME_NOT_RESOLVED/i.test(t))
    return 'The application URL could not be resolved. Check that the environment is running.';
  if (/net::ERR_/i.test(t))
    return 'A network error occurred while the test was running. The application may be unavailable.';
  if (/page\.goto|failed to navigate/i.test(t))
    return 'The test failed to navigate to the target page. The URL may be incorrect or the page did not load.';
  if (/strict mode violation|resolved to \d+ element/i.test(t))
    return 'The selector matched multiple elements unexpectedly. The page may contain duplicate components.';
  if (/intercept.*request|route\./i.test(t))
    return 'A network request interception failed during the test.';
  if (/expect.*screenshot|toMatchSnapshot|toHaveScreenshot/i.test(t))
    return 'The page appearance did not match the saved baseline screenshot.';
  const firstLine = t.split('\n').map(l => l.trim()).find(l => l && !/^\s*at\s|Call log|Error:|^\s*>/.test(l));
  return firstLine ? `Test failed: ${firstLine.slice(0, 200)}` : 'The test encountered an unexpected failure.';
}

function sysOutText(tc) {
  const s = tc['system-out'];
  if (!s) return '';
  if (typeof s === 'string') return s;
  return s['#text'] ?? String(s);
}

function isFlaky(tc) {
  if (tc.failure || tc.error || tc.skipped) return false;
  return /-retry\d+/.test(sysOutText(tc));
}

function extractSteps(specPath) {
  try {
    const src = readFileSync(specPath, 'utf-8');
    const steps = [];
    const re = /await\s+test\.step\(\s*['"`](.+?)['"`]/g;
    let m;
    while ((m = re.exec(src)) !== null) steps.push(m[1]);
    return steps;
  } catch {
    return [];
  }
}

function parseSysOut(raw, status) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  const attempts = [[]];
  let seenStart = false;

  for (const line of lines) {
    if (/^\[INFO\] Starting /i.test(line)) {
      if (seenStart) attempts.push([]);
      seenStart = true;
    } else {
      const m = line.match(/\[\[ATTACHMENT\|(.+?)\]\]/);
      if (m && /test-failed[^/\\]*\.png$/i.test(m[1])) {
        attempts[attempts.length - 1].push(m[1]);
      }
    }
  }

  const pick = status === 'flaky' ? attempts[0] : attempts[attempts.length - 1];
  return { screenshotPath: pick[pick.length - 1] ?? null };
}

function screenshotDataUri(attachPath) {
  if (!attachPath) return null;
  try {
    const fullPath = resolve(REPORTS_DIR, attachPath);
    const data = readFileSync(fullPath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch {
    return null;
  }
}

// ── Parse test cases ──────────────────────────────────────────────────────────

let totalTests = 0, totalPassed = 0, totalFailed = 0, totalStopped = 0, totalSkipped = 0, totalFlaky = 0;
let totalDuration = 0;

const pageGroups = new Map();
const allIssues  = [];

for (const suite of suites) {
  const label    = pageLabel(suite['@_name'] ?? '');
  const rawCases = suite.testcase ?? [];
  const caseArr  = Array.isArray(rawCases) ? rawCases : [rawCases];

  const specPath  = join(ROOT, 'tests', (suite['@_name'] ?? '').replace(/\\/g, '/'));
  const specSteps = extractSteps(specPath);

  if (!pageGroups.has(label))
    pageGroups.set(label, { passed: 0, failed: 0, stopped: 0, skipped: 0, flaky: 0, duration: 0, cases: [] });
  const group = pageGroups.get(label);

  for (const tc of caseArr) {
    const dur     = parseFloat(tc['@_time'] ?? '0') || 0;
    const failEl  = tc.failure ?? null;
    const errorEl = tc.error   ?? null;
    const skipEl  = tc.skipped ?? null;

    let status, rawDetail, detail;
    if (skipEl)           { status = 'skipped'; rawDetail = extractText(skipEl);  }
    else if (errorEl)     { status = 'stopped'; rawDetail = extractText(errorEl); }
    else if (failEl)      { status = 'failed';  rawDetail = extractText(failEl);  }
    else if (isFlaky(tc)) { status = 'flaky';   rawDetail = null; }
    else                  { status = 'passed';  rawDetail = null; }
    detail = humanizeError(rawDetail);

    totalTests++;
    totalDuration += dur;
    group.duration += dur;
    group[status]++;

    if      (status === 'passed')  totalPassed++;
    else if (status === 'failed')  totalFailed++;
    else if (status === 'stopped') totalStopped++;
    else if (status === 'flaky')   totalFlaky++;
    else                           totalSkipped++;

    const { screenshotPath } = parseSysOut(sysOutText(tc), status);
    const caseObj = { label: humanDescription(tc['@_name'] ?? '(unnamed)'), status, duration: dur, detail, steps: specSteps, screenshotPath };
    group.cases.push(caseObj);
    if (status === 'failed' || status === 'stopped' || status === 'flaky')
      allIssues.push({ page: label, ...caseObj });
  }
}

const totalExecuted = totalPassed + totalFailed + totalStopped + totalFlaky;
const passRate      = totalExecuted > 0 ? Math.round(((totalPassed + totalFlaky) / totalExecuted) * 100) : 0;
const passColor     = passRate >= 90 ? '#16a34a' : passRate >= 70 ? '#d97706' : '#dc2626';
const runDate       = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });

const checks = [
  [xml.trim().length > 0, 'JUnit XML is non-empty'],
  [totalTests === totalPassed + totalFailed + totalStopped + totalFlaky + totalSkipped,
   'Total = passed + failed + stopped + flaky + skipped'],
];
let checksFailed = false;
for (const [ok, msg] of checks) {
  if (!ok) { console.error(`[report] QUALITY CHECK FAILED: ${msg}`); checksFailed = true; }
}
if (checksFailed) process.exit(1);

// ── SVG Donut Chart ───────────────────────────────────────────────────────────

function buildDonutChart(segments, cx = 120, cy = 120, r = 85, sw = 30) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0)
    return `<svg width="${cx*2}" height="${cy*2}"><text x="${cx}" y="${cy}" text-anchor="middle" font-size="14" fill="#94a3b8">No data</text></svg>`;

  const C = 2 * Math.PI * r;
  let cum = 0;

  const paths = segments
    .filter(s => s.value > 0)
    .map(s => {
      const len    = (s.value / total) * C;
      const offset = C - cum;
      cum += len;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${s.color}" stroke-width="${sw}"
        stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}"
        stroke-dashoffset="${offset.toFixed(2)}"
        transform="rotate(-90 ${cx} ${cy})"
      />`;
    }).join('\n');

  const center = `
    <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="30" font-weight="800"
      fill="#0f172a" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${total}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="#94a3b8"
      font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" letter-spacing="1.5">TOTAL TESTS</text>
  `;

  return `<svg width="${cx*2}" height="${cy*2}" viewBox="0 0 ${cx*2} ${cy*2}">${paths}${center}</svg>`;
}

const STATUS_COLORS = {
  passed:  '#16a34a',
  failed:  '#dc2626',
  flaky:   '#f59e0b',
  stopped: '#7c3aed',
  skipped: '#94a3b8',
};

const donutSvg = buildDonutChart([
  { label: 'Passed',  value: totalPassed,  color: STATUS_COLORS.passed  },
  { label: 'Failed',  value: totalFailed,  color: STATUS_COLORS.failed  },
  { label: 'Flaky',   value: totalFlaky,   color: STATUS_COLORS.flaky   },
  { label: 'Stopped', value: totalStopped, color: STATUS_COLORS.stopped },
  { label: 'Skipped', value: totalSkipped, color: STATUS_COLORS.skipped },
]);

const legendHtml = [
  ['Passed',  totalPassed,  STATUS_COLORS.passed ],
  ['Failed',  totalFailed,  STATUS_COLORS.failed ],
  ['Flaky',   totalFlaky,   STATUS_COLORS.flaky  ],
  ['Stopped', totalStopped, STATUS_COLORS.stopped],
  ['Skipped', totalSkipped, STATUS_COLORS.skipped],
].map(([lbl, val, col]) => `
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <div style="width:13px;height:13px;border-radius:3px;background:${col};flex-shrink:0"></div>
    <span style="font-size:13px;color:#475569;flex:1">${lbl}</span>
    <span style="font-size:15px;font-weight:700;color:#0f172a;min-width:28px;text-align:right">${val}</span>
  </div>`).join('');

// ── Per-area horizontal stacked bars ──────────────────────────────────────────

function pageBarChart() {
  return [...pageGroups.entries()].map(([page, g]) => {
    const total    = g.passed + g.failed + g.stopped + g.skipped;
    const executed = g.passed + g.failed + g.stopped;
    const pct      = executed > 0 ? Math.round(g.passed / executed * 100) : 0;
    const pctColor = pct >= 90 ? STATUS_COLORS.passed : pct >= 70 ? '#d97706' : STATUS_COLORS.failed;
    const pw       = v => total > 0 ? (v / total * 100).toFixed(1) : '0';

    return `
    <div style="margin-bottom:18px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
        <span style="font-size:13px;font-weight:600;color:#1e293b">${escHtml(page)}</span>
        <span style="font-size:12px;color:#64748b">${total} test${total !== 1 ? 's' : ''} · ${fmtDuration(g.duration)} · <strong style="color:${pctColor}">${pct}%</strong></span>
      </div>
      <div style="height:14px;border-radius:7px;overflow:hidden;display:flex;background:#f1f5f9">
        ${g.passed  > 0 ? `<div style="width:${pw(g.passed)}%;background:${STATUS_COLORS.passed}"></div>` : ''}
        ${g.failed  > 0 ? `<div style="width:${pw(g.failed)}%;background:${STATUS_COLORS.failed}"></div>` : ''}
        ${g.flaky   > 0 ? `<div style="width:${pw(g.flaky)}%;background:${STATUS_COLORS.flaky}"></div>` : ''}
        ${g.stopped > 0 ? `<div style="width:${pw(g.stopped)}%;background:${STATUS_COLORS.stopped}"></div>` : ''}
        ${g.skipped > 0 ? `<div style="width:${pw(g.skipped)}%;background:${STATUS_COLORS.skipped}"></div>` : ''}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:4px">
        ${g.passed  > 0 ? `<span style="font-size:11px;color:${STATUS_COLORS.passed}">✓ ${g.passed} passed</span>` : ''}
        ${g.failed  > 0 ? `<span style="font-size:11px;color:${STATUS_COLORS.failed}">✗ ${g.failed} failed</span>` : ''}
        ${g.flaky   > 0 ? `<span style="font-size:11px;color:${STATUS_COLORS.flaky}">⚡ ${g.flaky} flaky</span>` : ''}
        ${g.stopped > 0 ? `<span style="font-size:11px;color:${STATUS_COLORS.stopped}">⊘ ${g.stopped} stopped</span>` : ''}
        ${g.skipped > 0 ? `<span style="font-size:11px;color:${STATUS_COLORS.skipped}">– ${g.skipped} skipped</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── Executive narrative ───────────────────────────────────────────────────────

function buildNarrative() {
  const health = passRate >= 90 ? 'healthy' : passRate >= 70 ? 'moderate' : 'critical';
  const healthLine = {
    healthy:  'The suite is in <strong>good health</strong> — the majority of flows are verified and passing.',
    moderate: 'The suite is in a <strong>moderate state</strong> — some flows require attention before production release.',
    critical: 'The suite is in a <strong>critical state</strong> — significant failures block confidence in production readiness.',
  }[health];

  const failedPages = [...pageGroups.entries()]
    .filter(([, g]) => g.failed + g.stopped > 0)
    .map(([p]) => p);

  const flakyPages = [...pageGroups.entries()]
    .filter(([, g]) => g.flaky > 0)
    .map(([p]) => p);

  const impactLine = failedPages.length > 0
    ? `The most impacted areas are: <strong>${failedPages.join(', ')}</strong>.`
    : 'No functional areas have outstanding failures.';

  const flakyNote = totalFlaky > 0
    ? ` <strong style="color:${STATUS_COLORS.flaky}">${totalFlaky} flaky test${totalFlaky !== 1 ? 's' : ''}</strong> passed only after a retry (affected: ${flakyPages.join(', ')}) — these indicate intermittent instability and should be investigated to prevent future failures.`
    : '';

  const stoppedNote = totalStopped > 0
    ? ` ${totalStopped} test${totalStopped !== 1 ? 's' : ''} stopped due to unexpected errors or timeouts and should be investigated separately.`
    : '';

  const skipNote = totalSkipped > 0
    ? ` ${totalSkipped} test${totalSkipped !== 1 ? 's were' : ' was'} skipped and may require enabling in a follow-up run.`
    : '';

  const topArea = [...pageGroups.entries()]
    .sort(([,a],[,b]) => (b.passed+b.failed+b.flaky+b.stopped) - (a.passed+a.failed+a.flaky+a.stopped))[0];
  const heaviestNote = topArea
    ? ` The largest functional area by executed tests is <strong>${topArea[0]}</strong> (${topArea[1].passed + topArea[1].failed + topArea[1].flaky + topArea[1].stopped} executed).`
    : '';

  return `
    <p style="font-size:14px;line-height:1.9;color:#334155;margin-bottom:14px">
      Out of <strong>${totalTests}</strong> test case${totalTests !== 1 ? 's' : ''} across
      <strong>${pageGroups.size}</strong> functional area${pageGroups.size !== 1 ? 's' : ''},
      <strong style="color:${STATUS_COLORS.passed}">${totalPassed} passed cleanly</strong>,
      <strong style="color:${STATUS_COLORS.flaky}">${totalFlaky} passed with flakiness</strong>,
      <strong style="color:${STATUS_COLORS.failed}">${totalFailed} failed</strong>,
      <strong style="color:${STATUS_COLORS.stopped}">${totalStopped} stopped</strong>, and
      <strong style="color:${STATUS_COLORS.skipped}">${totalSkipped} skipped</strong>.
      The overall pass rate is <strong style="color:${passColor}">${passRate}%</strong>
      (flaky tests count as passed; calculated over executed tests only).
      Total execution time was <strong>${fmtDuration(totalDuration)}</strong>.${heaviestNote}
    </p>
    <p style="font-size:14px;line-height:1.9;color:#334155;margin-bottom:14px">
      ${healthLine}${flakyNote}${stoppedNote}${skipNote}
    </p>
    <p style="font-size:14px;line-height:1.9;color:#334155">
      ${impactLine}
    </p>`;
}

// ── Status badge ─────────────────────────────────────────────────────────────

const statusBadge = s => {
  const map = {
    passed:  ['#dcfce7', '#16a34a', 'Passed' ],
    failed:  ['#fee2e2', '#dc2626', 'Failed' ],
    flaky:   ['#fef3c7', '#b45309', '⚡ Flaky'],
    stopped: ['#ede9fe', '#7c3aed', 'Stopped'],
    skipped: ['#f1f5f9', '#64748b', 'Skipped'],
  };
  const [bg, fg, lbl] = map[s] ?? map.skipped;
  return `<span style="background:${bg};color:${fg};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap">${lbl}</span>`;
};

// ── Detailed test-case tables ─────────────────────────────────────────────────

const pageGroupsHtml = [...pageGroups.entries()].map(([page, group]) => {
  const total    = group.passed + group.failed + group.stopped + group.skipped;
  const executed = group.passed + group.failed + group.stopped;
  const pct      = executed > 0 ? Math.round(group.passed / executed * 100) : 0;
  const headerColor = group.failed + group.stopped > 0 ? STATUS_COLORS.failed : STATUS_COLORS.passed;

  const rows = group.cases.map((c, i) => {
    const stepsRow = c.steps && c.steps.length > 0
      ? `<tr style="page-break-inside:avoid">
           <td colspan="4" style="padding:2px 16px 8px 52px">
             <ol style="margin:0;padding-left:18px;column-count:2;column-gap:24px">
               ${c.steps.map(s => `<li style="font-size:11px;color:#94a3b8;line-height:1.8;break-inside:avoid">${escHtml(s)}</li>`).join('')}
             </ol>
           </td>
         </tr>`
      : '';

    const reasonRow = (c.status === 'failed' || c.status === 'stopped' || c.status === 'flaky') && c.detail
      ? `<tr style="page-break-inside:avoid">
           <td colspan="4" style="padding:0 16px 10px 52px">
             <div style="font-size:12px;color:#64748b;line-height:1.6;font-style:italic;
               background:#fafafa;border-left:3px solid ${c.status === 'flaky' ? STATUS_COLORS.flaky : STATUS_COLORS.failed};
               padding:6px 10px;border-radius:0 4px 4px 0">
               ${escHtml(c.detail)}
             </div>
           </td>
         </tr>`
      : '';

    return `
      <tr style="border-bottom:${c.steps?.length ? 'none' : '1px solid #f1f5f9'};page-break-inside:avoid">
        <td style="padding:10px 16px;color:#94a3b8;font-size:12px;width:36px;vertical-align:top">${i + 1}</td>
        <td style="padding:10px 16px;font-size:13px;color:#1e293b;vertical-align:top">${escHtml(c.label)}</td>
        <td style="padding:10px 16px;font-size:12px;color:#64748b;text-align:center;width:80px;vertical-align:top">${fmtDuration(c.duration)}</td>
        <td style="padding:10px 16px;text-align:right;width:90px;vertical-align:top">${statusBadge(c.status)}</td>
      </tr>${stepsRow}${reasonRow}
      <tr><td colspan="4" style="padding:0;border-bottom:1px solid #f1f5f9"></td></tr>`;
  }).join('');

  return `
  <div style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;page-break-inside:avoid">
    <div style="background:#f8fafc;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0">
      <div style="font-size:15px;font-weight:700;color:#0f172a">${escHtml(page)}</div>
      <div style="display:flex;gap:16px;align-items:center">
        <span style="font-size:12px;color:#64748b">${total} test${total !== 1 ? 's' : ''}</span>
        <span style="font-size:12px;color:#64748b">${fmtDuration(group.duration)}</span>
        <span style="font-size:13px;font-weight:700;color:${headerColor}">${pct}% passed</span>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
          <th style="padding:8px 16px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;width:36px">#</th>
          <th style="padding:8px 16px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600">Test Case</th>
          <th style="padding:8px 16px;text-align:center;font-size:11px;color:#94a3b8;font-weight:600;width:80px">Duration</th>
          <th style="padding:8px 16px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;width:90px">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}).join('');

// ── Failure / stopped summary page ───────────────────────────────────────────

const failuresSectionHtml = allIssues.length > 0 ? `
<div class="page-break"></div>
<section>
  <h2>Issue Summary (${allIssues.length} ${allIssues.length === 1 ? 'issue' : 'issues'})</h2>
  <p style="font-size:13px;color:#64748b;margin-bottom:20px">
    All failed, stopped, and flaky tests are listed below.
    <strong style="color:${STATUS_COLORS.failed}">Failed</strong> = assertion failed on all attempts. &nbsp;
    <strong style="color:${STATUS_COLORS.flaky}">Flaky</strong> = passed on retry — intermittent instability. &nbsp;
    <strong style="color:${STATUS_COLORS.stopped}">Stopped</strong> = runtime error or timeout.
  </p>
  ${allIssues.map((f, i) => {
    const accentBg  = f.status === 'stopped' ? '#f5f3ff' : f.status === 'flaky' ? '#fffbeb' : '#fff5f5';
    const accentBdr = f.status === 'stopped' ? '#ddd6fe' : f.status === 'flaky' ? '#fde68a' : '#fecaca';
    const imgUri    = screenshotDataUri(f.screenshotPath);

    return `
    <div style="margin-bottom:24px;border:1px solid ${accentBdr};border-radius:10px;overflow:hidden;page-break-inside:avoid">

      <!-- Header -->
      <div style="background:${accentBg};padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${accentBdr}">
        <div style="flex:1;min-width:0">
          <span style="font-size:11px;color:#94a3b8;margin-right:8px">#${i + 1} · ${escHtml(f.page)}</span>
          <span style="font-size:13px;font-weight:600;color:#1e293b">${escHtml(f.label)}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;margin-left:12px">
          <span style="font-size:11px;color:#64748b">${fmtDuration(f.duration)}</span>
          ${statusBadge(f.status)}
        </div>
      </div>

      <!-- Steps verified -->
      ${f.steps && f.steps.length > 0 ? `
      <div style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid ${accentBdr}">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Steps Verified</div>
        <ol style="margin:0;padding-left:18px;column-count:2;column-gap:24px">
          ${f.steps.map(s => `<li style="font-size:12px;color:#475569;line-height:1.8;break-inside:avoid">${escHtml(s)}</li>`).join('')}
        </ol>
      </div>` : ''}

      <!-- Plain-English reason -->
      ${f.detail ? `
      <div style="padding:14px 16px;background:#fff;${imgUri ? `border-bottom:1px solid ${accentBdr}` : ''}">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">What went wrong</div>
        <p style="font-size:13px;color:#334155;line-height:1.7;margin:0">${escHtml(f.detail)}</p>
      </div>` : ''}

      <!-- Failure screenshot -->
      ${imgUri ? `
      <div style="padding:14px 16px;background:#fff">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">
          Failure Screenshot${f.status === 'flaky' ? ' (first attempt)' : ''}
        </div>
        <img src="${imgUri}"
          style="max-width:100%;max-height:400px;object-fit:contain;border-radius:6px;
            border:1px solid #e2e8f0;display:block;" />
      </div>` : ''}

    </div>`;
  }).join('')}
</section>` : '';

// ── Assemble HTML ─────────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escHtml(reportTitle)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; }
  .page-break { page-break-after: always; }
  h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
  section { padding: 36px 48px; }
</style>
</head>
<body>

<!-- ═══ COVER ════════════════════════════════════════════════════════════════ -->
<section style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;
  background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;text-align:center">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:.45;margin-bottom:20px">
    Prepared for Client Review
  </div>
  <h1 style="font-size:38px;font-weight:800;margin-bottom:36px">${escHtml(reportTitle)}</h1>

  <!-- Pass-rate circle -->
  <div style="display:inline-block;background:${passColor};color:#fff;font-size:58px;font-weight:900;
    border-radius:50%;width:160px;height:160px;line-height:160px;margin:0 auto 16px">${passRate}%</div>
  <div style="font-size:16px;font-weight:600;opacity:.85;margin-bottom:4px">Overall Pass Rate</div>
  <div style="font-size:12px;opacity:.4;margin-bottom:40px">(excludes skipped tests)</div>

  <!-- Quick-stats row -->
  <div style="display:flex;justify-content:center;gap:32px;opacity:.9">
    ${[
      ['TOTAL',   totalTests,   '#e2e8f0'],
      ['PASSED',  totalPassed,  '#4ade80'],
      ['FLAKY',   totalFlaky,   '#fbbf24'],
      ['FAILED',  totalFailed,  '#f87171'],
      ['STOPPED', totalStopped, '#a78bfa'],
      ['SKIPPED', totalSkipped, '#94a3b8'],
    ].map(([lbl, val, col]) => `
      <div>
        <div style="font-size:28px;font-weight:800;color:${col}">${val}</div>
        <div style="font-size:10px;opacity:.55;letter-spacing:1.5px;margin-top:2px">${lbl}</div>
      </div>`).join('')}
  </div>

  <div style="font-size:12px;opacity:.35;margin-top:36px">
    ${runDate} · ${fmtDuration(totalDuration)} total execution time
  </div>
</section>
<div class="page-break"></div>

<!-- ═══ EXECUTIVE SUMMARY ════════════════════════════════════════════════════ -->
<section>
  <h2>Executive Summary</h2>
  ${buildNarrative()}

  <!-- KPI cards -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:28px">
    ${[
      ['Total',   totalTests,   '#3b82f6'],
      ['Passed',  totalPassed,  STATUS_COLORS.passed ],
      ['Flaky',   totalFlaky,   STATUS_COLORS.flaky  ],
      ['Failed',  totalFailed,  STATUS_COLORS.failed ],
      ['Stopped', totalStopped, STATUS_COLORS.stopped],
      ['Skipped', totalSkipped, STATUS_COLORS.skipped],
    ].map(([lbl, val, col]) => `
      <div style="border-radius:10px;padding:18px 10px;text-align:center;border:1px solid #e2e8f0">
        <div style="font-size:34px;font-weight:800;color:${col};line-height:1">${val}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:6px;text-transform:uppercase;letter-spacing:.5px">${lbl}</div>
      </div>`).join('')}
  </div>
</section>
<div class="page-break"></div>

<!-- ═══ VISUAL OVERVIEW ═══════════════════════════════════════════════════════ -->
<section>
  <h2>Test Results Overview</h2>
  <div style="display:flex;gap:40px;align-items:flex-start">

    <!-- Donut chart + legend -->
    <div style="flex-shrink:0">
      ${donutSvg}
      <div style="margin-top:20px;min-width:160px">${legendHtml}</div>
    </div>

    <!-- Per-area stacked bars -->
    <div style="flex:1;padding-top:4px">
      <div style="font-size:13px;font-weight:600;color:#475569;margin-bottom:18px;
        padding-bottom:8px;border-bottom:1px solid #f1f5f9">
        Results by Functional Area
      </div>
      ${pageBarChart()}
    </div>
  </div>

  <!-- Pass-rate scale footnote -->
  <div style="margin-top:28px;padding:12px 16px;background:#f8fafc;border-radius:8px;
    border:1px solid #e2e8f0;font-size:12px;color:#64748b;page-break-inside:avoid">
    <div style="display:flex;gap:20px;margin-bottom:6px">
      <span>Pass-rate scale:</span>
      <span style="color:#16a34a">● ≥ 90% Good</span>
      <span style="color:#d97706">● 70–89% Attention needed</span>
      <span style="color:#dc2626">● &lt; 70% Critical</span>
    </div>
    <div style="color:#94a3b8">
      ⚡ <strong>Flaky</strong> = passed only after a retry (intermittent instability) &nbsp;·&nbsp;
      <strong>Stopped</strong> = runtime error or timeout (not an assertion failure)
    </div>
  </div>
</section>
<div class="page-break"></div>

<!-- ═══ DETAILED TEST CASES ═════════════════════════════════════════════════ -->
<section>
  <h2>Detailed Test Cases</h2>
  ${pageGroupsHtml}
</section>

${failuresSectionHtml}

</body>
</html>`;

// ── Write HTML + PDF ──────────────────────────────────────────────────────────

writeFileSync(OUT_HTML, html, 'utf-8');
console.log(`[report] HTML written: ${OUT_HTML}`);

const browser = await chromium.launch();
const page    = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: OUT_PDF,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
});
await browser.close();

const pdfSize = statSync(OUT_PDF).size;
if (pdfSize < 10_000) {
  console.error(`[report] QUALITY CHECK FAILED: PDF is only ${pdfSize} bytes — likely empty render`);
  process.exit(1);
}

console.log(`[report] PDF written: ${OUT_PDF} (${Math.round(pdfSize / 1024)} KB)`);
console.log(`[report] Pass rate: ${passRate}% | Total: ${totalTests} | Passed: ${totalPassed} | Flaky: ${totalFlaky} | Failed: ${totalFailed} | Stopped: ${totalStopped} | Skipped: ${totalSkipped} | Duration: ${fmtDuration(totalDuration)}`);
