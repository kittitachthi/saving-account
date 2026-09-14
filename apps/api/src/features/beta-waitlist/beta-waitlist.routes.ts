import type { Express, Request } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import {
  BetaWaitlistService,
  CURRENT_WAITLIST_CONSENT_VERSION,
} from "./beta-waitlist.service.js";

const requestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    consent: z.literal(true),
    consentVersion: z.literal(CURRENT_WAITLIST_CONSENT_VERSION),
  })
  .strict();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

export function registerBetaWaitlistRoutes(
  app: Express,
  service: BetaWaitlistService,
  appOrigin = "http://localhost:5173",
) {
  const attempts = new Map<string, number[]>();

  const betaWaitlistRateLimitReject = (request: Request) => {
    const now = Date.now();
    const key = request.ip ?? "unknown";
    const recent = (attempts.get(key) ?? []).filter(
      (time) => now - time < WINDOW_MS,
    );
    if (recent.length >= MAX_REQUESTS) return true;
    attempts.set(key, [...recent, now]);
    return false;
  };

  app.post("/api/beta/waitlist", async (request: Request, response) => {
    if (betaWaitlistRateLimitReject(request)) {
      response.status(429).json({
        error: { code: "RATE_LIMITED", message: "Please try again later" },
      });
      return;
    }
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: { code: "INVALID_WAITLIST_REQUEST", message: "Invalid request" },
      });
      return;
    }

    await service.requestAccess(parsed.data.email, parsed.data.consentVersion);
    response.status(202).json({
      message: "If eligible, you will be contacted at this email",
    });
  });

  app.post("/api/beta/waitlist/withdrawals", async (request, response) => {
    if (betaWaitlistRateLimitReject(request)) {
      return void response.status(429).json({
        error: { code: "RATE_LIMITED", message: "Please try again later" },
      });
    }
    const parsed = z
      .object({ email: z.string().trim().toLowerCase().email().max(254) })
      .strict()
      .safeParse(request.body);
    if (!parsed.success)
      return void response.status(400).json({
        error: {
          code: "INVALID_WAITLIST_REQUEST",
          message: "Invalid request",
        },
      });
    const token = randomBytes(32).toString("base64url");
    await service.betaWaitlistWithdrawalRequest(
      parsed.data.email,
      createHash("sha256").update(token).digest("hex"),
      `${appOrigin}/?waitlistWithdrawal=${encodeURIComponent(token)}`,
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );
    response.status(202).json({
      message: "If eligible, withdrawal instructions will be emailed",
    });
  });

  app.post(
    "/api/beta/waitlist/withdrawals/consume",
    async (request, response) => {
      const parsed = z
        .object({ token: z.string().min(32).max(500) })
        .strict()
        .safeParse(request.body);
      if (!parsed.success)
        return void response.status(400).json({
          error: { code: "INVALID_WITHDRAWAL", message: "Invalid request" },
        });
    await service.betaWaitlistWithdrawalConsume(
        createHash("sha256").update(parsed.data.token).digest("hex"),
      );
      response.status(204).end();
    },
  );
}
