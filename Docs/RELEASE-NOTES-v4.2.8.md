## NewTon DC Tournament Manager v4.2.8 Release Notes

**Release Date:** March 13, 2026
**Late Registration**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.8** introduces Late Registration — a controlled, operator-facing tool in the Dev Console that allows a new player to join a tournament already in progress.

---

## Late Registration

Tournaments don't always go to plan. A player drops out last minute, a substitute arrives after the draw, or someone simply shows up late. Late Registration gives the operator a safe, structured way to add a player mid-tournament without compromising bracket integrity.

### What it does

A new player is added to the tournament and placed in a randomly selected eligible walkover spot in Frontside Round 1. The player is registered as paid and participates from that point forward — as if they had been part of the original draw.

### What makes it safe

- **No live or completed downstream matches are touched.** The tool identifies which walkover slots are still eligible — meaning neither the winner path nor the loser path from that slot has a live or completed match downstream. Slots that would affect an in-progress match are blocked entirely.
- **Placement is random.** The new player is placed in a randomly chosen slot among the eligible ones. The operator cannot pick a slot, which removes any opportunity for a convenient bracket edit.
- **Confirmation gate.** Before anything is written, the operator must type the player's name exactly to confirm. This prevents accidental registration.
- **Re-validation at execution time.** If a match goes live between the eligibility check and the confirmation step, the tool re-validates before placing the player. A slot that has become ineligible in the meantime will be caught.
- **Audit trail.** A Late Registration entry is recorded in the transaction log with the player name, match, and timestamp. The operator can always see what happened and when.

### When it cannot help

If no eligible slots exist — because all walkover spots have been blocked by live or completed downstream matches — the tool refuses and explains why. Blocked slots can be freed by stopping or undoing the relevant matches, but all affected matches will need to be replayed from the beginning.

---

## Finding It

The Developer Console is intentionally tucked away — it is an operator tool for edge cases, not a day-to-day feature. To make it easier to find when it is actually needed, a **"Player arrived late?"** button now appears at the bottom of the Tournament Players list whenever a tournament is in progress.

Clicking it opens a dialog that explains what Late Registration does and how to access the Developer Console: enable it in Global Settings, then open it by clicking the version number in the lower-right corner of the Tournament Bracket.

---

## Files Changed

- `js/analytics.js` — Late Registration command (Stages 1–3)
- `js/player-management.js` — "Player arrived late?" button and info dialog
- `js/bracket-rendering.js` — `refreshTournamentUI` save fix
- `tournament.html` — Late Registration info modal
- `CHANGELOG.md` — v4.2.8 entry added

---

## Migration from v4.2.7

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.8** — Late Registration.
