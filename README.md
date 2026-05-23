# BR 2026 Schedule

The canonical front-end is the **React/Vite app** (`src/`), hosted on Cloudflare Workers — what Figma Make scaffolded, now managed in this repo. Reads schedule rows from a Google Sheet via the `gviz/csv` endpoint.

The `gas/` folder mirrors a Google Apps Script project bound to the same sheet, managed via [`clasp`](https://github.com/google/clasp). It contains a server-rendered HTML version of the schedule (`Code.js` + `Index.html`) and a `formatHousing` utility. The HTML web app was the previous shareable URL but is **retired as a user-facing surface** — keep editing the script for utilities like `formatHousing`, but the React app on Cloudflare is the URL to share.

The original Figma project: <https://www.figma.com/design/bP1V3LlpOOMuKF7jb5kkzF/Review-daily-schedule-app>.

## Live site

**<https://review-daily-schedule.rmgtx.workers.dev>** — the React app, hosted on Cloudflare Workers (static assets only, served from the global edge).

Deploys happen automatically on push to `main` via the [GitHub Actions workflow](.github/workflows/deploy.yml). To deploy manually:

```sh
npm run deploy        # vite build && wrangler deploy
```

## Running the React app

```sh
npm install
npm run dev
```

The schedule reads from a hardcoded sheet ID in `src/app/App.tsx`. Hit the **Sync Sheet** button in the toolbar to pull the latest rows. The app no longer writes back to the sheet — the sheet is the source of truth.

## Google Apps Script (`gas/`)

The Apps Script project bound to the schedule sheet is mirrored in `gas/`. Edits go through clasp:

```sh
clasp pull            # fetch current server state into gas/
# …edit gas/Code.js / gas/Index.html / gas/formatHousing.js…
clasp push            # publish back to Apps Script
```

The bound project's web app URL renders `Index.html` with `doGet()` (see `gas/Code.js`). To make code changes visible to anyone hitting the deployed URL, also run a deploy step in the Apps Script editor (or `clasp deploy`) — `clasp push` only updates the *source*, not the live deployment.

### Layout

| Path | What it is |
| --- | --- |
| `gas/Code.js` | `doGet()` entry — reads the sheet and renders `Index.html`. |
| `gas/Index.html` | Full HTML schedule UI rendered server-side by Apps Script. |
| `gas/formatHousing.js` | Utility to color/format a `Housing` tab. |
| `gas/appsscript.json` | Apps Script manifest (web app access, timezone). |
| `gas/Schedule.gs` | **Not pushed.** Reference copy of the original `doPost` webhook lifted from the React app's old setup panel. Listed in `.claspignore`. |
| `.clasp.json` | Bind config (Script ID + `rootDir: ./gas`). |
| `.claspignore` | Files in `gas/` to skip on `clasp push`. |

### One-time setup on a fresh machine

```sh
npm install -g @google/clasp
clasp login                       # opens browser for Google OAuth
# .clasp.json in this repo already binds to the right Script ID
clasp pull                        # confirm you can read the server state
```

### Sheet of record

Both the React app and the Apps Script web app read from:

<https://docs.google.com/spreadsheets/d/1KBPmsddghMRosRAf0L31yuiZrcX6XMFboQEelxFayPU/edit>

The `Schedule` tab is the canonical data — columns: `Day · Start · End · Cat · Title · Sub · Lead · Owner`.

## Hosting (Cloudflare Workers)

Configured via [`wrangler.jsonc`](wrangler.jsonc) using the [Static Assets pattern](https://developers.cloudflare.com/workers/static-assets/) — no Worker code, just `dist/` served from the edge with SPA-style 404 fallback to `index.html`.

### Auto-deploy from GitHub

The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow runs on every push to `main` and on manual dispatch. One-time setup per fresh clone:

1. Create a Cloudflare API token: <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** → **Edit Cloudflare Workers** template.
2. Add it to this repo: **Settings → Secrets and variables → Actions → New repository secret**, name `CLOUDFLARE_API_TOKEN`.
3. Next push to `main` triggers a deploy. Watch it under the repo's **Actions** tab.

### Manual deploy from a local checkout

```sh
wrangler login        # one-time, OAuth in browser
npm run deploy        # builds with Vite, then `wrangler deploy`
```

## Docs

- [`docs/decisions/`](docs/decisions/) — interactive decision sheets for setup choices.
