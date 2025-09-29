# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Collaboration Guidelines

**Discussion-First Approach**: Always discuss options and approach before implementing changes:
- Never change critical components without explicit permission
- Present multiple approaches when possible
- Explain trade-offs and implications of different solutions
- Wait for explicit approval before generating code or making complex changes
- Break down large tasks into smaller, discussable components
- Respect the principle that the human maintainer knows the codebase best

**Avoiding Code Duplication Through Collaboration**:
- If duplication seems necessary, discuss alternatives first before implementing
- Explore refactoring existing code for reusability instead of copying
- Consider extending existing functionality rather than creating parallel implementations
- Evaluate whether new functionality overlaps with existing features that could be enhanced
- Present trade-offs between complex reusable solutions vs. simple duplication
- Remember that maintainer knowledge often reveals better architectural solutions
- Always align proposed changes with the single-source-of-truth principle

## Project Overview

NewTon DC Tournament Manager is a fully self-contained web application for managing double-elimination darts tournaments. It runs entirely in the browser with no server, database, or internet connection required.

**Core Architecture:**
- **Frontend Only**: Pure HTML5, CSS3, and JavaScript (ES6+) - no frameworks or external dependencies
- **Storage**: Browser LocalStorage for offline persistence
- **Offline First**: Complete functionality without internet connection
- **Multi-tournament Support**: Manage multiple tournaments with import/export via JSON
- **Sky High Resilience**: Extremely crash-proof design that survives almost any failure scenario

## Development Workflow

Since this is a client-side only application, development is straightforward:

1. **Run**: Open `tournament.html` directly in a web browser
2. **Test**: Manual testing in browser (no automated test suite)
3. **Debug**: Use browser developer tools for debugging JavaScript
4. **No Build Process**: Direct file editing and browser refresh

## Key JavaScript Files

The application loads JavaScript files in this specific order (see tournament.html:458-465):

1. **main.js** - Core application logic, configuration loading, and DOM initialization
2. **lane-management.js** - Dartboard lane assignment and conflict prevention
3. **tournament-management.js** - Tournament creation, saving, and data management
4. **player-management.js** - Player registration, statistics, and data handling
5. **clean-match-progression.js** - Match progression logic using hardcoded lookup tables
6. **bracket-rendering.js** - Visual bracket rendering and interaction handling
7. **results-config.js** - Configuration management and results calculation
8. **dynamic-help-system.js** - Context-sensitive help system
9. **bracket-lines.js** - Tournament progression lines, separated from bracket-rendering.js

## Design Principles

### Sky High Resilience
This application is built with extreme crash-resistance as a core principle:

- **Single Source of Truth**: Hardcoded tournament logic and transaction-based history eliminate ambiguity
- **Code Reuse Over Duplication**: Always reuse existing functionality rather than duplicating logic
- **Bulletproof Data Integrity**: Transaction-based history system with automatic state validation
- **Graceful Failure Handling**: All operations designed to fail safely without corrupting tournament data
- **Rebuild Protection**: Multiple safety mechanisms prevent bracket corruption during reconstruction
- **Auto-recovery**: Application can rebuild entire bracket state from transaction history
- **Defensive Programming**: Extensive input validation and boundary checking throughout

### UI Safety and Guard Rails
Dangerous operations are protected with multiple layers of safety:

- **Confirmation Dialogs**: All destructive actions require explicit user confirmation
- **Hidden Dangerous Features**: Destructive operations like "Reset Tournament" are not prominently displayed
- **Context-Sensitive Warnings**: Clear messaging about consequences before destructive actions
- **Undo System**: Complete match history allows reversal of most operations
- **Export Before Destroy**: Encourage data export before any destructive operations

**Examples of Protected Operations:**
- Tournament reset requires confirmation and warns about data loss
- Bracket regeneration warns about clearing existing matches
- Match winner selection has optional confirmation dialogs
- Player deletion checks for tournament participation

## Critical Architecture Details

### Match Progression System
- Uses **hardcoded lookup tables** in `clean-match-progression.js` for bulletproof match advancement
- **MATCH_PROGRESSION** object is the single source of truth for winner/loser paths
- Supports 8, 16, and 32 player brackets with proper frontside/backside distribution
- All bracket operations reuse the same progression logic - no duplication
- Never modify progression logic without understanding the complete bracket flow

### Data Management
- **Tournament Isolation**: Clean separation between global config and tournament-specific data
- **History System**: Complete transaction-based undo functionality with state snapshots
- **Auto-saving**: All changes immediately saved to LocalStorage
- **Import/Export**: JSON-based data exchange with validation

### Bracket Logic
- **Double Elimination**: Professional frontside/backside structure
- **Auto-advancement**: Intelligent walkover handling (byes automatically advance real players)
- **State Management**: Comprehensive match state tracking (pending/ready/live/completed)
- **Rebuild Protection**: `rebuildInProgress` flags prevent corruption during bracket reconstruction

## Configuration and Customization

### Logo Customization
Place a square image named `logo.png`, `logo.jpg`, `logo.jpeg`, or `logo.svg` in the root folder to replace the default club logo placeholder.

### Point System Configuration
All scoring is configurable through the Config page:
- Participation points (default: 5)
- Placement points (1st: 15, 2nd: 13, etc.)
- Achievement points (high outs, tons, 180s, short legs)

### Match Configuration
- Configurable best-of legs for different tournament rounds
- Lane assignment system (1-20 dartboards)
- Referee assignment with conflict prevention

## File Naming Conventions

- **Kebab-case for JavaScript files**: `clean-match-progression.js`, `bracket-rendering.js`
- **Match IDs**: Format like `FS-1-1` (Frontside Round 1 Match 1), `BS-FINAL` (Backside Final)
- **Player slots**: `player1`, `player2` for consistent positioning

## Development Tips

- **Browser Compatibility**: Target Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **No External Dependencies**: Keep the zero-dependency architecture
- **LocalStorage Limits**: Monitor storage usage for large tournaments
- **Transaction Safety**: Always use the history system for match state changes
- **Lookup Tables**: Bracket progression is intentionally hardcoded for reliability
- **Resilience First**: When adding features, prioritize crash-resistance over convenience
- **Code Reuse Mandate**: Always prefer reusing existing code over duplicating functionality
- **Single Source Principle**: Use hardcoded lookup tables and transaction history as authoritative sources
- **Guard Rail Philosophy**: Make dangerous operations require deliberate user action
- **Fail Safe**: Design all operations to fail gracefully without data corruption
- **Validate Everything**: Extensive input validation prevents invalid application states

## Data Structure Notes
1
The application maintains strict separation between:
- **Global Configuration**: Persistent across all tournaments (point values, UI settings)
- **Tournament Data**: Specific to each tournament (players, matches, statistics)
- **Match History**: Transaction log enabling complete undo functionality

When modifying bracket logic, always test with 8, 16, and 32 player tournaments to ensure proper frontside/backside mirroring and progression paths.
