import path from 'node:path';
import fs from 'node:fs/promises';
import { readJson, writeJson, wpMigrationDir, repoRoot, ensureDir } from './utils.mjs';

const SYNC_FIELDS = [
  { name: 'wpId', type: 'integer', required: true, unique: true },
  { name: 'wpSourceType', type: 'string', required: false },
  { name: 'sourceLink', type: 'string', required: false },
];

/** Fixed taxonomy + author types for MVP sync */
const TAXONOMY_TYPES = [
  {
    apiId: 'category',
    name: 'Category',
    collectionName: 'categories',
    pluralName: 'categories',
    singularName: 'category',
    kind: 'collectionType',
    fields: [
      ...SYNC_FIELDS,
      { name: 'name', type: 'string', required: true },
      { name: 'slug', type: 'uid', targetField: 'name', required: true },
      { name: 'parentWpId', type: 'integer', required: false },
    ],
  },
  {
    apiId: 'tag',
    name: 'Tag',
    collectionName: 'tags',
    pluralName: 'tags',
    singularName: 'tag',
    kind: 'collectionType',
    fields: [
      ...SYNC_FIELDS,
      { name: 'name', type: 'string', required: true },
      { name: 'slug', type: 'uid', targetField: 'name', required: true },
    ],
  },
  {
    apiId: 'author',
    name: 'Author',
    collectionName: 'authors',
    pluralName: 'authors',
    singularName: 'author',
    kind: 'collectionType',
    fields: [
      ...SYNC_FIELDS,
      { name: 'name', type: 'string', required: true },
      { name: 'slug', type: 'uid', targetField: 'name', required: true },
      { name: 'url', type: 'string', required: false },
    ],
  },
];

function toKebab(s) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
}

function pluralize(apiId) {
  if (apiId.endsWith('y')) return `${apiId.slice(0, -1)}ies`;
  if (apiId.endsWith('s')) return `${apiId}es`;
  return `${apiId}s`;
}

function buildAttribute(field, allTypes) {
  const base = { type: field.type };
  if (field.required) base.required = true;
  if (field.unique) base.unique = true;

  if (field.type === 'uid' && field.targetField) {
    base.targetField = field.targetField;
  }

  if (field.type === 'media') {
    base.multiple = false;
    base.allowedTypes = ['images', 'files', 'videos'];
  }

  if (field.type === 'relation') {
    const target = field.target || 'category';
    const targetSingular = toKebab(target);
    base.relation =
      field.relationKind === 'manyToMany'
        ? 'manyToMany'
        : field.relationKind === 'manyToOne'
          ? 'manyToOne'
          : 'oneToMany';
    base.target = `api::${targetSingular}.${targetSingular}`;
    if (field.inversedBy) base.inversedBy = field.inversedBy;
    if (field.mappedBy) base.mappedBy = field.mappedBy;
  }

  if (field.type === 'json' && field.name === 'seo') {
    base.type = 'json';
  }

  return base;
}

function buildSchemaJson(typeDef) {
  const attributes = {};
  for (const field of typeDef.fields) {
    attributes[field.name] = buildAttribute(field, typeDef);
  }

  return {
    kind: typeDef.kind,
    collectionName: typeDef.collectionName,
    info: {
      singularName: typeDef.singularName,
      pluralName: typeDef.pluralName,
      displayName: typeDef.name,
      description: `Migrated from WordPress (${typeDef.apiId})`,
    },
    options: {
      draftAndPublish: typeDef.kind === 'collectionType',
    },
    pluginOptions: {},
    attributes,
  };
}

function controllerTs(uid) {
  return `import { factories } from '@strapi/strapi';\nexport default factories.createCoreController('api::${uid}.${uid}');\n`;
}

function routerTs(uid) {
  return `import { factories } from '@strapi/strapi';\nexport default factories.createCoreRouter('api::${uid}.${uid}');\n`;
}

function serviceTs(uid) {
  return `import { factories } from '@strapi/strapi';\nexport default factories.createCoreService('api::${uid}.${uid}');\n`;
}

async function writeTypeFiles(apiRoot, typeDef) {
  const uid = typeDef.singularName;
  const base = path.join(
    apiRoot,
    typeDef.apiId,
    'content-types',
    uid
  );
  const apiBase = path.join(apiRoot, typeDef.apiId);

  await ensureDir(base);
  await writeJson(path.join(base, 'schema.json'), buildSchemaJson(typeDef));

  await fs.writeFile(path.join(apiBase, 'controllers', `${typeDef.apiId}.ts`), controllerTs(uid));
  await fs.writeFile(path.join(apiBase, 'routes', `${typeDef.apiId}.ts`), routerTs(uid));
  await fs.writeFile(path.join(apiBase, 'services', `${typeDef.apiId}.ts`), serviceTs(uid));
}

function enrichContentType(ct) {
  const apiId = ct.apiId || toKebab(ct.name);
  const singularName = apiId;
  const pluralName = pluralize(apiId);

  const fields = [
    ...SYNC_FIELDS.map((f) => ({ ...f })),
    ...(ct.fields || []).filter((f) => !SYNC_FIELDS.some((s) => s.name === f.name)),
  ];

  const fieldNames = new Set(fields.map((f) => f.name));
  if (!fieldNames.has('title')) fields.push({ name: 'title', type: 'string', required: true });
  if (!fieldNames.has('slug')) fields.push({ name: 'slug', type: 'uid', targetField: 'title', required: true });

  for (const field of fields) {
    if (field.name === 'categories') {
      field.type = 'relation';
      field.relationKind = 'manyToMany';
      field.target = 'category';
    }
    if (field.name === 'tags') {
      field.type = 'relation';
      field.relationKind = 'manyToMany';
      field.target = 'tag';
    }
    if (field.name === 'author') {
      field.type = 'relation';
      field.relationKind = 'manyToOne';
      field.target = 'author';
    }
    if (field.name === 'featuredImage') {
      field.type = 'media';
    }
  }

  return {
    apiId,
    name: ct.name,
    collectionName: pluralName.replace(/-/g, '_'),
    pluralName,
    singularName,
    kind: ct.kind === 'singleType' ? 'collectionType' : ct.kind || 'collectionType',
    fields,
  };
}

export async function generateStrapiSchemas(siteSlug) {
  const outDir = wpMigrationDir(siteSlug);
  const analysisPath = path.join(outDir, 'analysis/structure-analysis.json');
  const analysis = await readJson(analysisPath);

  const contentTypes = (analysis.collectionTypes || []).map(enrichContentType);

  const hasArticle = contentTypes.some((t) => t.apiId === 'article');
  const hasPage = contentTypes.some((t) => t.apiId === 'page');
  if (!hasArticle) {
    contentTypes.push(
      enrichContentType({
        name: 'Article',
        apiId: 'article',
        kind: 'collectionType',
        fields: [
          { name: 'body', type: 'richtext', required: false },
          { name: 'excerpt', type: 'text', required: false },
          { name: 'publishedAt', type: 'datetime', required: false },
          { name: 'seo', type: 'json', required: false },
          { name: 'categories', type: 'relation' },
          { name: 'tags', type: 'relation' },
          { name: 'author', type: 'relation' },
          { name: 'featuredImage', type: 'media' },
        ],
      })
    );
  }
  if (!hasPage) {
    contentTypes.push(
      enrichContentType({
        name: 'Page',
        apiId: 'page',
        kind: 'collectionType',
        fields: [
          { name: 'body', type: 'richtext', required: false },
          { name: 'publishedAt', type: 'datetime', required: false },
          { name: 'seo', type: 'json', required: false },
          { name: 'featuredImage', type: 'media' },
        ],
      })
    );
  }

  const allTypes = [...TAXONOMY_TYPES, ...contentTypes];

  const cmsApiRoot = path.join(repoRoot(), 'output', siteSlug, 'cms', 'src', 'api');
  const fallbackRoot = path.join(outDir, 'strapi-schemas', 'api');
  let apiRoot = fallbackRoot;

  try {
    await fs.access(path.join(repoRoot(), 'output', siteSlug, 'cms'));
    apiRoot = cmsApiRoot;
  } catch {
    await ensureDir(fallbackRoot);
  }

  for (const typeDef of allTypes) {
    await ensureDir(path.join(apiRoot, typeDef.apiId, 'controllers'));
    await ensureDir(path.join(apiRoot, typeDef.apiId, 'routes'));
    await ensureDir(path.join(apiRoot, typeDef.apiId, 'services'));
    await writeTypeFiles(apiRoot, typeDef);
  }

  const manifest = {
    meta: {
      generatedAt: new Date().toISOString(),
      siteSlug,
      schemaRoot: apiRoot,
      note: 'Restart Strapi after applying schemas. Partial: wordpress-to-strapi.mjs --import. Full data: wp-to-strapi-dn-migration.mjs --import.',
    },
    types: allTypes.map((t) => ({
      apiId: t.apiId,
      singularName: t.singularName,
      pluralName: t.pluralName,
      kind: t.kind,
      restPath: `/api/${t.pluralName}`,
    })),
  };

  const manifestPath = path.join(outDir, 'strapi-schemas', 'SCHEMA-MANIFEST.json');
  await writeJson(manifestPath, manifest);

  return { apiRoot, manifestPath, typeCount: allTypes.length };
}
