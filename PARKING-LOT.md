 Parking Lot - Tournament Manager

## Inbox
*Raw ideas and suggestions awaiting triage*
- (Experimental) Render match cards to align with previous rounds [render]
- Match Details dialog: Match history, without auto-advance matches
## Next  
*Promoted items to consider soon (max 3 items)*
- Render BS-FINAL after FS Semifinal, Render GRAND-FINAL after BS-FINAL [render] - bracket-rendering.js:renderFinalMatches()

## Later
*Not urgent but worth tracking*
- Player cards shadow matching results table [ui] - styles.css - Add shadow to .player-card

## ✅ Completed This Session
*Items completed on September 16, 2025*
- **Match Controls Scroll Position Reset** [ux][browser-compatibility] - Fixed dialog refresh causing scroll reset to top when changing lane/referee assignments. Added scroll position preservation during dialog updates.
- **Enhanced Transaction System** [core][data-integrity] - Expanded transaction tracking from match completions to all match state changes (start/stop, lane assignment, referee assignment). Ensures complete undo safety and data integrity.
- **Match Results Enhancement** [ux][data-display] - Added lane and referee information to Match Results display on Setup page. Shows "Referee: [Name] • Lane [Number]" format for completed matches.
- **JSON Export Enhancement** [data-export] - Enhanced JSON export to include comprehensive lane and referee data with full traceability for tournament record keeping.
- **Stop Match Button** [ux][match-controls] - Added red "Stop Match" button to LIVE match cards in Match Controls dialog for easy correction of accidentally started matches.
- **Referee Suggestions System** [ux][referee-management] - Implemented comprehensive referee suggestion system in Match Controls dialog with intelligent filtering and visual organization:
  - **Smart Filtering**: Excludes assigned referees, LIVE players, and walkover players from suggestions
  - **Prioritized Display**: Shows up to 10 recent losers first (immediately available), then up to 10 recent winners
  - **Visual Organization**: FS players grouped first with light backgrounds, BS players second with darker backgrounds matching bracket color scheme
  - **Context Information**: Each suggestion shows player name and round context (e.g., "Player Name (FS-R2)")
  - **Expanded Layout**: Match Controls dialog width increased from 800px to 1100px for two-column layout
  - **Multiple Appearances**: Winners may appear multiple times from different rounds, providing operators insight into player activity patterns

---
**Last updated:** September 16, 2025
