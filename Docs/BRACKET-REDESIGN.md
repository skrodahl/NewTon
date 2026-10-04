# Bracket Redesign - Design & Planning

**Status:** Implemented for both formats (double and single elimination drawn by `js/bracket-view.js`, new bracket page header); the classic renderer and its CSS are removed. Not yet released. See [Implementation](#implementation).
**Last Updated:** 3 October 2026

Mockup (private artifact, version 17): https://claude.ai/artifact/2MW8SuVVN7kKVxeJbe2CbJ

---

## Goal

A tournament bracket that fits on one page, with every round visible, and that reads as easily as today's butterfly. Today's 32-player bracket either shows the matches too small to read or hides where the lines go. The fix is a canvas built from scratch, with real coordinates and bounds, rather than a restyle of the current one.

The redesign covers the bracket layout only. Match operations (declare winner, lane, referee, undo) move to a modal, opened from the selection bar after clicking a match.

---

## Agreed Decisions

| Decision | Choice |
|---|---|
| Layout | **Butterfly**: backside mirrored to the left, frontside to the right. Stacked (frontside above backside) was tried and rejected as too tall. |
| Rounds | **All rounds visible.** No folding or collapsed rounds. |
| Finals | **Display choice**: "Right" (as today) or "Middle" (both halves end beside the finals). A **Right | Middle toggle on the bracket toolbar**, as in the mockup, so it can be switched at any time. Remembered as an optional config value; missing means "right". |
| Fit | **Fills a single page.** Fit all is the furthest you can zoom out. The bracket can't be panned off-screen. |
| Scroll | **Scroll zooms**, centred on the cursor, as today. Drag pans. |
| Cards | **Compact, no controls.** Simplified "far away" cards were tried and rejected. |
| Colours | **Quiet.** Only live matches stand out. Round badges were removed as too busy. |
| Card size | **The same card at every bracket size.** The spacing between cards grows to fill the page. Fit all never zooms past 100%. |
| Hover | **Magnifies the match** when zoomed out, as today. When zoomed in, shows just where its players go. |
| Click | **Selects the match**, as in the mockup: its lines and connected matches are highlighted until cleared. Matches are run from Match Controls, not the bracket; the selection bar has Undo match (when possible) and a Match Controls button (see [Match Operations](#match-operations)). |
| Follow player | **Keep.** "Follow <player>" traces one player's path through the bracket and dims everything else. Confirmed as really useful. |
| Card borders | Never thinner than 1px on screen (1.5px for live, ready and final), but no thicker when zoomed in. |

---

## Layout Rules

One function covers 8, 16 and 32 players. It reads the progression table (`getProgressionTable()`) and never modifies it. With the frontside alone it also covers single elimination.

- **Columns are rounds.** Frontside round *r* is column *r* on its side; backside round *r* is column *r* on the other side. The finals get their own column.
- **Frontside rows.** Round 1 is spaced evenly. Every later match sits midway between the two matches whose winners feed it.
- **Backside rows.** Backside round 1 sits midway between the two frontside matches whose losers it receives. Later rounds sit midway between their backside feeders, or level with their single backside feeder in rounds where frontside losers drop in.
- **Finals ("Right").** The finals get their own column. The grand final is level with the frontside final, so the frontside winner's line is straight; the backside final sits directly below the grand final. The line from the backside comes up its right side and continues into the grand final from the right, with a T-junction into the backside final, mirroring the frontside final's split on the left. The two halves meet in the grand final from both sides. Tried and dropped: the backside final above the grand final (the backside line had to run past the grand final), and the backside final in the frontside final's column (hard to read).
- **Finals ("Middle").** The grand final and backside final are stacked around the vertical middle, grand final on top, matching "Right". The frontside final is level with the grand final and the backside's last match level with the backside final, so both feed in with straight lines.
- **World coordinates.** Everything is placed from 0,0 with known width and height, so the camera can fit the whole bracket, fit a set of matches, and tell when a match is off-screen.

### Geometry used in the mockup

| Constant | Value | Meaning |
|---|---|---|
| Card | 200 × 80, names 20px | World units. Fixed for every bracket size |
| Row gap | 10, grows up to 90 | Between cards in a column |
| Column gap | 34, grows up to 134 | Between rounds |
| Centre gap | 34, grows with the column gap | Between backside and frontside; equal to the column gap so the round-1 forks match |
| Finals gap | 64, grows with the column gap | Before the finals column |

**Spacing fills the page, not the cards.** The bracket is first fitted at its tightest spacing, with fit-all capped at 100%. Whatever space is left over goes into the row and column gaps, up to their limits; anything beyond that is left as margin around a centred bracket. A 32-player bracket on a wide screen gets wider column gaps; an 8-player bracket gets taller row gaps. The card itself never changes, so 8, 16 and 32 players look alike, just at different zoom levels.

An earlier version stretched the card height (and name size) per window instead. It filled the page, but cards looked wildly different between 8, 16 and 32 players, so it was dropped.

### Lines

- **Winner lines** run from the centre of a match to the centre of the next, with the corner halfway across the gap. Two feeders form a fork; a single feeder is a straight line.
- **Crossing lines.** A winner line that would cross other matches is routed around the bracket instead.
- **Backside into the finals ("Right").** The backside runs right to left, so its last match's line leaves from its left side, runs under the bracket, up the right edge, and enters the backside final from the right.
- **Frontside final (both layouts).** It feeds both finals: the winner's line runs straight on to the grand final, and the loser's line drops from the bottom middle of the card and turns into the backside final from the left. Both are always drawn. Winner goes on, loser drops down. (A T-junction off the grand final line was tried first; it made both branches look alike.)
- **Loser drops** are drawn only for the selected match: dashed, entering the player row they fill, with a small "loser" tag. Exceptions: frontside final → backside final (above, both layouts), and with the finals on the right, frontside round 1 → backside round 1 is always drawn, exactly like the winner lines: centre to centre, so they mirror the frontside forks. With the finals in the middle those would cross the whole bracket, so they stay selection-only.
- **Line colour** is the same for every drawn line, except fainter into a match that has no players assigned yet.
- **Line width** is constant on screen at any zoom.

### Other Formats

The layout is the one part that depends on the tournament format. Everything around it is shared.

- **Shared:** the card, the camera (fit, zoom, pan), the hover magnifier and progression tip, the selection bar (Follow player, Undo match, Match Controls).
- **Per format:** a layout function that takes the format's matches and returns positions, connections and labels in world coordinates. The rest of the screen only asks it where things go.

Double elimination gets the butterfly described above; single elimination is its frontside alone. A future format can be drawn in a completely different way (a grid for round robin, columns that fill in as pairings are made for Swiss) without stretching this layout to fit it. Adding a format means writing one layout, not a new renderer.

The format already picks the progression table (`getProgressionTable()`); the same choice would pick the layout. Layouts only read the progression data, never replace it. There is still one progression table per format.

---

## The Card

Proposed 200 × 80, the same at every bracket size (today: 280 × 150).

- **Top strip:** match ID, state, lane and best-of. No controls on the card.
- **Two player rows** with leg scores in a right-aligned column, so results can be read straight down a round.
- **Empty slots name their source**, for example "Winner FS-2-1" or "Loser FS-4-2".
- **States:**
  - Live: orange border and fill, pulsing dot.
  - Ready: amber border, soft yellow fill.
  - Completed: green outline, green winner row, loser greyed. A player eliminated from the tournament is struck through.
  - Waiting: dashed grey border.
  - Walkover: faded.
- **Throws first:** a small dot before player 1, who always throws first in this app (the classic card marked the same).

---

## Navigation (Camera)

- **Camera** is position and zoom over world coordinates.
- **Zoom is multiplicative** and centred on the cursor (today it adds a fixed 0.025 per tick).
- **Minimum zoom is fit all**; maximum is 200%.
- **Pan is clamped** so the bracket stays on screen. When the whole bracket fits, it is centred.
- **Toolbar:** Finals Right | Middle, Fit all, −, zoom %, on-screen name size, +. A "Now" button (fit the live and ready matches) was tried and dropped: live and ready matches are usually spread across both halves, so it landed close to Fit all.
- **Header (agreed).** Two rows above the bracket, as in the mockup:
  - Top row: tournament name and date (and page navigation) on the left; Finals Right | Middle, Fit all and the zoom controls on the right.
  - Second row: a status line (players, matches, played, walkovers, live, ready) and the state legend.
  - No on-canvas usage hint ("Hover a match to magnify it · …"). It was redundant and covered the side labels; how to use the bracket belongs in the help system.
  - Navigation lives in the header: the tabs Bracket | Match Controls (Match Controls shares the bracket's frame; see [Views](#views-bracket--match-controls)), Leaderboard as a button (it opens over the bracket), Setup, Registration, Config and Analytics as quieter links (they leave the page).
  - The CAD info box and the bottom identity line are removed from the bracket page; the header carries the name and date, and the status line the counts. Clock, version and status were dropped for now, to reconsider later.
  - The mockup's Players 8 | 16 | 32 selector and the "cards … names …" figures are mockup-only and do not go into the app.
- **Magnifier.** Hovering a match while zoomed out (below 90%) shows a full-size copy over it after a short delay, with its paths ("Winner → X · Loser → Y"). It ignores the pointer and is hidden while dragging or animating.
- **Progression tip.** Hovering a match at 90% or more shows only the paths line, just below the card (above it near the bottom edge), since the card itself is already readable.
- **Selection.** Clicking a match highlights its lines and connected matches. Off-screen connected matches get markers at the viewport edge; clicking a marker moves to that match. "Follow <player>" traces a player's path and dims everything else. The Follow buttons toggle in place, so the selection bar never changes under the pointer: click another player to switch, or the same one again to stop. The bar also has Undo match (only when the match can be undone) and Match Controls. Esc or a click on empty space clears the selection.

---

## How Big It Gets

Fit-all zoom and name size on screen, calculated from the mockup's layout with the fixed card. Viewports allow for browser bars and toolbar. Around 10px is readable at arm's length; below 7px you see shapes and colours rather than names.

| Bracket | Today (default view) | Laptop 1400 × 800 | TV 1920 × 1080 |
|---|---|---|---|
| 8 players | 61% · 9.8px | 79% · 15.9px | 100% · 20px |
| 16 players | 45% · 7.2px | 56% · 11.2px | 78% · 15.6px |
| 32 players | 33% · 5.3px | 38% · 7.5px | 56% · 11.1px |

Today's figures use the zoom from `getDefaultView()` with 16px names. At 32 players on a laptop the magnifier does the reading.

---

## What's Wrong With Today's Canvas

- **No bounds.** Positions are measured from `centerX: 500`, the backside reaches about x = −2000 at 32 players, and `.bracket-canvas` is a fixed 3000×3000 box. With no bounds there is no way to fit, so `getDefaultView()` uses hand-tuned zoom and pan per size.
- **Zoom steps by fixed amounts.** `handleZoom()`, `zoomIn()` and `zoomOut()` add or subtract 0.025: an 8% jump at 0.3 and about 1% at 2.0. The 0.3 floor can stop a 32-player bracket from fitting.
- **Positions only exist in the DOM.** `renderMatch()` writes them to `style.left`/`style.top`, so code can't ask where a match is and the view can't move to one.
- **Written out per size.** 8, 16 and 32 players each have their own render and line functions; `bracket-lines.js` alone is about 1,900 lines.

---

## Match Operations

**Decided: matches are not controlled from the bracket.** The bracket is for seeing the tournament; Match Controls stays the one place where matches are run (start, lane, referee, winner, handover). The selection bar adds two shortcuts that need the selected match:

- **Undo match**, shown only when `isMatchUndoable()` allows it; it calls `handleSurgicalUndo()` (its confirmation dialog included). This replaces clicking the winner's ✓ on the classic card.
- **Match Controls**, always the rightmost button in the bar (before ×); it switches to Match Controls and flashes that match there.

Dropped: a slide-in match panel (about 360px, from the right, with winner buttons, lane and referee selects, paths and one action per state). It was agreed at first, then dropped once the selection bar's shortcuts proved enough, so match operations keep a single home.

---

## Design Language

Notes, started 3 October 2026. The bracket sets the visual language; the rest of the app is expected to follow it page by page. The recently reworked modals (winner confirmation, edit statistics) are already close. This section may move to its own document once other pages start.

**Goal:** distinct contrast without going monochrome, and without a circus of colours or shadows.

### Principles

Three tools, each with one job:

- **Lightness carries hierarchy.** One solid dark button per view for the main action (like Match Controls). Secondary actions are outlined. Surfaces step from page grey to white panels to light grey insets. What matters most is darkest, not most colourful.
- **Colour carries meaning, and only meaning.** Orange is live, amber is ready, green is winner or done, red is destructive or removing. Colour never decorates, so when it appears it says something. Live matches stand out because nothing else competes with them.
- **Shadows mark floating layers only.** Modals, the magnifier and the selection bar float above the page and get one soft shadow. Nothing that sits on the page has a shadow. Edges come from crisp borders instead.

Type does the fine work: bold for names and headings, small uppercase with wide letter spacing for labels, monospace for match IDs, scores and other figures.

### Interaction rules

- **The frame stays put; only the content changes.** A bar, panel or modal never changes shape or moves its buttons under the pointer. Toggles switch in place (the Follow buttons). Learned from the first selection bar, which swapped its contents when Follow was clicked.
- **Hover informs, click acts.** Hovering shows information (magnifier, progression tip) and never changes state. Clicking selects or acts.
- **No redundant controls.** If a control mostly does what another already does, drop it (the "Now" button, the on-canvas usage hint).
- **One primary action per view.**

### Components

| Component | Look | Seen in |
|---|---|---|
| Primary button | Solid dark (`--header`) with light text; turns accent on hover | "Open match", selected segment of a toggle |
| Secondary button | Outlined, light fill, dark text | Follow, Cancel |
| Segmented toggle | Joined outlined buttons; the selected one is solid dark | Finals Right \| Middle |
| Active toggle button | Accent-soft fill, accent border and text | Follow while following |
| Panel | Light grey fill, light border, rounded corners, no shadow | Statistics tiles, score box |
| Section label | Small uppercase, bold, wide letter spacing, muted grey | Bracket column labels, MATCH PROGRESSION, 180S |
| Floating bar | White, light border, rounded, one soft shadow | Selection bar |
| Modal | Optional grey sidebar for fixed facts, white content, footer separated by a rule | Winner confirmation |
| Status line | Plain text with bold figures, then the state legend | Bracket header, second row |

Modals in the app currently use a green-outlined primary button ("Confirm Winner", "Save Statistics"). The direction is the solid dark primary, with green kept for meaning ("Jimmy advances to FS-2-4").

### Colour tokens

Shared by the redesigned pages in `css/design-tokens.css` (`--nt-*`); `css/bracket-view.css` aliases them as `--bv-*`, and Global Settings (`css/config-page.css`) uses them directly. Global Settings was the second page redesigned in this language, from its own mockup (https://claude.ai/artifact/BUn1sDA9XgfG1SDh2grUbi): grouped sections, one setting per row, one save bar, and a save-or-discard check when leaving with unsaved changes.

The values, from the bracket mockup:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f4f3f1` | `#15161a` | Page |
| `--surface` | `#ffffff` | `#1e2026` | Cards, panels, bars |
| `--surface-2` | `#faf9f7` | `#23252c` | Insets, card meta strip |
| `--band` | `#ecebe8` | `#202127` | Backside band |
| `--ink` / `--ink-2` | `#111827` / `#374151` | `#f3f4f6` / `#d1d5db` | Text |
| `--muted` / `--faint` | `#6b7280` / `#9ca3af` | `#9ca3af` / `#6b7280` | Labels / placeholders, waiting borders |
| `--line` | `#d6d3d1` | `#3a3d46` | Light borders, lines between matches |
| `--line-strong` | `#78716c` | `#a8a29e` | Lines between played matches |
| `--card-line` | `#a8a29e` | `#5f6470` | Card border |
| `--header` | `#1f2937` | `#0d0e11` | Primary button, selected toggle, dark tip |
| `--accent` / `--accent-soft` | `#ff6b35` / `#ffe7dc` | `#ff7d4d` / `#42261b` | Live, selection |
| `--ready` / `--ready-soft` | `#d4a017` / `#fbf0c8` | `#e7b93a` / `#3a3115` | Ready |
| `--done-border` / `--done-win` | `#6fa684` / `#e3f2e8` | `#3f7a52` / `#1d3326` | Completed card / winner row |

Live, ready and waiting cards also have their own fills (`--live-fill`, `--ready-fill`, `--pending-fill`). Light and dark mode are both defined; dark follows the system setting unless overridden.

### Type

- **Sans:** Inter, already bundled in `fonts/`.
- **Mono:** the mockup uses JetBrains Mono from Google Fonts. The app must stay offline, so use the bundled Cascadia Code, or bundle JetBrains Mono.
- **Decided (4 October 2026): the old typography goes.** The redesigned pages use Inter throughout; the Insignia display face in the current app header is retired with it.

### App header (agreed for the rest of the app)

The header in the Global Settings mockup (https://claude.ai/artifact/BUn1sDA9XgfG1SDh2grUbi, version 2) is the header for every page as the rest of the app is redesigned:

- **Top row:** club logo (round, about 34px) and "<Club name> - Tournament Manager" in Insignia Regular, 20px (Inter bold was tried first; the maintainer chose Insignia), on the left; the clock on the right.
- **Clock:** the same as the bracket header's: 30px, weight 800, tabular digits so its width never changes, with a thin divider on its left.
- **Second row:** the page links (Tournament Setup, Player Registration, Tournament Bracket, Analytics, Global Settings, Chalker) as plain text; the current page is darker and bold, underlined by a 2px line.
- White, with a single hairline under it; no boxed border, no shadow.

### Views: Bracket | Match Controls

Match Controls is no longer a dialog. It is a view in the bracket page's frame, switched with the tabs **Bracket | Match Controls** in the header (`showBracketView()` in `js/bracket-rendering.js`). Mockup: `frame-views.html`, approved 2026-10-04.

- Match Controls is a layer over the bracket (`.bv-stage` holds both), so the bracket keeps its size and camera underneath and comes back exactly as it was left.
- On Match Controls the bracket's tools (Finals, Fit all, zoom) and the colour legend are hidden; the clock and the status line stay. Match Controls' own header and footer are gone: **Scan QR results** sits in the Lanes heading, and the start view is a Global Setting, **Start on Match Controls** (on by default; `config.ui.autoOpenMatchControls`, the old auto-open setting).
- The layer keeps the id `matchCommandCenterModal` and is shown with `style.display = 'block'`, so the code that redraws Match Controls after an action (including `clean-match-progression.js`, unchanged) still finds it open.
- Leaderboard stays a dialog.
- **Console** is the third tab, shown when the Developer Console is enabled in Global Settings (`#devConsoleView`, `css/dev-console.css`, filled by `js/analytics.js`). Left: the status figures (with a dot for health) and the commands, grouped Inspect / Repair / Change; right: the current view over a collapsible console output. It runs (captures `console.log`, refreshes every 2 seconds) only while its tab shows: `startDeveloperConsole()` / `stopDeveloperConsole()`, called by `showBracketView()` and on leaving the page. The page never starts on it.
- The same frame with tabs may later host other tournament formats; those need their own source of truth, designed with the core foundations, and are to be discussed first.

The bracket page keeps its own full-screen header (tournament name, Match Controls, Finals, zoom, clock), which follows the same type and clock.

**On trial (after v5.1.10):** `css/app-header.css` applies this header, and a matching footer, to the existing markup. There are no markup or script changes: the logo is 40px; the tournament name and date stay to the left of the clock. The footer is full width with a hairline above, and on short pages it sits at the bottom of the window. To go back to the old header and footer, remove the stylesheet's `<link>` from `tournament.html`.

**Page widths** (tokens in `css/design-tokens.css`): `--nt-page-max` 1520px for forms and short lists (Setup, Global Settings, Registration), `--nt-page-wide` 1840px for table-heavy pages (Analytics). Both sit inside 24px side margins. The app runs full screen, so the browser is at least 1920px wide. The header always spans the full window.

Kept after trying it. **Pages redesigned so far:** Global Settings (v5.1.10), Tournament Setup (`css/setup-page.css`), Player Registration (`css/registration-page.css`, reuses Setup's `st-*` panel, button and field styles), Analytics (`css/analytics-page.css`, wide width; the one page with a phone layout, since club members use the analytics-only instance on their phones). Match Controls (`css/match-controls.css`): a lanes board with the live matches, free lanes on one line, the ready queue by round, referees; a before-the-draw view and a finished view with podium and highlights. Shared parts (the Leaderboard table, NewtonTable, the match-number tag, the match detail) are in `css/components.css`. The registration *process* (saved players especially) is to be reworked later; the current page is laid out to take that.

---

## Constraints

- **Foundations untouched.** The progression tables in `clean-match-progression.js`, the transaction history and the undo system are read, never modified or duplicated. The layout only derives positions from the tables.
- **Config is additive.** The finals position is a new optional config value; missing means "right".
- **Test with 8, 16 and 32 players**, both finals positions, light and dark mode, and single elimination.

---

## Implementation

### Phases

1. **New bracket view for double elimination — done (unreleased).** `js/bracket-view.js` and `css/bracket-view.css`: layout from `getProgressionTable()`, camera, cards, lines, hover magnifier and progression tip, selection with edge markers, Follow, Finals Right | Middle. The bracket page header replaced the floating buttons and the CAD box (moved forward from the cosmetic phase so nothing floats over the bracket and Fit all can use the whole viewport).
2. **Selection bar shortcuts — done (unreleased):** Undo match (only when possible) and Match Controls. Replaces the planned match panel, which was dropped (see [Match Operations](#match-operations)).
3. **Remove the classic renderer — done (unreleased).** `js/bracket-lines.js`, the `render*Player*` / `render*SE*` / `renderMatch` / `renderTitles` functions, `getDefaultView()`, the old zoom and pan, the CAD box updater and the bottom-centre status messages. The classic CSS is removed too, and the bracket page's frame rules live only in `css/bracket-view.css`. The old cards' lane and referee dropdown code in `lane-management.js` and `bracket-rendering.js` is removed as well; Match Controls keeps its own.
4. **Single-elimination layout — done (unreleased).** `layoutSE()` in `js/bracket-view.js`: rounds up to the semifinals; the bronze final in the next column, level with the top semifinal; the final in the column after, midway between the semifinals. Semifinal winners fork straight after the semifinals and run under the bronze final to the final; a dashed line joins the bronze final to that line. Labels: Round 1…, Quarterfinals, Semifinals, Bronze final (with "3rd place" below), Final. The layout is chosen by format (`layoutFor()`); everything else is shared. The classic renderer is now unused for both formats.
5. **Cosmetic changes** (the maintainer's list) — in progress alongside the phases above.

### How phase 1 fits into the existing code

- `renderBracket()` and `renderCleanBracket()` stay the entry points, so their callers are unchanged. For double elimination `renderCleanBracket()` calls `BracketView.render()`; `renderBracket()` skips the classic default view and transform.
- `handleZoom()`, `startDrag()`, `handleDrag()`, `endDrag()` return early, and `zoomIn()`, `zoomOut()`, `resetZoom()` forward to the view, while it is active. Single elimination keeps the classic behaviour.
- The view re-renders on every `renderBracket()` and keeps the camera, selection and Follow. A different tournament, size or finals position clears the selection and fits again; a viewport resize only fits again.
- Cards keep the `bracket-match-<id>` element ids. The lane and referee lookups in `lane-management.js` find no select inside them and return quietly.
- The application signature (`#tournament-watermark`) is drawn below the last first-round match, where `renderBracket()`'s identity check expects it.
- Player 1 throws first (the classic card marked the same), so the dot is always on the top row.
- Finals position: `config.ui.bracketFinals` (`'right'` | `'middle'`), additive; missing means right.
- Colour tokens are scoped to `.bracket-container` (`--bv-*`), light only. Mono font: the bundled Cascadia Code.

---

## Open Questions

- **Screen.** What is the bracket actually run on at tournaments: laptop, TV, or both?
