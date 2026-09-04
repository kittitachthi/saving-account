import type { Express, Request } from "express";
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
) {
  const attempts = new Map<string, number[]>();

  app.post("/api/beta/waitlist", async (request: Request, response) => {
    const now = Date.now();
    const key = request.ip ?? "unknown";
    const recent = (attempts.get(key) ?? []).filter(
      (time) => now - time < WINDOW_MS,
    );
    if (recent.length >= MAX_REQUESTS) {
      response.status(429).json({
        error: { code: "RATE_LIMITED", message: "Please try again later" },
      });
      return;
    }
    recent.push(now);
    attempts.set(key, recent);

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
}
