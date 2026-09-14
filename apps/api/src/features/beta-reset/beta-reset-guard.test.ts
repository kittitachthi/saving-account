import { describe, expect, it } from "vitest";
import { betaResetTargetAssert } from "./beta-reset-guard.js";

describe("beta reset guard", () => {
  it("accepts only a non-production beta target with the exact database name", () => {
    const valid = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://localhost/pocka_beta",
      BETA_RESET_TARGET: "beta",
      BETA_RESET_DATABASE: "pocka_beta",
    };
    expect(betaResetTargetAssert(valid).pathname).toBe("/pocka_beta");
    for (const environment of [
      { ...valid, NODE_ENV: "production" },
      { ...valid, BETA_RESET_TARGET: "production" },
      { ...valid, BETA_RESET_DATABASE: "pocka_production" },
    ]) {
      expect(() => betaResetTargetAssert(environment)).toThrow(
        "Beta reset refused",
      );
    }
  });
});
