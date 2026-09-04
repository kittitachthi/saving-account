import type { Express, Request, Response } from "express";
import {
  AuthenticationRejectedError,
  type AuthService,
} from "./auth.service.js";

const SESSION_COOKIE = "saving_account_session";

function readCookie(request: Request, name: string) {
  const cookies = request.header("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
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
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
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
    const user = token ? await auth.authenticate(token) : null;
    if (!user) {
      response.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Sign in required" },
      });
      return;
    }
    response.json({ user });
  });

  app.post("/api/auth/logout", async (request, response) => {
    const token = readCookie(request, SESSION_COOKIE);
    if (token) await auth.logout(token);
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "lax",
      path: "/",
    });
    response.status(204).end();
  });
}
