# Release Notes — v5.4.4 — Run the whole darts night. Offline.

**NewTon DC Tournament Manager v5.4.4 — October 11, 2026**

---

## Overview

A new face. The website is designed from scratch for people discovering the software: what it does, how a club night runs with it, the formats, why it can be trusted, and how to start. The documentation and release pages wear the same look, and the Design System page documents it.

In the app, a tournament's format now shows wherever tournaments are listed, and the Analytics Dashboard's top 10 tells you a little more at a glance.

---

## A New Website

- **The landing page, designed from scratch.** Dark and warm, with the dartboard's red as the one accent. It opens with "Run the whole darts night. Offline." beside the bracket and the Chalker, with **Launch** and **Download** right there.
- **A night, start to finish:** the screenshots become a numbered timeline, in the order a night happens: doors open, the draw, on the boards, at the oche, the final, the morning after.
- **Pick Your Format** shows each format's pictogram, the same ones as at the draw: "Small night or full house, there's one for it."
- **Built for the room, not the cloud:** works offline, your data stays yours, never loses a result, free and open source.
- **Getting started** comes last, where you have decided: try it in the browser, download it, or host it on your own server.
- **The documentation and release pages** (user guide, Architecture, Docker quickstart, the REST API and QR pages, privacy, every release page) share the new look, with the content unchanged: a dark bar at the top, Insignia headings, easier-to-read text, code on dark, and the Download button in red.
- **The Design System page** documents the new design, drawn with the site's own styles: the palette, the typefaces, the buttons and cards.
- **The Architecture page** is brought up to date: how every format is built from the same progression tables, the real storage keys, and the limits as they are now (48 players with qualifiers).
- **Insignia stays.** The typeface from the maintainer's first darts is the wordmark and every heading.

---

## The Format, Wherever Tournaments Are Listed

- **Tournament Setup's list of tournaments** has a Format column: Double elim., Single elim., Cup & Plate, Round robin, Swiss. A tournament not yet drawn shows a dash.
- **The Load tournament dialog** shows the format too ("Not drawn yet" before the draw).
- **The draw dialog** names Cup and Plate as Cup and Plate, not Single Elimination.
- **Analytics' Dashboard** shows the format in Latest tournaments.

---

## Analytics: A Fuller Top 10

The Dashboard's Leaderboard top 10 now shows **W–L**, **Attendance** and **Achievements** beside Played, 1st and Points: a few more numbers at a glance, without turning it into the full Leaderboard.

---

## Smaller Things

- **Swiss's pictogram** shows the top four's semifinals before the final, as the finish is played.
- **Swiss's line** is now "Your results pick your opponent."

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Nothing stored has changed; the export format is unchanged.

This release moves `:latest` forward to v5.4.4. Installed Chalker apps refresh automatically on their next online launch.

---

*NewTon DC Tournament Manager v5.4.4 — Run the whole darts night. Offline.*
