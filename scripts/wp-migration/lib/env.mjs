import fs from 'node:fs/promises';
import path from 'node:path';

async function loadDotEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    /* optional file */
  }
}

/**
 * Resolve Strapi URL + token from env, optionally loading frontend/.env.local.
 * @param {{ migrationDir?: string }} [options]
 */
export async function requireStrapiEnv(options = {}) {
  const { migrationDir } = options;

  if (migrationDir && (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN)) {
    const frontendEnv = path.join(migrationDir, '..', 'frontend', '.env.local');
    await loadDotEnvFile(frontendEnv);
    if (!process.env.STRAPI_URL && process.env.STRAPI_GRAPHQL_URL) {
      process.env.STRAPI_URL = process.env.STRAPI_GRAPHQL_URL.replace(/\/graphql\/?$/i, '');
    }
    if (!process.env.STRAPI_URL && process.env.STRAPI_REST_URL) {
      process.env.STRAPI_URL = process.env.STRAPI_REST_URL.replace(/\/api\/?$/i, '');
    }
  }

  const strapiUrl = process.env.STRAPI_URL;
  const strapiToken = process.env.STRAPI_API_TOKEN;
  if (!strapiUrl || !strapiToken) {
    throw new Error(
      'Missing STRAPI_URL or STRAPI_API_TOKEN. Set env vars or add them to output/<site>/frontend/.env.local'
    );
  }
  return { strapiUrl, strapiToken };
}
