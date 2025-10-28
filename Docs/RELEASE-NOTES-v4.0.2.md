# NewTon DC Tournament Manager v4.0.2 Release Notes

**Release Date:** October 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.2** addresses critical referee conflict detection issues and optimizes pre-v4.0 tournament imports to prevent localStorage bloat.

This release contains no breaking changes and is a drop-in replacement for v4.0.1.

**Key Highlights:**
- Fixed referee conflict detection bypass in Tournament Bracket
- Optimized pre-v4.0 tournament imports (98.8% reduction in localStorage usage)
- Eliminated code duplication in referee validation
- Improved import performance and stability

---

## 🐛 Bug Fixes

**Referee Conflict Detection in Tournament Bracket:**

Match Controls prevented starting matches when players were refereeing other matches, but the Tournament Bracket view had no such protection. Matches could be started directly from the bracket, bypassing the conflict check.

**What Was Fixed:**
- Tournament Bracket now shows referee conflict warnings ("⚠️ [Name] (Referee)")
- Start buttons disabled when conflicts exist
- Match state notification shows "Blocked: [Name] refereeing" instead of "Ready to Start"
- Both Tournament Bracket and Match Controls now use identical validation logic

**Implementation:**
- Created shared `checkRefereeConflict()` utility function
- Created `toggleActiveWithValidation()` wrapper that validates before starting matches
- Eliminated duplicate conflict detection code
- Follows existing architectural pattern (base function + validation wrapper)

**Why It Matters:**
Prevents tournament state corruption from simultaneous player participation and refereeing, ensuring consistent user experience across all views.

---

## ⚡ Performance Improvements

**Pre-v4.0 Tournament Import Optimization:**

Pre-v4.0 exports contain snapshot-based transaction history where each transaction includes a full copy of the entire tournament state. A typical 32-player tournament had 178 transactions totaling 8.56 MB of redundant data.

**The Problem:**
- Pre-v4.0 used snapshot-based undo (save full state before each action)
- v4.0 uses replay-based undo (save only changes, reconstruct by replaying)
- Formats are incompatible - v4.0 cannot use pre-v4.0 snapshots for undo
- Importing pre-v4.0 history consumed 8+ MB per tournament with zero functionality

**What Was Fixed:**
- Import logic now detects and skips pre-v4.0 transaction history
- All tournament data still imports correctly (players, matches, bracket, placements, results)
- Clear console logging: "⚠ Skipped importing X pre-v4.0 history entries (incompatible snapshot format, ~Y MB)"

**Impact:**
- ✅ **98.8% reduction** in localStorage usage for imported pre-v4.0 tournaments
- ✅ Eliminates risk of hitting browser localStorage quota limits
- ✅ Faster imports (no need to parse/store massive history)
- ✅ Tournament data (players, matches, results, placements) imports correctly
- ✅ v4.0+ tournaments continue to work normally with full undo functionality

**Technical Details:**
- Pre-v4.0 format: ~50 KB per transaction (full snapshot)
- v4.0 format: ~200 bytes per transaction (changes only)
- Typical savings: 8-10 MB per imported pre-v4.0 tournament

**Why It Matters:**
Prevents localStorage bloat and quota errors while ensuring all important tournament data is preserved. Historical pre-v4.0 tournaments can now be imported safely without consuming excessive browser storage.

---

## 🚀 Migration from v4.0.1

### Automatic
- Fully compatible with v4.0.1 and v4.0.0 tournaments
- No data migration required
- No functional changes to existing tournament behavior

### What's New
If you're importing pre-v4.0 tournaments:
1. Imports are now much faster
2. localStorage usage reduced by 98.8%
3. All tournament data (players, matches, results) imports correctly
4. Undo functionality not available for pre-v4.0 imports (as before)

If you're managing active tournaments:
1. Referee conflicts now detected in Tournament Bracket view
2. Cannot start matches when players are refereeing other matches
3. Clear visual warnings and disabled buttons
4. Consistent behavior across Match Controls and Tournament Bracket

### Compatibility
- All v4.0.1 and v4.0.0 tournaments work in v4.0.2
- v4.0.2 exports identical to v4.0.1 exports
- Pre-v4.0 tournament imports now optimized

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/IMPORT_EXPORT.md**: Complete import/export specification
- **Docs/RELEASE-NOTES-v4.0.1.md**: Documentation improvements and code cleanup
- **Docs/RELEASE-NOTES-v4.0.0.md**: Per-tournament history architecture overview

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.2** - Referee conflict detection and pre-v4.0 import optimization.
