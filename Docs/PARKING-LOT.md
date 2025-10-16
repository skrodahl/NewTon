 Parking Lot - Tournament Manager

## Inbox
*Raw ideas and suggestions awaiting triage*

### Immediate Pruning of START_MATCH and STOP_MATCH on Match Completion
**Idea:** Automatically remove START_MATCH and STOP_MATCH transactions for a match immediately when COMPLETE_MATCH is saved

**Current Behavior:**
- START_MATCH and STOP_MATCH transactions remain in transaction history after match completion
- These transactions serve no purpose after completion (only track live match duration)
- Accumulate unnecessarily throughout tournament
- Only removed when user manually runs "Smart Pruning" in Developer Console

**Proposed Behavior:**
- When `completeMatch()` saves COMPLETE_MATCH transaction, immediately remove all START_MATCH and STOP_MATCH transactions for that specific match
- Surgical removal (only affects completed match, not other matches)
- Silent operation (no user notification)
- Runs inline during match completion flow

**Benefits:**
- Reduces transaction history growth by ~40-60% automatically
- No user action required
- Zero storage waste for obsolete timing data
- Simpler than full auto-pruning (no background jobs, no thresholds)
- Safe - these transactions are never used after completion

**Implementation:**
- Add pruning logic to `completeMatch()` in clean-match-progression.js
- Filter transaction history: remove entries where `type IN ('START_MATCH', 'STOP_MATCH') AND matchId === completedMatchId`
- Save updated transaction history to localStorage
- ~5-10 lines of code

**Distinction from "Auto-Pruning on Match Completion":**
- This is immediate, surgical removal of specific obsolete transactions
- The other idea is full smart pruning algorithm running after each match (more complex, more considerations)
- This could be implemented quickly with zero design decisions needed

**Status:** Ready for implementation - no design questions, completely safe

## Next
*Items ready for implementation*

## Later
*Not urgent but worth tracking*

### Auto-Pruning on Match Completion
**Idea:** Automatically run smart transaction pruning after each match completion to maintain optimal storage usage throughout tournament

**Current Behavior:**
- Transaction history grows continuously during tournament
- Users must manually open Developer Console and run "Manage Transaction Log" → "Preview Smart Pruning" → "Prune Now"
- Storage usage can approach limits before user notices

**Proposed Behavior:**
- After each COMPLETE_MATCH transaction, automatically trigger smart pruning in background
- Silent operation (no user notification unless error occurs)
- Keeps transaction log lean throughout tournament lifecycle
- Users still have manual pruning option via Developer Console

**Benefits:**
- Zero-maintenance storage management
- Prevents storage limit warnings/errors
- Maintains optimal performance throughout tournament
- Reduces localStorage Usage statistic (stays green)

**Considerations:**
- **Performance**: Pruning operation needs to be fast enough to run after every match (~50ms target)
- **Timing**: Should run asynchronously after match completion to avoid blocking UI
- **User awareness**: Users might wonder why transaction count doesn't grow as expected (need documentation)
- **Override option**: Should there be a config setting to disable auto-pruning? (some users may want full history)
- **Frequency**: Every match? Every N matches? Every round completion?
- **Threshold-based**: Only auto-prune when transaction count > X or storage usage > Y%?

**Implementation Reference:**
- See **Docs/ANALYTICS.md** - Transaction Log Management section for smart pruning algorithm details
- Existing pruning logic in `analytics.js` (executeSmartPruning function)
- Hook into match completion in `clean-match-progression.js` after COMPLETE_MATCH transaction is saved

**Design Questions to Resolve:**
1. Should auto-pruning be opt-in (config setting) or always-on?
2. Should it show any UI feedback (toast notification, console log)?
3. Should it be threshold-based (only prune when needed) or run every match?
4. Should there be a "preserve full history" mode for debugging/analytics purposes?

**Status:** Idea stage - needs design discussion before implementation

## Decided against
- None

## ✅ Completed This Session
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
**Last updated:** October 15, 2025
