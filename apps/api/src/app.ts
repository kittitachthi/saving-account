import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import pino, { type Logger } from "pino";

type AppDependencies = {
  checkDatabase: () => Promise<void> | void;
  logger?: Logger;
};

export function createApp({
  checkDatabase,
  logger = pino({ level: "silent" }),
}: AppDependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use((request, response, next) => {
    response.on("finish", () => {
      logger.info(
        { method: request.method, statusCode: response.statusCode },
        "request completed",
      );
    });
    next();
  });

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/readiness", async (_request, response) => {
    try {
      await checkDatabase();
      response.json({ status: "ready" });
    } catch {
      logger.warn(
        { event: "database_readiness_failed" },
        "service is not ready",
      );
      response.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Service is not ready",
        },
      });
    }
  });

  app.use((_request, response) => {
    response.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  app.use(
    (
      _error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      response.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid request" },
      });
    },
  );

  return app;
}
