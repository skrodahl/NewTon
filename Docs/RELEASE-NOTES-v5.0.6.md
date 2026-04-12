# Release Notes — v5.0.6 — Because Backups Shouldn't Be Homework

**NewTon DC Tournament Manager v5.0.6 — April 12, 2026**

---

## Overview

Tournament night is busy enough. Remembering to export and back up your data shouldn't be part of the job.

v5.0.6 adds automatic server backup — one checkbox in Global Settings and every completed tournament is saved to disk. Configure a remote server and it's backed up there too. The data survives browser cache clears, device changes, and the walk home from the venue.

---

## Automatic Backup

A new setting in Global Settings → Server Settings: **"Automatically backup tournaments on completion."**

When enabled, the tournament JSON is saved to the server's `/tournaments/` directory the moment a tournament is completed. No manual step, no file picker, no remembering. Backed up tournaments are available from any computer connecting to the server.

---

## Remote Backup

Configure a remote NewTon instance in Global Settings → Remote Backup:

- **Remote server URL** — the address of another NewTon server (e.g. `https://newton.example.com`)
- **Username / Password** — optional basic auth credentials

When a remote server is configured, auto-backup sends to both the local server and the remote server. The remote upload uses a relay endpoint (`api/relay.php`) — PHP forwards the request server-side, so basic auth works naturally without CORS issues.

The relay requires both instances to run with the REST API enabled (Docker deployment).

---

## Backup to Server Button

The "Upload to Server" button in Tournament Setup is now "Backup to Server" and opens a modal:

- **Source**: Active tournament or from file
- **Destination**: shown as read-only info — this server, plus remote if configured

One click backs up to all configured destinations. The summary shows success/failure per destination.

---

## Shared Tournaments

The Shared Tournaments section in Tournament Setup is now collapsed by default. One click shows all, another collapses. Tournaments not in localStorage show "Import", those already present show "Re-import". My Tournaments stays front and centre.

---

## Everything Else

- **Navigation reorder** — Analytics now comes before Global Settings. Flow: Setup → Registration → Bracket → Analytics → Settings → Chalker.
- **Server ID display** — Global Settings now shows the auto-generated Server ID (read-only). Used in QR payloads.
- **Analytics dates** — all dates now use YYYY-MM-DD format, consistent with the rest of the app.
- **Analytics format label** — match list header spells out "Double Elimination" / "Single Elimination".
- **Backfill format fix** — backfilled matches now include the best-of value, enabling the "Best of N" badge.

---

## Files Changed

- `api/relay.php` — new relay endpoint for remote server uploads
- `js/tournament-management.js` — `buildTournamentPayload()`, `uploadToServer()`, `autoUploadTournament()`, `showUploadModal()`, `executeUpload()`, shared tournament collapse logic
- `js/clean-match-progression.js` — auto-backup hook at tournament finalization (respects config)
- `js/results-config.js` — new `config.server` fields (autoUpload, remoteUrl, remoteUsername, remotePassword)
- `js/newton-history.js` — YYYY-MM-DD date formatting, format label expansion
- `tournament.html` — Backup to Server modal, Server Settings UI (Server ID, auto-backup, remote backup fields), nav reorder
- `css/styles.css` — modal ESC support

---

## Requirements

All backup features require the REST API to be enabled — this means running NewTon via Docker with `NEWTON_API_ENABLED=true` (the default). The "Backup to Server" button only appears when the API is detected. Plain HTML deployments (opening `tournament.html` directly in a browser) are unaffected — export to file remains the backup path.

## Migration

No migration required. All new settings default to off — current behaviour is preserved. The auto-backup checkbox must be explicitly enabled in Global Settings. Remote backup fields are empty by default.

---

**NewTon DC Tournament Manager v5.0.6 — Because Backups Shouldn't Be Homework.**
