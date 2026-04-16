# Release Notes — v5.0.12 — Clean Lines

**NewTon DC Tournament Manager v5.0.12 — April 16, 2026**

---

## Overview

The Analytics tables get a visual overhaul — stronger identity, clearer hierarchy, and badge cells that let rank and points stand out from the data.

---

## Table Redesign

All Analytics tables share a new visual language:

- **Dark header bar** — `#1f2937` background with white uppercase labels, sticky on scroll.
- **Row separation** — `border-spacing` replaces collapsed borders. Rows float as rounded cards with subtle shadows.
- **Alternating rows** — visible striping (`#eef0f4`) replaces the near-invisible previous tint.
- **Hover state** — lifted shadow on hover for clickable rows.
- **Top-16 highlighting** — stronger green tones for leaderboard qualification rows.

---

## Badge Cells

The Rank (#) and Points columns in the Leaderboard render as badge cells — rounded, tinted, visually separated from the surrounding row. The badge is an inner `<div>` with its own background and margin, so the gap is real space rather than a colored border. Works cleanly across white, striped, and green rows.

---

## Typography

- **Names** — player names, tournament names, and match tournament links render at 15px bold across all tables.
- **Results** — match scores (e.g. 2–1) render bold at 15px.
- **Tournament table layout** — tournament name column expands to fill available width, pushing data columns to the right edge.

---

## Tournament Leaderboard

The Player Registration leaderboard and statistics modal adopt the same visual language: dark header, row separation, rounded corners, alternating stripes. Compact padding (`8px`) keeps it tight for in-tournament use. Player names and points render at 15px bold. Removed a legacy hidden column that caused layout overflow.

---

## Pagination Buttons

The rows-per-page and page navigation buttons at the bottom of tables now match the Lens preset button style — consistent border, radius, padding, and hover across the interface.

---

## Files Changed

- `css/styles.css` — table redesign: dark header, row spacing, badge cell styles, hover states, alternating row colors, results-table restyling, pagination button styles
- `js/newton-history.js` — badge cell class on rank/points columns, 15px bold names/results across all tables, tournament column width
- `js/newton-table.js` — `cellClass` support for column config, removed wrapping overflow div
- `js/results-config.js` — removed hidden empty column from leaderboard rows
- `tournament.html` — removed hidden empty column from leaderboard header

---

*NewTon DC Tournament Manager v5.0.12 — Clean Lines.*
