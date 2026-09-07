# Release Notes — v5.1.7 — Know Your Format

**NewTon DC Tournament Manager v5.1.7 — September 7, 2026**

---

## Overview

Both changes in this release come from one evening: the first tournament of the season.

Somebody clicked Single Elimination on a double elimination night. And the Status Panel — the CAD-style box on the Tournament page — insisted there were nine players and no matches, in front of fourteen players and a full bracket.

One of those is now impossible. The other was a real bug, and it is fixed.

---

## Choose Your Formats

Under **Config → User Interface**, a new setting: **Tournament formats to offer**.

Untick a format and it stops appearing on the Shuffle & Draw screen. A club that only plays double elimination sees one card and one button, and the wrong format cannot be chosen by accident.

It is worth saying why this became a setting rather than a sterner warning. The confirmation dialog already named the format twice — in its title, and in a field labelled Format — and it still happened. On a busy night, in a room full of people, nobody reads the dialog. Removing the option beats explaining it more loudly.

- **Your existing tournaments are untouched.** Hiding a format changes only the screen where a new tournament is started. A tournament already created in a hidden format still opens, renders, undoes and exports exactly as it always did.
- **You cannot hide everything.** The last remaining format locks, because a tournament manager that cannot start a tournament is not much use.
- **Formats added in future releases will appear by default.** The setting records what you have hidden, not what you have chosen — so something new shows up for everyone rather than staying invisible to precisely the clubs who took the trouble to configure this. If you do not want it either, untick it.

Behind it, the formats are now defined in one place instead of being written into the tournament screen by hand. That is invisible today; it matters the next time a format is added.

### The idea that was rejected

The first thought was to allow converting a tournament between formats, provided nothing past the first round had been played. It was dropped, and for a better reason than complexity: in double elimination, a first-round loser is *already advanced* into a backside match the moment that match completes, and that advancement is recorded in the tournament's history. Converting would mean rewriting or discarding history entries — the record everything else is derived from — to recover from a mis-click. Preventing the situation is a great deal safer than unpicking it.

---

## The Status Panel Tells the Truth

During a fourteen-player tournament, the Status Panel reported nine players and zero matches.

The panel had been reading a copy of the roster and the bracket held on the tournament object — a copy that looks authoritative but is never actually updated. It is created empty alongside the tournament, and only ever points at the live data when a tournament is loaded from storage. Three perfectly ordinary actions sever that connection for good: generating a bracket, removing a player, and creating a tournament. After any of them the copy is frozen at whatever it last held, while the real roster and bracket carry on without it.

Everything else in the app — including everything written to storage, which is why no data was ever at risk — uses the live data. Only the panel did not. It does now.

This was introduced in v5.1.6, in a change that stopped the panel re-reading storage on every save. The reasoning was that storage could not be fresher than what was already in memory. That was true of the tournament as a whole and false of those two particular copies, which is a distinction that took a live tournament to expose. Reloading the page put it right, which is exactly why it was so hard to catch afterwards.

A second, quieter symptom of the same cause is also fixed: a knocked-out player is once again struck through only in the match that eliminated them, rather than in every match they ever lost. In double elimination, someone who lost on the frontside and again on the backside appeared eliminated in both.

---

## On the Network Beta

Network match handover, introduced in v5.1.7-beta.1, is **still experimental and currently does not work** — transferring a match to a lane returns a server error. It has not graduated, and sharing a version number with that beta does not mean it has.

It remains switched off by default and nothing in this release depends on it. If you were curious, stay on QR handover for now.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, and Analytics. The new format setting starts with everything shown, so an existing installation behaves exactly as it did until you change it.

This release moves `:latest` forward to v5.1.7.

---

*Fun fact: the wrong player count had been sitting in a test harness for three weeks. It was noticed, written down as a quirk of the test setup, and moved past. It was not a quirk of the test setup.*

*NewTon DC Tournament Manager v5.1.7 — Know Your Format.*
