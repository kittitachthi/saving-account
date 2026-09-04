import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import { registerBetaWaitlistRoutes } from "./beta-waitlist.routes.js";
import { BetaWaitlistService } from "./beta-waitlist.service.js";

function testApp(requestAccess = vi.fn().mockResolvedValue(undefined)) {
  return {
    app: createApp({
      checkDatabase: vi.fn(),
      registerRoutes: (app) =>
        registerBetaWaitlistRoutes(
          app,
          new BetaWaitlistService({ requestAccess }),
        ),
    }),
    requestAccess,
  };
}

describe("Beta Waitlist HTTP API", () => {
  it("normalizes and accepts a consented request", async () => {
    const { app, requestAccess } = testApp();
    const response = await request(app).post("/api/beta/waitlist").send({
      email: " Friend@Example.COM ",
      consent: true,
      consentVersion: "2026-09-04",
    });

    expect(response.status).toBe(202);
    expect(requestAccess).toHaveBeenCalledWith(
      "friend@example.com",
      "2026-09-04",
    );
  });

  it("rejects invalid email, absent consent and unknown fields", async () => {
    const { app, requestAccess } = testApp();
    const response = await request(app).post("/api/beta/waitlist").send({
      email: "not-an-email",
      consent: false,
      consentVersion: "2026-09-04",
      status: "APPROVED",
    });

    expect(response.status).toBe(400);
    expect(requestAccess).not.toHaveBeenCalled();
  });

  it("returns the same neutral result for repeated requests", async () => {
    const { app, requestAccess } = testApp();
    const payload = {
      email: "friend@example.com",
      consent: true,
      consentVersion: "2026-09-04",
    };
    const first = await request(app).post("/api/beta/waitlist").send(payload);
    const second = await request(app).post("/api/beta/waitlist").send(payload);

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(first.body).toEqual(second.body);
    expect(requestAccess).toHaveBeenCalledTimes(2);
  });

  it("rate limits repeated requests without exposing email state", async () => {
    const { app } = testApp();
    const payload = {
      email: "friend@example.com",
      consent: true,
      consentVersion: "2026-09-04",
    };
    for (let index = 0; index < 5; index += 1) {
      expect(
        (await request(app).post("/api/beta/waitlist").send(payload)).status,
      ).toBe(202);
    }
    const limited = await request(app).post("/api/beta/waitlist").send(payload);
    expect(limited.status).toBe(429);
    expect(JSON.stringify(limited.body)).not.toContain("friend@example.com");
  });
});
