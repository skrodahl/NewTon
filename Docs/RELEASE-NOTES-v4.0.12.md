## NewTon DC Tournament Manager v4.0.12 Release Notes

**Release Date:** November 6, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.12** adds a tournament configuration display in Match Controls for quick reference and fixes visual clutter from referee conflict indicators on completed matches.

This release contains no breaking changes and is a drop-in replacement for v4.0.11.

**Key Highlights:**
- Tournament configuration displayed directly in Match Controls setup mode
- Cleaner bracket display with referee conflicts only shown on active matches

---

## ✨ New Features

**Tournament Configuration Display:**

Tournament operators can now view all configuration settings directly in Match Controls without navigating to Global Settings.

**What's New:**
- Configuration panel appears below participant list in setup mode
- 4-column layout displays:
  - **Point Values**: Participation and placement points (1st-8th)
  - **Achievement Points**: High Out, Short Leg, 180, Ton
  - **Match Configuration**: Best-of settings for all tournament rounds
  - **Lanes**: Available range and excluded lanes
- Header clearly indicates "Change in Global Settings Page" for modifications
- Automatically populated from current configuration

**Why It Matters:**
Operators frequently need to verify settings before generating brackets or during tournament setup. Having this information visible in Match Controls eliminates navigation overhead and helps catch configuration issues early.

**Example Use Cases:**
- Verify point values before bracket generation
- Check match lengths are correct for tournament format
- Confirm excluded lanes match physical setup
- Quick reference during setup without leaving Match Controls

---

## 🐛 Bug Fixes

**Referee Conflict Indicator on Completed Matches:**

Fixed visual clutter where completed matches showed referee conflict warnings even though the match couldn't be started.

**What Was Fixed:**
- Completed matches no longer show "⚠️ [Name] (Referee)" indicators
- Eliminates confusing dual-referee display (player slot showing "Nick (Referee)" while referee assignment shows "Ref: Benedict")
- Conflict warnings remain visible for pending/ready/live matches where they're actionable

**Why It Matters:**
The referee conflict system prevents starting matches when players are busy refereeing elsewhere. This warning is only relevant for matches that can be started - completed matches don't need this indicator and it was causing visual confusion.

**Impact:**
- Cleaner bracket display
- Reduced visual noise
- Conflict detection still works perfectly for active matches

---

## 🚀 Migration from v4.0.11

### Automatic
- Fully compatible with all v4.0.x tournaments
- No data migration required
- No functional changes to existing tournament behavior
- Configuration display populates automatically from existing settings

### What's New
After upgrading to v4.0.12:
1. **Open Match Controls in setup mode** - Configuration panel appears automatically
2. **View all settings at a glance** - Points, matches, and lanes in one place
3. **Cleaner completed matches** - No unnecessary referee conflict indicators
4. **No configuration needed** - Works immediately with existing tournaments

### Compatibility
- All v4.0.x tournaments work in v4.0.12
- Configuration display is read-only (changes still made in Global Settings)
- Referee conflict detection continues to work for active matches

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/RELEASE-NOTES-v4.0.11.md**: Insignia Regular font and demo header spacing
- **Docs/RELEASE-NOTES-v4.0.10.md**: Unpaid players validation
- **Docs/RELEASE-NOTES-v4.0.9.md**: localStorage storage indicator

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.12** - Configuration visibility and visual refinements.
