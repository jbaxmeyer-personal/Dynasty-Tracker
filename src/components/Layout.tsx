import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Seasons", isActive: (p) => p === "/" || p.startsWith("/seasons") },
  { to: "/recruits", label: "Recruits", isActive: (p) => p.startsWith("/recruits") },
  { to: "/career", label: "Career", isActive: (p) => p.startsWith("/career") },
  { to: "/import", label: "Import", isActive: (p) => p.startsWith("/import") },
  { to: "/settings", label: "Settings", isActive: (p) => p.startsWith("/settings") },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">🏈 Dynasty Tracker</span>
      </header>
      <main className="app-main">{children}</main>
      <nav className="app-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={item.isActive(location.pathname) ? "nav-link active" : "nav-link"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
