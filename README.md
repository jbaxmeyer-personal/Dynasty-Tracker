# CFB 27 Dynasty Tracker

A mobile-friendly PWA for tracking a CFB 27 dynasty: seasons, games (with
narrative recap notes), recruiting classes, coaching staff, the national
landscape, and career stats. Built to replace a Google Sheets tracker with a
fast, mobile-first data-entry flow.

There is no backend database - **the GitHub repo itself is the datastore**.
The app authenticates as you (a personal access token) and reads/writes
JSON files under `data/` directly through the GitHub API, so every change
is a commit and your dynasty's full history is just `git log`.

## Setup

1. `npm install`
2. In the repo's **Settings → Pages**, set the source to **GitHub Actions**.
3. Merge/push to `main` - `.github/workflows/deploy.yml` builds and deploys
   automatically. The site ends up at
   `https://<owner>.github.io/<repo>/`.
4. Open the site, go to **Settings** in the app, and:
   - Paste a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
     scoped to this repo with **Contents: read and write**. It's the only
     thing you ever enter - the repo location is baked into `src/config.ts`.
     The token is stored only in that browser's `localStorage` and is used
     solely for direct calls to `api.github.com` - see "Open items" below for
     why this was chosen over an OAuth flow.
   - Create a dynasty (or pick an existing one).

If you fork this for a different repo, change the three constants in
`src/config.ts` (owner / repo / branch).

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
    national_landscape.json
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
2. **Team logos: self-generated abbreviation badges** as a fallback, not
   only real school logos. Real logos are fetched best-effort from ESPN's
   public logo CDN by a mapped team id in `src/data/schools.ts`; anything
   without a mapped id (or that fails to load) falls back to a deterministic
   colored badge with the school's initials (`src/components/TeamBadge.tsx`) -
   zero licensing risk, no broken images, works for any school name.
3. **Forms**: plain mobile-first HTML forms (no UI library) so the bundle
   stays small on the PWA and the code stays easy to extend as CFB 27's
   fields inevitably get tweaked. Top-right hamburger menu for navigation;
   same layout scales fine on desktop.
4. **PWA**: `vite-plugin-pwa` generates the manifest and service worker.
   Installable to the home screen, app shell (JS/CSS/icons) is cached for
   offline load; GitHub API calls are **not** cached (`NetworkOnly`) since
   every write reads the file's current SHA first and a stale cached read
   would cause real 409 conflicts on save - and there's no offline write
   queue anyway. Recap notes are still typeable with no signal, but saving
   needs connectivity.

## Corrections after reviewing the original spreadsheet

The initial build worked off a prose spec that got two things wrong versus
the actual source spreadsheet (`NEXT_NCAA_Football_06_Dynasty_Tracker.xlsx`)
and how CFB 27 itself displays data:

- **Ovr/Off/Def are integer ratings (0-99), not letter grades.** The old
  sheet used letter grades because that's how the previous game displayed
  them; CFB 27 shows plain integers.
- **Recruits only track incoming players.** There is no "Transfer Out" row
  type - the sheet never logs a player leaving. Transfers are marked with a
  `class_year` (Fr/So/Jr/Sr/Gr) and an `in_season` flag for portal adds
  that happen mid-season rather than during the normal signing period.

## Known limitations / not built

- No offline write queue - if you save while offline, the request just
  fails; re-save once you have signal.
- No optimistic concurrency handling beyond GitHub's own SHA-based
  conflict detection - if you edit the same dynasty from two devices at
  the same moment, the second write will fail with a 409 and you'll need
  to refresh and retry.
