import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  cacheDir: join(
    tmpdir(),
    "saving-account-vite-cache",
    createHash("sha256")
      .update(import.meta.url)
      .digest("hex")
      .slice(0, 12),
  ),
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
