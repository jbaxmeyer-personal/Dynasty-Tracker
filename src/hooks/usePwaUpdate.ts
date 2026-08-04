import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

// Keeps the installed app up to date without the delete-and-re-add dance.
// An installed iOS PWA almost never does a real page load, so the service
// worker rarely checks for a new build on its own. We force a check every
// time the app is brought to the foreground (plus a slow hourly poll while
// it stays open); when a new version is found we surface a Refresh banner
// rather than reloading on our own, so nobody loses a half-typed recap.
export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        const check = () => {
          registration.update().catch(() => {});
        };
        const onVisible = () => {
          if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisible);
        window.setInterval(check, 60 * 60 * 1000);
      },
    });
    updateRef.current = updateSW;
  }, []);

  return {
    needRefresh,
    // Applies the waiting version and reloads to it.
    update: () => updateRef.current?.(true),
  };
}
