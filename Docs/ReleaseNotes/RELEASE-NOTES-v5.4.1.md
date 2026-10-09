# Release Notes — v5.4.1 — Under Pressure

**NewTon DC Tournament Manager v5.4.1 — October 9, 2026**

---

## Overview

Double and single elimination now take **up to 48 players**. The bracket stays a 32-player bracket, and the players above 32 make it in through **qualifiers**, a round before round 1. A night that grows past 32 never has to turn anyone away.

Qualifiers were asked for by other clubs using NewTon. They are built the way Round Robin was: on the three foundations (the progression rules, the match history and undo), adding to them without changing them. A tournament of 32 or fewer runs exactly as before.

Round Robin, released yesterday, gets three improvements as well: groups of up to five or six, the cups' own match lengths, and a fairer A cup when there is no B cup.

---

## Qualifiers

### How many

One qualifier match for each player above 32. The winners take the last places in round 1.

| Players | Qualifiers | Players in them | Straight into round 1 |
|---|---|---|---|
| 33 | 1 | 2 | 31 |
| 40 | 8 | 16 | 24 |
| 48 | 16 | 32 | 16 |

At 48, every round 1 match has one qualifier winner and one player who went straight in.

### The draw

- **Qualifiers are the mirror of byes.** Below 32, byes are spread over round 1; above 32 there are none, and the qualifier winners take exactly the places the byes would have had, opposite the best seeds first.
- **Who plays them:** drawn at random. With seeding, the seeds always go straight in; with seeding set to **All**, the lowest-ranked play the qualifiers.
- **Everyone sees their path at once.** The bracket is drawn in one go, and a round 1 place shows "Winner Q3" until that qualifier is played. A round 1 match can start as soon as its own qualifier is done, without waiting for the others.
- **Length:** the format's regular rounds.

### A qualifier only decides who gets to play

- **Lose it and you're not qualified:** placed 33rd–48th.
- **Nothing in a qualifier counts, for the winner either:** only the score is entered, to decide who goes through. No 180s, high outs, short legs or tons, no matches or legs in the statistics, and the match never goes to Analytics. One extra match to collect points in wouldn't be fair on the players who went straight in.
- **Taking part points:** a new switch under Taking part in Global Settings → Points, **Also for qualifier losers**, on by default. The tournament still goes to Analytics with everyone in it, so a player who didn't qualify counts as having been there.

### On the night

- **The bracket** gets a Qualifiers column before round 1, each qualifier beside the match it feeds. With single elimination's finals in the middle, both halves get their own column on the outside. Double elimination with qualifiers is always drawn with the finals in the middle: with them on the right, the backside sits right where the qualifiers go.
- **Match Controls** puts the qualifiers first in the queue and in Next up, since each one unblocks a round 1 match.
- **Qualifier losers show in the referee suggestions**, free for referee duty in round 1.
- **The winner dialog and the Chalker** offer the score only for a qualifier.
- **Undo** works as for any match, until the round 1 match it feeds has started.

---

## Round Robin

### Largest group

A new setting in Global Settings → Round Robin: **4** (the default, as before), **5** or **6**. The draw makes the fewest groups it can, still an even number, so a larger limit means fewer, longer groups:

- 10 players: four groups (3, 3, 2, 2) at 4; two groups of 5 at 5 or 6.
- 20 players: six groups at 4; four groups of 5 at 5.
- A group of 4 plays 6 matches, of 5 plays 10, of 6 plays 15.

In a group of five, the player sitting a round out referees. Fifth and sixth places go on to the cups like everyone else.

### The cups' own match lengths

The A and B cups used the single elimination lengths. They now have their own under Match length → Groups and cups: **cup rounds** (every round before the semifinals), **cup semifinal**, **cup bronze final** and **cup final**, so a Bo7 cup final no longer changes your normal single elimination nights. Existing settings carry over: the cups start with the lengths they had.

### Without a B cup, the top two of each group

**Top half** is there to keep the B cup from being tiny. Without a B cup there is nothing to protect, so the A cup now always takes the top two of each group when **Play the B cup** is off. Before, Top half without a B cup could leave a group runner-up out of the only knockout (12 players in four groups of three gave an A cup of six). Draw the cups shows the change as you flip the switch.

---

## Smaller Things

- **A live match without a lane** has a plain amber border in Match Controls, without the thick stripe along the top.
- **Tournament Setup:** the two buttons of the next step are the same size; the dark one is the main step.
- **The user guide, the help and the web pages** say 4 to 48 players.

---

## Migration

No migration required. Fully compatible with all existing tournament data, match history, Analytics and settings. Qualifiers and the new settings are stored in new fields; tournaments and settings without them work exactly as before, and the cups keep the lengths they had. The export format is unchanged. A tournament with qualifiers needs v5.4.1 or later to open.

---

*NewTon DC Tournament Manager v5.4.1 — Under Pressure.*
