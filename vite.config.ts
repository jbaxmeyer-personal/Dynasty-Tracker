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
        // Camera capture + screenshot import need network (Worker call) anyway;
        // this just keeps the app shell loadable offline mid-game-session.
        globPatterns: ["**/*.{js,css,html,svg,png}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/,
            handler: "NetworkFirst",
            options: { cacheName: "github-api", networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
});
