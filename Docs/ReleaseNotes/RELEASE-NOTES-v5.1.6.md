# Release Notes — v5.1.6 — Look, Don't Touch

**NewTon DC Tournament Manager v5.1.6 — Unreleased (draft; set the date at release)**

---

## Overview

Another one for the code, not the board.

v5.1.5 put the whole codebase under the microscope and started working through a six-phase improvement plan. v5.1.6 carries that forward on two fronts: it **finishes the data-integrity work**, and it begins a long **consolidation pass** — the unglamorous business of finding every place the app had quietly grown a second or third copy of the same logic and folding them back into one.

Two small fixes you might actually notice — a mislabelled font on the big brackets, and a Chalker setting that finally does what it promises. Otherwise, nothing about how you run a tournament changes — this is a manager that's a little sturdier and a lot tidier under the hood.

---

## A Font, Set Right

On 16-player brackets, the "BS-FINAL" label had been quietly rendering in the wrong typeface — and the cause was almost too small to see. A single accented character had crept into the font's name somewhere along the way: **"Ïnter" instead of "Inter."** That one stray dot was enough to send the label tumbling to a generic fallback font.

It's fixed. And it's fixed in a way that keeps it fixed: the repair came while merging three near-identical copies of that label's drawing code into a single shared one. With only one copy left, the typo has nowhere to hide and can't creep back into a version that got missed.

---

## Safer With Your Data

A few quiet reinforcements to the way the app handles your tournaments:

- **Match records write cleanly.** The behind-the-scenes register that feeds Analytics now records each completed match in a single, all-or-nothing step. A fast re-entry after an undo, or a hiccup mid-delete, can no longer leave it half-updated.
- **Exports always land safely.** A tournament whose name happens to contain a slash or a colon now always produces a valid, sensibly-named download instead of a broken one — and a small bit of memory that leaked on every single export has been tidied away.
- **The Analytics bracket preview looks without touching.** If you use an Analytics-only install to review and fix past tournaments, previewing an old bracket no longer forgets which tournament you had open, and can no longer leave a phantom copy of the preview behind. Look all you like; your working tournament stays put.

---

## A Setting Made Real

Open Config and, under the **Chalker** settings, you'll find a **Short Leg Threshold** — the number of darts at or below which a leg counts as "short." It looked like it controlled the Chalker. It didn't. The Tournament Manager used your value when it *awarded* the short-leg achievement, but the Chalker judged short legs on the scoreboard with its own built-in table — so the "Short Leg" badge a scorer saw could quietly disagree with the achievement the player was actually credited.

Now the threshold travels with the match. Hand a match to the Chalker by QR and your configured value goes with it, so the badge on the board and the achievement in the results always agree. Matches started directly on the Chalker keep using its sensible built-in defaults, and older tournament QR codes fall back to them too — so nothing you already rely on changes.

---

## One Place, Not Five

The heart of this release is repetition, removed.

Wherever the app had accumulated two, three, or five copies of the same calculation, they're now a single shared one:

- The **achievement-points math** — 180s, tons, high outs, short legs — was spelled out in five different views. It lives in one place now.
- The **default bracket zoom**, the **backside background panel**, and — the fiddliest of the lot — the **32-player placement labels** are now all driven from a single source of truth. That last one matters: those labels used to work out their own positions independently of the matches they sit above, which was correct today but one layout tweak away from silently sliding out of line. Now they follow the matches directly and simply can't.
- Add a run of smaller merges and a good clear-out of developer debug messages that used to clutter the console, and the codebase came out several hundred lines lighter.

You won't see any of it. What you get is an app where the next improvement is a one-line change in one place — instead of five places that can quietly start disagreeing with each other.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics. Nothing about how your data is stored changes — only, in a few small ways, how carefully the app looks after it. Installed Chalker apps refresh to the new version automatically on their next online launch.

---

*On the name: "Look, Don't Touch" is what we finally taught the Analytics bracket preview to do — review a past bracket without disturbing the tournament you're working on. And somewhere on a 16-player board, an umlaut that had been hiding in plain sight for who knows how many nights was, at last, shown the door.*

*NewTon DC Tournament Manager v5.1.6 — Look, Don't Touch.*
