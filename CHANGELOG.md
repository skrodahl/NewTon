# 2025-01-11

## **v4.1.10** - Chalker Live Stats & Best-Of Indicator

### Chalker Enhancements
- **Live Stats screen**: New STATS button (replaced SETTINGS) shows real-time match statistics
  - Same layout as Match Complete and History Detail screens
  - Full statistics table: tons, 180s, short legs, high outs, first 9 avg, match avg, leg averages
  - Completed leg scoresheets with color coding (tons=blue, 180s=gold, checkouts=green)
  - Current leg in progress with "In Progress" badge and yellow highlight border
  - Current remaining scores shown at bottom of in-progress leg
  - Back button returns to scoring screen
- **Best-of indicator on chalkboard**: First row center cell now shows match length (e.g., "Bo3", "Bo5")
  - Replaces empty dart count cell in row 0
  - Styled distinctly from other numbers (smaller, secondary color)

### Technical Details
- Added Live Stats screen HTML with stats table and legs container
- Added `showLiveStats()` and `renderLiveStatsScoresheets()` functions
- Added CSS for `.in-progress-badge`, `.leg-in-progress`, `.current-remaining`
- Added `.col-bestof` styling for best-of indicator
- Updated `renderChalkboard()` to show `Bo${bestOf}` in first row
- Service worker cache version bumped to v44

---

# 2025-01-09

## **v4.1.9** - Chalker Edit Checkout Bug Fix & Touch Improvements

### Bug Fixes
- **Edit-after-opponent-entry checkout**: Fixed bug where editing a previous score to create a checkout after the opponent had already entered a visit would leave orphaned visit data and fail to advance to the next leg
  - Orphaned visits after the edited checkout are now removed
  - UI correctly advances to the next leg
  - Statistics and dart counts calculate correctly

### Improvements
- **Disable double-tap zoom on iOS**: Added `touch-action: manipulation` to prevent accidental zoom when tapping quickly on the keypad

### Technical Details
- Added `visits.splice()` in `completeEditCheckout()` to remove orphaned visits
- Changed to call `startNewLeg()` + `updateDisplay()` instead of just `updateDisplay()`
- Added `saveCurrentMatch()` call to persist state
- Service worker cache version bumped to v34

---

## **v4.1.8** - Chalker End Screen Unification

### Chalker Enhancements
- **Unified Match Complete screen**: End-of-match screen now matches History Detail format
  - Same stats table with tons, 180s, short legs, high outs, first 9 avg, match avg, and leg averages
  - Full leg-by-leg scoresheets with color coding (tons=blue, 180s=gold, short legs=purple, checkouts=green)
  - Consistent layout between viewing completed matches and finishing a match
- **History button on end screen**: Quick navigation to match history from Match Complete screen
- **24-hour time format**: Timestamps now display in 24H format instead of AM/PM
- **Dynamic short leg indicator**: Short leg threshold now varies by game variant using lookup table
  - 501: 21 darts, 301: 15 darts, 701: 27 darts, etc.

### Technical Details
- Replaced old end screen HTML with `history-detail-content` structure
- Added `renderEndScreenLegScoresheets()` function reusing history detail logic
- Changed `toLocaleTimeString()` calls to use `hour12: false`
- Short leg detection now uses `SHORT_LEG_THRESHOLDS[config.startingScore]`
- Added `.btn-tertiary` CSS class for History button
- Removed obsolete CSS (`.result-display`, `.match-players`, old `.winner-name`)
- Service worker cache version bumped to v29

---

## **v4.1.7** - Chalker Legibility & Bug Fixes

### Chalker Enhancements
- **System font for scores**: Scores now use native system fonts instead of Cascadia Code monospace
  - San Francisco on iOS, Roboto on Android, Segoe UI on Windows
  - Much cleaner and more legible at a distance
  - Tabular numerals keep digits aligned
- **Larger tablet keypad**: Increased button height on tablets for easier tapping

### Bug Fixes
- **Tie-break display fix**: Selecting a tie-break winner now correctly updates the display and starts the new leg
- **Tablet styles portrait-only**: Tablet scaling now only applies in portrait orientation, fixing oversized UI on desktop browsers

### Technical Details
- Added `--font-scores` CSS variable with system font stack
- Applied `font-variant-numeric: tabular-nums` for aligned digits
- Increased tablet keypad vertical padding from `--spacing-md` to `--spacing-xl`
- Added `updateDisplay()` call after tie-break winner selection
- Changed tablet media query to `(min-width: 768px) and (orientation: portrait)`

---

## **v4.1.5** - Chalker Viewport-Based Row Heights

### Chalker Enhancements
- **Viewport-based chalkboard rows**: Row heights now use `vh` units instead of fixed pixels
  - Rows automatically scale to show ~7-8 rounds on any screen size
  - Phones and tablets now display the same number of visible rows
  - Eliminates the "too many rows visible" problem on larger screens

### Technical Details
- Changed `.chalk-table td` height from fixed `44px`/`80px` to `6vh`
- Removed tablet-specific height override (no longer needed)
- Font sizes still scale via media query for readability

---

## **v4.1.4** - Chalker Tablet Scaling

### Chalker Enhancements
- **Tablet-optimized interface**: Responsive scaling for screens 768px and wider (~1.8x from phone)
  - Score anchors: 3rem → 5.5rem
  - Chalkboard cells: 44px → 80px height, 2.75rem fonts
  - Keypad buttons: 1.125rem → 2.25rem with larger touch targets
  - Form inputs, modals, and buttons all scaled up
  - Increased spacing throughout (8-56px vs 4-32px)

### Technical Details
- Added `@media screen and (min-width: 768px)` breakpoint
- CSS custom properties (spacing) scaled ~1.8x for tablets
- All screens affected: config, scoring, modals, end-of-match stats

---

# 2025-01-08

## **v4.1.3** - Chalker PWA (Progressive Web App)

### Chalker Enhancements
- **PWA Support**: Chalker can now be installed as a standalone app on mobile devices and desktops
  - Works fully offline after first visit
  - Add to home screen for native app-like experience
  - No browser chrome in standalone mode (clean, full-screen interface)
  - Portrait orientation locked
  - Dark theme status bar (#1a1a1a)

- **Self-Contained App Structure**: Chalker moved to dedicated `/chalker/` subfolder
  - Clean URL: `https://your-domain/chalker/`
  - All assets (JS, CSS, fonts, icons) contained within subfolder
  - Completely independent from Tournament Manager

### PWA Components
- **manifest.json**: App metadata for installation (name, icons, display mode, orientation)
- **sw.js**: Service worker with cache-first strategy for offline functionality
- **Icons**: 192×192 and 512×512 PNG icons generated from NewTon logo

### Technical Details
- Service worker caches: index.html, chalker.js, chalker.css, both fonts, both icons, manifest.json
- Cache versioning via `CACHE_NAME` constant (bump to force update)
- `skipWaiting()` and `clients.claim()` for immediate activation
- Apple-specific meta tags for iOS home screen support

### File Structure Change
```
Before: /chalker.html, /js/chalker.js, /styles/chalker.css
After:  /chalker/index.html, /chalker/js/chalker.js, /chalker/styles/chalker.css
        + /chalker/manifest.json, /chalker/sw.js, /chalker/fonts/, /chalker/images/
```

---

## **v4.1.2** - Chalker Mobile Display Improvements

### Chalker Enhancements
- **Two-line result display**: End-of-match result now shows on two lines for better mobile readability
  - Line 1: "Player 1 vs Player 2" with winner highlighted in green
  - Line 2: Final leg score (e.g., "2 - 1")
- **Per-leg stats reorganization**: Each stat now displays on its own line for clearer reading
  - Average (bold)
  - Darts count (highlighted if short leg)
  - Checkout score (highlighted if 101+)
  - 180s count
  - Tons count

### Technical Details
- Restructured result display HTML with `.match-players` container
- Added `.leg-stat-detail` CSS class for individual stat lines
- Updated `buildPlayerStats()` function to generate separate line elements

---

## **v4.1.1** - Chalker Stats Improvements

### Chalker Enhancements
- **Format-specific short leg thresholds**: Short legs now use correct dart thresholds based on starting score format (101: 4, 201: 8, 301: 13, 401: 17, 501: 21, 601: 25, 701: 29, 801: 34, 901: 38, 1001: 42)
- **Dynamic short legs label**: End-of-match stats screen now shows format-specific threshold (e.g., "Short Legs (≤21)" for 501)
- **Improved per-leg stats display**: Reorganized leg stats with better visual hierarchy
  - Line 1: Average (bold, primary stat)
  - Line 2: Checkout info showing darts and checkout score (e.g., "15 darts, 107 out")
  - Line 3: Scoring achievements (e.g., "1 × 180, 4 tons")
- **Compact keypad**: Reduced keypad height for better phone display
- **Chalkboard row overflow fix**: Reduced font size and row height to prevent 3-digit scores with cursor from wrapping

### Technical Details
- Added `SHORT_LEG_THRESHOLDS` constant mapping starting scores to dart thresholds
- Added `id="short-legs-label"` to HTML for dynamic label updates
- New CSS classes: `.leg-stat-avg`, `.leg-stat-checkout`, `.leg-stat-scoring` for visual hierarchy

---

# 2025-01-07

## **v4.1.0** - NewTon Chalker App & Bracket Enhancements

### Tournament Manager Improvements
- **Backside Match Source Visibility**: Hovering over backside matches now shows which matches feed into them
  - Status bar displays "Fed by FS-X-X, FS-X-X" between match state and destination
  - Extracted reusable `buildMatchSourcesLookup()` function in analytics.js
  - Helps referees and organizers track player progression through losers bracket
- **Status Bar Styling**: Floating tooltip now has slight offset from bottom edge for cleaner appearance

### New Feature: Companion Scoring App
- **NewTon Chalker**: Tablet-optimized x01 dart scoring application for referees/chalkers
  - Standalone companion app to the main Tournament Manager
  - Designed for portrait tablet use at dartboards
  - Fully offline - no server or internet required

### Chalker Features
- **Match Configuration**
  - Player names entry
  - Starting score selection (101-1001)
  - Best-of legs (1-11)
  - Max rounds configuration (7-20 rounds / 21-60 darts)
  - Double-in toggle option

- **Scoring Interface**
  - Large, readable score display with active player highlight (green tint)
  - Leg starter indicated by green player name in header (alternates each leg)
  - Centered leg score display in header
  - Chalkboard-style ledger with continuous grid lines (HTML table)
  - Inline score input directly in chalkboard cells with blinking cursor
  - Excel-like editing: tap any recorded score to edit (pre-populates existing value)
  - Auto-scroll to keep active input row visible
  - Touch-friendly numpad with DEL and OK buttons
  - Tons (100+) highlighted in blue, 180s in green
  - Grey background on dart count column for visual separation

- **Match Flow**
  - Automatic player turn alternation
  - Checkout detection with dart count prompt (1/2/3 darts)
  - Leg win tracking with automatic new leg start
  - Match completion detection based on best-of setting

- **End-of-Match Statistics**
  - Winner/loser display with final leg score
  - Tons (100+) count per player
  - 180s count per player
  - Short legs (≤21 darts) count
  - High checkouts (101+) count
  - First 9 dart average per player
  - Overall match average per player
  - Per-leg averages breakdown

- **Match Management**
  - Menu with Rematch and New Match options
  - Confirmation dialogs to prevent accidental data loss
  - Edit mode for correcting previously entered scores

### Technical Details
- **Files added**:
  - `chalker.html` - Main HTML structure with semantic table for chalkboard
  - `styles/chalker.css` - Tablet-optimized styling with CSS variables
  - `js/chalker.js` - Complete scoring logic and state management
- **Architecture**: Self-contained IIFE with clean state management
- **Styling**: Reuses NewTon font stack (Manrope, Cascadia Code)

---

# 2025-11-21

## **v4.0.16** - Header Clock

### New Features
- **Added clock to main header**
  - Clock displayed in upper right corner, aligned with title/logo
  - The clock is useful, since the app often runs in full-screen which hides the system clock
  - Styled identically to Match Controls clock (border, shadow, monospace font)
  - Visible on all pages (Setup, Registration, Tournament, Config)
  - Updates every 10 seconds to catch minute changes
  - **Files modified**: `tournament.html`, `css/styles.css`, `js/tournament-management.js`

---

# 2025-11-19

## **v4.0.15** - JSDoc Type Definitions & Function Annotations

### Developer Experience
- **Added comprehensive JSDoc type definitions for all core data structures**
  - **New file**: `js/types.js` - Centralized type definitions for IDE support
  - **Core types defined**:
    - `Player` - All properties including stats, placement, eliminated, isBye
    - `PlayerStats` - shortLegs, highOuts, tons, oneEighties
    - `Match` - Complete with 16+ properties including finalScore
    - `Tournament` - Full structure with placements map
    - `Config` - All 5 sub-configs (Points, Legs, Lanes, UI, Server)
    - `Transaction` - Complete undo/history system types
    - `MatchProgression` - Lookup table structure
  - **Supporting types**: MatchState, TournamentStatus, TransactionType, CompletionType, MatchSide
  - **Global variable documentation**: @global tags for tournament, players, matches, config
  - **MATCH_PROGRESSION constant**: Documented with @global, @constant, @type, @example tags
  - **Prioritized TODO list**: Documents which functions to annotate incrementally
  - **Files added**: `js/types.js`
  - **Files modified**: `tournament.html` (added types.js to script loading)

- **Added JSDoc annotations to Priority 1 core progression functions**
  - **advancePlayer()** - Parameters, return type, example with winner/loser flow
  - **completeMatch()** - All 5 parameters documented with types and defaults
  - **calculateAllRankings()** - Description of ranking logic by bracket size
  - **processAutoAdvancements()** - Walkover handling and rebuild protection notes
  - **generateCleanBracket()** - Validation rules, bracket sizing, usage example
  - **Files modified**: `js/clean-match-progression.js`

- **Added JSDoc annotations to Priority 2 tournament management functions**
  - **createTournament()** - Entry point for new tournaments, state initialization
  - **saveTournament()** - Debounced wrapper with UI updates
  - **saveTournamentOnly()** - Core save logic, config separation
  - **loadSpecificTournament()** - Entry point showing confirmation modal
  - **continueLoadProcess()** - Actual loading into global state
  - **exportTournament()** - Export format, history pruning, file download
  - **importTournament()** - File handling, JSON parsing, format support
  - **Updated types.js TODO**: Corrected function names to match actual implementation
  - **Files modified**: `js/tournament-management.js`, `js/types.js`

- **Added JSDoc annotations to Priority 3 player management functions**
  - **addPlayer()** - Creates player from form input, validation, auto-adds to Saved Players
  - **removePlayer()** - Removes player by ID, blocked during active tournament
  - **togglePaid()** - Toggles payment status, help hints for bracket readiness
  - **Updated types.js TODO**: Corrected function signatures to match actual implementation
  - **Files modified**: `js/player-management.js`, `js/types.js`

- **Added JSDoc annotations to Priority 4 match state functions**
  - **getMatchState()** - Returns match state (pending/ready/live/completed) for UI rendering
  - **showMatchCommandCenter()** - Opens modal with live and ready matches, referee suggestions
  - **populateRefereeSuggestions()** - Populates referee panel with losers, winners, recent assignments
  - **Updated types.js TODO**: Corrected Priority 5 function names to match actual implementation
  - **Files modified**: `js/bracket-rendering.js`, `js/types.js`

- **Added JSDoc annotations to Priority 5 history/undo system functions**
  - **isMatchUndoable()** - Checks if match can be safely undone without breaking integrity
  - **getConsequentialMatches()** - Finds all matches affected by undoing a transaction
  - **handleSurgicalUndo()** - Entry point showing confirmation modal with affected matches
  - **undoManualTransaction()** - Performs surgical undo by removing transaction and rebuilding
  - **rebuildBracketFromHistory()** - Rebuilds entire bracket state from transaction history
  - **Files modified**: `js/bracket-rendering.js`

- **Benefits**:
  - ✅ IDE autocomplete for all properties
  - ✅ Full hover documentation in VSCode for types and functions
  - ✅ Parameter descriptions visible on function calls
  - ✅ Return types and examples in tooltips
  - ✅ Types reference defined typedefs (e.g., `Player`, `CompletionType`)
  - ✅ Type checking and error detection
  - ✅ Self-documenting codebase
  - ✅ Easier onboarding for contributors

- **Motivation**: Implements Gemini code review suggestion to "make implicit contracts explicit"

- **Code Review Documentation**:
  - See `Docs/CodeReview/JSDOC-ANNOTATIONS-REVIEW.md` for JSDoc implementation analysis
  - See `Docs/CodeReview/SINGLE-SOURCE-OF-TRUTH.md` for architectural analysis
  - See `Docs/CodeReview/FUNCTION-REUSE-ANALYSIS.md` for reuse patterns and metrics
  - See `Docs/CodeReview/REVIEW-VERDICT.md` for overall code quality assessment

---

# 2025-11-17

## **v4.0.14** - Match Controls Configuration Display Fix

### Bug Fixes
- **Fixed tournament configuration display showing in active and completed tournament states**
  - **Issue**: Tournament configuration settings were visible in Match Controls during active and completed tournament states, not just setup mode
  - **Root cause**: The `updateTournamentConfigDisplay()` function was only called in the `'setup'` case but always set `display: 'block'`. Once shown, the configuration was never hidden when tournament status changed
  - **Fix**: Added explicit hide logic in both `'completed'` and `'active'` cases to ensure configuration display only appears during setup mode
  - **Behavior**:
    - **Setup mode**: Configuration display shows tournament settings (point values, match configuration, lanes)
    - **Active mode**: Configuration display hidden, referee suggestions shown
    - **Completed mode**: Configuration display hidden, tournament achievements shown
  - **Impact**:
    - ✅ Configuration settings only visible when relevant (setup mode)
    - ✅ Cleaner Match Controls interface during active tournaments
    - ✅ Consistent state-driven UI behavior across tournament lifecycle
  - **Files modified**: `js/bracket-rendering.js` (lines 3510-3511, 3520-3521)

---

## **v4.0.13** - Results Table Column Width Adjustments

### UI Improvements
- **Adjusted results table column widths to prevent text wrapping**
  - **Issue**: "Rank" column text was splitting over two lines, and "Legs Lost" column header had unwanted line breaks
  - **Changes**:
    - **Rank column**: Increased width from 5% to 9% (prevents "Rank" from wrapping)
    - **Player Name column**: Decreased width from 25% to 24% (compensate for rank increase)
    - **Points column**: Decreased width from 10% to 9% (balance layout)
  - **Impact**:
    - ✅ Cleaner table presentation with no text wrapping
    - ✅ Improved readability of leaderboard
    - ✅ Better column balance across different screen sizes
  - **Files modified**: `css/styles.css` (lines 2927, 2933, 2941)

---

## **v4.0.12** - Referee Conflict Indicator Fix & Tournament Configuration Display

### Features
- **Added tournament configuration display in Match Controls**
  - **Motivation**: Tournament operators frequently need to reference configuration settings during setup and active tournaments without navigating away from Match Controls
  - **Location**: Displays in main Match Controls panel below participant list during setup mode
  - **Layout**: 4-column grid layout for optimal space usage
    - **Column 1 (17%)**: Point Values - Participation and placement points (1st through 7th-8th)
    - **Column 2 (20%)**: Achievement Points - High Out, Short Leg, 180, Ton (no header for visual continuity)
    - **Column 3 (35%)**: Match Configuration - Regular Rounds, FS/BS Semifinals, BS Final, Grand Final
    - **Column 4 (23%)**: Lanes - Available range and excluded lanes
  - **Styling**: Matches existing Match Controls aesthetic with simple headers and gray text values
  - **Header**: "Tournament Configuration (Change in Global Settings Page)" - clearly indicates where to make changes
  - **Implementation**:
    - JavaScript function `updateTournamentConfigDisplay()` populates values from global `config` object
    - Called automatically when Match Controls opens in setup mode
    - Minimal CSS: Single `.config-display-grid` class with 4-column layout (17% 20% 35% 23%)
  - **Impact**:
    - ✅ Quick reference to all configuration settings without navigation
    - ✅ Helps operators verify settings before generating bracket
    - ✅ Reduces need to switch between Match Controls and Global Settings pages
    - ✅ Clean, non-intrusive display that matches existing UI patterns
  - **Files modified**:
    - `tournament.html` (lines 856-898): Configuration display HTML structure
    - `css/styles.css` (lines 1513-1519): 4-column grid CSS
    - `js/bracket-rendering.js` (lines 3502, 4209-4245): Population function and call in setup mode

### Bug Fixes
- **Fixed referee conflict indicator showing on completed matches**
  - **Issue**: Completed matches were displaying "⚠️ [Name] (Referee)" when players were refereeing other matches, causing visual clutter and confusion
  - **Problem**: The referee conflict warning is only relevant for matches that can be started (pending/ready/live). For completed matches, this information is unnecessary since:
    - The match is already finished and cannot be restarted
    - Conflict detection doesn't apply to past matches
    - It creates visual confusion when combined with the actual referee assignment (e.g., "Nick (Referee)" displayed alongside "Ref: Benedict")
  - **Solution**: Modified referee conflict indicator to only display when `matchState !== 'completed'`
  - **Behavior**:
    - **Completed matches**: Display clean player names without referee conflict indicators
    - **Pending/Ready/Live matches**: Continue to show "⚠️ [Name] (Referee)" warning when player is refereeing another match
  - **Impact**:
    - ✅ Cleaner visual presentation of completed matches
    - ✅ Eliminates confusing dual-referee display ("Nick (Referee)" + "Ref: Benedict")
    - ✅ Maintains important conflict warnings for active/future matches
    - ✅ Reduces visual noise in bracket view
  - **Files modified**: `js/bracket-rendering.js` (lines 1068-1075)

---

## **v4.0.11** - UI Typography & Demo Header Spacing

### UI Improvements
- **Updated page title/logo/header font from "Droid Serif" to "Insignia Regular"**
  - **Font choice**: Insignia Regular is the font used on Unicorn darts weight certificates
  - **Rationale**: Subtle darts-themed branding reference for the tournament management software
  - **Impact**:
    - ✅ Darts-specific typography adds thematic consistency
    - ✅ Maintains professional appearance
    - ✅ Easter egg for Unicorn darts users
  - **Files modified**: CSS font-family declarations for page headers

- **Improved demo mode header spacing**
  - **Change**: Added spacing and hyphen between descriptive text and "View on GitHub" link
  - **Impact**:
    - ✅ Better visual separation between information and action link
    - ✅ Improved readability
  - **Files modified**: `tournament.html` (demo banner section)

---

# 2025-11-04

## **v4.0.10** - Unpaid Players Validation

### Enhancements
- **Added validation to prevent bracket generation when unpaid players exist**
  - **Issue**: Operators could accidentally generate brackets with unpaid players still in the tournament, leading to confusion and manual workarounds with BYE slots
  - **Solution**: Added validation check that blocks bracket generation if any players have unpaid status
  - **Validation behavior**:
    - Runs before bracket generation, after tournament existence and duplicate bracket checks
    - Checks for any players with `paid: false` status
    - If unpaid players detected: Shows alert and blocks generation
    - If all players paid: Proceeds with normal bracket generation
  - **Alert message**: "All players must be marked as paid to generate bracket. Go to Player Registration to update payment status or remove players."
  - **Operator workflow**:
    1. Attempt to generate bracket with unpaid players
    2. Receive clear alert with guidance
    3. Navigate to Player Registration page
    4. Either mark players as paid or remove them from tournament
    5. Return to Setup and generate bracket successfully
  - **Impact**:
    - ✅ Prevents operator error: Forgetting to mark players as paid before draw
    - ✅ Eliminates need for manual BYE slot workarounds
    - ✅ Clear guidance: Directs operators to exact location to fix issue
    - ✅ Maintains data integrity: Bracket only generated when all players properly registered
    - ✅ Console logging: Error logged with unpaid player count for debugging
  - **Files modified**: `js/clean-match-progression.js` (lines 884-890)

---

# 2025-11-03

## **v4.0.9** - localStorage Storage Indicator & Demo Banner Update

### Features
- **Added visible localStorage storage utilization indicator**
  - **Storage link in Recent Tournaments header**: Right-aligned "Storage: X%" link with color-coded thresholds
  - **Color coding**:
    - Green (<75%): Healthy storage usage
    - Yellow (75-90%): Running low on space
    - Amber (>90%): Almost full, action needed
  - **Interactive modal with usage details**:
    - Horizontal progress bar matching color threshold
    - Current usage (X MB of Y MB available)
    - Status message (Good/Running low/Almost full)
    - Breakdown: Tournaments, Tournament History, Settings & Players
    - Non-technical instructions for freeing space (export then delete old tournaments)
    - Optional advanced section when history exceeds 1MB (suggests Developer Console cleanup)
  - **ESC key support**: Integrates with existing modal stack system
  - **Automatic updates**: Storage indicator refreshes after tournament save/delete/import and on page load
  - **Reuses existing code**: Leverages `getLocalStorageStats()` from analytics.js and modal stack system
  - **Impact**:
    - ✅ Prevents localStorage-full situations during tournaments
    - ✅ User-friendly visibility of storage usage (no need to open Developer Console)
    - ✅ Clear, non-technical guidance for operators
    - ✅ Proactive warning system before storage becomes critical
  - **Files modified**: `tournament.html` (line 106), `css/styles.css` (lines 3071-3262), `js/tournament-management.js` (lines 329-331, 823-826, 990-993, 1463-1669), `js/main.js` (lines 189-194)

### UI Improvements
- **Updated demo-mode header banner text**
  - **Previous text**: "Demo Site. Everything you do is stored locally in your browser. Your data never leaves your device."
  - **New text**: "Darts double elimination tournament software. Free, open-source, secure, offline first, self-hostable. 📍 Demo Site: Everything you do is stored locally in your browser. Your data never leaves your device."
  - **Rationale**: Provides more context about the software itself for first-time visitors to demo site
  - **Impact**:
    - ✅ More informative for new users discovering the project
    - ✅ Highlights key features (free, open-source, secure, offline-first, self-hostable)
    - ✅ Maintains privacy transparency with location pin emoji separator
  - **Files modified**: `tournament.html` (line 37)

---

# 2025-11-01

## **v4.0.8** - Docker Documentation & Match Controls Fix

### Docker Documentation
- **Updated all Docker documentation to prioritize Docker Hub over GHCR**
  - **DOCKER-QUICKSTART.md**: Changed primary registry from GHCR to Docker Hub in all examples and documentation
  - **docker/README.md**: Reordered "Publishing to Docker Registries" section to show Docker Hub first, updated "Using Published Image" section with Docker Hub as recommended option
  - **docker/docker-compose.yml**: Changed default image from `ghcr.io/skrodahl/newton:latest` to `skrodahl/newton:latest` with GHCR as commented alternative
  - **docker/docker-compose-demo.yml**: Updated image to `skrodahl/newton:latest` (also updated version from 3.0.5-beta to latest)
  - **Rationale**: Aligns documentation with actual user behavior (90+ Docker Hub pulls vs 8 GHCR pulls), provides simpler syntax, and matches user expectations
  - **Impact**:
    - ✅ Documentation now reflects real-world usage patterns
    - ✅ Cleaner syntax for users (`skrodahl/newton` vs `ghcr.io/skrodahl/newton`)
    - ✅ GHCR still documented as alternative for GitHub-native users
    - ✅ All docker-compose files use consistent registry by default
  - **Files modified**: `DOCKER-QUICKSTART.md`, `docker/README.md`, `docker/docker-compose.yml`, `docker/docker-compose-demo.yml`

### Bug Fixes
- **Fixed Match Controls match sorting to use numerical order instead of alphabetical**
  - **Issue**: Matches sorted alphabetically (FS-1-1, FS-1-10, FS-1-11, FS-1-15, FS-1-16, FS-1-2) instead of numerically
  - **Root cause**: `localeCompare()` string sorting on match IDs treated them as text
  - **Fix**: Parse match number from ID (third segment after second hyphen) and sort numerically
  - **Applies to**:
    - Ready matches grouped by round (Frontside and Backside)
    - LIVE matches when lanes are equal or both missing (fallback sort)
  - **Impact**:
    - ✅ Match Controls now displays matches in correct numerical order: FS-1-1, FS-1-2, FS-1-10, FS-1-11, FS-1-15, FS-1-16
    - ✅ Consistent sorting for both Frontside and Backside brackets
    - ✅ Lane-based sorting for LIVE matches still prioritized, numerical sort as tiebreaker
  - **Files modified**: `js/bracket-rendering.js` (lines 2730-2762)

---

# 2025-10-31

## **v4.0.7** - Documentation & Distribution Enhancements

### Documentation
- **Security headers documentation added to Docker deployment guides**
  - **DOCKER-QUICKSTART.md**: Added comprehensive "Security Headers" section with overview of all headers included by default (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP), A-grade security rating information, CSP configuration details, HSTS guidance for reverse proxies, and impact summary
  - **docker/README.md**: Added detailed "Security Headers" section with full explanation of each header, CSP rationale (why 'unsafe-inline' is required and acceptable), HSTS configuration examples for Nginx Proxy Manager and Caddy, testing instructions, and expected security rating results
  - **Docs/PRIVACY.md**: Added "Security Headers and Privacy" subsection under "Self-Hosting Considerations" explaining how security headers complement the privacy-by-architecture model, focusing on privacy-enhancing headers (Referrer-Policy, CSP, Permissions-Policy)
  - **Impact**:
    - ✅ Security features now prominently documented for self-hosters
    - ✅ Comprehensive technical explanation available for developers
    - ✅ Privacy documentation shows how headers enhance privacy guarantees
    - ✅ Clear guidance on HSTS configuration at reverse proxy level
    - ✅ Testing instructions for verifying A-grade security rating
  - **Context**: Security headers were implemented in v4.0.0 but not fully documented in Docker deployment guides
  - **Files modified**: `DOCKER-QUICKSTART.md`, `docker/README.md`, `Docs/PRIVACY.md`

### Distribution
- **Docker Hub publishing workflow added**
  - **New workflow**: `.github/workflows/docker-hub-publish.yml` - Separate GitHub Action workflow for publishing to Docker Hub
  - **Architecture**: Independent from existing GHCR workflow to avoid disrupting current publishing
  - **Features**:
    - Multi-architecture support (AMD64 + ARM64)
    - Triggered by version tags (v4.0.7, etc.) or manual dispatch
    - Uses GitHub secrets for authentication (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)
    - Automatic tagging: latest, semantic versions (major.minor.patch, major.minor, major)
    - GitHub Actions cache for faster builds
  - **Impact**:
    - ✅ Images now available on Docker Hub for better discoverability
    - ✅ No impact on existing GHCR publishing workflow
    - ✅ Both registries updated automatically on version tags
    - ✅ Self-hosters can choose preferred registry (Docker Hub or GHCR)
  - **Files added**: `.github/workflows/docker-hub-publish.yml`

---

# 2025-10-30

## **v4.0.6** - Dynamic Navigation Menu Enhancement

### Enhancements
- **Navigation menu underline now dynamically calculated**
  - **Previous implementation**: Hardcoded pixel values for menu underline position (41px, 87px, 91px, 49px) and manually calculated left positions based on cumulative widths + gaps
  - **Issue**: Fragile and required manual remeasurement whenever fonts, text, or styling changed
  - **New implementation**:
    - JavaScript automatically measures button dimensions and positions using `getBoundingClientRect()`
    - CSS custom properties (`--nav-underline-left`, `--nav-underline-width`, `--nav-underline-opacity`) control underline position
    - Updates on page load, page navigation, and window resize
  - **Impact**:
    - ✅ Maintenance-free - no more manual pixel measurements
    - ✅ Font-agnostic - adapts to any font family, size, or weight changes
    - ✅ Text-agnostic - menu items can be renamed without touching CSS
    - ✅ Layout-agnostic - adapts to gap, padding, or spacing adjustments
    - ✅ Responsive - automatically recalculates on window resize
  - **Code cleanup**: Removed 36 lines of hardcoded CSS positioning rules, replaced with 11 lines using CSS variables
  - **Files modified**: `css/styles.css`, `js/main.js`

- **Improved navigation menu clarity**
  - **Previous labels**: "Setup", "Registration", "Tournament", "Config"
  - **New labels**: "Tournament Setup", "Player Registration", "Tournament Bracket", "Global Settings"
  - **Impact**:
    - ✅ More descriptive and immediately understandable for new users
    - ✅ Reduces need for trial-and-error navigation
    - ✅ Professional and consistent naming pattern
    - ✅ Takes advantage of desktop screen space for clarity
  - **Files modified**: `tournament.html`

### Code Cleanup
- **Removed duplicate `showPage()` function**
  - **Issue**: Two identical `showPage()` function definitions existed in main.js (lines 292-307 and 391-434)
  - **Action**: Removed the simpler unused version, kept the full-featured version with help system integration, match controls, and navigation underline updates
  - **Impact**: Eliminated 15 lines of dead code
  - **Files modified**: `js/main.js`

### Documentation
- **PARKING-LOT.md now empty**
  - All known polish items and technical debt resolved
  - "Header Menu" dynamic underline rewrite completed and removed from backlog

## **v4.0.5** - UI Terminology Updates

### Enhancements
- **Renamed "Statistics" to "Leaderboard" throughout the application**
  - **Previous terminology**: Various UI elements referred to the player rankings table as "Statistics" or "Tournament Results"
  - **New terminology**: Unified naming to "Leaderboard" for clarity and consistency
  - **Changes made**:
    - Tournament page navigation button: "Statistics" → "Leaderboard"
    - Statistics modal heading: "Tournament Statistics" → "Leaderboard"
    - Registration page heading: "Tournament Results" → "Leaderboard"
    - Match Controls modal button: "Statistics" → "Leaderboard"
    - Help system updated with new terminology (2 references)
  - **Context preserved**: "Player Statistics" (individual player achievements editor) remains unchanged, as it feeds data into the Leaderboard
  - **Impact**:
    - ✅ Clearer user interface - "Leaderboard" immediately conveys competitive ranking
    - ✅ Consistent terminology across Tournament, Registration, Match Controls, and Help system
    - ✅ Distinguishes between individual player stats (achievements) and tournament rankings (leaderboard)
  - **Files modified**: `tournament.html`, `js/dynamic-help-system.js`

- **Renamed "Tournament" header to "Active Tournament"**
  - **Previous behavior**: Header showed "Tournament: My Tournament (2025-10-27)"
  - **New behavior**: Header shows "Active Tournament: My Tournament (2025-10-27)"
  - **Impact**: More descriptive label indicates the currently active/selected tournament
  - **Files modified**: `tournament.html`, `js/tournament-management.js`

- **Renamed "Match Results" to "Match History" on Setup page**
  - **Previous behavior**: Setup page showed "Match Results" heading for completed matches
  - **New behavior**: Shows "Match History: My Tournament (2025-10-27)" with dynamic tournament name
  - **Implementation**:
    - Heading now updates dynamically with active tournament name and date
    - Date portion uses normal font weight (not bold) for better visual hierarchy
    - Shows "Match History: None" when no tournament is active
  - **Impact**:
    - ✅ More descriptive label clarifies this is a historical log, not just results
    - ✅ Consistent with tournament context (shows which tournament's history)
  - **Files modified**: `tournament.html`, `js/main.js`, `js/dynamic-help-system.js`

- **Adjusted column header font size**
  - **Previous size**: 1rem
  - **New size**: 1.15rem
  - **Impact**: Improved readability and visual hierarchy for section headings
  - **Files modified**: `css/styles.css`

- **Unified "Saved Players" header structure with other column headers**
  - **Previous behavior**: "Saved Players" header used custom `.player-list-header` div with 16px font size, inconsistent with other column headers
  - **New behavior**: Uses standard `<h3>` element matching "Tournament Players", "Leaderboard", and "Match History" headers
  - **Implementation**:
    - Replaced custom `.player-list-header` div with standard `<h3>` element
    - "Saved Players" title now uses consistent 1.15rem font size
    - Right-aligned content (hint text + Import button) flows naturally using existing `justify-content: space-between` CSS
    - Button styling adjusted to maintain compact appearance (12px font, 28px height)
  - **Impact**:
    - ✅ Consistent visual hierarchy across all Registration page column headers
    - ✅ Simpler codebase - eliminates custom header structure
    - ✅ All headers now use same styling pattern
  - **Files modified**: `tournament.html`

---

## **v4.0.4** - Font System Improvements

### Enhancements
- **Unified font architecture with CSS variable control**
  - **Previous behavior**: Fonts were inconsistently applied across the application with hardcoded inline styles and varying system font fallbacks
  - **New implementation**:
    - Added `--font-body` CSS variable for centralized body text font control (currently set to Manrope)
    - Added `--font-clock` CSS variable for Match Controls clock font control (modern monospace: SF Mono/Cascadia Code)
    - Created `.match-controls-clock` CSS class to replace 150+ character inline style strings
  - **Font standardization**:
    - Bracket placement titles ("7th-8th Place", "FRONTSIDE", "BACKSIDE") → Inter font
    - Watermarks (left and center) → Inter font
    - Tournament header (bracket page title and date) → Inter font (changed from Arial in JavaScript)
    - Match Controls clock → SF Mono/Cascadia Code/Consolas (distinctive modern monospace, avoids console-style Courier New)
  - **Impact**:
    - ✅ Consistent cross-platform font rendering (Mac, Windows, Linux)
    - ✅ Single point of control: Change `--font-body` or `--font-clock` CSS variables to update fonts application-wide
    - ✅ Match Controls clock uses distinctive monospace (maintains consistent width while avoiding Courier's terminal aesthetic)
    - ✅ Clean code: CSS classes replace inline style strings in JavaScript
    - ✅ CAD watermark preserves technical monospace aesthetic (Courier/Monaco) for engineering/technical appearance
  - **Files modified**: `css/styles.css`, `js/bracket-lines.js`, `js/bracket-rendering.js`

---

## **v4.0.3** - Developer Console Enhancement

### Enhancement
- **Developer Console: Show placement ranks in "View Match Progression"**
  - **Previous behavior**: When viewing match progression in Developer Console, eliminated players showed only "→ TO: ❌" with no placement information
  - **New behavior**: Now shows placement rank alongside elimination icon (e.g., "→ TO: ❌ 3rd" for BS-FINAL loser, "→ TO: ❌ 5th-6th" for BS-2 losers)
  - **Implementation**:
    - Reuses existing `getEliminationRankForMatch()` function from `main.js` (hardcoded rank mappings for 8/16/32 player brackets)
    - Reuses existing `formatRanking()` function from `results-config.js` (formats ranks as "3rd", "5th-6th", "13th-16th", etc.)
    - Added defensive programming with function availability checks
    - Zero code duplication - leverages same rank display logic used in Winner Confirmation modal, Match Controls, and Match History
  - **Impact**:
    - ✅ Developer Console now shows consistent placement information with rest of UI
    - ✅ Makes "View Match Progression" more informative for tournament analysis
    - ✅ Displays exact elimination rank for all backside bracket matches
    - ✅ Single source of truth for all placement displays across application
  - **Files modified**: `js/analytics.js`

---

## **v4.0.2** - Referee Conflict Detection and Pre-v4.0 Import Optimization

### Bug Fixes
- **Fixed referee conflict detection bypass in Tournament Bracket**
  - **Previous behavior**: Match Controls prevented starting matches when players were refereeing other matches, showing "⚠️ [Name] (Referee)" warnings and disabling Start buttons
  - **Issue discovered**: Tournament Bracket view had no referee conflict validation - matches could be started directly from bracket, bypassing the conflict check
  - **Root cause**: Match Controls had its own duplicate conflict detection logic, while bracket rendering had none
  - **Solution implemented**:
    - Created shared `checkRefereeConflict()` utility function in `bracket-rendering.js`
    - Created `toggleActiveWithValidation()` wrapper in `clean-match-progression.js` that validates before starting matches
    - Updated bracket rendering to show visual warnings ("⚠️ [Name] (Referee)") and disable Start buttons when conflicts exist
    - Replaced duplicate conflict detection in Match Controls with shared utility function
    - Updated match state notification box to show "Blocked: [Name] refereeing" instead of "Ready to Start"
  - **Impact**:
    - ✅ Both Tournament Bracket and Match Controls now use identical referee conflict validation
    - ✅ Eliminates code duplication and maintains single source of truth
    - ✅ Prevents tournament state corruption from simultaneous player participation and refereeing
    - ✅ Consistent user experience across all views
  - **Implementation details**:
    - Base `toggleActive()` function preserved for backward compatibility (Developer Console, programmatic operations)
    - Follows existing pattern: base function + validation wrapper (similar to `updateMatchLane` / `updateMatchLaneWithValidation`)
    - Visual conflict indicators update on bracket re-render
  - **Files modified**: `js/bracket-rendering.js`, `js/clean-match-progression.js`

### Performance Improvements
- **Optimized pre-v4.0 tournament import to prevent localStorage bloat**
  - **Issue discovered**: Pre-v4.0 exports contain snapshot-based transaction history where each transaction includes a full copy of the entire tournament state in `beforeState`. A typical 32-player tournament had 178 transactions totaling 8.56 MB of redundant data.
  - **Root cause**: Pre-v4.0 used snapshot-based undo system (save full state before each action). v4.0 switched to replay-based undo (save only changes, reconstruct state by replaying). The formats are incompatible - v4.0 cannot use pre-v4.0 snapshots for undo operations.
  - **Problem**: Importing pre-v4.0 history consumed massive localStorage space (8+ MB per tournament) and provided no functionality since v4.0 undo system cannot use the snapshots.
  - **Solution implemented**:
    - Modified import logic to detect old format exports
    - Skip importing transaction history for pre-v4.0 formats
    - Continue importing all tournament data (players, matches, bracket, placements, results)
    - Log clear message: "⚠ Skipped importing X pre-v4.0 history entries (incompatible snapshot format, ~Y MB)"
  - **Impact**:
    - ✅ Prevents localStorage bloat (saves 8-10 MB per pre-v4.0 tournament import)
    - ✅ Eliminates risk of hitting browser localStorage quota limits
    - ✅ Tournament data (players, matches, results, placements) still imports correctly
    - ✅ Faster imports (no need to parse/store massive history)
    - ✅ Existing "Pre-v4.0 format: Undo not available" warning remains accurate
    - ✅ v4.0+ tournament imports continue to work normally with full undo functionality
  - **Technical details**:
    - Pre-v4.0 snapshot format: Each transaction stored entire tournament state (~50 KB each)
    - v4.0 replay format: Each transaction stores only changes (~200 bytes each)
    - Size reduction: 98.8% less localStorage usage for imported pre-v4.0 tournaments
    - The incompatible snapshot data was being imported but never used by v4.0 undo system
  - **Files modified**: `js/tournament-management.js`
  - **Related**: Resolved PARKING-LOT item "Check if pre-v4.0 transaction log can be imported" - determined that pre-v4.0 history exists but is incompatible with v4.0 undo system and should be skipped

# 2025-10-27

## **v4.0.1** - Code Cleanup and Documentation Updates

### Code Cleanup
- **Removed unused history-management.js**
  - **Previous state**: Legacy snapshot-based undo system file remained in codebase
  - **Issue**: File was not loaded in tournament.html and functions were never called
  - **Action taken**: Deleted from codebase
  - **Impact**:
    - ✅ Cleaner codebase with only actively used files
    - ✅ No functionality affected (file was already unused)
    - ✅ Completes migration to transaction-based history system introduced in v4.0.0
  - **Context**: v4.0.0 introduced per-tournament transaction-based history in `clean-match-progression.js`, making the old snapshot-based system in `history-management.js` obsolete
  - **Files removed**: `js/history-management.js`

### Documentation Updates
- **Overhauled IMPORT_EXPORT.md to match current reality**
  - **Export Schema Section**:
    - Fixed `shortLegs` type documentation: Changed from `number` to `array of integers`
    - Updated all example IDs and timestamps to match real export data
    - Added inline comments explaining each field type
    - Fixed `status` field to show all three states: `"setup|active|completed"`
  - **New Detailed Sections Added**:
    - `playerList` field format: Documented as simple array of strings (not player objects)
    - `placements` field format: Documented key-value structure (playerID → rank)
    - Player Object Structure: Complete schema with all fields and types
    - Match Object Structure: Added ALL missing fields (`numericId`, `positionInRound`, `autoAdvanced`, `completedAt`, `finalScore`)
    - Walkover player structure: Documented `isBye` flag and ID format
    - TBD player structure: Documented incomplete bracket placeholder format
  - **Transaction History Complete Rewrite**:
    - Replaced misleading simplified examples with actual transaction structures
    - Documented all 5 transaction types: `COMPLETE_MATCH`, `START_MATCH`, `STOP_MATCH`, `ASSIGN_LANE`, `ASSIGN_REFEREE`
    - Documented transaction ID format: `tx_{timestamp}`
    - Documented `completionType`: `MANUAL` vs `AUTO`
    - Showed that `COMPLETE_MATCH` transactions contain full player objects (not just IDs)
  - **Critical Clarification: Stats in Match Objects**:
    - **Added important note**: Stats embedded in match objects are historical snapshots only
    - **Single source of truth**: Global `players` array is ONLY source for Statistics table and points
    - **Never used for calculations**: Match/transaction stats are for audit trail and history keeping
    - **Architecture benefit**: Stat corrections immediately affect results without recalculating historical data
    - **Impact**: Prevents confusion about which stats data is authoritative
  - **Import/Export Function Updates**:
    - Updated `validateTournamentData` to match actual implementation
    - Fixed variable naming: `isPreV4` → `isOldFormat`
    - Updated `continueImportProcess` to match actual code flow
    - Updated all console output examples to match reality
  - **Overall Impact**:
    - ✅ Documentation now 100% accurate to v4.0 implementation
    - ✅ All code examples match actual codebase
    - ✅ Developers can trust documentation as authoritative reference
    - ✅ Clear explanation of stats architecture prevents data corruption

- **Updated Docker documentation with nginx logs information**
  - **DOCKER-QUICKSTART.md**:
    - Added "Nginx Logs (Optional)" subsection in Persistent Data section
    - Documented how to persist nginx access and error logs
    - Added viewing commands (`tail -f logs/access.log`)
    - Updated all docker-compose.yml examples (Reverse Proxy, Absolute Paths)
    - Explained use cases: troubleshooting, monitoring, security auditing, performance analysis
  - **docker/README.md**:
    - Added nginx logs section to Persistent Storage
    - Updated both Docker CLI examples (build and published image)
  - **docker/docker-compose.yml**:
    - Added commented-out logs volume mount for easy enablement
    - Updated both production and developer build sections
  - **Log Location**: `/var/log/nginx` inside container
  - **Log Files**: `access.log` (HTTP requests), `error.log` (nginx errors/warnings)
  - **Impact**:
    - ✅ Users can now easily persist nginx logs for troubleshooting
    - ✅ All documentation consistently shows logs volume mount
    - ✅ Simple uncomment to enable in docker-compose.yml

---

# 2025-10-23

## **v4.0.0** - Per-Tournament History Architecture

### Backwards Compatibility with Pre-v4.0 Exports

**Old tournament exports are supported with limited functionality.**

- **What works**: Pre-v4.0 tournament exports can be imported successfully
- **Import process**: Shows a warning modal explaining limitations before import
- **Full functionality**: All tournament features work normally (players, matches, bracket, placements, results)
- **Limitation**: Undo history is not available for imported old tournaments (new matches will generate history normally)
- **User experience**: Import confirmation modal clearly indicates whether full undo functionality is available
- **Going forward**: All v4.0+ exports include full undo functionality and version validation

### New: Per-Tournament History Storage
- **Implemented isolated transaction history for each tournament**
  - **Previous behavior**: Global `tournamentHistory` accumulated transactions from all tournaments, causing exports to bloat to 9.9MB with contaminated multi-tournament data
  - **New behavior**: Each tournament stores its own history in `tournament_${id}_history` localStorage key
  - **Benefits**:
    - ✅ Clean exports (~110KB vs 9.9MB for 32-player tournaments)
    - ✅ No cross-contamination between tournaments
    - ✅ History exports with tournament data
    - ✅ History deleted when tournament deleted
    - ✅ Complete data portability with undo functionality preserved
  - **Implementation**:
    - Updated `saveTransaction()`, `getTournamentHistory()`, `clearTournamentHistory()` in `clean-match-progression.js`
    - Updated undo/redo functions in `bracket-rendering.js`
    - Updated smart pruning in `analytics.js`
    - Updated reset tournament in `tournament-management.js`
  - **Files updated**:
    - `js/clean-match-progression.js` - Per-tournament history functions
    - `js/bracket-rendering.js` - Undo/redo system references
    - `js/analytics.js` - Smart pruning
    - `js/tournament-management.js` - Reset tournament, import/export

### New: Export Format v4.0
- **Versioned export format with validation**
  - **New field**: `exportVersion: "4.0"` in all exports
  - **Includes**: Per-tournament history, playerList snapshot, complete tournament data
  - **Structure**: Tournament data + isolated history + saved players
  - **File naming**: `{TournamentName}_{YYYY-MM-DD}.json`
  - **Console logging**: Shows transaction count on export
  - **Pristine history exports**: Complete, unpruned transaction history
    - **Previous behavior (pre-v4.0)**: Exports pruned redundant transactions (START_MATCH, STOP_MATCH after completion, kept only last ASSIGN_LANE/ASSIGN_REFEREE)
    - **New behavior**: All transactions preserved exactly as they occurred
    - **Why the change**: Per-tournament isolation makes history small enough (~110KB for 32-player tournament) that pruning is unnecessary
    - **Benefit**: Complete audit trail of all tournament actions, better debugging and verification
  - **Impact**:
    - ✅ Version validation on import
    - ✅ Complete tournament portability
    - ✅ History restoration works seamlessly
    - ✅ Undo functionality preserved after import
    - ✅ Full transaction audit trail without pruning

### New: Import Confirmation and Validation System
- **Import confirmation modal for all imports**
  - **Consistent UX**: Both "Shared Tournaments" and "Import Tournament" show confirmation modal before importing
  - **Version detection**: Automatically detects old format (pre-v4.0) vs new format exports
  - **Old format warning**: Yellow warning box explains undo history will not be available
  - **New format confirmation**: Green indicators show full functionality including undo history
  - **User choice**: Users can cancel or proceed with import after seeing details
  - **History restoration**: v4.0+ imports restore per-tournament history to correct key
  - **PlayerList restoration**: Imports restore saved players snapshot
  - **ID preservation**: Tournament IDs preserved on import for idempotent imports
  - **Impact**:
    - ✅ All imports show confirmation before proceeding
    - ✅ Clear warnings for old format limitations
    - ✅ Complete history restoration for v4.0+ exports
    - ✅ Backwards compatible with pre-v4.0 exports

### Enhanced: Developer Console Storage Display
- **Granular localStorage usage breakdown**
  - **Current Tournament** detailed view:
    - Tournament data breakdown: players array, matches array, bracket structure, placements, metadata (with sizes and counts)
    - Transaction history details: total count, average size, oldest/newest timestamps
    - Total size and percentage of overall storage
    - Smart pruning suggestions for optimization
  - **Other Tournaments** summary:
    - Shows tournament names (not IDs) for easy identification
    - Combined data + history size per tournament
    - Total storage for all inactive tournaments
  - **Global Storage** section:
    - Human-readable names (Tournament registry, Config, Saved Players)
    - Individual sizes for each global key
  - **Cleanup Opportunities**:
    - Detects orphaned keys (old global `tournamentHistory`)
    - Shows size and suggests safe deletion
  - **High Storage Warning**:
    - Alert when usage >= 80%
    - Suggests deleting older tournaments with export reminder
  - **Impact**:
    - ✅ Complete visibility into storage usage patterns
    - ✅ Easy identification of storage optimization opportunities
    - ✅ Tournament names instead of IDs for better UX
    - ✅ Actionable insights for storage management

### Documentation
- **New comprehensive import/export documentation**
  - Created `Docs/IMPORT_EXPORT.md` with complete specification
  - Covers export format v4.0 schema, localStorage architecture, validation, error handling
  - Includes testing procedures and troubleshooting guide
  - Documents transaction history system and undo integration

### Fixed: Font and Logo Loading Paths
- **Corrected asset paths to work in both file:// and web server contexts**
  - **Previous behavior**: Asset paths were simple relative (`url('fonts/...')`, `img.src = 'logo.png'`)
  - **Issue**:
    - CSS in `/css/styles.css` using `url('fonts/...')` looked for fonts in `/css/fonts/` instead of `/fonts/`
    - This caused fonts to fail loading on web servers (Docker, demo site)
    - Original paths worked for `file://` protocol but failed for `http://` protocol
    - **Font files in repository were HTML documents**, not actual TrueType fonts (GitHub download page HTML instead of raw files)
  - **Solution**: Use context-appropriate relative paths and replace font files
    - **CSS fonts**: Changed to `url('../fonts/...')` - goes up one directory from `/css/` to root, then into `/fonts/`
    - **JavaScript logo**: Kept simple relative path `logo.png` - resolved relative to HTML page location (works for both protocols)
    - **Font files**: Replaced HTML documents with actual DroidSerif TrueType font files
  - **Impact**:
    - ✅ Droid Serif fonts load correctly in Docker/web deployments
    - ✅ Club logo loads correctly in Docker/web deployments
    - ✅ Fonts and logo work when opening `tournament.html` directly (file:// protocol)
    - ✅ Preserves core "double-click to open" feature
    - ✅ Page load time significantly improved (no timeout delays)
    - ✅ No more "OTS parsing error" for fonts
- **Files updated**:
  - `css/styles.css` - Updated `@font-face` to use `../fonts/` relative paths
  - `js/main.js` - Logo loading uses simple relative path (context-aware)
  - `fonts/DroidSerif-Regular.ttf` - Replaced HTML file with actual TrueType font
  - `fonts/DroidSerif-Bold.ttf` - Replaced HTML file with actual TrueType font

### Fixed: Analytics Modal Crash
- **Fixed property name mismatch in referee conflict display**
  - **Issue**: `showQuickOverview()` tried to access `refereeValidation.conflicts.length`, but `validateRefereeAssignments()` returns `details` property, not `conflicts`
  - **Error**: `Cannot read properties of undefined (reading 'length')` when opening Analytics modal
  - **Fix**: Changed line 540 to use `refereeValidation.details.length` to match actual return value
  - **Impact**: Analytics modal now opens without errors and correctly displays referee conflict count
- **Files updated**:
  - `js/analytics.js` - Fixed property reference in Quick Overview section

### Fixed: Referee Conflict Detection Logic
- **Corrected referee conflict validation to only detect actual error states**
  - **Previous behavior**: Flagged players refereeing a match AND being a participant in another READY match as a tournament error state
  - **Issue**: This is not a tournament error state, causing false positives in Developer Console
  - **Actual error state**: One person assigned as referee to multiple active matches (regardless of state: PENDING, READY, or LIVE)
  - **Solution**: Changed validation to check for duplicate referee assignments across all active matches
    - Removed check for "referee is player in same match" (allowed, not an error)
    - Added check for "referee assigned to multiple active matches" (PENDING, READY, or LIVE)
    - Completed matches are excluded (referees can be assigned to new matches after completing previous ones)
  - **Impact**:
    - ✅ Developer Console "Referee conflicts" now only shows genuine errors
    - ✅ No false positives for normal tournament operations
    - ✅ Player refereeing own match no longer flagged (allowed by design)
    - ✅ Player busy refereeing while their match is READY handled as operational constraint (not error)
    - ✅ Prevents assigning same referee to multiple active matches (error state)
    - ✅ Cleaner, more accurate analytics for tournament organizers
- **Files updated**:
  - `js/analytics.js` - Updated referee conflict detection logic

### Fixed: Referee Conflict False Positives for Completed Matches
- **Fixed validation incorrectly checking completed matches for referee conflicts**
  - **Issue**: Validation was checking `match.state !== 'completed'` but matches don't have a `.state` property
  - **Root cause**: Match state is calculated dynamically by `getMatchState()` function, not stored on match object
  - **Symptom**: Completed matches with assigned referees were flagged as conflicts because `undefined !== 'completed'` evaluated to `true`
  - **Solution**: Changed validation to check `!match.completed` instead of `match.state !== 'completed'`
  - **Impact**:
    - ✅ Completed matches no longer flagged as having referee conflicts
    - ✅ Validation correctly ignores matches with `referee: null` or `referee: undefined`
    - ✅ Validation correctly ignores matches with referee set to empty string (dropdown "None" selection)
    - ✅ Only active matches (PENDING, READY, LIVE) are checked for duplicate referee assignments
    - ✅ Works correctly for both new v4.0 tournaments and imported pre-v4.0 tournaments
- **Files updated**:
  - `js/analytics.js` - Updated `validateRefereeAssignments()` function (lines 1757-1772)

### Enhanced: Match Elimination Displays Final Placement
- **Winner confirmation modal now shows eliminated player's final placement rank**
  - **Previous behavior**: Modal showed "• Player is eliminated" for all backside bracket eliminations
  - **New behavior**: Modal shows "• Player is placed 13th-16th" (or appropriate rank) when eliminated from backside bracket
  - **How it works**: Uses hardcoded elimination rank mappings based on which backside match the player loses
  - **Examples**:
    - BS-3-4 loser (32-player): "• Chris is placed 13th-16th"
    - BS-7-1 loser (32-player): "• Player is placed 4th"
    - BS-FINAL loser: "• Player is placed 3rd"
    - GRAND-FINAL loser: "• Player is placed 2nd"
  - **Dependency**: Relies on `tournament.bracketSize` being correct (set at bracket creation, persisted everywhere)
  - **Fallback**: Shows "is eliminated" if rank lookup fails for any reason
  - **Impact**:
    - ✅ Players immediately know their final placement when eliminated
    - ✅ More informative and satisfying UX
    - ✅ Uses existing hardcoded rank mappings (same as Results Table calculations)
    - ✅ Works for all bracket sizes (8, 16, 32 players)
- **Files updated**:
  - `js/clean-match-progression.js` - Updated winner confirmation progression display (lines 1509-1523)

### Enhanced: Backside Final Placement Consistency
- **BS-FINAL loser now gets 3rd place set immediately, consistent with all other backside matches**
  - **Previous behavior**: BS-FINAL loser didn't get placement set until Grand Final completed
  - **Inconsistency**: All other backside matches (BS-1-1 through BS-7-1) set placement immediately, but BS-FINAL didn't
  - **User impact**: 3rd place didn't appear in Results Table until tournament was fully complete
  - **Solution**: Added BS-FINAL completion hook to set 3rd place immediately when match completes
  - **Safety**: Placement is cleared and recalculated when Grand Final completes (atomic recalculation preserved)
  - **Undo safety**: All placements cleared and recalculated on any match undo (existing safeguard)
  - **Impact**:
    - ✅ Consistent UX across all backside bracket matches
    - ✅ 3rd place shows in Results Table immediately after BS-FINAL completes
    - ✅ Confirmation modal shows "• Player is placed 3rd" instead of "• Player is eliminated"
    - ✅ Makes placement system more predictable and understandable
    - ✅ No risk - existing Grand Final and undo operations already clear/recalculate all placements
- **Files updated**:
  - `js/clean-match-progression.js` - Added BS-FINAL completion hook (lines 332-353)
  - `js/bracket-rendering.js` - Added 3rd place restoration after undo operations (lines 2306-2314)

### Enhanced: Security Headers
- **Docker image now includes comprehensive security headers by default**
  - **Previous behavior**: No security headers configured in nginx, PHP version exposed in X-Powered-By header
  - **New behavior**: Six security headers configured for defense-in-depth protection, server version information hidden
  - **Headers included**:
    - **X-Frame-Options: SAMEORIGIN** - Prevents clickjacking attacks
    - **X-Content-Type-Options: nosniff** - Prevents MIME-type sniffing attacks
    - **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information leakage
    - **Permissions-Policy** - Disables unused browser features (geolocation, microphone, camera, payment, USB, magnetometer, gyroscope, accelerometer)
    - **Content-Security-Policy (CSP)** - Prevents loading external scripts/styles/resources
    - **Server tokens hidden** - `server_tokens off` hides nginx version from attackers
    - **PHP version hidden** - `expose_php = Off` removes X-Powered-By header that reveals PHP version
  - **CSP 'unsafe-inline' requirement**:
    - CSP includes `'unsafe-inline'` for script-src and style-src
    - Required due to 68+ inline event handlers (`onclick`, `onchange`) and 217+ inline styles in tournament.html
    - This is an architectural requirement, not an oversight
    - CSP still prevents loading external scripts/styles/resources (primary XSS vector)
    - NewTon has no user-generated content or XSS attack vectors
    - Security rating: A grade on securityheaders.com (with informational warning about 'unsafe-inline')
  - **HSTS not included**:
    - Strict-Transport-Security should be added at reverse proxy level (user choice)
    - Allows flexibility for HTTP-only local deployments
    - Self-hosters can enable HSTS in their reverse proxy (NPM, Caddy, Traefik)
  - **Impact**:
    - ✅ Defense-in-depth security by default
    - ✅ Protects against clickjacking, MIME-sniffing, external resource loading
    - ✅ Hides nginx and PHP version information from attackers
    - ✅ A-grade security headers rating
    - ✅ No breaking changes - headers are additive only
    - ✅ Maintains compatibility with both HTTP and HTTPS deployments
- **Files updated**:
  - `docker/nginx.conf` - Added security headers configuration
  - `docker/php.ini` - Added `expose_php = Off` to hide PHP version

### Enhanced: Docker Image Mount Structure
- **Moved logo and payment images to dedicated images/ folder**
  - **Previous behavior**: Individual file mounts (`./logo.png:/var/www/html/logo.png`, `./payment.png:/var/www/html/payment.png`)
  - **Previous bug**: If files don't exist, Docker creates directories instead, causing 10-second browser hang when loading
  - **New behavior**: Single folder mount (`./images:/var/www/html/images:ro`)
  - **Benefits**:
    - ✅ No directory creation bug - missing images result in fast 404 instead of hang
    - ✅ Default images included (logo.jpg and payment.png with GitHub QR code)
    - ✅ Cleaner Docker Compose configuration (single mount instead of two)
    - ✅ Easy customization - drop files in images/ folder
    - ✅ Files go in correct location when copied
  - **Default images**:
    - `images/logo.jpg` - Default club logo
    - `images/payment.png` - GitHub project QR code
  - **Impact**:
    - ✅ Professional out-of-box experience with working defaults
    - ✅ No confusing slow loads or missing images for new users
    - ✅ Simple customization workflow
- **Files updated**:
  - `tournament.html` - Updated favicon and payment image paths to use images/ prefix
  - `js/main.js` - Updated logo loading logic to use images/ prefix
  - `docker/docker-compose.yml` - Changed from individual file mounts to folder mount
  - `docker/docker-compose-demo.yml` - Changed from individual file mounts to folder mount
  - `DOCKER-QUICKSTART.md` - Updated documentation for images/ folder structure
  - `docker/README.md` - Updated documentation and examples
  - `js/dynamic-help-system.js` - Updated help text for Config and Registration pages

### Fixed: Tournament Deletion Not Freeing Storage
- **Critical bug fix: Tournament deletion now properly removes per-tournament history**
  - **Bug**: Deleting tournaments only removed them from registry, leaving orphaned history keys in localStorage
  - **Impact**: Deleting a 32-player tournament left 4.3 MB orphaned data, defeating v4.0.0's storage isolation goals
  - **Root cause**: `confirmDeleteTournament()` didn't clean up `tournament_${id}_history` keys
  - **Fix**: Added `localStorage.removeItem(tournament_${tournamentId}_history)` to delete function
  - **Testing**: Verified with Developer Console that history keys are now properly removed
  - **Critical for v4.0.0**: Without this fix, "deletions actually delete" promise would be false
- **Files updated**:
  - `js/tournament-management.js` - Added per-tournament history cleanup to confirmDeleteTournament() (lines 812-814)

### Enhanced: Developer Console Orphaned Data Detection
- **Added detection and cleanup guidance for orphaned tournament data in localStorage**
  - **Purpose**: Identify and clean up leftover data from tournaments deleted with old buggy delete function (before above fix)
  - **What it detects**:
    - Orphaned `tournament_${id}_history` keys not in registry
    - Orphaned `tournament_${id}` keys not in registry
    - Old `tournamentHistory` key (pre-v4.0 global history)
  - **How it works**:
    - Compares all tournament-related localStorage keys against the tournament registry
    - Shows orphaned data in "⚠️ Orphaned Data (Not in Registry)" section
    - Provides exact `localStorage.removeItem()` commands for manual deletion
    - Labels each orphan type (Orphaned history, Orphaned tournament data, Old global history)
  - **Design decisions**:
    - Detection only, no delete buttons - surgical manual cleanup prevents accidental data loss
    - Shows sizes (MB/KB) to help users understand storage impact
    - Clear messaging: "To delete a tournament properly, use the Setup page"
    - Doesn't flag random localStorage keys, only tournament naming patterns
  - **User experience**:
    - F12 → Click version number → Click "localStorage Usage"
    - See orphaned data (if any) with exact removal commands
    - Copy/paste commands into console for surgical cleanup
    - Refresh view to verify deletion and see freed storage
  - **Testing**: Verified detection accuracy with orphaned history from old bug, false-positive resistance with random localStorage keys
- **Files updated**:
  - `js/analytics.js` - Added orphaned data detection logic (lines 1134-1167) and display section (lines 1339-1383)

### Enhanced: Developer Console Transaction History Display Order
- **Reversed display order to show newest transactions first**
  - **Previous behavior**: Transaction history displayed chronologically (#1 at top, newest at bottom)
  - **New behavior**: Reversed display order with newest transactions at top, oldest at bottom
  - **Transaction numbering**: Original indices preserved (#1 is still the first/oldest transaction, displayed at bottom)
  - **Rationale**: Most recent transactions are most important for diagnostics and verification
  - **Impact**: No scrolling required to see latest tournament actions, better UX for monitoring live tournaments
- **Files updated**:
  - `js/analytics.js` - Reversed display order in `showTransactionHistory()` function (lines 759-765)

### Fixed: Results Table Empty Value Display Consistency
- **Fixed inconsistent display of empty achievement values in Results table**
  - **Bug**: Short Legs column showed blank for empty arrays instead of `—` dash
  - **Previous behavior**: High Outs showed `—` for empty, Short Legs showed blank
  - **New behavior**: Both Short Legs and High Outs show `—` when empty
  - **Design rationale**:
    - Short Legs and High Outs display **actual values** (leg numbers, checkout amounts) → use `—` for empty
    - 180s, Tons, Legs Won, Legs Lost display **counts** → use `0` for empty
  - **Impact**: Consistent visual presentation, clearer distinction between "no data" and "zero count"
- **Files updated**:
  - `js/results-config.js` - Added length check for shortLegs and highOuts arrays (lines 547-548)

### Fixed: Developer Console Toggle Read-Only Not Updating Bracket Display
- **Fixed bracket display not updating when toggling read-only status**
  - **Bug**: Toggling read-only OFF on imported tournaments updated data but not visual display
  - **Previous behavior**:
    - Imported completed tournaments showed checkmarks (✓) on completed matches
    - After toggling read-only OFF, checkmarks remained - clicking did nothing
    - Required manual "Re-render Bracket" command to update icons
  - **New behavior**: Toggling read-only automatically re-renders bracket with correct icons
  - **Impact**:
    - Imported tournaments now behave identically to non-imported tournaments
    - Completed matches show undo icon (↻) immediately after toggling read-only OFF
    - Clicking matches works correctly - triggers undo confirmation dialog
    - Seamless UX for the "backdoor" feature (fixing errors in completed tournaments)
  - **Use case**: Toggle read-only is designed as a backdoor to fix errors in completed tournaments - now works as intended
- **Files updated**:
  - `js/analytics.js` - Added `renderBracket()` call to `commandToggleReadOnly()` function (lines 2569-2572)

### Fixed: Developer Console Transaction History Filter Renumbering
- **Fixed transaction numbers being renumbered when filtering history**
  - **Bug**: Filtering transaction history renumbered results instead of preserving original transaction numbers
  - **Previous behavior**:
    - Full history: #8, #7, #6, #5, #4, #3, #2, #1
    - Filter for FS-1-2 (3 results): #3, #2, #1 (renumbered based on filtered count)
  - **New behavior**: Original transaction numbers preserved when filtering
    - Full history: #8, #7, #6, #5, #4, #3, #2, #1
    - Filter for FS-1-2 (3 results): #7, #6, #5 (original numbers preserved)
  - **Impact**:
    - Transaction numbers serve as true identifiers regardless of filtering
    - Easy to cross-reference with console logs and debugging output
    - Maintains chronological context when viewing filtered results
    - Fulfills the intention of transaction log as audit trail
- **Files updated**:
  - `js/analytics.js` - Added `originalNumber` property preservation in `showTransactionHistory()` function (lines 713-718, 766-771)

---

## **v3.0.5-beta** - Independent Tournament List Controls

### Enhanced: Tournament List UX
- **Independent "Show All" toggle buttons for Shared and Local tournament sections**
  - **Previous behavior**: Single external "Show All" button controlled only local tournaments, shared tournaments showed all items (no pagination)
  - **New behavior**: Each section (Shared Tournaments and My Tournaments) has its own inline toggle button
  - **Benefits**:
    - **Consistent UX**: Both sections limited to 5 items by default with independent expansion
    - **Better scrolling**: When server has 20+ shared tournaments, users don't have to scroll excessively to reach local tournaments
    - **Visual clarity**: Toggle buttons inline with section headers make control more intuitive
    - **Always visible header**: "My Tournaments" header now always appears when local tournaments exist (previously only showed when shared tournaments were present)
  - **Implementation**:
    - Two new state variables: `showingAllSharedTournaments` and `showingAllLocalTournaments`
    - Two new toggle functions: `toggleSharedTournamentView()` and `toggleLocalTournamentView()`
    - Shared tournaments now limited to 5 by default (previously showed all)
    - Toggle buttons only appear when section has >5 items
    - Removed standalone `toggleTournamentsBtn` from tournament.html
  - **Files updated**:
    - `js/tournament-management.js` - Independent state management and toggle logic
    - `tournament.html` - Removed external toggle button (now inline with headers)
- **User impact**: Cleaner, more consistent UI that scales better with large numbers of shared tournaments

---

# 2025-10-22

## **v3.0.4** - Environment Variables & Port 2020 ("Double 20" 🎯)

### New: Environment Variable Configuration
- **Flexible Docker configuration via environment variables**
  - **`NEWTON_API_ENABLED`** (default: `true`) - Enable/disable REST API endpoints
    - Set to `false` to disable upload/download/delete endpoints (returns HTTP 403)
    - Use case: Demo sites, security-conscious deployments, read-only mode
  - **`NEWTON_DEMO_MODE`** (default: `false`) - Show demo privacy banner
    - Displays banner: "Demo Site. Everything you do is stored locally in your browser. Your data never leaves your device."
    - Use case: Public demo sites (like https://darts.skrodahl.net) that clarify privacy
  - **`NEWTON_GITHUB_URL`** (default: `https://github.com/skrodahl/NewTon`) - Customize GitHub link
    - Allows forks to link to their own repository in demo banner
  - **`NEWTON_HOST_PORT`** (default: `8080`) - Configurable host port mapping
    - Avoid port conflicts with other services on host machine
- **Implementation**:
  - `api/api-check.php` - Shared API access check (DRY approach)
  - `api/*.php` - All API endpoints include api-check.php
  - `tournament.html` - PHP config block + JavaScript demo banner injection
  - `docker-compose.yml` - Environment variable definitions with inline documentation
- **Backward compatible**: Environment variables have sensible defaults, existing deployments work unchanged

### Changed: Internal Port 2020 ("Double 20" 🎯)
- **nginx now listens on port 2020 internally** instead of port 80
  - **Thematic choice**: Port 2020 = "Double 20" (highest scoring segment in darts!)
  - **Practical benefit**: Avoids port conflicts when using reverse proxies (Nginx Proxy Manager, Caddy, Traefik)
  - **Docker networking**: When multiple containers share a network (e.g., with NPM), port 80 is commonly used by many services. Port 2020 reduces conflicts.
  - **Host port unchanged**: Default `8080:2020` mapping means users still access via `http://localhost:8080`
  - **Reverse proxy users**: Point to `newton:2020` (not `newton:80`)
- **Files updated**:
  - `docker/nginx.conf` - `listen 2020;` with "Double 20" comment
  - `docker/Dockerfile` - `EXPOSE 2020` with darts reference
  - `docker-compose.yml` - Port mapping `8080:2020` with emoji and explanation
  - `DOCKER-QUICKSTART.md` - Comprehensive updates with "Double 20" references throughout
- **User impact**:
  - **NPM/reverse proxy users**: No more port 80 conflicts in Docker networks
  - **Direct users**: No change (still access via localhost:8080)
  - **Fun detail**: Port choice has thematic significance for darts tournament software!

### Enhanced: DOCKER-QUICKSTART.md
- **New "Configuration" section** documenting all environment variables with use cases
- **Reverse Proxy Setup guide** for NPM/Caddy users (explains port 2020)
- **Demo Site Setup example** showing how to replicate darts.skrodahl.net
- **Updated Security Notice** - Added `NEWTON_API_ENABLED=false` option, removed broken Docs/SECURITY.md reference
- **All port references updated** from `:80` to `:2020` throughout
- **Multiple "Double 20" callouts** explaining the thematic port choice

### Technical Notes
- **Demo banner preserves static HTML**: PHP block only executes when served via nginx/PHP-FPM, gracefully ignored when opening tournament.html directly (file://). Core feature preserved: double-click tournament.html still works!
- **API check is DRY**: Shared `api/api-check.php` prevents code duplication across all API endpoints
- **Independent control**: Environment variables work independently (can enable demo mode with API enabled, or disable API without demo mode, etc.)

---

## **v3.0.3** - REST API Duplicate Prevention

### Enhanced: Tournament Upload Duplicate Prevention
- **Prevent silent overwrites when uploading tournaments to server**
  - **Previous behavior**: Uploading a tournament with the same filename would silently overwrite the existing file without warning
  - **New behavior**: Upload API returns 409 Conflict if file already exists, prompting user to confirm overwrite
  - **User flow**:
    1. Upload tournament that already exists → Confirmation dialog appears
    2. User confirms → Retry with `?overwrite=true` parameter
    3. User cancels → Upload aborted, existing file preserved
  - **API changes**:
    - `POST /api/upload-tournament.php` - Now checks `file_exists()` before writing
    - Query parameter `?overwrite=true` - Explicitly allows overwriting existing files
    - Response includes `overwritten: true` when file was replaced
  - **Safety improvement**: Prevents accidental data loss from uploading older tournament versions over newer ones
- **Implementation**: api/upload-tournament.php (duplicate check), tournament-management.js:195-264 (confirmation dialog and retry logic)
- **User impact**: Users are now warned before overwriting existing tournaments on the server, preventing accidental data loss while still allowing intentional updates.

---

# 2025-10-21

## **v3.0.2** - Docker Deployment, Extended Transaction History & UI Refinements

### New: Docker Deployment Support
- **Full Docker containerization for self-hosting**
  - **nginx + PHP-FPM Alpine** - Lightweight (~60MB) container with full PHP REST API support
  - **Multi-architecture builds** - Supports linux/amd64 (Intel/AMD) and linux/arm64 (Apple Silicon, Raspberry Pi)
  - **Persistent tournament storage** - Volume mount for `/tournaments` directory preserves uploaded tournament data
  - **10MB upload limit** - Supports large tournament files (nginx `client_max_body_size` and PHP `upload_max_filesize` set to 10MB)
  - **UTF-8 encoding** - Proper handling of international characters (Swedish/Norwegian å, ä, ö, etc.)
  - **GitHub Container Registry** - Automated builds on Git tags publish to `ghcr.io/skrodahl/newton`
  - **GitHub Actions workflow** - Automatic multi-arch builds and publishing on version tags
- **Docker configuration files:**
  - `docker/Dockerfile` - nginx + PHP-FPM Alpine-based image
  - `docker/docker-compose.yml` - Easy deployment with persistent storage
  - `docker/nginx.conf` - Web server configuration for static files and PHP API
  - `docker/php.ini` - PHP configuration for upload limits and UTF-8 encoding
  - `docker/README.md` - Quick start guide
  - `.dockerignore` - Excludes unnecessary files from image
  - `.github/workflows/docker-build.yml` - Automated build pipeline
- **Documentation:**
  - `DOCKER-QUICKSTART.md` - Step-by-step quick start guide (under 2 minutes)
  - `Docs/DOCKER.md` - Comprehensive Docker deployment guide (hosting options, reverse proxy setup, troubleshooting)
  - `README.md` - Added Docker deployment section with quick start
- **Implementation:** docker/Dockerfile, docker/docker-compose.yml, docker/nginx.conf, docker/php.ini, .github/workflows/docker-build.yml
- **User impact:** Self-hosters can easily deploy NewTon Tournament Manager on their own servers using Docker. Perfect for clubs wanting to host their own instance with full tournament sharing capabilities via PHP REST API. Supports large tournament files up to 10MB and properly handles international characters.

### Enhanced: Referee Conflict Detection - Self-Refereeing Support
- **Players can now referee their own matches without triggering conflict warnings**
  - **Previous behavior**: If a player was assigned as referee to their own match (e.g., "Chris vs Albin, Ref: Chris"), the conflict detection would block starting the match
  - **New behavior**: Conflict detection now excludes the current match being checked, allowing self-refereeing while still preventing double-booking
  - **Logic**: Added single-line check `if (m.id === match.id) return;` to skip the current match during referee conflict validation
  - **Use case**: Common in smaller tournaments where players referee their own matches
  - **Safety maintained**: Still prevents players from playing in one match while refereeing a different match
- **Implementation**: bracket-rendering.js:2550-2551 (skip current match in conflict detection loop)
- **User impact**: More flexible referee assignment without losing safety checks. Tournament operators can assign players as referees to their own matches, which is blocked appropriately when they're refereeing other matches.

### Enhanced: UI Spacing Consistency
- **Fixed spacing inconsistency between Setup and Registration page headers**
  - **Issue**: Setup page had tight spacing between "Tournament Setup" title and "Tournament Name" field due to negative margin
  - **Fix**: Changed `.setup-page-header .form-group` margin-top from `-6px` to `16px` to match Registration page spacing
- **Implementation**: styles.css:2228
- **User impact**: Consistent visual rhythm across all page headers

### Enhanced: Payment QR Code Size Adjustment
- **Reduced payment.png display height for better visual balance**
  - **Previous height**: 200px
  - **New height**: 175px
  - **Location**: Registration page header, right column
- **Implementation**: styles.css:2567
- **User impact**: More balanced layout on Registration page, particularly on lower resolution displays

### Enhanced: Transaction History Limit
- **Increased MAX_HISTORY_ENTRIES from 500 to 1000**
  - **Purpose**: Provide even more headroom for extensive 32-player tournaments with heavy operational activity
  - **Previous limit**: 500 transactions
  - **New limit**: 1000 transactions
  - **Impact**: Doubles the transaction history capacity, allowing for extremely complex tournaments with extensive lane/referee reassignments and match operations
  - **Storage impact**: Minimal - with optimized transaction storage (v3.0.1), even 1000 transactions remain well within localStorage limits
  - **Use case**: Supports tournaments with 100+ completed matches plus full operational transaction history
- **Implementation**: clean-match-progression.js:1804 (MAX_HISTORY_ENTRIES constant)
- **User impact**: Tournament operators can run even the most complex tournaments without any concern about hitting transaction limits. The combination of optimized storage (v3.0.1) and doubled capacity (v3.0.2) provides exceptional operational headroom.

### Fixed: Developer Console Transaction Display
- **Updated all hardcoded 500 transaction references to 1000 in analytics.js**
  - **Issue**: Developer Console displayed incorrect transaction percentages and capacity (showed /500 instead of /1000)
  - **Fix**: Updated 11 locations in analytics.js where transaction capacity was hardcoded to 500
  - **Affected displays**: Quick Overview, Transaction Breakdown, Transaction Log Management, validation thresholds
  - **Validation thresholds updated**: Healthy (<500), Moderate (500-799), High (800+) to maintain 50%/80% warning levels
- **Implementation**: analytics.js:216, 218, 501, 528, 570, 571, 601, 1817, 1819-1820, 2348, 2362
- **User impact**: Developer Console now correctly shows transaction capacity as X/1000 with accurate percentages. Status indicators (✅⚠️🔴) trigger at correct thresholds relative to 1000-transaction limit.

---

## **v3.0.1** - Critical Storage Optimization & UI Enhancements

### Enhanced: Match Controls - Referee Conflict Prevention
- **Visual warnings prevent starting matches when players are already refereeing**
  - **Problem**: Tournament operators could accidentally start a READY match where one player is currently assigned as referee to another match, creating scheduling conflicts at the venue
  - **Visual indicators**:
    - Player name shows warning: "⚠️ Bob (Referee)" in player vs player display
    - Match card background changes to signal that the match can't be started
    - Start Match button becomes disabled (grayed out, not clickable)
  - **Scope**: Player counts as "refereeing" if assigned as referee to ANY match with status READY or LIVE
  - **Dynamic updates**: Warning appears immediately when referee assigned, disappears when unassigned
  - **Prevents venue conflicts**: Impossible to start match where player is simultaneously playing and refereeing
- **Implementation**: bracket-rendering.js:2544-2578 (conflict detection in createMatchCard), styles.css:1442-1461 (warning colors and disabled button styling)
- **User impact**: Critical safety feature prevents double-booking players as both participants and referees. Tournament operators see clear visual warnings before attempting to start conflicting matches.

### Enhanced: Developer Console - Toggle Read-Only Command
- **New "Toggle Read-Only" command in Developer Console**
  - **Purpose**: Provides escape hatch to convert completed (read-only) tournaments back to read-write mode for editing
  - **Location**: Added to COMMANDS section in Developer Console sidebar
  - **Functionality**: Toggles `tournament.readOnly` flag and saves tournament
  - **Visual feedback**: Shows 🔒 (read-only) or 🔓 (read-write) icon with status details
  - **Status information**: Lists what's enabled/disabled in each mode:
    - Read-only: Undo disabled, match modifications disabled, data protected
    - Read-write: Undo enabled, match modifications enabled, fully editable
- **Implementation**: analytics.js:2294-2326 (commandToggleReadOnly function), tournament.html:677-679 (command link)
- **User impact**: Tournament organizers can modify completed tournaments without resetting them entirely. Useful for post-tournament corrections or adjustments.

### Fixed: Transaction Storage Optimization (Critical)
- **Resolved localStorage overflow issue in large tournaments**
  - **Problem**: 32-player tournaments with ~19 players hit 10 MB localStorage limit by BS-R6 (~35 matches), forcing manual transaction deletion to complete tournament
  - **Root cause**: `COMPLETE_MATCH` transactions stored entire tournament state (~50-100 KB each) in `beforeState` object that was never used by undo system
  - **Solution**: Removed unused `beforeState` data from all transaction types
- **Storage reduction achieved:**
  - **COMPLETE_MATCH transactions**: Removed `beforeState.matches` (entire matches array) and `beforeState.tournament` (entire tournament object) - **~98% reduction** (~50 KB → ~0.6 KB per transaction)
  - **ASSIGN_LANE transactions**: Removed `beforeState.lane`, kept `afterState.lane` for future analytics - **~50% reduction**
  - **ASSIGN_REFEREE transactions**: Removed `beforeState.referee`, kept `afterState.referee` (required for referee suggestions feature) - **~50% reduction**
- **Impact on typical 32-player tournament:**
  - Before: ~35 completed matches × 50 KB = **~1.75 MB** (just COMPLETE_MATCH transactions)
  - After: ~35 completed matches × 0.6 KB = **~21 KB** (just COMPLETE_MATCH transactions)
  - **Total reduction**: ~8-10 MB → ~300-500 KB (97% smaller)
  - **Result**: Can safely complete 100+ matches without hitting localStorage limits
- **Backward compatibility**: Existing tournaments with old transaction format continue to work (extra data simply ignored)
- **Undo system unchanged**: Still uses hardcoded `MATCH_PROGRESSION` lookup tables and manual state resetting (never used `beforeState` data)
- **Referee suggestions unchanged**: Still uses `afterState.referee` from transaction history to build timeline
- **Implementation**: clean-match-progression.js:287-300,1380-1388, bracket-rendering.js:1543-1551,1608-1616
- **User impact**: Tournament operators can complete full 32-player tournaments without localStorage errors or manual workarounds. Critical fix for tournament night reliability.

## **v3.0.1-beta** - Help System & Payment Information UI Enhancements

### Enhanced: Help System with Info Icons
- **Replaced floating help button with context-aware info icons**
  - **Info icons (ℹ️)**: Added next to page headers on Setup, Registration, and Config pages
  - **Direct click access**: Click icon to open contextual help modal for current page
  - **Clean design**: Removes positioning conflicts from floating help button
  - **Hover effect**: Icons scale and change color on hover for clear interactivity
  - **Orange accent color**: Icons use `#ff6b35` to match application theme
  - **F1 shortcut**: Keyboard shortcut remains available for all pages
  - **Tournament page unchanged**: Watermark "Press F1 for help" remains on bracket page
- **Implementation**: tournament.html:50,110,273 (info icons), css/styles.css:2997-3013 (icon styles), js/dynamic-help-system.js:437-450 (click handlers)
- **User impact**: Cleaner, more intuitive help access without UI clutter. Users can immediately identify where to get help for each page.

### Enhanced: Registration Page with Payment Information Display
- **New payment QR code display in registration header**
  - **Two-column grid layout**: Registration header now uses CSS Grid with left (forms) and right (payment info) columns
  - **QR code placement**: Displays `payment.png` in right column at 200px height with border and shadow
  - **Graceful fallback**: Image hidden automatically if `payment.png` file doesn't exist (no broken image icon)
  - **Player count repositioned**: Moved from below buttons to bottom-right of header area
  - **Dynamic bottom alignment**: Player count uses `margin-top: auto` to stay at bottom regardless of image presence
  - **Responsive layout**: Grid with `1fr auto` columns adapts to content size
- **Visual improvements**
  - **Structured form layout**: Registration controls organized in left column with consistent spacing
  - **Professional appearance**: QR code styled with subtle border and shadow matching application design
  - **Maintained functionality**: All existing registration features work identically
- **Implementation**: tournament.html:108-132 (restructured header), css/styles.css:2473-2564 (grid layout and column styles)
- **User impact**: Tournament organizers can display payment information directly on registration page. Players see payment QR code immediately when registering. Clean integration without disrupting existing workflow.

# 2025-10-16

## **v3.0.0** - Match Controls Real-Time Updates, Referee Suggestions & Developer Console Enhancements

### Enhanced: Developer Console - Lane Usage Details & Preventive Conflict Detection
- **Complete Lane Usage detail view implementation with real-time monitoring and preventive warnings**
  - **Lane Usage detail view**: Clicking "Lane Usage" statistic now shows comprehensive lane breakdown
    - Color-coded status box: Green (no conflicts), Yellow (READY conflicts), Red (LIVE conflicts)
    - Available lanes list (non-excluded lanes with total count)
    - Excluded lanes list (or "None")
    - Active lanes list (unique lanes currently in use with accurate count)
    - Live matches section: Shows lane number, match ID, and player names for each live match
    - Ready matches section: Shows pre-assigned lanes for upcoming matches
    - Auto-refresh every 2 seconds for real-time lane monitoring during tournament
    - "Back to Overview" navigation link
  - **Enhanced lane conflict detection**: `validateLaneAssignments()` now detects both LIVE and READY match conflicts
    - **LIVE conflicts (critical)**: Multiple live matches assigned to same lane - immediate issue requiring action
    - **READY conflicts (warning)**: Multiple ready matches pre-assigned to same lane - future issue, preventive warning
    - Returns separate conflict arrays (`conflicts` and `readyConflicts`) for each type
    - Properly handles 3+ matches on same lane (not just pairs)
    - Catches extreme corner case: duplicate lane assignments from undoing matches
  - **Conflict warning displays**:
    - LIVE conflicts shown in red warning box with critical alert and "both LIVE" notation
    - READY conflicts shown in yellow warning box with preventive message
    - Helpful guidance: "These matches will conflict when started. Reassign lanes before starting matches."
    - Both conflict types displayed in Lane Usage detail view with clear visual separation
  - **Updated Quick Overview**:
    - Separate display lines for "Lane conflicts (LIVE)" and "Lane conflicts (READY)"
    - Three-level color coding: Green (healthy, no issues), Yellow (READY warnings), Red (LIVE critical)
    - Overall status box reflects most severe issue detected
  - **Left pane statistics updates**:
    - Lane Usage indicator shows 🔴 for LIVE conflicts, ⚠️ for READY conflicts, ✅ for all clear
    - Accurate in-use count based on unique active lanes (fixed counting bug)
  - **Implementation**: lane-management.js:81-133 (enhanced validation), analytics.js:807-981 (detail view), analytics.js:233-240 (statistics), analytics.js:397-434 (quick overview), tournament.html:610 (click handler)
  - **User impact**: Tournament organizers can now catch duplicate lane assignments BEFORE matches start, preventing scheduling conflicts and improving tournament flow. Real-time monitoring shows exactly which lanes are free and which matches are using them.

### Enhanced: Developer Console - Quick Overview Menu Link & Tournament Timing Statistics
- **New "Quick Overview" menu link added to Statistics section for easy navigation**
  - **Direct navigation**: "Quick Overview" now appears as first item in Statistics section of left pane
  - **Always visible**: Provides permanent way to return to overview from any detailed view
  - **Real-time tournament duration**: Shows "Duration: HH:MM:SS" (e.g., "Duration: 43:26")
  - **Dynamic updates**: Duration refreshes every 2 seconds during active tournaments
  - **Format variations**: "Duration: Not started" (setup), "Duration: 43:26" (active), "Duration: 3:45:12" (completed)
  - **Complements existing navigation**: Works alongside "← Back to Overview" links in detail views
- **New tournament timing statistics added to Quick Overview**
  - **Tournament duration**: Total elapsed time from first match start
    - **Dynamic during active tournament**: Updates every 2 seconds, calculated from first START_MATCH to current time (e.g., "43:26")
    - **Static after completion**: Fixed historical value from first START_MATCH to last COMPLETE_MATCH (e.g., "3:45:12")
    - **Setup state**: Shows "Not started" when no matches have begun
    - **Undo-aware**: Clock resumes if Grand Final is undone, reverting tournament from completed to active state
  - **Average match time**: Mean duration of all completed matches (e.g., "14:23")
  - **Shortest match**: Fastest completed match with match ID (e.g., "8:15 (FS-1-2)")
  - **Longest match**: Slowest completed match with match ID (e.g., "32:45 (BS-FINAL)")
  - **Time format**: HH:MM:SS with hours omitted when zero (e.g., "14:23" instead of "0:14:23")
  - **Seconds precision**: Shows exact match durations for accurate tournament pacing analysis
  - **Separator line**: Timing statistics appear below health checks with visual separator for clear section distinction
  - **Edge case handling**: Shows "N/A" when no completed matches exist, "0:XX" for test matches under 1 minute
  - **Read-only tournament handling**: Timing statistics section hidden for read-only tournaments (completed tournaments loaded from Recent Tournaments)
    - **Rationale**: Read-only tournaments are historical imports where timing data cannot be trusted or verified
    - **Active completed tournaments**: Timing stats remain visible for tournaments completed during current session
    - **Clean presentation**: Entire timing section (including separator) omitted for read-only imports
- **Implementation**: tournament.html:598-602 (menu link), analytics.js:251-257 (duration subtitle), analytics.js:404-497 (timing calculations), analytics.js:542-555 (conditional timing display), Docs/ANALYTICS.md:80-94 (documentation)
- **User impact**: Tournament duration visible at a glance in left menu, updating in real-time. Easy one-click access to Quick Overview from any view. Tournament organizers can now monitor tournament duration continuously, track match pacing, and identify fastest/slowest matches for scheduling insights. Read-only tournaments keep Quick Overview focused on relevant validation data.

### Enhanced: Developer Console - Match Progression View Redesign
- **Complete Match Progression view redesign with side-by-side layout and improved readability**
  - **Two-column side-by-side layout**: Frontside and Backside brackets displayed in equal-width columns for maximum overview capability
    - CSS Grid layout: `repeat(2, minmax(0, 1fr))` ensures perfectly balanced columns
    - Columns maintain position even when one side has no matches (stays in lane)
    - Grand Final displayed below in special green-highlighted section
    - Single-column mode when filtering by specific side
  - **Improved match card layout**: Two-line design for optimal readability
    - **Line 1**: Status (left-aligned, 80px width) and Match ID (center-aligned, 18px font)
    - **Line 2**: `FROM: sources → TO: destinations` (center-aligned with labeled sections)
    - Clear "FROM:" and "TO:" labels eliminate ambiguity in progression flow
    - Bold arrow separator (→) between sections
  - **Enhanced state visualization**: Each match reference includes state icon
    - Example: "FROM: FS-1-3 ✅, FS-1-4 ✅" shows source match states at a glance
    - Example: "TO: ⏸️ FS-3-1, ⏸️ BS-2-6" shows destination match states
    - Round 1 matches: "FROM: R1" (italicized, gray)
    - Champion: "TO: 🏆", Eliminated: "TO: ❌"
  - **Progression Code view**: New debugging view showing raw MATCH_PROGRESSION lookup table
    - Access via "Progression Code" button in filter bar
    - Monospace text display of hardcoded progression rules
    - Traditional format: "Winner → FS-2-1 (player1)" for verifying bracket logic
    - "← Back to Match Progression" button at top for quick return to rich view
  - **Collapsible Console Output**: Console footer now collapsible and hidden by default
    - Click "Console Output" header to toggle visibility (▶ collapsed, ▼ expanded)
    - Main content area expands to fill available space when console collapsed
    - Console limited to 400px max-height when expanded
    - Flexible layout automatically adjusts content area size
  - **Implementation**: analytics.js:1067-1453 (progression views), analytics.js:2559-2575 (toggle function), tournament.html:675-700 (flexible layout)
  - **User impact**: Tournament operators get complete bracket overview at a glance with clear progression flow. Developers can verify hardcoded logic with Progression Code view. More screen space available with collapsible console.

### Enhanced: Developer Console - Reset All Config Command
- **New "Reset All Config" developer command for recovering from config corruption**
  - **Command location**: Developer Console Commands section (bottom of list, red text for visual distinction)
  - **Typed confirmation required**: Must type "RESET" in confirmation box to proceed
  - **Before/after comparison**: Shows detailed comparison for all config sections before reset
    - Point values (all 11 point types)
    - Match configuration (5 round types)
    - UI settings (4 settings)
    - Branding (club name)
    - Lane configuration (max lanes, excluded lanes)
    - Server settings
  - **Tournament data preserved**: Only resets config, never touches tournament data (matches, players, brackets, history)
  - **Auto-refresh**: Page reloads after 2 seconds to apply changes
  - **Visual warnings**: Red warning box with "⚠️ Warning: Destructive Action" alert
  - **Success feedback**: Summary of changes with automatic page refresh countdown
  - **Hidden from casual users**: Only available in Developer Console (not on Config page) to prevent accidental use
  - **Use cases**: Config corruption recovery, misconfiguration fixes, fresh start scenarios
  - **Implementation**: analytics.js:1656-1822 (command functions), tournament.html:645-647 (UI integration), Docs/ANALYTICS.md:248-285 (documentation)
  - **User impact**: Tournament operators can recover from config corruption or misconfiguration without losing tournament data. Provides safe recovery tool for extreme situations.

### Enhanced: Config Page - Help System Documentation Update
- **Developer Console comprehensive documentation added to Config page dynamic help**
  - **Updated help for "Enable Developer Analytics" setting**: Now includes detailed feature list
  - **Real-time statistics**: Lists all 5 statistics tracked (Transaction Health, Match States, Player Counts, Lane Usage, localStorage Usage)
  - **Lane Usage monitoring**: Specific mention of LIVE/READY conflict detection capabilities
  - **Validation checks**: Lists all 6 validation checks (lane conflicts, referee conflicts, match state integrity, transaction limits, player IDs, progression integrity)
  - **Developer commands**: Lists all commands (Re-render Bracket, Recalculate Rankings, Refresh Dropdowns, Validate Everything, Manage Transaction Log, Reset All Config)
  - **Transaction management**: Notes Smart Pruning capability for storage optimization
  - **Auto-refresh behavior**: Mentions 2-second auto-refresh for real-time monitoring
  - **Implementation**: dynamic-help-system.js:321-335 (help content update)
  - **User impact**: Users can discover Developer Console features and capabilities directly from Config page help, improving discoverability

### Enhanced: Match Controls - In-Modal Auto-Open Setting Toggle
- **"Automatically open Match Controls" checkbox added to Match Controls modal for convenient access**
  - **Location**: Bottom-right corner of Match Controls modal, aligned with Statistics/Close buttons
  - **Styling**: Matches button font (14px, font-weight 500) for visual consistency
  - **Bidirectional sync**: Changes sync in real-time between Match Controls modal and Config page
    - Toggle in Match Controls → Config page checkbox updates immediately
    - Toggle in Config page → Match Controls checkbox updates immediately
    - No page refresh required for sync
  - **Persistent storage**: Both checkboxes read/write from same `config.ui.autoOpenMatchControls` setting
  - **Auto-save**: Calls `saveGlobalConfig()` immediately on toggle
  - **Layout**: Buttons centered, checkbox positioned absolutely on right side
  - **Implementation**: tournament.html:907-918 (UI), bracket-rendering.js:3422-3446 (Match Controls sync), results-config.js:304-308 (Config page sync)
  - **User impact**: Users can toggle auto-open behavior directly from Match Controls without navigating to Config page. Setting is immediately available and stays in sync across both locations.

### Enhanced: Tournament Page - Navigation Buttons for Quick Page Access
- **Five navigation buttons added to Tournament page for easy access to other pages**
  - **Button layout**: Positioned in top-left corner, stacked vertically
    - **Top row**: Statistics, Match Controls (green)
    - **Middle row**: Setup, Registration, Config (stacked vertically below)
  - **Button styling**: 150px width, consistent dark background with white text
    - Left-aligned icons (≡, ➹, ⬅) with 20px fixed width
    - Centered button text with balanced padding (32px left, 12px right)
    - Statistics button opens Statistics modal
    - Match Controls button opens Match Controls modal (green highlight)
    - Setup/Registration/Config buttons navigate to respective pages using `showPage()`
  - **Visual consistency**: All buttons use `.nav-btn` class with unified icon/text layout
    - Icons positioned absolutely at left: 12px
    - Text centered in remaining button space
  - **Rationale**: Direct navigation from Tournament page improves workflow - operators can quickly access Setup, Registration, Config, or view Statistics without returning to main navigation
  - **Implementation**: tournament.html:203-222 (button structure), css/styles.css:504-525 (navigation button styling), dynamic-help-system.js:174-177 (help text updates)
  - **User impact**: Tournament operators can navigate between all major pages directly from the bracket view, reducing clicks and improving tournament management efficiency.

### Enhanced: Navigation Menu - Sliding Underline Indicator
- **Animated sliding underline added to main navigation menu for polished visual feedback**
  - **Sliding underline animation**: 1px black line smoothly transitions between active menu items
    - 0.3s CSS transition with easing for responsive, elegant movement
    - Pixel-perfect alignment under each menu item (Setup, Registration, Tournament, Config)
    - Uses CSS `:has()` selector for pure CSS implementation (no JavaScript required)
  - **Consistent menu styling**: Removed color and font-weight changes from active menu items
    - All menu items stay same color (`#444444` default, `#222222` on hover)
    - All menu items maintain `font-weight: 400` (no bold text causing layout shift)
    - Active state indicated solely by animated underline
  - **Removed button focus outlines**: Eliminated blue focus outline from all button types
    - Removed outline from `.btn`, `.zoom-btn`, and `.nav-btn` buttons
    - Cleaner interface without persistent blue glow after clicking
    - Buttons return to neutral state immediately after interaction
  - **Rationale**: Sliding underline provides modern, sophisticated navigation feedback without causing layout shifts or visual noise. Removing focus outlines eliminates visual artifacts while maintaining clean, professional appearance.
  - **Implementation**: css/styles.css:108-147 (sliding underline), css/styles.css:164-167 (active state), css/styles.css:271-276 (focus outline removal)
  - **User impact**: Navigation feels more polished and modern with smooth animated feedback. Menu bar no longer shifts position when changing pages. Buttons throughout the application have cleaner, more professional appearance without blue focus artifacts.

### Enhanced: Real-Time Clocks for Fullscreen Tournament Operation
- **Two clocks added for tournament operators running in fullscreen mode**
  - **Match Controls clock**: Displayed in top-right corner of Match Controls modal title bar
    - Format: 24-hour HH:MM (e.g., "23:05")
    - Updates every 10 seconds automatically
    - Visual styling: 1px gray border (#ccc), 8px vertical padding, 16px horizontal padding, 6px border radius
    - Monospace font (SF Mono, Consolas, Monaco, Menlo) for stable width
    - Normal font weight to distinguish from bold title text
    - Right-aligned using flexbox layout
  - **Status Panel clock**: Displayed in tournament watermark header (bottom-right box)
    - Format: 24-hour HH:MM
    - Updates every 10 seconds automatically
    - Right-aligned in Status Panel header next to tournament name
  - **Rationale**: When running tournaments in Chrome fullscreen, OS clock is hidden and operators frequently ask for time
  - **Update mechanism**: `setInterval()` functions ensure clocks stay current without manual refresh
  - **Implementation**: bracket-rendering.js:3059-3079 (Match Controls clock display), bracket-rendering.js:4064-4075 (Match Controls update function), tournament-management.js:1202-1225 (Status Panel clock), tournament-management.js:1269-1281 (Status Panel update function)
  - **User impact**: Tournament operators can see current time at a glance without exiting fullscreen mode. Match Controls clock is most prominent since operators spend majority of time in that modal.

### Fixed: Config Page - Removed Auto-Save for Point Values and Match Configuration
- **Point System and Match Configuration now require explicit Save button click**
  - **Removed auto-save behavior**: Deleted `setupConfigAutoSave()` function and all event listeners
  - **Consistent save workflow**: All config sections now require deliberate Save button click
  - **Added "Save Point Values" button**: Green primary button in Point Values section
  - **Added "Save Match Configuration" button**: Green primary button in Match Configuration section
  - **Removed "(autosave)" labels**: Cleaned up section headers for clarity
  - **Success alerts**: Both save functions show "✓ saved successfully!" confirmation alerts
  - **Rationale**: Auto-save was too aggressive for deliberate configuration changes - users expect explicit save control
  - **Implementation**: main.js:274-353 (removed auto-save function), results-config.js:351-392 (new save functions), tournament.html:452-508 (UI updates)
  - **User impact**: Configuration changes now require explicit user action before being persisted. More predictable behavior - users have control over when changes are saved, preventing accidental configuration modifications.

### Fixed: Setup Page - Scrolling in Recent Tournaments and Match Results
- **Scrollable areas now work properly with overflow-y: auto**
  - **Root cause**: `.scrollable-column-content` was missing `overflow-y: auto` CSS property
  - **Fixed sections**: Both "Recent Tournaments" and "Match Results" boxes now scroll when content exceeds height
  - **Implementation**: css/styles.css:2242 (added overflow-y property)
  - **User impact**: Long tournament lists and match results are now accessible through scrolling instead of being cut off

### Enhanced: Developer Console - Transaction Log Management & Storage Monitoring
- **Complete transaction pruning system with smart algorithm and localStorage monitoring**
  - **"Manage Transaction Log" command**: Opens dedicated management view showing current status, storage usage, and pruning options
  - **Smart Pruning algorithm**: Removes redundant transactions for completed matches only
    - Removes old ASSIGN_LANE transactions (keeps final assignment)
    - Removes old ASSIGN_REFEREE transactions (keeps final assignment)
    - Removes ALL START_MATCH and STOP_MATCH transactions (redundant after completion)
    - Preserves ALL COMPLETE_MATCH transactions (never pruned)
    - Preserves ALL transactions for active/pending matches
  - **Preview mode**: Shows detailed analysis before execution (what will be removed/kept, storage impact)
  - **Post-execution feedback**: Comprehensive statistics on transactions removed, storage freed
  - **Safety**: Undo system unaffected (uses separate state snapshots, not transaction history)
  - **Performance**: Typically removes 40-60% of transactions in active tournaments
  - **localStorage Usage statistic**: New fifth statistic in Developer Console
    - Shows total usage vs 10 MB browser limit
    - Color-coded indicators (green < 50%, amber 50-80%, red > 80%)
    - Detail view with breakdown by localStorage key (sorted by size)
    - Helps identify when transaction pruning is needed
  - **Transaction History improvements**: Reverse chronological sorting (#1 = latest transaction)
  - **Transaction History filtering system**: Comprehensive search and filter capabilities
    - **Layout optimization**: Developer Console left pane reduced from 30% to fixed 240px width for better space utilization
    - **Vertical sidebar layout**: Filter panel positioned as right sidebar next to transaction list
    - **Three-filter system** with AND logic:
      - Transaction Type dropdown (All Types, COMPLETE_MATCH, ASSIGN_REFEREE, ASSIGN_LANE, START_MATCH, STOP_MATCH)
      - Match ID text input (searches matchId field and description)
      - Search String text input (searches player names and any text in description)
    - **Enhanced transaction descriptions**: All transactions now include both player names and IDs for better debugging
      - COMPLETE_MATCH: "FS-1-3: Liam (ID: 123) defeats Peter (ID: 456)"
      - ASSIGN_REFEREE: "FS-1-1: Referee assigned to Chris (ID: 1760441429772)"
    - **Filter state preservation**: Selected filters maintained in UI when applied
    - **Results counter**: Shows "X of Y total" when filtered, "Y total" when unfiltered
    - **Clean UI**: Professional layout with proper spacing and visual hierarchy
  - **Storage calculation fixes**:
    - Updated browser limit from 5 MB to 10 MB (modern browsers: Chrome 114+, Firefox, Safari, Edge)
    - Fixed UTF-16 encoding calculation (2 bytes/char instead of 8 bytes/char)
    - Accurate storage estimates across all views
  - **Developer Console UI unification**: Consistent professional styling across all views
    - **Unified command feedback**: All commands (Re-render Bracket, Recalculate Rankings, Refresh All Dropdowns, Validate Everything) use consistent styled feedback boxes
    - **Status-based color coding**: Green for success/healthy, yellow for moderate/warnings, red for errors/critical
    - **Flat design system**: All views use border-radius: 0 for sharp corners matching application design
    - **Statistic detail views**: Quick Overview, Transaction Breakdown, Match State, Player Details, and localStorage Usage all use consistent status boxes
    - **Back to Overview navigation**: All detail views include "← Back to Overview" link for easy navigation
    - **Multi-column player list**: Player Details view uses CSS Grid (4+ columns) to efficiently display player names and IDs
    - **Visual hierarchy**: Clear status headings (16px, bold, colored) with proper spacing and typography throughout
  - **Modal width optimization**: Reduced from 90% to 75% screen width for more comfortable viewing on larger displays
  - **Implementation**: analytics.js (Transaction Log Management, localStorage Usage view, Transaction History filtering, UI styling updates), tournament.html (layout optimization, modal width), bracket-rendering.js (ASSIGN_REFEREE descriptions), clean-match-progression.js (COMPLETE_MATCH descriptions)
  - **User impact**: Operators can monitor and manage storage usage, prevent hitting browser limits, maintain tournament performance, and quickly debug tournament issues with powerful filtering capabilities. The unified UI provides a professional, consistent experience across all Developer Console views.

### Fixed: Match Controls Auto-Refresh on Lane Changes
- **Match Controls now updates immediately when lane assignments change on LIVE matches**
  - Previously, changing a lane on a LIVE match required closing and reopening Match Controls to see the updated sort order
  - LIVE matches now automatically re-sort by lane number when lanes are changed
  - **Root cause**: Modal refresh check was looking for `display === 'flex'` but Match Controls uses `display: 'block'`
  - **Solution**: Updated display check to accept both 'flex' and 'block' in `updateMatchLane()` function
  - **Side benefit**: Also fixed lane/referee resources not being immediately "released" when stopping LIVE matches
  - **Implementation**: Modified modal display check in clean-match-progression.js:1412-1414
  - **User impact**: Real-time sorting and resource availability updates during tournament operations

### Enhanced: Match Controls - Two-Column Layout & Modal Optimization
- **Complete redesign with Frontside/Backside visual separation for better tournament flow visibility**
  - **Two-column layout**: Match cards split into Frontside (left) and Backside (right) columns for both LIVE and Ready to Start sections
  - **Visual separation**: 2px vertical separator line between columns for clear bracket side distinction
  - **Modal sizing**: Maximized vertical space with 98vh max-height and 1% top margin for optimal screen utilization on all display sizes
    - **Height optimization**: Changed from 80vh to 98vh max-height, gaining ~18% more vertical space for match display
    - **Positioning**: Reduced top margin from 5% to 1%, allowing modal to sit higher and extend nearly full viewport height
    - **Lower resolution support**: Critical improvement for laptops and smaller monitors (1366x768, 1280x720) where vertical space is premium
    - **Active tournament benefit**: Can display more LIVE and READY matches simultaneously without scrolling during busy tournament periods
  - **Referee sidebar optimization**: Fixed 350px width (user-adjustable via CSS) instead of flex-based, providing more space for match cards
  - **Tournament completion centering**: Celebration card constrained to 800px max-width and horizontally centered
  - **Setup mode input**: "Add Player" field constrained to 400px max-width for better proportions
  - **Dynamic width adjustment**: Modal width intelligently adjusts based on tournament status
    - **Setup mode**: 75% width (optimized for centered player registration content)
    - **Active mode**: 90% width (maximum space for two-column Frontside/Backside match layout)
    - **Completed mode**: 75% width (optimized for centered celebration display)
  - **At-a-glance visibility**: Operators can instantly see both bracket sides simultaneously without scrolling
  - **Smart grouping**: Grand Final appears in Frontside column, BS-FINAL in Backside column
  - **Independent sorting**: Each column maintains proper round progression order (FS-R1, FS-R2... and BS-R1, BS-R2...)
  - **Implementation**: bracket-rendering.js:3150-3285 (two-column rendering logic), bracket-rendering.js:3578-3584 (celebration width), bracket-rendering.js:3082-3086 (width reset), tournament.html:774 (modal dimensions), styles.css:1816-1822 (modal height optimization), styles.css:1772 (referee sidebar width), styles.css:1391 (celebration centering)
  - **User impact**: Tournament operators gain significantly improved spatial awareness of tournament state, can manage both bracket sides efficiently, and make faster operational decisions during active tournaments. Celebration view is optimally sized for comfortable viewing.

### Fixed: Undo System - Complete Match State Restoration & Resource Clearing
- **Match undo now properly clears ALL assignments and returns match to completely clean state**
  - **Critical bug fixed**: Lane and referee assignments were persisting after undoing completed matches
  - **Root cause**: Two separate data stores (transaction history AND match objects) were not being synchronized during undo
  - **Two-part fix implemented**:
    1. **Transaction history cleanup**: Remove ALL transaction types for undone match (COMPLETE_MATCH, ASSIGN_LANE, ASSIGN_REFEREE, START_MATCH, STOP_MATCH)
    2. **Match object clearing**: Reset `match.lane = null` and `match.referee = null` during rollback
  - **Resource conflict prevention**: Without proper clearing, lanes and referees appeared "in use" but weren't shown in transaction history
  - **Clean slate principle**: Undoing a match now returns it to pristine READY state as if nothing was ever done to it
  - **Why critical**: Prevents resource conflicts, eliminates blocking of available lanes/referees, maintains data consistency between history and state
  - **Implementation**: bracket-rendering.js:2185-2194 (transaction removal), bracket-rendering.js:2273-2274 (match object clearing)
  - **Documentation**: Comprehensive update to Docs/UNDO.md explaining transaction types, data synchronization, and clean state restoration
  - **User impact**: Tournament operators can now safely undo matches without worrying about orphaned resource assignments or availability conflicts. The undo system properly releases all resources for reassignment to other matches.

### Enhanced: Player List - Payment Status Indicator & Smart Sorting
- **"In Tournament" section now shows payment status and prioritizes unpaid players**
  - **Payment status indicator**: Players who have paid entrance fee show "(Paid)" label in green (13px font, subtle styling)
  - **Smart sorting**: Unpaid players appear first, paid players at bottom (both groups alphabetically sorted)
  - **Real-time sync**: Payment status and sort order update immediately when toggled in "Tournament Players" section
  - **Visual feedback**: Quick at-a-glance confirmation of who still needs to pay
  - **Implementation**: player-management.js:95-114 (sorting logic), player-management.js:107-114 (payment indicator), player-management.js:448 (sync on toggle)
  - **User impact**: Tournament organizers can instantly see which players haven't paid during registration/check-in, reducing confusion and missed payments

### Improved: Referee Suggestions Logic
- **Complete rewrite of referee suggestions system with timeline-based event tracking**
  - **Timeline approach**: Lists show history of events, not unique players (e.g., "Jack, Ken, Bob, Ken, Nick, Ken")
  - **Recent Winners**: Last 10 match wins (up from 7, configurable 5-20 in Config page)
  - **Recent Losers**: Last 10 match losses (up from 7, configurable 5-20 in Config page)
  - **Recent Assignments**: Last 10 referee assignments (up from 7, configurable 5-20 in Config page)
  - **Players can appear multiple times**: Same player can appear multiple times in same list (timeline of their activity)
  - **Players can be in all lists**: Player can simultaneously be in Winners, Losers, AND Assignments
  - **Smart filtering**: When assigned as referee, player's OLDER match results are removed from Winners/Losers (they've done their duty)
  - **Reappearance logic**: When player completes match AFTER referee duty, they reappear in Winners/Losers
  - **Unassignment handling**: Removing referee assignment immediately returns player to Winners/Losers suggestions
  - **Replacement filtering**: Replaced referees don't appear (if Ben is replaced by Bob, only Bob shows in Recent Assignments)
  - **Per-match deduplication**: Only most recent assignment per match shows (prevents same referee appearing 3x for same match)
  - **Auto-refresh on changes**: Match Controls updates immediately when referees are assigned/changed/removed
  - **Active assignment verification**: Only currently assigned referees are filtered from suggestions (not historical assignments)
  - **Configurable limit**: Added "Number of referee suggestions to show" field in Config > User Interface (5-20, default 10)
  - **Implementation**: bracket-rendering.js:2651-2900 (getRefereeSuggestions), clean-match-progression.js:1567-1631 (updateMatchReferee auto-refresh)
  - **User impact**: Tournament operators can quickly assign referees from accurate, real-time list of eligible players - dramatically speeds up tournament management

### Maintenance: CSS Cleanup & Flat Design Unification (Complete)
- **Removed 393 lines of CSS (12% reduction) and unified all UI components to flat design button system**

  **Phase 1 - Legacy Duplicates (229 lines removed)**
  - Deleted duplicate Registration page player card styles (superseded by flat design)
  - Deleted duplicate Setup/Config page layout styles (superseded by flat design)
  - Fixed nested CSS comment syntax issue breaking Chrome's CSS parser
  - Created backup: styles.css.backup-2025-10-14

  **Phase 2 - Mobile/Responsive CSS (145 lines removed)**
  - Removed all 7 @media query blocks (1200px, 768px, 640px, 600px, 480px breakpoints)
  - Application is desktop-only, mobile support not needed
  - Removed mobile layout adjustments, podium sizing, Command Center layouts

  **Phase 3 - Unused Utilities (19 lines removed)**
  - Created CSS coverage tracker tool to analyze live runtime usage
  - Achieved 93.6% CSS coverage (233 of 249 classes actively used)
  - Removed confirmed unused utilities: `.mb-20`, `.d-flex`, `.justify-between`, `.align-center`
  - Removed disabled bracket lines feature: `.bracket-line`, `#bracketLines`
  - Removed unused button style: `.generate-bracket-btn`

  **Phase 4 - Export Modal Button Conversion (HTML inline styles removed)**
  - Converted Export Confirmation Modal buttons to flat design classes
  - Removed inline styles from Cancel button (was `background: #6c757d`)
  - Removed inline styles from Export Results button (was `background: rgba(22, 101, 52, 0.9); color: white`)
  - Now uses standard `.btn` and `.btn-success` classes for consistency
  - **Last remaining old-style buttons eliminated** - all 13 modals now use unified flat design system

  **Final Results:**
  - **Before**: 3,278 lines | **After**: 2,885 lines | **Total Reduction**: 12%
  - All 4 pages tested and working perfectly
  - All 13 modals tested and working with consistent button styling
  - No visual changes or regressions
  - Remaining CSS is lean, functional, and 93.6% actively used
  - **All UI components now unified under flat design button system**
  - **User impact**: Cleaner, more maintainable codebase with consistent button UX across entire application

### Project Structure: Code Organization
- **Reorganized JavaScript and CSS files into dedicated folders for cleaner project structure**
  - Created `js/` folder and moved all 11 JavaScript files
  - Created `css/` folder and moved styles.css
  - Updated tournament.html with new file paths
  - Updated documentation
  - **Result**: tournament.html now clearly visible as main entry point in root folder
  - **User impact**: More intuitive project structure, easier navigation for developers and contributors

### Enhanced: Tournament Export - Automatic Transaction History Optimization
- **Completed tournament exports now automatically optimize transaction history to reduce localStorage usage on import**
  - **Smart Pruning on Export**: Uses same algorithm as Developer Console to remove redundant transactions
  - **Conditional Optimization**: Only prunes when `tournament.status === 'completed'`
  - **Mid-Tournament Exports**: Preserve complete transaction history for backup/debugging purposes
  - **Algorithm Applied**:
    - Keeps ALL COMPLETE_MATCH transactions (match results never removed)
    - Keeps only LAST ASSIGN_LANE transaction per completed match
    - Keeps only LAST ASSIGN_REFEREE transaction per completed match
    - Removes ALL START_MATCH transactions (redundant after completion)
    - Removes ALL STOP_MATCH transactions (redundant after completion)
  - **Storage Optimization**: Typically removes 40-60% of transactions in completed tournaments
  - **Primary Benefit**: When importing a completed tournament, pruned history consumes significantly less localStorage space
  - **Secondary Benefit**: Smaller JSON file size makes sharing and archiving more convenient
  - **Silent Operation**: No user notification, happens automatically during export
  - **Implementation**: tournament-management.js:100-192 (pruneTransactionHistory helper, modified exportTournament)
  - **User impact**: Importing completed tournaments uses less localStorage space (helps prevent hitting 10 MB browser limits). Mid-tournament exports retain full history for safety and debugging. No manual pruning action required.

---

## **v2.5.1** - Match Controls and UI Improvements

### Enhanced: LIVE Match Sorting
- **Lane-based sorting in Match Controls**
  - LIVE matches now sort by lane assignment (ascending) first, then by match ID
  - Matches with lanes appear before matches without lanes
  - Lane order: Lane 1, Lane 2, Lane 3... (numerical ascending)
  - Within same lane status, matches sorted alphabetically by ID
  - **Benefit**: Matches organized by physical venue layout for easier tournament management
  - **Use case**: Operators can quickly find "What's on Lane 3?" without scanning through match IDs
  - **Tournament-tested**: Real-world insight from live tournament operations

### Enhanced: Config Page Reset to Defaults
- **Reset buttons for Point Values and Match Configuration**
  - Added "Reset to Defaults" button at bottom of Point Values section
  - Added "Reset to Defaults" button at bottom of Match Configuration section
  - Both buttons follow same styling pattern as other config section buttons (Branding, Lane Management)
  - **Confirmation dialog**: Prompts user before resetting to prevent accidental changes
  - **Autosave**: Changes immediately saved to localStorage after reset
  - **Auto-update**: Results table automatically refreshes when point values are reset
  - **Default values**:
    - Point Values: Participation (5), 1st (15), 2nd (13), 3rd (10), 4th (9), 5th-6th (8), 7th-8th (7), High Out (1), Ton (0), Short Leg (1), 180 (1)
    - Match Config: Regular (Best of 3), Frontside SF (Best of 5), Backside SF (Best of 3), Backside Final (Best of 5), Grand Final (Best of 5)
  - **Implementation**: `resetPointValuesToDefaults()` and `resetMatchConfigToDefaults()` in results-config.js

### Enhanced: Subtle Shadows for Depth and Actionability
- **Added subtle depth to buttons and match cards for improved visual hierarchy**
  - **Buttons**: Default state `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08)`, hover state `box-shadow: 0 2px 3px rgba(0, 0, 0, 0.12)`
  - **Match cards**: Applied same subtle shadow `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08)` to "Ready to Start" cards in Match Controls
  - **Design philosophy**: Tiny accent that leads the eye in the right direction without overdoing it
  - **User benefit**: Interactive elements feel more tangible and "actionable" while maintaining clean, professional appearance
  - **Subconscious impact**: Users won't consciously notice the shadows, but will feel the interface is more polished and professional
  - **Implementation**:
    - Buttons: Applied to base `.btn` class in styles.css, automatically cascades to all button variants (.btn-success, .btn-danger, .btn-warning, .btn-small)
    - Match cards: Applied to `.cc-match-card` class (LIVE matches retain their distinctive orange glow)
  - **Affected elements**: All action buttons (Create Tournament, Add Player, Save, Reset, Load, Delete, etc.) and Ready to Start match cards
  - **Real-world tested**: Refinement based on live tournament operation observations over multiple weeks

### Fixed: Disabled Lane and Referee Assignment for Pending Matches
- **Prevents resource blocking by disabling lane/referee dropdowns for pending matches**
  - Lane and referee dropdowns now disabled when match state is 'pending' (both players not yet determined/TBD)
  - Visual feedback: Disabled dropdowns shown with reduced opacity (0.5) and not-allowed cursor
  - **Problem solved**: Operators were assigning lanes/referees to pending matches, blocking those resources from ready matches
  - **User benefit**: Lanes and referees only show as "assigned" when actually in use by ready or live matches
  - **Consistent pattern**: Aligns with disabled "Start Match" button behavior for pending matches
  - **Applies to**: Tournament bracket view only (Match Command Center doesn't show pending matches)
  - **Implementation**: Added `disabled` attribute and visual styling in bracket rendering (bracket-rendering.js:1075-1076, 1101-1102)
  - **Real-world tested**: Fix identified through live tournament operations where resource confusion occurred

### Enhanced: Read-Only Tournament Protection
- **Player statistics locked for loaded completed tournaments**
  - Clicking player names in Results Table, Match Controls, or Winner Confirmation dialogs does nothing when `tournament.readOnly === true`
  - Silent behavior - no alert, no modal, no feedback
  - Prevents accidental modification of historical tournament data
  - **Read-only condition**: Tournament must be both loaded from file AND completed
  - **Escape hatch**: Use "Reset Tournament" to clear read-only flag and make tournament editable
  - **Applies to**: All entry points to player statistics editing (Results Table rows, Match Controls player names, Winner Confirmation player names)
  - **Implementation**: Single check in `openStatsModal()` function (player-management.js:431-433)

### Fixed: Score Preservation and Dialog Flow in Winner Confirmation
- **Match score values now preserved when editing player statistics, with correct dialog restoration**
  - When clicking player names in Winner Confirmation dialog to edit stats, the leg scores (e.g., 3-1) are now saved and restored
  - Closing stats modal now properly returns to Winner Confirmation (not Match Controls)
  - Previously, scores would reset to default values (e.g., 2-0) when returning from stats modal
  - **Root cause**: Dialog stack restore function was re-initializing input fields; custom Escape handler conflicted with dialog stack Escape handling
  - **Solution**:
    - Changed dialog stack restore function to only show modal without reinitializing fields
    - Integrated stats modal properly with dialog stack instead of manual modal management
    - Enabled Escape key via dialog stack for winner confirmation, removed conflicting custom Escape handler
    - Save and restore input values after dialog stack restoration completes
  - **Implementation**: Enhanced `openStatsModalFromConfirmation()` and `showWinnerConfirmation()` in clean-match-progression.js:1570-1681, 2195-2229

### Enhanced: Tournament Bracket - Smooth Hover Zoom for LIVE Matches
- **LIVE matches now have smooth zoom transition on hover, matching other match states**
  - Removed pulsing animation from LIVE matches that conflicted with hover zoom
  - LIVE matches now smoothly zoom in when hovered (at zoom levels < 1.0) with consistent 0.3s transition
  - Previously, LIVE matches would "pop" to zoomed state without transition to avoid horrible pulsating zoom effect
  - **Visual distinction maintained**: LIVE matches still prominent with orange gradient background, thicker orange border (3px), and orange glow on hover
  - **Rationale**: Pulse animation was visually noisy and caused disorienting pulsating zoom when hovering over tiny match cards while zoomed out
  - **Implementation**: Removed `animation: pulse 2s infinite` from `.match-live` in css/styles.css:844
  - **User impact**: Consistent, smooth hover zoom behavior across all match states. Cleaner, more professional tournament bracket interaction.

### Enhanced: Tournament Bracket - READY Match Border Color
- **READY match border changed to yellow-gold for better visual distinction**
  - Border color changed from dark brown (`rgba(180, 83, 9, 0.9)`) to yellow-gold (`rgba(240, 196, 25, 0.9)`)
  - Yellow-gold border complements the yellow gradient interior and clearly distinguishes READY matches from LIVE matches (orange)
  - Maintains 90% opacity for subtle transparency consistent with original design
  - Hover state changes to fully opaque yellow-gold for clear interaction feedback
  - **Rationale**: With pulse animation removed from LIVE matches, the dark brown READY border was too similar to LIVE orange border, causing visual confusion
  - **Implementation**: Updated `.match-ready` border colors in css/styles.css:831-836
  - **User impact**: Clear visual hierarchy across match states - yellow for READY, orange for LIVE. More intuitive and cohesive bracket appearance.

### Enhanced: Tournament Bracket - Simplified Finals Match Styling
- **Removed all special styling for finals matches (BS-FINAL, GRAND-FINAL)**
  - Finals matches now use standard state-based styling like all other matches
  - PENDING: Gray, READY: Yellow, LIVE: Orange, COMPLETED: Green
  - No special borders, backgrounds, or visual treatments
  - **Rationale**: Physical placement in the tournament bracket is sufficient distinction. Special styling added complexity and created confusing edge cases (finals looking READY when LIVE, etc.)
  - **Previous behavior**: Finals had special cream/yellow gradients and custom borders that required `:not(.match-live)` selectors and explicit LIVE overrides to prevent visual confusion
  - **New behavior**: Completely consistent visual language across entire bracket - state colors mean the same thing everywhere
  - **Implementation**: Removed `.backside-final-match` and `.grand-final-match` styling rules from css/styles.css
  - **User impact**: Simpler, more predictable bracket appearance. Match state is immediately clear regardless of position. Finals are distinguished by their prominent position at the end of the bracket, not by visual decoration.

---

# 2025-10-12

## **v2.5.0** - Developer Console

### New Feature: Developer Console
- **Hidden developer tool for real-time tournament diagnostics**
  - **Purpose**: Monitor tournament health, run validation checks, and execute developer commands without browser console
  - **Access**: Enable in Config → User Interface → "Enable Developer Analytics", then click version number in Tournament Status Panel
  - **Design**: Large modal (90% screen) with three-pane layout:
    - Left pane (30%): Statistics and commands
    - Right pane content area (49%): Dynamic detail views
    - Right pane console footer (21%): Persistent console output (always visible)
  - **Auto-refresh**: Updates every 2 seconds (pauses while scrolling)
  - **Settings take effect immediately**: No browser refresh required when enabling/disabling Developer Analytics

#### Statistics (Real-time Monitoring)
- **Transaction Health**: Shows current usage (X/500) with health indicators (✅ <50%, ⚠️ 50-80%, 🔴 >80%)
- **Match State**: Breakdown of completed/live/ready/pending matches (click to view match IDs by state)
- **Player Count**: Paid vs unpaid players (click to view complete alphabetically sorted player list with IDs)
- **Lane Usage**: Current lane utilization with conflict detection (✅/⚠️), respects excluded lanes from Config

#### Validation Checks (6 Total)
1. **Lane Assignments**: Detects overlapping lane assignments for LIVE matches
2. **Referee Assignments**: Detects referees playing in matches they're refereeing
3. **Match State Integrity**: Verifies completed matches have winner/loser assigned
4. **Transaction Count**: Warns if approaching 500-entry limit (>80%)
5. **Player ID Integrity**: Detects orphaned player references in matches array (excludes walkover-*, bye-*, tbd-*, and placeholder IDs)
6. **Progression Integrity**: Verifies winners/losers are in correct downstream matches per MATCH_PROGRESSION rules

#### Developer Commands
- **Re-render Bracket**: Force visual refresh of bracket display (`renderBracket()`)
- **Recalculate Rankings**: Recompute all player placements (`calculateAllRankings()`)
- **Refresh All Dropdowns**: Update lane and referee dropdown options
- **Validate Everything**: Run all 6 validation checks, display results in right pane, log summary to console with pass/fail details
- **View Transaction History**: Display all transactions (latest first) with timestamp, type, and description
- **View Match Progression**: Display MATCH_PROGRESSION lookup tables for current bracket size

#### Console Output Footer (Persistent)
- **Always visible**: Console output footer shows last 50 entries at bottom 30% of right pane
- **Real-time updates**: Auto-refreshes every 2 seconds with new console.log entries
- **Auto-scroll**: Scrolls to bottom when new entries appear (pauses while user scrolling)
- **Smart capture**: Only intercepts console.log while Developer Console is open
- **Buffer**: Stores last 100 entries in memory, displays last 50 with timestamps
- **Independent scrolling**: Console footer scrolls separately from content area above
- **Benefits**: Monitor command execution in real-time without switching views or using browser developer tools

#### Technical Implementation
- **Files Added**:
  - `analytics.js` - Complete analytics system (console capture, validations, commands, UI management, persistent footer)
  - `Docs/ANALYTICS.md` - Comprehensive documentation (1000+ lines: features, use cases, troubleshooting, extension guide, future improvements)
- **Files Modified**:
  - `tournament.html` - Added analytics modal HTML (90% layout, three-pane design with persistent console footer) + script tag + developerMode checkbox in Config
  - `results-config.js` - Added `globalConfig.ui.developerMode` (default: false) with save/load persistence + watermark refresh on save for immediate effect
  - `tournament-management.js` - Made version number clickable when developerMode enabled, reads directly from localStorage to avoid script loading order issues
  - `styles.css` - Fixed pointer-events to allow version number clicks despite bracket viewport grab cursor, added analytics modal CSS overrides (90% height, 1% margin)
  - `dynamic-help-system.js` - Updated Config page help to document Developer Analytics feature
- **Global Functions**: All analytics functions accessible via window object for browser console debugging
- **Dialog Stack Integration**: Uses pushDialog/popDialog for proper z-index management and Escape key support
- **Smart Auto-refresh**: Updates left pane statistics + console footer every 2 seconds, only refreshes right pane Quick Overview (other views stay static for readability)
- **Three-pane Layout**: Left 30% (stats/commands), Right content 49% (detail views), Right footer 21% (persistent console)

#### Use Cases
- **Live monitoring**: Keep console open during tournament to watch transaction health, match state, and console activity in real-time
- **Issue diagnosis**: Run validation checks to identify lane conflicts, progression errors, or data corruption
- **Command execution**: Execute commands and monitor output in persistent console footer without switching views
- **Debug workflow**: Validation results and command execution logs appear immediately in always-visible console footer

---

# 2025-10-11

## **v2.5.0** - Undo System Fixes

### Undo System Improvements

#### Fixed History Pruning Bug (Bug B)
- **Increased MAX_HISTORY_ENTRIES from 50 to 500**
  - **The problem**: History limit of 50 caused premature pruning in 32-player tournaments
  - **Impact**: Early matches (FS-R1, FS-R2) would lose their COMPLETE_MATCH transactions after ~30-40 matches completed
  - **Result**: Matches without transactions in history appeared non-undoable, even when they should be undoable
  - **The solution**: Increased limit to 500 transactions
    - 32-player bracket generates ~169 total transactions in typical tournament (62 matches + ~107 operational changes)
    - 500 provides 196% buffer for tournaments with heavy lane/referee management
    - All matches now remain undoable throughout the entire tournament

#### Fixed Transaction Type Confusion Bug (Bug A)
- **Added transaction type filtering to downstream blocking checks**
  - **The problem**: Downstream blocking check used `history.find(t => t.matchId === targetMatchId)` which returned the newest transaction for a match, regardless of type
  - **Impact**: When completed matches had operational transactions (ASSIGN_LANE, ASSIGN_REFEREE) after COMPLETE_MATCH, the check would find the wrong transaction type
  - **Result**: Matches with completed MANUAL downstream matches incorrectly showed as undoable (observed in BS-R3 → BS-R4 scenarios)
  - **The solution**: Added `&& t.type === 'COMPLETE_MATCH'` filter to 4 locations in `isMatchUndoable()` and `getDetailedMatchState()` functions
    - Lines 1934, 1946 (isMatchUndoable winner/loser checks)
    - Lines 3695, 3707 (getDetailedMatchState winner/loser checks)
  - **Result**: Downstream blocking check now correctly finds COMPLETE_MATCH transactions only, ignoring operational transactions

### Documentation
- Updated `Docs/UNDO.md` with comprehensive undo system documentation
  - Added "Transaction History Storage and Limits" section explaining MAX_HISTORY_ENTRIES and pruning behavior
  - Added "Match Undoability Rules" section documenting complete logic for when matches can/cannot be undone
  - Expanded transaction structure to show all fields (type, description, beforeState)
  - Documented all 5 transaction types (COMPLETE_MATCH, START_MATCH, STOP_MATCH, ASSIGN_LANE, ASSIGN_REFEREE)
  - Documented Bug A (transaction type confusion) with example scenario and fix details
  - Included 4 detailed example scenarios covering common undoability cases

### Files Modified
- `clean-match-progression.js` - Increased MAX_HISTORY_ENTRIES from 50 to 500
- `bracket-rendering.js` - Added transaction type filtering to 4 locations (lines 1934, 1946, 3695, 3707)
- `Docs/UNDO.md` - Comprehensive documentation of undo system behavior and limits

# 2025-10-10

## **v2.5.0** - Distributed Seeding & Visual Consistency

### Tournament Seeding Improvements
- **Distributed BYE Placement**: Replaced sequential seeding with randomized BYE distribution
  - BYEs now randomly scattered across all FS-R1 matches instead of clustering at bottom
  - Each BYE randomly placed in either player1 or player2 slot within a match
  - **Critical fairness fix**: Old sequential system created guaranteed systematic advantage
    - **The problem**: Sequential seeding clustered BYEs at bottom of FS-R1 (matches 12-16 in 32-bracket)
    - **The chain reaction**: Bottom BYEs → bottom FS-R2 BYEs → 5 guaranteed BYE-vs-BYE matches in bottom BS-R1
    - **The unfair advantage**: Mirroring places FS-R2 top-half losers into BS-R2 bottom-half positions
    - **The collision**: FS-R2 top-half losers faced walkover-advanced opponents; bottom-half losers faced real winners
    - **Result**: Losing in top half of FS-R2 was predictably easier than losing in bottom half - every single tournament
  - **The solution**: Distributed seeding eliminates this structural bias
    - Example (22 players, 32-bracket): Old system guaranteed 5 BYE-vs-BYE matches in BS-R1
    - New distributed system typically produces 2-4 BYE-vs-BYE matches, randomly distributed
    - Walkover opponents appear unpredictably throughout BS-R2, not concentrated in specific regions
    - No correlation between FS-R2 bracket position and BS-R2 opponent difficulty
    - Fewer wasted walkover matches overall, more real competitive matches throughout tournament
  - Still guarantees no BYE-vs-BYE matches in FS-R1 (max 1 BYE per match)
  - Instant execution across all bracket sizes (8, 16, 32 players)
  - Mathematical guarantee: minimum players equals number of matches, ensuring algorithm always succeeds
  - Every bracket generation produces unique, random BYE distribution
  - Eliminates both the actual systematic advantage and the visual appearance of unfairness

### Visual Consistency
- Improved the design and colors of player cards in the Registration page
- Removed green borders from "In Tournament" cards (now use neutral gray like "Available Players")
- Removed checkmarks from Saved Players cards (section headers provide sufficient context)
- Normalized text styling across all player cards (consistent font weight and color)
- Maintained subtle visual distinction with light green background (#f0fdf4) for "In Tournament" cards
- Cleaner, more professional appearance while preserving functional separation

### Files Modified
- `clean-match-progression.js` - Replaced two-pass sequential seeding with distributed random BYE placement algorithm
- `player-management.js` - Removed checkmark rendering, updated card styling
- `styles.css` - Updated border colors and text styling for Saved Players cards
- `main.js` - Version bump to 2.5.0-beta

# 2025-10-09

## **v2.4.4** - Registration Page Workflow fixes
- The "x" for removing tournament players are now hidden for participants that have paid the entrance fee
- A confirmation/warning dialog is shown when removing paid players from the Saved Players column
- Updated the help section to reflect the Registration page redesign
- Added hints/instructions to the Registration page headers

## **v2.4.3** - Registration Page Redesign & Tournament Interface Improvements

### Registration Page Redesign
- **Context-Aware Two-Column Layout**: Eliminated confusing tab interface in favor of intelligent, state-aware display
  - Left column: Tournament Players (always visible during setup and active tournament)
  - Right column: Contextual content that adapts to tournament state
    - **Setup mode**: Displays Saved Players for quick player management
    - **Active/Completed mode**: Automatically switches to Tournament Results
  - Instant switching when bracket is generated - no manual tab navigation required
  - Cleaner, more intuitive workflow aligned with natural tournament progression
- **Saved Players Section Reorganization**: Two-section layout with clear visual hierarchy
  - **Available Players** section at top: Players not yet added to current tournament
  - **In Tournament** section below: Players already added to tournament (with checkmarks)
  - Both sections display in 4-column grid for efficient space usage
  - Players dynamically move between sections when clicked (add/remove from tournament)
  - Click available player to add → moves to "In Tournament" section
  - Click tournament player to remove → moves back to "Available Players" section
  - Clean section headers with subtle styling matching app design language
- **Improved Delete Functionality**: Context-aware deletion with clear user intent
  - Delete button (`×`) only visible for Available Players (hidden for In Tournament players)
  - Prevents accidental deletion of players currently in use
  - Hover tooltip: "Remove from saved players" clarifies permanent deletion
  - Confirmation dialog with clear messaging: "This permanently deletes them from your saved players list"
  - Immediate UI update after deletion (fixed bug in renderPlayerList callback)
- **Visual Polish**: Consistent header styling and improved alignment
  - Tournament Players and Saved Players headers match styling (60px height, #f5f5f5 background)
  - Player count removed from headers for cleaner appearance
  - "Saved Players" replaces ambiguous "Player List" naming
  - Import helper text: "Import from tournament export file" clarifies functionality
  - Delete button styled to match Tournament Players remove buttons (24×24px red outline)
- **Streamlined Player Management**: No more confusion between Tournament and Player List tabs
  - Context makes it obvious: setup shows saved players, active tournament shows results
  - Single-click add/remove between Available and In Tournament sections
  - Visual feedback with checkmarks and green backgrounds for added players
  - No confirmation dialogs for add/remove (fast workflow), confirmation only for permanent deletion
- **Intelligent State Management**: UI adapts automatically to tournament lifecycle
  - Page navigation triggers layout update to show correct content
  - Bracket generation automatically switches right column to results
  - Layout updates propagate through addPlayer, removePlayer, and tournament state changes
  - Seamless experience throughout tournament creation and execution

### Visual Enhancements
- **Match Card Score Display**: Completed matches now display final score in match header
  - Active matches show: `L: 7 | Bo3`
  - Completed matches show: `Result: 2-0`
  - Score replaces lane/Bo3 info when match is complete (contextually relevant)
  - Score numbers prominently styled: 20px, bold, green (#059669), monospace font with subtle shadow
  - "Result:" label sized at 16px for clear hierarchy
  - Match ID sized at 15px for balanced header composition
  - Score automatically reverts to lane/Bo3 display when match is undone
  - Elegant use of existing space without layout changes
- **Finals Match Round Indicators**: Simplified round indicator labels for finals matches
  - BS-FINAL and GRAND-FINAL now show "FINALS" instead of repeating match ID
  - Eliminates redundancy and frees up header space
  - Allows consistent 15px match ID sizing across all match cards including finals
- **Consistent Score Ordering**: Match scores now display in Player1 vs Player2 order across all displays
  - New `formatMatchScore()` helper function provides single source of truth for score formatting
  - Scores consistently show actual player order (e.g., if Player2 won 2-1, shows "1-2" not "2-1")
  - Applied uniformly to bracket match cards and Match Results page
  - Eliminates confusion when winner is Player2
- **Walkover Match Display**: Completed walkover matches now display "W/O" instead of lane/Bo3 info
  - Bracket match cards show "W/O" in header for auto-completed walkover matches
  - Match Results page shows "(W/O)" instead of arbitrary score numbers
  - Provides clear visual indication that match was won by walkover, not played
  - Uses same `formatMatchScore()` helper for consistent handling across all displays
- **Walkover Player Styling**: Walkover players now have consistent, context-aware styling across all match states
  - Completed matches: Walkover players display with green background matching completed match styling
  - Pending/waiting matches: Walkover players blend seamlessly with normal match card backgrounds
  - Player1 walkovers maintain pinkish background and orange left border in pending matches
  - Player2 walkovers have transparent background in pending matches
  - Eliminates visual inconsistencies where walkovers appeared in different colors across tournament bracket

### User Experience Improvements
- **Match Card Hover State Preservation**: Match cards maintain zoom state when changing lane or referee assignments
  - Removed unnecessary full bracket re-renders from lane/referee update functions
  - Only dropdown options refresh across all matches (conflict detection maintained)
  - Eliminates visual interruption and bracket blinking during dropdown changes
  - Zoom naturally ends when mouse leaves card boundaries (expected behavior)
  - Smoother, more responsive user experience when managing match details
- **Bracket Zoom Step Adjustment**: Increased zoom step from 0.015 to 0.025
  - Better balance between precision and speed for mouse wheel users
  - Still provides smooth, precise control compared to original 0.05 step
  - Maintains excellent trackpad experience while improving mouse wheel responsiveness
- **Bracket Home Button Synchronization**: Home button now resets to bracket-size-specific default views
  - 32-player brackets: Returns to optimal overview zoom (0.33) with centered positioning
  - 16-player brackets: Returns to optimized default view (0.45 zoom)
  - 8-player brackets: Returns to optimized default view (0.61 zoom)
  - Matches the initial bracket render positioning for consistent "home" behavior
  - Eliminates confusion when home button returned to different view than initial load

### Files Modified
- `tournament.html` - Removed tab structure, implemented two-column context-aware layout, removed player count from headers, added import helper text, changed container from grid to block element
- `player-management.js` - Added updateRegistrationPageLayout() for context switching, renamed renderPlayerListTab() to renderPlayerList(), separated players into availablePlayers and inTournamentPlayers arrays, conditional delete button rendering with tooltip, added confirmation dialog for deletion, fixed renderPlayerList callback bug
- `bracket-rendering.js` - Added conditional score display in match headers, removed renderBracket() calls from updateMatchReferee(), added refreshAllRefereeDropdowns() when clearing referee, updated to use formatMatchScore() helper, added walkover check to display condition, updated player class assignment to include both 'bye' and 'first-throw' for Player1 walkovers, updated resetZoom() to use bracket-size-specific default positions
- `clean-match-progression.js` - Removed renderBracket() call from updateMatchLane(), added updateRegistrationPageLayout() call after bracket generation
- `main.js` - Added formatMatchScore() helper function with walkover detection, updated Match Results to use consistent score ordering, updated showPage() to call updateRegistrationPageLayout() and renderPlayerList() for registration page, version bump to 2.4.3
- `styles.css` - Restructured .match-player.bye styling to only apply green background in completed matches, removed old tab styles, added saved-players-section and saved-players-section-header styles, updated player-list-header to match column header height (60px), simplified delete button styling

# 2025-10-05

## **v2.4.2** - Bracket Zoom & Interface Polish

### Bracket Controls
- **Improved Zoom Precision**: Reduced zoom step from 0.05 to 0.015 for smoother, more precise control
  - 70% finer zoom increments allow better positioning of large 32-player brackets
  - Smooth zoom experience in Chrome, significantly improved in Safari
  - Optimal for trackpad and mouse wheel control
- **Safari Motion Blur Fix**: Removed CSS transition causing motion blur during zoom/pan
  - Added `will-change: transform` for better performance
  - Eliminated laggy, blurred rendering during bracket navigation
- **Fixed Initial Snap**: Added `updateCanvasTransform()` call when rendering bracket
  - Eliminates jarring zoom/pan snap on first interaction
  - Bracket now displays consistently from page load
- **Smart Default Positioning**: Bracket-size-specific default zoom and pan settings
  - 32-player: zoom 0.32, centered to show full bracket overview with section titles
  - 16-player: optimized zoom and centering for medium brackets
  - 8-player: optimized zoom and centering for small brackets
  - Shows Frontside Round 1 (where action starts) prominently on initial load
- **Tournament Reset Fix**: Default zoom/pan now applies correctly when switching bracket sizes
  - Reset `initialBracketRender` flag in `confirmReset()`
  - Changing from 32→16→8 player brackets now uses correct initial view for each size

### Visual Enhancements
- **Match Card Zoom Depth Effect**: Added visual depth when hovering over match cards while zoomed out
  - Zoomed match enhanced with dramatic shadow (0 20px 60px rgba(0,0,0,0.5))
  - Other matches dimmed (opacity 0.6) and blurred (0.5px) for focus effect
  - Main labels (tournament header, FRONTSIDE, BACKSIDE, FINALS) remain sharp
  - Only activates when bracket zoom < 1.0x for better readability at reduced zoom levels
  - Creates clear visual hierarchy emphasizing the match being inspected

### Interface Improvements
- **Clearer Player List Instructions**: Better guidance when the Player List is empty
- **Fixed Configuration Page Alignment**: Config page elements now properly align with page header
  - Removed excessive padding causing misalignment with "Tournament Configuration" header
  - Consistent layout with Setup and Registration pages

### Bug Fixes
- **8-Player Bracket Line Positioning**: Fixed loser feed lines extending inside FS-R1 match cards
  - Root cause: Backside rendering function incorrectly calculating `round1X` with extra horizontal spacing
  - Lines now cleanly start from left edge of frontside matches as intended
  - Vertical line positioning adjusted to -40px for optimal visual appearance
  - Matches visual consistency of 16/32-player bracket line rendering

### Files Modified
- `bracket-rendering.js` - Zoom step reduction (0.015), removed requestAnimationFrame throttling, added updateCanvasTransform() call, bracket-size-specific default zoom/pan settings, reset flag handling, match hover depth effect, fixed 8-player round1X calculation
- `bracket-lines.js` - Updated 8-player loser feed line positioning, added label IDs for blur exclusion
- `styles.css` - Removed CSS transition from `.bracket-canvas`, added `will-change: transform`, fixed `.config-sections-container` padding
- `tournament-management.js` - Reset `initialBracketRender` flag in `confirmReset()`

# 2025-10-03

## **v2.4.1** - Visual Polish & Typography

### Visual Enhancements
- **Subtle Depth**: Added subtle box shadows (`0 4px 12px rgba(0, 0, 0, 0.06)`) to all main content boxes
  - Applied to: Setup page header and columns, Registration page header and columns, Config page header and sections
  - Purpose: Provides gentle depth perception while maintaining flat design aesthetic
  - Creates visual hierarchy: background → elevated content boxes → interactive elements

### Typography
- **Droid Serif Title Font**: Application title now uses Droid Serif for a professional, editorial feel
  - Hosted locally in `/fonts` folder for offline functionality
  - Applied only to main application header (`.header h1`)
  - Creates visual anchor while keeping interface clean and functional
  - Adds formality without disrupting the modern, workflow-focused design

### UX Improvements
- **Player List Tab Order**: Swapped tab order in Registration page for better workflow
  - "Player List" tab now appears first (left) and is selected by default
  - "Tournament" tab second (right)
  - More intentional workflow: start with registry → add players → manage tournament
- **Alphabetical Sorting**: Player List now displays in alphabetical order
  - Case-insensitive sorting using `localeCompare()` for proper language-specific ordering
  - Makes scanning long player lists much easier
  - Sorted on display only - storage order unchanged

### Branding
- **Favicon**: Added favicon support using existing logo file
  - Automatically uses `logo.jpg` from root folder
  - Appears in browser tab for easy identification
  - Updates automatically when logo file is replaced

### Files Modified
- `styles.css` - Added @font-face declarations for Droid Serif, box-shadow to `.scrollable-column`, `.setup-page-header`, `.registration-page-header`, `.config-page-header`, `.config-section`
- `tournament.html` - Removed Google Fonts links, swapped tab order, adjusted default active states, added favicon link
- `main.js` - Added Player List tab initialization when showing registration page
- `player-management.js` - Added alphabetical sorting to `renderPlayerListTab()`
- `fonts/` - Added DroidSerif-Regular.ttf and DroidSerif-Bold.ttf

## **v2.4.0** - Player List Registry & UI Polish

### 🎉 New: Player List Registry

A new Player List feature helps maintain consistency across weekly tournaments by creating a persistent registry of regular players.

#### Player List Features
- **Automatic Addition**: Players added to tournaments are automatically saved to the Player List
- **Quick Add**: Click [+ Add] to quickly add players from the list to current tournament
- **Manual Curation**: Remove players from list with [× Delete] button
- **Visual Indication**: Green checkmark and bold text show which players are in the current tournament
- **Import/Export**: Player List included in tournament JSON exports with merge/replace options on import
- **Tab Interface**: Clean tab system in Registration page separates tournament players from the registry

#### Technical Implementation
- **localStorage Persistence**: Simple array stored in `playerList` key
- **Case-Insensitive Matching**: Prevents duplicate entries with different capitalization
- **Context-Aware Buttons**: [+ Add], [- Remove], [× Delete] appear based on player state
- **Additive Workflow**: Import offers "merge" or "replace" options with clear messaging

### Server Settings
- **Shared Tournament Delete Permission**: New config setting to control delete button visibility for shared tournaments
  - **Default**: Disabled (delete buttons hidden)
  - **Purpose**: Prevents accidental deletion on hosted deployments
  - **Location**: Config page → UI Settings → Server Settings
  - **Behavior**: When disabled, only Load buttons appear for shared tournaments

### UI Improvements
- **Tournament Results Table**: Now properly hides when no paid players exist, showing clean "No players added yet" message
- **Match Results Humanization**: Setup page Match Results now shows "Grand Final" and "Backside Final" instead of technical IDs (GRAND-FINAL, BS-FINAL)
- **Context-Aware Display**: Statistics modal maintains original table-based empty state display

### Files Modified
- `main.js` - Version bump to 2.4.0, added `humanizeMatchId()` function for human-readable match progression
- `player-management.js` - Player List localStorage functions, tab switching, auto-add logic, import/export
- `tournament-management.js` - Export includes Player List, import shows merge/replace dialog, conditional delete button rendering
- `tournament.html` - Tab interface for Registration page, Player List container, empty message element for results table, server settings checkbox
- `styles.css` - Tab styling, Player List item styling with green "in tournament" state
- `results-config.js` - Context-aware empty state handling, server settings in DEFAULT_CONFIG, save/load server settings
- `dynamic-help-system.js` - Updated Registration page help with Player List documentation

---

# 2025-10-02

## **v2.3.0** - Optional Server Features (Shared Tournaments)

### 🎉 New: Server-Enhanced Tournament Sharing (Optional Feature)

When deployed to a PHP-enabled web server, the application now supports shared tournament hosting - a completely optional feature that activates automatically when server dependencies are met. Local-only usage remains fully functional with zero changes.

#### Shared Tournament Features
- **Browse Server Tournaments**: Automatically displays "Shared Tournaments" section when server API is available
- **Upload to Server**: File picker-based upload (similar to Import workflow) for sharing completed tournaments
- **Delete Server Tournaments**: Remove tournaments from server with confirmation dialog
- **Graceful Degradation**: Features appear only when server is configured; local users see no difference
- **Visual Distinction**: Shared tournaments display with light blue background, sorted by date (newest first)
- **Unicode Support**: Full support for international characters (Norwegian, Swedish, Danish, etc.) in tournament names

#### Technical Implementation
- **REST API Foundation**: Three PHP endpoints in `/api` directory
  - `GET /api/list-tournaments.php` - List available tournaments
  - `POST /api/upload-tournament.php` - Upload tournament with validation
  - `POST /api/delete-tournament.php` - Delete tournament with confirmation
- **Security**: Filename validation, directory traversal prevention, CORS headers
- **Progressive Enhancement**: Server detection on page load, conditional UI injection
- **Zero Breaking Changes**: Core offline functionality completely preserved

#### Server Requirements (Optional)
- PHP 7.0+ with FastCGI/PHP-FPM
- Write permissions to `/tournaments` directory
- Web server (nginx, Apache, etc.)
- See `/api/README.md` for setup instructions

### Files Modified
- `main.js` - Version bump to 2.3.0
- `tournament-management.js` - Shared tournament loading, file-based upload, delete functionality, debug logging
- `tournament.html` - Upload file picker, conditional upload button placement
- `bracket-lines.js` - Fixed localStorage key for club name (dartsConfig)

### Files Added
- `api/list-tournaments.php` - List tournaments endpoint
- `api/upload-tournament.php` - Upload tournament endpoint with Unicode support
- `api/delete-tournament.php` - Delete tournament endpoint
- `api/README.md` - Server setup documentation and API reference

---

## **v2.2.1** - Polish and Bug Fixes

### Visual Improvements
- **Match Progression Text Styling**: "Leads to..." text in Match Controls cards now uses normal font weight and muted gray color (#6b7280) for better visual hierarchy, distinguishing it from the bold match ID

### Bug Fixes
- **Tournament Header Branding**: Fixed custom club names not displaying in tournament bracket header
  - Root cause: Incorrect localStorage key reference (`globalConfig` vs `dartsConfig`)
  - Tournament headers now properly show configured club name in "Club Name - Tournament Name" format
  - Branding updates now trigger bracket re-render for immediate visual feedback

### Files Modified
- `main.js` - Version bump to 2.2.1, application identity encoding
- `bracket-rendering.js` - Match progression text styling, identity validation
- `bracket-lines.js` - Fixed localStorage key for club name retrieval
- `results-config.js` - Added bracket re-render on branding save, default club name fallback
- `tournament.html` - Application identity initialization
- `styles.css` - Integrity hash comment

---

# 2025-10-01

## **v2.2.0** - Minimalistic Flat 2D Design

### Visual Framework Refinements
- **Consistent Border Hierarchy**: Implemented three-tier border system throughout application
  - Main containers: Bold dark borders (`#666666`) for strong visual structure
  - Section headers: Subtle light borders (`#e8e8e8`) for gentle separation
  - Internal elements: Light borders for organization without visual clutter
- **Enhanced Border Contrast**: Added dark borders to footer and main page containers matching header styling
- **Fixed Double Border Issues**: Resolved thick border appearance on column headers caused by conflicting border styles
- **Perfect Text Alignment**: Fixed vertical centering issues in all section headers across Setup, Registration, and Config pages

### Config Page Organization
- **Logical Section Grouping**: Reorganized Config page for better workflow
  - Left Column: Logo, Branding, Lane Management, User Interface
  - Right Column: Match Configuration, Point Values
- **Improved Information Architecture**: Physical/hardware settings grouped with UI preferences, while game rules and scoring grouped together

### Registration Page Fixes
- **Table Width Resolution**: Fixed Tournament Results table not extending to full container width using hidden 10th column technique
- **Container Padding Restoration**: Restored proper 24px padding for symmetric spacing throughout Registration page

### Complete Flat Design Unification
- **Eliminated All Rounded Corners**: Removed remaining `border-radius` from all interface elements for complete geometric consistency
  - Recent Tournaments items: Removed 5px rounded corners
  - Match Results cards: Changed from 8px to 0px border-radius
  - Tournament bracket match cards: Changed from 10px to 0px border-radius
  - Tournament control buttons: Changed from 10px to 0px border-radius (Stats/Results, Match Controls, Players/Points, zoom controls)
  - Match Controls (Active): Flattened Start/Stop Match buttons, Referee Suggestion items, and match cards
  - Match Controls (Celebration): Flattened Tournament Achievements items, Export button, Tournament Highlights container and stat boxes
  - **Podium Exception**: Kept rounded corners on celebratory podium stands and player name boxes for visual appeal
- **Visual Harmony Achieved**: Every functional element uses sharp, angular geometry; decorative celebration elements retain subtle rounding

### Match Controls Enhancements
- **Match Progression Information**: Added "Leads to..." text to match card headers showing tournament progression (e.g., "BS-2-2 • Leads to BS-3-1")
- **Intelligent Display**: Progression info shows destination matches or "tournament completion" for final matches
- **Compact Integration**: Progression text appears inline with match ID in bold, maintaining clean layout

### Setup Page Polish
- **Match Results Padding**: Added 8px horizontal padding to player information lines for better text breathing room within cards
- **Match Header Corners**: Removed rounded corners from match card headers for consistency with flat design

### Celebration Mode Refinements
- **UI Cleanup**: Hidden redundant "💾 Export Data" header since Export button already displays this information
- **Consistent Flattening**: Applied flat design to all celebration UI except decorative podium elements

### Technical Improvements
- **CSS Cleanup**: Removed duplicate and conflicting border definitions that caused inconsistent styling
- **Border Optimization**: Changed column headers from full borders to bottom-only borders to prevent double-border effects
- **Padding Standardization**: Unified header padding (`0 24px` for columns, `16px 24px` for config sections) for perfect vertical centering
- **Table Structure Enhancement**: Added hidden column to fix complex table width calculation issues
- **CAD-style Info Box**: Increased size by 20%

### Files Modified
- `styles.css` - Border hierarchy, table fixes, complete border-radius elimination, match result padding
- `tournament.html` - Config page reorganization, table structure enhancement
- `tournament-management.js` - Removed inline border-radius from tournament items
- `results-config.js` - Updated table generation for proper width behavior
- `bracket-rendering.js` - Match progression display, celebration UI cleanup

This update achieves complete flat design transformation across ALL pages (Setup, Registration, Config, Tournament, Match Controls, Celebration) with unified visual language, enhanced match information display, resolved layout issues, and refined organizational structure for optimal usability.

## **v2.2.0-beta** - Professional Border System & Visual Consistency Improvements

### UI Redesign - Core Pages
- **Setup, Registration, Config Pages**: Complete redesign following new flat 2D design principles
  - Removed all rounded corners, gradients, and shadows for pure flat aesthetic
  - Implemented consistent spacing system (24px primary, 16px secondary, 8px tight)
  - Standardized element heights (44px interactive elements, 60px headers, 72px content rows)
  - Applied muted monochromatic color palette with selective green/amber/red accents
  - Fixed padding issues across pages ensuring content extends to edges properly
  - Registration page: Fixed scrolling behavior (removed fixed height constraint, entire page now scrolls naturally)

### Button System Overhaul
- **Flat Outline Buttons**: Replaced filled buttons with minimal outline style throughout application
  - Base: White background with 1px gray border
  - Hover: Subtle color-tinted backgrounds (#dcfce7 green, #fef3c7 amber, #fef2f2 red)
  - Updated all dialogs: Match Controls, Statistics, Confirm Winner, Reset Tournament, Delete Tournament, Undo Confirmation
  - Consistent styling across primary actions (green), warnings (amber), and destructive actions (red)

### Modal/Dialog Improvements
- **Comprehensive rounded corner removal** from all modal dialogs for design consistency:
  - Modal containers and all content boxes
  - Undo modal: match cards and "no matches" message box
  - Confirm Winner modal: match progression info box
  - Match Controls Setup stage: setup messages and Add Player input/button
  - All text/number/date inputs in modals (with browser-specific prefixes for maximum compatibility)
  - Import/Load Tournament modals: all info boxes and buttons
- **Enhanced button states**:
  - Edit Statistics dialog: Redesigned +/− buttons (24×24px) with red/green accents and proper hover effects
  - Reset Tournament dialog: Added visual feedback when enabled (amber background) with proper contrast
  - All Cancel buttons converted to flat outline style
- **Fixed alignment issues**: Vertically centered text labels using `transform: translateY()` approach

### Design System Documentation
- **DESIGN.md principles implemented**:
  - Minimalistic flat 2D aesthetic with no gradients or shadows
  - Muted color strategy with strategic accent usage
  - Fixed desktop-focused layouts with consistent spacing
  - Typography hierarchy with proper weight and size differentiation
  - Border-based hover feedback instead of background changes

### Technical Improvements
- **Removed duplicate CSS rules** causing override conflicts on Registration and Config pages
- **Cleaned up inline styles** in favor of reusable CSS classes
- **Consistent z-index management** for modal layering
- **JavaScript refactoring**: Removed inline background style manipulation in favor of CSS class-based styling

### Bug Fixes
- **Payment Status Protection**: Prevented paid/unpaid status changes during active or completed tournaments
  - Clicking player cards in active/completed tournaments now shows "Tournament in Progress" dialog
  - Protects tournament integrity and historical data from accidental modifications
  - Applies to both active tournaments and read-only completed tournaments

### Files Modified
- `styles.css` - Extensive redesign following flat 2D principles, comprehensive rounded corner removal
- `tournament.html` - Button updates, modal structure improvements, input field styling
- `tournament-management.js` - Reset button state management cleanup
- `player-management.js` - Added tournament status validation to togglePaid()
- `bracket-rendering.js` - Match Controls Setup stage rounded corner removal (Add Player section)
- `clean-match-progression.js` - Confirm Winner progression box styling updates
- Main pages (Setup, Registration, Config, Tournament) - Layout and spacing standardization

This release establishes a comprehensive design system foundation for the entire application, replacing the previous mixed aesthetic with a cohesive, professional flat 2D interface.

# 2025-09-29
## **v2.1.5-beta**
- Made the "Save Statistics" button in the Edit Statistics dialog respond to Enter

# 2025-09-28
## **v2.1.4** Visual Changes
- Changed "Awaiting Player" in matches with no assigned players italics and muted, to make it look less like a "real" player and improve visibility when zoomed out
- Changed the layout and font size/weight for players in the upcoming matches in Match Controls for better legibility

## **v2.1.3** Read-Only Tournament Protection & Critical Bug Fixes
- **Read-Only Tournament Protection**: Complete protection system for imported and loaded completed tournaments
  - Completed tournaments from files or localStorage automatically set to read-only
  - Comprehensive undo prevention: no undo styling, no clickable undo handlers, no undo modals
  - Clean status bar messaging: "Completed tournament: Read-only" for all match hovers
  - Early prevention: undo attempts blocked before any UI appears
  - Reset Tournament escape hatch available for modification needs
- **Persistent Read-Only State**: Read-only flag survives browser refreshes and navigation
  - Fixed critical bug where readOnly flag was lost on page reload
  - Ensured data integrity for shared tournament results
  - Maintains distinction between active tournaments (editable) and archived results (protected)

### Critical Bug Fixes
- **Fixed Tournament Loading Data Loss**: Tournaments loaded from localStorage were losing players/matches after browser refresh
  - Root cause: `continueLoadProcess()` wasn't including players/matches in tournament object structure
  - Solution: Added players/matches to tournament object and global array assignment
  - Impact: Loaded tournaments now survive page refreshes with complete data
- **Fixed Read-Only Persistence**: Read-only flag wasn't saved to localStorage, causing loss on refresh
  - Root cause: `saveTournamentOnly()` function missing readOnly field in saved object
  - Solution: Added `readOnly: tournament.readOnly` to tournament save structure
  - Impact: Read-only tournaments maintain protection across browser sessions
- **Fixed App Initialization**: Page startup wasn't preserving tournament readOnly flag or complete data
  - Root cause: `autoLoadCurrentTournament()` in main.js missing players, matches, and readOnly fields
  - Solution: Added complete tournament data structure matching import/load processes
  - Impact: All tournament data and protection state preserved on app startup
- **Fixed Status Panel Import Updates**: Status Panel wasn't updating when importing tournaments
  - Root cause: Import process missing `updateTournamentWatermark()` call
  - Solution: Added watermark update to `continueImportProcess()` display updates
  - Impact: Status Panel now updates immediately for both loading and importing operations

### Technical Implementation
- **Three-Layer Protection**: Read-only checks in `isMatchUndoable()`, `handleSurgicalUndo()`, and `getDetailedMatchState()`
- **Consistent Data Structure**: Unified tournament object structure across import, load, and initialization
- **Status Bar Integration**: Non-intrusive read-only messaging through existing status system
- **Complete Undo Prevention**: UI-level prevention (no styling) + interaction-level prevention (early blocking)

### Files Modified
- `tournament-management.js` - Read-only flags, complete data structures, Status Panel updates
- `bracket-rendering.js` - Undo prevention, status messaging, match state detection
- `main.js` - App initialization with complete tournament data preservation
- `clean-match-progression.js` - Read-only undo prevention
- `history-management.js` - Read-only undo prevention

This update ensures tournament result integrity while maintaining full functionality for active tournaments, with comprehensive bug fixes that resolve data loss and state persistence issues.

-----

# 2025-09-27

## **v2.1.2** CAD-Style Information Box Enhancements
- **Dynamic Progress Display**: Replaced static "DOUBLE ELIMINATION" text with real-time tournament progress
  - Active tournaments show "COMPLETED MATCHES: #" with live match completion count
  - Completed tournaments display winner recognition: "WINNER: WINNER NAME" in all-caps CAD style
  - Automatic state switching between progress tracking and winner display
- **Header Simplification**: Streamlined CAD header for better readability
  - Removed club name from header to focus on tournament name
  - Added automatic truncation for long tournament names (35+ characters)
  - Cleaner, more professional appearance with improved space utilization
- **Winner Name Formatting**: Enhanced winner display with proper CAD technical drawing aesthetics
  - First name + last initial format: "JOHN S." for space efficiency
  - All-caps formatting maintains consistent CAD style throughout
  - Handles edge cases like single names gracefully
- **Real-Time State Integration**: CAD box now fully integrated with tournament state system
  - Updates automatically during match completions and tournament progression
  - Responds to undo operations by reverting to appropriate display mode
  - Winner changes reflect immediately without page refresh

## **v2.1.1** Bugfixes
- CAD box was not dynamically updating
- CAD box has more transparency
- Status bar message was missing from GRAND-FINAL in 8 and 16-player brackets.

## **v2.1.0** Professional Tournament Management and CAD-Style Information Display

### Tournament Management Enhancements
- **Club Branding System**: Complete overhaul of application title configuration
  - Changed "Application Title" to "Club Name" in Config page for clearer purpose
  - Automatic title generation: "[Club Name] - Tournament Manager" format
  - Enhanced tournament bracket headers with club name integration
  - Tournament displays now show "Club Name - Tournament Name" with date
  - Legacy configuration support for seamless migration from previous versions

- **Round-Based Match Organization**: Revolutionary Command & Control Center interface
  - Match Controls dialog reorganized from bracket-side grouping to chronological rounds
  - Frontside and Backside matches unified by round progression (FS-R1, BS-R1, etc.)
  - LIVE matches remain prominent and unified at the top for immediate attention
  - Maintains all bracket context while improving operational flow
  - Reflects military Command & Control Center philosophy for tournament management

### Visual and Interface Improvements
- **CAD-Style Information Box**: Professional technical drawing aesthetic
  - Replaced simple tournament watermark with authentic CAD title block
  - Mixed-size cell structure mimicking engineering drawing standards
  - Positioned flush in bottom-right corner using viewport frame
  - Monospace typography (Courier New) for technical drawing authenticity
  - Consistent 1px line weights throughout grid structure
  - Real-time tournament data: club name, format, players, matches, date, version, status

- **Enhanced Tournament Bracket Positioning**: Improved visual hierarchy
  - Tournament title block repositioned 60px higher to eliminate overlap with bracket labels
  - Better integration of club name with tournament information
  - Maintains professional appearance while providing complete branding context

- **User Experience Refinements**: Clearer communication throughout interface
  - Replaced technical "TBD" with user-friendly "Awaiting Player" in match displays
  - Improved button color coding: Export (green), Import (orange), Reset (red) for risk indication
  - Celebration messages now count only paid players, removing "registered" terminology
  - Placement labels repositioned contextually above respective tournament rounds

### Technical Infrastructure
- **Robust Data Integration**: Enhanced tournament information accuracy
  - CAD information box reads real-time data from localStorage
  - Smart match counting excludes BYE matches, includes competitive matches only
  - Dynamic status tracking: SETUP → ACTIVE → COMPLETE based on match progression
  - Accurate player count using paid players only
  - Automatic bracket size detection and display

- **Configuration Migration**: Seamless transition from legacy settings
  - Automatic extraction of club names from old "Application Title" format
  - Fallback support ensures no data loss during configuration updates
  - Maintains backward compatibility while enabling new features

### Architectural Philosophy
This release embodies the **Command & Control Center** design philosophy:
- **Information at a glance**: CAD-style technical display provides comprehensive tournament status
- **Operational efficiency**: Round-based organization matches natural tournament flow
- **Professional appearance**: Technical drawing aesthetics convey competence and precision
- **Clear communication**: User-friendly terminology eliminates confusion
- **Brand integration**: Club identity seamlessly woven throughout tournament experience

---

# 2025-09-26

## **v2.0.3** Enhanced Bracket Interaction and User Experience

### New Interactive Features
- **Hover Zoom for Match Cards**: Revolutionary new feature for crowded bracket navigation
  - Automatically activates when bracket zoom level is less than 1.0x
  - 1-second hover delay prevents accidental triggers during navigation
  - Scales individual matches to 1.0x viewport size for perfect readability
  - Smooth CSS transitions with intelligent animation conflict resolution
  - Preserves all match interactions (winner selection, lane/referee assignment)
  - Seamless integration with existing live match pulse animations

### Enhanced Visual Elements
- **Directional Navigation Labels**: Added triangular arrows to bracket section headers
  - "FRONTSIDE ►" and "◄ BACKSIDE" for clear directional guidance
  - Professional triangular arrow symbols replacing basic text indicators
  - Maintains consistent styling with existing bracket typography

- **FINALS Label Addition**: Precisely positioned championship section identifier
  - Positioned directly above BS-FINAL match card with exact bracket rendering calculations
  - Consistent vertical alignment with FRONTSIDE/BACKSIDE labels
  - Uses same professional typography and styling standards

### User Experience Improvements
- **Intuitive Match Discovery**: Hover zoom eliminates fumbling when searching for specific matches
  - Natural user behavior (pausing cursor while looking) triggers helpful zoom
  - No learning curve - feature is discoverable through normal interaction patterns
  - Becomes integral part of tournament operator workflow after discovery

- **Comprehensive Help Documentation**: Added hover zoom feature description to dynamic help system
  - Integrated into Tournament page "Bracket Navigation" section
  - Clear explanation of activation conditions and behavior
  - Updated navigation tips to include hover functionality

### Technical Excellence
- **Animation Conflict Resolution**: Sophisticated handling of overlapping visual effects
  - `zoom-hover` CSS class disables live match pulse animation during hover
  - Proper state management with timeout cleanup on mouse leave
  - Transform origin optimization for smooth scaling behavior

- **Viewport-Relative Scaling**: Consistent zoom experience regardless of current bracket zoom level
  - Dynamic scale calculation ensures 1.0x viewport appearance
  - Mathematical precision: `targetScale / currentZoomLevel = elementScale`
  - Perfect readability at any zoom level from 0.3x to 0.99x

### Bug Fixes
- **Player Statistics Reset**: Fixed tournament reset not clearing player achievement data
  - Added proper statistics clearing in `confirmReset()` function
  - Ensures clean slate for shortLegs, highOuts, tons, and oneEighties tracking
  - Maintains data integrity across tournament lifecycle

### User Experience Impact
- **Effortless Navigation**: Hover zoom transforms crowded bracket usability
- **Professional Polish**: Directional indicators and FINALS label complete visual hierarchy
- **Reliable Data Management**: Tournament reset now properly handles all player data
- **Discoverable Excellence**: Features that users find naturally and adopt into their workflow

# 2025-09-25

## **v2.0.2** Complete Tournament Bracket Visualization System

### Major Tournament Bracket Enhancements
- **Complete Tournament Progression Lines**: Implemented comprehensive visual flow system for all bracket sizes
  - Professional L-shaped connector lines showing frontside and backside progression paths
  - Custom finals routing with complex multi-path connections to BS-FINAL and GRAND-FINAL
  - BS-FINAL text indicators with arrows for clear backside completion visualization
  - 60+ progression elements for 32-player brackets with bulletproof gap prevention
  - All bracket sizes (8, 16, 32 players) now have complete visual tournament flow

- **Backside Placement Labels**: Added placement indicators below each backside bracket round
  - 8-player: "7th-8th Place", "5th-6th Place", "4th Place" labels
  - 16-player: "13th-16th Place" down to "4th Place" labels
  - 32-player: "25th-32nd Place" down to "4th Place" labels
  - Professional 24px bold text positioned below gradient background
  - Non-intrusive design providing immediate ranking feedback

- **Dynamic Tournament Header Sizing**: Bracket-specific font scaling for optimal visual proportion
  - 8-player brackets: 54px (compact for simple brackets)
  - 16-player brackets: 64px (balanced for moderate complexity)
  - 32-player brackets: 78px (prominent for complex brackets)
  - Progressive 12px increments creating smooth visual hierarchy

### Technical Achievements
- **bracket-lines.js Architecture**: Complete separation of line rendering from match positioning
- **Bracket Isolation**: Independent line generation for each bracket size with zero cross-contamination
- **Position-Based System**: Clean separation between positioning logic and line drawing
- **Gap Prevention**: 1-pixel overlap technique eliminating visual gaps at 90-degree line bends
- **Sky High Resilience**: All improvements follow established crash-resistance principles

### Bug Fixes
- **Fixed order of Backside round 2 matches in the 8-player bracket**
- **Fixed alignment of backside match-cards for the 16-player bracket**
- **Enhanced Dialog Reliability**: Fixed Edit Statistics modal button accessibility
  - Added scrollable content area preventing button cutoff at various zoom levels
  - Cancel and Save Statistics buttons always remain visible and accessible

### User Experience Impact
- **Tournament Clarity**: Complete visual understanding of tournament progression and placement structure
- **Professional Presentation**: Comprehensive ranking information with adaptive typography
- **Enhanced Reliability**: Improved modal accessibility and bracket rendering consistency
- **Scalable Excellence**: All improvements work seamlessly across supported bracket sizes

# 2025-09-22

## **v2.0.2-beta** Reset Tournament Bug Fix, Focus on Tournament Bracket Visuals
- **Fixed Event Listener Accumulation**: Resolved bug where resetting the same tournament multiple times caused exponentially increasing browser confirmation dialogs
- **Clean Event Handling**: Tournament reset input field now properly removes old event listeners before adding new ones
- **Color Consistency**: Updated reset button enabled state to use subtle orange color matching interface palette
- **Improved Watermark Positioning**: Moved "NewTon DC Tournament Manager" text from bottom of viewport to centered below last first-round match for all bracket sizes
- **Enhanced Watermark Visibility**: Increased watermark opacity for better readability while maintaining subtle appearance
- **Rendering Error**: Fixed an error where the matches in backside rounds one and two were rendered in the wrong order.
- **New file: bracket-lines.js**: Split from `bracket-rendering.js` for easier maintenance
- **Bracket Lines Proof of Concept**: Added complete tournament flow visualization for 8-player brackets with professional L-shaped connector lines showing frontside and backside progression, and finals connections

## v2.0.1 Dialog Visual Consistency
- **Dialog Color Harmonization**: Updated all modal dialogs to use consistent subtle color palette
- **Tournament in Progress Dialog**: Changed blue "Got it" button and info box border to subtle green theme
- **Reset Tournament Dialog**: Replaced bright red/blue sections with muted orange/green styling, updated "Reset Tournament" button
- **Export Dialogs**: Converted bright blue/green sections to consistent subtle green styling, updated "Export Results" button
- **Warning Boxes**: All yellow warning sections now use subtle orange border and muted background across all dialogs
- **Professional Polish**: Eliminated visual chaos from competing bright colors, creating cohesive modal experience

## v2.0.0 Tournament Management Platform Maturity
- **Major Version Release**: Complete transformation from functional tool to professional tournament management platform
- **Core Architecture**: Hardcoded tournament logic with transaction-based history system for bulletproof reliability
- **Surgical Undo System**: Transaction-based undo enabling precise match correction without affecting independent matches
- **Match Controls Command Center**: State-driven unified interface for tournament setup, match management, and celebration
- **Referee Suggestions**: Intelligent referee assignment with conflict detection and visual organization
- **Tournament Celebration**: Olympic-style podium display with achievement tracking and integrated export
- **Unified Dialog System**: Rich modal replacements with stack-aware management and Esc key integration
- **Live Tournament Intelligence**: Real-time match history, progression status bar, and dynamic results integration
- **Cohesive Visual Design**: Muted color palette with cross-component consistency, replacing bright competing colors
- **Enhanced UX**: Dynamic help system, lane management, match validation, and comprehensive workflow improvements
- **Technical Foundation**: Zero-dependency modular architecture with efficient data persistence and browser compatibility

This release represents the culmination of incremental improvements since v1.4, establishing NewTon DC as a mature, production-ready platform for competitive darts tournaments.

## v1.6.12 Debugging of Referee Suggestions
- Referee suggestions had no debugging for verifying workflow
- The suggestions show the latest 7 losers, latest 7 winners, and latest 7 assignments
- Players are moved from Recent Losers/Winners to Recent Assignments on match start/completion to avoid suggesting same referee too often
- Visual Change: Made the rounded corners of the Backside Bracket gradient more pronounced.

## v1.6.11 Backside Bracket Visual Enhancement
- **Gradient Background**: Added subtle gradient background to backside brackets for all tournament sizes (8, 16, 32 players)
- **Visual Distinction**: Backside brackets now have a gradient from 0.06 opacity on the right fading to transparent on the left
- **Consistent Styling**: Uniform visual treatment across all bracket sizes with proper positioning and rounded corners
- **Non-Intrusive Design**: Background stays behind matches and doesn't interfere with user interactions

# 2025-09-20

## v1.6.7, 1.6.8 & 1.6.9 Tournament Visuals Bug-Fix
- Improved tournament flow for 16 and 32-player brackets

## v1.6.6 Professional Visual Bracket Positioning
- **Systematic Match Alignment**: Complete overhaul of bracket positioning for 8, 16, and 32-player tournaments
- **Visual Progression Clarity**: Matches positioned to show clear convergence patterns and tournament flow
- **8-Player Bracket Excellence**: FS-R2 centered between inputs, BS mirrored to left with proper alignment
- **16-Player Bracket Refinement**: BS-R1/BS-R2 aligned with FS-R2, BS-R3/BS-R4 aligned for classical layout
- **32-Player Bracket Mastery**: Full 7-round backside positioning with strategic vertical alignment patterns
- **Finals Prominence**: 6x spacing for all bracket sizes gives finals proper visual weight
- **Backside Final Fix**: BS-FINAL now properly turns green when completed (CSS specificity resolved)
- **Enhanced Spacing**: Improved horizontal spacing options for better visual balance
- **Reset Tournament Fix**: Results Table now properly refreshes after tournament reset

# 2025-09-19

## v1.6.5 Enhanced Two-Line Match Status Display
- **Rich Contextual Information**: Upgraded status bar to show two lines of information per match
- **Match State Integration**: First line shows match ID and current state (Pending, Ready to Start, Started, Can Undo, Cannot Undo with blocking matches)
- **Walkover Detection**: Special handling for bye/walkover matches showing "Cannot Undo, Walkover"
- **Specific Undo Blocking**: Displays exact matches preventing undo operations (e.g., "Cannot undo, blocked by FS-3-1")
- **Centered Layout**: Both status lines are center-aligned for professional appearance
- **Tournament Management Integration**: Creates seamless workflow between Tournament Bracket (information) and Match Controls (actions)
- **Eliminates Guesswork**: No more visual scanning of backside bracket to find blocking matches due to complex mirroring rules

## v1.6.4 Dynamic Match Progression Status Bar
- **Tournament Flow Visualization**: Added elegant status bar system showing match progression on Tournament page
- **Smart Hover Information**: Hover over any match card to see where players advance next (e.g., "Match FS-2-1 leads to FS-3-1 and BS-2-2")
- **Purposeful Design**: Status bar background only appears when displaying information, creating a subtle "blooming" effect
- **Optimized Timing**: 300ms hover delay prevents jumpy navigation while maintaining responsiveness
- **Universal Coverage**: Works for all match states and tournament sizes using hardcoded progression lookup tables
- **Undo Context**: Helps users understand bracket flow and identify why certain matches block undo operations
- **Tournament Page Only**: Clean implementation that doesn't affect other pages

## v1.6.3 Polish & UX Improvements
- **Matches Played**: Tournament celebration now shows "Matches played" instead of meaningless "Total matches" count (excludes walkover matches)
- **Focus Preservation**: Fixed input field losing focus when adding players from Match Controls setup interface
- **Button Layout**: Swapped Match Controls and Stats/Results button positions for better accessibility

## v1.6.2 Auto-Open & UI Polish
- **Auto-Open Match Controls**: Configurable setting to automatically open Match Controls when entering Tournament page (enabled by default)
- **UI Layout Fix**: Fixed Global Settings UI options display to show checkboxes on separate lines for better readability

## v1.6.1 Small Bug-fix
- The section "Recent Assignments", in Match Controls -> Referee Suggestions was lost. Now it's found.

## v1.6.0 Command Center Revolution

### 🎯 Match Controls Command Center
Transformed Match Controls into a true tournament management Command Center with intelligent state-driven interfaces.

**Setup State Enhancements:**
- **Tournament Branding**: Title shows "Match Controls - [Tournament Name]"
- **Enhanced Status Display**: Live player count with bracket size calculation ("8 players registered, 6 entrance fees paid (ready for 16-player bracket)")
- **Interactive Player Management**: Click player names to toggle paid/unpaid status with visual feedback (✓/☐)
- **Direct Player Addition**: Add players without leaving tournament view
- **Setup Actions Hub**: Integrated buttons for Player Registration Page, Global Settings Page, and dynamic bracket generation
- **Smart Button Text**: Generate button reflects validation states ("Generate 16-Player Bracket" vs "Generate Bracket (need 4+ players)")
- **Helpful Guidance**: Visual hints and tips for interactive elements

**Active State Improvements:**
- **Tournament Branding**: Consistent naming throughout active tournament management
- **Real-time Updates**: All match state changes immediately refresh Command Center

**Celebration State Enhancement:**
- **Tournament Branding**: "🏆 [Tournament Name] Complete! 🏆"
- **Date Context**: "[Date] • Congratulations to all [X] players!" for perfect social media sharing

### 🔄 Seamless State Transitions
- **Setup → Active**: Generate bracket automatically refreshes to show matches/referees
- **Active → Setup**: Reset tournament refreshes to show setup interface
- **All Transitions**: Maintain context and tournament branding throughout

### 🎛️ Streamlined UI Architecture
- **Removed Redundant Elements**: Eliminated top-left "Generate Bracket" button
- **Promoted Match Controls**: Moved to prime top-left position for better accessibility
- **Enhanced Tournament Workflow**: Single entry point for all tournament management phases

### 🐛 Critical Fixes
- **Match Completion Refresh**: Fixed Match Controls not updating when completing matches without confirmation dialog
- **Reset Tournament Function**: Fixed ReferenceError by correcting function name from `resetTournament()` to `showResetTournamentModal()`
- **Validation Logic**: Added proper >32 player limit with clear error messaging

### 📚 Documentation Updates
- **Dynamic Help System**: Updated Tournament page help to reflect new Match Controls workflow
- **Action Buttons**: Help system buttons now direct users to Match Controls instead of removed Generate Bracket button
- **User Messages**: Updated all references to align with new workflow

### 🎨 Visual Polish
- **Consistent Typography**: Refined section headers to proper visual hierarchy
- **Professional Terminology**: "Entrance Fee Paid/Not Paid" for better consistency
- **Intuitive Icons**: ✓ for paid, ☐ for unpaid players with clear visual distinction
- **Responsive Design**: Optimized input sizing and alignment throughout

---

## v1.5.4 State-Driven Match Controls Architecture

### 🏗️ Core Architecture: Tournament State-Driven Match Controls
Completely refactored Match Controls to use tournament status as the single source of truth for UI behavior.

**Match Controls Column (Left):**
- **'setup'**: Shows styled setup message with guidance for adding players and generating matches
- **'active'**: Shows live/ready matches organized by frontside/backside brackets
- **'completed'**: Shows celebration podium with winner rankings and tournament highlights

**Referee Suggestions Column (Right):**
- **'setup'**: Shows setup message explaining referee suggestions will appear when tournament starts
- **'active'**: Shows referee suggestions (recent losers, winners, assignments) with proper headers
- **'completed'**: Shows player achievements (most 180s, highest checkout, etc.) and tournament summary

### 🐛 Critical Data Fixes
- **Results Table Rankings**: Fixed to read from tournament object instead of stale localStorage data
- **Achievement Display**: Fixed sections not being made visible after populating with achievement data
- **Tournament Persistence**: Fixed loaded tournaments not surviving browser refreshes
- **Recent Tournaments**: Fixed new tournaments not appearing in list and active status not updating

### 🎯 UI Consistency Improvements
- **Header Reset**: Active tournaments now properly reset subsection headers from celebration state
- **State Clearing**: All celebration elements properly cleared when switching tournaments
- **Setup State**: Added proper setup messages for both columns when tournament is in initial state

### 🔧 Technical Improvements
- **Single Source of Truth**: All Match Controls logic now flows from `tournament.status`
- **Reliable State Management**: Tournament status drives all UI decisions instead of derived match state
- **Consistent Updates**: All tournament operations (create, load, delete, import) now refresh displays properly
- **Data Synchronization**: Fixed discrepancies between tournament object and localStorage persistence

This architectural overhaul transforms Match Controls from a reactive system to a predictable, state-driven interface that accurately reflects tournament lifecycle at all times.

## v1.5.3 Tournament Management Modal Suite

### ✨ New Feature: Professional Tournament Management Dialogs
- **🏆 Tournament In Progress Warning Modal**
  - Replaced browser alert with rich, informative modal explaining tournament state
  - Clear guidance on where to find "Reset Tournament" (Setup page)
  - Professional styling with color-coded information boxes and helpful instructions

- **🗑️ Delete Tournament Confirmation Modal**
  - Enhanced deletion workflow with detailed tournament information display
  - Shows tournament name, date, player count, and current status before deletion
  - Clear warning about permanent data loss with color-coded danger alerts
  - Comprehensive list of what will be removed (all data, statistics, results, configuration)

- **📂 Import Tournament Overwrite Modal**
  - Intelligent conflict resolution when importing tournaments with existing names/dates
  - Side-by-side comparison showing existing vs. imported tournament details
  - Clear explanation of consequences with helpful alternative suggestions
  - User-friendly button options: "Cancel Import" vs "Overwrite Existing"

- **🔄 Load Tournament Confirmation Modal**
  - Rich before/after comparison showing current vs. selected tournament
  - Dynamic layout that hides current tournament section when none is active
  - Prominent data safety guarantee explaining no data loss will occur
  - Detailed action plan explaining exactly what happens during the load process
  - Responsive design with scrollable content and compact spacing for better fit

- **📤 Export Confirmation Modals (JSON/CSV)**
  - Comprehensive tournament overview with status, progress, and player information
  - Format-specific export details showing filename, content type, and included data
  - Smart status detection with color-coded warnings for incomplete tournaments
  - Detailed content preview listing exactly what will be included in each export format
  - Professional styling with clear file information and download confirmation

### 🎨 Enhanced User Experience
- **Consistent Design Language**: All modals follow the same professional styling and color scheme
- **Rich Information Display**: Users see comprehensive details before making decisions
- **Color-Coded Sections**: Blue for information, red for warnings, yellow for cautions, green for success
- **Esc Key Support**: All new modals integrate with the stack-aware Esc handling system
- **Improved Readability**: Compact spacing and organized layouts for better information hierarchy

### 🔧 Technical Implementation
- **Modal Integration**: All dialogs use the unified dialog stack system with proper z-index management
- **Code Consolidation**: Refactored duplicate import/load logic into reusable functions
- **Global Function Exports**: All modal functions properly available for button click handlers
- **Error Handling**: Comprehensive error checking and user feedback throughout all workflows
- **Memory Management**: Proper cleanup and data storage for modal callback functions

### 🚀 Browser Dialog Elimination
Completely replaced generic browser dialogs (`alert`, `confirm`, `prompt`) with rich, contextual modals:
- ✅ Tournament progress warnings → Rich guidance modal
- ✅ Tournament reset confirmation → Security validation modal
- ✅ Tournament deletion → Detailed impact modal
- ✅ Import conflicts → Clear overwrite decision modal
- ✅ Tournament loading → Comprehensive before/after modal
- ✅ Export confirmations → Professional export details modal

# 2025-09-18

## v1.5.2 Stack-Integrated Esc Key Support

### ✨ New Feature: Universal Esc Key Support for Dialogs
- **🔑 Stack-Aware Esc Handling**
  - Enhanced `pushDialog()` function with optional `enableEsc` parameter for explicit control
  - Single global Esc handler that respects dialog stack settings - no conflicts with existing handlers
  - Esc support enabled for Statistics Modal, Match Command Center, and Edit Statistics Modal

- **🎯 Explicit Control Model**
  - Clear intent in code with `pushDialog(dialogId, restoreFunction, true)` syntax
  - Debuggable behavior with console logging showing which dialogs close via Esc
  - Easy to enable/disable Esc per dialog for future enhancements

- **📚 Dialog Flow Improvements**
  - **Stats/Results Flow**: Stats → Esc → Closed
  - **Match Controls Statistics Flow**: Controls → Statistics → Esc → Back to Statistics → Esc → Back to Controls → Esc → Closed
  - **Match Controls Completion Flow**: Controls → Match Completion → Edit Statistics → Esc → Back to Completion → Esc → Back to Controls → Esc → Closed

### 🏗️ Architecture Enhancement
- **Consistent Integration**: Uses existing `popDialog()` restoration logic for reliable parent dialog restoration
- **Future-Proof Design**: Foundation for easy Esc enablement in future dialogs
- **Preserved Compatibility**: Existing individual Esc handlers remain unaffected

## v1.5.1 Tournament Celebration & Command Center Enhancement

### Small bug-fix
- The undo dialog was too tall. It now adapts to the number of matches it displays

### ✨ New Feature: Tournament Completion Celebration
- **🏆 Olympic-Style Podium Display**
  - Visual podium showing 1st, 2nd, and 3rd place winners with gold, silver, bronze styling
  - Medal emojis (🥇🥈🥉) and dynamic player names on podium positions
  - Dynamic congratulations message including total player count (e.g., "Congratulations to all 8 players!")

- **🎯 Tournament Highlights Section**
  - Most 180s - Player with most maximum scores
  - Highest Checkout - Best finishing score achieved
  - Shortest Leg - Fastest leg completion (in darts)
  - Responsive 3-column grid layout for key achievements

- **🏆 Tournament Achievements Column**
  - Repurposes referee suggestions column when tournament completes
  - **Player Achievements**: Most Achievement Points, Most 180s, Highest Checkout, Shortest Leg, Most Tons
  - **Tournament Summary**: Total matches, bracket size
  - **Integrated Export**: One-click JSON export directly from celebration

### 🧮 New Scoring System: Achievement Points
- **Most Achievement Points**: Calculates skill-based points excluding placement/participation
  - Rewards pure dart performance: 180s, high outs, short legs, tons
  - Highlights skill mastery vs tournament progression
  - Can recognize players who finish lower but dominated individual achievements

### 🎛️ Match Controls: Complete Tournament Command Center
- **State-Responsive Interface**: Dynamically adapts based on tournament status
  - Active tournaments: Shows matches + referee suggestions
  - Completed tournaments: Shows celebration + achievements + export
- **No More Empty States**: Replaced sad "No matches currently active" with vibrant celebration
- **Enhanced UI Refresh**: Fixed real-time updates when starting/stopping matches in dialog

### 🏗️ Foundation-Respecting Architecture
- **Single Source of Truth**: All celebration data flows from existing tournament logic and transaction history
- **State-Driven Design**: Both match section and referee section check `tournament.status` and rebuild accordingly
- **Clean Container Management**: Follows match section pattern - clear containers first, then populate based on current state
- **No Code Duplication**: Reuses existing functions and follows established architectural patterns

### 🔧 Technical Improvements
- Added tournament status checks for UI state management
- Implemented dynamic column transformation based on tournament completion
- Enhanced dialog refresh logic for real-time state updates
- Proper cleanup and restoration when tournament status changes (e.g., undo operations)

The Match Controls have evolved from a simple match management tool into the true nerve center of the entire tournament experience, providing comprehensive celebration, statistics, and export functionality while maintaining the application's core architectural principles.

---

## v1.5.0 Unified Dialog Stack System

### Major Architecture Improvement
- **Unified Dialog Stack Manager**
  - Implemented comprehensive dialog stacking system with automatic z-index management
  - All dialogs now use consistent `pushDialog()` and `popDialog()` functions for opening and closing
  - Automatic parent dialog hiding and restoration when navigating between nested dialogs
  - Console logging for debugging dialog stack state (`📚 Dialog stack: [...]`)

### Dialog Flow Improvements
- **Statistics Dialog Chain**: Stats/Results → Statistics → Edit Statistics → proper restoration
- **Match Controls Dialog Chain**: Match Controls → Statistics → Edit Statistics → proper restoration
- **Match Completion Dialog Chain**: Match Controls → Match Completion → Edit Statistics → proper restoration
- **Edit Statistics Modal**: Added Esc key support for consistent user experience
- **Event Handler Cleanup**: Fixed duplicate event listeners that caused double-close behavior in nested dialogs

### User Interface Polish
- **Edit Statistics Modal**: Removed confusing "X" close button to encourage use of Cancel/Save buttons
- **Consistent Close Behavior**: All dialog close buttons now use unified dialog stack system
- **Z-index Management**: Proper modal layering (1001, 1002, 1003...) prevents dialogs appearing behind each other

### Technical Improvements
- **Dialog Stack State Management**: Proper cleanup and restoration of dialog states
- **Event Listener Management**: Prevention of duplicate event handlers during dialog restoration
- **Automatic Parent Detection**: Smart dialog restoration without manual parent tracking

# 2025-09-17

## v1.4.6 Tournament Navigation & Help System Improvements

### User Interface Enhancements
- **Tournament Page Navigation**
  - Added "≡ Stats/Results" button to Tournament page upper-left controls for quick access to statistics
  - Repositioned Match Controls to middle row alongside Players/Points for better accessibility
  - Added subtle color guidance: green tint for Match Controls (primary action), amber tint for Generate Bracket (important/caution)
  - Uses existing Statistics modal functionality with cleaner tournament page integration
  - Inconsistent Esc key behavior
  - The Statistics dialog did not update when editing player statistics
- **Visual Consistency Improvements**
  - Added consistent backside match styling to Match Results in Setup page
  - Backside match headers now use darker background (`#d1d5db`) matching Match Controls design
  - Maintains uniform header appearance while preserving visual distinction between frontside/backside matches

### Help System Updates
- **Registration Page Help**
  - Added documentation for Export JSON functionality (results and tournament match history)
  - Added tip about using Export JSON for automated import into external tournament statistics websites
- **Config Page Help**
  - Updated Match Format Configuration descriptions for separate Frontside/Backside Semi-Finals
  - Clarified Backside Final as "Qualifier match for Grand Final"
  - Enhanced confirmation dialog description to explain impact on match result and statistics entry
- **Tournament Page Help**
  - Updated bracket navigation section to include new Stats/Results button

### Bug Fixes
- **Modal Behavior**
  - Added Esc key support to Statistics modal for consistent modal behavior
  - Statistics modal now closes with Esc key like other modals in the application

### Technical Improvements
- **Code Documentation**
  - Streamlined README.md removing duplications and improving focus (reduced from 253 to 108 lines)

# 2025-09-16

## v1.4.5 Match Controls Dialog Behavior Fix

### Bug Fix
- **Match Controls Dialog Persistence**
  - Fixed issue where Match Controls dialog would close and not reopen when confirmation dialogs are disabled
  - Root cause: Command Center reopening logic was only present in confirmation dialog handlers
  - Added same reopening logic to the no-confirmation completion path for consistent behavior
  - Match Controls now properly reopens after match completion regardless of confirmation setting
  - Maintains 500ms delay and cleanup pattern consistent with confirmation path
  - Improves workflow efficiency when using disabled confirmation dialogs

## v1.4.4 Match Undo Ranking Fix

### Bug Fix
- **Undo System Rankings Update**
  - Fixed issue where player rankings were not properly updated after undoing matches
  - Resolved tournament placement persistence bug where stale ranking data remained in localStorage
  - Corrected operation order: now clears placements, recalculates rankings, then saves tournament state
  - Ensures Results Table displays current tournament standings immediately after match undo operations
  - Maintains data integrity between in-memory tournament state and persistent storage

## v1.4.3 System Architecture Documentation & Statistics Enhancement

### Player Statistics Enhancement
- **Dynamic Ranking System**
  - New "Statistics" button in Match Controls, providing direct access to the tournament statistics and editable user statistics without leaving the Tournament page
  - Added real-time player elimination rankings that appear immediately when players are eliminated
  - Rankings display dynamically in results table during tournament play (e.g., "7th-8th", "5th-6th")
  - Clean removal of rankings when matches are undone, maintaining accurate tournament state
  - Integration with existing hardcoded progression logic for bulletproof rank calculations
  - Enhanced user experience showing live tournament standings as play progresses

### Documentation Enhancement
- **Comprehensive Undo System Documentation**
  - Added UNDO.md with complete architectural overview of the surgical undo system
  - Documents the logic behind hardcoded match progression and transaction-based history
  - Explains the surgical vs rebuilding approach for match rollbacks
  - Covers auto-advancement chain handling and error prevention mechanisms
  - Technical reference for maintaining tournament integrity during undo operations

### Architecture Insight
- **Single Sources of Truth Approach**
  - Hardcoded Match Progression (`MATCH_PROGRESSION`) as definitive bracket logic
  - Transaction-based History as chronological state record
  - Surgical state repair vs complete bracket rebuilding
  - Bulletproof data integrity through precise dependency identification

## v1.4.1 Recent Referee Assignments & UI Refinements

### Recent Referee Assignments - Enhancement
- **Added Recent Assignments Section**
  - Third section in referee suggestions showing last 10 referee assignments from transaction history
  - Chronological order with most recent assignments first
  - Same FS/BS color coding as other suggestions (light for FS, darker for BS)
  - Shows assigned referee name with round context (e.g., "John (FS-R2)")

- **UI Refinements**
  - Configurable suggestion limits for better interface management
  - Default reduced to 7 items per section (losers/winners) for less overwhelming display
  - Consistent slice limits across all suggestion categories
  - Transaction-based data ensures reliable referee assignment history

## v1.4.0 Referee Suggestions System & Enhanced Match Controls

### Referee Suggestions System - New Feature
- **Comprehensive Referee Suggestion System**
  - Added intelligent referee suggestions to Match Controls dialog
  - Expanded dialog layout from 800px to 1100px width for two-column design
  - Right column displays up to 10 recent losers first, then up to 10 recent winners
  - Each suggestion shows player name with round context (e.g., "Player Name (FS-R2)")

- **Smart Filtering Logic**
  - Automatically excludes players already assigned as referees
  - Filters out players currently in LIVE matches
  - Removes walkover players from suggestions (not eligible referees)
  - Prevents invalid referee assignments through comprehensive validation

- **Visual Organization & Color Coding**
  - Frontside (FS) players grouped first with light backgrounds
  - Backside (BS) players grouped second with darker backgrounds matching bracket scheme
  - Consistent color coding maintains visual harmony with existing match cards
  - Hover effects provide clear interaction feedback

- **Tournament Flow Integration**
  - Prioritizes eliminated players (losers) as immediately available referees
  - Shows winners with multiple appearances for activity pattern insight
  - Chronological ordering within each group (most recent first)
  - Provides operators comprehensive context for informed referee selection

## v1.3.0 Undo System & Match Controls UX Improvements

### Undo System Enhancement - Major Fix
- **Fixed Undo System Losing Match State**
  - Resolved critical issue where undoing matches would clear LIVE status, lane assignments, and referee assignments from unrelated matches
  - Root cause: Match state changes (start/stop, lane/referee assignments) were not stored as transactions
  - All match state is now properly tracked in transaction history for complete undo safety

- **Enhanced Transaction System**
  - Added `START_MATCH` and `STOP_MATCH` transaction types for match activation/deactivation
  - Added `ASSIGN_LANE` transaction type for lane assignments and changes
  - Added `ASSIGN_REFEREE` transaction type for referee assignments and changes
  - Updated `rebuildBracketFromHistory()` to process all new transaction types
  - Maintains backwards compatibility with existing tournament data

- **Improved Undo Safety**
  - Unrelated LIVE matches now preserve their state during undo operations
  - Lane and referee assignments survive bracket rebuilds
  - Undo operations are now surgical, affecting only progression-related changes
  - Single source of truth principle now applies to ALL match state changes

## v1.2.9 Match Controls UX Improvements

### Match Controls Dialog Enhancement
- **Fixed Match Controls Dialog Refresh Issue**
  - Resolved inconsistent refresh behavior between Frontside and Backside matches
  - Fixed scroll position reset when changing lane/referee assignments
  - Dialog now maintains scroll position during updates instead of jumping to top
  - Improved user experience when managing multiple matches

- **Added Stop Match Button**
  - Added red "Stop Match" button to LIVE match cards in Match Controls dialog
  - Button appears in lower right corner for easy access
  - Allows stopping accidentally started matches without exiting dialog
  - Uses existing `toggleActive()` function to return match to ready state
  - Includes proper CSS styling with hover effects

### Match Results & Export Enhancements
- **Enhanced Match Results Display**
  - Added lane and referee information to Match Results on Setup page
  - Shows "Referee: [Name] • Lane [Number]" format for completed matches
  - Clean display with subtle styling that doesn't interfere with existing layout
  - Backwards compatible with matches that had no lane/referee assignments
  - Proper styling for both regular and walkover matches

- **Enhanced JSON Export**
  - JSON export now includes complete lane and referee data for all matches
  - Lane information exported as `lane: number` field
  - Referee information exported as comprehensive object with `id` and `name`
  - Full data traceability for tournament record keeping and analysis
  - Maintains backwards compatibility with existing export structure

### Technical Improvements
- **Performance Optimization**
  - Improved DOM update efficiency by building HTML strings before setting innerHTML
  - Eliminated redundant function calls during match updates
  - Enhanced scroll position preservation during dialog refreshes

## v1.2.8 Excluded Lanes Configuration & Match Format Update

### Lane Management Enhancement
- **Excluded Lanes Configuration**
  - Added new "Excluded Lanes" field in Config → Lane Management
  - Enter comma-separated lane numbers to exclude from assignment (e.g., "5,7")
  - Excluded lanes appear as "(excluded)" in match lane dropdowns
  - Excluded lanes are grayed out and disabled, matching the existing "(in use)" pattern
  - Input validation ensures excluded lanes don't exceed maximum lane setting
  - Backwards compatible - existing configurations work without excluded lanes
  - Perfect for venues with permanently unusable lanes or temporarily occupied dartboards

- **Enhanced Lane Usage Display**
  - Updated "Show Current Lane Usage" to display excluded lanes information
  - Shows total lanes, excluded lanes, currently in use, and available for assignment
  - Provides comprehensive overview of lane availability status

- **Configuration Management**
  - Excluded lanes saved and loaded with all other global settings
  - Invalid excluded lanes (above max lanes) filtered out with warning message
  - Real-time validation when saving lane configuration

### Match Format Configuration
- **Frontside Semifinal Default Change**
  - Changed default from Best of 5 to Best of 3 for frontside semifinals
  - Provides faster tournament progression and consistent semifinal formatting
  - Affects new tournaments - existing tournaments maintain their current settings

### Technical Implementation
- Enhanced `generateLaneOptions()` to respect excluded lanes in dropdown generation
- Updated `getAvailableLanes()` to filter out both used and excluded lanes
- Modified `saveLaneConfiguration()` in both lane-management.js and results-config.js
- Added `parseExcludedLanesString()` helper function for input validation
- Updated `DEFAULT_CONFIG` to include `excludedLanes` array
- Enhanced `applyConfigToUI()` to populate excluded lanes field from saved configuration

### User Experience Improvements
- Intuitive comma-separated input format for excluded lanes (e.g., "5,7,9")
- Helper text explains the input format clearly
- Lane dropdowns show clear visual distinction between available, in-use, and excluded lanes
- Temporary exclusions easily managed by editing the excluded lanes field
- Maintains physical lane number mapping for clear operational understanding

### Files Modified
- `lane-management.js` - Enhanced lane generation logic and exclusion handling
- `results-config.js` - Updated configuration save/load with excluded lanes support
- `tournament.html` - Added excluded lanes input field to configuration form
- `main.js` - Version bump to 1.2.8

This update enables precise lane management for venues with complex dartboard availability, providing both permanent exclusions for unusable lanes and flexible temporary exclusions for occupied boards.

## v1.2.7 UI Improvements & Match Controls Synchronization

### Dialog Transparency
- Modal dialogs (Match Controls, Statistics, etc.) now have slight transparency (90% opacity)
- Improved visual depth while maintaining readability
- Allows partial visibility of background content

### Match Controls Enhancements
- **Statistics Modal Scrolling Fix**
  - Fixed button visibility issue when adding High Outs or Short Legs while browser is zoomed
  - Statistics form content now scrolls independently while keeping buttons visible at bottom
  - Proper flexbox layout ensures Save/Cancel buttons never get cut off

- **Backside Match Consistency**
  - Backside matches maintain darker background color even when moved to LIVE section
  - Added `cc-match-card-backside` class to preserve visual distinction across all states
  - Consistent color scheme between Ready to Start and Live sections

- **Real-time Synchronization**
  - Lane and Referee changes in tournament bracket now immediately reflect in Match Controls
  - Lane and Referee changes in Match Controls now immediately reflect in tournament bracket
  - Both views stay synchronized regardless of where changes are made
  - Automatic refresh of open modals when data changes

- **Streamlined Live Match Interface**
  - Live matches now show "Player 1 Wins" / "Player 2 Wins" buttons instead of player names
  - Removed redundant separate winner buttons section for cleaner interface
  - Single-click winner selection directly from player area
  - Statistics access removed from live matches (available in Match Completion dialog)

- **Improved Control Layout**
  - Lane and Referee dropdowns now aligned to left for reduced mouse movement
  - Start Match button positioned on right side for ready matches
  - More efficient control grouping and visual hierarchy

- **Enhanced Typography**
  - Round descriptions ("Frontside Round #", "Backside Round #") now displayed in bold
  - "Best of #" format text remains normal weight for clear visual distinction

### Technical Implementation
- Enhanced `createMatchCard()` function to add backside identification classes
- Added bracket refresh logic to `updateMatchLane()` and `updateMatchReferee()` functions
- Improved CSS specificity for modal content transparency and scrolling behavior
- Cross-component state synchronization for seamless user experience

### Files Modified
- `styles.css` - Modal transparency, stats modal scrolling fixes, backside match colors
- `bracket-rendering.js` - Backside class assignment, bracket refresh on updates
- `clean-match-progression.js` - Lane update with bracket refresh
- `main.js` - Version bump to 1.2.7

# 2025-09-15

## v1.2.6 UX Improvements, Match Controls

### Match Controls, Better Separation Between Ready to Start Frontside and Backside Matches
- Backside matches now have darker cards
- This gives a clearer indication of which bracket the Ready to Start matches belong to
- The style of the frontside and backside matches are now aligned with their headline bullets

### Technical Implementation
- CSS Selectors used to give the backside matches a darker color

### Files Modified
- `styles.css` - Added the CSS rule `#backMatchesSection .cc-match-card` for a darker color
- `main.js` - Version bump to 1.2.6

# 2025-09-14

## v1.2.5 - Enhanced JSON Export with Match Results

### Export Functionality Enhancement
- **Match Results in JSON Export**
  - Registration page JSON export now includes complete match history
  - Added `matchResults` section with chronological match data
  - Each match includes player details, winner, final score, and completion timestamp
  - Walkover and auto-completion flags for comprehensive match tracking
  - Maintains existing tournament metadata and player statistics sections

### Technical Implementation
- Enhanced `generateResultsJSON()` function in `results-config.js`
- Made `isWalkoverMatch()` globally available to prevent code duplication
- Match results sorted chronologically (newest first) matching UI display
- Consistent walkover detection logic across display and export functions

### Files Modified
- `results-config.js` - Enhanced JSON generation with match results section
- `main.js` - Made `isWalkoverMatch()` globally available, version bump to 1.2.5

This update provides complete tournament data export in a single JSON file, eliminating the need for separate match results export functionality.

----

## v1.2.4 - Undo System Stability & Rapid-Click Protection

### System Stability Improvements
- **Undo Operation Debouncing**
  - Added 1.5-second debounce protection for undo operations
  - Prevents rapid clicking that could cause tournament state corruption
  - Clear console logging shows when debounce is active/cleared
  - Maintains all sophisticated undo logic while preventing edge case failures

- **Enhanced Rebuild Protection**
  - Dual flag system (`rebuildInProgress` + `autoAdvancementsDisabled`) for comprehensive transaction isolation
  - Optimized protection window from 2000ms to 500ms for better performance
  - Debug logging with stack traces for auto-advancement trigger identification
  - Multiple safety checks throughout rebuild process for bulletproof operation

### Root Cause Resolution
- **Cascading Auto-Advancement Protection**
  - Identified and resolved rapid-click induced auto-advancement cascades
  - Stack trace analysis revealed overlapping rebuild operations as corruption source
  - Defense-in-depth approach maintains system integrity under all usage patterns
  - Normal single undo operations unaffected by stability improvements

### Technical Implementation
- Enhanced `handleSurgicalUndo()` with debounce logic and clear user feedback
- Extended `processAutoAdvancements()` with comprehensive blocking mechanisms
- Optimized `rebuildBracketFromHistory()` protection window for better responsiveness
- Maintained all existing debug capabilities for future troubleshooting

### Files Modified
- `bracket-rendering.js` - Undo debouncing, optimized rebuild protection, enhanced debugging
- `clean-match-progression.js` - Auto-advancement blocking with stack trace logging
- `main.js` - Version bump to 1.2.4

This update resolves tournament state corruption under rapid undo operations while maintaining the sophisticated undo system's precision and reliability for normal tournament management.

----

## v1.2.3 - Enhanced Dialog Interfaces & Tournament Experience

### User Interface Improvements
- **Undo Dialog Round Headers**
  - Enhanced consequential match display with detailed round information
  - FS/BS matches now show "⚪ Frontside - Round 3" format with hyphens
  - Finals display clean format: "BS-FINAL", "GRAND-FINAL" without icons
  - Provides precise context for understanding undo impact

- **Match Controls Dialog Scrollability**
  - Fixed dialog overflow issues in large tournaments (32+ players)
  - Implemented same flexbox layout pattern as undo dialog
  - Fixed title "Match Controls" stays at top, scrollable content fills dialog
  - Close button positioned at bottom, always accessible
  - Consistent user experience across all modal dialogs

- **Walkover Chain Detection**
  - Enhanced consequential match detection to follow walkover progressions
  - Now shows final destination where players actually compete
  - Example: FS-2-8 undo shows "BS-3-2" instead of intermediate walkover "BS-2-4"
  - Provides accurate surgical undo precision for complex tournament scenarios

### Technical Fixes
- **Rebuild Process Optimization**
  - Eliminated duplicate `processAutoAdvancements()` calls during undo rebuild
  - Fixed "completed without winner" states in matches like FS-2-1 (TBD vs TBD)
  - Resolved transaction history corruption during undo operations
  - Maintained perfect bracket state consistency across undo/redo cycles

### Files Modified
- `bracket-rendering.js` - Enhanced undo dialog headers, walkover chain detection, rebuild optimization
- `tournament.html` - Match Controls modal structure with scrollable layout
- `styles.css` - Flexbox layout styling for Match Controls dialog
- `main.js` - Version bump to 1.2.3

This update completes the undo system refinement and provides professional-grade dialog interfaces for tournament management at any scale.

----

# 2025-09-13

## v1.2.2 - Bulletproof Transaction-Based Undo System

### Revolutionary Architectural Change
- **Complete Undo System Redesign**
  - Replaced complex beforeState restoration with clean transaction-history rebuilding
  - Implemented single-source-of-truth approach using transaction history
  - Eliminated all state conflicts and unwanted match re-completions
  - Fixed surgical undo to preserve independent matches correctly

### Core Technical Improvements
- **Transaction-Based History Rebuilding**
  - New `rebuildBracketFromHistory()` function rebuilds entire bracket from clean transaction history
  - Leverages existing hardcoded progression logic for bulletproof reliability
  - Eliminates complex state reconciliation and replay conflicts
  - Ensures bracket state always matches transaction history exactly

- **Enhanced Undoability Logic**
  - Updated `isMatchUndoable()` to use transaction.completionType instead of unreliable match flags
  - Only MANUAL transactions are undoable (prevents AUTO walkover undo attempts)
  - Blocks undo only when downstream MANUAL transactions exist (preserves safety guardrails)
  - Maintains step-by-step undo approach for tournament integrity

- **Tournament Status Management**
  - GRAND-FINAL undo now properly resets tournament status from 'completed' to 'active'
  - Clears final placements to restore live standings display
  - Automatically refreshes Results table to show current tournament progress
  - Prevents incorrect final placement points after undo operations

### User Experience Fixes
- **Surgical Undo Precision**
  - Undoing FS-2-1 no longer affects independently completed FS-2-2
  - Eliminated unwanted match re-completions during undo operations
  - Maintains proper match states after complex undo sequences
  - Preserves tournament integrity with step-by-step undo safety

- **Match State Consistency**
  - Fixed progression application for both MANUAL and AUTO transactions during rebuild
  - Eliminated "TBD vs TBD" states in downstream matches after undo
  - Proper player advancement from all transaction types
  - Consistent bracket state regardless of undo sequence complexity

### Architecture Strengths
- **Single Source of Truth**: Transaction history drives all bracket state
- **Proven Foundation**: Uses existing hardcoded MATCH_PROGRESSION logic
- **Bulletproof Consistency**: Complete rebuild eliminates edge cases
- **Future-Proof Design**: Scales to any bracket size or tournament complexity

- **Debugging and Analysis**
  - Complete audit trail of all match completions preserved
  - Clear distinction between user decisions and system responses
  - Enhanced logging for tournament analysis and troubleshooting
  - Comprehensive match state validation after rebuilds

### Technical Implementation
- Enhanced `completeMatch()` function with `completionType` parameter
- New `undoManualTransaction()` function for bulletproof undo operations
- Complete `rebuildBracketFromHistory()` system for state reconstruction
- Advanced `updateAllMatchStates()` function for proper state validation
- Comprehensive transaction replay system with chronological ordering

### Files Modified
- `clean-match-progression.js` - Added transaction type marking and bulletproof match state validation
- `bracket-rendering.js` - Complete undo system redesign with enhanced dialog interface
- `tournament.html` - Fixed undo dialog font styling and improved modal structure
- `styles.css` - Added enhanced undo dialog styling matching Match Controls interface

### Bug Fixes Resolved
- Eliminated cascade undo failures in complex walkover scenarios
- Fixed matches returning to LIVE state instead of READY after undo
- Resolved "TBD vs Real Player (READY)" impossible match states
- Fixed incomplete player clearance from auto-advanced match chains
- Eliminated dialog display issues with incorrect match identifiers

This represents a fundamental architectural improvement that transforms the undo system from a complex, failure-prone cascade tracker into a bulletproof state reconstruction engine. The system now guarantees perfect tournament consistency regardless of scenario complexity.

---

## v1.2.1 - Enhanced Match Results with Player Progression Info

### Added
- **Player Progression Information**
  - Match results now display where each player advances next or their elimination rank
  - Winners show next match destination (e.g., "FS-2-1", "BS-3-2") or "Tournament Winner!"
  - Losers show either next match they move to or elimination rank (e.g., "7th-8th", "5th-6th")
  - Real-time progression info appears immediately after match completion

- **Enhanced Match Results Layout**
  - Right-aligned match scores with improved visual separation
  - Progression info displayed in italic text within parentheses for subtle emphasis
  - Flexbox layout separates player information from match scores
  - Mobile-responsive design stacks elements vertically on small screens

- **Comprehensive Ranking System Integration**
  - Leverages existing hardcoded tournament progression logic from `MATCH_PROGRESSION`
  - Reuses existing `formatRanking()` function for consistent rank display
  - Maps elimination matches to specific ranks (BS-1-1 → 7th-8th, BS-2-1 → 5th-6th, etc.)
  - Supports all bracket sizes (8, 16, 32 players) with accurate rank assignments

- **Updated Help Documentation**
  - Added "Match Results" section to Setup page help system
  - Documents new progression info display format
  - Maintains consistency with existing help text style and tone

### Technical Implementation
- `getEliminationRankForMatch()` - Maps match IDs to elimination ranks using tournament progression rules
- `getPlayerProgressionForDisplay()` - Extracts progression logic from existing winner confirmation system
- Enhanced `updateMatchHistory()` - Integrates progression info with existing match display
- New CSS classes: `.match-result-enhanced`, `.player-info`, `.result-score`, `.progression-info`
- Zero code duplication - reuses existing `MATCH_PROGRESSION` and `formatRanking()` functions

### User Experience Improvements
- Instant visibility into tournament flow and player standings
- Clear understanding of match consequences before they happen
- Consistent information display matching Match Completion dialog and Results Table
- Improved visual hierarchy with right-aligned scores and italic progression text

### Files Modified
- `main.js` - Added helper functions and enhanced match history display with progression info
- `styles.css` - New flexbox layout with italic progression info styling and mobile responsiveness  
- `dynamic-help-system.js` - Added Match Results documentation to Setup page help

This update transforms the Match Results display into a comprehensive tournament flow indicator, showing not just what happened, but what happens next for each player.

---

# 2025-09-12

## v1.2.0 - Match History Display & Visual Winner Identification

### Added
- **Comprehensive Match History Display**
  - Complete chronological match history in Setup page "Match Results" column
  - Latest completed matches shown at top, earliest at bottom
  - Shows match ID, player names, winner, and final scores when available
  - Real-time updates when matches are completed or when navigating to Setup page
  - Automatic population on page refresh/initial load

- **Visual Winner Identification**  
  - Winner's name highlighted in green (#059669) and bold in "Player vs Player" display
  - Consistent color matching with "Winner: Player" indicator
  - Clear visual hierarchy for instant match result recognition

- **Walkover Match Differentiation**
  - Auto-completed walkover matches displayed with muted/greyed styling
  - Italic text treatment distinguishes walkovers from regular matches
  - Special handling preserves walkover status in visual presentation

- **Match Completion Timestamps**
  - Added `completedAt` timestamp to all match completions
  - Enables accurate chronological sorting of match history
  - Applies to both manual match completions and auto-advanced walkovers

### Technical Implementation
- `updateMatchHistory()` function in main.js for rendering chronological match list
- `isWalkoverMatch()` helper function for consistent walkover detection
- Completion timestamps added to `completeMatch()` in clean-match-progression.js
- CSS styling with `.match-history-item`, `.winner-name`, and walkover variants
- Auto-refresh integration with tournament save operations
- Mobile-responsive design with proper stacking and spacing

### User Experience Improvements  
- Instant visual feedback showing tournament progress and results
- Quick identification of match winners through color-coded names
- Clear distinction between regular matches and administrative walkovers
- No manual refresh needed - history updates automatically as tournament progresses

### Files Modified
- `main.js` - Added match history rendering, winner highlighting, and auto-update integration
- `clean-match-progression.js` - Added completion timestamps and history refresh calls  
- `styles.css` - Match history styling with winner name highlighting and walkover differentiation
- `tournament.html` - Utilizes existing "Match Results" column structure

This update transforms the previously empty "Match Results" column into a comprehensive, real-time tournament activity log with clear visual indicators for match outcomes.

---

## Tournament Setup UX Improvements - Duplicate Prevention & Field Management

### Added
- **Duplicate Tournament Prevention**
  - Validation prevents creating tournaments with identical name AND date combinations
  - Clear error message guides users to choose different name or date
  - Same name with different dates allowed (e.g., weekly tournaments)
  - Different names on same date allowed (multiple tournaments per day)

- **Smart Tournament Field Management**
  - Tournament name field remains empty on page load for clean tournament creation
  - Tournament date field always defaults to today's date
  - Input fields preserve user work during normal navigation between pages
  - Fields automatically clear after successful tournament creation
  - Fields automatically clear after failed creation attempts (duplicates)

- **Tournament Loading Safety**
  - Added confirmation dialog when loading existing tournaments
  - Shows detailed comparison between current and target tournament (name, date, progress, players)
  - Prominent reassurance that no data is lost when switching tournaments
  - Clear information about automatic saving and ability to reload any tournament

- **Enhanced Match Completion Dialog**
  - Shows winner advancement information (which match they progress to, e.g., FS-3-1)
  - Shows loser progression (next match or elimination status)
  - Tournament finals display "wins the tournament!" message
  - Color-coded progression info with visual styling for clarity
  - Improved dialog layout with statistics tip positioned above progression information

### Enhanced
- **Dialog System Improvements**
  - Transformed Match Details dialog from browser alert to rich modal dialog
  - Transformed Undo confirmation dialog from browser confirm to rich modal dialog
  - Both dialogs now feature consistent styling, better readability, and improved UX
  - Added proper focus management with Cancel button as default selection
  - Enhanced visual indicators (box-shadow and scale) for default button choice

- **Setup Page Layout and Navigation**
  - Split Recent Tournaments area into two-column layout with scrollable content areas
  - Left column: Recent Tournaments (maintains existing functionality)
  - Right column: Match Results (prepared for future tournament activity display)
  - Eliminated page-level scrolling - Setup page now fills full browser viewport height
  - Added responsive design: columns stack vertically on mobile devices
  - Moved "Create Tournament" button to the right of the date input field
  - Improved visual alignment and button positioning

- **Registration Page Space Utilization**
  - Implemented sticky footer layout for better vertical space usage
  - Results table now positioned at bottom of viewport when few players are registered
  - Maintains two-column layout (player cards left, results table right)
  - Automatic scrolling when content exceeds viewport height
  - Responsive mobile layout with proper stacking behavior

- **Match Controls System (formerly Match Details)**
  - Transformed simple text-based match listing into interactive Match Controls interface
  - Organized matches into clear sections: LIVE matches first, then Ready matches by bracket side (Front/Back)
  - Added direct match management: start matches, complete matches, assign lanes and referees
  - Replaced single "Complete Match" button with intuitive "[Player Name] Wins" buttons for clear winner selection
  - Auto-refresh: Match Controls updates in real-time after starting matches
  - Smart navigation: cancelling or completing matches returns user to Match Controls interface
  - Consistent functionality: uses same proven tournament logic as bracket interface
  - Updated UI terminology from "Match Details" to "Match Controls" throughout application and help system

### Fixed  
- **Destructive User Behavior Prevention**
  - Eliminated automatic population of tournament name field with active tournament data
  - Prevented accidental duplicate tournament creation due to pre-filled fields
  - Reduced operator-generated failures through better UX design

### Technical Changes
- Added `clearTournamentFields()` helper function for consistent field management
- Enhanced `createTournament()` function with duplicate detection and field clearing
- Modified `autoLoadCurrentTournament()`, `loadSpecificTournament()`, and `importTournament()` to preserve user input during navigation
- Added tournament name/date validation using localStorage `dartsTournaments` array
- Improved Setup page HTML structure with flexbox layout for button positioning

### User Experience Improvements
- Prevents confusion about tournament creation status through clear field states
- Eliminates common user error of creating multiple tournaments with same name/date
- Preserves user work when navigating between pages accidentally
- Provides immediate, clear feedback when tournament creation succeeds or fails
- Creates consistent, predictable behavior for tournament management workflow

### Files Modified
- `tournament.html` - Updated Setup page layout, button positioning, and Match Controls modal structure/titles
- `tournament-management.js` - Added duplicate validation, field clearing logic, and helper functions
- `main.js` - Modified auto-load behavior to preserve user input during navigation
- `bracket-rendering.js` - Implemented Match Controls interface, winner button logic, and auto-refresh functionality
- `clean-match-progression.js` - Enhanced winner confirmation modal with Command Center return navigation
- `styles.css` - Added Match Controls styling with winner button layout and hover effects
- `dynamic-help-system.js` - Updated help documentation for Match Controls functionality

This update significantly reduces operator-generated errors, provides a much more intuitive tournament creation experience, and transforms match management with the new interactive Match Controls system.

---
# 2025-09-11
## Advanced Undo System - Walkover Match Handling & Tournament Completion

### Fixed
- **Walkover Match Undo Corruption** 
  - Resolved critical issue where undoing matches with walkover opponents left players in invalid states
  - Fixed "Walkover vs Real Player (READY)" states that violated tournament integrity
  - Players are now properly removed from auto-advanced walkover match chains during undo operations
  - Walkover matches remain as "Walkover vs TBD" after upstream match undos, preventing illegal game states

- **GRAND-FINAL Undo Tournament Completion**
  - Fixed issue where undoing GRAND-FINAL left tournament in completed state with stale rankings
  - Tournament placements and status now properly reset when GRAND-FINAL is undone
  - Results table correctly clears placement points and rankings after GRAND-FINAL undo
  - Player placement properties are reset to maintain data consistency

### Enhanced
- **Player Matching Logic**
  - Enhanced undo system to match players by name instead of ID during cleanup operations
  - Resolves issues caused by auto-advancement creating new player objects with different IDs
  - Ensures reliable player removal from walkover matches during transaction rollback

- **Tournament State Management**
  - Added `clearTournamentCompletionState()` function for proper tournament state reset
  - Tournament status transitions from "completed" back to "active" when appropriate
  - Comprehensive clearing of placement data across all tournament and player objects

### Technical Changes
- Enhanced `clearPlayerFromDownstream()` to handle walkover matches correctly
- Added name-based player matching in undo operations to handle ID changes from auto-advancement
- Implemented tournament completion state detection and clearing in `undoTransactions()`
- Added `clearedMatches` tracking to prevent restoration of cleared walkover matches
- Enhanced debugging output for walkover match state transitions and tournament completion changes

### User Experience Improvements
- Eliminates invalid tournament states that could confuse organizers and participants
- Provides reliable undo functionality even in complex scenarios with walkover progressions
- Maintains accurate results table that reflects actual tournament state
- Tournament organizers can confidently undo GRAND-FINAL without manually clearing results

### Files Modified
- `clean-match-progression.js` - Enhanced walkover handling, tournament completion state management
- `bracket-rendering.js` - Improved undo validation for auto-advanced matches

This update resolves the final critical issues in the surgical undo system, ensuring robust tournament management regardless of walkover match complexity or tournament completion state.

---
# 2025-09-10

## Enhanced Undo System - Surgical Match Correction

### Added
- **Transactional History System**
  - Replaced snapshot-based undo with transaction-based history tracking
  - Each match completion creates a discrete transaction record
  - Enables targeted undo operations without affecting unrelated matches

- **Surgical Undo Functionality**
  - Undo any completed match that has no downstream dependencies
  - Visual indicators: Winner checkmarks become undo icons (↺) on hover for undoable matches
  - Intelligent validation prevents undos that would break tournament integrity
  - Preserves original bracket assignments while clearing only affected downstream placements

### Enhanced
- **Match State Management**
  - Improved validation to prevent invalid match states (e.g., LIVE matches with TBD players)
  - Better handling of cross-bracket dependencies between frontside and backside
  - Cleaner restoration of match states during undo operations

### Technical Changes
- Implemented `saveTransaction()` for discrete match completion tracking
- Added `undoTransactions()` with recursive downstream clearing
- Enhanced `isMatchUndoable()` validation using progression rule lookups
- Added `clearPlayerFromDownstream()` for precise player removal from affected matches

### User Experience Improvements
- Tournament organizers can now correct errors discovered well after they occurred
- Particularly valuable for 32-player tournaments where mistakes might be found late in the process
- Maintains tournament integrity by preventing undos that would create invalid bracket states
- One-step-at-a-time undo approach provides predictable and safe error correction

### Files Modified
- `clean-match-progression.js` - Core transaction and undo logic implementation
- `bracket-rendering.js` - Enhanced undo validation and visual indicators
- Match progression now uses hardcoded lookup tables for precise state management

This enhancement transforms error correction from a linear "last-match-only" limitation to a flexible system that allows surgical precision in fixing tournament mistakes while maintaining bracket validity.

# 2025-09-09
## Improved Export of Results & Split Semifinal Configuration

### Added
- **Results Exported as JSON**
  - Better for importing into other systems
  - Current CSV is handled poorly in Excel

- **Split Semifinal Configuration**
  - Separate match length settings for frontside and backside semifinals
  - **Frontside Semifinal**: Best of 5 (default) - applies to FS-3-1 (8p), FS-4-1 (16p), FS-5-1 (32p)
  - **Backside Semifinal**: Best of 3 (default) - applies to BS-3-1 (8p), BS-5-1 (16p), BS-7-1 (32p)
  - Auto-save functionality for both new settings
  - Migration support for tournaments with old single "semifinal" setting
 
### Fixed
- **Tournament Import**
  - Bracket rendering failed when importing and loading tournaments
  - Bracket size is now calculated from the tournament JSON file
  
- **Match Generation Error**
  - Fixed "Assignment to constant variable" error in bracket generation
  - Corrected variable naming conflict between string IDs and numeric counters
 
### Technical Changes
- Added two new functions:
  - `exportResultsJSON()`
  - `generateResultsJSON()`
- Added semifinal detection functions:
  - `isFrontsideSemifinal(matchId, bracketSize)`
  - `isBacksideSemifinal(matchId, bracketSize)`

### Files Modified
- `tournament-management.js` - Fixed bracket loading for older tournaments
  - Added `bracketSize` calculation fallback in `loadSpecificTournament()` when property is missing
  - Added `bracketSize` calculation fallback in `processImportedTournament()` for imported tournaments
  - Ensures tournaments without stored `bracketSize` can render complete brackets by calculating from bracket array length

- `results-config.js` - Added JSON export functionality and split semifinal config
  - Added `exportResultsJSON()` function for structured data export
  - Added `generateResultsJSON()` function creating tournament metadata and player results
  - Enhanced export UI with separate JSON and CSV options for different use cases
  - Updated `DEFAULT_CONFIG` to include `frontsideSemifinal` and `backsideSemifinal` settings
  - Added migration logic for old `semifinal` config in `mergeWithDefaults()`
  - Updated config save/load functions to handle split semifinals

- `tournament.html` - Updated export interface and match configuration
  - Modified Registration page to include both "Export JSON" and "Export CSV" buttons
  - Provides users choice between structured data (JSON) for system integration and spreadsheet format (CSV) for Excel analysis
  - Replaced single "Semi-Finals" dropdown with separate "Frontside Semifinal" and "Backside Semifinal" dropdowns in Config page

- `main.js` - Enhanced auto-save functionality
  - Updated `setupConfigAutoSave()` to handle new split semifinal fields
  - Added auto-save listeners for `frontsideSemifinalLegs` and `backsideSemifinalLegs`

- `clean-match-progression.js` - Split semifinal logic and bug fixes
  - Updated `generateFrontsideMatches()` to use `config.legs.frontsideSemifinal` for semifinal matches
  - Updated `generateBacksideMatches()` to use `config.legs.backsideSemifinal` for semifinal matches
  - Added helper functions to detect frontside and backside semifinal matches
  - Fixed variable naming conflict causing "Assignment to constant variable" error
  - Separated string match IDs from numeric counters in match generation

### User Experience Improvements
- Tournament organizers can now set different match lengths for frontside vs backside semifinals
- More granular control over tournament pacing and format
- Backward compatibility maintained - existing tournaments load normally with migrated settings
- JSON export provides better data structure for external analysis tools

### Bug Fixes
- Resolved bracket generation crash when creating tournaments with split semifinal configuration
- Fixed tournament import/loading issues for tournaments missing bracketSize property
- Improved error handling in match generation process

These changes provide enhanced tournament configuration flexibility while maintaining system stability and backward compatibility.

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

# What happened before this?

- Everything else, essentially...
- In essence, all that needed to be done for the entire app framework. Just that it wasn't particularly useful or polished, nor was it especially stable (which is the main selling-point of the whole thing)
