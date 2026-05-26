function authHeaders(token) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function strapiRequest(baseUrl, token, method, apiPath, body) {
  const url = `${baseUrl.replace(/\/$/, '')}${apiPath}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || text || res.statusText;
    throw new Error(`Strapi ${method} ${apiPath} → ${res.status}: ${msg}`);
  }
  return json;
}

export async function findByWpId(baseUrl, token, plural, wpId) {
  const q = `/api/${plural}?filters[wpId][$eq]=${encodeURIComponent(wpId)}&pagination[pageSize]=1`;
  const res = await strapiRequest(baseUrl, token, 'GET', q);
  const row = res?.data?.[0];
  return row ? { id: row.id, documentId: row.documentId } : null;
}
