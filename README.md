# NewTon DC Tournament Manager

**[Version 3.0.3](https://github.com/skrodahl/NewTon/releases/tag/v3.0.3)** | **[Changelog](https://github.com/skrodahl/NewTon/blob/main/CHANGELOG.md)**

**NewTon DC Tournament Manager** provides a clean, professional interface with offline-first design for reliable double-elimination darts tournaments. It runs entirely in your browser — no server, database, Internet connection, or installation required.

**[Download for offline use](https://github.com/skrodahl/NewTon/releases/latest)** or **[self-host with Docker](#-docker-deployment-self-hosting)**.

---
# See It in Action

## Try the Live Demo
🎯 [**https://darts.skrodahl.net**](https://darts.skrodahl.net)

*All data, player names, tournaments, and config stay in your browser - nothing is stored on the server or shared with anyone else.*

## Screenshots
**Player Registration, Saved Players, and Dynamic Help**:

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

**Developer Console**

![Configuration Page](https://github.com/skrodahl/NewTon/blob/main/Screenshots/developer-console.png)
---

## 🚀 Getting Started

1. **[Download the latest official release](https://github.com/skrodahl/NewTon/releases/latest)** (Run `git clone` or download ZIP for the latest beta)
2. **Open**: Launch `tournament.html` in your browser
3. **Configure**: Set up your club branding and point system
4. **Create**: Set up a new tournament with name and date
5. **Register**: Add players and mark payment status
6. **Generate**: Create the tournament bracket
7. **Run**: Manage matches, assign lanes, and track results in real-time

*No installation, no servers, no complexity — just pure tournament management.*

---

## 🐳 Docker Deployment (Self-Hosting)

**Want to host NewTon Tournament Manager on your own server?** Docker makes it effortless.

### 📋 [**Docker Quick Start Guide →**](DOCKER-QUICKSTART.md)

**Get running in under 2 minutes:**

```bash
# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/skrodahl/NewTon/main/docker/docker-compose.yml

# Start the container
docker compose up -d

# Access at http://localhost:8080
```

**What's Included:**
- ✅ Lightweight Alpine container (~60MB)
- ✅ PHP REST API for tournament sharing
- ✅ nginx + PHP-FPM for optimal performance
- ✅ Multi-architecture support (Intel/AMD + Apple Silicon/Raspberry Pi)
- ✅ Persistent storage for tournaments
- ✅ Custom logo and payment QR code support

**Documentation:**
- **[Quick Start Guide](DOCKER-QUICKSTART.md)** - Get running in 2 minutes
- **[Docs/DOCKER.md](Docs/DOCKER.md)** - Complete guide (reverse proxy, production setup, troubleshooting)

---

## ✨ Key Features

### 🏆 Tournament Management
- **Multiple Tournaments**: Create, save, and load with automatic browser storage
- **Import/Export**: JSON-based backup and sharing between computers
  - **Tournament Protection**: Completed tournaments loaded from file are read-only to protect data integrity
- **Tournament History**: Complete match records with lane and referee assignments
- **Crash Resilient**: Automatic saving prevents data loss
- **Optional Server Features**: Sharing completed tournaments if hosted on a webserver with PHP, using REST API

### 🎯 Double Elimination Brackets
- **Professional Structure**: Frontside/backside brackets for 8, 16, and 32 players
- **Smart Generation**: Prevents two walkovers from meeting in first round
- **Fair Draw**: Byes randomly distributed to prevent unfair advantages and minimize walkover chains
- **Interactive Visualization**: Zoom, pan, click-to-select winners with complete progression lines and placement indicators
- **Match Card Magic Zoom:** Auto-zoom on individual matches when zoomed out too far to read and control the matches
- **Automatic Advancement**: Walkovers advance real players intelligently
- **Undo**: Reverse recent match results (staged undo prevents accidentally clearing large portions of the bracket)
- **Contextual Status**: Hover over tournament matches to show status, tournament progression, and undo

#### 🟢 Match Color Coding
Intuitive traffic light system for instant priority assessment:

- 🔴 Orange/Red = "**DO THIS NOW**" (LIVE matches, current focus)
- 🟡 Yellow = "**READY FOR ACTION**" (can be started, next up)
- 🟢 Green = "**COMPLETED**" (done and archived)
- ⚪ White/Gray = "**NOT READY YET**" (pending, no action possible)

### 🎮 Match Management
- **Centralized Control**: Manage entire tournament from Match Controls interface
- **Clear Progression**: Each match shows exactly where winners and losers advance ("Leads to...")
- **Lane Assignment**: Assign matches to dartboard lanes (1-20 with exclusions, configurable)
- **Referee System**: Select referees with conflict prevention
- **Real-time Updates**: Live standings and bracket progression

### 👥 Player & Statistics
- **Player List Registry**: Maintain a persistent list of regular players for consistency across tournaments
  - Alphabetically sorted for easy scanning
  - Quick-add players to new tournaments
  - Import/export with tournament data
- **Registration**: Add players and track payment status
- **Comprehensive Stats**: Short legs, high outs, tons, 180s with configurable points
- **Live Rankings**: Real-time 1st through 32nd place calculation
- **Export Results**: CSV and JSON export with full tournament history

### ⚙️ Configuration
- **Custom Branding**: Add club logo, favicon, and customize title
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
- **Developer Console**: Debug, view tournament health, transaction log management

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
