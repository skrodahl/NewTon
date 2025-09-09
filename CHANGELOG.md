# 2025-09-09
## Improved Export of Results

### Added
- **Results Exported as JSON**
  - Better for importing into other systems
  - CSV are handled poorly in Excel
 
### Fixed
- **Tournament Import**
  - Bracket rendering failed when importing and loading tournaments.
  - Bracket size is now calculated from the tournament JSON file.
 
### Technical Changes
- Added two new functions:
  - exportResultsJSON()
  - generateResultsJSON()

# 2025-09-07
## Enhanced Referee Assignment System & UI Improvements

### Added
- **Intelligent Referee Assignment System**
  - Alphabetical sorting of all paid players in referee dropdowns
  - Conflict detection preventing double-assignment of referees
  - Visual indicators for unavailable referees:
    - "(assigned)" for referees already assigned to other matches
    - "(playing)" for players currently in live matches
  - Real-time dropdown updates when match states change
  - Integration with existing lane management conflict detection system

### Changed
- **Enhanced Dropdown Usability**
  - Increased referee dropdown font size for better readability
  - Expanded referee dropdown width to accommodate longer names
  - Increased lane dropdown font size for consistency
  - Expanded lane dropdown width for "(in use)" labels
  
- **Improved Match Card Layout**
  - Expanded match card dimensions
  - Increased player name font size for better visibility
  - Expanded player name max-width to utilize available space
  - Better accommodation for winner checkmarks and longer player names

- **Referee System Integration**
  - Modified `toggleActiveWithLaneValidation()` to refresh both lane and referee dropdowns
  - Enhanced `updateMatchReferee()` with conflict validation and error handling
  - Automatic dropdown refresh when referee assignments change

### Technical Changes
- Added referee conflict detection functions to `lane-management.js`:
  - `getAssignedReferees(excludeMatchId)` - tracks current referee assignments
  - `getPlayersInLiveMatches(excludeMatchId)` - identifies players in active matches
  - `isPlayerAvailableAsReferee(playerId, excludeMatchId)` - availability validation
  - `refreshAllRefereeDropdowns()` - updates all referee dropdowns system-wide
  - `generateRefereeOptionsWithConflicts()` - creates conflict-aware dropdown options
- Enhanced `updateMatchReferee()` in `bracket-rendering.js` with validation and error handling
- Updated `renderMatch()` to use new referee dropdown generation with conflict detection
- Modified CSS `.player-name-short` and `.bracket-match` classes for improved readability

### Files Modified
- `lane-management.js` - Added complete referee conflict detection system
- `bracket-rendering.js` - Enhanced referee dropdown integration and validation
- `styles.css` - Updated match card dimensions and player name styling

### User Experience Improvements
- Referees can no longer be double-assigned across matches
- Clear visual feedback when referee assignments conflict
- Much improved readability of match card text and dropdowns
- Consistent styling between lane and referee assignment systems
- Automatic prevention of assigning players who are currently playing as referees

### Bug Fixes
- Resolved referee dropdown function loading order issues
- Fixed missing function exports causing console errors
- Ensured proper integration between lane and referee management systems
- Problems with loading number of lanes from config

# 2025-09-06
## Enhanced Match Validation & Dynamic Help System

### Added
- **Enhanced Match Result Validation**
  - Real-time validation for leg scores in winner confirmation dialog
  - Core requirement: Winner must have more legs than loser
  - Smart validation against match format (Bo3/5/7) with flexibility
  - Visual feedback with red validation messages
  - Disabled confirm button for invalid inputs
  - Pre-filled winner legs based on match format, loser defaults to 0
  - Input sanitization preventing negative numbers

- **Dynamic Help System**
  - Context-aware help for all pages (Setup, Registration, Tournament, Config)
  - Floating, draggable help modal that doesn't interfere with workflow
  - Progressive disclosure with expandable help sections
  - Smart suggestions based on current tournament state
  - Keyboard shortcuts: F1 (toggle help), ESC (close), Ctrl+H (toggle)
  - Auto-detection of first-time users with welcome help
  - Contextual hints appearing based on user actions:
    - "Need more paid players" when < 4 players
    - "Ready to generate bracket" when enough players added
    - "Matches ready to start" when bracket is generated
    - "Tournament completed" celebration when Grand Final ends
  - Quick action buttons in help panel relevant to current context
  - Comprehensive help content covering all application features
  - Troubleshooting section for common issues

### Changed
- **Enhanced Winner Confirmation Dialog**
  - Added leg score input fields with validation
  - Improved visual layout with better user guidance
  - Enhanced error handling and user feedback

- **Tournament Management Functions**
  - `createTournament()` now triggers help hints for new users
  - `generateCleanBracket()` provides contextual guidance
  - `addPlayer()` and `togglePaid()` show progress hints toward minimum player count
  - `completeMatch()` celebrates first match completion
  - All winner selection functions now use enhanced validation

- **User Interface**
  - Help buttons (?) added to all page headers
  - Improved modal styling and accessibility
  - Better visual feedback for form validation states

### Technical Changes
- Added `validateLegScores()` function with comprehensive validation rules
- Added `updateValidationDisplay()` for real-time feedback
- Added `showValidationError()` for fallback error handling
- Added `dynamic-help-system.js` with complete help infrastructure
- Enhanced global function exports for help system integration
- Added contextual help detection and suggestion system
- Integrated help hooks throughout existing tournament management functions

### Files Modified
- `clean-match-progression.js` - Enhanced winner confirmation with validation
- `tournament-management.js` - Added help integration hooks
- `player-management.js` - Added help hints for player management
- `main.js` - Enhanced page navigation with help integration
- `tournament.html` - Updated winner confirmation modal, added help system scripts
- `styles.css` - Added help system and validation styling

### Files Added
- `dynamic-help-system.js` - Complete dynamic help system implementation

### Bug Fixes
- Fixed help button positioning on Registration and Config pages
- Improved modal z-index handling for better UX
- Enhanced input validation preventing invalid match results

# 2025-09-05

## Leg Tracking System Implementation
### Core Features Added:

- Added leg score inputs to winner confirmation dialog (tournament.html)
- Implemented leg score storage on match objects (`match.finalScore`)
- Added leg calculation function to sum scores from completed matches
- Updated results table to display Legs Won/Legs Lost columns
- Included leg data in CSV export functionality

### Undo System Enhancement:

- Modified undo system to preserve all player statistics during match rollbacks
 - Match-related data (progression, leg scores) gets undone with match results
- Performance statistics (tons, 180s, short legs, high outs) persist through undo operations
- Fixed player data restoration to only restore tournament and match state

### UI Improvements:

- Enhanced winner confirmation dialog with optional leg score entry
- Pre-fills winner's minimum legs based on match format (Bo3=2, Bo5=3, Bo7=4)
- Real-time results table updates after each match completion
- Added legs won/lost columns to both display table and CSV export

### Technical Implementation:

- Leg scores stored as `{winnerLegs, loserLegs, winnerId, loserId}` on match object
- Calculation function iterates through completed matches to sum player leg totals
- Undo system preserves player stats while reverting match progression
- Auto-refresh of results table after match completion

### Data Architecture:

- Match-level storage for legs (tied to match lifecycle)
- Player-level storage for performance stats (persistent across undo operations)
- Clean separation between match results and player achievements
