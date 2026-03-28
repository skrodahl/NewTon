# Release Notes — v5.0.1-beta.5 — The Loop Closes

**NewTon DC Tournament Manager v5.0.1-beta.5 — 2026-03-28**

---

## Overview

v5.0.1-beta.5 completes the TM → Chalker → TM round trip. Scanning a Chalker result QR no longer just previews the scores — it can now complete the match, with achievements extracted automatically from the raw visit data. The operator chooses: score only, or score plus everything the numbers can tell.

---

## Complete Match from Result QR

When a result QR is scanned for a match that is currently live, two completion buttons appear alongside the score preview:

- **Score only** — declares the winner and updates the bracket with leg scores; no achievements applied
- **Score + achievements** — extracts achievements automatically from the visit scores, applies them to both players' stats, and records them in the transaction exactly as manual completion does

If the scanned match is not live (completed, pending, or from a different tournament), the buttons are replaced with Close — the preview still works, completion does not.

The same completion flow is available from the QR Payload Inspector in the Developer Console.

---

## NewtonStats — Achievement Extraction from Raw Visit Scores

A new pure-function module (`js/newton-stats.js`) reads the Chalker's base64-encoded visit score payload and extracts:

- **180s** — any visit scoring exactly 180
- **Tons (100–179)** — any visit scoring 100–179
- **High outs** — the checkout visit of a won non-tiebreak leg where the score is ≥ 101
- **Short legs** — won non-tiebreak legs finished within the Short Leg Threshold

Short Leg Threshold is configurable in Global Config → Chalker (default: 21 darts). The threshold was always in the Chalker, but is now also owned by the TM for use in extraction.

---

## Lollipop Counter

A lollipop (three single 1s — 1, 1, 1) produces a visit score of 3. A score of 3 is ambiguous: it could also be treble-1 or double-1 + single-1. Auto-detection is not possible.

The preview dialog includes a manual +/− counter per player for lollipops, styled to match the Statistics modal. The counter only appears when the match can be completed.

---

## QR-Completed Matches Are Now Undoable

QR completions (`completionType: 'QR'`) were incorrectly blocked from undo by a filter that only accepted `'MANUAL'` transactions. Both `isMatchUndoable()` and `getMatchCompletionState()` have been updated. QR-completed matches now undo identically to manually completed ones, including the "Undo match + achievements" path when achievements were recorded.

---

## Match Length Expanded to Bo1–Bo21

All match configuration selects — SE and DE round types in the TM, and the manual entry form in the Chalker — now offer odd-numbered best-of values from 1 to 21. Bo1 is sudden death; Bo21 matches international championship formats.

The Chalker's win condition is `Math.ceil(bestOf / 2)` throughout — no game logic changes were required. The QR payload carries `bo` as a plain number and has no upper limit.

---

## Max Rounds Shows Dart Count

The Max Rounds selector in Global Config → Chalker now labels each option with its equivalent in darts: **13 (39 darts)**. Easier to cross-reference with a short leg threshold or a tournament rulebook.

---

## Files Changed

- `js/newton-stats.js` — new module: `decodeVisits()`, `extractAchievements()`, `hasAny()`
- `js/qr-bridge.js` — `showResultQRPreview()` checks match state, renders achievements table and lollipop counters, populates `#qrResultPreviewActions`; `applyQRResult()`, `applyAchievementsToPlayer()`, `qrIncrementLollipop()`, `qrDecrementLollipop()`; `handleQRInspectorPayload()` also offers completion when match is live
- `js/bracket-rendering.js` — `isMatchUndoable()` and `getMatchCompletionState()` accept `completionType === 'QR'`
- `js/results-config.js` — `shortLegThreshold: 21` in `DEFAULT_CONFIG.legs`; wired to `chalkerShortLegThreshold` input in `applyConfigToUI` and `saveMatchConfiguration`
- `tournament.html` — `chalkerShortLegThreshold` number input; max rounds options with dart counts; Bo1–Bo21 for all match selects; `#qrResultPreviewActions` div; `newton-stats.js` script tag
- `chalker/index.html` — best-of select extended to Bo21

---

## Migration

No migration required. Fully compatible with all existing tournament data.

---

## What's Next

- v5.0.1 stable release
