# Release Notes — v5.0.10 — The Full Picture

**NewTon DC Tournament Manager v5.0.10 — April 15, 2026**

---

## Overview

NewTon becomes a two-tier system. The venue runs the full app locally. The public site runs analytics-only. Same codebase, same Docker image, one environment variable.

v5.0.10 introduces `NEWTON_MODE=analytics` — a deployment mode that hides tournament management and exposes only Analytics and a limited Global Settings. In analytics mode, Server Settings is inaccessible — deletion is impossible by design.

---

## Analytics-Only Mode

Set `NEWTON_MODE=analytics` in your Docker environment.

**What changes:**
- Tournament Setup, Player Registration, Tournament Bracket, and Chalker tabs are hidden
- Header adapts to "[Club Name] - Analytics"
- Global Settings shows only Branding and Point Values
- Import Register button is hidden — data comes exclusively from disk (shared tournaments)
- Delete buttons are inaccessible — Server Settings (where the toggle lives) is hidden
- Auto-navigates to Analytics on load

**What stays the same:**
- All Analytics features: Dashboard, Leaderboard, Players, Register
- Scope selector, point toggles, ranking/attendance layers
- Export Register for backup
- The relay API still accepts tournament uploads from venue instances

### Read-Only Bracket View

In analytics mode, a "View Bracket" button appears on tournament rows and in the match list header. One click loads the tournament JSON from disk and renders the bracket read-only:

- No match controls, no auto-open Match Controls
- No Developer Console
- "Back to Analytics" button returns and cleans up
- Uses `currentTournament` with an `_analyticsPreview` guard — save functions skip analytics previews, so no phantom data is persisted

Bracket view requires the tournament JSON on disk. In analytics mode, all data comes from disk, so this is always available.

---

## Docker Environment Variables

| Variable | Values | Default | Description |
|---|---|---|---|
| `NEWTON_MODE` | `full`, `analytics` | `full` | App mode. `analytics` hides tournament management, shows only Analytics. |
| `NEWTON_LANDING_PAGE` | `true`, `false` | — | Enables the landing page at `/`. |
| `NEWTON_DEMO_MODE` | `true`, `false` | `false` | Shows demo banner. |
| `NEWTON_GITHUB_URL` | URL | `https://github.com/skrodahl/NewTon` | GitHub link in UI. |
| `NEWTON_BASE_URL` | URL | — | Base URL for canonical/OG tags. |

### Example: Analytics-only instance

```yaml
services:
  newton-analytics:
    image: newton-dc
    ports:
      - "2020:2020"
    environment:
      - NEWTON_MODE=analytics
      - NEWTON_READONLY_ANALYTICS=true
      - NEWTON_LANDING_PAGE=true
      - NEWTON_BASE_URL=https://newton.example.com
    volumes:
      - ./tournaments:/var/www/html/tournaments
```

---

## Other Changes

### Global Settings

- **Server Settings separated** — Server ID, auto-backup, shared tournament delete, and remote backup settings moved from User Interface into their own "Server Settings" pane.
- **"Allow deleting tournaments"** — renamed from "Allow deleting shared tournaments". Now also controls delete button visibility in the Analytics register.

### Analytics

- **Dashboard entry point** — clicking "Analytics" on a tournament (from Recent Tournaments or the podium) now always opens the Dashboard tab.
- **Import Tournament from JSON** — "Import Tournament" button in the Analytics header. Pick a tournament JSON file and it's imported directly into the Analytics register. No localStorage, no API required — works offline.
- **Auto-import from disk** — on every Analytics load, checks for shared tournaments on disk not yet in IndexedDB and imports them silently. Requires REST API (Docker deployment).
- **Shared backfill function** — `NewtonDB.backfillTournament(t, config)` in newton-db.js. Single source of truth for all tournament imports into IndexedDB. Used by file import, localStorage backfill, and auto-import from disk.

### Chalker

- **Unlimited darts per leg** — new "Unlimited" option in Max Rounds (both Global Settings and Chalker). Uses 100 rounds (300 darts) internally — keeps QR payloads within comfortable scanning limits. No special-case logic needed. QR confirm display shows "Unlimited" for values >= 100.

---

## Testing

Analytics mode requires Docker — the PHP layer sets the body class and header text server-side. No client-side override is available; this is intentional to prevent accidental mode changes on production instances.

---

## Migration

No migration required. New environment variables are optional — existing deployments continue to run in full mode by default.

---

**NewTon DC Tournament Manager v5.0.10 — The Full Picture.**
