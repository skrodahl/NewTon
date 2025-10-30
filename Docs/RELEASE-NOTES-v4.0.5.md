## NewTon DC Tournament Manager v4.0.5 Release Notes

**Release Date:** October 30, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.5** introduces comprehensive UI terminology improvements, unifying naming conventions across the application for clarity and consistency. Player rankings are now consistently referred to as "Leaderboard" throughout the interface, and tournament context has been enhanced with more descriptive labels.

This release contains no breaking changes and is a drop-in replacement for v4.0.4.

**Key Highlights:**
- Unified "Leaderboard" terminology replaces inconsistent "Statistics" and "Tournament Results" labels
- Enhanced tournament context with "Active Tournament" header
- Dynamic "Match History" heading shows tournament name and date
- Improved visual hierarchy with adjusted column header font sizing

---

## ✨ Enhancements

### Renamed "Statistics" to "Leaderboard" Throughout Application

**Previous Behavior:**
- Various UI elements used inconsistent terminology: "Statistics", "Tournament Results", "Match Results"
- Unclear distinction between individual player achievements and tournament rankings
- User confusion about what "Statistics" referred to (rankings vs. player achievements)

**What's New:**

**1. Unified "Leaderboard" Terminology**
- **Tournament page navigation button**: "Statistics" → "Leaderboard"
- **Statistics modal heading**: "📊 Tournament Statistics" → "📊 Leaderboard"
- **Registration page heading**: "Tournament Results" → "Leaderboard"
- **Match Controls modal button**: "Statistics" → "Leaderboard"

**2. Help System Updates**
- Tournament navigation description: "Statistics (≡): View tournament statistics..." → "Leaderboard (≡): View tournament leaderboard..."
- Match Controls description: "Statistics Button: Access tournament and player statistics..." → "Leaderboard Button: Access tournament leaderboard and player rankings..."

**3. Context Preservation**
- **"Player Statistics"** (individual player achievements editor) remains unchanged
- "Save Statistics" button in player editor maintains original label
- Clear distinction: "Player Statistics" = individual achievements, "Leaderboard" = tournament rankings

**Why It Matters:**
- Instantly recognizable term that conveys competitive ranking
- Consistent terminology across Tournament, Registration, Match Controls, and Help system
- Clear separation between editing individual player stats vs. viewing tournament rankings
- Modern, intuitive interface language

---

### Enhanced Tournament Context Labels

#### "Active Tournament" Header

**Previous Behavior:**
- Header showed "Tournament: My Tournament (2025-10-27)"
- Generic label didn't emphasize current selection status

**What's New:**
- Header shows "Active Tournament: My Tournament (2025-10-27)"
- More descriptive adjective indicates the currently active/selected tournament
- Consistent with multi-tournament management workflow

**Why It Matters:**
- Clearer indication of which tournament is currently selected
- Helps users distinguish between loaded tournament and tournament list
- Better context when managing multiple tournaments

---

#### Dynamic "Match History" with Tournament Context

**Previous Behavior:**
- Setup page showed static "Match Results" heading
- No indication of which tournament's matches were displayed
- Ambiguous label (results vs. historical log)

**What's New:**
- Dynamic heading: "Match History: My Tournament (2025-10-27)"
- Tournament name and date update automatically with active tournament
- Date uses normal font weight (not bold) for better visual hierarchy
- Shows "Match History: None" when no tournament is active
- Help system updated to reference "Match History" consistently

**Implementation Details:**
- Heading updates via `updateMatchHistory()` function in `main.js`
- Inline styling for date font-weight control (`<span style="font-weight: normal;">`)
- Synchronized with tournament activation/deactivation

**Why It Matters:**
- Clarifies this is a historical log, not just final results
- Tournament context prevents confusion when switching between tournaments
- Consistent with other dynamic headers throughout the application
- Better information architecture for tournament management

---

### Visual Hierarchy Improvements

#### Column Header Font Size Adjustment

**Previous Behavior:**
- Column headers (Recent Tournaments, Match History, Tournament Players, Leaderboard) used 1rem font size
- Slightly undersized relative to content importance

**What's New:**
- Column headers now use 1.15rem font size
- Improved readability and visual hierarchy
- Better balance with header height (60px)

**Why It Matters:**
- Enhanced readability for section navigation
- Clearer visual distinction between headers and content
- Professional typography that guides user attention

---

## 📊 Complete Terminology Map

The application now has consistent, intuitive terminology across all interfaces:

| Context | Old Label | New Label | Purpose |
|---------|-----------|-----------|---------|
| **Tournament page button** | Statistics | Leaderboard | Access rankings modal |
| **Rankings modal heading** | Tournament Statistics | Leaderboard | Display player rankings |
| **Registration page** | Tournament Results | Leaderboard | Show current standings |
| **Match Controls button** | Statistics | Leaderboard | Quick access to rankings |
| **Setup page matches** | Match Results | Match History | Historical match log |
| **Top header** | Tournament: ... | Active Tournament: ... | Current tournament indicator |
| **Player editor** | Player Statistics | Player Statistics | Individual achievements (unchanged) |

---

## 🎯 User Experience Improvements

### Clearer Mental Model

**Before v4.0.5:**
- "Statistics" could mean tournament rankings OR player achievements
- "Tournament Results" unclear if it's final results or ongoing standings
- "Match Results" ambiguous about scope and context

**After v4.0.5:**
- **"Leaderboard"** = tournament rankings (competitive standings)
- **"Player Statistics"** = individual player achievements (data entry)
- **"Match History"** = historical log of completed matches
- **"Active Tournament"** = currently loaded/selected tournament

### Intuitive Navigation

Users now have clear expectations when clicking buttons:
- **"Leaderboard"** button → Opens ranked player standings
- **"Player Statistics"** → Opens achievement editor for individual player
- **"Match History"** → Shows chronological list of completed matches
- **"Active Tournament"** → Identifies current tournament context

---

## 🚀 Migration from v4.0.4

### Automatic
- Fully compatible with v4.0.4, v4.0.3, v4.0.2, v4.0.1, and v4.0.0 tournaments
- No data migration required
- No functional changes to existing tournament behavior
- All tournament data, history, and settings preserved

### What's New
After upgrading to v4.0.5:
1. **Leaderboard terminology** - "Statistics" buttons and headings now say "Leaderboard"
2. **Active Tournament indicator** - Header emphasizes current tournament selection
3. **Match History context** - Shows which tournament's matches are displayed
4. **Improved readability** - Larger column headers (1.15rem vs 1rem)

### Compatibility
- All v4.0.x tournaments work in v4.0.5
- v4.0.5 exports identical to v4.0.4 exports
- No changes to core tournament functionality
- Help system automatically reflects new terminology

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **Docs/IMPORT_EXPORT.md**: Complete import/export specification
- **Docs/RELEASE-NOTES-v4.0.4.md**: Font system improvements and CSS variable control
- **Docs/RELEASE-NOTES-v4.0.3.md**: Developer Console placement rank enhancement
- **Docs/RELEASE-NOTES-v4.0.2.md**: Referee conflict detection and pre-v4.0 import optimization
- **Docs/RELEASE-NOTES-v4.0.1.md**: Documentation improvements and code cleanup
- **Docs/RELEASE-NOTES-v4.0.0.md**: Per-tournament history architecture overview

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.5** - UI terminology improvements for clarity, consistency, and intuitive user experience.
