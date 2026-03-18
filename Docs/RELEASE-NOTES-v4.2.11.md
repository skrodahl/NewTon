## NewTon DC Tournament Manager v4.2.11 Release Notes

**Release Date:** March 18, 2026
**Setup Actions UX, Lollipop Counter & App Name Consistency**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.11** adds a lollipop counter to player statistics, refines the Setup Actions panel in Match Controls with clearer section structure and better labelling, and corrects app name references across HTML files to consistently use the full product name.

This release contains no changes to tournament logic and is a drop-in replacement for v4.2.10.

---

## Lollipop Counter 🍭

Scoring a 3 — three ones — in darts is known as a lollipop. Many clubs mark the occasion by handing the guilty player an actual lollipop. NewTon DC Tournament Manager now supports this tradition.

### Player Statistics dialog

A **Lollipops (score of 3)** counter has been added to the Statistics dialog, below Tons, using the same +/− button pattern as 180s and Tons.

### Leaderboard display

Players with one or more lollipops have a 🍭 icon displayed right-aligned in the Player column — visible as soon as the first lollipop is recorded. Two or more lollipops show 🍭 x{n} for extra effect. A single lollipop shows the icon only, no count.

### Design decisions

- **Cosmetic only** — lollipops are not part of the points system and carry no point value
- **Not exported** — the lollipop count is excluded from CSV exports so player names remain clean and consistent across tournaments
- **Backwards compatible** — existing tournaments load without issues; the missing `lollipops` field defaults to 0 silently

---

## Setup Actions Panel

The right-hand panel in Match Controls during setup mode has been restructured for clarity.

### Before

The panel showed a generic "🔧 Tournament in setup mode" heading followed by a redundant descriptive sentence, then the format cards, then the navigation buttons — with no visual separation between the two groups.

### After

The panel now has two clearly named sections:

- **Shuffle & Draw** — section title above the Double Elimination Cup and Single Elimination Cup format cards
- **Navigation** — section header above the Player Registration Page and Global Settings Page buttons

The redundant descriptive text ("Setup actions will help you configure the tournament.") has been removed. Emoji icons on the section titles have been removed — the wrench icon on the "Setup Actions" panel header is retained as the sole decorative element.

The main panel header remains **Setup Actions**, which is accurate as an umbrella label for the full panel. "Shuffle & Draw" lives where it belongs: directly above the bracket generation action.

---

## App Name Consistency

References to the software as "NewTon DC" or "NewTon" have been corrected to **NewTon DC Tournament Manager** across HTML files. The short form "NewTon" is retained where contextually appropriate — for example, in prose references, possessive constructions, and places where the full name would read awkwardly.

---

## Files Changed

- `js/player-management.js` — `incrementLollipops()`, `decrementLollipops()`, `updateStatsCounters()` updated
- `js/results-config.js` — Lollipop icon displayed in Leaderboard player name cell
- `js/types.js` — `lollipops` added to `PlayerStats` typedef
- `tournament.html` — Lollipops +/− counter added to Statistics dialog
- `userguide.html` — Lollipops tip added to Tips & Tricks section
- `llms.txt` — Lollipop counter documented in Tips for AI Services
- `js/bracket-rendering.js` — Setup Actions panel restructured
- Multiple HTML files — App name corrected to "NewTon DC Tournament Manager"
- `CHANGELOG.md` — v4.2.11 entry updated

---

## Migration from v4.2.10

No migration required. Fully compatible with all existing tournaments and saved configurations.

---

**NewTon DC Tournament Manager v4.2.11** — Shame has never looked better.
