## NewTon DC Tournament Manager v4.2.4 Release Notes

**Release Date:** March 10, 2026
**Single Elimination Match Lengths & Chalker Stats**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.4** delivers two focused improvements: proper match length configuration for Single Elimination tournaments, and colour-coded leg averages in the Chalker Scoring App's Live Stats view.

This release contains no breaking changes and is a drop-in replacement for v4.2.3.

---

## Global Config — Match Configuration

### The Problem
Single Elimination tournaments previously had no dedicated match length settings. SE matches borrowed values from Double Elimination fields (Bronze and Final shared the Frontside Semifinal setting), and the Global Config UI showed only DE-specific labels — "Backside Semifinal", "Grand Final" — which are meaningless in an SE context.

### The Solution
The Match Configuration section is now split into two clearly labelled sub-sections: **Single Elimination** and **Double Elimination**.

### Single Elimination Fields (new)
| Round | Default |
|---|---|
| Regular Rounds | Best of 3 |
| Quarterfinal | Best of 3 |
| Semifinal | Best of 3 |
| Bronze Match | Best of 5 |
| Final | Best of 5 |

Each field is independently configurable. If a bracket size doesn't include a particular round type (e.g. a 4-player bracket has no Quarterfinals), the setting is simply unused — no gating logic required.

### Double Elimination Fields (unchanged)
All five existing DE fields (Regular Rounds, Backside Semifinal, Frontside Semifinal, Backside Final, Grand Final) are preserved exactly as before.

### Layout
- Single Elimination section appears **above** Double Elimination in both the config form and the config summary panel
- Section headings use bold uppercase text with a bottom border rule for clear visual separation
- Summary panel (tournament overview) updated to show both SE and DE settings

### Technical Notes
- Two new helper functions added to `clean-match-progression.js`: `isSESemifinal()` and `isSEQuarterfinal()`, which identify SE match types by round position
- SE leg assignment priority order: Final → Bronze → Semifinal → Quarterfinal → Regular Rounds
- Existing saved configs without SE values fall back gracefully to defaults via `|| n` guards

---

## Chalker Scoring App — Leg Average Colour Coding

### The Feature
In the **Leg Avgs** row of the Match Statistics table, averages for legs the player **started** (threw first) are now displayed in green. Averages for legs the player did not start remain unchanged.

The green colour uses `var(--accent-success)` — the same CSS variable already used for the leg-starter header indicator and scoresheet winner labels, ensuring visual consistency.

### Why It Matters
In darts, the player who starts a leg has a statistical advantage. Colour coding makes it immediately visible whether a strong or weak average came from a leg with or without that advantage — a useful coaching and analysis tool.

### Backwards Compatibility
Older match records without `firstLegStarter` stored display all leg averages in plain text, unchanged.

---

## Files Changed

### Tournament App
- `js/results-config.js` — DEFAULT_CONFIG, `populateConfigPage()`, `saveMatchConfiguration()`, `resetMatchConfigToDefaults()` updated with SE leg fields
- `js/clean-match-progression.js` — `isSESemifinal()`, `isSEQuarterfinal()` added; SE leg assignment in `generateFrontsideMatches()` rewritten; both functions exported
- `tournament.html` — Match Configuration section split into SE/DE sub-sections; summary panel updated
- `js/bracket-rendering.js` — config summary display updated with SE rows
- `js/main.js` — version bumped to v4.2.4

### Chalker App
- `chalker/js/chalker.js` — `populateMatchStats()` leg averages loop updated with starter detection and colour coding

### Docs & Landing Page
- `CHANGELOG.md` — v4.2.4 entry added
- `landing-page.php` / `landing.html` — Chalker App button added
- `llms.txt` — Tips for AI Services section added

---

## Migration from v4.2.3

### Automatic
- Fully compatible with all existing tournaments
- No data migration required
- Existing SE tournaments will use the new default SE match lengths on next bracket generation

### Config Notes
- Users with previously saved configs will not have SE leg values in localStorage — the app falls back to defaults transparently
- To persist SE settings, open Global Config → Match Configuration → adjust as desired → Save Match Configuration

---

## Known Issues

None at time of release.

---

**NewTon DC Tournament Manager v4.2.4** — proper Single Elimination match length configuration and colour-coded Chalker leg averages.
