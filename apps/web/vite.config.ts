import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  cacheDir: join(tmpdir(), "saving-account-vite-cache"),
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
