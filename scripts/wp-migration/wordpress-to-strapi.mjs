#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseOrchestratorFlags,
  formatOrchestratorPlan,
} from "./lib/orchestrator-flags.mjs";
import { writeJson, wpMigrationDir } from "./lib/utils.mjs";
import { initSiteConfig, syncSiteConfigFromAnalysis } from "./lib/site-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const LOG = "[wordpress-to-strapi]";

const [, , siteSlug, wpUrl] = process.argv;
const flags = parseOrchestratorFlags(process.argv);

if (!siteSlug || !wpUrl) {
  console.error(
    "Usage: node scripts/wp-migration/wordpress-to-strapi.mjs <site-slug> <wordpress-url> [--cms-only] [--skip-tests]",
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
  await initSiteConfig({ siteSlug, wordpressUrl: wpUrl });

  await writeJson(
    path.join(wpMigrationDir(siteSlug), "orchestrator-plan.json"),
    {
      generatedAt: new Date().toISOString(),
      siteSlug,
      wordpressUrl: wpUrl,
      ...flags,
    },
  );

  console.log(`${LOG} Orchestrator plan:
${formatOrchestratorPlan(flags)}
`);

  const pipeline = path.join(__dirname, "pipeline.mjs");
  const schema = path.join(__dirname, "generate-schema.mjs");

  console.log(`${LOG} Phase W — content model + preview extract`);
  await runNode(pipeline, [siteSlug, wpUrl, "all", "--preview"]);

  await syncSiteConfigFromAnalysis(siteSlug);
  await runNode(schema, [siteSlug]);

  console.log(
    `${LOG} CMS scripts done. Restart Strapi, apply schemas, then run content-etl-pipeline for sample/full content.`,
  );
  printPostWInstructions(siteSlug, flags);
}

function printPostWInstructions(siteSlug, flags) {
  if (flags.cmsOnly) {
    console.log(
      `${LOG} --cms-only: skip Phase B (tests), D (frontend), E (quality). Done.`,
    );
    return;
  }
  console.log("");
  console.log(`${LOG} Next — orchestrator must run (not this script):`);
  console.log(
    `  Phase C: content-etl-pipeline — load sample/full content into Strapi`,
  );
  if (flags.runTests) {
    console.log("  Phase B: .claude/commands/PB-test.md");
  }
  if (flags.runFrontend) {
    console.log(
      "  Phase D: nextjs-scaffolder → cms-adapter-generator → page-component-generator → route-validator",
    );
    console.log(`       → creates output/${siteSlug}/frontend/`);
  }
  if (flags.runQualityGates) {
    console.log(
      "  Phase E: frontend-visual-parity, playwright-behavioral-parity, sonarqube, lighthouse",
    );
  }
}

main().catch((err) => {
  console.error(`${LOG} FAILED`, err.message);
  process.exit(1);
});
