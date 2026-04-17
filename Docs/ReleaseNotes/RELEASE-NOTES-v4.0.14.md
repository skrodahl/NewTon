## NewTon DC Tournament Manager v4.0.14 Release Notes

**Release Date:** November 17, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.14** fixes the tournament configuration display appearing incorrectly during active and completed tournament states in Match Controls.

This release contains no breaking changes and is a drop-in replacement for v4.0.13.

**Key Highlight:**
- Configuration settings now only display during setup mode

---

## 🐛 Bug Fixes

**Match Controls Configuration Display Fix:**

Fixed tournament configuration settings showing in Match Controls during active and completed tournaments when they should only appear during setup mode.

**What Was Fixed:**
- Configuration display now hidden when tournament is active
- Configuration display now hidden when tournament is completed
- Configuration display only visible during setup mode

**Why It Matters:**
The configuration display provides quick reference to tournament settings during setup, but clutters the interface during active tournaments when operators need referee suggestions and match controls instead.

**Impact:**
- Cleaner Match Controls during active tournaments
- Configuration visible only when relevant
- Proper state-driven UI behavior

---

## 🚀 Migration from v4.0.13

### Automatic
- Fully compatible with all v4.0.x tournaments
- No data migration required
- No functional changes to existing tournament behavior
- Display logic updates apply automatically

### What's New
After upgrading to v4.0.14:
1. **Match Controls shows correct content** - Configuration only in setup, referee suggestions during active play
2. **No configuration needed** - State-based display works automatically

### Compatibility
- All v4.0.x tournaments work in v4.0.14
- No changes to tournament logic or data structures

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/RELEASE-NOTES-v4.0.13.md**: Results table column width adjustments
- **Docs/RELEASE-NOTES-v4.0.12.md**: Configuration display and referee conflict fixes
- **Docs/RELEASE-NOTES-v4.0.11.md**: Insignia Regular font and demo header spacing

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.14** - Clean Match Controls interface.
