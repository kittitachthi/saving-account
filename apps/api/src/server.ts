import { config as loadEnvironment } from "dotenv";
import { createApp } from "./app.js";
import { parseConfig } from "./config/config.js";
import { createLogger } from "./config/logger.js";
import { createDatabase } from "./infrastructure/db/database.js";

loadEnvironment({ path: new URL("../../../.env", import.meta.url) });

const config = parseConfig(process.env);
const logger = createLogger(config);
const database = createDatabase(config.databaseUrl);
const app = createApp({
  checkDatabase: () => database.checkConnection(),
  logger,
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "API listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "API shutting down");
  server.close(async () => {
    await database.disconnect();
    process.exitCode = 0;
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
