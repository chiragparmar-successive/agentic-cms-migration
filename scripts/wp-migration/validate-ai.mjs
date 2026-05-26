#!/usr/bin/env node
/**
 * Validate AI interpretation output before merging into Strapi schemas.
 * Usage: node scripts/wp-migration/validate-ai.mjs <site-slug>
 */
import path from 'node:path';
import { readJson, writeJson, wpMigrationDir } from './lib/utils.mjs';
import { STRAPI_FIELD_TYPES } from './lib/detect.mjs';

const [, , siteSlug] = process.argv;

if (!siteSlug) {
  console.error('Usage: node scripts/wp-migration/validate-ai.mjs <site-slug>');
  process.exit(1);
}

const ALLOWED_COMPONENT_PATTERN = /^[A-Z][a-zA-Z0-9]+$/;
const ALLOWED_FIELD_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

function validateInterpretation(data) {
  const errors = [];
  const components = data.components || [];

  const names = new Set();
  for (const comp of components) {
    if (!comp.name || !ALLOWED_COMPONENT_PATTERN.test(comp.name)) {
      errors.push(`Invalid component name: ${comp.name}`);
    }
    if (names.has(comp.name)) {
      errors.push(`Duplicate component name: ${comp.name}`);
    }
    names.add(comp.name);

    const fieldNames = new Set();
    for (const field of comp.fields || []) {
      if (!field.name || !ALLOWED_FIELD_PATTERN.test(field.name)) {
        errors.push(`Invalid field name ${comp.name}.${field.name}`);
      }
      if (fieldNames.has(field.name)) {
        errors.push(`Duplicate field ${comp.name}.${field.name}`);
      }
      fieldNames.add(field.name);

      if (!STRAPI_FIELD_TYPES.has(field.type)) {
        errors.push(`Invalid field type ${comp.name}.${field.name}: ${field.type}`);
      }
    }
  }

  return errors;
}

async function main() {
  const outDir = wpMigrationDir(siteSlug);
  const inputPath = path.join(outDir, 'ai/ai-interpretations.json');
  const data = await readJson(inputPath);
  const errors = validateInterpretation(data);

  if (errors.length > 0) {
    console.error('[validate-ai] FAILED');
    for (const e of errors) console.error(' -', e);
    process.exit(1);
  }

  const output = {
    meta: {
      validatedAt: new Date().toISOString(),
      source: 'ai',
      status: 'valid',
    },
    components: (data.components || []).map((c) => ({ ...c, source: 'ai' })),
  };

  const outPath = path.join(outDir, 'validated/ai-interpretations.json');
  await writeJson(outPath, output);
  console.log('[validate-ai] OK', outPath, `components=${output.components.length}`);
}

main().catch((err) => {
  console.error('[validate-ai] ERROR', err.message);
  process.exit(1);
});
