/**
 * Structured logger for local dev and Vercel.
 * Outputs JSON in production for log aggregation; readable format locally.
 * Sends errors to Sentry when SENTRY_DSN is set.
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

async function captureToSentry(
  level: "warn" | "error",
  msg: string,
  meta?: Record<string, unknown>,
  err?: unknown
) {
  try {
    const { captureMessage, captureException } = await import("@sentry/nextjs");
    if (err instanceof Error) {
      captureException(err, { extra: { msg, ...meta } });
    } else if (level === "error") {
      captureMessage(msg, { level: "error", extra: meta });
    } else {
      captureMessage(msg, { level: "warning", extra: meta });
    }
  } catch {
    // Sentry not configured or failed to load
  }
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
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void captureToSentry("warn", msg, meta);
    }
  },
  error(msg: string, meta?: Record<string, unknown>, err?: unknown) {
    console.error(formatMessage("error", msg, meta));
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void captureToSentry("error", msg, meta, err);
    }
  },
};
