// ═══════════════════════════════════════════════════════════════════════════════
// Logger — Pino-based structured logging
// ═══════════════════════════════════════════════════════════════════════════════

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
  base: { service: "plantmind-ai" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(module: string) {
  return logger.child({ module });
}
