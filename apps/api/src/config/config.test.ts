import { describe, expect, it } from "vitest";
import { parseConfig } from "./config.js";

const validEnvironment = {
  NODE_ENV: "test",
  PORT: "3000",
  DATABASE_URL:
    "postgresql://saving_account:test@localhost:5432/saving_account_test",
  APP_ORIGIN: "http://localhost:5173",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:5173/api/auth/google/callback",
  LOG_LEVEL: "silent",
};

describe("API configuration", () => {
  it("parses a complete environment", () => {
    expect(parseConfig(validEnvironment)).toEqual({
      nodeEnv: "test",
      port: 3000,
      databaseUrl: validEnvironment.DATABASE_URL,
      appOrigin: validEnvironment.APP_ORIGIN,
      googleClientId: validEnvironment.GOOGLE_CLIENT_ID,
      googleClientSecret: validEnvironment.GOOGLE_CLIENT_SECRET,
      googleRedirectUri: validEnvironment.GOOGLE_REDIRECT_URI,
      logLevel: "silent",
    });
  });

  it("rejects a Google callback outside the Public Application Origin", () => {
    expect(() =>
      parseConfig({
        ...validEnvironment,
        GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
      }),
    ).toThrow("Invalid API configuration: GOOGLE_REDIRECT_URI");
  });

  it("requires HTTPS for a production Public Application Origin", () => {
    expect(() =>
      parseConfig({ ...validEnvironment, NODE_ENV: "production" }),
    ).toThrow("Invalid API configuration: APP_ORIGIN");
  });

  it("fails fast without printing secret values", () => {
    const secret = "postgresql://user:do-not-print@localhost/database";

    expect(() =>
      parseConfig({
        ...validEnvironment,
        PORT: "invalid",
        DATABASE_URL: secret,
      }),
    ).toThrow("Invalid API configuration: PORT");
    try {
      parseConfig({
        ...validEnvironment,
        PORT: "invalid",
        DATABASE_URL: secret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});
