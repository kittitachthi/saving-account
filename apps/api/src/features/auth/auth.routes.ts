import type { Express, Request, Response } from "express";
import {
  AuthenticationRejectedError,
  type AuthService,
} from "./auth.service.js";
import { requireSameOriginMutation } from "./csrf.js";

const SESSION_COOKIE = "saving_account_session";

export function readSessionToken(request: Request) {
  const cookies = request.header("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === SESSION_COOKIE) {
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

function authDeviceLabelDescribe(userAgent = "") {
  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "เบราว์เซอร์";
  const device = userAgent.includes("Android")
    ? "Android"
    : userAgent.includes("iPhone") || userAgent.includes("iPad")
      ? "iPhone/iPad"
      : userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Macintosh")
          ? "Mac"
          : userAgent.includes("Linux")
            ? "Linux"
            : "อุปกรณ์ไม่ทราบชนิด";
  return `${browser} บน ${device}`;
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
        authDeviceLabelDescribe(request.header("user-agent")),
      );
      response.cookie(SESSION_COOKIE, result.sessionToken, {
        ...cookieOptions,
        expires: result.expiresAt,
      });
      const returnUrl = new URL(result.returnTo, config.appOrigin);
      if (result.user.accountRecovered)
        returnUrl.searchParams.set("accountRecovered", "1");
      response.redirect(returnUrl.href);
    } catch (error) {
      if (error instanceof AuthenticationRejectedError) {
        rejectAuthentication(response);
        return;
      }
      throw error;
    }
  });

  app.get("/api/auth/session", async (request, response) => {
    const token = readSessionToken(request);
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
      const token = readSessionToken(request);
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
    const token = readSessionToken(request);
    if (!token || !(await auth.logout(token))) {
      rejectSession(response);
      return;
    }
    response.clearCookie(SESSION_COOKIE, cookieOptions);
    response.status(204).end();
  });

  app.get("/api/auth/sessions", async (request, response) => {
    const token = readSessionToken(request);
    const sessions = token ? await auth.authSessionsList(token) : [];
    if (!token || sessions.length === 0) return void rejectSession(response);
    response.json(sessions);
  });

  app.delete(
    "/api/auth/sessions/:sessionId",
    requireCsrf,
    async (request, response) => {
      const token = readSessionToken(request);
      const sessionId = request.params.sessionId;
      if (
        !token ||
        typeof sessionId !== "string" ||
        !(await auth.authSessionRevoke(token, sessionId))
      )
        return void response.status(404).json({
          error: { code: "SESSION_NOT_FOUND", message: "Session not found" },
        });
      response.status(204).end();
    },
  );

  app.delete("/api/auth/sessions", requireCsrf, async (request, response) => {
    const token = readSessionToken(request);
    if (!token || !(await auth.authSessionsRevokeAll(token)))
      return void rejectSession(response);
    response.clearCookie(SESSION_COOKIE, cookieOptions);
    response.status(204).end();
  });

  app.post(
    "/api/auth/account/deletion",
    requireCsrf,
    async (request, response) => {
      const token = readSessionToken(request);
      if (!token || !(await auth.accountDeletionRequest(token)))
        return void rejectSession(response);
      response.clearCookie(SESSION_COOKIE, cookieOptions);
      response.status(204).end();
    },
  );
}
