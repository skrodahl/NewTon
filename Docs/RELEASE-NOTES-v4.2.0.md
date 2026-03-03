## NewTon DC Tournament Manager v4.2.0 Release Notes

**Release Date:** March 3, 2026
**Feature Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.2.0** introduces Single Elimination (SE) as a fully supported tournament format alongside the existing Double Elimination (Cup) format. Every part of the application — bracket generation, match progression, bracket visualisation, rankings, undo, and tournament completion — is format-aware.

This release contains no breaking changes and is a drop-in replacement for v4.1.x.

**Key Highlights:**
- Single Elimination brackets for 4, 8, 16, and 32 players
- Bronze Final: a proper 3rd-place match before the Final
- Full visual bracket with progression lines and round labels for all SE sizes
- SE undo system: identical hard-block behaviour to Double Elimination
- SE rankings: live placement tracking from round 1 through to the Final
- Format selection at bracket generation time — existing DE tournaments are unaffected

---

## New Feature: Single Elimination Format

Single Elimination is now a first-class tournament format in NewTon.

**What It Means for Players:**
One loss and you're out. There is no backside bracket, no second chance. The format moves fast, keeps things simple, and suits smaller venues or warm-up tournaments before a main event.

**What It Means for Operators:**
The setup is identical to Double Elimination — register players, choose a format, generate the bracket. Everything else runs itself.

---

## Format Selection

When generating a bracket, operators now choose between two format cards:

- **Single Elimination Cup** — "Players are eliminated after one loss"
- **Double Elimination Cup** — "Players get a second chance through the backside"

Both formats require a minimum of 4 players. SE supports 4/8/16/32-player brackets; DE supports 8/16/32.

The chosen format is stored on the tournament and persisted through save, load, export, and import. Existing tournaments without a format field are treated as DE — no migration required.

---

## The SE Bracket

### Round Structure

SE brackets are purely frontside. Each round halves the field until two players remain for the Final. The round before the Final produces four players — the two winners go to the Final, the two losers meet in the Bronze Final.

**8-player example:**
```
Round 1 (8 players) → Round 2 (Quarterfinals) → Semifinals → Bronze Final / Final
```

**Round display names** are assigned from the end backwards: Final, Bronze Final, Semifinals, Quarterfinals, Round N. These appear on match cards and in Match Controls.

### Bronze Final

The Bronze Final is a proper match — not a consolation formality. It determines 3rd and 4th place and **must be completed before the Final can begin**. The Final shows as "Waiting" while Bronze is pending.

- Bronze winner → 3rd place
- Bronze loser → 4th place
- Both placements are set immediately when the match completes

### Walkovers

Bye slots in smaller brackets are handled automatically. A player with a walkover advances without a match being played. The bracket renders these cleanly, and the walkover is visible on the match card.

---

## Visual Bracket

All four SE bracket sizes have a dedicated visual layout:

| Size | Layout |
|------|---------|
| 4-player | 2 Semifinals, Bronze Final, Final |
| 8-player | Round 1 → QFs → SFs → Bronze + Final |
| 16-player | Rounds 1–3 → SFs → Bronze + Final |
| 32-player | Rounds 1–4 → SFs → Bronze + Final |

**What you see:**
- **L-shaped progression lines** connecting each round through a vertical spine, which then branches to Bronze and Final
- **Round column labels** above each column (ROUND 1, QUARTERFINALS, SEMIFINALS, FINALS)
- **Placement range labels** showing which placement band is eliminated in each round (e.g. "5th–8th" above Round 1 in an 8-player bracket)
- **BRONZE** and **FINAL** badges on the respective match cards
- **Zoom and pan defaults** tuned per bracket size so the full bracket is visible on open

The bracket hover info box shows match ID and state for SE matches. "Leads to / Feeds from" text is intentionally omitted — the visual progression lines make this self-evident.

---

## Match Controls

Match Controls in SE uses a rolling two-column layout:

- **Left column**: the earliest ready round (the matches you should be running now)
- **Right column**: upcoming rounds not yet ready

Live matches always appear in the left column. This keeps the operator focused on what needs attention without scrolling through the full bracket list.

---

## Rankings

SE rankings are live and update after every match completion.

Placement is determined by elimination round:

| Eliminated in | 8-player placement |
|--------------|-------------------|
| Round 1 | 5th–8th |
| Quarterfinals | — |
| Bronze Final (loser) | 4th |
| Bronze Final (winner) | 3rd |
| Final (loser) | 2nd |
| Final (winner) | 1st |

Rankings are visible during the tournament and fully resolved by the time the Final is played (Bronze is always completed first).

---

## Undo System

The SE undo system follows the same hard-block rules as Double Elimination — there is no cascading, ever.

**How it works:**
- A match can only be undone if no downstream match has been manually completed
- If a downstream match is complete, the upstream match shows "Cannot Undo, blocked by [match ID]" in the hover info box
- The undo button is never rendered for blocked matches — clicking is impossible, not just warned against
- Matches must be undone one at a time, working backwards deliberately

**Example:** In an 8-player SE bracket, if the Semifinal and Quarterfinal are both complete, you must undo the Semifinal first before the Quarterfinal becomes undoable.

Undoing the Final match restores the tournament to active status — the bracket becomes editable again immediately.

This behaviour is consistent across all SE bracket sizes (4P–32P) and is identical to how DE has always worked.

---

## Tournament Completion

An SE tournament completes when the Final match is recorded. At that moment:

- 1st and 2nd place are set from the Final result
- The tournament is marked completed and immediately switches to read-only
- The bracket renders in its completed state
- All undo operations are available if needed (subject to the hard-block rules above)

---

## Migration from v4.1.x

### Automatic
- Fully compatible with all existing v4.1.x and earlier tournaments
- No data migration required
- All existing DE tournaments continue working without modification

### What's New After Upgrading
1. When generating a new bracket, you'll see two format cards — choose SE or DE
2. SE tournaments work immediately with all features: bracket, controls, rankings, undo
3. All existing features for DE tournaments are unchanged

---

## Known Issues

None at time of release. Please report issues through the GitHub repository.

---

**NewTon DC Tournament Manager v4.2.0** — Single Elimination: one shot, no second chances. 🎯
