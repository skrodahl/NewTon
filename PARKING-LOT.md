 Parking Lot - Tournament Manager

## Inbox
*Raw ideas and suggestions awaiting triage*
- (Experimental) Render match cards to align with previous rounds [render]
- Match Details dialog: Match history, without auto-advance matches
- **Automatic Referee Selection**: Tournament operators have difficulty finding eligible referees manually. Automatic selection algorithms tend to have corner cases that invalidate actually eligible referees. Need smarter referee suggestion system that handles edge cases gracefully. [ux][referee-management]
  - **Proposed Solution**: Add "Recent Results" column to Match Controls showing 10 most recent losers first, then 10 most recent winners, with match IDs in parentheses. Filter out players already assigned as referees or in LIVE matches. Losers are prioritized as they're eliminated and immediately available, while winners may have upcoming matches. Provides simple lookup table for operator to manually select appropriate referees.
  - **Design Note**: Would require expanding Match Controls dialog width by ~30%. Current dialog is already wide but not sufficient for additional column layout.
- **Match Controls Scroll Position Reset**: On Windows Chrome, selecting Lane/Referee dropdowns causes dialog to refresh and scroll back to top, disrupting workflow when scrolled down through Ready to Start matches. Does not occur on Mac Chrome. Need to preserve scroll position during dialog updates. [ux][browser-compatibility]
## Next  
*Promoted items to consider soon (max 3 items)*
- Render BS-FINAL after FS Semifinal, Render GRAND-FINAL after BS-FINAL [render] - bracket-rendering.js:renderFinalMatches()

## Later
*Not urgent but worth tracking*
- Player cards shadow matching results table [ui] - styles.css - Add shadow to .player-card

## ✅ Completed This Session
*Items completed on <date>*
- N/A

---
**Last updated:** September 12, 2025
