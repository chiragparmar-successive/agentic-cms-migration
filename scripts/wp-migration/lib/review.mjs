import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson, wpMigrationDir, ensureDir } from './utils.mjs';

export async function generateReviewMapping(siteSlug) {
  const outDir = wpMigrationDir(siteSlug);
  const analysisPath = path.join(outDir, 'analysis/structure-analysis.json');
  const normalizedPath = path.join(outDir, 'normalized/content.json');

  let analysis = { collectionTypes: [], components: [] };
  let normalized = { items: [] };

  try {
    analysis = await readJson(analysisPath);
  } catch {
    /* optional until detect runs */
  }
  try {
    normalized = await readJson(normalizedPath);
  } catch {
    /* optional */
  }

  let aiValidated = null;
  try {
    aiValidated = await readJson(path.join(outDir, 'validated/ai-interpretations.json'));
  } catch {
    /* optional */
  }

  const rows = [];

  for (const ct of analysis.collectionTypes || []) {
    for (const field of ct.fields || []) {
      rows.push({
        wordpressField: `${ct.apiId}.${field.name}`,
        strapiType: ct.name,
        strapiField: field.name,
        strapiFieldType: field.type,
        source: 'deterministic',
        status: 'pending',
      });
    }
  }

  for (const comp of aiValidated?.components || analysis.components || []) {
    for (const field of comp.fields || []) {
      rows.push({
        wordpressField: comp.sourcePath || comp.source || comp.name,
        strapiType: comp.name,
        strapiField: field.name,
        strapiFieldType: field.type,
        source: comp.source === 'ai' ? 'ai' : 'deterministic',
        status: 'pending',
      });
    }
  }

  const mapping = {
    meta: {
      generatedAt: new Date().toISOString(),
      siteSlug,
      itemCount: normalized.items?.length ?? 0,
      pendingReview: rows.filter((r) => r.status === 'pending').length,
    },
    rows,
  };

  const reviewDir = path.join(outDir, 'review');
  await ensureDir(reviewDir);
  const mappingPath = path.join(reviewDir, 'mapping-review.json');
  await writeJson(mappingPath, mapping);

  const md = buildMarkdown(mapping, siteSlug);
  const markdownPath = path.join(reviewDir, 'REVIEW-MAPPING.md');
  await fs.writeFile(markdownPath, md, 'utf8');

  return { mappingPath, markdownPath };
}

function buildMarkdown(mapping, siteSlug) {
  const lines = [
    `# WordPress → Strapi Field Mapping Review`,
    '',
    `Site: \`${siteSlug}\``,
    '',
    `Generated: ${mapping.meta.generatedAt}`,
    '',
    '| WordPress field | Strapi type | Strapi field | Type | Source | Status |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const row of mapping.rows) {
    lines.push(
      `| ${row.wordpressField} | ${row.strapiType} | ${row.strapiField} | ${row.strapiFieldType} | ${row.source} | ${row.status} |`
    );
  }

  lines.push(
    '',
    '## Human actions',
    '',
    '- **Approve** — set `status` to `approved` in `mapping-review.json`',
    '- **Edit** — change `strapiField` / `strapiFieldType` then set `status` to `edited`',
    '- **Reject** — set `status` to `rejected` and add `notes`',
    '',
    'Re-run schema generation after all required rows are approved.'
  );

  return `${lines.join('\n')}\n`;
}
