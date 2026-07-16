import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useDynasties } from "../context/DynastiesContext";

interface NavItem {
  to: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Seasons", isActive: (p) => p === "/" || p.startsWith("/seasons") },
  { to: "/recruits", label: "Recruits", isActive: (p) => p.startsWith("/recruits") },
  { to: "/career", label: "Career", isActive: (p) => p.startsWith("/career") },
  { to: "/landscape", label: "National Landscape", isActive: (p) => p.startsWith("/landscape") },
  { to: "/import", label: "Import", isActive: (p) => p.startsWith("/import") },
  { to: "/settings", label: "Settings", isActive: (p) => p.startsWith("/settings") },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings, setSettings } = useSettings();
  const { dynasties } = useDynasties();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Switching dynasties has to leave whatever season/game URL we're on - that
  // id belongs to the old dynasty and won't exist in the new one ("Season not
  // found"). Drop the stale season pointer and land on home, which re-resolves
  // to the new dynasty's current season.
  function switchDynasty(nextId: string) {
    if (nextId === settings.activeDynastyId) return;
    setSettings({ activeDynastyId: nextId, activeSeasonId: "" });
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">🏈 Dynasty Tracker</span>
        {dynasties.length > 0 && (
          <select
            className="dynasty-switcher"
            value={settings.activeDynastyId}
            onChange={(e) => switchDynasty(e.target.value)}
            aria-label="Switch dynasty"
          >
            {!settings.activeDynastyId && <option value="">-- select dynasty --</option>}
            {dynasties.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="menu-button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰
        </button>
        {menuOpen && (
          <>
            <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
            <nav className="nav-menu">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={item.isActive(location.pathname) ? "nav-link active" : "nav-link"}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
