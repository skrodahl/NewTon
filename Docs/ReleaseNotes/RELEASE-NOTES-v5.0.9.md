# Release Notes — v5.0.9 — Leader of the Pack

**NewTon DC Tournament Manager v5.0.9 — April 14, 2026**

---

## Overview

The data had a voice. Now it has a stage.

v5.0.9 adds the cross-tournament Leaderboard — the first view that answers "who's on top?" across your entire tournament history. Every stat the system captures is surfaced: placements, achievements, personal bests, three-dart averages, match records, and leg records. All scoped, all respecting the point toggles, all sortable.

The point mode toggle is now live — switch between Original and Current and watch the numbers change in real time. Two new layer toggles — Ranking and Attendance — let you peel back point categories to see what's underneath.

---

## Leaderboard

A single table that tells every player's story across all scoped tournaments:

- **Placement counts** — 1st, 2nd, 3rd, 4th, 5-6th, 7-8th
- **Achievements** — 180s, high outs, short legs
- **Personal bests** — highest checkout, shortest leg (fewest darts)
- **Three-dart average** — computed from Chalker match visit data only. Manual matches excluded.
- **Match record** — matches won and lost
- **Leg record** — legs won and lost
- **Points** — total points respecting the active point mode and layers

All columns sortable. Rank and Points columns shaded for visual anchoring. Top 16 players highlighted with a muted green background that survives column reordering.

Player identity is by lowercase trimmed name — the same player across different tournaments is correctly aggregated.

---

## Point Mode & Layers

### Original vs Current

**Original** uses the frozen `configSnapshot` from each tournament — the point values that were active when the tournament was played. **Current** uses today's Global Settings. Switch between them and every view updates in real time: dashboard cards, register tables, match detail, and the leaderboard.

### Ranking & Attendance

Two independent toggles that control which point categories are included:

- **Ranking** (on by default) — placement points: 1st, 2nd, 3rd, etc.
- **Attendance** (on by default) — participation points per player

Toggle both off and you're down to pure achievement points — the skill-based numbers. These toggles apply to tournament-level totals only; match views always show achievement points.

### Points Column

New Points column in both the tournament list and match list in the Register. Tournament totals include all active layers; match totals show achievement points only.

### Total Points Dashboard Card

New dashboard card showing total points across the scoped dataset. Respects point mode and layers. Clicks through to the Leaderboard.

---

## Podium to Analytics

A "Tournament Analytics" button on the celebration/podium screen. One click closes the Match Controls modal, sets the Analytics scope to the just-completed tournament, and opens the Analytics tab.

---

## UI Polish

- **Rounded corners on buttons** — `border-radius: 6px` applied globally to all button classes. Buttons now visually distinct from input fields and panels.
- **Date/time separator** — match timestamps use middot: `2026-03-09 · 21:13`
- **Register "View" buttons removed** — row click navigates. Delete button stays.
- **Reset filter button** — clears all filters and resets scope to all.
- **Unique player count** — deduplicates by lowercase trimmed name across tournaments.

---

## Migration

Tournaments imported into Analytics before this version do not have placement data in IndexedDB. To enable ranking points for these tournaments: delete from the Analytics register, then re-add via "+ Analytics" in Recent Tournaments.

No other migration required. New localStorage keys and IndexedDB fields are created on first use.

---

**NewTon DC Tournament Manager v5.0.9 — Leader of the Pack.**
