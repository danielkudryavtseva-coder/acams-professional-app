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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
