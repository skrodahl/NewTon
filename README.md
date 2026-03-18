# NewTon DC Tournament Manager

[![Version](https://img.shields.io/github/v/release/skrodahl/NewTon?label=version&color=blue)](https://github.com/skrodahl/NewTon/releases/latest)
[![License](https://img.shields.io/badge/license-BSD--3--Clause-green.svg)](https://github.com/skrodahl/NewTon/blob/main/LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/skrodahl/newton?logo=docker&logoColor=white)](https://hub.docker.com/r/skrodahl/newton)
 [![GHCR](https://img.shields.io/badge/ghcr-available-blue?logo=github)](https://github.com/skrodahl/NewTon/pkgs/container/newton)
[![Docker Image Size](https://img.shields.io/docker/image-size/skrodahl/newton/latest?logo=docker&logoColor=white)](https://hub.docker.com/r/skrodahl/newton)
[![GitHub Stars](https://img.shields.io/github/stars/skrodahl/NewTon?style=social)](https://github.com/skrodahl/NewTon/stargazers)
<!-- [![GHCR Pulls](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fipitio.github.io%2Fbackage%2Fskrodahl%2FNewTon%2Fnewton.json&query=%24.downloads&logo=github&label=ghcr%20pulls)](https://github.com/skrodahl/NewTon/pkgs/container/newton) -->

![Action Shot](https://github.com/skrodahl/NewTon/blob/main/Screenshots/newton-cartoon.jpg)

**[Changelog](https://github.com/skrodahl/NewTon/blob/main/CHANGELOG.md)** | **[Release Notes](https://github.com/skrodahl/NewTon/releases/latest)**  | **[Official Website](https://darts.skrodahl.net)**

➷ **NewTon DC Tournament Manager** provides a clean, professional interface with offline-first design for reliable single and double-elimination darts tournaments. It runs entirely in your browser — no server, database, Internet connection, or installation required.

🎯 **NewTon Chalker** is a companion x01 scoring app designed for tablets at the dartboard. Crash-proof with persistent match data, match history, and live statistics. Install as a PWA for a native app experience.

🔒 **Total Privacy**: Your tournament and match data lives in your browser's localStorage, period. We have a demo site, but even there your data never leaves your device. [Complete privacy by architecture](https://github.com/skrodahl/NewTon/blob/main/Docs/PRIVACY.md), not by policy.

**[Download for offline use](https://github.com/skrodahl/NewTon/releases/latest)**, double-click on tournament.hlml to get going. Or **[self-host with Docker](#-docker-deployment-self-hosting)**.

---
# See It in Action

## Official Website and Apps
Visit the official NewTon DC Tournament Manager Website.

Fully functional versions of the latest Tournament Manager and Chalker apps are available for use and testing.

🎯 [**https://darts.skrodahl.net**](https://darts.skrodahl.net)


*All data stays in your browser - nothing is stored on the server or shared with anyone else.*

## Screenshots
**Player Registration, Saved Players, and Dynamic Help**:

![Player Registration and Dynamic Help](https://github.com/skrodahl/NewTon/blob/main/Screenshots/player-registration-help.png)

**Tournament Setup**:

![Tournament Setup](https://github.com/skrodahl/NewTon/blob/main/Screenshots/tournament-setup.png)

**16-player Tournament Bracket Showing "Match Card Magic Zoom" and Status Bar**:

![16-player bracket with "Match Card Magic Zoom"](https://github.com/skrodahl/NewTon/blob/main/Screenshots/tournament-bracket-zoom.png)

**Match Controls with Referee Suggestions and Match/Referee Conflict Detection**:

![Match Controls](https://github.com/skrodahl/NewTon/blob/main/Screenshots/match-controls.png)

**Celebration**:

![Celebration](https://github.com/skrodahl/NewTon/blob/main/Screenshots/celebration.png)

**Configuration Page**:

![Configuration Page](https://github.com/skrodahl/NewTon/blob/main/Screenshots/config-page.png)

**Developer Console**:

![Configuration Page](https://github.com/skrodahl/NewTon/blob/main/Screenshots/developer-console.png)
---

## 🚀 Getting Started

1. **[Download the latest official release](https://github.com/skrodahl/NewTon/releases/latest)** (Run `git clone` or download ZIP for the latest beta)
2. Visit our [User Guide](https://darts.skrodahl.net/userguide.html) and follow the Quick Start instructions

All [NewTon DC Tournament Manager](https://darts.skrodahl.net)'s features are described in detail in the [User Guide](https://darts.skrodahl.net/userguide.html).

*No installation, no servers, no complexity — just pure tournament management.*

---

## 🐳 Docker Deployment (Self-Hosting)

**Want to host NewTon Tournament Manager on your own server?** Docker makes it effortless.

### 📋 [**Docker Quick Start Guide →**](https://darts.skrodahl.net/docker-quickstart.html)

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
- ✅ PHP [REST API](https://darts.skrodahl.net/rest-api.html) for tournament sharing
- ✅ nginx + PHP-FPM for optimal performance
- ✅ Multi-architecture support (Intel/AMD + Apple Silicon/Raspberry Pi)
- ✅ Persistent storage for tournaments
- ✅ Custom logo and payment QR code support
- ✅ Optional SEO landing page (`NEWTON_LANDING_PAGE=true`)

**Documentation:**
- **[Quick Start Guide](https://darts.skrodahl.net/docker-quickstart.html)** - Get running in 2 minutes

---

## ✨ Key Features
See the NewTon DC Tournament Manager [User Guide](https://darts.skrodahl.net/userguide.html) to learn how to use these features to manage your own tournaments.

### 🏆 Tournament Management
- **Multiple Tournaments**: Create, save, and load with automatic browser storage
- **Import/Export**: JSON-based backup and sharing between computers
  - **Tournament Protection**: Completed tournaments loaded from file are read-only to protect data integrity
- **Tournament History**: Complete match records with lane and referee assignments
- **Crash Resilient**: Automatic saving prevents data loss
- **Optional Server Features**: Sharing completed tournaments if hosted on a webserver with PHP, using [REST API](https://darts.skrodahl.net/rest-api.html)

### 🎯 Single and Double Elimination Brackets
- **Professional Structure**: Frontside/backside brackets for 8, 16, and 32 players, single elimination brackets for 4, 8, 16, and 32 players
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

[Official User Guide](https://darts.skrodahl.net/userguide.html)

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

The architecture and resilence of NewTon DC Tournament Manager is documented on our [official web site](https://darts.skrodahl.net/architecture.html).

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
