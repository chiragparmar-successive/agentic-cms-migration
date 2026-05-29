import path from 'node:path';

/**
 * Upload or skip media (shared by full import + retry).
 */
export async function upsertMediaFromRecord(baseUrl, token, mediaItem, idMap, logger) {
  const wpId = mediaItem.wpId;
  const mediaKey = 'media';
  const label = `media wp:${wpId}`;
  const entity = 'media';

  if (idMap[mediaKey]?.[wpId]) {
    logger.upsert(entity, label, 'skipped', `strapi:${idMap[mediaKey][wpId]} (id-map)`);
    return { action: 'skipped', id: idMap[mediaKey][wpId] };
  }

  try {
    const res = await fetch(mediaItem.url);
    if (!res.ok) throw new Error(`download ${res.status} ${mediaItem.url}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    const urlPath = new URL(mediaItem.url).pathname;
    const filename = path.basename(urlPath) || `wp-media-${wpId}.jpg`;

    const form = new FormData();
    form.append('files', new Blob([buffer]), filename);
    form.append(
      'fileInfo',
      JSON.stringify({
        alternativeText: mediaItem.alt || '',
        caption: mediaItem.title || '',
        name: mediaItem.title || filename,
      })
    );

    const uploadRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error(JSON.stringify(uploadJson));
    }

    const file = Array.isArray(uploadJson) ? uploadJson[0] : uploadJson;
    if (!idMap[mediaKey]) idMap[mediaKey] = {};
    idMap[mediaKey][wpId] = file.id;
    logger.upsert(entity, label, 'created', `strapi:${file.id}`);
    return { action: 'uploaded', id: file.id };
  } catch (err) {
    logger.upsert(entity, label, 'failed', err.message);
    return { action: 'failed', error: err.message };
  }
}
