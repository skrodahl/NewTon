# Code Improvement Plan

**Review date:** 2026-07-04 (HEAD `5552e73`)
**Scope:** All core application code — `js/`, `tournament.html`, `chalker/`, `api/`, service workers. Excluded: `i-ching/` (oraculon), vendored libraries (`jsQR.js`, `qr-scanner*.min.js`), `css/`.
**Method:** Four parallel deep-read reviews (core bracket logic; app/state layer; analytics/history/DB; QR/Chalker/PHP API), findings cross-verified, two findings corrected after maintainer review (see Appendix A).

Line numbers are accurate as of the review date and will drift as files change — treat them as starting points, not anchors.

**Overall verdict:** The intentional foundations are sound. The hardcoded progression tables match the drawn brackets for 8/16/32 players in both formats; the Chalker checkout math (bogey numbers, minimum-dart table) is correct; CSV escaping is correct; the config load path is robust. The issues below cluster into recurring patterns rather than being scattered randomly — which means a small number of shared fixes resolve many call sites.

**Ground rules for all phases (per CLAUDE.md):**
- No changes to the progression tables, transaction history semantics, or undo semantics beyond the specific bug fixes listed.
- No frameworks, no build tooling, no parallel implementations.
- Every phase verified manually in the browser with 8, 16, and 32 player tournaments, both DE and SE where relevant.

---

## Phase Overview

| Phase | Theme | Risk | Size |
|-------|-------|------|------|
| 1 | Correctness bugs | Low — surgical, independently testable | ~20 small fixes |
| 2 | PHP API hardening (deployer-neutral) | Low | 3 small fixes + 1 optional |
| 3 | Escaping sweep (XSS + apostrophe breakage) | Medium — many call sites, mechanical | Largest phase |
| 4 | Persistence & data-integrity hardening | Medium — touches save/load paths | ~10 fixes |
| 5 | Dead code removal | Low — deletions only | ~700 lines removed |
| 6 | Performance & consolidation | Medium — refactors, needs regression testing | Opportunistic |

Suggested order: 1 → 2 → 3 → 4 → 5 → 6. Phases 1–2 are quick wins. Phase 5 can be done any time and makes Phase 6 easier. Each phase should be its own commit series so it can be verified (and reverted) independently.

---

## Phase 1 — Correctness Bugs

> **Status: Implemented & committed 2026-07-04** (commit `7332b30`) — all items 1.1–1.13 plus Appendix C (listener leak) and 2.3/1.13m (`wasOverwritten`). Notable implementation choices: 1.13b enforces the lane requirement *before* starting the match (no state to revert); 1.13k enters edit mode on the last visit after tiebreak cancel (there is no new-entry cell on a full board); 1.13l strips `matchId`/`tournamentId`/`serverId` on rematch, mirroring `startMatchFromQR`. Chalker cache bumped (`chalker-v109`, `?v=12`).

Small, surgical fixes to real bugs. Each item is independently testable.

### 1.1 Transaction IDs are not unique ⚠️ HIGH

- **Where:** `js/clean-match-progression.js:576, 1935, 2039` and `js/bracket-rendering.js:2073, 2138`
- **Issue:** All five transaction mint sites use `` id: `tx_${Date.now()}` ``. `processAutoAdvancements()` completes walkover matches in a tight synchronous loop, so multiple `COMPLETE_MATCH` transactions routinely share one ID within the same millisecond.
- **Why it matters:** `undoManualTransaction()` (bracket-rendering.js:2907/2928) filters history by ID and rolls back via `history.find(t => t.id === transactionId)`. With duplicate IDs, an unrelated match's transaction can be silently stripped from history while its board state stays completed — history and state diverge, and a future rebuild-from-history would lose that result. This undermines the transaction system's single-source-of-truth guarantee.
- **Fix:** Add a uniqueness suffix at all five sites: a module-level counter (`` `tx_${Date.now()}_${++txCounter}` ``) or `crypto.randomUUID()` (note: needs the fallback from item 4.7 on plain-HTTP deployments — the counter approach avoids that dependency).
- **Verify:** Create an 8-player bracket with several byes so `processAutoAdvancements()` fires multiple walkovers in one pass; inspect `tournament.history` in the console and confirm all IDs are distinct; undo a match and confirm only its own transactions are removed.

### 1.2 Undo gate ignores QR completions downstream ⚠️ HIGH

- **Where:** `js/bracket-rendering.js:2608, 2624` (isMatchUndoable) and `4889, 4903` (getDetailedMatchState — duplicated logic)
- **Issue:** The target-match check accepts `completionType === 'MANUAL' || 'QR'` (line 2589), but both downstream-destination checks block undo only when the downstream match is `MANUAL`.
- **Why it matters:** Scenario — FS-1-1 completed manually, its winner advances to FS-2-1, which is completed via QR from the Chalker. FS-1-1 still renders as undoable. Undoing it removes all of FS-2-1's transactions (legs, averages, achievements recorded on the Chalker) with no warning. Additionally, `NewtonDB.deleteMatch` is only called for the *target* match (line 3014), so the rolled-back QR match leaves an orphaned record in IndexedDB that Analytics will still count.
- **Fix:** Treat QR like MANUAL in all four downstream checks. In `undoManualTransaction()`, call `NewtonDB.deleteMatch()` for every consequential match that gets rolled back, not just the target. (Extracting the duplicated blocking logic into one shared helper is item 6.8 — doing it here makes this fix single-site.)
- **Verify:** Complete a match manually, complete its downstream match via QR result, confirm the upstream match no longer shows an undo option; confirm Analytics match records stay consistent after a legitimate undo.

### 1.3 Transaction pruning matches by substring ⚠️ HIGH

- **Where:** `js/analytics.js:3070-3071, 3118-3119, 3247-3248` (all three smart-pruning functions) and `js/tournament-management.js:156-157` (export pruning)
- **Issue:** Transactions are grouped per match with `(t.matchId === matchId) || (t.description && t.description.includes(matchId))`. Match ID `FS-1-1` is a substring of descriptions mentioning `FS-1-10` … `FS-1-16` (which exist in 32-player brackets).
- **Why it matters:** A completed `FS-1-1` claims transactions belonging to other — including **live** — matches. A live match's lane assignment, referee assignment, or `START_MATCH` transaction can be classified "redundant" and deleted from the history log. The pruning UI's claim "Active matches untouched" (analytics.js:3185, 3338) is false. In the export path, the last lane assignment for the wrong match can be dropped.
- **Fix:** Match strictly on `t.matchId === matchId`; drop the description fallback entirely. If any legacy transactions lack `matchId`, skip them rather than guessing from descriptions.
- **Related sub-issues to fix in the same pass:**
  - `analytics.js:3288-3291` and `tournament-management.js:180-181` — fallback key `t.id || t.timestamp` can collapse distinct transactions sharing a timestamp (guaranteed to happen until item 1.1 lands), and a transaction with neither id nor timestamp puts `undefined` in `idsToRemove`, which then filters out *every* id-less transaction. Skip transactions with no identifier.
  - "Total Removed" count can double-count a transaction claimed by two matches (dedup happens only in `idsToRemove`).
- **Verify:** 32-player tournament; complete FS-1-1; assign a lane to FS-1-10 and leave it live; run smart pruning preview and confirm FS-1-10's transactions are not listed; export and re-import, confirm FS-1-10's lane survives.

### 1.4 Import restores Saved Players to a dead localStorage key ⚠️ HIGH

- **Where:** `js/tournament-management.js:1325`
- **Issue:** Import writes `localStorage.setItem('savedPlayers', ...)`, but the Saved Players registry is read/written as `'playerList'` (`js/player-management.js:5,10`). `analytics.js:1329` even labels `savedPlayers` "legacy - unused".
- **Why it matters:** The exported player-list snapshot is never actually restored on import — the feature is silently broken, and the dead key pollutes storage.
- **Fix:** Write to `'playerList'` (or call `savePlayerList()`). Consider a one-time migration that merges an existing `savedPlayers` value into `playerList` and removes the dead key.
- **Verify:** Export a tournament on a browser profile with saved players; import on a clean profile; confirm the Registration page's saved-player list is populated.

### 1.5 Stale export throws ReferenceError on every page load ⚠️ HIGH

- **Where:** `js/results-config.js:1052`
- **Issue:** `window.generateResultsCSV = generateResultsCSV;` references a function that no longer exists (replaced by `buildResultsCSVData` at line 909). The uncaught ReferenceError aborts the remaining `window.*` assignments (lines 1053–1067).
- **Why it matters:** Everything currently works only because top-level function declarations are already globals — but any code added below line 1052 will silently never run, and the console shows a load error every session, masking real errors.
- **Fix:** Delete the line. Audit the rest of the export block for other stale names.
- **Verify:** Hard-reload; console shows no errors at load.

### 1.6 Chalker: cross-leg undo leaves the opponent's score wrong ⚠️ HIGH

- **Where:** `chalker/js/chalker.js:773-822` (`undoLastVisit` / `restoreFromVisit`)
- **Issue:** When undo steps back into a previous completed leg, `restoreFromVisit()` restores only the undone player's score; the opponent's `playerXScore` stays at the new leg's `startingScore` instead of their actual remaining score in the restored leg.
- **Why it matters:** Subsequent bust/checkout validation and the anchor display use the stale value — real mis-scoring can follow on the very next visit.
- **Fix:** Call `recalculateScores()` (chalker.js:2255) at the end of `undoLastVisit()` — it already derives both players' scores from the visit log.
- **Verify:** Play two legs, undo back across the leg boundary, confirm both players' displayed scores match the visit history; enter a checkout for the opponent and confirm it validates against the correct remaining score.

### 1.7 Chalker: tiebreak and edited-checkout wins never reach match history ⚠️ MEDIUM

- **Where:** `chalker/js/chalker.js:659-663` (`completeTiebreak`) and `747-762` (`completeEditCheckout`)
- **Issue:** Only `completeLeg()` routes through `onMatchComplete()` (396-409), which calls `saveMatchToHistory()` and `clearCurrentMatch()`. The other two completion paths call `showEndScreen()` directly.
- **Why it matters:** A match decided by tiebreak or by an edited checkout is missing from Chalker history — no later Result QR can be generated from history, the stale `current_match` record persists, and the end-of-match UX diverges.
- **Fix:** Route both paths through `onMatchComplete()`.
- **Verify:** Finish a match via tiebreak; confirm it appears in Chalker history and a Result QR can be produced from it.

### 1.8 Chalker PWA: offline boot is broken by cache-key mismatch ⚠️ HIGH

- **Where:** `chalker/sw.js:9-22, 63` vs `chalker/index.html:427`
- **Issue:** The page loads `js/chalker.js?v=11` but the service worker caches `./js/chalker.js`. `caches.match()` without `ignoreSearch` never matches a query-stringed request.
- **Why it matters:** The app's main script always goes to the network — the PWA fails to boot offline, which defeats the "Offline at the Oche" feature.
- **Fix (three parts):**
  1. `caches.match(event.request, { ignoreSearch: true })` (or cache the exact versioned URLs).
  2. Add the QR-scanner libraries to `CACHE_FILES` — `js/jsQR.js`, `js/qr-scanner.umd.min.js`, `js/qr-scanner-worker.min.js` are loaded by index.html:423-424 and fetched lazily by QrScanner; without them, QR match assignment (especially the iOS image-capture path) breaks offline.
  3. Add a `.catch` with a `console.error` to the `cache.addAll` in the install handler (sw.js:25-37) — today one 404 fails the whole install silently and the old version keeps serving.
- **Maintenance note:** there are two manual version knobs (`CACHE_NAME` v108 in sw.js, `?v=11` in index.html) that must be bumped together — consider deriving one from the other or documenting the pairing at both sites.
- **Verify:** Install the PWA, go offline (airplane mode), relaunch — app boots and QR scanning UI loads.

### 1.9 Stale `window.isOldFormatImport` on the overwrite-import path — MEDIUM

- **Where:** `js/tournament-management.js:1232` (set) vs the overwrite path `processImportedTournament` → `showImportOverwriteModal` → `confirmOverwriteTournament` → `continueImportProcess:1302` (never set)
- **Issue:** The flag is only set in `showImportConfirmModal`. On the overwrite path it is `undefined` — or left over from a *previous* import.
- **Why it matters:** Re-importing a pre-v4.0 file over an existing tournament can restore multi-MB snapshot-based history incompatible with replay undo, or conversely skip valid v4.0 history.
- **Fix:** Set `window.isOldFormatImport = validation.isOldFormat` in `processImportedTournament` before branching (or better, pass it as a parameter instead of using a window global).

### 1.10 Analytics match detail uses stale `_activeTournament` for points — MEDIUM

- **Where:** `js/newton-history.js:2184` (`_buildMatchDetailHtml`), `2081` (`openMatch`), `2323` (`openMatchModal`)
- **Issue:** The detail view computes points with `_getActivePoints(_activeTournament)`, but neither `openMatch()` nor `openMatchModal()` sets `_activeTournament` — it holds whichever tournament was last opened via `openTournament`.
- **Why it matters:** In Original point mode, opening a match from the flat Matches tab uses the wrong tournament's `configSnapshot` — the Points column shows wrong numbers (or all-zero when `_activeTournament` is null).
- **Fix:** Pass the match's own tournament record into `_buildMatchDetailHtml` — `openMatch` already loads it for the breadcrumb at 2093.
- **Verify:** Two tournaments with different point configs; open a match from the Matches tab in Original mode; Points column matches that tournament's config.

### 1.11 Cancelled import confirm handler survives and fires later — MEDIUM

- **Where:** `js/newton-history.js:2295-2314` (`importTournament`)
- **Issue:** The click handler on `analyticsImportConfirmBtn` is only removed when clicked. Dismissing the modal (Escape/cancel) leaves it attached, closing over that file's tournament object. Selecting a second file stacks a second handler.
- **Why it matters:** Clicking Confirm then imports both the new file *and* the previously cancelled one.
- **Fix:** Use `confirmBtn.onclick = handler` (single-assignment), or remove the previous handler before attaching, plus explicit cleanup when the dialog closes.
- **Verify:** Pick file A, cancel; pick file B, confirm; only B is imported.

### 1.12 Tiebreak legs corrupt the three-dart average — MEDIUM

- **Where:** `js/newton-history.js:946-948, 956-958`
- **Issue:** For a won leg, the code adds `startScore` (501) to `_totalScored` and `(visits.length - 1) * 3 + (leg.cd || 3)` darts. A tiebreak leg (`cd === 0`, rendered as "TB" at 2149) didn't score 501, and `|| 3` invents three checkout darts.
- **Why it matters:** Averages shown in the leaderboard/detail views are skewed for any player with tiebreak legs. `NewtonStats.extractAchievements` already deliberately excludes tiebreaks; the average should too.
- **Fix:** `if (leg.cd === 0) return;` (skip tiebreak legs) inside the leg loop, both call sites.

### 1.13 Smaller correctness items — LOW

| # | Where | Issue | Fix |
|---|-------|-------|-----|
| a | `js/tournament-management.js:1002` | `selectedTournament.bracketSize` logged before the null check at 1004 — missing tournament throws instead of alerting | Move/remove the debug log |
| b | `js/lane-management.js:230-233` | `requireLaneForStart` alerts a warning but continues anyway — the config option is a no-op | Return false / revert state when set and no lane assigned |
| c | `js/player-management.js:193, 393` vs consumers | `stats.shortLegs` initialized as `0` (number) while reset/import/consumers expect an array; `openStatsModal:511` patches it lazily | Initialize as `[]` |
| d | `js/clean-match-progression.js:25-26` | `snapshotPlayerStats()` spreads `s.shortLegs` — throws on legacy numeric value (types.js:73 documents both shapes); crash lands mid-`toggleActive` | Guard with `Array.isArray()` |
| e | `js/clean-match-progression.js:2259` | `loserLegsInput.max = match.legs - 1 \|\| 2` — for Bo1, `0` is falsy so max becomes 2 | `Math.max(0, match.legs - 1)` |
| f | `js/clean-match-progression.js:512-534` | `advancePlayer()` returns `true` when the target-match lookup fails (only console.error) — the rollback branch in `completeMatch` (802-806) is unreachable | Return `false` on missing destination |
| g | `js/tournament-management.js:1685-1687` | Watermark BYE filter compares player *objects* to the string `'BYE'` — always true, so the MATCHES count includes walkovers | Use `isWalkoverMatch(match)` |
| h | `js/bracket-rendering.js:2365-2369, 2421` | Missing-modal fallback in `showUndoConfirmationModal` executes the destructive undo *without* confirmation; `confirmWithAchievementsBtn` dereferenced outside the null guard | Log and return instead |
| i | `js/qr-bridge.js:226-228, 277` | `handleResultQRPayload()` tears down the scanner before `showResultQRPreview()` validates; missing/non-array `payload.legs` throws into the scan-interval `catch (_)` — user gets no modal and no error | Validate `Array.isArray(payload.legs)` before stopping the camera |
| j | `chalker/js/chalker.js:2109-2117` vs `2134-2145` | "Clear input to delete last visit" in edit mode is unreachable — `handleEnter()` returns early on empty buffer | Move the empty-buffer check into the edit path (or remove the feature) |
| k | `chalker/js/chalker.js:674-678, 1470-1530` | After `cancelTiebreak()`, the active input cell is beyond the rendered rows (typed digits invisible); undoing a tiebreak leg never clears `leg.tiebreak` | Reset the input position on cancel; clear the flag on undo |
| l | `chalker/js/chalker.js:863-866` | Rematch rebuilds config from the *form* — after a QR-assigned match, the form holds older manual values (wrong players/format, QR context dropped) | Rebuild from `state.config` minus `matchId` |
| m | `api/upload-tournament.php:112` | `wasOverwritten` computed *after* the write — `file_exists()` is always true; a new file uploaded with `?overwrite=true` reports "updated" | Capture `file_exists()` before `file_put_contents()` |
| n | `js/main.js:246-265` | `loadClubLogo` requests all four candidates in parallel; the guard is checked before any `onload` fires, so the *last to load* wins, not the priority order | Chain candidates via `onerror` |
| o | `js/clean-match-progression.js:2086` | `debugBracketGeneration()` missing a `return` after its guard | Add return |

---

## Phase 2 — PHP API Hardening (deployer-neutral)

> **Status: Implemented & committed 2026-07-04** (commit `333e330`) — 2.1 (kill-switch normalization, opt-out semantics kept: unset still means enabled), 2.2 (10 MB cap + id/name/players shape check), and 2.4 (opt-in `NEWTON_RELAY_ALLOWLIST`; `CURLOPT_FOLLOWLOCATION` left enabled on purpose — disabling it would break relaying through http→https redirects). Documented in DOCKER-QUICKSTART.md env table, api/README.md Security, and commented examples in both compose files. No php lint available locally — verify endpoints once on a running instance.

**Decision (maintainer, 2026-07-04):** Built-in authentication is intentionally out of scope. The documented security model (DOCKER-QUICKSTART.md "Security") is that the API has no built-in auth and deployers must protect it (LAN-only, reverse proxy with basic auth, VPN). CORS headers are left as-is — they may be load-bearing for direct browser-to-remote-server upload. Only philosophy-neutral robustness fixes are in scope.

### 2.1 Kill-switch fails open

- **Where:** `api/api-check.php:9`
- **Issue:** The API is disabled only when `NEWTON_API_ENABLED` is exactly the string `'false'`. Unset (plain PHP hosting), `'FALSE'`, or `'0'` all leave it enabled — the documented advice "set it to false for security" doesn't reliably work.
- **Fix:** Normalize: case-insensitive comparison, and treat `'0'`/`'off'`/`'no'` as disabled. (Going fully fail-closed — disabled unless exactly `'true'` — would change behavior for existing plain-PHP deployments; decide explicitly before choosing that.)

### 2.2 Upload endpoint: size cap and shape check

- **Where:** `api/upload-tournament.php:48-105`
- **Issue:** Accepts any JSON up to `post_max_size`, unlimited requests, no check that the payload resembles a tournament. Even behind deployer auth, this is a disk-fill and junk-hosting risk.
- **Fix:** Reject payloads over a few MB (check `strlen` of the raw body before decode); require minimal shape (`id`, `name`, `players` array) before writing.

### 2.3 `wasOverwritten` flag

Covered as Phase 1 item 1.13m (one-line fix, listed there because it's a pure correctness bug).

### 2.4 (Optional) relay.php target allowlist

- **Where:** `api/relay.php:43-84`
- **Issue:** Forwards arbitrary POST bodies with caller-supplied basic-auth credentials to any http/https URL, follows redirects — an open relay/SSRF vector for anyone who can reach the server.
- **Proposal:** An opt-in `NEWTON_RELAY_ALLOWLIST` env var — when set, only listed hosts are relayed; when unset, current behavior is unchanged. Also set `CURLOPT_FOLLOWLOCATION` to false. Fits the "deployer decides" model; take it or leave it.

---

## Phase 3 — Escaping Sweep

One systemic pattern with three consequences, found independently by all four reviews.

### The problem

Player names, tournament names, referee names, and server-supplied filenames flow into `innerHTML` and inline `onclick='...'` attribute strings without escaping. Consequences:

1. **Breaks today on legal names.** `O'Brien` produces a SyntaxError in `onclick="addPlayerFromList('O'Brien')"` — registration list buttons, history checkboxes, and delete buttons all break on apostrophes.
2. **Stored XSS.** Imported tournament JSON is barely validated (see 4.4), so a crafted player/tournament name executes script in the app context (LocalStorage tournament data reachable). Names arriving via QR payloads have the same path into the Chalker and the QR preview modals.
3. **HTML-escaping inside JS strings is a false fix.** Several sites wrap names in `escHtml()` *inside* an onclick string (`newton-history.js:625, 1402` etc.) — the browser HTML-decodes attribute values before the JS parser sees them, so `&#39;` re-enters the string as a raw `'`. HTML-escaping is not JS-string-escaping. Similarly `newton-table.js:128, 295-297` `_escAttr` escapes `'` but not `"` — a name containing `"` terminates the double-quoted attribute and can inject arbitrary attributes.

### The fix pattern (apply uniformly)

1. **One shared `escapeHtml()` helper** (probably in main.js, exported on window like everything else — analytics.js:1999 already has a private copy). Apply to every user/import/payload-derived string interpolated into `innerHTML`.
2. **Stop passing names through inline handler strings entirely.** Replace `onclick="fn('${name}')"` with `data-*` attributes (HTML-escaped, safe) plus one delegated `addEventListener` per container — or pass only a numeric row index. `showUploadModal` (tournament-management.js:398-428) already builds DOM with `textContent` for exactly this reason; it is the in-repo model to follow. For `NewtonTable`, store a row index and pass the integer to `_onRowClick` — this fixes newton-table.js and every newton-history.js call site in one pattern.

### Call sites (grouped into reviewable batches)

**Batch A — Registration & players:**
- `js/player-management.js:113-143` (`renderPlayerList` — names in onclick, the O'Brien breakage), `611-630` (`updatePlayersDisplay`)

**Batch B — Tournament management & main:**
- `js/main.js:556` (heading), `613-614, 631-643` (match history cards)
- `js/tournament-management.js:667, 678, 683` (`updateTournamentStatus`), `776-797, 855-882` (`loadRecentTournaments` — includes server-supplied `t.filename` in onclick), `1645` (`showImportStatus` message embeds tournament name), `1764+` (`updateTournamentWatermark`)
- `js/results-config.js:652-668` (`updateResultsTable`)
- `js/lane-management.js:398-438` (referee names in `<option>`)

**Batch C — Bracket:**
- `js/bracket-lines.js:94, 1797` (tournament/club name in header — imported JSON reaches this, making it a real vector)
- `js/bracket-rendering.js:1502+, 3315+, 3771-3811, 3928, 3943` (player names in match cards, command center, results)

**Batch D — Analytics & history:**
- `js/newton-history.js:625, 1360, 1395, 1402, 1792, 1878` (inline onclick with names — convert to data-* / row index)
- `js/newton-table.js:128, 295-297` (`_escAttr` / `_rowId` — replace with row-index pattern)
- `js/analytics.js:914, 929, 983→1052, 1240, 1296, 2829, 2863, 2868` (dev-console views; lower exposure but same vector — route through the existing `escapeHtml` at 1999), `804, 810` (filter values re-injected into `value="…"`)

**Batch E — QR & Chalker:**
- `js/qr-bridge.js:571, 588-655` (QR Inspector renders deliberately *unverified* payloads via innerHTML — highest-exposure site since any QR code presented to the camera reaches it), `279-305, 323-331` (`showResultQRPreview`)
- `chalker/js/chalker.js:1167-1174` (`showQRConfirm` — no tid/sid gate applies here)

**Verify per batch:** register a player named `O'Brien <b>x</b>`; confirm every view renders the literal name and every button still works. For Batch E, scan a QR containing markup in `p1` and confirm it renders inert.

---

## Phase 4 — Persistence & Data-Integrity Hardening

The app's stated top priority is crash-resistance; these close the gaps between that goal and the current persistence code.

> **Status: low-risk guards implemented 2026-07-04** (uncommitted) — items 4.1 (partial), 4.5, 4.7, 4.9.
> - **4.1:** `readTournamentsRegistry()` helper added (tournament-management.js) + `getPlayerList()` guarded. Swapped **6 of 8** registry read sites (createTournament dup-check, loadRecentTournaments, load-by-id, deleteTournament, confirm-delete, the localStorage lookup near 2058). **Deliberately NOT swapped:** `saveTournamentOnly` (was :607) and the import existence-check (was :1549) — both are read-modify-**write-back**; a `[]`-returning reader there would overwrite and destroy the other tournaments on corruption. Left throwing (which safely aborts the write) until **4.2** adds proper write-abort handling. The helper's JSDoc documents this.
> - **4.5:** import filter `n => typeof n === 'string' && n.trim()` + empty-after-filter guard.
> - **4.7:** `crypto.randomUUID` fallback to `getRandomValues` (works over plain HTTP).
> - **4.9:** try/catch-with-placeholder added to `renderTournamentList` and `renderAllMatches` (mirrors `renderDashboard`).
> - **Still pending (the delicate ones):** 4.2 (saveTournamentOnly write ordering + the two deferred 4.1 sites), 4.3 (analytics-preview corruption), 4.4 (deeper import validation), 4.6 (NewtonDB atomicity), 4.8 (render-race tokens). 4.10 discuss-first.

### 4.1 One guarded registry reader

- **Where:** `js/tournament-management.js:74, 607, 743, 999, 1133, 1170, 1549, 2056` — 8+ unguarded `JSON.parse(localStorage.getItem('dartsTournaments'))` call sites.
- **Why:** One corrupt value bricks tournament creation, saving, loading, deleting, and the Recent Tournaments list simultaneously (in `loadRecentTournaments` the throw is an unhandled async rejection — the container never renders, no error shown).
- **Fix:** One `readTournamentsRegistry()` helper: try/catch, return `[]` on parse failure, surface a one-time console warning + user-visible notice. Use everywhere. Same treatment for `getPlayerList()` (`player-management.js:6`).

### 4.2 `saveTournamentOnly()` error handling and write ordering

- **Where:** `js/tournament-management.js:607-617`
- **Issue:** The most-called persistence function has zero failure handling: unguarded parse, then two `setItem` calls. A `QuotaExceededError` on the first write throws into the match-completion flow; success-then-failure leaves `dartsTournaments` and `currentTournament` divergent.
- **Fix:** Wrap in try/catch; on quota failure alert the user and point at the storage-management modal; write `currentTournament` first (small, authoritative for reload) so partial failure favors the active tournament; report failure to the caller.

### 4.3 Analytics bracket preview can destroy/corrupt the active tournament

- **Where:** `js/newton-history.js:2060`, `tournament.html:253` (back button), `js/main.js:319-333` (`autoLoadCurrentTournament`), `js/tournament-management.js:586` (guard)
- **Issue (two parts):**
  1. Previewing a bracket from Analytics writes the preview into `currentTournament`, and the back button does `localStorage.removeItem('currentTournament')` — the user's real active tournament is silently deactivated on next reload.
  2. Reloading *while previewing* is worse: `autoLoadCurrentTournament` rebuilds the tournament object without the `_analyticsPreview` field, so the guard in `saveTournamentOnly` is lost and the next save persists the preview into `dartsTournaments` as a real local tournament.
- **Fix:** Include `_analyticsPreview` in the fields copied by `autoLoadCurrentTournament`; have the preview flow stash the prior `currentTournament` value and restore it on exit instead of deleting.
- **Verify:** With an active tournament, preview an analytics bracket, hit back, reload — active tournament still loads. Reload mid-preview — preview does not appear in Recent Tournaments.

### 4.4 Deeper import validation

- **Where:** `js/tournament-management.js:1561-1637` (`validateTournamentData`)
- **Issue:** Validates name/date/arrays-are-arrays but nothing about match shape (`id`, `player1/2`, `completed`, `finalScore`), bracket structure, or placements. Malformed matches flow into `renderBracket`, progression lookups, and innerHTML (feeds Phase 3). Garbage `matches` imports "successfully" and crashes at render.
- **Fix:** Validate minimal invariants: every match has a string `id`, `player1`/`player2` are objects or null, `completed` is boolean, `placements` values are numbers, player `name`s are strings. Reject (with a clear message) or strip what fails.

### 4.5 Player-list import can brick the Registration page

- **Where:** `js/player-management.js:257-262, 318-338`
- **Issue:** Imported `data.playerList` entries are never checked to be strings. One number/object in the file is saved to `playerList`; every subsequent `renderPlayerList()` throws at `name.toLowerCase()` (line 89) — the page is broken until localStorage is hand-edited.
- **Fix:** `importedList.filter(n => typeof n === 'string' && n.trim())` before saving.

### 4.6 NewtonDB write-path atomicity

- **Where:** `js/newton-db.js:118-140` (`saveMatch`), `148-159` (`deleteTournament`), `361-371` (`importAll`)
- **Issues:**
  - `saveMatch`: the `getMatch` existence check runs in a separate transaction from the write (TOCTOU). Two near-simultaneous saves for the same `(tournamentId, matchId)` both see "no existing", both `add()`; the second rejects on the unique `tournamentMatch` index and the re-completion is silently lost if unhandled.
  - `deleteTournament`: one transaction per match in a loop — a mid-loop failure leaves a half-deleted tournament; also slow.
  - `importAll`: two transactions per match record — very slow on large dumps.
- **Fix:** `saveMatch`: do the index lookup and the write inside one `readwrite` transaction (issue `index.get()` and write in its `onsuccess`). `deleteTournament`: single transaction over both stores, delete matches via the `tournamentId` index cursor. `importAll`: batch within one transaction.

### 4.7 `crypto.randomUUID()` crashes on plain-HTTP deployments

- **Where:** `js/results-config.js:81`
- **Issue:** Outside the try/catch, `crypto.randomUUID` is undefined in non-secure contexts — and self-hosted Docker over `http://<lan-ip>` is a supported deployment (HTTP_PORT). The uncaught TypeError aborts the file's remaining top-level execution and `serverId` is never generated, breaking QR payload identity.
- **Fix:** Move inside the try/catch with a fallback: `crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join('')`.
- **Verify:** Serve over plain HTTP from a non-localhost IP; config loads, serverId present, QR assignment works.

### 4.8 Async render races in Analytics

- **Where:** `js/newton-history.js:295-324` (`_recomputePoints`), `renderDashboard`, `renderLeaderboard`, `renderPlayersTab`
- **Issue:** Each render awaits multiple IndexedDB reads with no generation token. Rapidly toggling point mode/layers or changing scope fires overlapping renders; last-to-finish wins and may paint the *older* mode's data.
- **Fix:** Module-level `let renderSeq = 0;` — capture `const seq = ++renderSeq` at entry, bail before touching the DOM if `seq !== renderSeq`.

### 4.9 Register-tab renders swallow DB errors

- **Where:** `js/newton-history.js:1814` (`renderAllMatches`), `1330` (`renderTournamentList`); callers fire-and-forget (`switchView` 209-237, `switchRegisterTab` 1748)
- **Issue:** A DB error leaves the panel blank/stale with only an unhandled rejection in the console — while `renderDashboard`/`renderLeaderboard` handle errors properly.
- **Fix:** Mirror the dashboard's try/catch-with-placeholder pattern.

### 4.10 (Design item, discuss before doing) localStorage schema version

Exports carry `exportVersion`, but the localStorage records (`dartsTournaments`, `currentTournament`, `dartsConfig`) have no version marker — migrations are scattered heuristics (`bracketSize` backfill, `format` absence, `shortLegs` shape). A single `schemaVersion` field would let future migrations run once at load instead of defensively everywhere. Worth discussing scope before implementing.

---

## Phase 5 — Dead Code Removal

> **Status: Implemented & committed 2026-07-04** (commit `8885755`; ~950 lines deleted across 8 files; every symbol re-verified caller-free by grep at delete time). **Independently re-verified 2026-07-04:** all changes are deletions-only, `node --check` passes on every touched file, and grep confirms no dangling references to any deleted symbol — the non-obvious bracket-lines.js removals (dead `finalsX` params, five zero-sized connector divs, `bronzeX === undefined` branches) were each traced to their call sites (all four SE layouts always pass a computed `bronzeX`, so those branches were unreachable). Deviations from the list below:
> - `buildMatchSourcesLookup` (analytics.js) was **NOT deleted** — the review claim was wrong; it has a live caller in bracket-rendering.js (`showMatchProgression` "Fed by" line). Kept.
> - `getUndoneTransactions` turned out to live in clean-match-progression.js (not bracket-rendering.js); deleted there together with `saveUndoneTransactions` and `clearTournamentCompletionState`, both newly orphaned by the 5.1 deletion.
> - Deliberately kept, pending separate decisions: `match.state` writes, the `|| 10` maxLanes fallbacks in lane-management.js.
> - The dead `${redoButton}` template interpolation and the stale `rebuildBracketFromHistory` mention in types.js were removed as part of their parent deletions; `undoManualTransaction`'s JSDoc steps 5–7 rewritten to describe the actual in-place rollback.
> - The duplicated window-export block in clean-match-progression.js was a strict subset of the surviving one; the load-confirmation console.log was relocated, nothing else moved.

Deletions only; git history preserves everything. The dangerous ones first.

### 5.1 Dead parallel undo implementation — DANGEROUS ⚠️

- **Where:** `js/clean-match-progression.js:2669-2964` — `undoTransaction()`, `undoTransactions()`, `clearPlayerFromDownstream()`, `hasWalkoverPlayer()`
- Zero callers anywhere (verified across js/, tournament.html, chalker/). The live undo is `undoManualTransaction()`. `undoTransactions()` dereferences `transaction.beforeState.matches` (2720), but COMPLETE_MATCH transactions no longer carry `beforeState` (removed at 584 for storage savings) — it throws immediately. Yet it is still **exported on window** (3309-3310): one console call or one future misunderstanding away from corrupting a live tournament.
- Also dead in the same file: `getDownstreamMatches()` (:815), `processAutoAdvancement()` *singular* (:1159 — picks the **opposite** winner from the live plural version for walkover-vs-walkover; actively misleading), `handleBracketGenerationError()` (:3161).

### 5.2 Dead redo system — crashes if invoked ⚠️

- **Where:** `js/bracket-rendering.js:1269-1337, 2556-2557`; UI hookup commented out at 1494-1500
- `getRedoableMatches`/`handleRedoClick` are window-exported and depend on the removed `beforeState` (1312 throws); `getUndoneTransactions()` reads a never-written `undoneTransactions` localStorage key. Delete functions, commented UI block, and exports.

### 5.3 `rebuildBracketFromHistory()` — 160 dead lines with a misleading JSDoc ⚠️

- **Where:** `js/bracket-rendering.js:3044-3205`
- Zero callers. `undoManualTransaction`'s JSDoc step 6 (2850) **falsely claims undo uses it** — correct the JSDoc when deleting. If ever revived it would corrupt slot semantics (3099-3103 force winners into `player1`, breaking positioning/first-throw) — one more reason to remove rather than keep "just in case".

### 5.4 Other dead code

| Where | What |
|-------|------|
| `js/tournament-management.js:4, 910-913` | `showingAllTournaments` / `toggleTournamentView` — superseded by the `...Local...` variants |
| `js/player-management.js:585-589` | `safeSaveTournament` — never called |
| `js/lane-management.js:4-10` | `config.lanes` bootstrap is dead (lane-management loads before results-config; `config` is always undefined at parse time). Note: its `\|\| 10` maxLanes fallbacks (33, 139, 254) disagree with `DEFAULT_CONFIG.lanes.maxLanes = 4` — align when touching |
| `js/lane-management.js:297-333`, `js/results-config.js:248-279` | `updateLaneConfiguration` / `saveConfiguration` — no UI references (config page uses the specific save functions); `saveConfiguration` would silently drop SE/Chalker leg settings if ever wired up |
| `js/analytics.js:1452-1470` | `buildMatchSourcesLookup` never called — `showMatchProgression` rebuilds the same lookup inline at 1491-1506 |
| `js/bracket-rendering.js:2101, 2162`, `js/clean-match-progression.js:2069` | Scroll-preservation blocks target `.cc-modal-content`, which doesn't exist in the DOM — no-ops (the real container is preserved at 3829/4331) |
| `js/bracket-rendering.js:3208-3221, 2966` | `match.state` is write-only — persisted, absent from the `Match` typedef, never read (`getMatchState()` derives) — remove or document |
| `js/bracket-rendering.js:226-247, 542-565` | Unreachable "default positioning" fallbacks (DE is always 8/16/32) |
| `js/bracket-rendering.js:12` | Unused `zoomAnimationFrame` |
| `js/bracket-rendering.js:2133` | Dead `else` in `updateMatchReferee` (`parsedRefereeId` can't be falsy there) |
| `js/bracket-lines.js:476-506, 702-716, 1839-1842, 1980` | Duplicate stacked line + `display:none` placeholder; five zero-sized divs in 8P connectors; dead `bronzeX === undefined` branches |
| `js/bracket-lines.js:1208, 1705` | `finalsX` computed from the wrong base (`round1X` instead of `round4X`/`round5X`) — harmless only because the parameter is dead in all three BS-FINAL indicator functions; delete the computation and parameter before someone "uses" them |
| `js/clean-match-progression.js:2112-2139` vs `3306-3358` | Duplicated window-export blocks (~15 functions exported twice) — keep one |
| `chalker/js/chalker.js:2109-2117` | (See 1.13j — dead branch is either fixed or removed there) |

---

## Phase 6 — Performance & Consolidation

Opportunistic; each item independent. The duplications matter more than the cycles — they're where future edits will silently diverge.

### Performance

| # | Where | Issue | Fix |
|---|-------|-------|-----|
| 6.1 | `js/bracket-rendering.js:1468` | Every match card re-parses full transaction history from localStorage: `renderMatch()` → `isMatchUndoable()` → `getTournamentHistory()` — ~63 full `JSON.parse` calls per `renderBracket()` on a 32-player DE bracket, and `renderBracket()` runs after every lane/referee/completion change. `checkRefereeConflict()` per card (1423) adds an O(n²) scan | Parse history once per render pass; thread it through (optional pre-fetched `history` arg or per-render memo) |
| 6.2 | `js/clean-match-progression.js:605-606, 644-646, 665, 689, 732` | One `completeMatch()` runs `saveTournament()`/`updateResultsTable()` 2–4 times (full JSON serialization each) | One save at the end of the success path. Related: 3139-3154 schedules `showMatchCommandCenter()` twice via overlapping 100ms/500ms timeouts |
| 6.3 | `js/tournament-management.js:1660-1665` | `updateTournamentWatermark` re-reads and re-parses the full `currentTournament` blob from localStorage on every save, when the global `tournament` object is authoritative | Use the in-memory object |
| 6.4 | `js/dynamic-help-system.js:673-689` | MutationObserver on the whole body subtree incl. attributes — fires on every DOM mutation in the app (bracket renders, clock ticks), each running `querySelector('.page.active')` | Drop the observer; update `helpState.currentPage` from `showPage()`/`onPageChange()` |
| 6.5 | `js/newton-history.js:350-353, 563-579, 914-916, 1818-1819` | Four views fetch per-tournament matches *sequentially* (`for … await`), and every point-mode/layer toggle refetches everything from IndexedDB though only client-side multipliers changed | `Promise.all(...)`; cache matches alongside `_allTournaments`, invalidate via `_invalidateCache` |
| 6.6 | `js/bracket-lines.js` (~20/render), `js/bracket-rendering.js` (49, incl. per-player on every Command Center open :3681-3706) | Debug console.log noise | Remove or gate behind `developerMode` |

### Consolidation (duplication that will drift — some already has)

| # | What | Where | Note |
|---|------|-------|------|
| 6.7 | Three byte-identical BS-FINAL indicator functions | `js/bracket-lines.js:739, 811, 1391` | **Already drifted:** `'Ïnter, sans-serif'` typo at :862 breaks the Inter font on 16-player brackets. Also `createLoserFeedLine` defined identically 3× (:655, :1022, :1476, differing only in z-index) — one module-level helper each |
| 6.8 | Downstream undo-blocking logic duplicated | `js/bracket-rendering.js:2596-2630` vs `4874-4918` | ~35 near-identical lines that must stay in lockstep — both carried bug 1.2. Extract one helper returning blocking match IDs; derive the boolean and the status text from it |
| 6.9 | `exportTournament` duplicates `buildTournamentPayload` | `js/tournament-management.js:200-257` vs `264-303` | Former should call the latter. While there: revoke the `URL.createObjectURL` (250-254) and sanitize filesystem-hostile characters in the filename |
| 6.10 | Achievement-points formula ×4–5 | `js/newton-history.js:871-875, 1291-1294, 1826-1832, 1988-1995, 2185` | Extract `_achPoints(stats, p)` |
| 6.11 | Players-tab aggregation ⊂ leaderboard aggregation | `js/newton-history.js:545-579` vs `830-933` | Splitting `renderLeaderboard` (~280 lines) into aggregation + presentation unlocks sharing |
| 6.12 | Inline base64 visit decoding | `js/newton-history.js:940-942, 2153-2155` | Call `NewtonStats.decodeVisits` (js/newton-stats.js:14) |
| 6.13 | `parseExcludedLanes` ≡ `parseExcludedLanesString` | `js/lane-management.js:280` vs `js/results-config.js:307` | Keep one |
| 6.14 | `developerMode` localStorage IIFE ×3 | `js/tournament-management.js:1745, 1784`, `js/player-management.js:644` | Also reads localStorage instead of the in-memory `config` — contradicts single-source principle |
| 6.15 | Paid-players sort + placement sort ×4 | `updateResultsTable`, `generateResultsJSON`, `buildResultsCSVData`, `renderPlayerList` variants | Extract |
| 6.16 | `resetZoom()` duplicates the per-format/size zoom-pan defaults from `renderBracket()` | `js/bracket-rendering.js:1893-1933` vs `54-91` | The "TODO: Test and adjust" values exist in only one copy — extract `getDefaultView(format, bracketSize)` |
| 6.17 | `render32PlayerBacksideMatches` inlines `createBacksideBackground`'s 32P branch | `js/bracket-rendering.js:759-782` | 8P/16P call the shared function (:576, :649) — do the same |
| 6.18 | `updateMatchReferee` clear/assign paths ~45 duplicated lines | `js/bracket-rendering.js:2067-2172` | Also calls `refreshAllRefereeDropdowns()` then `renderBracket()`, which rebuilds all dropdowns anyway |
| 6.19 | 32P placement labels recompute match Y positions from scratch | `js/bracket-lines.js:314-374` | Currently correct but desyncs silently on any layout change — pass Y values from bracket-rendering.js:904-908 like 8P/16P do |
| 6.20 | Chalker hardcoded `SHORT_LEG_THRESHOLDS` vs TM's configurable `config.legs.shortLegThreshold` | `chalker/js/chalker.js:451-462` vs qr-bridge.js:312 / newton-stats.js:33 | If TM config differs, Chalker's "Short Leg" badge disagrees with awarded achievements — carry the threshold in the assignment payload |
| 6.21 | `detectQRCode`/`isQRScanAvailable` duplicated TM↔Chalker, already drifted | `chalker/js/chalker.js:916-931` vs `js/qr-bridge.js:17-46` | Intentional standalone copies — add a "keep in sync" comment like the integrity module has (the two `newton-integrity.js` copies were diffed: byte-identical, no action) |

### Oversized functions (split when touched, not as a dedicated pass)

`bracket-rendering.js`: `showMatchCommandCenter`; `tournament-management.js`: `loadRecentTournaments` (~165), `updateTournamentWatermark` (~165), `continueImportProcess` (~110); `results-config.js`: `updateResultsTable` (~95); `analytics.js`: `showLocalStorageUsage` (~315), `showMatchProgression` (~325); `newton-history.js`: `renderLeaderboard` (~280). Splitting HTML-building from data assembly in these also makes the Phase 3 escaping work tractable.

### JSDoc / docs drift (ride along with whichever phase touches the file)

- `CompletionType` typedef lacks `'QR'` (live value — qr-bridge.js:493); `Transaction` typedef lacks the `achievements` field stored at clean-match-progression.js:585
- `completeMatch` (:557) doesn't document `rawLegs`/`firstStarter`
- Stacked contradictory JSDoc on `generateCleanBracket` (:1330-1356); orphaned doc at :856; `calculateAllRankings` undocumented though marked DONE in types.js
- `bracket-lines.js`: `createBracketLabels`/`createSEBracketLabels`/`createSEFinalsLines` docs don't match return counts / `bronzeX` params; `createSEPlacementLabels` doc (:1848) describes behavior the code doesn't have
- `undoManualTransaction` JSDoc falsely references `rebuildBracketFromHistory` (fixed in 5.3)
- Minor: help system's Escape handler fires alongside the dialog-stack Esc handler in main.js (dynamic-help-system.js:716-718) — pressing Esc with both open closes both
- Note for smart pruning UX: pruning removes all START_MATCH transactions (analytics.js:3276-3282), but `getTournamentTimingStats` (403-479) derives durations exclusively from START/COMPLETE pairs — after pruning, timing degrades to N/A while the UI copy calls the data "redundant". Either keep the last START per match or state the trade-off in the preview text
- `js/analytics.js:551` — `tournament.readOnly` dereferenced without a null guard (405 uses `tournament?.status`); dev console with no tournament loaded throws
- `js/newton-csv.js` — rows joined with `\n` instead of RFC 4180 `\r\n` (Excel tolerates; cosmetic)

---

## Appendix A — Withdrawn / Descoped Findings

**A.1 "SE finalization can fire before the bronze match completes" — WITHDRAWN (2026-07-04).**
The original reviewer claimed the SE final and bronze become playable simultaneously. Incorrect: `canStartMatch()` at `js/bracket-rendering.js:1797-1805` explicitly blocks starting the SE Final until the bronze match is completed. Enforcement lives at the render/start layer (consistent with how undo eligibility is enforced at render time), not in clean-match-progression.js where the reviewer looked. Since the QR/Chalker path also requires a match to be started through the same gate, there is no side door.

**A.2 API authentication and CORS — DESCOPED (maintainer decision, 2026-07-04).**
The API's no-built-in-auth model is documented (DOCKER-QUICKSTART.md "Security": reverse proxy with basic auth, LAN-only, or VPN). Adding auth to the PHP endpoints is intentionally out of scope; deployers who expose the API are responsible for protecting it. CORS `Access-Control-Allow-Origin: *` headers are retained — they may be load-bearing for direct browser-to-remote-server tournament upload. Only the deployer-neutral robustness items in Phase 2 remain in scope.

## Appendix B — Explicitly Verified Clean

For future reviewers — these were checked in depth and found correct:

- **Progression tables:** all drawn bracket lines/convergences in bracket-lines.js match `DE_MATCH_PROGRESSION` for 8/16/32; placement label texts match the table comments; every live call site uses `getProgressionTable()` correctly for SE vs DE.
- **Chalker scoring math:** `ILLEGAL_SCORES`, bogey checkouts, `getMinDartsForCheckout` (including the 100/101/104/107/110 two-dart set) — correct.
- **`js/qr-generator.js`:** byte-mode QR v1–10 with M ECC — capacity table, mask penalty scoring, format bits all check out.
- **`js/newton-csv.js`:** escaping correct (fields quote-wrapped, inner quotes doubled) — commas/quotes/newlines in names export safely.
- **`js/newton-stats.js`:** pure functions, safe base64 fallback, `tons >= 100` matches documented intent.
- **`chalker/js/db.js`:** sound; the error-swallowing `resolve(null)` pattern is a deliberate resilience choice.
- **The two `newton-integrity.js` copies:** byte-identical — no drift.
- **Config load path** (`loadConfiguration`/`mergeWithDefaults`): robust — try/catch, default merge, additive migration.
- **No implicit globals** in the three bracket files (`matches = []` at clean-match-progression.js:1642 intentionally reassigns the main.js global); no event-listener leaks in render paths; `processAutoAdvancements`' recursion guard and iteration cap are adequate.
- **Leaderboard math:** placement keys, layer toggles, participation per tournament, personal bests, rank assignment — internally consistent. (Cell-content escaping in `NewtonTable.render` is done correctly; the XSS issues are confined to inline event-handler strings.)
- **`showUploadModal`** (tournament-management.js:398-428) builds DOM with `textContent` — the in-repo model for the Phase 3 pattern.

## Appendix C — Known listener-hygiene item

`js/clean-match-progression.js:2322-2336` vs `2417-2423` — `showWinnerConfirmation()` adds anonymous input listeners to `#winnerLegs`/`#loserLegs` on every open, but `cleanup()` removes `validateInputs`, which was never attached (a no-op). Listeners accumulate for the session, each closing over a stale `match`. Fix by storing the actual handler references and removing those — mirror the `modal._cancelHandler` pattern at :2454. (Belongs to Phase 1 hygiene but listed separately because it's a leak, not a user-visible bug.)
