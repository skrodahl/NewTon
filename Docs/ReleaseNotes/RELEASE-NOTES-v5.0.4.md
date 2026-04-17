# Release Notes — v5.0.4 — No Tournament Left Behind

**NewTon DC Tournament Manager v5.0.4 — April 10, 2026**

---

## Overview

v5.0.3 gave the Analytics tab a dashboard. v5.0.4 gives it a past.

Every tournament sitting in "My Tournaments" can now be added to the Analytics registry with one click. Match results, player achievements, and placements are imported — and per-match achievement attribution is reconstructed from the transaction history, even for tournaments scored entirely by hand.

The backfill uses the same reconciliation logic that runs on every live tournament. Achievement totals always match. Nothing is lost, nothing is invented.

---

## Backfill — Add Historical Tournaments to Analytics

Each completed tournament in "My Tournaments" on the Tournament Setup page now shows its Analytics status:

- **"Analytics"** (green) — already in the registry. Click to view in the Analytics tab.
- **"+ Analytics"** (muted) — not yet in the registry. Click to import with a confirmation dialog.

One click imports:
- Tournament metadata (name, date, format, player count)
- All completed non-walkover matches with leg scores
- Per-player achievements (180s, tons, high outs, short legs, lollipops)
- Per-match achievement attribution (reconstructed from transaction history)
- Placements and config snapshot

### Per-Match Achievement Reconstruction

The transaction history stores cumulative player stat snapshots at each match completion. By diffing consecutive snapshots for the same player, the backfill derives what was recorded during each match — which 180s happened in which match, which high outs, which short legs.

This works for every tournament that has a transaction history, including manually scored v4 tournaments.

### Achievement Reconciliation

After all matches are saved, a reconciliation step compares the sum of per-match achievement deltas against the authoritative player totals. Any remainder — achievements entered outside the match completion dialog — is attributed to the player's last match.

This same reconciliation runs at live tournament finalization. Both paths use the same shared code (`NewtonDB.reconcileMatchAchievements`). Match-level totals always equal tournament-level totals.

---

## Everything Else

- **Match display fix** — the Register and Dashboard now show all matches for finalized tournaments regardless of match-level status. The tournament meta `status: 'final'` already gates visibility — the match-level filter was redundant and prevented backfilled matches from appearing.
- **Timestamp display fix** — dates now handle both seconds and milliseconds timestamps via `tsToMs()` helper. Older localStorage tournaments stored `completedAt` in milliseconds, newer ones in seconds.
- **Tournament list** — each tournament now shows the player count (e.g. "22p"), and navigating to Tournament Setup refreshes the list to reflect current Analytics status.
- **Demo banner** — "Darts double elimination tournament software" corrected to "Darts tournament software" — the banner predated Single Elimination support.

---

## Files Changed

- `js/newton-db.js` — shared achievement helpers (`normalizeStats`, `diffStats`, `hasAnyStats`, `addStats`) and `reconcileMatchAchievements()` function
- `js/tournament-management.js` — `addTournamentToAnalytics()` with history diffing, delta computation, remainder reconciliation, and `.stats` wrapper fix; Analytics labels on tournament list
- `js/clean-match-progression.js` — live finalization calls `reconcileMatchAchievements()` after promoting to final
- `js/newton-history.js` — `tsToMs()` helper; removed `status: 'final'` filter on match records
- `js/main.js` — Tournament Setup page refresh on navigation
- `tournament.html` — player count display in tournament list
- `css/styles.css` — Analytics label styles

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. Historical tournaments can be optionally backfilled via the "+ Analytics" label — this is a one-way import, not a migration.

---

**NewTon DC Tournament Manager v5.0.4 — No Tournament Left Behind.**
