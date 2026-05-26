import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function repoRoot() {
  return path.resolve(__dirname, '../../..');
}

export function wpMigrationDir(siteSlug) {
  return path.join(repoRoot(), 'output', siteSlug, 'wp-migration');
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export function slugFromUrl(urlString) {
  const host = new URL(urlString).hostname.replace(/^www\./, '');
  return host.replace(/\./g, '-');
}

export async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

/** Paginate WP REST collection endpoints. */
export async function fetchAllPages(baseUrl, resource, perPage = 100) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${baseUrl}/wp-json/wp/v2/${resource}?per_page=${perPage}&page=${page}&_embed`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 400 && page > 1) break;
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    totalPages = Number(res.headers.get('x-wp-totalpages') || '1');
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    page += 1;
  }

  return items;
}

export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
