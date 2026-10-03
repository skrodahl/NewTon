# Release Notes — v5.1.10 — Straight Down the Middle

**NewTon DC Tournament Manager v5.1.10 — October 4, 2026**

---

## Overview

A bracket is a map of the night. It should tell you, at a glance, who is playing, who is waiting, and where everyone goes next.

The old bracket did that well for eight players and struggled at thirty-two. Zoomed out far enough to see every round, the names were too small to read; zoomed in far enough to read them, you lost track of where the lines went. This release replaces it with a bracket built from scratch: every round on one page, a calmer card, lines you can follow, and the finals wherever you want them, including straight down the middle.

Global Settings got the same treatment, and both pages share a new, cleaner look that the rest of the app will follow.

---

## Every Round on One Page

Open the bracket and the whole tournament fits the screen. **Fit all** brings you back there from anywhere, and it is as far out as you can go, so the bracket can never drift away into empty space.

- **Scroll to zoom** at the pointer, or **pinch** on a trackpad or touch screen. **Drag** to move around.
- **Hover a match** when zoomed out and it is magnified, readable from across the room, with where its winner and loser go underneath. Zoomed in, hovering shows just that line.
- Every bracket size uses **the same card**. Small brackets spread out to fill the page instead of blowing the cards up, so 8, 16 and 32 players look like the same tournament.

The card itself is quieter. It shows the match number, the players, the leg score and, for a live match, its lane. Colour means something and nothing else: **orange** is live, **yellow** is ready to start, **green** is played, a **dashed grey** card is still waiting for its players, and a **faded** card was a walkover. An orange dot marks who throws first. Empty slots say where their player is coming from, such as "Winner FS-2-1" or "Loser FS-4-2".

---

## Following the Play

**Click a match** and its lines light up, along with the matches it is connected to. If those are off-screen, the view glides to show them; if they are too far apart, markers at the edge point the way ("Winner → FS-3-2 ↗"), and clicking a marker takes you there.

A bar at the bottom names the match and offers:

- **Follow [player]**: trace one player's whole path through the bracket, every match they have played and where they go next. Click the name again to stop, or the other player to switch.
- **Undo match**: shown only when the result can safely be undone. It replaces clicking the winner's tick on the old card, with the same checks and the same confirmation.
- **Match Controls**: straight to where matches are run.

That is a deliberate split. **The bracket shows the tournament; Match Controls runs it.** Starting matches, lanes, referees and choosing winners all happen in Match Controls, and the bracket keeps up.

---

## Straight Down the Middle

The finals can sit where they always have, at the right edge, or **in the middle**, between the frontside and the backside, so both halves meet in the centre. Switch with **Finals: Right | Middle** in the bracket header, or set it in Global Settings. Either way it is remembered.

The finals themselves were redrawn so the story reads at a glance. The frontside final's winner goes straight on to the Grand Final; its loser drops into the Backside Final. The backside's last match comes round and joins in, and the two halves meet in the Grand Final. With the finals on the right, the lines from the first round down to the backside's first round are drawn too, so you can see where the early losers go.

The club name now sits at the top of the bracket, and every round is labelled right above its first match: the round on the frontside, and the places still up for grabs on the backside.

---

## Single Elimination, Too

Single elimination brackets get the same view with a layout of their own. The rounds lead up to the semifinals; the **Bronze final** sits above the main line, level with the top semifinal, and the **Final** stands alone at the end. Everything else (hover, selection, Follow, Undo match) works the same way.

---

## The Bracket Header

The floating buttons and the information box in the corner are gone. In their place, a header along the top:

- The **tournament name and date**, and links to Setup, Registration, Config and Analytics.
- **Match Controls** and **Leaderboard** in the middle.
- **Finals Right | Middle**, **Fit all**, zoom, and a **big clock**. The bracket runs full screen, so the computer's own clock is out of sight; this one is readable from the oche.
- A line underneath counting players, matches played, walkovers, and what is live and ready, with a colour legend.

When a result comes back from a Chalker over the network, the **Match Controls** button shows an orange count ("1 result") until it has been accepted, so it can't be missed.

---

## Global Settings, Redesigned

The settings page has been rebuilt from the ground up.

- Settings are **grouped by what you're doing**: Club, Tournaments, Match day, Bracket, Chalker, Server & backup, and Developer, with a list on the left to jump between them.
- Each setting is **one row**: what it does on the left, the control on the right. On/off settings are switches; small choices are buttons; match lengths are − Bo3 + steppers side by side for double and single elimination; points are two tidy tables.
- **Lanes not in use** are now lane numbers you click, instead of a comma-separated list to type.
- **One save for the whole page.** The seven Save buttons and their pop-ups are gone. Change anything and a bar appears with **Discard** and **Save changes**, and the list marks each section you have touched.
- **Leaving with unsaved changes asks first:** Stay, Discard and continue, or Save and continue.

Everything is worded in plain language, and the setting that turns on the developer tools is now called what it is: **Enable Developer Console**. The console opens from a **Console** link in the bracket header.

---

## Fixes

- **Refusing a referee in Match Controls** now puts the dropdown back. It used to keep showing the refused name until Match Controls redrew.
- **Saving lane settings** no longer switches off the "require a lane before starting" setting.

---

## Under the Hood

The old bracket was written out by hand for each bracket size and format. The new one works out the layout from the tournament's progression rules, the same rules that decide who plays whom, so one set of code draws every size and both formats. About **7,500 lines** of old bracket code and styles are gone with it.

The rules themselves, the match history and undo are untouched. The new bracket only reads them.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings.

The finals position is a new, optional setting. Existing installations start with the finals on the right, as before.

This release moves `:latest` forward to v5.1.10. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.1.10 — Straight Down the Middle.*
