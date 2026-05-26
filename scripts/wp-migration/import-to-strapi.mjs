#!/usr/bin/env node
/**
 * @deprecated Use profile-specific importers instead:
 *   import-preview-to-strapi.mjs  — command 1 (preview / sample data)
 *   import-full-to-strapi.mjs     — command 2 (full migration)
 */
console.error(`
import-to-strapi.mjs is deprecated.

E2E partial (/wordpress-to-strapi):
  node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wp-url> [--import]

Data only (/wp-to-strapi-db-migration):
  node scripts/wp-migration/wp-to-strapi-db-migration.mjs <site-slug> <wp-url> [--import]
`);
process.exit(1);
