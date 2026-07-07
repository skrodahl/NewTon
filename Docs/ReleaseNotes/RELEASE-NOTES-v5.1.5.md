# Release Notes — v5.1.5 — Undo the Undone

**NewTon DC Tournament Manager v5.1.5 — July 7, 2026**

---

## Overview

This one's for the code, not the board.

Between v5.1.4 and now, the entire codebase went under the microscope — four independent deep-read reviews covering the bracket engine, the app and state layer, analytics and history, and the QR/Chalker/API surface. The findings became a six-phase improvement plan, and this release ships the parts that make the app **safer, sturdier, and lighter** without changing a single thing about how you run a tournament.

No new features. The one visible change is a refreshed Storage Space dialog. Everything else is a tournament manager that's harder to break and easier to trust — because the unglamorous work is what keeps a tool you've trusted for hundreds of nights worth trusting.

---

## Names That Broke the App

Ever had a player called O'Brien?

Until now, that apostrophe could quietly break things — the Add, Remove, and Delete controls in the player list all choked on it. This release fixes that entire class of bug in one sweep: every player name, tournament name, and referee name is now handled safely on its way to the screen, whether it was typed in, imported from a file, or arrived from a scanned QR code. Names with apostrophes, ampersands, angle brackets — anything — just work now.

The same sweep closes a quieter door: data smuggled into an imported file or a scanned QR code can no longer slip markup or script into the page. It runs everywhere the app draws a name — the bracket, the command center, the results, the Analytics tables, the QR inspector, and the Chalker's match-assignment screen.

---

## The Bugs Beneath

About two dozen genuine bugs, found and fixed. The ones worth calling out:

- **Undo now respects the Chalker.** Undoing a match could silently wipe out a downstream result that had been scored on the Chalker — legs, averages, and achievements gone with no warning. The undo system now protects those the same way it protects manually-entered results.
- **Undo can't strip the wrong match.** Transaction IDs are now guaranteed unique. Previously, walkovers completing in the same instant could share an ID, and an undo could remove an unrelated match's history.
- **The Chalker scores undo correctly across legs.** Stepping back into a previous leg now restores *both* players' scores, so the next checkout validates against the right number.
- **Tiebreak and edited-checkout wins reach history.** Matches decided that way are now saved to Chalker history and can be re-shared as a result QR.
- **The Chalker PWA actually boots offline.** The main script was quietly hitting the network on every launch, defeating the offline install. It loads from the cache now, scanner libraries included.

---

## Nine Hundred Lines Lighter

Around 950 lines of dead code — removed.

The headline: an old parallel undo system and a redo system that no longer worked (they depended on data the app stopped keeping) but were still one stray console command away from corrupting a live tournament. Both gone, along with a long tail of unreachable branches, duplicated helpers, and misleading leftovers. Nothing you could ever see — and everything you'd want gone. A smaller codebase is a codebase with fewer places for the next bug to hide.

---

## Sturdier Storage

The app keeps your tournaments in the browser's local storage, which has a size limit. This release makes running into that limit a non-event:

- **You're warned before you hit it.** Creating or importing a tournament when storage is nearly full now stops with a clear "free up space first" message — and the reassurance that **deleting an old tournament keeps its stats in Analytics**, so there's nothing to fear in clearing room.
- **A save that can't complete tells you.** If storage is ever full mid-tournament, you get a clear message instead of a silently-lost result.
- **Bad data can't brick the app.** A corrupted saved-tournaments list no longer takes down loading, deleting, and the Recent list at once, and a malformed import fails cleanly at the dialog instead of crashing the bracket.
- **A fresh Storage Space dialog.** Restyled to the app's newer landscape dialog look — your usage at a glance on the left, guidance on the right.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics. This release changes how the app handles your data — more carefully — not the data itself. Installed Chalker PWAs refresh to the new version automatically on their next online launch.

---

*Fun fact: it started with a test player named O'Brien — that apostrophe broke a button — and turned into an escaping sweep across a dozen files, the QR scanner, and the Chalker. That O'Brien. From room 101.*

*NewTon DC Tournament Manager v5.1.5 — Undo the Undone.*
