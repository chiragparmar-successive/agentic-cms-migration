import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LOG = '[wp-hooks]';

function resolveHookPath(config, hookPath) {
  if (!hookPath) return null;
  return path.isAbsolute(hookPath)
    ? hookPath
    : path.resolve(config.migrationDir, hookPath);
}

/**
 * Executes optional site-specific hook from output/<site>/wp-migration/scripts.
 * Hook module default export receives context object and may mutate files/config.
 *
 * @param {object} config
 * @param {string} hookName
 * @param {object} context
 */
export async function runHook(config, hookName, context = {}) {
  const hookRelPath = config.hooks?.[hookName];
  if (!hookRelPath) return { executed: false };

  const hookPath = resolveHookPath(config, hookRelPath);
  if (!hookPath) return { executed: false };

  try {
    await fs.access(hookPath);
  } catch {
    throw new Error(
      `${hookName} configured but file missing: ${hookPath}`
    );
  }

  const mod = await import(pathToFileURL(hookPath).href);
  const hookFn = mod.default;
  if (typeof hookFn !== 'function') {
    throw new Error(`${hookName} must default-export a function (${hookPath})`);
  }

  console.log(`${LOG} run ${hookName}: ${hookPath}`);
  await hookFn({
    ...context,
    config,
    migrationDir: config.migrationDir,
    hookName,
  });
  return { executed: true, hookPath };
}
