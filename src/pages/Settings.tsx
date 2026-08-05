import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useDynasties } from "../context/DynastiesContext";
import { createDynasty, deleteDynasty } from "../lib/dataStore";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { settings, setSettings } = useSettings();
  const { dynasties, refresh: refreshDynasties } = useDynasties();
  const [dynastiesError, setDynastiesError] = useState<string | null>(null);
  const [newDynastyName, setNewDynastyName] = useState("");
  const [newDynastySchool, setNewDynastySchool] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function handleCreateDynasty(e: FormEvent) {
    e.preventDefault();
    if (!user || !newDynastyName.trim() || !newDynastySchool.trim()) return;
    setCreating(true);
    setDynastiesError(null);
    try {
      const id = slugify(newDynastyName);
      await createDynasty(user.uid, { id, name: newDynastyName, school: newDynastySchool });
      await refreshDynasties();
      setSettings({ activeDynastyId: id });
      setNewDynastyName("");
      setNewDynastySchool("");
    } catch (e) {
      setDynastiesError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  const activeDynasty = dynasties.find((d) => d.id === settings.activeDynastyId);

  async function handleDeleteDynasty() {
    if (!user || !settings.activeDynastyId || !activeDynasty) return;
    if (deleteConfirmText !== activeDynasty.name) return;
    setDeleting(true);
    setDynastiesError(null);
    try {
      await deleteDynasty(user.uid, settings.activeDynastyId);
      await refreshDynasties();
      setSettings({ activeDynastyId: "" });
      setConfirmingDelete(false);
      setDeleteConfirmText("");
    } catch (e) {
      setDynastiesError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card">
        <h2>Account</h2>
        <p className="muted">
          Signed in as <strong>{user?.email ?? "your account"}</strong>. Your dynasties are private
          to this account - no one else can see or edit them.
        </p>
        <button type="button" className="secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      </section>

      <section className="card">
        <h2>Dynasty</h2>
        {dynastiesError && <p className="status error">{dynastiesError}</p>}
        <label>
          Active dynasty
          <select
            value={settings.activeDynastyId}
            onChange={(e) => setSettings({ activeDynastyId: e.target.value })}
          >
            <option value="">-- select --</option>
            {dynasties.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.school})
              </option>
            ))}
          </select>
        </label>
        {activeDynasty && !confirmingDelete && (
          <button type="button" className="danger" onClick={() => setConfirmingDelete(true)}>
            Delete active dynasty
          </button>
        )}
        {activeDynasty && confirmingDelete && (
          <div className="card" style={{ borderColor: "var(--danger)" }}>
            <p>
              This permanently deletes <strong>"{activeDynasty.name}" ({activeDynasty.school})</strong> -
              every season, game, recruit, and every other record for it. This cannot be undone.
            </p>
            <label>
              Type "{activeDynasty.name}" to confirm
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={activeDynasty.name}
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                className="danger"
                onClick={handleDeleteDynasty}
                disabled={deleting || deleteConfirmText !== activeDynasty.name}
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form className="form-grid" onSubmit={handleCreateDynasty}>
          <label>
            New dynasty name
            <input
              value={newDynastyName}
              onChange={(e) => setNewDynastyName(e.target.value)}
              placeholder="e.g. Toledo Rockets Dynasty"
            />
          </label>
          <label>
            Starting school
            <input
              value={newDynastySchool}
              onChange={(e) => setNewDynastySchool(e.target.value)}
              placeholder="Toledo"
            />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create dynasty"}
          </button>
        </form>
      </section>
    </div>
  );
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `dynasty-${Date.now()}`
  );
}
