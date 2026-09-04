import { config as loadEnvironment } from "dotenv";
import { createApp } from "./app.js";
import { parseConfig } from "./config/config.js";
import { createLogger } from "./config/logger.js";
import { createDatabase } from "./infrastructure/db/database.js";
import { registerAuthRoutes } from "./features/auth/auth.routes.js";
import { AuthService } from "./features/auth/auth.service.js";
import { createGoogleIdentityProvider } from "./features/auth/google-identity-provider.js";
import { PrismaAuthRepository } from "./features/auth/prisma-auth.repository.js";
import { registerBetaWaitlistRoutes } from "./features/beta-waitlist/beta-waitlist.routes.js";
import {
  BetaWaitlistService,
  PrismaBetaWaitlistRepository,
} from "./features/beta-waitlist/beta-waitlist.service.js";
import { createNotificationWorker } from "./features/notifications/notification-worker.js";
import { createSmtpEmailTransport } from "./features/notifications/smtp-email-transport.js";

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
const betaWaitlist = new BetaWaitlistService(
  new PrismaBetaWaitlistRepository(database.client),
);
const notificationWorker = config.smtp
  ? createNotificationWorker({
      client: database.client,
      transport: createSmtpEmailTransport(config.smtp),
      appOrigin: config.appOrigin,
      logger,
    })
  : null;
const app = createApp({
  checkDatabase: () => database.checkConnection(),
  logger,
  registerRoutes: (app) => {
    registerAuthRoutes(app, auth, {
      appOrigin: config.appOrigin,
      googleRedirectUri: config.googleRedirectUri,
      secureCookies: config.nodeEnv === "production",
    });
    registerBetaWaitlistRoutes(app, betaWaitlist);
  },
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "API listening");
  notificationWorker?.start();
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  notificationWorker?.stop();
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
