#!/usr/bin/env node
/** @deprecated Use wp-to-strapi-db-migration.mjs */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "wp-to-strapi-db-migration.mjs",
);
const child = spawn(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 1));
