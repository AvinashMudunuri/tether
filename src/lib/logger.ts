/**
 * Structured logger for local dev and Vercel.
 * Outputs JSON in production for log aggregation; readable format locally.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function formatMessage(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `[${entry.ts}] ${level.toUpperCase()}: ${msg}${metaStr}`;
}

export const logger = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", msg, meta));
    }
  },
  info(msg: string, meta?: Record<string, unknown>) {
    console.info(formatMessage("info", msg, meta));
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    console.warn(formatMessage("warn", msg, meta));
  },
  error(msg: string, meta?: Record<string, unknown>) {
    console.error(formatMessage("error", msg, meta));
  },
};
