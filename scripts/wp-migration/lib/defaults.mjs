/** Static defaults — site-specific overrides live in output/<site>/wp-migration/site-config.json */
export const ENGINE_VERSION = 1;

export const DEFAULT_WORDPRESS = {
  coreResources: ['posts', 'pages', 'categories', 'tags', 'media', 'users'],
  typeMapping: {
    posts: 'article',
    pages: 'page',
  },
};

export const DEFAULT_STRAPI = {
  taxonomies: {
    category: { api: 'categories' },
    tag: { api: 'tags' },
  },
  authors: { api: 'authors' },
  media: {},
  contentTypes: [
    { kind: 'article', strapiApi: 'articles' },
    { kind: 'page', strapiApi: 'pages' },
  ],
};

export const DEFAULT_SAMPLE_LIMITS = {
  posts: 5,
  pages: 3,
  categories: 10,
  tags: 5,
  media: 5,
  users: 2,
  customType: 3,
};

export function buildDefaultSiteConfig({ siteSlug, wordpressUrl, migrationDir }) {
  return {
    version: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    siteSlug,
    wordpressUrl,
    migrationDir,
    wordpress: { ...DEFAULT_WORDPRESS },
    strapi: JSON.parse(JSON.stringify(DEFAULT_STRAPI)),
    sampleLimits: { ...DEFAULT_SAMPLE_LIMITS },
    profiles: {
      preview: { id: 'preview', sample: true, ownsContentModel: true },
    },
    scriptsDir: 'scripts',
    hooks: {
      preExtract: null,
      postExtract: null,
      preNormalize: null,
      postNormalize: null,
    },
  };
}
