# NewTon DC Tournament Manager

[![Version](https://img.shields.io/github/v/release/skrodahl/NewTon?label=version&color=blue)](https://github.com/skrodahl/NewTon/releases/latest)
[![License](https://img.shields.io/badge/license-BSD--3--Clause-green.svg)](https://github.com/skrodahl/NewTon/blob/main/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/skrodahl/newton?logo=docker&logoColor=white)](https://hub.docker.com/r/skrodahl/newton)
 [![GHCR](https://img.shields.io/badge/ghcr-available-blue?logo=github)](https://github.com/skrodahl/NewTon/pkgs/container/newton)
<!-- [![GHCR Pulls](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fipitio.github.io%2Fbackage%2Fskrodahl%2FNewTon%2Fnewton.json&query=%24.downloads&logo=github&label=ghcr%20pulls)](https://github.com/skrodahl/NewTon/pkgs/container/newton) -->

## Run the whole darts night. Offline.
Registration, the draw, every board and every result, the podium and the season standings. In your browser, with no signup and no internet needed.

![NewTon DC Tournament Manager: a bracket and the Chalker](https://github.com/skrodahl/NewTon/blob/main/Screenshots/newton-share.png)

**[Try it in your browser](https://newtondarts.com)** · **[Download](https://github.com/skrodahl/NewTon/releases/latest)** · **[Self-host with Docker](https://newtondarts.com/docker-quickstart.html)** · [User Guide](https://newtondarts.com/userguide.html) · [Release notes](https://newtondarts.com/releases/) · [Changelog](https://github.com/skrodahl/NewTon/blob/main/CHANGELOG.md)

### Yours. Not theirs.
No signup, no subscription, no cloud. Works offline. Just download and run. Works without asking permission.

### Chalk. Send. Done.
The Chalker keeps the score at the board. Matches go out and results come back over your own network, or by QR code.

### Every match remembered.
Analytics that grow with your club. Season leaderboards, player stats, and tournament history — all from data you already have.

---

## How a night runs

1. **Doors open.** Add your regulars from the player database, or sign up walk-ins on the spot. One click marks a player paid, and the draw waits until everyone has: nobody is left out.
2. **The draw.** Pick a format and draw. Seeding from your own results keeps the best players apart; otherwise it's a fair random draw.
3. **All night long: the bracket.** Every round on one screen, from 8 players to 48. Follow a player and their path lights up; click a match to see where the winner goes and where the loser drops; finals in the middle or on the right.
4. **On the boards.** Match Controls runs the room: a tile for every board in play, click the winner to finish a match, a free lane to start the next. Referees are suggested, and nobody gets double-booked.
5. **At the oche.** Phones and tablets at the boards keep the score with the Chalker. Matches go out and results come back by QR code or over your own network, with every 180, high out and short leg.
6. **The final.** A podium with the night's highlights (most 180s, shortest leg, highest out), made to be photographed for the club chat.
7. **The morning after.** Season standings, player profiles with form charts, finishes and averages, filtered to the nights that count. Members follow it on their phones.

![The bracket, following one player's path](https://github.com/skrodahl/NewTon/blob/main/Screenshots/tournament-bracket-zoom.png)

![Match Controls: a tile for each live match, the free lanes and the next match](https://github.com/skrodahl/NewTon/blob/main/Screenshots/match-controls.png)

---

## Pick your format

Small night or full house, there's one for it.

| Format | | Players |
|---|---|---|
| **Double Elimination** | Two lives each. Frontside and backside, then a grand final. | 4–48 |
| **Single Elimination** | One loss and out. The shortest night, with a bronze final. | 4–48 |
| **Cup and Plate** | Everyone plays twice. Round 1 losers play on in a second knockout. | 5–48 |
| **Round Robin** | Everybody plays everybody. Groups into an A and a B cup, or one group, once or twice. | 3–32 |
| **Swiss** | Your results pick your opponent. Fixed rounds, nobody out, the top four finish. | 4–48 |

Elimination brackets come in 8, 16 and 32 slots, with byes spread fairly. Above 32, qualifier matches decide the last places, up to 48.

---

## Features

### Before the draw
- **Player database:** every player has a permanent ID and a short name; rename, archive and merge duplicates without losing their history
- **Paid or not:** the draw never starts while anyone is unpaid, and unpaid players can be removed from Match Controls; an optional payment QR code
- **Seeded draw** (optional): a ranking from your own earlier tournaments keeps the best players apart, and the best seeds get the byes
- **A card for every format** at the draw, each saying what it means for tonight's players: bracket size, groups, rounds, roughly how many matches

### During the night
- **The bracket:** every round on one page at any size, hover to magnify, click to trace a match, Follow a player, finals on the right or in the middle; groups as cards with their tables
- **Match Controls:** a lanes board with one tile per live match, free lanes, the ready queue by round, referee suggestions with conflict prevention, lane assignment for 1–20 dartboards
- **The Chalker:** a companion x01 scoring app for phones and tablets at the board, installable as an app and fully offline. Matches go out and results come back by QR code, or over your own network when self-hosting
- **Surgical undo:** take back any match result without resetting the tournament; it refuses when a later match is already live or played

### After the final
- **The podium** with the night's highlights
- **Points** for taking part, placings and achievements (180s, tons, high outs, short legs), all configurable, made for season standings
- **Analytics:** a dashboard, the season leaderboard, player profiles and comparisons with charts, every tournament and match; filtered by name and season, with a phone layout for club members
- **Export** results as CSV, tournaments as JSON; optional automatic backup to your own server

### Built to last
- **Works offline.** No server, database or internet connection needed. Every change is saved the moment it happens
- **Never loses a result.** Hardcoded progression tables and a transaction history: a misclick, a crash or a power cut leaves the tournament exactly as it was. More in [Architecture & Reliability](https://newtondarts.com/architecture.html)
- **Your data stays yours.** It lives in your browser. No cookies, no tracking, no telemetry. [Privacy by architecture](https://newtondarts.com/privacy.html), not by policy
- **Zero dependencies.** Plain HTML, CSS and JavaScript, no frameworks, no build step

---

## Getting started

**Try it now.** The full Tournament Manager and Chalker run at [newtondarts.com](https://newtondarts.com). Even there, your data never leaves your browser.

**Take it to the venue.** [Download the latest release](https://github.com/skrodahl/NewTon/releases/latest), unzip it and double-click `tournament.html`. Press `F1` anywhere for help, or read the [User Guide](https://newtondarts.com/userguide.html). (`git clone` gets you the latest work in progress.)

**Your club's own server.** Self-host with Docker, and add shared tournaments, automatic backups, the network handover to the Chalker and an Analytics site for your members:

```bash
# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/skrodahl/NewTon/main/docker/docker-compose.yml

# Start the container
docker compose up -d

# Open http://localhost:2020
```

- Lightweight Alpine image with nginx and PHP-FPM, for Intel/AMD and ARM (Apple Silicon, Raspberry Pi)
- Persistent tournament storage and an optional [REST API](https://newtondarts.com/rest-api.html) for sharing and backup
- Your own logo and payment QR code
- An optional landing page (`NEWTON_LANDING_PAGE=true`)
- HTTPS for camera access on other devices; see the **[Docker Quick Start Guide](https://newtondarts.com/docker-quickstart.html)**

---

## Technical details

- Pure HTML5, CSS3 and JavaScript (ES6+), zero dependencies
- Tournament state in the browser's localStorage, the Analytics register in IndexedDB
- Hardcoded match progression tables: every format is built from them, never by calculating paths
- Transaction-based history with surgical undo
- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

---

## Credits

**Created by Håvard Skrödahl**, NewTon DC, Malmö. Made by a darts club, for darts clubs.

**License**: BSD 3-Clause.

### Licensing split

The application is BSD 3-Clause licensed, with one exception: the **`licensed/`
directory** is covered by its own terms in [`licensed/LICENSE.md`](licensed/LICENSE.md),
not by BSD-3.

That directory holds an experimental proof of concept for transferring matches
between the Tournament Manager and the Chalker over the local network, which may
eventually become a paid feature. Right now it is **free to use — no key, no
subscription, no registration** — under a grant that is revocable for future
releases (Section 2 of its licence).

Nothing else changes. The Tournament Manager, the Chalker, QR transfer, Analytics
and every other feature remain fully open source and always will be, and the
application works completely without that directory — delete it and everything
still runs.
