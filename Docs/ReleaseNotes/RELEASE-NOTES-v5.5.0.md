# Release Notes — v5.5.0 — Live Is Life

**NewTon DC Tournament Manager v5.5.0 — October 30, 2026**

---

## Overview

You can now watch a tournament while it is being played. The club's Tournament Manager shares a live copy with the server, and the Analytics site shows what is on the boards, what comes next and the latest results, on a phone as well as a desktop. Alongside it, a tournament that fails to reach the server no longer fails in silence.

---

## Live View

A **Live now** line appears at the top of Analytics whenever a tournament is being played, with **Watch**.

- **A list of the night.** What is being played right now, with the lane; what is up next; and the latest results first, each with what it recorded ("Cat 2–1 Ben · Cat 1× 180"). One column, made for a phone and fine on a desktop.
- **The bracket and the Leaderboard, one tap away.** The bracket opens as the normal bracket page, read-only; select a finished match to see what it recorded. The Leaderboard opens as usual, with the club's own point values.
- **It updates by itself.** No reload. The page says when it was last updated, and when the connection drops.
- **When the night is over,** the page says so and shows the final results; **See it in Analytics** leads to the finished tournament, which Analytics takes in as it always has. If the tournament was reset or abandoned instead, it says it is no longer live and shows the results as of the last update, not a stale "up next".

**Switching it on.** At the club, in Global Settings → Server, **Live copy while it is played**. It is off by default. A slim copy of the tournament (the players and their statistics, the matches with scores, lanes and what each recorded) is sent after every change, to the club's server and to the remote one. It needs a server with the API, which in practice means Docker.

**Who can see it.** Anyone who can open the server can read the live copy, as they can read the finished tournament. Only the club, with the API key, can write it. It is kept apart from the tournament list, so Analytics never counts a tournament that is still being played, and it goes when the finished tournament has been backed up.

**One way.** The club computer runs the tournament and writes to the server. The server and Analytics only display. Nothing is read back into the club's tournament.

---

## A failed upload is no longer silent

The upload at the end of a tournament used to be fire-and-forget: if the connection was poor, nothing said so.

- **Setup** now shows "Not uploaded to <server>" with the reason (could not reach the server, the key was refused, and so on) and **Upload now**.
- **The bracket page** shows a **Not uploaded** chip, and **Setup's tournament list** tags the tournament's row, so it can be found next week even after another tournament has been created.
- **It tries again by itself** while the page is open (after 30 seconds, a minute, two minutes, then every five), as soon as the connection returns, and when the page is opened with an upload waiting. A refusal such as a wrong key is not retried; it says what to fix.

---

## Also

- **Analytics no longer imports a tournament that is still being played.** One uploaded by hand mid-night used to be taken in as finished, and the real result later skipped as already there. Only finished tournaments are imported.

---

## Files Changed

- `js/live-upload.js`, `api/live.php` — the live copy: what is sent and where it is kept
- `js/live-view.js`, `css/live-view.css` — the Live View
- `js/tournament-management.js` — the upload status, the retry and the notices
- `js/newton-history.js` — Analytics only imports finished tournaments
- `js/main.js`, `js/bracket-view.js`, `js/bracket-rendering.js`, `js/results-config.js`, `tournament.html`, `css/` — the setting, the page and the hooks

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. The live copy is off until switched on; a server without the new endpoint simply ignores it. Two new things are created on first use: `uploadStatus_<tournament>` keys in the browser, and a `tournaments/live` folder on the server. The export format is unchanged.

To get the Live View on an Analytics site, pull the new image and recreate the container (`docker compose pull && docker compose up -d`). If a browser still shows the old page afterwards, reload once.

This release moves `:latest` forward to v5.5.0. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.5.0 — Live Is Life*
