# CFB 27 Dynasty Tracker

A mobile-friendly PWA for tracking a CFB 27 dynasty: seasons, games (with
narrative recap notes), recruiting classes, and career stats. Built to
replace a Google Sheets tracker while keeping manual data entry to a
minimum via screenshot parsing.

There is no backend database - **the GitHub repo itself is the datastore**.
The app authenticates as you (a personal access token) and reads/writes
JSON files under `data/` directly through the GitHub API, so every change
is a commit and your dynasty's full history is just `git log`.

## Setup

### 1. Frontend (GitHub Pages)

1. `npm install`
2. In the repo's **Settings → Pages**, set the source to **GitHub Actions**.
3. Merge/push to `main` - `.github/workflows/deploy.yml` builds and deploys
   automatically. The site ends up at
   `https://<owner>.github.io/<repo>/`.
4. Open the site, go to **Settings** in the app, and:
   - Paste a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
     scoped to this repo with **Contents: read and write**. It's stored only
     in that browser's `localStorage` and is used solely for direct calls to
     `api.github.com` - see "Open items" below for why this was chosen over
     an OAuth flow.
   - Fill in owner/repo/branch, click **Test connection**.
   - Create a dynasty (or pick an existing one).

### 2. Screenshot-parsing worker (optional, but needed for the Import tab)

See [`worker/README.md`](worker/README.md). Short version: it's a Cloudflare
Worker that calls **Workers AI** (Cloudflare's own hosted models) directly -
no external API key, runs on the free tier. Deploy it, paste its URL (and
optional shared secret) into the app's Settings page.

### Local development

```
npm install
npm run dev
```

## How data is stored

```
data/
  dynasties.json                 # index: {id, name, school, created_at}[]
  {dynasty-id}/
    seasons.json
    games.json
    recruits.json
    season_team_stats.json
    school_prestige.json
```

Each table file is a flat JSON array of records matching the shapes in
`src/types/models.ts`. Computed values (win/loss streaks, home/away splits,
career record by opponent, etc.) are **not stored** - they're derived at
render time in `src/lib/computedStats.ts`.

## Open items from the spec - decisions made during build

1. **Auth: PAT, not OAuth.** A device-flow or web OAuth flow needs a
   confidential client secret exchanged server-side, which would mean
   standing up (and paying for) another backend just for token exchange -
   overkill for a single-user tool. A fine-grained PAT scoped to just this
   repo's Contents gives the same read/write capability with zero extra
   infrastructure. Trade-off: you rotate/revoke it yourself from GitHub
   settings rather than a "disconnect" button in-app.
2. **Vision model: Llama 3.2 11B Vision Instruct on Workers AI**
   (`@cf/meta/llama-3.2-11b-vision-instruct`), the strongest vision model
   currently on Workers AI's free tier. It's a much smaller model than a
   frontier LLM, so parsed rows are explicitly framed as a draft - the
   review/edit table in the Import tab is not optional UI polish, it's load
   -bearing for accuracy. If your real screenshots parse poorly, swap the
   model constant in `worker/src/index.ts` (one line) and redeploy.
3. **Team logos: self-generated abbreviation badges**, not real school
   logos. Real logos are trademarked and there's no blanket license that
   covers hot-linking or redistributing them for an arbitrary set of NCAA
   schools; a documented "sports logo API intended for this kind of use"
   for college teams specifically didn't turn up anything with clear terms
   for a hobby project. `src/components/TeamBadge.tsx` instead renders a
   deterministic colored badge with the school's initials - zero licensing
   risk, no external requests, works for any school name you type in.
4. **Forms**: plain mobile-first HTML forms (no UI library) so the bundle
   stays small on the PWA and the code stays easy to extend as CFB 27's
   fields inevitably get tweaked. Bottom tab bar navigation for thumb reach
   on phone; same layout scales fine on desktop.
5. **Recruiting NIL stays derived** (`nil_total - nil_roster_spend`) since
   nothing in the spec indicated the game surfaces it as an independent
   number. If CFB 27 turns out to track it separately, add a
   `nil_recruiting_spend` field to `Season` in `src/types/models.ts` and to
   the season form.
6. **PWA**: `vite-plugin-pwa` generates the manifest and service worker.
   Installable to the home screen, app shell (JS/CSS/icons) is cached for
   offline load; GitHub API and Worker calls are NOT cached (`NetworkFirst`
   with a short timeout for the GitHub API, worker calls just fail offline)
   since writing a game recap needs to actually commit at some point -
   there's no offline write queue. If you're logging games with no signal,
   the recap notes should still be typeable, but saving will need
   connectivity.

## Known limitations / not built

- No offline write queue - if you save while offline, the request just
  fails; re-save once you have signal.
- No optimistic concurrency handling beyond GitHub's own SHA-based
  conflict detection - if you edit the same dynasty from two devices at
  the same moment, the second write will fail with a 409 and you'll need
  to refresh and retry.
- The screenshot importer sends one image per request (no true multi-image
  batched inference call) - "batch mode" in the UI just means the review
  table doesn't show until every selected image has been parsed.
