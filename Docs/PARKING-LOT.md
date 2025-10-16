 Parking Lot - Tournament Manager

## Inbox
*Raw ideas and suggestions awaiting triage*

## Next
*Items ready for implementation*

### URGENT: Setup Page Scrollable Areas Broken
**Issue:** Scrollable areas on the Setup page are not functioning properly

**Status:** Needs investigation and fix

## Later
*Not urgent but worth tracking*

## Decided against

### Immediate Pruning of START_MATCH and STOP_MATCH on Match Completion
**Decision:** Decided against in-place pruning of active tournaments. Implemented export-only pruning instead.

**Original Idea:** Automatically remove START_MATCH and STOP_MATCH transactions for a match immediately when COMPLETE_MATCH is saved

**Concerns:**
- Mid-tournament exports used for backups need full transaction history for debugging
- Automatic history modification during active tournaments could interfere with troubleshooting
- Users may want complete historical record preserved until tournament completion

**Alternative Solution Implemented:** Export Pruning for Completed Tournaments Only (v3.0.0-beta)
- Transaction history optimization happens automatically during export
- Only applies when `tournament.status === 'completed'`
- Mid-tournament exports preserve full history
- Uses same smart pruning algorithm as Developer Console
- 40-60% typical reduction in transaction count for completed tournament exports
- Silent operation, no user action required

**Outcome:** Best of both worlds - optimize completed tournament file sizes without affecting active tournament data integrity

### Auto-Pruning on Match Completion
**Decision:** Decided against automatic pruning during tournament. Implemented export-only pruning instead.

**Original Idea:** Automatically run smart transaction pruning after each match completion to maintain optimal storage usage throughout tournament

**Concerns:**
- Mid-tournament exports used for backups need full transaction history
- Automatic history modification could interfere with debugging active tournaments
- Performance overhead of running pruning after every match completion
- User confusion about why transaction counts don't grow as expected
- localStorage limits (10 MB) are generous enough that pruning isn't urgent during active tournaments

**Alternative Solution Implemented:** Export Pruning for Completed Tournaments Only (v3.0.0-beta)
- Same benefits (reduced file size, optimal storage) without modifying active tournament data
- Manual pruning still available via Developer Console for users who need it mid-tournament
- No design complexity (no config settings, thresholds, or timing considerations needed)

**Outcome:** Simpler solution that addresses the core need (smaller export files) without the complexity and risks of automatic in-place pruning

## ✅ Completed This Session
- **Export Pruning for Completed Tournaments** (v3.0.0-beta): Automatic transaction history optimization during export. Only prunes completed tournaments (preserves full history for mid-tournament backups). Uses same smart pruning algorithm as Developer Console. Typically removes 40-60% of redundant transactions from completed tournament exports. Silent operation, no user action required.
- **Project Structure Reorganization** (v3.0.0-beta): Moved all JavaScript files to js/ folder and CSS to css/ folder for cleaner root directory
- **Zoomed Match Card Focus Preservation** (v2.4.3): Match cards stay zoomed when changing Lane or Referee by removing unnecessary bracket re-renders. Dropdowns update without visual interruption. Note: Zoom naturally ends when mouse leaves card boundaries (e.g., selecting dropdown options rendered outside card), which is expected behavior.
- **Player List Registry** (v2.4.0): Persistent player registry with tab interface in Registration page
- **Match Results Humanization** (v2.4.0): "Grand Final" and "Backside Final" in Setup page Match Results
- **Tournament Results Empty State** (v2.4.0): Clean "No players added yet" message when table is empty
- **Shared Tournament Delete Permission** (v2.4.0): Config setting to control delete button visibility for shared tournaments
- **Subtle Shadows** (v2.4.1): Added depth to content boxes across all pages
- **Droid Serif Typography** (v2.4.1): Application title now uses serif font for professional feel
- **Player List Tab Reordering** (v2.4.1): Player List tab now appears first and is selected by default
- **Favicon** (v2.4.1): Added favicon support using club logo
- **Sort Player List Alphabetically** (v2.4.1): Player List displays in alphabetical order for easier scanning
- **Config Page Dynamic Help - Add Developer Console** (v2.6.0-beta): Updated Config page dynamic help to include comprehensive Developer Console information with feature overview, access instructions, and key capabilities including Lane Usage monitoring
---
**Last updated:** October 16, 2025
