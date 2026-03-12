## NewTon DC Tournament Manager v4.2.6 Release Notes

**Release Date:** March 12, 2026
**Undo Bug Fix, Late Registration (Stage 1), and SEO**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.6** delivers a bug fix to the undo system, the first stage of the Late Registration feature in the Developer Console, and a `robots.txt` for the deployed site.

This release contains no breaking changes and is a drop-in replacement for v4.2.5.

---

## Bug Fix: Undo System — Live Downstream Match Detection

### The Problem
The undo eligibility check (`isMatchUndoable`) only blocked undos when downstream matches were **completed**. It did not check whether a downstream match was currently **live**. This meant a match could be undone while a downstream match was actively in progress, potentially corrupting the live match's context.

The bracket hover tooltip had the same gap — it would show "Can Undo" even with a live downstream match in progress.

### The Fix
Both the winner's and loser's downstream destinations are now checked for live status (`match.active`) before allowing an undo. The tooltip now correctly shows `Cannot Undo, blocked by FS-2-4 (live)` when a downstream match is in progress.

---

## Late Registration — Stage 1 (Eligibility Checker)

A new **Late Registration** command has been added to the Developer Console (amber, after Toggle Read-Only). This replaces the former "Bracket Editor" placeholder and represents the first stage of a planned mid-tournament player addition tool.

### What Stage 1 Does
Stage 1 is a **read-only eligibility checker** — it makes no changes to the tournament. It scans all Frontside Round 1 BYE slots and reports how many are eligible to receive a late-registered player.

A BYE slot is eligible if:
- Neither its winner nor loser downstream match is live
- Neither its winner nor loser downstream match was manually completed

### Output
- **Count**: "X of Y FS Round 1 BYE slots eligible for late registration"
- **Fairness warning**: if some slots are ineligible, warns that the draw cannot be fully fair
- **Blocking matches**: lists each ineligible slot with the specific blocking match and player names (e.g. `FS-2-4 (Frank vs Harry, live)`)
- **Replay warning**: explicitly states that any stopped or undone matches must be replayed from the beginning
- **Clear refusal**: if no eligible slots exist at all, the command refuses with a plain explanation

### What's Coming
Stage 2 will add the new player to the participant list (reusing the existing registration function). Stage 3 will randomly place the player in an eligible BYE slot, undo the auto-advance, record a transaction, and re-render the bracket.

---

## SEO

- **robots.txt** added to repo root — allows all crawling and signposts `/llms.txt` for AI services

---

## Files Changed

- `js/bracket-rendering.js` — `isMatchUndoable()` and tooltip function updated with live downstream match checks
- `js/analytics.js` — `commandBracketEditor` renamed to `commandLateRegistration` and implemented as eligibility checker; `showCommandFeedback` updated with amber warning status
- `tournament.html` — Dev Console menu entry renamed to "Late Registration"
- `robots.txt` — new file
- `js/main.js` — version bumped to v4.2.6
- `CHANGELOG.md` — v4.2.6 entry added

---

## Migration from v4.2.5

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.6** — undo system bug fix, Late Registration eligibility checker, and robots.txt.
