# Release Notes — v5.1.6 — One Throw, One Score

**NewTon DC Tournament Manager v5.1.6 — September 6, 2026**

---

## Overview

Another one for the code, not the board.

v5.1.5 put the whole codebase under the microscope and started working through a six-phase improvement plan. v5.1.6 **finishes it** — the last of the data-integrity work, and then the part the plan had been building towards: finding everywhere the app was doing the same job several times over, and making it do the job once.

Recording a result used to save your tournament two to four times in a row. Drawing a 32-player bracket used to re-read the entire match history sixty-odd times, once per card on screen. Neither was ever *wrong* — it was just work nobody asked for, repeated every time you completed a match, assigned a lane, or changed a referee. Now it happens once. The scores, the brackets and the standings are identical to the last decimal; there is simply less happening behind them.

Along the way, a few small things that *were* wrong turned up and got fixed.

---

## Doing Less, Getting the Same

Four places where the app was quietly repeating itself.

**Completing a match saves once.** Recording a result touched the saved tournament again and again: once for the result, again after recalculating the live rankings, again if the match set a placement — the Backside Final's third place, or a Single Elimination bronze match's third and fourth — and again if it finished the tournament. Each of those rewrote everything: every player, every match, along with a redraw of the status panel and the results table. It all happens in one go now: the result, the rankings and any placement are worked out first, then written once. Playing a full 32-player double-elimination tournament went from 127 saves to 63.

**Drawing the bracket reads the history once.** Every match card asks whether its result can still be undone, and answering that meant re-reading and re-unpacking the tournament's entire history of events — about 63 times per redraw on a full bracket. And the bracket redraws after every lane assignment, every referee change, every completed match. It now reads the history a single time per redraw and shares the answer with all the cards.

**Analytics loads in parallel, and stops reloading.** The Dashboard, Leaderboard, Players and Matches views each walked the finalized tournaments one at a time, waiting for one tournament's matches to come back before asking for the next. They now request them all at once. On top of that, the loaded matches are kept for reuse: switching the point mode between Original and Current, or toggling the Ranking and Attendance layers, only changes how the numbers are *multiplied* — the matches themselves are unchanged — but every toggle used to re-read everything anyway. Those toggles now do no database reads at all. With a dozen tournaments loaded, rendering the four views dropped from 48 reads to 12, and a toggle from 48 to none.

**The status panel stopped re-reading the tournament.** The CAD-style panel on the Tournament page refreshes after every save, and it used to fetch and unpack the whole saved tournament just to show a name, a few counts and a status — data the app was already holding in front of it.

One more thing simply stopped happening. To know which page you were on, the help system had been watching the *entire* document for changes — every element, every class — so it woke on every bracket render, every table repaint, every tick of the clock, and asked "which page is active?" each time. The app already knows when it changes page. Now it just says so.

---

## Small Things, Now Right

**F1 help matches the page you're on after a reload.** The app reopens on the page you left it, but the part that tracked which page that *was* only started listening half a second later, and so never saw that first move. Reloading straight onto the Tournament page and pressing F1 gave you Setup help until you navigated somewhere else. It now matches from the first press. This one surfaced only because the old page-detection was being replaced — it had been quietly wrong for a long time.

**The Short Leg Threshold setting reaches the Chalker.** The setting sits under CHALKER on the Config page, but until now the Chalker never actually received it. It judged short legs with its own built-in table while the Tournament Manager awarded the achievement using your configured value — so the "Short Leg" badge on the device could disagree with what you were credited. The threshold now travels to the Chalker with the rest of the match setup, so the badge and the award always agree. Matches started on the device itself, rather than assigned from a tournament, keep using the sensible built-in table, and older QR codes without the new field fall back to it too.

**The "BS-FINAL" label looks right on 16-player brackets.** Its typeface name had picked up a stray accent somewhere along the way — **"Ïnter" instead of "Inter"** — and that one character was enough to drop the label to a generic fallback font. It's fixed, and fixed in a way that keeps it fixed: the repair came while merging three near-identical copies of that label's drawing code into one, so the typo has nowhere left to hide and can't creep back into a copy that got missed.

**Export filenames survive awkward tournament names.** A tournament called *Spring/Fall: Cup* now produces a valid, sensibly-named download instead of a broken one. Renaming is deterministic, so re-uploading the same tournament still overwrites its file rather than piling up duplicates.

---

## Safer With Your Data

**The match register writes cleanly.** The behind-the-scenes register that feeds Analytics now records each completed match in a single, all-or-nothing step. Previously it checked for an existing record and wrote in two separate steps, so two near-simultaneous saves could both conclude "nothing there yet" and the second could be silently dropped. Deleting a tournament from the register is likewise all-or-nothing now, instead of a match at a time that could stop half way.

**Analytics notices when you correct a finished tournament.** Analytics holds the finalized tournaments it has loaded in memory. Nothing told it to let go of them when a match inside one of those tournaments was undone or re-entered — something possible through the maintenance route for correcting a completed tournament after the fact. It could go on showing the pre-correction figures until the page was reloaded. Completing and undoing a match now clear that held copy once the change has been written, so returning to Analytics shows the corrected data.

**Previewing a bracket no longer forgets the tournament you were editing.** In the Analytics-only deployment, opening a bracket preview used to deactivate whatever tournament you had open — the data was never at risk, but you had to go and reopen it from Recent Tournaments. The preview now puts things back where it found them when you leave, and reloading part-way through a preview no longer risks the read-only preview being mistaken for a real tournament.

---

## One Place, Not Five

The quiet half of this release. The app had accumulated second and third copies of the same logic in a dozen places, and copies drift. Two of them mattered enough to name.

**Whether an undo is allowed, and why it isn't.** Two separate pieces of code worked out whether a completed match could still be undone. One answered yes or no — deciding whether a winner's name is clickable to undo it. The other produced the wording you see on hover and in Match Controls: *"Cannot Undo, blocked by FS-3-1 (live)."* Both walked the bracket the same way, and they had to be kept in step by hand. Once already, they weren't: when QR completions were introduced, the same fix was needed in both places and got made in only one. They now share a single answer, so the button and the explanation cannot disagree.

**How player names are matched.** Analytics identifies players by name — each tournament stores its own player numbering, so there is nothing stable to match on across tournaments. That means every screen has to agree on exactly how a name is tidied up before comparing it, or the same person quietly becomes two people, or a player's record differs between the Leaderboard and the Players tab. That tidying was written out by hand in twenty separate places. It is now defined once. The two views also had identical copies of the match win/loss count; they share one now.

And then a long list of smaller merges, all invisible from the outside: the achievement-points formula that lived in five views, two hand-rolled copies of the Chalker score decoder, the referee assign and clear paths, the bracket's default zoom, the 32-player backside layout and its placement labels, the tournament export. The placement labels are worth a mention — they used to work out their own positions independently of the matches they sit above, correct today but one layout tweak away from silently sliding out of line. They follow the matches directly now, and simply can't.

You won't see any of it. What you get is an app where the next fix is one change in one place, instead of five places that can quietly start disagreeing.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics. This release changes how much work the app does, not the data it works on. Installed Chalker PWAs refresh to the new version automatically on their next online launch.

---

*Fun fact: every change here was checked by replaying whole tournaments through the old code and the new, side by side, and demanding identical results down to the byte. One of those test harnesses passed cheerfully for an afternoon before anyone noticed it was comparing nothing at all.*

*NewTon DC Tournament Manager v5.1.6 — One Throw, One Score.*
