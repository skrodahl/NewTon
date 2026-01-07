## NewTon DC Tournament Manager v4.1.0 Release Notes

**Release Date:** January 7, 2025
**Feature Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.1.0** introduces the NewTon Chalker companion app (beta) for tablet-based dart scoring at the board, plus backside match source visibility in the bracket view.

This release contains no breaking changes and is a drop-in replacement for v4.0.x.

**Key Highlights:**
- NewTon Chalker: Tablet-optimized x01 scoring app for referees/chalkers (beta)
- Backside matches now show which frontside matches feed into them on hover

---

## New Feature: NewTon Chalker (Beta)

A standalone companion scoring application designed for portrait tablet use at dartboards.

**What It Does:**
- Provides referees/chalkers with a dedicated scoring interface separate from the tournament bracket
- Chalkboard-style ledger with inline score entry and blinking cursor
- Tap any previously recorded score to edit (Excel-like behavior)
- Automatic checkout detection with dart count prompt
- End-of-match statistics including averages, tons, 180s, and high checkouts

**Match Configuration:**
- Player names, starting score (101-1001), best-of legs (1-11)
- Max rounds (7-20 rounds / 21-60 darts)
- Optional double-in requirement

**Why It Matters:**
Referees can score matches on a tablet at the board without needing access to the main tournament bracket display. Fully offline - no server or internet required.

**Access:** Open `chalker.html` directly in a browser.

---

## Tournament Manager Improvements

**Backside Match Source Visibility:**

Hovering over backside matches now displays which matches feed into them.

**What's New:**
- Status bar shows "Fed by FS-X-X, FS-X-X" for backside matches
- Appears between match state and "Leads to" destination
- Helps track player progression through the losers bracket

**Status Bar Styling:**
- Floating tooltip now has slight offset from bottom edge for cleaner appearance

---

## Migration from v4.0.x

### Automatic
- Fully compatible with all v4.0.x tournaments
- No data migration required
- No changes to existing tournament behavior

### What's New
After upgrading to v4.1.0:
1. **Access Chalker** by opening `chalker.html` in a browser
2. **Hover over backside matches** to see source match information
3. All existing tournament features work unchanged

---

## Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/RELEASE-NOTES-v4.0.9.md**: localStorage storage indicator

---

## Known Issues

- **Chalker (Beta)**: No integration with Tournament Manager yet - scores are tracked independently

---

**NewTon DC Tournament Manager v4.1.0** - Companion scoring app and improved bracket visibility.
