import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const apiTarget = "http://localhost:8000";

const apiPrefixes = [
  "/auth",
  "/account",
  "/folders",
  "/files",
  "/trash",
  "/shares",
  "/search",
  "/previews",
  "/uploads",
  "/billing",
  "/ops",
  "/health",
  "/ready",
  "/docs",
  "/openapi.json",
];

const proxy = Object.fromEntries(
  apiPrefixes.map((prefix) => [
    prefix,
    { target: apiTarget, changeOrigin: true },
  ]),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy,
  },
});
