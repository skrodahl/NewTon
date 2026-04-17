# Release Notes — v5.0.1 — Game Shot, and the Match!

**NewTon DC Tournament Manager v5.0.1**

---

## Overview

v5.0.0 gave the Chalker eyes — it could receive match assignments from the Tournament Manager via QR code. v5.0.1 closes the loop.

The Chalker now sends results back. The Tournament Manager scans the result QR, previews it, and applies it directly to the bracket. No manual entry, no shouting across the room, no mistakes. One scan and the match is complete.

Along the way, the data started mattering. Every Chalker match is now stored in the **Analytics** tab — leg by leg, visit by visit. The data that used to disappear when the tournament ended now persists. It grows with each event. It will one day tell the story of a whole season.

For clubs running NewTon on a shared server, HTTPS is now built in. One environment variable and the container generates its own certificate, enables HTTPS, and broadcasts itself on the local network by name. The Chalker's camera works. QR codes scan. Every device finds the server without configuration.

Two apps became a workflow. A workflow became an ecosystem. Still no internet required. Still no accounts. Still no fees.

**Double out.**

---

## The Complete Match Loop

Before v5.0.1, the loop was half-open. The Tournament Manager could send a match assignment to the Chalker — players, format, lane, referee — all in a single QR scan. But when the match ended, someone still had to walk back to the TM and enter the result by hand.

v5.0.1 closes it.

When a match finishes in the Chalker, it generates a **result QR code** containing the winner, the score, and the full achievement record — 180s, tons, high outs, short legs, lollipops. The operator at the Tournament Manager scans it. A preview appears: winner, score, all stats. One confirmation and the bracket advances.

Every detail that used to require manual entry now travels automatically. The oche and the bracket are in sync.

---

## Analytics

Every match completed via the Chalker is now written to a persistent match register — **NewtonMatchDB**, backed by the browser's IndexedDB. It survives browser restarts, device reboots, and new tournament sessions.

The **Analytics** tab is where this data lives. Browse completed tournaments. Click through to individual matches. See the full leg breakdown for every Chalker match: visit scores, first thrower, checkout darts. See achievements per player, per match, per tournament.

This is the beginning of something. The foundation is in place for cross-tournament leaderboards, player profiles, seasonal stats, and graphs that show form over time. For now: everything is recorded, nothing is lost.

---

## Docker: HTTPS by Default

The Chalker's QR scanning requires a secure context — browsers only grant camera access over HTTPS or localhost. Until v5.0.1, setting up HTTPS meant configuring a reverse proxy or bringing your own certificate.

Now: set `SSL_ENABLED=true` and the container generates its own self-signed certificate, enables HTTPS on port 443, and redirects HTTP. On Linux, add `MDNS_HOSTNAME=newtondarts` and every device on the network can reach it at `https://newtondarts.local` — no DNS configuration, no IP addresses to remember.

Three compose files cover every scenario: HTTP only, SSL with port mapping (all platforms), and SSL with mDNS (Linux). See the [Docker Quick Start](https://newtondarts.com/docker-quickstart.html) for the ready-to-use configurations.

---

## Everything Else

Nine betas between v5.0.0 and v5.0.1. The list of improvements beneath the headline features is long:

- **Undo dialog** — shows whether a match was completed via Chalker or manual entry, with appropriate achievement guidance
- **Tons fix** — a 180 now correctly counts as both a 180 and a ton
- **Conditional lollipop counter** — the lollipop row in the result preview only appears when a score of 3 was actually recorded
- **Result preview error messages** — when a scanned result can't be applied, the reason is shown clearly
- **QR Results button** — moved to the Confirm Match Winner footer and the Match Controls bottom row; hidden until needed
- **Delete tournament** — tournament rows in Analytics now have a delete button; requires typing the tournament name to confirm
- **Import fix** — re-importing an existing tournament no longer silently fails with a ConstraintError
- **Help system** — updated throughout for QR features; new Analytics page help
- **jsQR fallback** — the Tournament Manager falls back to canvas-based QR decoding on Windows Enterprise editions missing the Media Feature Pack
- **Docker image** — reduced from 228 MB to 132 MB by cleaning up the build context

---

## What Hasn't Changed

NewTon DC Tournament Manager is still a file you open in a browser. No installation. No account. No internet. No server required unless you want one.

LocalStorage is still the working data store. Tournament exports are still the backup. The bracket logic, the undo system, the transaction history — unchanged, as solid as ever.

The Chalker is still a PWA. Install it once on a phone or tablet and it works offline, at any venue, without a network connection — unless you're using the QR workflow, which requires the TM and Chalker to be on the same network for a moment.

---

## Migration

No migration required. All existing tournament data is fully compatible. The Analytics tab will populate as new tournaments are completed — historical tournaments run before v5.0.1 are not retroactively added.

---

## Beta History

| Version | Date | Tagline |
|---|---|---|
| v5.0.1-beta.1 | March 26, 2026 | The Round-Trip Begins |
| v5.0.1-beta.2 | March 27, 2026 | Nobody Leaves the Oche |
| v5.0.1-beta.3 | March 27, 2026 | The Eyes Have It |
| v5.0.1-beta.4 | March 28, 2026 | Stats Don't Lie |
| v5.0.1-beta.5 | March 28, 2026 | The Loop Closes |
| v5.0.1-beta.6 | March 28, 2026 | The Record Books Open |
| v5.0.1-beta.7 | March 29, 2026 | Secure by Default |
| v5.0.1-beta.8 | March 29, 2026 | History, Properly Kept |
| v5.0.1-beta.9 | March 30, 2026 | Scan Anything, Know Everything |

---

**NewTon DC Tournament Manager v5.0.1 — Game Shot, and the Match!**
