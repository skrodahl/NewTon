# Single Elimination Cup

**Status:** Planning
**Last Updated:** February 2026

---

## Overview

Single Elimination (SE) is the natural next feature for the Tournament Manager. It's essentially the frontside half of the existing Double Elimination bracket — one loss and you're out. No backside, no Grand Final.

SE adds immediate value as a standalone tournament format and lays the foundation for Series/League (which uses SE-style round-robin match schemes).

---

## Roadmap Context

| Step | Feature | Depends On | License |
|------|---------|------------|---------|
| 1 | **Single Elimination Cup** | Nothing — standalone value | No |
| 2 | **QR Code Communication** | Payload schemas (documented in Docs/QR.md) | No |
| 3 | **Series / League** | SE + QR/MQTT + License | **Yes** |

SE and QR are both open-source features that provide direct app value while building toward the licensed Series/League feature.

---

## SE vs DE — What Changes

### What's reused from DE
- Match state machine (pending → ready → live → completed)
- Match Controls UI (winner selection, confirmation dialogs)
- Player management and registration
- Lane assignment system
- History/undo system
- Best-of legs configuration per round
- All Chalker functionality (unchanged)

### What's different
- **No backside bracket** — losers are eliminated, not sent to a lower bracket
- **No Grand Final** — the final match winner takes the tournament
- **Simpler progression** — winner always advances to next round, no loser path routing
- **New progression tables** — SE needs its own `MATCH_PROGRESSION` entries in `clean-match-progression.js`
- **Bracket rendering** — single bracket column layout instead of frontside/backside split
- **Match ID format** — `SE-R-M` (e.g., `SE-1-3` = Round 1, Match 3) instead of `FS-`/`BS-` prefixes
- **Fewer matches** — N-1 total matches for N players (vs ~2N for DE)
- **Bye handling** — same logic (auto-advance real players), but only one bracket to fill

### Bracket sizes
Same as DE: 8, 16, and 32 players. Seeding and bye distribution follow the same patterns.

| Players | Rounds | Total Matches |
|---------|--------|---------------|
| 8 | 3 | 7 |
| 16 | 4 | 15 |
| 32 | 5 | 31 |

---

## Implementation Approach

The key architectural question: how much of the existing DE code can SE share vs. what needs to be separate?

### Option A: SE as a mode within the existing system
- Tournament type field: `"doubleElimination"` or `"singleElimination"`
- Shared bracket rendering with conditional backside
- Shared progression logic with SE-specific tables
- Minimal new code, but adds conditionals throughout

### Option B: Parallel SE module
- Separate progression tables, separate rendering
- Cleaner separation, but some code duplication
- Easier to reason about independently

**To discuss:** The right approach depends on how much the existing bracket rendering can cleanly handle "no backside" without becoming a mess of conditionals.

---

## Series / League (Future, Licensed)

Context for how SE feeds into Series/League:

### Format
- **Two teams**, four players each + one reserve per team
- **Round-robin singles**: Each player plays against each opponent (4×4 = 16 singles matches)
- **Doubles matches**: 2 doubles matches per round
- **Reserve exchange**: A team can swap one player for the reserve between matches

### What Series/League needs from the platform
- SE-style match progression (round-robin, not elimination bracket)
- Player-to-team assignment with reserve slot
- Match scheduling (round-robin order, not bracket-driven)
- Team scoring (aggregate of individual match results)
- Reserve substitution tracking (who was swapped and when)
- QR or MQTT for match result transfer (licensed feature — MQTT only)

### Key differences from cups
- Matches are scheduled in a fixed order, not bracket-driven
- No elimination — all matches are played regardless of results
- Team aggregate scoring replaces bracket progression
- Doubles matches require pairing two players per side

> **Note:** Series/League is a licensed feature, only available through the network bridge (MQTT). It cannot be started via QR. See **Docs/NETWORK-LAYER.md** for licensing boundaries.

---

## Related Documents

- **Docs/QR.md**: QR communication protocol (same payload format for SE and DE matches)
- **Docs/NETWORK-LAYER.md**: Network integration plan and licensing boundaries
- **Docs/SINGLE-SOURCE-OF-TRUTH.md**: Data architecture principles

---

## Open Questions

1. **Tournament type selection UI**: Where does the user choose SE vs DE? Tournament creation dialog? A toggle?

2. **Points configuration**: Does SE use the same placement point system as DE, or does it need its own? (Fewer placements to distribute points across.)

3. **SE progression tables**: Can the existing `MATCH_PROGRESSION` object structure accommodate SE, or does it need a parallel structure?

4. **Bracket rendering**: Can the existing bracket renderer handle "frontside only" cleanly, or is a separate renderer cleaner?

5. **Statistics page**: Does SE need its own stats view, or does the existing one adapt?

6. **Series/League match format**: Are the singles matches best-of-3, best-of-5, or configurable per league? Same question for doubles.

7. **Reserve rules**: Can a reserve be swapped in mid-match, or only between matches? Is there a limit on how many swaps per round?
