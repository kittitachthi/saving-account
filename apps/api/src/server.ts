import { config as loadEnvironment } from "dotenv";
import { createApp } from "./app.js";
import { parseConfig } from "./config/config.js";
import { createLogger } from "./config/logger.js";
import { createDatabase } from "./infrastructure/db/database.js";
import { registerAuthRoutes } from "./features/auth/auth.routes.js";
import { AuthService } from "./features/auth/auth.service.js";
import { createGoogleIdentityProvider } from "./features/auth/google-identity-provider.js";
import { PrismaAuthRepository } from "./features/auth/prisma-auth.repository.js";

loadEnvironment({ path: new URL("../../../.env", import.meta.url) });

const config = parseConfig(process.env);
const logger = createLogger(config);
const database = createDatabase(config.databaseUrl);
const auth = new AuthService(
  new PrismaAuthRepository(database.client),
  createGoogleIdentityProvider({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleRedirectUri,
  }),
);
const app = createApp({
  checkDatabase: () => database.checkConnection(),
  logger,
  registerRoutes: (app) =>
    registerAuthRoutes(app, auth, config.nodeEnv === "production"),
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "API listening");
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "API shutting down");

  const deadline = setTimeout(() => {
    logger.error({ signal }, "API shutdown deadline exceeded");
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);
  deadline.unref();

  server.close(async (error) => {
    await database.disconnect();
    clearTimeout(deadline);
    process.exitCode = error ? 1 : 0;
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
