#!/usr/bin/env node
/**
 * @deprecated Use profile-specific importers instead:
 *   import-preview-to-strapi.mjs  — command 1 (preview / sample data)
 *   import-full-to-strapi.mjs     — command 2 (full migration)
 */
console.error(`
import-to-strapi.mjs is deprecated.

Command 1 (content model + preview data):
  node scripts/wp-migration/import-preview-to-strapi.mjs <site-slug>

Command 2 (full migration — separate profile, not a sync):
  node scripts/wp-migration/import-full-to-strapi.mjs <site-slug>
`);
process.exit(1);
