/**
 * seed-home-page.mjs
 *
 * Fetches https://wordpress-zcwowkggsk4k08cgsgwo4c8w.sakha.cloud/,
 * extracts the relevant content (removing header, footer template-parts and the
 * dynamic post-template list), then seeds/updates the Strapi `home-page`
 * single-type via REST PUT.
 *
 * Uses only Node.js built-ins — no external HTML parser dependency.
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 \
 *   STRAPI_API_TOKEN=<token> \
 *   node scripts/wp-migration/seed-home-page.mjs
 */

const WP_URL = "https://wordpress-zcwowkggsk4k08cgsgwo4c8w.sakha.cloud/";
const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error("ERROR: STRAPI_API_TOKEN env var is required.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers: minimal HTML region extractor without a DOM parser
// ---------------------------------------------------------------------------

/**
 * Extract all content of every <style> tag in the <head>.
 * Returns concatenated CSS strings.
 */
function extractHeadStyles(html) {
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  if (!headMatch) return "";
  const head = headMatch[0];
  const styles = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(head)) !== null) {
    styles.push(m[1]);
  }
  return styles.join("\n\n");
}

/**
 * Extract all external stylesheet hrefs from the <head>.
 */
function extractStylesheetHrefs(html) {
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  if (!headMatch) return [];
  const head = headMatch[0];
  const hrefs = [];
  const re = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let m;
  while ((m = re.exec(head)) !== null) {
    const hrefMatch = m[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) hrefs.push(hrefMatch[1]);
  }
  return hrefs;
}

/**
 * Extract the text content of the <title> tag.
 */
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/&raquo;/g, "»").trim() : "test site";
}

/**
 * Extract the inner HTML of a tag with given selector pattern.
 * Works by finding the opening tag and then matching balanced nested tags.
 * tagName: e.g. "main", "header", "footer"
 * attrPattern: regex pattern that must appear in the opening tag
 */
function extractTagContent(html, tagName, attrPattern) {
  const openRe = new RegExp(`<${tagName}[^>]*${attrPattern}[^>]*>`, "i");
  const startMatch = openRe.exec(html);
  if (!startMatch) return null;

  const start = startMatch.index + startMatch[0].length;
  // Walk forward balancing open/close tags
  let depth = 1;
  let i = start;
  const openTag = new RegExp(`<${tagName}[\\s>]`, "gi");
  const closeTag = new RegExp(`</${tagName}>`, "gi");

  while (i < html.length && depth > 0) {
    openTag.lastIndex = i;
    closeTag.lastIndex = i;
    const nextOpen = openTag.exec(html);
    const nextClose = closeTag.exec(html);

    if (!nextClose) break;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      i = nextOpen.index + 1;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(start, nextClose.index);
      }
      i = nextClose.index + 1;
    }
  }
  return null;
}

/**
 * Remove a balanced HTML block matching opening tag with attrPattern.
 */
function removeBlock(html, tagName, attrPattern) {
  const openRe = new RegExp(`<${tagName}[^>]*${attrPattern}[^>]*>`, "i");
  const startMatch = openRe.exec(html);
  if (!startMatch) return html;

  const blockStart = startMatch.index;
  const afterOpen = blockStart + startMatch[0].length;
  let depth = 1;
  let i = afterOpen;
  const openTag = new RegExp(`<${tagName}[\\s>]`, "gi");
  const closeTag = new RegExp(`</${tagName}>`, "gi");

  while (i < html.length && depth > 0) {
    openTag.lastIndex = i;
    closeTag.lastIndex = i;
    const nextOpen = openTag.exec(html);
    const nextClose = closeTag.exec(html);

    if (!nextClose) break;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      i = nextOpen.index + 1;
    } else {
      depth--;
      if (depth === 0) {
        const blockEnd = nextClose.index + `</${tagName}>`.length;
        return html.slice(0, blockStart) + html.slice(blockEnd);
      }
      i = nextClose.index + 1;
    }
  }
  return html;
}

/**
 * Remove the dynamic <ul class="wp-block-post-template ..."> block
 * and the following pagination nav from the posts query section.
 * Replaces the ul with an empty marker div.
 */
function removePostTemplateAndPagination(html) {
  // Remove ul.wp-block-post-template
  let result = html;

  // Find the ul with wp-block-post-template class
  const ulMatch = result.match(/<ul[^>]*wp-block-post-template[^>]*>/);
  if (ulMatch) {
    const ulStart = ulMatch.index;
    const afterUlOpen = ulStart + ulMatch[0].length;
    let depth = 1;
    let i = afterUlOpen;
    while (i < result.length && depth > 0) {
      const nextOpen = result.indexOf("<ul", i);
      const nextClose = result.indexOf("</ul>", i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 1;
      } else {
        depth--;
        if (depth === 0) {
          const ulEnd = nextClose + "</ul>".length;
          // Replace with a slot marker
          result = result.slice(0, ulStart) +
            '<div id="wp-posts-list-slot" data-slot="posts"></div>' +
            result.slice(ulEnd);
          break;
        }
        i = nextClose + 1;
      }
    }
  }

  // Remove the pagination nav block
  result = result.replace(
    /<nav[^>]*wp-block-query-pagination[^>]*>[\s\S]*?<\/nav>/gi,
    ""
  );

  return result;
}

// ---------------------------------------------------------------------------
// 1. Fetch the WP homepage
// ---------------------------------------------------------------------------
console.log(`Fetching ${WP_URL} ...`);
const res = await fetch(WP_URL);
if (!res.ok) {
  console.error(`Failed to fetch WP home: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const html = await res.text();
console.log(`Fetched ${html.length} bytes.`);

// ---------------------------------------------------------------------------
// 2. Extract head content
// ---------------------------------------------------------------------------
const headStyles = extractHeadStyles(html);
const themeStylesheets = extractStylesheetHrefs(html);
const siteTitle = extractTitle(html);

console.log(`Extracted ${headStyles.length} chars of inline CSS.`);
console.log(`Extracted ${themeStylesheets.length} external stylesheets.`);
console.log(`Site title: ${siteTitle}`);

// ---------------------------------------------------------------------------
// 3. Extract footer HTML (before removal)
// ---------------------------------------------------------------------------
const footerHtml = extractTagContent(html, "footer", "wp-block-template-part") ?? "";
console.log(`Footer HTML length: ${footerHtml.length} chars.`);

// ---------------------------------------------------------------------------
// 4. Extract main content — inner HTML of main#wp--skip-link--target
// ---------------------------------------------------------------------------
let mainHtml = extractTagContent(html, "main", "wp--skip-link--target");
if (!mainHtml) {
  console.error("Could not extract <main id='wp--skip-link--target'>");
  process.exit(1);
}
console.log(`Raw main HTML length: ${mainHtml.length} chars.`);

// ---------------------------------------------------------------------------
// 5. Remove dynamic post template and pagination — inject slot marker
// ---------------------------------------------------------------------------
mainHtml = removePostTemplateAndPagination(mainHtml);
console.log(`Cleaned main HTML length: ${mainHtml.length} chars.`);

// ---------------------------------------------------------------------------
// 6. Extract strings for CMS fields
// ---------------------------------------------------------------------------
// Featured posts heading
let featuredPostsHeading = "Watch, Read, Listen";
const watchMatch = mainHtml.match(/>([^<]*Watch[^<,]*(?:Read|Listen)[^<]*)</i);
if (watchMatch) featuredPostsHeading = watchMatch[1].trim();

// Subscribe heading
let subscribeHeading = "Join 900+ subscribers";
const subMatch = mainHtml.match(/>([^<]*Join [^<]*subscribers[^<]*)</i);
if (subMatch) subscribeHeading = subMatch[1].trim();

// Subscribe subtext
let subscribeSubtext = "Stay in the loop with everything you need to know.";
const subtextMatch = mainHtml.match(/Stay in the loop[^<]*/i);
if (subtextMatch) subscribeSubtext = subtextMatch[0].trim();

const featuredPostsCta = "See all";

console.log(`featuredPostsHeading: ${featuredPostsHeading}`);
console.log(`subscribeHeading: ${subscribeHeading}`);

// ---------------------------------------------------------------------------
// 7. Upsert to Strapi single-type via PUT
// ---------------------------------------------------------------------------
const payload = {
  data: {
    siteTitle,
    bodyHtml: mainHtml,
    headStyles,
    themeStylesheets,
    featuredPostsHeading,
    featuredPostsCta,
    subscribeHeading,
    subscribeSubtext,
    footerHtml,
  },
};

console.log(`\nPUT ${STRAPI_URL}/api/home-page ...`);
const putRes = await fetch(`${STRAPI_URL}/api/home-page`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${STRAPI_API_TOKEN}`,
  },
  body: JSON.stringify(payload),
});

const putBodyText = await putRes.text();
if (!putRes.ok) {
  console.error(`Strapi PUT failed: ${putRes.status} ${putRes.statusText}`);
  console.error(putBodyText.slice(0, 1000));
  process.exit(1);
}

const result = JSON.parse(putBodyText);
console.log(`\nStrapi home-page seeded successfully.`);
console.log(`  siteTitle: ${result?.data?.siteTitle ?? "(unknown)"}`);
console.log(`  featuredPostsHeading: ${result?.data?.featuredPostsHeading ?? "(unknown)"}`);
console.log(`  subscribeHeading: ${result?.data?.subscribeHeading ?? "(unknown)"}`);
console.log(`  bodyHtml chars: ${(result?.data?.bodyHtml ?? "").length}`);
console.log(`  footerHtml chars: ${(result?.data?.footerHtml ?? "").length}`);
console.log(`\nDone.`);
