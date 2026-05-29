/**
 * Structured console + file logging (emoji) for quality and analysis scripts.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export const LOG_ICONS = {
  ok: '✅',
  fail: '❌',
  skip: '⏭️',
  warn: '⚠️',
  info: 'ℹ️',
  shot: '📸',
  compare: '🔍',
  gate: '🚦',
};

const ICON = LOG_ICONS;

/**
 * @param {string} prefix
 * @param {{ logFile?: string }} [options]
 */
export function createEmojiLogger(prefix = '[script]', options = {}) {
  const stats = { ok: 0, fail: 0, skip: 0 };
  const buffer = [];
  const { logFile } = options;

  function capture(level, line) {
    const stamped = `[${new Date().toISOString()}] ${line}`;
    buffer.push(stamped);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  function line(icon, message) {
    capture('log', `${prefix} ${icon} ${message}`);
  }

  return {
    stats,
    logFile,

    async beginRun(title) {
      if (!logFile) return;
      await fs.mkdir(path.dirname(logFile), { recursive: true });
      await fs.appendFile(
        logFile,
        `\n${'='.repeat(72)}\n[${new Date().toISOString()}] ${title}\n${'='.repeat(72)}\n`
      );
    },

    async flush() {
      if (!logFile || buffer.length === 0) return;
      await fs.mkdir(path.dirname(logFile), { recursive: true });
      await fs.appendFile(logFile, `${buffer.join('\n')}\n`);
      buffer.length = 0;
    },

    banner(title) {
      capture('log', '');
      capture('log', `${prefix} ${'─'.repeat(56)}`);
      capture('log', `${prefix} ${title}`);
      capture('log', `${prefix} ${'─'.repeat(56)}`);
    },

    step(current, total, message) {
      capture('log', `${prefix} (${current}/${total}) ${message}`);
    },

    info(message) {
      line(ICON.info, message);
    },

    emoji(icon, message, level = 'log') {
      capture(level, `${prefix} ${icon} ${message}`);
    },

    warn(message) {
      capture('warn', `${prefix} ${ICON.warn} ${message}`);
    },

    ok(entity, label, detail = '') {
      stats.ok += 1;
      const extra = detail ? ` — ${detail}` : '';
      line(ICON.ok, `${entity} ${label}${extra}`);
    },

    fail(entity, label, error) {
      stats.fail += 1;
      const msg = error instanceof Error ? error.message : String(error);
      capture('error', `${prefix} ${ICON.fail} ${entity} ${label} — ${msg}`);
      return msg;
    },

    skip(entity, label, reason = 'cached') {
      stats.skip += 1;
      line(ICON.skip, `${entity} ${label} — ${reason}`);
    },

    summary(rows) {
      capture('log', '');
      capture('log', `${prefix} ${'─'.repeat(56)}`);
      capture('log', `${prefix} Summary`);
      for (const [k, v] of rows) {
        capture('log', `${prefix}   ${k}: ${v}`);
      }
      capture(
        'log',
        `${prefix}   results: ${ICON.ok} ${stats.ok} ok | ${ICON.fail} ${stats.fail} failed | ${ICON.skip} ${stats.skip} skipped`
      );
      capture('log', `${prefix} ${'─'.repeat(56)}`);
    },
  };
}
