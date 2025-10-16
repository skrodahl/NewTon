# NewTon DC Tournament Manager v3.0.0 Release Notes

**Release Date:** October 2025
**Major Version Release**

---

## Overview

Version 3.0.0 is a major release focused on mature features, improving tournament fairness, operational efficiency, and intentional workflows.

This release contains no breaking changes, and is a drop-in replacement for any v2 deployments.

**Tournament Fairness:**
The new fair seeding algorithm eliminates the systematic structural bias that existed in v2.x. Previously, sequential BYE placement created a predictable chain reaction where losing in the top half of FS-R2 was consistently easier than losing in the bottom half. The new randomized BYE distribution ensures no correlation between bracket position and opponent difficulty.

**Operational Improvements:**
Match Controls provides real-time tournament management with two-column layout, lane-based sorting, referee suggestions, and resource conflict prevention. Operators can see both bracket sides simultaneously, prevent problems before they occur, and make faster decisions during active tournaments. The improved undo system now properly clears resource assignments, eliminating orphaned lane/referee blocks.

**Usability Enhancements:**
A saved players registry reduces repetition for clubs with regular members. Payment status tracking provides clear visibility of who hasn't paid entrance fees. The completed design system unification creates consistent visual language throughout the application. Hover zoom makes navigating crowded brackets significantly easier.

**What's New:**
- Match Controls interface for real-time tournament operations
- Developer Console for diagnostics and system management
- Fair seeding algorithm eliminating structural bias
- Improved undo system with proper resource clearing
- Read-only protection of completed tournaments
- Saved players registry with payment status tracking
- Complete flat design system unification
- Server-side tournament sharing (optional, when deployed to PHP server)

---

## 🎉 Major New Features

### Match Controls
Real-time tournament operations interface that provides centralized management of all tournament activity.

**Key Features:**
- Two-column layout separating Frontside and Backside matches
- Start/stop matches with real-time status tracking
- Lane-based sorting organizing matches by physical venue layout
- Assign and reassign lanes and referees during tournament
- Timeline-based referee suggestions (Recent Winners, Losers, Assignments)
- Tournament completion celebration with achievements and export
- Auto-refresh when resources are assigned or changed

**Why It Matters:**
Operators can see both bracket sides simultaneously, prevent resource conflicts before matches start, and make faster decisions during active tournaments.

---

### Developer Console
Diagnostic and monitoring tool for tournament health and system management.

**Access:** Config → User Interface → Enable Developer Analytics, then click version number in Tournament Status Panel

**Core Capabilities:**
- **Real-time monitoring**: Transaction health, match state, player count, lane usage, localStorage usage
- **Six validation checks**: Lane assignments (LIVE + READY), referee assignments, match state integrity, transaction count, player ID integrity, progression integrity
- **Match Progression view**: Side-by-side bracket visualization with labeled progression flow, state icons, and raw code debugging view
- **System commands**: Re-render bracket, recalculate rankings, refresh dropdowns, validate everything, reset all config
- **Transaction management**: View history with advanced filtering, smart pruning to remove redundant data
- **Collapsible interface**: Statistics (240px), flexible content area, collapsible console footer (hidden by default)

**Transaction Pruning:**
Safely removes redundant operational transactions for completed matches while preserving all COMPLETE_MATCH records. Typically removes 40-60% of transactions in active tournaments. Preview mode shows impact before execution.

**Why It Matters:**
Operators can monitor tournament health in real-time, catch problems early, and manage storage usage to prevent hitting browser limits.

---

### Saved Players Registry
Persistent player database that maintains consistency across weekly tournaments.

**Key Features:**
- Players automatically added to registry when added to tournaments
- Payment status tracking with smart sorting (unpaid first, paid last)
- Two-section layout: Available Players and In Tournament
- One-click addition from saved list to current tournament
- Backup of saved player in the Tournament Data export JSON
- Import/export with merge or replace options
- Context-aware display: shows saved players during setup, switches to results during active tournament

**Why It Matters:**
Reduces repetition for clubs with regular players, prevents typos and naming inconsistencies, provides clear visibility of who hasn't paid entrance fees.

---

### Server Features & Tournament Sharing
Optional cloud features that activate automatically when deployed to PHP-enabled web server. Local-only usage remains fully functional.

**Server Capabilities:**
- Browse shared tournaments from server
- Upload completed tournaments to share with club members
- Load shared tournaments with one click
- Delete tournaments from server (configurable permission)
- REST API with file-based storage (no database required)
- Zero configuration - auto-detection of server capabilities

**Why It Matters:**
Clubs can maintain centralized tournament archives, share results across members, and access tournament history from multiple devices.

---

### Visual Enhancements

**Tournament Status Panel:**
Technical drawing-style status display in bottom-right corner showing club name, tournament name, format, player count, match count, date, version, and status (SETUP → ACTIVE → COMPLETE).

**Bracket Improvements:**
- Hover zoom for match cards (activates when bracket zoom < 1.0x)
- Zoom depth effect with dimmed background for focus
- Directional labels ("FRONTSIDE ►", "◄ BACKSIDE", "FINALS")
- Match progression lines showing winner/loser paths
- Match cards display final scores for completed matches
- "Leads to..." indicators showing tournament flow

**Why It Matters:**
Better navigation for crowded brackets, clearer tournament structure visibility, and clean appearance for streamed/recorded tournaments.

---

## 🔧 Major Improvements

### Design System Unification
Complete visual redesign establishing consistent flat 2D interface throughout the application.

**Changes:**
- Eliminated all rounded corners across functional elements
- Removed gradients for pure flat aesthetic
- Three-tier border system (bold containers, subtle headers, light internal elements)
- Flat outline button system with color-coded hover states
- Droid Serif font for application title (locally hosted)
- Enhanced contrast and typography hierarchy
- Extensive CSS refactoring
- Removed all mobile/responsive CSS (desktop-only application)

**Why It Matters:**
Consistent visual language throughout the application, cleaner codebase, and better maintainability.

---

### Undo System Improvements
Fixed critical bugs and extended capabilities for proper tournament management.

**Key Fixes:**
1. **Resource clearing**: Lane and referee assignments now properly cleared when undoing matches (previously persisted and blocked resources)
2. **Extended history**: Increased MAX_HISTORY_ENTRIES from 50 to 500 (prevents premature pruning in 32-player tournaments)
3. **Transaction type filtering**: Fixed downstream blocking checks finding wrong transaction types

**Transaction Pruning:**
Available through Developer Console. Removes redundant operational transactions while preserving COMPLETE_MATCH records. Safe operation - undo system unaffected.

**Why It Matters:**
Operators can safely undo matches without resource conflicts, and all matches remain undoable throughout entire tournaments.

---

### Fair Seeding
Replaced sequential seeding with randomized BYE distribution.

**The Problem:**
Sequential seeding clustered BYEs at bottom of FS-R1, creating a chain reaction that made losing in the top half of FS-R2 predictably easier than losing in the bottom half - every single tournament.

**The Solution:**
BYEs randomly scattered across all FS-R1 matches. Each BYE randomly placed in either player slot. Still guarantees no BYE-vs-BYE matches in FS-R1.

**Why It Matters:**
Eliminates systematic structural advantage and visual appearance of unfairness.

---

### Tournament Branding
Complete branding system integrating club identity throughout tournament experience.

**Features:**
- Club name configuration (changed from "Application Title" for clarity)
- Logo system supporting `.png`, `.jpg`, `.jpeg`, or `.svg` in root folder
- Automatic favicon using logo file
- Club name displayed in tournament headers and Status Panel
- Droid Serif title font for visual distinction

**Why It Matters:**
Professional appearance for clubs, clean branding for streamed/recorded tournaments.

---

### Other Notable Improvements

**Bracket Navigation:**
- Improved zoom precision (reduced step from 0.05 to 0.025)
- Bracket-size-specific default positioning
- Safari motion blur fix
- Home button returns to appropriate default for current bracket size

**Referee Suggestions:**
- Complete reimplementation with timeline-based approach
- Configurable display limit (5-20, default 10)
- Real-time updates when assignments change
- Smart filtering logic

**Configuration:**
- Reorganized Config page with logical section grouping
- Reset to defaults available for all sections
- Dynamic help system updated for new features

**Read-Only Tournament Protection:**
- Completed tournaments loaded from files or localStorage are automatically set to read-only
- Prevents accidental modifications to historical tournament data
- Comprehensive undo prevention and clear status messaging
- Reset Tournament available as escape hatch if modifications needed
- Read-only state persists across browser refreshes

---

## 🐛 Critical Bug Fixes

### Data Integrity
- **Read-only tournament protection**: Completed tournaments from files/localStorage automatically set read-only, preventing accidental modifications
- **Tournament loading data loss**: Fixed critical bug where tournaments lost players/matches after browser refresh
- **Payment status protection**: Prevented paid/unpaid changes during active/completed tournaments

### User Interface
- **Match Controls auto-refresh**: Updates immediately when lane assignments change (previously required reopening modal)
- **Registration page layout**: Fixed table width, padding, and scrolling issues
- **Bracket line positioning**: Fixed loser feed lines extending into match cards in 8-player brackets
- **Match card hover state**: Maintains zoom when changing lane/referee assignments (eliminates bracket blinking)

---

## 🔧 Technical Details

### Architecture
- Extended MAX_HISTORY_ENTRIES from 50 to 500
- Real-time localStorage monitoring vs 10 MB browser limit
- Unified tournament object structure across all operations
- Proper z-index management and Escape key support

### Performance
- CSS cleanup: 12% reduction (393 lines removed), 93.6% coverage
- Removed all mobile/responsive CSS (desktop-only)
- Safari zoom performance improvements
- Selective auto-refresh strategy

### Code Quality
- Eliminated duplicate CSS styles
- Unified flat design system across all 13 modals
- Single source of truth for score formatting
- Fixed CSS parser issues in Chrome

---

## 🚀 Migration from v2.x

### Automatic
- Existing tournaments fully compatible
- Player lists automatically created from tournaments
- Configuration migrated seamlessly
- Read-only flags applied to completed tournaments
- No data loss or manual intervention required

### Recommended Actions
1. Enable Developer Console in Config → User Interface
2. Try Match Controls for next tournament
3. Review Saved Players in Registration page
4. Set up club branding and logo
5. Configure payment tracking for entrance fees

### Compatibility
- All exports from v2.x load in v3.0.0
- v3.0.0 exports backward compatible with v2.3.0+ (basic tournaments)
- New features (Saved Players, Transaction Pruning) require v3.0.0
- Server features require v2.3.0 or later, no breaking changes in v3.0.0

---

## 📖 Additional Resources

- **Docs/UNDO.md**: Complete undo system documentation
- **Docs/ANALYTICS.md**: Developer Console usage guide (1000+ lines)
- **DESIGN.md**: Design system principles
- **CHANGELOG.md**: Complete version history since v2.0.0
- **Docs/PARKING-LOT.md**: Future feature ideas

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v3.0.0** - Tournament management with real-time operations and diagnostics.
