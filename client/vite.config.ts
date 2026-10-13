import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(root, "../shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
    fs: {
      allow: [path.resolve(root, "..")],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
