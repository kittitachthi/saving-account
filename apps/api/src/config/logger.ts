import pino from "pino";
import type { ApiConfig } from "./config.js";

export function createLogger(config: ApiConfig) {
  return pino({
    level: config.logLevel,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "databaseUrl",
        "sessionToken",
        "invitationToken",
      ],
      censor: "[REDACTED]",
    },
  });
}
