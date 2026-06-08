import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "better-sqlite3"],
  // Pin workspace root: parent `professional-app/` has its own (unrelated) Vite project
  // with a package-lock.json that confuses Next's auto-detection.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
