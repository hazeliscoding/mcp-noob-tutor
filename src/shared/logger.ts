export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Minimal logging interface used across the project.
 *
 * Note: `meta` is intentionally `unknown` for now. As the project grows,
 * you can tighten this to a structured record type.
 */
export interface Logger {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
}

/**
 * Writes a single log line.
 *
 * Format: `[ISO_TIMESTAMP] LEVEL message` and optionally a `meta` object.
 * Keeping it simple makes it easier to read while learning.
 */
function log(level: LogLevel, msg: string, meta?: unknown) {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${msg}`;
  if (meta !== undefined) {
    // Keep it simple for now; later we can do structured logs.
    console.log(line, meta);
  } else {
    console.log(line);
  }
}

/**
 * Shared logger instance.
 *
 * Swap this out later (pino/winston/etc.) without changing call sites.
 */
export const logger: Logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
