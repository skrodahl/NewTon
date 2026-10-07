# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

### Reset tournament: Restart the draw (same pairings)

Raised 2026-10-04. Early in a night, the wrong players get called to a board, or a late arrival can't be let in because matches on the backside or in frontside round 2 have started, and people ask to restart. Reset tournament… today goes back to New, which means a new shuffle: not wanted. Undoing matches until one BYE slot frees up is unfair, because the operator then decides where the late arrival goes (Late registration places them randomly among the free slots).

**Proposal (discussed, not approved):** Reset tournament… offers two choices, **Restart the draw** (preselected) and **Back to New**.
- *Restart the draw* keeps the pairings and clears everything played: results, live matches (lanes, referees), history, placements, statistics. The draw is read back from the current frontside round 1 matches (FS-1-n holds positions 2n-1 and 2n; later rounds start empty), not from `tournament.bracket`, because Late registration changes the round 1 match but not `tournament.bracket`, so late arrivals keep their place. Then the two steps the app runs after a shuffle: `generateAllMatches()` and `processAutoAdvancements()`, existing functions, `clean-match-progression.js` untouched; `tournament.bracket` is updated to match. Afterwards every BYE slot is free, so a late arrival goes in fairly through Late registration.
- *Back to New* is today's reset. Restart = Back to New + rebuilding the same draw, so the clearing is written once.
- **Gaps in today's reset, fixed for both:** (1) the Analytics register keeps the results already written (each real result is saved at completion; walkovers are not), so remove the tournament's records, as undo removes one; (2) network handover keeps lane assignments and results waiting on the server, so clear them; (3) a Chalker still scoring a voided match can return a result for the same match number, now a different pairing, and nothing checks the names: compare the result's player names with the match's and refuse a mismatch (no Chalker change; short names are unique since the player database). Alternative: a draw number echoed by the Chalker (changes the Chalker and its QR format).
- **Confirmation:** what is discarded ("1 result, 4 live matches"), the live matches' lanes so the boards can be told to stop, type the tournament name, and **Export first** when there are real results.
- Lost on restart: the history entry recording a late registration (the player stays).
- Open: name check or draw number; which release (it changes how results are accepted, so not a patch-level change).

### A Season concept

Raised 2026-10-04, while building the v5.3.0 podium. A "Season leader" award (who tops the half-year in Analytics) was tried and dropped: a half-year holds every finalized tournament, including cups and one-off nights that don't belong to the club's season, so it could crown the wrong player in the photo that goes to the club chat. Analytics gets away with half-years because the Lens lets a viewer pick tournaments; a fixed award can't. A season would name which tournaments count (and when it starts and ends), so standings, a Season leader award, and perhaps the Lens default could use it. Not scoped; discuss first, including where a season lives (Global Settings, the Analytics register, or the tournament itself).

Since v5.3.1, seeding does this by name instead: the mini-lens ranks on tournaments whose name matches the active tournament's, in the current (or previous) half-year, with finals left out. A real Season concept could replace that guesswork, and would also be the natural source for the season final's invite list.

---

## Next
*Ready for implementation when time permits*

**The two next things (2026-10-06): other tournament formats, then the Chalker iOS capture check** (it waits for an iOS device to borrow).

### Other tournament formats

Raised 2026-10-06, and the reason for the formats registry and the app remake: the first non-elimination format is **the season final**, in December. Bump the version to **5.4.0** when more formats arrive.

**The season final ("Måndagscup Final"):** the season's top 16 are invited. Four groups of four, seeded, round-robin in each group (everybody plays everybody). The top two of each group go to the **A-final**, the bottom two to the **B-final**. A and B are cups: four matches on each side, progressing towards the middle; the last two standing meet in the Grand Final, the two semifinal losers in the Bronze final.

**What exists to build on:**
- `TOURNAMENT_FORMATS` (js/results-config.js) is the registry for what to offer; progression tables, rendering and ranking stay per format, as for DE and SE.
- Seeding (v5.3.1): `js/seeding.js` decides who the seeds are (the ranked list, per tournament name and period) and knows nothing about brackets. A group draw would take the same list and deal it into four groups, instead of calling `placeSeededPlayers()`.

**Decided with the maintainer (2026-10-07):**
- Group tiebreakers today: wins, legs, leg difference, head-to-head; never a tie after that. Suggested order: wins, leg difference, legs won, head-to-head (a mini-table for three-way ties), then "decide on the night" set by the operator. Not settled.
- Match length: best of 5 on the final night; the final perhaps best of 7.
- Every group match must finish before the cups are drawn: until then nobody knows where players end up.
- A and B are separate competitions. Their draws are seeded from the group results; the top two of each group go to A, the bottom two to B.
- The cups map onto what exists: each is an 8-player single elimination with a bronze final (SE progression tables), drawn with seeding's "All" mode, seeded from the group tables instead of Analytics. New: the group stage (draw, round schedule, table) and the handover into the cups.

- The cups as the maintainer describes them (8 players: two quarterfinals → a semifinal on each side, the final in the middle, semifinal losers in the bronze final) are exactly the existing 8-player SE with bronze. What's new is the drawing: SE always lays out left to right (`finalsVariant()` returns 'se'; the Finals Right | Middle switch is DE only). A mirrored SE "middle" layout in `layoutFor()` (bracket-view.js) would draw the cups this way, and give ordinary SE cups the Middle option too. Presentation only.

**First step (agreed 2026-10-07, after v5.3.2):** the SE middle layout on its own. Small and self-contained, useful at once (every SE cup gets the Middle option members like in DE), and the cups will have been seen on normal nights by December.

**Still open:** where the bronze final sits in the SE middle layout (under the final, in the centre column?); how to show the A and B cups side by side (tabs, or both on one page); ranking across groups for the cup seeds (e.g. winners 1-4, runners-up 5-8); whether group-mates may meet in the cup's first round; placings (A 1-8, B 9-16?) and whether and how the final counts for points.

**To work out first (discuss, mockup before code):**
- The group stage: round-robin tables and tiebreaks (wins, then legs? head-to-head?), how it fits Match Controls, the lanes and the history/undo model, and how groups feed the A and B cups.
- How the bracket view draws a group stage and two cups (BracketView lays out from the progression tables, one layout per format).
- Ranking, points and placements for a format with two cups, and what Analytics and the podium show.
- The invite list: the top 16 from the ranking, shown before the draw (the Season concept in the Inbox is the natural source).
- Any Round Robin has to be spelled out in `llms.txt` ("do not invent features") once it exists.

---

### Chalker iOS image capture — possibly decoding the previous photo

Observed on iPhone 12 Mini, iOS 26.5, Safari. After multiple captures in the same scan modal session, the decode result *appears* to lag by one — a "really good" photo failed to decode while preceding "bad" photos succeeded, suggesting the decoder may be running against the previously-captured file.

**Suspected cause:** `chalker/js/chalker.js` `startImageCapture()` does not clear `elements.qrImageInput.value` on every code path. On the success-but-validation-failed branches in `handleQRPayload()` (JSON parse error, wrong payload type, integrity check fail) the modal stays open with `input.value` still holding the previous file. iOS Safari's `<input type="file" capture>` is known to misbehave when value isn't reset between captures.

**Next step:** add a small thumbnail preview in the scan modal showing exactly what was just captured. The preview will confirm or rule out the bug visually — if the preview shows the new photo but the decode reports the old result, the bug is real. Apply the targeted fix (clear `input.value` at the top of the `onchange` handler, immediately after grabbing `e.target.files[0]`) once confirmed.

**Also test in Chrome on iPhone** to rule out a Safari-specific issue vs. a code bug.

---

### Seeding: loose ends

From v5.3.1; none of them urgent.
- **Point mode:** the ranking follows the Leaderboard's point mode and layers, so someone who switched Analytics to Custom in the same page session seeds from Custom points. Fine in practice (Analytics opens on As played); a fixed mode would remove the coupling.
- **Read once:** the mini-lens reads the tournament list when setup starts. A backup restored while Match Controls is open needs a reload.
- **This browser only:** seeding reads the tournaments in the browser that does the draw. A draw on a computer without the history is random, and the panel says so.
- **First real use:** not seen in a real tournament yet; check the name matching on real tournament names.

---

### Doc pages — back link broken on `file://`

All doc pages use `href="/"` for the "← NewTon DC Tournament Manager" back link. This works on Docker (`/` is the app root or landing page) but navigates to the filesystem root on `file://`.

**Not fixable with a simple href change.** `href="tournament.html"` would work locally but bypasses the landing page on Docker deployments with `NEWTON_LANDING_PAGE=true` (e.g. newtondarts.com). No single href works for both environments.

**Current approach:** keep `href="/"`. Local file users close the tab — doc pages opened from the ℹ️ icons open in a new tab anyway.

---

### User Guide — QR Workflow Illustration

The TM→Chalker QR assignment and result reporting workflow spans two devices and is hard to convey in text alone. One or two targeted screenshots or a simple diagram showing the flow would be sufficient. No full screenshot coverage — too much maintenance overhead for a living project.

---

### Storage Space dialog — tighter copy + note that stats survive deletion

The Storage Space dialog (`showStorageManagement` in `tournament-management.js`) is text-heavy and omits a reassuring fact: **deleting a tournament from the Recent list keeps its stats in Analytics.** `confirmDeleteTournament` only removes the localStorage keys (`dartsTournaments` + the per-tournament `tournament_<id>_history` key); it never touches NewtonDB/IndexedDB, so finalized stats (leaderboard, achievements) survive deletion.

**Do:** trim the "How to Free Up Space" bullets, and add a line such as *"Deleting a finalized tournament keeps its stats in Analytics"* so operators aren't afraid to free space.

**Floated but not recommended:** a one-click "delete the oldest 50%" button. Bulk automated deletion is a footgun against the app's export-before-destroy ethos, and "oldest 50%" is an arbitrary heuristic with its own edge cases. The reassurance text is the better lever for the "afraid to delete" concern — keep deletion explicit and per-tournament.

---

## Later
*Worth tracking but not urgent*

### Automated Testing

Flagged as the single most impactful improvement by the independent code audit (April 2026, `Docs/CodeReview/INDEPENDENT-AUDIT-2026-04.md`). The lookup-table architecture is highly testable — each entry in `DE_MATCH_PROGRESSION` and `SE_MATCH_PROGRESSION` can be verified mechanically.

**What to test first (from audit recommendations):**
- Progression tables — verify every match outcome routes to the correct winner/loser destination for 8, 16, and 32-player brackets
- `completeMatch() → advancePlayer()` pipeline — clear inputs and outputs
- Undo/redo — transaction rollback, achievement reversal, cascade through dependent matches
- Ranking calculations — per-bracket-size ranking functions for DE and SE

**Why it's not urgent:** The architecture is proven by hundreds of real tournament nights across v4 and v5. No automated tests exist, but the hardcoded lookup tables and single code path eliminate the class of bugs that tests would typically catch. The value is confidence during refactoring and future feature additions, not catching current bugs.

**Implementation approach:** Own tests first, then GitHub Actions to run them automatically.
- `node --test` (built into Node.js, zero dependencies) as the test runner — consistent with the zero-dependency philosophy
- Test files in `tests/` — pure logic tests against lookup tables and functions. No browser, no DOM, no mocking. Just "given this match result, does the winner go to the right place?"
- `.github/workflows/test.yml` to run on every push. Takes seconds, costs nothing. Blocks the build if something fails.

---

### Chalker — Google Play Store distribution

The Chalker is already a PWA. Wrap it as a Trusted Web Activity (via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)) and ship to the **Google Play Store** — one-time $25 developer fee, single codebase, same QR scanner, same offline behaviour. Makes the Chalker findable in the place darts players and clubs actually look for tablet scoring apps: app-store searches for "darts scorer", "x01", "darts referee app".

**Why this matters beyond convenience:** Play Store presence is a discovery funnel into NewTon TM. The TM→Chalker QR handshake already exists. A darts ref or club operator who finds the Chalker via app-store search, installs it, scores a match at the board, and notices the QR scanner eventually asks *"what's the TM, can I run a tournament with that?"* NewTon DC currently has no app-store presence; the Chalker on Play Store changes that, even though it's the companion app rather than the main product.

**Store listing voice:** clean, professional, utility-focused — *"tablet-optimised x01 scoring with QR result handoff to your NewTon DC tournament."* Actual product copy.

**Economics:** the $25 Play Store developer fee is one-time per account, not per app. Whichever app ships first justifies the registration; subsequent listings are essentially free.

**Adjacent free venues to consider:** F-Droid (FOSS audience, requires reproducible builds), Amazon Appstore (zero fee, marginal users). **iOS App Store deferred** until Play numbers justify the $99/year fee — iOS users can already install the Chalker as a PWA via Safari's *Add to Home Screen*, with full-screen standalone, offline scoring, and working QR scanning intact (the QrScanner swap from v5.0.15-b.1 was specifically the iOS fix). The deferral is about *discovery on iOS*, not *capability on iOS*.

**Why deferred:** real ongoing maintenance surface — store assets (screenshots, description, feature graphic), policy compliance (Google's review can surface friction), changelog discipline on every Chalker release. Worth doing deliberately, not opportunistically.

---

### Known Issue: Undo eligibility does not follow walkover chains

The undo check looks one level deep into downstream matches. If a downstream match is an AUTO-completed walkover, it is correctly ignored — but the check does not continue further down the chain. This means a match can show "Can Undo" even if a player has auto-advanced through a walkover into a live or manually-completed match further downstream.

**Why it's low priority:** Requires a specific combination of conditions — a deep BYE chain in a large bracket, an upstream manual match being undone, and a live or completed match at the end of that walkover chain. Always recoverable by stopping the affected downstream match first.

**Slightly elevated risk with Late Registration**, which operates in BYE-heavy brackets and increases the likelihood of long walkover chains. Still a compounding probability scenario; parking for now.

**Fix when addressed:** `isMatchUndoable()` and the bracket tooltip function in `js/bracket-rendering.js` should follow AUTO-completed downstream matches recursively until reaching a non-AUTO match, then apply the existing live/MANUAL checks.

---

### Migrate tournaments from localStorage to IndexedDB?

Move tournament storage (`dartsTournaments` / `currentTournament`) off localStorage (~10 MB cap — the quota problem behind Phase 4.2) and into IndexedDB, which the app already uses for match/analytics data (NewtonDB) and whose quota is effectively unbounded for darts data.

**Current lean: no.** localStorage tournament access is **synchronous and pervasive** — `saveTournamentOnly` (every match completion), `loadSpecificTournament`, `createTournament`, `autoLoadCurrentTournament`, `readTournamentsRegistry`, the watermark/render paths. IndexedDB is async, so migrating turns one contained problem into async rippling through the entire save/load/render layer, up against the protected transaction/undo foundations — a high-blast-radius, spiralling dependency-chain change (the kind the design philosophy exists to avoid), plus a one-time migration path with its own backward-compat corner cases.

For the actual problem (quota), the contained fix is the Phase 4.2 storage gate (block create/import near the limit + a loud-fail save wrap) — blast radius of one function. Revisit only if quota becomes a routine pain the gate can't absorb.


## Decided Against
*Features that were considered but explicitly rejected*

*(empty)*

---

**Last updated:** October 6, 2026 — Registration rework, Analytics future enhancements and the grey frame done; added Other tournament formats (the December season final) and Seeding loose ends; next: other formats, then the Chalker iOS capture check (needs a borrowed iOS device)
