# Release Notes — v5.1.2 — The Polished Press

**NewTon DC Tournament Manager v5.1.2 — May 26, 2026**

---

## Overview

A polish release with bite. Every button across the app now responds to the press. A new dialog system pulls eleven scattered confirmation, warning, and info modals onto a single, consistent foundation. The Tournament Complete celebration gets a proper Olympic tiered podium with metallic medals and decorative garlands. And a long-standing match-achievement attribution bug — the kind that would silently misattribute a 180 from Round 1 onto Round 2's transaction — is now fixed at the root by anchoring the snapshot to the Start Match lifecycle event.

No new tournament features, no data migration. Just the surface and the foundations underneath it.

---

## Tactile Buttons

Every button now has the same press response: a 1.5px nudge down and to the right on `:active`. `.btn`, `.nav-btn`, `.zoom-btn`, `.help-btn`, the match command-center buttons, achievement export, tournament create, analytics reset and back, the modal close — all of them. Clicking finally *feels* like clicking instead of looking like a screenshot.

The two Analytics selector buttons (point-mode toggle and layer toggles) are excluded by design — they carry their own active-state indicator and don't inherit `.btn`.

---

## A Unified Dialog System

The app has had two visual languages for modals for a long time: the legacy `.modal-content` pattern (whatever each dialog needed at the time) and a growing collection of one-off layouts. v5.1.2 introduces `.dlg` — a single, consistent dialog system with a small set of shared layouts.

**What it looks like:** white card with 10px rounded corners and a soft shadow. A horizontal rule under the title and another above the footer give every dialog the same header / body / footer rhythm automatically — no per-dialog markup needed. Footer is right-aligned. Buttons inside dialogs use the existing `.btn` classes — there are no separate dialog button styles, which means future button-style changes will propagate automatically.

**Two layouts:**

- **Default (single column, 580px)** — for pure information dialogs with no metadata to display.
- **Split (sidebar + main, 720px)** — when tournament metadata (Name, Date, Tournament Status, Progress, Players) adds context.
- **Wide modifier (`.dlg--wide`, 880px)** — stackable onto either layout when the content needs more room (three-button footers, longer player names, richer body content).

**Intent pills** — small uppercase badges at the top of the main area that convey risk at a glance: amber for warnings and recoverable destructive actions; red for permanent destructive actions; omitted entirely for additive and informational dialogs.

**Eleven dialogs migrated:**

- Reset Tournament (amber, split)
- Delete Tournament (red, split)
- Import Tournament Overwrite (amber, split)
- Tournament In Progress Warning (amber, split)
- Import Tournament Confirmation (conditional amber for legacy format, split)
- Load Tournament (no pill, split)
- Undo Match Confirmation (amber, split with **match metadata** sidebar — Match / Bracket / Players)
- Analytics — Delete Tournament (red, split)
- Late Registration Info (no pill, **default single-column** — the first migrated dialog without a sidebar)
- Export Tournament Results (conditional amber "Incomplete", split)
- Confirm Match Winner (no pill, **split + wide** — needs the room for its leg-score form and three-button footer)

**Light-touch alignment for the rest.** Match Controls, Developer Console, Leaderboard, Match QR, QR Result Scan, and Match Detail aren't a fit for the `.dlg` pattern — they're content-dense custom layouts. Each got the minimum useful upgrade instead: rounded corners, solid white background, and (where it makes sense) a title separator that matches the `.dlg` aesthetic. Decorative emojis dropped from titles. Page-style content stays page-style; it just stops looking like it came from a different decade.

**One pre-existing XSS hole closed.** The Undo Match and Confirm Match Winner dialogs were both using `innerHTML` with template-literal interpolation of player names. Both refactored to safe `createElement` / `textContent` construction. Player names can contain arbitrary text — they shouldn't ever go through `innerHTML`.

**Full reference:** [`Docs/DIALOGS.md`](../DIALOGS.md) — when to use which pattern, anatomy, sidebar conventions, intent pills, the migration checklist for the next dialog. Updated through the session as each dialog was migrated.

---

## Tournament Complete — Olympic Tiered Podium

The Tournament Complete celebration inside Match Controls now looks like the end of a tournament:

- **Three tiered colored blocks** under three white cards — gold (center, tallest at 160px), silver (left, 120px), bronze (right, 88px). Block surfaces use metallic gradients matching the medals.
- **Drop shadows** give the blocks physical depth. A 20px gap between columns lets each one read as its own piece while the composition still reads as a single object.
- **CSS-only metallic medal discs** sit on each card — gold, silver, bronze radial gradients with the rank number inside. Replaces the previous emoji medals.
- **Uppercase rank labels** — CHAMPION / SILVER / BRONZE — match the sidebar-label style used elsewhere in the dialog system.
- **Decorative SVG garlands** — four wavy strands (muted red, cream, green, black) sweep across the background behind the podium. Sense of occasion without resorting to emoji.
- **Tournament Highlights row** sits cleanly below the podium — three cards on a single white background.
- **All decorative emojis removed** from the title and headings.

---

## Bug Fix — Match Achievement Attribution

This one had teeth.

The achievement snapshot/diff system used to capture its baseline when the Confirm Winner modal opened. That timing was loose enough to cause problems: if the dialog had been opened previously for the same match and exited abnormally, or if other matches had been completed in between, the baseline could capture player stats at the wrong instant. The diff at confirm-time would then record achievements from earlier matches onto the *current* match's transaction. Undo the current match later and it would incorrectly revert those earlier achievements too.

**Concrete symptom seen in the wild:** FS-1-1 confirmed with a 180 + a ton for Albert. FS-2-1 opened with a lollipop added. The achievements summary in FS-2-1's Confirm Winner dialog listed all three. Confirming FS-2-1 would have recorded all three on FS-2-1's transaction — and later undoing FS-2-1 would have reverted the 180 and the ton that belonged to FS-1-1.

**The fix anchors the snapshot to the Start Match lifecycle event.** Every match gets its own `preMatchSnapshot` field, populated in `toggleActive()` when the match becomes active. Confirm Winner reads from it. Cancel and Esc restore from it. Overwritten cleanly on every Start (any pending stats from a previous winner-confirm session have already been rolled back by the recent Esc-as-Cancel fix).

A fallback at dialog open covers any match that was started before this lands and has no snapshot — same behavior as the previous approach, so existing in-progress tournaments keep working without migration.

**Result:** every `COMPLETE_MATCH` transaction's `achievements` field correctly reflects only the achievements added between *this match's* Start and Confirm. No leakage between matches, no contamination across dialog re-opens. Undo now reverts exactly the right set per match.

**One remaining gap, deferred:** stats added via the bare stats modal (from the Results table or Match Controls) outside any winner-confirm flow are still untracked per-match. The plan is to attribute them to the player's last completed match transaction. See [`Docs/UNDO.md`](../UNDO.md) for the rationale; the architecture is in place to land it cleanly when it's prioritized.

---

## Bug Fix — Late-Reg Button Visibility

The "Player arrived late?" button now appears immediately when navigating to Registration mid-session, not only after a reload. `showPage('registration')` was calling `renderPlayerList()` and `updateRegistrationPageLayout()` but not `updatePlayersDisplay()` — the function that renders both the tournament players list *and* the late-reg button container. Fixed.

---

## Documentation

- **New:** [`Docs/DIALOGS.md`](../DIALOGS.md) — full reference for the `.dlg` system.
- **Updated:** [`Docs/UNDO.md`](../UNDO.md) — reframed the Completion Modal snapshot/diff section around the new Start-Match anchor; the manual-entry follow-up is documented in "What This Does Not Solve".

---

## Migration

**No data migration required.** All tournament data, history, transactions, and exports are fully compatible. The remaining unmigrated modals continue to use the legacy `.modal-content` pattern and can be migrated incrementally; `matchCommandCenterModal` (Match Controls), the Developer Console, the Leaderboard, the Match QR view, the QR Result Scan camera view, and the Match Detail view are intentionally excluded from the full `.dlg` rollout — they're content-dense custom layouts that received light-touch visual alignment instead.

---

*NewTon DC Tournament Manager v5.1.2 — The Polished Press.*
