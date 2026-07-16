import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSettings } from "../context/SettingsContext";
import { testConnection } from "../lib/github";
import { createDynasty, deleteDynasty, listDynasties } from "../lib/dataStore";
import type { DynastyMeta } from "../types/models";

export function SettingsPage() {
  const { settings, setSettings, githubConfig } = useSettings();
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [dynasties, setDynasties] = useState<DynastyMeta[]>([]);
  const [dynastiesError, setDynastiesError] = useState<string | null>(null);
  const [newDynastyName, setNewDynastyName] = useState("");
  const [newDynastySchool, setNewDynastySchool] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!githubConfig) return;
    listDynasties(githubConfig)
      .then(setDynasties)
      .catch((e) => setDynastiesError(e instanceof Error ? e.message : String(e)));
  }, [githubConfig, testStatus]);

  async function handleTest() {
    if (!githubConfig) {
      setTestStatus("Fill in token, owner, and repo first.");
      return;
    }
    setTesting(true);
    setTestStatus(null);
    const result = await testConnection(githubConfig);
    setTestStatus(result.ok ? "Connected." : `Failed: ${result.error}`);
    setTesting(false);
  }

  async function handleCreateDynasty(e: FormEvent) {
    e.preventDefault();
    if (!githubConfig || !newDynastyName.trim() || !newDynastySchool.trim()) return;
    setCreating(true);
    setDynastiesError(null);
    try {
      const id = slugify(newDynastyName);
      await createDynasty(githubConfig, { id, name: newDynastyName, school: newDynastySchool });
      const list = await listDynasties(githubConfig);
      setDynasties(list);
      setSettings({ activeDynastyId: id });
      setNewDynastyName("");
      setNewDynastySchool("");
    } catch (e) {
      setDynastiesError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDynasty() {
    if (!githubConfig || !settings.activeDynastyId) return;
    const dynasty = dynasties.find((d) => d.id === settings.activeDynastyId);
    const label = dynasty ? `"${dynasty.name}"` : "this dynasty";
    if (!confirm(`Delete ${label}? This permanently deletes all its seasons, games, recruits, and every other file for it. This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setDynastiesError(null);
    try {
      await deleteDynasty(githubConfig, settings.activeDynastyId);
      const list = await listDynasties(githubConfig);
      setDynasties(list);
      setSettings({ activeDynastyId: "" });
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
        <h2>Dynasty</h2>
        {dynastiesError && <p className="status error">{dynastiesError}</p>}
        {githubConfig ? (
          <>
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
            {settings.activeDynastyId && (
              <button
                type="button"
                className="danger"
                onClick={handleDeleteDynasty}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete active dynasty"}
              </button>
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
          </>
        ) : (
          <p className="muted">Connect to GitHub below first.</p>
        )}
      </section>

      <section className="card">
        <h2>GitHub connection</h2>
        <p className="muted">
          Data is stored as JSON files committed to your GitHub repo. Create a{" "}
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
          >
            fine-grained personal access token
          </a>{" "}
          scoped to this repo with read/write access to "Contents", and paste it below. The
          token is stored only in this browser's local storage - it is never sent anywhere
          except directly to api.github.com.
        </p>
        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          <label>
            Owner
            <input
              value={settings.owner}
              onChange={(e) => setSettings({ owner: e.target.value.trim() })}
              placeholder="jbaxmeyer-personal"
            />
          </label>
          <label>
            Repo
            <input
              value={settings.repo}
              onChange={(e) => setSettings({ repo: e.target.value.trim() })}
              placeholder="dynasty-tracker"
            />
          </label>
          <label>
            Branch
            <input
              value={settings.branch}
              onChange={(e) => setSettings({ branch: e.target.value.trim() })}
              placeholder="main"
            />
          </label>
          <label>
            Personal access token
            <input
              type="password"
              value={settings.token}
              onChange={(e) => setSettings({ token: e.target.value.trim() })}
              placeholder="github_pat_..."
            />
          </label>
        </form>
        <button onClick={handleTest} disabled={testing}>
          {testing ? "Testing..." : "Test connection"}
        </button>
        {testStatus && <p className="status">{testStatus}</p>}
      </section>

      <section className="card">
        <h2>Image parsing worker</h2>
        <p className="muted">
          URL of the Cloudflare Worker that proxies the vision-parsing API call (keeps your
          API key off the client). See <code>worker/README.md</code> for deployment steps.
        </p>
        <label>
          Worker URL
          <input
            value={settings.workerUrl}
            onChange={(e) => setSettings({ workerUrl: e.target.value.trim() })}
            placeholder="https://dynasty-tracker-parser.your-subdomain.workers.dev"
          />
        </label>
        <label>
          Worker shared secret (optional)
          <input
            type="password"
            value={settings.workerSecret}
            onChange={(e) => setSettings({ workerSecret: e.target.value.trim() })}
            placeholder="only if you set SHARED_SECRET on the worker"
          />
        </label>
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
