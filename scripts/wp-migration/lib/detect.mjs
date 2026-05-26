import fs from 'node:fs/promises';
import { readJson, writeJson } from './utils.mjs';
import { profilePaths } from './migration-profile.mjs';

const KNOWN_ACF_TYPES = new Set([
  'text',
  'textarea',
  'wysiwyg',
  'image',
  'gallery',
  'relationship',
  'repeater',
  'flexible_content',
  'group',
  'link',
  'number',
  'true_false',
  'date_picker',
  'select',
]);

const STRAPI_FIELD_TYPES = new Set([
  'string',
  'text',
  'richtext',
  'email',
  'password',
  'enumeration',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'date',
  'time',
  'datetime',
  'timestamp',
  'boolean',
  'json',
  'media',
  'relation',
  'component',
  'dynamiczone',
  'uid',
]);

const URL_RE = /^https?:\/\//i;
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i;

export async function detectStructure(siteSlug, options = {}) {
  const profileId = options.profile ?? 'preview';
  const paths = profilePaths(siteSlug, profileId);
  const normalized = await readJson(paths.normalizedFile);

  const fieldStats = new Map();
  const unknownBlocks = [];

  for (const item of normalized.items) {
    if (item.acf) {
      walkObject(item.acf, ['acf'], fieldStats, unknownBlocks, item);
    }
    if (item.blocks) {
      unknownBlocks.push({
        source: 'gutenberg',
        itemId: item.id,
        reason: 'block_content_requires_review',
        sample: truncate(item.blocks, 2000),
      });
    }
  }

  const collectionTypes = buildCollectionTypes(normalized);
  const components = buildComponents(fieldStats);
  const relations = buildRelations(normalized);

  const analysis = {
    meta: { analyzedAt: new Date().toISOString() },
    collectionTypes,
    components,
    relations,
    fieldStats: Object.fromEntries(
      [...fieldStats.entries()].map(([k, v]) => [k, { ...v, inferredType: inferFieldType(v.samples) }])
    ),
    rulesApplied: [
      'image_url → media',
      'html → richtext',
      'array → component (repeatable)',
      'acf_fc_layout → dynamiczone (flagged for AI)',
    ],
  };

  const unknown = {
    meta: {
      count: unknownBlocks.length,
      requiresAi: unknownBlocks.length > 0,
    },
    blocks: unknownBlocks,
  };

  await fs.mkdir(paths.analysisDir, { recursive: true });
  await writeJson(paths.structureAnalysisFile, analysis);
  await writeJson(paths.unknownBlocksFile, unknown);

  return {
    analysisPath: paths.structureAnalysisFile,
    unknownPath: paths.unknownBlocksFile,
    unknownCount: unknownBlocks.length,
  };
}

function walkObject(obj, pathParts, fieldStats, unknownBlocks, item, depth = 0) {
  if (depth > 8 || obj == null) return;

  if (Array.isArray(obj)) {
    recordField(pathParts.join('.'), obj, fieldStats);
    if (obj.length > 0 && typeof obj[0] === 'object') {
      for (const child of obj.slice(0, 3)) {
        walkObject(child, [...pathParts, '[]'], fieldStats, unknownBlocks, item, depth + 1);
      }
    }
    return;
  }

  if (typeof obj !== 'object') {
    recordField(pathParts.join('.'), obj, fieldStats);
    return;
  }

  if (obj.acf_fc_layout) {
    unknownBlocks.push({
      source: 'acf_flexible_content',
      itemId: item.id,
      layout: obj.acf_fc_layout,
      path: pathParts.join('.'),
      sample: truncate(obj, 1500),
    });
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'acf_fc_layout') continue;
    const nextPath = [...pathParts, key];
    if (typeof value === 'object' && value !== null && !KNOWN_ACF_TYPES.has(key)) {
      if (looksLikeElementor(value)) {
        unknownBlocks.push({
          source: 'elementor',
          itemId: item.id,
          path: nextPath.join('.'),
          sample: truncate(value, 1500),
        });
        continue;
      }
    }
    walkObject(value, nextPath, fieldStats, unknownBlocks, item, depth + 1);
  }
}

function recordField(fieldPath, value, fieldStats) {
  const existing = fieldStats.get(fieldPath) || { count: 0, samples: [] };
  existing.count += 1;
  if (existing.samples.length < 5) {
    existing.samples.push(truncate(value, 200));
  }
  fieldStats.set(fieldPath, existing);
}

function inferFieldType(samples) {
  const flat = samples.flat();
  if (flat.length === 0) return 'string';
  if (flat.every((v) => typeof v === 'boolean')) return 'boolean';
  if (flat.every((v) => typeof v === 'number')) return 'integer';
  if (flat.every((v) => typeof v === 'string' && URL_RE.test(v) && IMAGE_EXT_RE.test(v))) {
    return 'media';
  }
  if (flat.every((v) => typeof v === 'string' && /<[^>]+>/.test(v))) return 'richtext';
  if (flat.some((v) => Array.isArray(v))) return 'component';
  if (flat.some((v) => typeof v === 'object')) return 'json';
  return 'string';
}

function buildCollectionTypes(normalized) {
  const byKind = new Map();
  for (const item of normalized.items) {
    const key = item.kind === 'custom' ? item.wpType : item.kind;
    if (!byKind.has(key)) {
      byKind.set(key, {
        name: toPascal(key),
        apiId: toKebab(key),
        kind: item.kind === 'page' ? 'singleType' : 'collectionType',
        fields: new Set(['title', 'slug', 'body', 'excerpt', 'publishedAt', 'seo']),
      });
    }
    const t = byKind.get(key);
    if (item.featuredMediaId) t.fields.add('featuredImage');
    if (item.categoryIds?.length) t.fields.add('categories');
    if (item.tagIds?.length) t.fields.add('tags');
    if (item.authorId) t.fields.add('author');
  }

  return [...byKind.values()].map((t) => ({
    ...t,
    fields: [...t.fields].map((name) => ({
      name,
      type: defaultFieldType(name),
      required: ['title', 'slug'].includes(name),
    })),
  }));
}

function buildComponents(fieldStats) {
  const repeatable = [...fieldStats.entries()].filter(([, v]) =>
    v.samples.some((s) => Array.isArray(s))
  );

  return repeatable.slice(0, 20).map(([fieldPath, stats]) => ({
    name: toPascal(fieldPath.replace(/\./g, '_')),
    category: 'shared',
    repeatable: true,
    fields: [{ name: 'value', type: inferFieldType(stats.samples), required: false }],
    sourcePath: fieldPath,
  }));
}

function buildRelations(normalized) {
  return [
    { from: 'article', to: 'category', type: 'manyToMany' },
    { from: 'article', to: 'tag', type: 'manyToMany' },
    { from: 'article', to: 'author', type: 'manyToOne' },
    { from: 'article', to: 'media', field: 'featuredImage', type: 'manyToOne' },
  ].filter((r) => hasItemsForRelation(normalized, r));
}

function hasItemsForRelation(normalized, rel) {
  if (rel.field === 'featuredImage') {
    return normalized.items.some((i) => i.featuredMediaId);
  }
  if (rel.to === 'category') return normalized.items.some((i) => i.categoryIds?.length);
  if (rel.to === 'tag') return normalized.items.some((i) => i.tagIds?.length);
  if (rel.to === 'author') return normalized.items.some((i) => i.authorId);
  return true;
}

function defaultFieldType(name) {
  const map = {
    title: 'string',
    slug: 'uid',
    body: 'richtext',
    excerpt: 'text',
    publishedAt: 'datetime',
    seo: 'json',
    featuredImage: 'media',
    categories: 'relation',
    tags: 'relation',
    author: 'relation',
  };
  return map[name] || 'string';
}

function looksLikeElementor(obj) {
  return (
    typeof obj === 'object' &&
    (obj.elType || obj.widgetType || obj.elements || obj.settings?.['_element_id'])
  );
}

function toPascal(s) {
  return s
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toKebab(s) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
}

function truncate(value, max) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export { STRAPI_FIELD_TYPES };
