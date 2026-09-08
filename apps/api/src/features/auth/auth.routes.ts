import type { Express, Request, Response } from "express";
import {
  AuthenticationRejectedError,
  type AuthService,
} from "./auth.service.js";
import { requireSameOriginMutation } from "./csrf.js";

const SESSION_COOKIE = "saving_account_session";

function readCookie(request: Request, name: string) {
  const cookies = request.header("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

type AuthRouteConfig = {
  appOrigin: string;
  googleRedirectUri: string;
  secureCookies: boolean;
};

function callbackUrl(request: Request, googleRedirectUri: string) {
  const callback = new URL(googleRedirectUri);
  callback.search = new URL(request.originalUrl, callback).search;
  return callback;
}

function rejectAuthentication(response: Response) {
  response.status(403).json({
    error: {
      code: "AUTHENTICATION_REJECTED",
      message: "This account cannot sign in",
    },
  });
}

export function registerAuthRoutes(
  app: Express,
  auth: AuthService,
  config: AuthRouteConfig,
) {
  const cookieOptions = {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax" as const,
    path: "/",
  };
  const requireCsrf = requireSameOriginMutation(config.appOrigin);
  const rejectSession = (response: Response) =>
    response.status(401).json({
      error: { code: "UNAUTHENTICATED", message: "Sign in required" },
    });
  app.use("/api/auth", (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.get("/api/auth/google/start", async (request, response) => {
    const result = await auth.begin(
      typeof request.query.returnTo === "string" ? request.query.returnTo : "/",
    );
    response.redirect(result.authorizationUrl);
  });

  app.get("/api/auth/google/callback", async (request, response) => {
    if (typeof request.query.state !== "string") {
      rejectAuthentication(response);
      return;
    }

    try {
      const result = await auth.complete(
        callbackUrl(request, config.googleRedirectUri),
        request.query.state,
      );
      response.cookie(SESSION_COOKIE, result.sessionToken, {
        ...cookieOptions,
        expires: result.expiresAt,
      });
      response.redirect(new URL(result.returnTo, config.appOrigin).href);
    } catch (error) {
      if (error instanceof AuthenticationRejectedError) {
        rejectAuthentication(response);
        return;
      }
      throw error;
    }
  });

  app.get("/api/auth/session", async (request, response) => {
    const token = readCookie(request, SESSION_COOKIE);
    const session = token ? await auth.authenticate(token) : null;
    if (!session) {
      rejectSession(response);
      return;
    }
    response.json(session);
  });

  app.post(
    "/api/auth/session/renew",
    requireCsrf,
    async (request, response) => {
      const token = readCookie(request, SESSION_COOKIE);
      const session = token ? await auth.renew(token) : null;
      if (!session) {
        rejectSession(response);
        return;
      }
      response.cookie(SESSION_COOKIE, token, {
        ...cookieOptions,
        expires: session.expiresAt,
      });
      response.json(session);
    },
  );

  app.post("/api/auth/logout", requireCsrf, async (request, response) => {
    const token = readCookie(request, SESSION_COOKIE);
    if (!token || !(await auth.logout(token))) {
      rejectSession(response);
      return;
    }
    response.clearCookie(SESSION_COOKIE, cookieOptions);
    response.status(204).end();
  });
}
