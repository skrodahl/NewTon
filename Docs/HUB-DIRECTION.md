# Hub Direction: the server as a durable copy, one writer

**Status:** steps 1 to 3 and the live viewer built and committed 2026-10-30 (`e74af50`, `45a7188`, `c2805af`, `9250183`), passing the debt test below; step 4 (resume) closed as "not now". Written after the Monday 2026-10-26 tournament never reached newton.skrodahl.net.
**Order of work:** 1 is urgent. 2 is a small safety fix. 3 and 4 are the first real steps. The rest waits for a feature that needs it.

---

## Why

Everything about a tournament lives in the operator's browser: a few localStorage keys (`dartsTournaments`, `currentTournament`, `dartsConfig`, `playerList`, and `tournament_<id>_history`) and the Analytics register in IndexedDB. That has worked, and the crash resistance is real, but it is one profile on one device. A cleared or evicted profile, a dead laptop mid-night, or a second device wanting to see the tournament all end the same way: the data is not anywhere else.

The upload to the server is the only copy that leaves the browser, and it is fire-and-forget. On 2026-10-26 it failed (the basement's connection is the likely cause) and nobody knew: a failure only reaches the browser console (`uploadToServer()`, `silent: true`).

## The principle: one writer, the server as hub

The operator's Tournament Manager stays the only thing that changes tournament state. The server holds a durable, shared copy and relays it: to the Chalker, to spectators, to Analytics, to a backup. The three foundations (`clean-match-progression.js`, the transaction history, undo) do not move, and nothing is duplicated server-side.

**One-way data flow, for now** (maintainer, 2026-10-30): the club's Tournament Manager writes to the server (the backup, the live copy, the key check); the server and the Analytics viewers only display. Nothing is read back into the club's tournament state, and no feature may depend on the remote holding the only copy. The one existing exception is manual: Setup's Server tab can import a tournament file from the server, which an operator chooses to do. Revisit only together with the "server as primary store" decision.

**Not in scope, on purpose:**
- Several writers (two operators, the Chalker changing results). That needs the core logic on the server, conflict rules, and a different idea of undo (it removes transactions from history). A project of its own.
- Dropping the single-file mode. Revisit when a feature cannot be built as an add-on (see "Later").

## Mirror first, then promote

localStorage is synchronous and the core reads it inline (undo reads history, for one). A server-backed primary store is asynchronous: making the core read from it means async throughout the foundations. So:

1. **Mirror.** The browser stays the synchronous working copy and writes behind to the server.
2. **Resume.** A tournament can be restored from the server when the browser has nothing, or something older.
3. **Promote, only if needed.** Once the server holds a reliable, ordered journal, a feature that needs the server as primary can read from it.

Likely hook points for the mirror: `saveTournament()` and `saveTransaction()`, since nearly every state change passes through them. Not yet verified.

---

## 1. The upload-failure marker (urgent)

**Goal:** a failed automatic upload is never silent, and it mends itself when the connection returns.

**What it records.** Per tournament and destination (this server, the remote server): the last result and time, and for a failure its kind and message. Kept in its own localStorage key (`uploadStatus_<tournamentId>`), not in the tournament object: the tournament schema and the export stay untouched, and absent means "no information", as the additive-schema rule wants. `uploadToServer()` already returns true/false; it also needs to return the reason.

**Kinds of failure**, because they behave differently:
- **Network** (the fetch throws, or the relay answers 502 "Could not reach remote server"): will probably mend itself. Retry.
- **Server error** (5xx): retry, with backoff.
- **Refused** (401 wrong or missing key, 403 not allowed host): will not mend itself. Say so plainly, with the server's own message, and point at Global Settings → Remote backup → Test connection.

**Where it shows.**
- Setup's current-tournament card (the focal point): "Not uploaded to newton.skrodahl.net since 21:14. Network. [Upload now]". On success: "Uploaded to newton.skrodahl.net 21:40."
- A small chip in the bracket page header while something is pending, so it is seen on the night. Not on the finished Match Controls view: that one is photographed for the club chat.

**Retry.**
- Automatically: when the browser reports it is online again, and on a timer while the page is open and something is pending (60 s, backing off). Also on load.
- By hand: **Upload now**, which shows the result out loud.
- Safe to repeat: the upload overwrites the same file (`overwrite=true`, same name).
- It never blocks or delays completing a match or a tournament. That rule stays.

**Detail to decide.** `buildTournamentPayload()` reads the current tournament from globals. A pending upload for a tournament that is not loaded cannot be retried until it is loaded again. First version: the current tournament only, plus an amber **Not uploaded** tag on that tournament's row in the Setup list (built) so it is found and loaded. Later: build the payload from the stored record.

**Files:** `js/tournament-management.js` (`uploadToServer()`, `autoUploadTournament()`, the status key, the retry), the Setup card, the header chip, `js/dynamic-help-system.js`, the Config page's Test connection text if reused.

---

## 2. The Analytics import gate (small, and a latent bug today)

`_autoImportFromDisk()` (`js/newton-history.js`) imports every tournament in the server's list once, by id, whatever its status, and `backfillTournament()` records it as finished. So today, uploading an **in-progress** tournament by hand (the Upload to server dialog offers the active one) would be imported into every member's browser as completed, and the final upload would be skipped as "already there".

**Fix:** skip anything whose status is not `completed`; import it when it becomes completed. One condition in one function. It should land before any live upload, and is worth doing on its own.

---

## 3. A live area on the server, and a mirror after every match

- **Where:** `tournaments/live/<tournamentId>.json`, a subfolder the tournament list never reads (as `registry/` and `corrections/` already are). Analytics cannot import it. Overwritten after every match.
- **At completion:** the final upload goes to the normal place, and the live file is deleted. The final is authoritative by construction, not by overwriting.
- **Keyed by id, not name and date:** renaming or changing the date mid-night would otherwise orphan the file.
- **A revision** in each upload, so an older state arriving late does not overwrite a newer one (the player database already works newest-wins by `updatedAt`).
- **Snapshots, not a stream of transactions** (maintainer, 2026-10-30). Each send replaces the whole file, so a dropped one is fixed by the next, undo needs no special case, and there is no sync logic (gaps, resync) to maintain. A transaction stream only pays off with per-dart data, which belongs to the MQTT work. The marker in step 1 still covers the final upload.
- **A slim snapshot** for the live copy: format, status, players with their statistics (for the leaderboard), the club's point values, and each match's state, score, lane, players and recorded achievements (maintainer, 2026-10-30: a viewer should have the leaderboard and per-match statistics). Not the transaction history (up to 1000 entries) and not the export fields, which only the final upload needs. Spiked 2026-10-30: the snapshot draws the normal bracket page and the leaderboard in memory. A fraction of the size, so a send after every change stays cheap on a poor connection.
- **Sent after every change**, hooked on `saveTournament()` (debounced) rather than on transactions: it also catches the draw, group tables and the next Swiss round, which a viewer must see. A viewer polls the file (5 to 10 seconds, `ETag`, paused when its tab is hidden, "updated 21:14" shown); no reload.
- **Opt-in per tournament.** Test and abandoned tournaments must not appear on a public server. Ties to the parked "Leave out of Analytics" gate.
- **Reset at the club** deletes the live copy (needs the key).
- **Privacy:** names and results go public during the night instead of after. Check `Docs/PRIVACY.md` and say so in the setting's description.
- **API:** `api/live.php`, writes need the key, reads do not (as elsewhere). Docker only, as the upload already is.

Also gives crash recovery, which is step 4.

## 4. Resume from the server (closed 2026-10-30: not now)

**Decision (maintainer):** not built. The club computer runs the tournament and the remote Analytics instance only displays results; nothing is read back from the remote, and that has not been considered before. A resume would make the remote a source the club depends on, which belongs to the "server as primary store" decision below, not to a safety net slipped in beside it. A tournament file exported from Setup (and the final backup) covers a lost laptop well enough for now.

What was found while discussing it, in case it is reopened:
- The slim live copy cannot be resumed from: it has no transaction history, so a restored tournament could not undo or edit. A resume needs the **full export** (what the final backup sends: players with statistics, matches, the draw, history, config). The final results are as public as a live copy, so a full live copy would need no extra protection, and could replace the slim one (one copy for the viewer, the backup and the import; the viewer's `finalSnapshot()` already converts a full file).
- Restore would reuse the existing **import tournament**, which handles exports with history; the newest revision wins, and a mismatch is shown, never silently chosen.
- The copies protect different things: the club container's copy survives a wiped browser profile but not a dead laptop; only the remote copy survives that.

The original text of this step follows, for reference.

A button (Setup) that restores a tournament from the live copy when the browser has none, or an older revision. The revision decides; a mismatch is shown, never silently chosen. History comes with it, so undo works after a restore.

---

## Later, when something needs it

- **A viewer, only if it adds little debt** (maintainer, 2026-10-30): a read-only bracket page that polls `api/live.php`. `bracket-view.js` is already read-only and lays out from the progression tables, so reuse looks cheap. The real project of the set, and it is built only if it passes the debt test below.
- **Push instead of polling, per-dart views, spectators on the club network:** `Docs/NETWORK-LAYER.md` (MQTT). That needs a broker, which is a second runtime in the image. Weigh it against the PHP security burden (the v5.4.7 release) when the time comes.
- **Docker only:** decide when the first feature cannot be built as an add-on, and name that feature. Gather evidence first: GitHub release downloads against GHCR pulls, and visits to the Launch link.
- **Server as primary store:** only after step 4 has run at real tournaments.

## The debt test for a live view

A live view is worth building only if all of these hold. If one fails, it waits.

- **No second copy of the foundations.** It lays out and draws with the existing `bracket-view.js` and the progression tables. If it needs its own layout, its own progression logic or its own match-state rules, it is not built.
- **No new runtime and no new store.** PHP and files, as today. A broker or a database is a separate decision with its own justification, not a side effect of the viewer.
- **Removable.** Turn the setting off, or delete `api/live.php` and the viewer page, and the Tournament Manager behaves exactly as before. Nothing in the core depends on it (the way the app must work with `licensed/` deleted).
- **Additive only.** New optional fields and files; no change to stored records that makes old and new data look alike but mean different things.
- **No async rewrite of the core.** The viewer reads the server's copy; the Tournament Manager keeps its synchronous working copy.
- **Small surface.** One read endpoint, one write endpoint behind the key, polling. Push waits for a reason.
- **Opt-in and off by default**, with the privacy effect stated in the setting.

## Open questions

- Who is the audience for a live view: members at home, or people in the room?
- Opt-in default for the live upload: off.
- How long may a pending upload retry while the page is open? (A night is enough.)

## Verify before building

- That `saveTournament()` and `saveTransaction()` really catch every state change (for step 3).
- That `uploadStatus_<id>` is cleaned up when a tournament is deleted or reset.
- The Docker image and nginx accept the larger request bodies a full tournament sends (a real tournament file is far bigger than the empty bodies tested on 2026-10-30).
