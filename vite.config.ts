import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Project Pages serves from /<repo-name>/, not the domain root, so every
// asset URL needs that prefix - set via VITE_BASE_PATH in the deploy workflow
// (falls back to root for local dev).
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-180.png"],
      manifest: {
        name: "CFB 27 Dynasty Tracker",
        short_name: "Dynasty",
        description: "Track your CFB 27 dynasty: seasons, games, recruiting, and career stats.",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#0f1115",
        theme_color: "#0f1115",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        runtimeCaching: [
          {
            // Every write reads a file's current sha first for optimistic
            // concurrency - a stale cached read here causes real, confusing
            // 409 conflicts on save. Every write also requires network
            // anyway (no offline write queue), so there's no offline
            // benefit to caching reads that's worth that risk.
            urlPattern: /^https:\/\/api\.github\.com\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
