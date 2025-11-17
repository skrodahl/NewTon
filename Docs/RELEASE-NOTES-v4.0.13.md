## NewTon DC Tournament Manager v4.0.13 Release Notes

**Release Date:** November 17, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.13** fixes text wrapping in the results table by adjusting column widths to prevent "Rank" and "Legs Lost" headers from splitting across lines.

This release contains no breaking changes and is a drop-in replacement for v4.0.12.

**Key Highlights:**
- Results table column widths adjusted to prevent header text wrapping
- Cleaner display of tournament results

---

## 🐛 Bug Fixes

**Results Table Column Width Adjustment:**

Fixed text wrapping in results table headers where "Rank" and "Legs Lost" would split across multiple lines.

**What Was Fixed:**
- Rank column widened from 5% to 9%
- Player Name column adjusted from 25% to 24%
- Points column adjusted from 10% to 9%
- All text now displays on single lines without wrapping

**Why It Matters:**
Professional tournament results should display cleanly without awkward text breaks. The adjusted column widths ensure headers and data fit properly across all tournament sizes.

**Impact:**
- Cleaner results display
- Better readability
- Consistent formatting across different screen sizes

---

## 🚀 Migration from v4.0.12

### Automatic
- Fully compatible with all v4.0.x tournaments
- No data migration required
- No functional changes to existing tournament behavior
- Column width adjustments apply automatically on page load

### What's New
After upgrading to v4.0.13:
1. **Results table displays cleanly** - No text wrapping in headers
2. **No configuration needed** - Visual updates apply immediately

### Compatibility
- All v4.0.x tournaments work in v4.0.13
- No changes to tournament logic or data structures

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/RELEASE-NOTES-v4.0.12.md**: Configuration display and referee conflict fixes
- **Docs/RELEASE-NOTES-v4.0.11.md**: Insignia Regular font and demo header spacing
- **Docs/RELEASE-NOTES-v4.0.10.md**: Unpaid players validation

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.13** - Clean results table display.
