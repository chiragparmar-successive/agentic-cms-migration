#!/usr/bin/env node
/** @deprecated Use import-preview-to-strapi.mjs / import-full-to-strapi.mjs */
console.error(`
import-to-strapi.mjs is deprecated.

Preview import:
  node scripts/wp-migration/import-preview-to-strapi.mjs <site-slug>

Full import:
  node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>
`);
process.exit(1);
