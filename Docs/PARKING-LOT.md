# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

*(empty)*

---

## Next
*Ready for implementation when time permits*

### Doc pages — back link broken on `file://`

All doc pages use `href="/"` for the "← NewTon DC Tournament Manager" back link. This works on Docker (`/` is the app root or landing page) but navigates to the filesystem root on `file://`.

**Not fixable with a simple href change.** `href="tournament.html"` would work locally but bypasses the landing page on Docker deployments with `NEWTON_LANDING_PAGE=true` (e.g. newtondarts.com). No single href works for both environments.

**Current approach:** keep `href="/"`. Local file users close the tab — doc pages opened from the ℹ️ icons open in a new tab anyway.

---

### User Guide — QR Workflow Illustration

The TM→Chalker QR assignment and result reporting workflow spans two devices and is hard to convey in text alone. One or two targeted screenshots or a simple diagram showing the flow would be sufficient. No full screenshot coverage — too much maintenance overhead for a living project.

---

### Chalker iOS image capture — possibly decoding the previous photo

Observed on iPhone 12 Mini, iOS 26.5, Safari. After multiple captures in the same scan modal session, the decode result *appears* to lag by one — a "really good" photo failed to decode while preceding "bad" photos succeeded, suggesting the decoder may be running against the previously-captured file.

**Suspected cause:** `chalker/js/chalker.js` `startImageCapture()` does not clear `elements.qrImageInput.value` on every code path. On the success-but-validation-failed branches in `handleQRPayload()` (JSON parse error, wrong payload type, integrity check fail) the modal stays open with `input.value` still holding the previous file. iOS Safari's `<input type="file" capture>` is known to misbehave when value isn't reset between captures.

**Next step:** add a small thumbnail preview in the scan modal showing exactly what was just captured. The preview will confirm or rule out the bug visually — if the preview shows the new photo but the decode reports the old result, the bug is real. Apply the targeted fix (clear `input.value` at the top of the `onchange` handler, immediately after grabbing `e.target.files[0]`) once confirmed.

**Also test in Chrome on iPhone** to rule out a Safari-specific issue vs. a code bug.

---

### Storage Space dialog — tighter copy + note that stats survive deletion

The Storage Space dialog (`showStorageManagement` in `tournament-management.js`) is text-heavy and omits a reassuring fact: **deleting a tournament from the Recent list keeps its stats in Analytics.** `confirmDeleteTournament` only removes the localStorage keys (`dartsTournaments` + the per-tournament `tournament_<id>_history` key); it never touches NewtonDB/IndexedDB, so finalized stats (leaderboard, achievements) survive deletion.

**Do:** trim the "How to Free Up Space" bullets, and add a line such as *"Deleting a finalized tournament keeps its stats in Analytics"* so operators aren't afraid to free space.

**Floated but not recommended:** a one-click "delete the oldest 50%" button. Bulk automated deletion is a footgun against the app's export-before-destroy ethos, and "oldest 50%" is an arbitrary heuristic with its own edge cases. The reassurance text is the better lever for the "afraid to delete" concern — keep deletion explicit and per-tournament.

---

## Later
*Worth tracking but not urgent*

### Analytics — Future Enhancements

The tab is named Analytics — it should earn that name over time. The IndexedDB foundation is already there; this is purely a UI and query layer on top.

**Player tab**
Dedicated per-player drill-down — form over time, head-to-head records, tournament history.

**Graphs**
Performance and form over time — the kind of thing that makes improvement (or decline) visible in a way a table never can.

**Leaderboard export**
Export leaderboard data (CSV or similar) for use outside the app.

**Table cogwheel**
Column visibility toggle and top-N threshold control on Analytics tables.

---

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

**Last updated:** July 7, 2026 — added Storage Space dialog copy (Next) + localStorage→IndexedDB migration question (Later)
