---
name: playwright-exploratory
description: Exploratory crawl skill that navigates every link on a site, captures full-page screenshots and text content as a baseline, handles new windows/tabs, and generates a replayable Playwright test suite from the captured baseline.
argument-hint: "<mode> <url>"
user-invocable: true
---

# Playwright Exploratory Crawl Skill

This skill has two modes:

- `crawl <url>` — navigate every link, capture screenshots + text as a baseline
- `replay <site-slug>` — re-run the same crawl against the saved baseline and diff any changes

Output lives under `output/<site>/test/exploratory/`.

---

## When to Use

Use this before writing structured test plans when you want to:

- Understand the full surface area of a site you have never seen
- Capture a visual + textual baseline to detect regressions after a deploy
- Discover routes, modals, and flows that would otherwise be missed during manual planning
- Generate a seed set of replayable smoke checks from real navigation behavior

The crawl output feeds directly into `playwright-test-lifecycle plan` mode — use the route inventory it produces as the starting point for writing detailed scenarios.

---

## Output Layout

```
output/<site>/test/exploratory/
  baseline/
    index.json                  # Crawl manifest: all visited URLs, titles, link counts
    <slug>/
      screenshot.png            # Full-page screenshot at time of crawl
      text.txt                  # All visible text extracted from the page
      links.json                # All outbound links found on this page
      new-windows.json          # Links that opened a new tab/window (if any)
  replay/
    <timestamp>/
      diff-report.md            # Markdown diff: added/removed text, changed titles
      <slug>/
        screenshot.png          # Screenshot from replay run
        text.txt                # Text from replay run
  specs/
    exploratory-crawl.spec.ts   # Generated Playwright spec that replays the crawl
```

---

## Mode: crawl

### Workflow

1. Normalise the URL (add `https://` if missing). Derive `<site>` slug from hostname.
2. Create output directory: `output/<site>/test/exploratory/baseline/`.
3. Open a single browser context. Keep it open for the entire crawl so cookies/session state persist across pages.
4. Start at the root URL. Maintain a visited set and a pending queue.
5. For each page in the queue:

   a. **Navigate** to the URL and wait for `domcontentloaded`.

   b. **Handle new windows**: before clicking any link, attach a `page.context().on('page', ...)` listener. If a click opens a new tab, capture that tab's URL, title, screenshot, and text — then close it and return focus to the main page.

   c. **Capture screenshot**: full-page PNG saved to `baseline/<slug>/screenshot.png`.

   d. **Extract text**: call `page.evaluate(() => document.body.innerText)` and save to `baseline/<slug>/text.txt`. Strip repeated whitespace but preserve paragraph breaks.

   e. **Extract links**: collect all `<a href>` values via `page.evaluate`. Normalise to absolute URLs. Filter to same-origin only (cross-origin links are recorded in `links.json` but not followed). Save to `baseline/<slug>/links.json`.

   f. **Detect new-window links**: find all `<a target="_blank">` and `<a target="_blank" rel="noopener">` anchors. Record them in `new-windows.json` with href, link text, and whether the tab was successfully opened.

   g. **Add unvisited same-origin links** to the pending queue.

6. After all pages are visited, write `baseline/index.json`:

   ```json
   {
     "crawledAt": "<ISO timestamp>",
     "baseURL": "<url>",
     "totalPages": 12,
     "pages": [
       {
         "url": "https://example.com/",
         "slug": "root",
         "title": "Home – Example",
         "linkCount": 8,
         "newWindowLinks": 1,
         "screenshotPath": "baseline/root/screenshot.png",
         "textPath": "baseline/root/text.txt"
       }
     ]
   }
   ```

7. Generate `specs/exploratory-crawl.spec.ts` from the baseline (see Spec Generation below).

### Crawl limits

- Maximum **50 pages** per crawl session to prevent runaway execution.
- If more than 50 pages are discovered, stop at 50, log the uncrawled URLs in `baseline/index.json` under `"skipped"`, and surface the count to the user.
- Exclude: `mailto:`, `tel:`, `javascript:`, file downloads (`.pdf`, `.zip`, `.docx`, `.xlsx`), and URLs with query strings that are clearly pagination variants of an already-visited path.

### New window handling

```ts
// Attach before any navigation
context.on("page", async (newPage) => {
  await newPage.waitForLoadState("domcontentloaded");
  // capture screenshot and text of the new tab
  await newPage.screenshot({
    path: `baseline/${slug}/new-window-screenshot.png`,
    fullPage: true,
  });
  const text = await newPage.evaluate(() => document.body.innerText);
  // record in new-windows.json
  await newPage.close();
});
```

Always close new tabs after capturing. Never leave dangling contexts.

### Retry on navigation failure

If `page.goto()` throws or times out:

- Retry once after 2 seconds.
- If still failing, log the URL as `{ "status": "failed", "reason": "<error message>" }` in `index.json` and continue.
- Do not abort the full crawl for a single failed page.

---

## Mode: replay

### Workflow

1. Read `output/<site>/test/exploratory/baseline/index.json` to get the list of crawled pages.
2. Create `output/<site>/test/exploratory/replay/<timestamp>/`.
3. For each page in the baseline:

   a. Navigate to the URL.

   b. Capture screenshot and text using the same method as crawl.

   c. Diff text against baseline: report added lines, removed lines, and changed title.

   d. Save screenshot to `replay/<timestamp>/<slug>/screenshot.png`.

4. Write `replay/<timestamp>/diff-report.md`:

   ```markdown
   # Replay Diff — <site> — <timestamp>

   ## Summary

   - Pages checked: 12
   - Pages with text changes: 2
   - Pages with title changes: 1
   - Pages unreachable: 0

   ## Changes

   ### /about

   **Title changed**: "About Us" → "About"
   **Text removed**:

   - "Founded in 2010, we ..."
     **Text added**:
   - "Established in 2010, we ..."

   ### /contact

   **Text added**:

   - "New office: 123 Main Street"
   ```

5. Run `specs/exploratory-crawl.spec.ts` and report pass/fail.

---

## Spec Generation

After a successful crawl, generate `specs/exploratory-crawl.spec.ts`. This spec is a replayable smoke check — it does not assert exact text, only structural presence.

```ts
/**
 * Exploratory Crawl — <site>
 * Generated: <ISO timestamp>
 * Crawled pages: <n>
 *
 * This spec replays every page discovered during the baseline crawl.
 * It asserts: page loads (status 200), title is non-empty, body has visible text.
 * Run `replay` mode for full text/screenshot diffing.
 */
import { test, expect } from "@playwright/test";
import { logger } from "@utils/core";

const CRAWLED_PAGES = [
  { url: "/", title: "Home – Example", slug: "root" },
  { url: "/about", title: "About Us", slug: "about" },
  // ... one entry per crawled page from index.json
] as const;

for (const { url, title, slug } of CRAWLED_PAGES) {
  test(`[crawl] ${slug} — page loads and has content`, async ({ page }) => {
    await test.step(`Navigate to ${url}`, async () => {
      logger.info(`Replaying crawled page: ${url}`);
      const response = await page.goto(url);
      expect(response?.status()).toBeLessThan(400);
    });

    await test.step("Assert page title is non-empty", async () => {
      const pageTitle = await page.title();
      expect(pageTitle.trim().length).toBeGreaterThan(0);
    });

    await test.step("Assert body has visible text", async () => {
      const text = await page.evaluate(() => document.body.innerText.trim());
      expect(text.length).toBeGreaterThan(50);
    });
  });
}
```

### New-window spec entries

For each link recorded in `new-windows.json`, add a test that clicks the link, captures the popup, and asserts it loaded:

```ts
test(`[crawl] ${slug} — new-window link "${linkText}" opens and loads`, async ({
  page,
  context,
}) => {
  await page.goto(url);

  await test.step(`Click link that opens new window: "${linkText}"`, async () => {
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("link", { name: linkText }).click(),
    ]);
    await newPage.waitForLoadState("domcontentloaded");

    await test.step("Assert new window loaded", async () => {
      const status = await newPage.evaluate(() => document.readyState);
      expect(status).toBe("complete");
      const title = await newPage.title();
      expect(title.trim().length).toBeGreaterThan(0);
    });

    await newPage.close();
  });
});
```

---

## Conventions

All code follows the project POM conventions from `playwright-pom/SKILL.md`:

- Import `logger` from `@utils/core`.
- Use `test.step()` for every action group.
- No inline `page.locator()` in spec bodies — use `page.getByRole()` only for link clicks in crawl tests (acceptable since these are dynamically generated from crawl data, not from a page object).
- One `test()` per crawled page entry.
- Spec file lives at `output/<site>/test/exploratory/specs/exploratory-crawl.spec.ts`.

---

## Arguments

- `crawl <url>` — run a fresh baseline crawl against the given URL
- `replay <site-slug>` — re-run against existing baseline in `output/<site-slug>/test/exploratory/baseline/`

If the URL is missing for `crawl`, ask: `playwright-exploratory crawl <url>`
If the slug is missing for `replay`, ask: `playwright-exploratory replay <site-slug>`

---

## Output Contract

### For `crawl`

- `baseline/index.json` — manifest of all crawled pages
- `baseline/<slug>/screenshot.png` — full-page screenshot per page
- `baseline/<slug>/text.txt` — visible text per page
- `baseline/<slug>/links.json` — outbound links per page
- `baseline/<slug>/new-windows.json` — new-tab links per page (if any)
- `specs/exploratory-crawl.spec.ts` — replayable spec

### For `replay`

- `replay/<timestamp>/diff-report.md` — textual diff against baseline
- `replay/<timestamp>/<slug>/screenshot.png` — current screenshot per page
- Spec run result: passed / failed count

---

## Integration with Test Planning

After a crawl, feed the route inventory into the structured planning workflow:

1. Read `baseline/index.json` to get all URLs and titles.
2. Pass them to `playwright-test-lifecycle plan` as the starting route inventory.
3. The planner uses the crawl's link graph to avoid missing routes that are not in the main nav.

This makes exploratory crawl the natural first step before `playwright-test-gen`.

---

## Reference

- `.claude/skills/phase-b/playwright-pom/SKILL.md` — POM structure all generated code follows
- `.claude/skills/phase-b/playwright-test-lifecycle/SKILL.md` — plan / generate / heal lifecycle
- `.claude/skills/phase-b/playwright-test-gen/SKILL.md` — full orchestration workflow
