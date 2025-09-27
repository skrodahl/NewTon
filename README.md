# NewTon DC Tournament Manager

**NewTon DC Tournament Manager** is a Command & Control Center for running double-elimination darts tournaments.  

It is a fully self-contained web application that runs entirely in your browser — no server, database, Internet connection, or installation required.

[Download NewTon DC Tournament Manager here!](https://github.com/skrodahl/NewTon/releases)

---
# See It in Action
**Player Registration, Results Table, and Dynamic Help**:

![Player Registration and Dynamic Help](https://github.com/skrodahl/NewTon/blob/main/Screenshots/player-registration-help.png)

**Tournament Setup**:

![Tournament Setup](https://github.com/skrodahl/NewTon/blob/main/Screenshots/tournament-setup.png)

**16-player Tournament Bracket Showing "Match Card Magic Zoom" and Status Bar**:

![16-player bracket with "Match Card Magic Zoom"](https://github.com/skrodahl/NewTon/blob/main/Screenshots/tournament-bracket-zoom.png)

**Match Controls**:

![Match Controls](https://github.com/skrodahl/NewTon/blob/main/Screenshots/match-controls.png)

**Celebration**:

![Celebration](https://github.com/skrodahl/NewTon/blob/main/Screenshots/celebration.png)

**Configuration Page**:

![Configuration Page](https://github.com/skrodahl/NewTon/blob/main/Screenshots/config-page.png)
---

## 🚀 Getting Started

1. **[Download the latest official release](https://github.com/skrodahl/NewTon/releases)** (Run `git clone` or download ZIP for the latest beta)
2. **Open**: Launch `tournament.html` in your browser
3. **Configure**: Set up your club branding and point system
4. **Create**: Set up a new tournament with name and date
5. **Register**: Add players and mark payment status
6. **Generate**: Create the tournament bracket
7. **Run**: Manage matches, assign lanes, and track results in real-time

*No installation, no servers, no complexity — just pure tournament management.*

---

## ✨ Key Features

### 🏆 Tournament Management
- **Multiple Tournaments**: Create, save, and load with automatic browser storage
- **Import/Export**: JSON-based backup and sharing between computers
- **Tournament History**: Complete match records with lane and referee assignments
- **Crash Resilient**: Automatic saving prevents data loss

### 🎯 Double Elimination Brackets
- **Professional Structure**: Frontside/backside brackets for 8, 16, and 32 players
- **Smart Generation**: Prevents two walkovers from meeting in first round
- **Interactive Visualization**: Zoom, pan, click-to-select winners with complete progression lines and placement indicators
- **Match Card Magic Zoom:** Auto-zoom on individual matches when zoomed out to far to read and control the matches
- **Automatic Advancement**: Walkovers advance real players intelligently
- **Undo**: Full undo of all matches without completed downstream matches to prevent undoing large portions of the tournament at once, can undo more matches in stages
- **Contextual Status**: Hover over tournament matches to show status, tournament progression, and undo

### 🎮 Match Management
- **Centralized Control**: Manage entire tournament from one interface
- **Lane Assignment**: Assign matches to dartboard lanes (1-20 configurable)
- **Referee System**: Select referees with conflict prevention
- **Real-time Updates**: Live standings and bracket progression

### 👥 Player & Statistics
- **Registration**: Add players and track payment status
- **Comprehensive Stats**: Short legs, high outs, tons, 180s with configurable points
- **Live Rankings**: Real-time 1st through 32nd place calculation
- **Export Results**: CSV and JSON export with full tournament history

### ⚙️ Configuration
- **Custom Branding**: Add club logo and customize title
- **Flexible Scoring**: Configurable points for participation, placements, and achievements
- **Match Formats**: Best-of legs for rounds, semifinals, and finals
- **UI Preferences**: Confirmation dialogs and interface behavior

---

## 🏗️ Technical Details

**Architecture:**
- Pure HTML5, CSS3, and JavaScript (ES6+) — zero dependencies
- Browser LocalStorage for offline persistence
- Hardcoded progression tables for bulletproof match advancement
- Transaction-based history system with complete undo functionality

**Browser Compatibility:**
- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- Requires JavaScript and LocalStorage support

---

## 💾 Data Management

- **Automatic Saving**: All changes saved immediately to browser storage
- **Import/Export**: JSON files for backup and computer-to-computer transfers
- **Privacy**: Complete local storage, no cloud or external data sharing
- **Undo System**: Reverse recent match results with transaction history

---

## 🎯 Use Cases

- **Tournament Organizers**: Professional dart tournament management
- **Dart Clubs**: Regular tournament nights and member ranking systems
- **Event Management**: Pub tournaments, corporate events, charity fundraisers

---

## 🆘 Troubleshooting

**Common Issues:**
- Ensure JavaScript is enabled in your browser
- Clear old tournaments if storage becomes full
- Close other browser tabs for optimal performance with large tournaments

**Data Recovery:**
- Use the undo system to reverse recent changes
- Import from exported JSON backup files
- Reset tournament to bracket generation if needed

---

## 📄 Credits

**Created by Håvard Skrödahl**
NewTon DC Malmö

**License**: Open source project for dart tournament management
