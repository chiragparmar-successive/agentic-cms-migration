export function requireStrapiEnv() {
  const strapiUrl = process.env.STRAPI_URL;
  const strapiToken = process.env.STRAPI_API_TOKEN;
  if (!strapiUrl || !strapiToken) {
    throw new Error('Missing STRAPI_URL or STRAPI_API_TOKEN environment variables.');
  }
  return { strapiUrl, strapiToken };
}
