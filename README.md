# Review daily schedule app

Two front-ends for the same Bonds Ranch 2026 trip schedule:

1. **React/Vite app** (`src/`) — what Figma Make scaffolded. Reads schedule rows from a Google Sheet via the `gviz/csv` endpoint. Lives in this repo.
2. **Apps Script Web App** (`gas/`) — a server-rendered HTML version of the same schedule, bound to the same sheet and managed via [`clasp`](https://github.com/google/clasp).

The original Figma project: <https://www.figma.com/design/bP1V3LlpOOMuKF7jb5kkzF/Review-daily-schedule-app>.

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

## Docs

- [`docs/decisions/`](docs/decisions/) — interactive decision sheets for setup choices.
