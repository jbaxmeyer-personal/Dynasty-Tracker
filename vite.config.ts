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
      // "prompt" (not autoUpdate) + manual registration so we control when the
      // page reloads - see src/hooks/usePwaUpdate.ts. It checks for a new
      // version on every foreground (how an installed iOS PWA usually "opens")
      // and shows a Refresh banner instead of reloading mid-edit.
      registerType: "prompt",
      injectRegister: false,
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
            // Team logos are hot-linked from ESPN's CDN. Cache each one in the
            // app's own Cache Storage after the first fetch so it loads
            // instantly forever after, survives browser-cache eviction, and
            // works offline - without redistributing the trademarked images
            // ourselves (we're still just linking). statuses [0, 200] is
            // required to store the opaque cross-origin <img> responses.
            urlPattern: /^https:\/\/a\.espncdn\.com\/i\/teamlogos\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "espn-team-logos",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 365, // a year - logos rarely change
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
