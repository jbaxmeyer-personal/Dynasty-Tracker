import { Link, Navigate } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { useSettings } from "../context/SettingsContext";

// Root route: no content of its own - just figures out which season "is"
// the app right now (last-viewed, or most recent) and lands there. Season
// detail is the actual home screen; this just resolves where that is.
export function HomePage() {
  const { isConfigured, settings } = useSettings();
  const { rows: seasons, loading } = useTable("seasons");

  if (!isConfigured) {
    return (
      <div className="page">
        <h1>Welcome</h1>
        <p>
          Head to <Link to="/settings">Settings</Link> to connect your GitHub repo and pick or
          create a dynasty.
        </p>
      </div>
    );
  }

  if (loading) return <div className="page">Loading...</div>;

  if (seasons.length === 0) {
    return (
      <div className="page">
        <h1>Welcome</h1>
        <p className="muted">
          No seasons yet. <Link to="/seasons/new">Add your first season</Link>.
        </p>
      </div>
    );
  }

  const active = seasons.find((s) => s.id === settings.activeSeasonId);
  const target = active ?? [...seasons].sort((a, b) => b.year - a.year)[0];

  return <Navigate to={`/seasons/${target.id}`} replace />;
}
