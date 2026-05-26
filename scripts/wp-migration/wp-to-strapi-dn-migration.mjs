#!/usr/bin/env node
/**
 * /wp-to-strapi-db-migration — Data-only full migration.
 *
 * Imports the complete WordPress dataset into existing Strapi schemas.
 * Does NOT run detect, review, or generate-schema (content modeling is skipped).
 *
 * Prerequisite: /wordpress-to-strapi completed (schemas + partial data reviewed).
 *
 * Usage:
 *   node scripts/wp-migration/wp-to-strapi-db-migration.mjs <site-slug> <wordpress-url>
 *   node scripts/wp-migration/wp-to-strapi-db-migration.mjs <site-slug> <wordpress-url> --import
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireStrapiEnv } from "./lib/env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const LOG = "[wp-to-strapi-db-migration]";

const [, , siteSlug, wpUrl, ...rest] = process.argv;
const doImport = rest.includes("--import");

if (!siteSlug || !wpUrl) {
  console.error(
    `Usage: node scripts/wp-migration/wp-to-strapi-db-migration.mjs <site-slug> <wordpress-url> [--import]`,
  );
  process.exit(1);
}

function runNode(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${path.basename(script)} exited ${code}`)),
    );
  });
}

async function main() {
  const pipeline = path.join(__dirname, "pipeline.mjs");
  const importFull = path.join(__dirname, "import-full-to-strapi.mjs");

  console.log(`${LOG} Data-only migration (no content modeling)`);
  console.log(`${LOG} Skipped: detect, review, generate-schema`);
  console.log(`${LOG} (1/2) Full WordPress extract → normalize`);
  await runNode(pipeline, [siteSlug, wpUrl, "all", "--full"]);

  if (!doImport) {
    console.log("");
    console.log(`${LOG} Next: import full dataset into Strapi`);
    console.log(
      `  STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/wp-migration/wp-to-strapi-db-migration.mjs ${siteSlug} ${wpUrl} --import`,
    );
    return;
  }

  requireStrapiEnv();
  console.log(`${LOG} (2/2) Import full dataset into Strapi`);
  await runNode(importFull, [siteSlug]);
  console.log(`${LOG} Full data migration complete.`);
}

main().catch((err) => {
  console.error(`${LOG} FAILED`, err.message);
  process.exit(1);
});
