# NewTon Tournament Manager

**NewTon Tournament Manager** is a fully self-contained web app for running double-elimination darts tournaments.  
It runs entirely in your browser — no server, database, Internet connection, or installation required.

Simply download the repository, open `tournament.html`, and start managing your tournament.

---

## Features

- **Tournament Management**
  - Create, save, load, import, export, and reset tournaments
  - Automatically saved in browser local storage (resilient to crashes)
  - Export/import JSON for backup or moving between computers

- **Player Management**
  - Add, remove, and track players
  - Mark paid registrations
  - Track statistics: short legs, high outs, tons, 180s
  - Edit player stats mid-tournament

- **Bracket System**
  - Double-elimination brackets for 8, 16, and 32 players
  - Clean progression logic (frontside/backside mirroring)
  - Walkovers (byes) automatically placed and never matched against each other
  - Automatic advancement for walkovers
  - Undo system to roll back operator-entered results
  - Visual interactive bracket with zoom & pan

- **Match & Lane Control**
  - Assign matches to lanes
  - Prevent conflicts with active matches
  - Lane usage summary
  - Configurable requirement for lane assignment before starting matches
  - Referee assignment

- **Configuration**
  - Customizable points for participation, placements, short legs, outs, tons, and 180s
  - Configurable match length (best-of legs) for rounds, semis, finals
  - Change application title and add your club logo
  - Toggle winner confirmation dialogs

- **Results & Standings**
  - Automatic ranking and points calculation
  - Live results table with placement and stats
  - Exportable tournament data

---

## Quick Start

1. Download or clone this repository  
2. Open `tournament.html` in your browser  
3. Create a new tournament, register players, and generate a bracket  
4. Run matches, assign lanes, and track results in real time  

---

## Tech Notes

- 100% browser-based (HTML, CSS, JavaScript)  
- No dependencies, no server required  
- Data persistence via browser Local Storage  
- Works offline once loaded  

---

## Credits

Created by **Håvard Skrödahl** – NewTon DC Malmö