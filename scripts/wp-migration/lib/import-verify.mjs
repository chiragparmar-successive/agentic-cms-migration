import { strapiRequest } from './strapi-client.mjs';
import { createMigrationLogger } from './migration-logger.mjs';

async function countStrapiEntries(baseUrl, token, plural) {
  const q = `/api/${plural}?pagination[pageSize]=1&pagination[withCount]=true&fields[0]=id`;
  const res = await strapiRequest(baseUrl, token, 'GET', q);
  return res?.meta?.pagination?.total ?? res?.data?.length ?? 0;
}

function countIdMapKeys(idMap, key) {
  return Object.keys(idMap?.[key] || {}).length;
}

/**
 * Verify normalized source counts match id-map / Strapi after import.
 * @returns {{ passed: boolean; checks: object[]; log: object }}
 */
export async function verifyImport(config, {
  strapiUrl,
  strapiToken,
  normalized,
  idMap,
  logger = createMigrationLogger('[verify]'),
}) {
  const checks = [];
  let passed = true;

  const expect = {
    categories: (normalized.taxonomies?.categories || []).length,
    tags: (normalized.taxonomies?.tags || []).length,
    authors: (normalized.authors || []).length,
    media: (normalized.media || []).length,
  };

  const tax = config.strapi?.taxonomies ?? {};
  const catKey = tax.category?.idMapKey ?? 'category';
  const tagKey = tax.tag?.idMapKey ?? 'tag';
  const authorKey = config.strapi?.authors?.idMapKey ?? 'author';
  const mediaKey = config.strapi?.media?.idMapKey ?? 'media';

  const mapped = {
    categories: countIdMapKeys(idMap, catKey),
    tags: countIdMapKeys(idMap, tagKey),
    authors: countIdMapKeys(idMap, authorKey),
    media: countIdMapKeys(idMap, mediaKey),
  };

  for (const [name, expected] of Object.entries(expect)) {
    const got = mapped[name];
    const ok = got >= expected;
    if (!ok) passed = false;
    checks.push({ entity: name, expected, mapped: got, ok });
    if (ok) logger.ok('verify', name, `${got}/${expected} mapped`);
    else logger.fail('verify', name, `expected ${expected}, mapped ${got}`);
  }

  const kindsInData = new Set((normalized.items || []).map((i) => i.kind));
  const importable = (config.strapi?.contentTypes || []).filter(
    (ct) => ct.import !== false && kindsInData.has(ct.kind)
  );

  for (const ct of importable) {
    const expected = (normalized.items || []).filter((i) => i.kind === ct.kind).length;
    const mappedCount = countIdMapKeys(idMap, ct.idMapKey);
    let strapiTotal = null;
    try {
      strapiTotal = await countStrapiEntries(strapiUrl, strapiToken, ct.strapiApi);
    } catch (err) {
      logger.warn(`${ct.strapiApi}: could not count in Strapi (${err.message})`);
    }

    const ok = mappedCount >= expected;
    if (!ok) passed = false;
    checks.push({
      entity: ct.idMapKey,
      expected,
      mapped: mappedCount,
      strapiTotal,
      ok,
    });

    const detail = strapiTotal != null ? `id-map ${mappedCount}/${expected}, Strapi total ${strapiTotal}` : `id-map ${mappedCount}/${expected}`;
    if (ok) logger.ok('verify', ct.idMapKey, detail);
    else logger.fail('verify', ct.idMapKey, `expected ${expected}, mapped ${mappedCount}`);
  }

  const verification = {
    verifiedAt: new Date().toISOString(),
    passed,
    checks,
  };

  return { passed, checks, verification };
}
