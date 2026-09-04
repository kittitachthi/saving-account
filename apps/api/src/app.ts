import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { randomUUID } from "node:crypto";
import pino, { type Logger } from "pino";

type AppDependencies = {
  checkDatabase: () => Promise<void> | void;
  logger?: Logger;
  registerRoutes?: (app: Express) => void;
};

export function createApp({
  checkDatabase,
  logger = pino({ level: "silent" }),
  registerRoutes,
}: AppDependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use((request, response, next) => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    response.on("finish", () => {
      logger.info(
        {
          requestId,
          method: request.method,
          route: request.route?.path ?? "unmatched",
          statusCode: response.statusCode,
        },
        "request completed",
      );
    });
    next();
  });

  registerRoutes?.(app);

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
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof SyntaxError && "body" in error) {
        response.status(400).json({
          error: { code: "BAD_REQUEST", message: "Invalid request" },
        });
        return;
      }

      logger.error(
        {
          event: "unhandled_request_error",
          requestId: response.locals.requestId,
          errorName: error instanceof Error ? error.name : "UnknownError",
        },
        "unexpected server error",
      );
      response.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected server error",
        },
      });
    },
  );

  return app;
}
