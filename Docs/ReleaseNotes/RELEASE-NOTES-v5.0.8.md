# Release Notes — v5.0.8 — Choose Your Lens

**NewTon DC Tournament Manager v5.0.8 — April 13, 2026**

---

## Overview

Analytics had the data. Now it has a way to choose what you're looking at.

v5.0.8 adds the scope selector — the control surface that drives every analytics view. Three composable filters narrow your dataset: text search, date range, and per-tournament checkboxes. Each filter only narrows, never widens. The scope is the intersection of all active filters.

---

## Scope Selector

### Filter Pipeline

Three filters, evaluated in order. Each narrows the previous result:

1. **Text filter** — instant keyword match on tournament names. Space-separated terms use AND logic.
2. **Date range** — inclusive from/to date pickers. Prefilled with the earliest and latest tournament dates in the register.
3. **Checkboxes** — per-tournament selection within the visible (filtered) set. Header checkbox toggles all visible rows.

### Scope Indicator

A green pill in the Analytics header shows "Viewing: N of M tournaments" with a selection tag. Visible on every tab. Clickable to navigate to the Register where filters live.

### Dashboard Respects Scope

All stat cards — tournaments, matches, players, 180s, highest checkout, shortest leg — compute from the scoped tournament set.

### Persistence

Scope, text filter, and date range all persist to localStorage across page reloads. Stale tournament IDs (from deleted tournaments) are filtered out on restore.

### Entry Points

- **Analytics label** on a tournament in My Tournaments → sets scope to that single tournament and opens Analytics.
- **Register checkboxes** → manual selection within the filtered list.

### Other

- **Dirty flag recompute** — changing scope marks inactive views dirty; they recompute on next switch.
- **Cache invalidation** — import and delete operations reset the tournament cache and scope.
- **Register column reorder** — Format moved to last position.
- **Analytics subtitle** — "Analytics lets you explore your tournament history. It never alters the underlying results."

---

## Landing Page

- **Chalker card closer** — "No shouting results across the room." Replaces "No walking results across the room."
- **Setup card closer** — "Same steps, same setup, every week." Replaces "No configuration rabbit holes."

---

## Migration

No migration required. The scope selector uses localStorage for persistence — new keys are created on first use. Existing data is unaffected.

---

**NewTon DC Tournament Manager v5.0.8 — Choose Your Lens.**
