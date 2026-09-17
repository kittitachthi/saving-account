import request from "supertest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("API operational endpoints", () => {
  it("reports liveness without exposing configuration", async () => {
    const response = await request(createApp({ checkDatabase: vi.fn() })).get(
      "/api/health",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(JSON.stringify(response.body)).not.toContain("DATABASE_URL");
  });

  it("reports readiness after checking the database", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(undefined);
    const response = await request(createApp({ checkDatabase })).get(
      "/api/readiness",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ready" });
    expect(checkDatabase).toHaveBeenCalledOnce();
  });

  it("returns a safe unavailable response when the database is down", async () => {
    const response = await request(
      createApp({
        checkDatabase: vi.fn().mockRejectedValue(new Error("secret database")),
      }),
    ).get("/api/readiness");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: { code: "SERVICE_UNAVAILABLE", message: "Service is not ready" },
    });
    expect(JSON.stringify(response.body)).not.toContain("secret database");
  });

  it("uses the standard error shape for unknown routes", async () => {
    const response = await request(createApp({ checkDatabase: vi.fn() })).get(
      "/api/missing",
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  it("serves the production Web build and preserves API 404 responses", async () => {
    const webBuildDirectory = await mkdtemp(join(tmpdir(), "pocka-web-"));
    temporaryDirectories.push(webBuildDirectory);
    await writeFile(
      join(webBuildDirectory, "index.html"),
      '<main id="root">Pocka</main>',
    );
    await writeFile(join(webBuildDirectory, "app.js"), "window.Pocka = true;");
    const app = createApp({
      checkDatabase: vi.fn(),
      webBuildDirectory,
    });

    const home = await request(app).get("/");
    const clientRoute = await request(app).get("/settings");
    const asset = await request(app).get("/app.js");
    const missingApi = await request(app).get("/api/missing");

    expect(home.status).toBe(200);
    expect(home.text).toContain("Pocka");
    expect(clientRoute.status).toBe(200);
    expect(clientRoute.text).toContain("Pocka");
    expect(asset.status).toBe(200);
    expect(asset.text).toContain("window.Pocka");
    expect(missingApi.status).toBe(404);
    expect(missingApi.body.error.code).toBe("NOT_FOUND");
  });

  it("distinguishes invalid JSON from an unexpected server error", async () => {
    const app = createApp({
      checkDatabase: vi.fn(),
      registerRoutes: (router) => {
        router.get("/api/failure", () => {
          throw new Error("database password must stay private");
        });
      },
    });

    const invalidJson = await request(app)
      .post("/api/missing")
      .set("content-type", "application/json")
      .send('{"broken"');
    const unexpected = await request(app).get("/api/failure");

    expect(invalidJson.status).toBe(400);
    expect(invalidJson.body.error.code).toBe("BAD_REQUEST");
    expect(invalidJson.headers["x-request-id"]).toEqual(expect.any(String));
    expect(unexpected.status).toBe(500);
    expect(unexpected.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
    });
    expect(JSON.stringify(unexpected.body)).not.toContain("password");
  });
});
