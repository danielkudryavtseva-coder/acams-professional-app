import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow Cloudflare quick-tunnel hosts to reach the dev server.
    allowedHosts: [".trycloudflare.com"],
  },
  optimizeDeps: {
    include: ["force-graph"],
    // maplibre-gl's web worker chunk doesn't survive Vite's dep pre-bundling
    // (404s as maplibre-gl-worker.mjs), so exclude it from optimization.
    exclude: ["maplibre-gl"],
  },
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
