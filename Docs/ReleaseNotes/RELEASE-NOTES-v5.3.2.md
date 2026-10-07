# Release Notes — v5.3.2 — Don't You (Forget About Me)

**NewTon DC Tournament Manager v5.3.2 — October 7, 2026**

---

## Overview

Tournament Setup is the first page you see, and it had too much to look at: two dark buttons, four big headings, boxes inside boxes. It now shows the one thing to do next, and that changes with where the tournament is.

The draw got the same treatment. The purpose is simple: never start a tournament by accident with a player missing. Match Controls now makes it impossible to start the draw while anyone is unpaid, and lets you remove a player who isn't playing without leaving the page.

The progression rules, the match history and undo are untouched.

---

## Tournament Setup: One Thing to Do

The page now has one framed panel and one dark button, and which ones depends on the tournament:

- **New or Active:** the current tournament comes first and is framed. Its next step is the dark button: **Register players** before the draw, **Open bracket** while it's running. Starting another tournament is a quiet **+ New tournament** line under it, which opens when you need it.
- **Completed:** the next job is a new tournament, so **Start a new tournament** moves to the top, open and framed, with **Create tournament** as the dark button. The finished tournament sits under it as a recap, with who won, and Open in Analytics.
- **A first visit**, with nothing created yet, looks the same as Completed.

### A calmer current tournament

- The status and its fact are on one line: **New** · the bracket isn't drawn yet, **Active** · 12 of 30 matches completed, **Completed** · won by …
- The four boxed figures are one line: 16 players, all paid · 16-player bracket · 2 live now, with a slim progress bar while the tournament is running.
- The next step sits open on the card, instead of in a box of its own.

### No more jumping to Player Registration

Creating a tournament, loading one from the list and importing one used to switch to Player Registration on their own (an import after a second and a half, taking its own message with it). Setup now stays put, and the tournament's next step, **Register players**, is one click away.

---

## Nobody Left Out of the Draw

In Match Controls, before the draw:

- **The draw waits for everyone to be paid.** While anyone is unpaid, the draw buttons are greyed out and say so ("2 players unpaid"), and the note says what to do. Before, the card said "Only paid players go into the bracket" and then refused the draw with a pop-up.
- **Remove a player who isn't playing** with the **×** on their chip. Only unpaid players have one: to remove someone who has paid, mark them unpaid first, so one stray click can't take a paid player out.
- **Shuffle & Draw is at the top** of the right-hand column, above Seeding, so the draw is always in the same place.

---

## Smaller Things

- **One background:** a faint grey frame showed around Setup, Registration, Analytics and Global Settings, because the window and the pages used two slightly different greys. They now use the same one.
- **"Draw an 8-player bracket"**, not "a 8-player", on the draw buttons and in the Seeding panel.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Nothing stored has changed.

This release moves `:latest` forward to v5.3.2. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.3.2 — Don't You (Forget About Me).*
