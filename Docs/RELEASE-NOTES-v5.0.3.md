# Release Notes — v5.0.3 — The Numbers Start Talking

**NewTon DC Tournament Manager v5.0.3 — April 10, 2026**

---

## Overview

v5.0.1 started recording every match. v5.0.3 starts making sense of it.

The Analytics tab now has a dashboard with live stat cards, a control bar for switching views, and a point mode toggle that lets you rescore every tournament under different rules without changing a single record. It's the first layer of the command center — same data, different lens.

Elsewhere: a new "default paid" setting saves 20 clicks on tournament night, and the QR code generator can now actually be scanned when encoding longer text.

---

## Analytics Dashboard

The Analytics tab graduates from a raw match register to a control surface. A navigation bar with four views — Dashboard, Leaderboard, Players, Register — sits below the page header, with a point mode toggle (Original, Current, Custom) on the right.

**Six stat cards** computed live from IndexedDB:

- **Tournaments** — total finalized
- **Matches** — total completed
- **Players** — unique participants
- **180s** — total across all tournaments
- **Highest Checkout** — best checkout score and who threw it
- **Shortest Leg** — fewest darts and who did it

Cards with drill-down targets are clickable — they'll link to the relevant view as those views are built out in future releases.

**Point mode** — the first analytical control. Original uses each tournament's frozen config snapshot. Current recalculates everything under today's Global Settings. Custom lets you define your own point values. Same data, three different stories.

---

## Default Paid

A new checkbox in Global Settings → User Interface: **"New players default to paid."**

When enabled, every player added to a tournament starts with their payment status already marked as paid. For clubs where the entry fee is collected at the door before registration, or for free events where payment tracking is irrelevant, this eliminates clicking "paid" for every player.

The guard rail: removing a player still requires toggling them to unpaid first. With default-paid enabled, deletion is always a deliberate two-step action. You can't accidentally remove someone who's marked as paid.

---

## QR Code Generator — Scan Fix

QR codes encoding longer text (URLs, sentences) were unscannable. The bug: after the data placement loop skips the timing column (column 6), the direction calculation produced non-integer values, corrupting the zigzag pattern for all subsequent columns. Fixed by replacing the computed index with a simple counter that increments reliably regardless of the column skip.

Short text and URLs under ~26 characters were unaffected — the bug only manifested when the QR version was large enough to use columns past the timing pattern.

---

## Everything Else

- **Analytics page styling** — outer border and restyled header to match Global Settings; subtitle added; Export/Import buttons repositioned for consistency
- **Register view** — removed redundant Status column (only finalized tournaments are shown)
- **Chalker** — leg averages now wrap on narrow phone screens instead of forcing horizontal scroll
- **Release notes wording** — `unsafe-inline` description changed from "safe" to "acceptable" in v5.0.2 notes
- **Docs/ANALYTICS.md** — comprehensive plan document covering data foundation, command center architecture, filtering model, and phased roadmap

---

## Migration

No migration required. Fully compatible with all existing tournament data and match history. The new `config.ui.defaultPaid` field defaults to `false` — current behaviour is preserved.

---

**NewTon DC Tournament Manager v5.0.3 — The Numbers Start Talking.**
