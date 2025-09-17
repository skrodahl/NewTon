# NewTon DC Tournament Manager

**NewTon Tournament Manager** is a fully self-contained web application for running double-elimination darts tournaments. It runs entirely in your browser — no server, database, Internet connection, or installation required.

Simply download the repository, open `tournament.html`, and start managing your tournament.

[Download NewTon DC Tournament Manager here!](https://github.com/skrodahl/NewTon/releases)

---

## ✨ Key Features

### 🏆 Tournament Management
- **Create, Save & Load**: Multiple tournaments with automatic saving to browser storage
- **Import/Export**: JSON-based tournament backup and sharing between computers
- **Tournament History**: Full chronological record of all matches in the active tournament with results, lane and referee assignments
- **Crash Resilient**: Automatic saving prevents data loss during unexpected closures
- **Template System**: Reusable tournament configurations

### 👥 Player Management
- **Registration System**: Add, remove, and track player payment status
- **Comprehensive Statistics**: Track ranks, short legs (9-21 darts), high outs (101+), tons (100+), and 180s
- **Real-time Stats Entry**: Update player statistics during matches
- **Flexible Point System**: Fully configurable scoring for all achievements
- **Export Results**: Results, points and statistics, either as CSV or JSON (JSON export includes full tournament history)

### 🎮 Match Control & Lane Management
- **Match Controls Interface**: Centralized command center for managing the entire tournament
  - Manage the tournament without searching around in the tournament bracket
  - Organized sections: LIVE matches first, then Ready matches by bracket side
  - Direct "[Player Name] Wins" buttons for instant winner selection
  - Start/stop matches without leaving the interface
  - Real-time updates after match state changes
  - Access to tournament Statistics without leaving the Tournament page
- **Lane Assignment**: Assign matches to specific dartboard lanes (1-20 configurable)
- **Conflict Prevention**: Automatic detection and prevention of lane conflicts
- **Match Validation**: Ensure proper match progression and prevent invalid states
- **Referee Assignment**: Select referees from a drop-down menu, with conflict prevention
- **Referee Suggestions**: See who lost/won last and who were recently assigned as referee, with smart filtering

### 🎯 Advanced Bracket System
- **Double Elimination**: Professional frontside/backside bracket structure for 8, 16, and 32 players
- **Smart Bracket Generation**: Prevents bye vs bye matchups in first round
- **Automatic Advancement**: Walkovers (byes) automatically advance real players
- **Match State Management**: Clear pending/ready/live/completed match visualization
- **Interactive Bracket**: Zoom, pan, and click-to-select winners with visual feedback

### 📊 Results & Reporting
- **Match Results History**: Chronological display of completed matches with visual winner identification
- **Live Standings**: Real-time ranking and points calculation during tournament
- **Comprehensive Placement**: Automatic 1st through 32nd place rankings with tie handling
- **CSV Export**: Export complete results for records keeping
- **Point Breakdown**: Detailed scoring including participation, placement, and performance bonuses
- **Statistics Summary**: Player performance metrics across all categories

### ⚙️ Configuration & Customization
- **Global Settings**: Persistent configuration across all tournaments
- **Custom Branding**: Add your club logo and customize application title
- **Flexible Scoring**: Adjust point values for participation, placements, and achievements
- **Configure Number of Lanes**: Select 1-20 lanes, with lane exclusions
- **Flexible Match Lengths**: Configurable best-of legs for rounds, semifinals, and finals
- **UI Preferences**: Customize confirmation dialogs and interface behavior

---

## 🚀 Quick Start

1. **Download**: Clone or download this repository to your computer
2. **Open**: Double-click `tournament.html` to open in your web browser
3. **Configure**: Set all global configs, match lenghts, points awarded and more
4. **Create**: Set up a new tournament with name and date
5. **Register**: Add players and mark payment status
6. **Generate**: Create the tournament bracket
7. **Run**: Manage matches, assign lanes, and track results in real-time

---

## 📋 Detailed Workflow

### Setup Phase
1. **Configure**: Global configuration for all tournaments
2. **Create Tournament**: Enter tournament name and date
3. **Add Players**: Register participants and track payment status
4. **Configure Settings**: Adjust point values and match formats if needed
5. **Export Tournament**: Export the tournament for use on another computer, or analysis

### Tournament Phase
1. **Generate Bracket**: Automatically creates optimized double-elimination bracket
2. **Manage Matches**: 
   - Assign matches to available lanes
   - Assign referees
   - Start matches when players are ready
   - Select winners with optional confirmation dialogs
   - Track live match progress
3. **Handle Statistics**: Record player achievements during matches
4. **Monitor Progress**: View real-time standings and bracket progression

### Results Phase
1. **Final Rankings**: Automatic calculation of 1st through last place
2. **Export Results**: Generate CSV reports for external use
3. **Save Tournament**: Preserve complete tournament data for future reference

---

## 🏗️ Technical Architecture

### Core Technologies
- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **Storage**: Browser LocalStorage for offline persistence
- **No Dependencies**: Zero external libraries or frameworks, or even an Internet connetion required
- **Offline First**: Works completely without internet connection

### Bracket Logic
- **Hardcoded Progression**: Bulletproof match advancement using lookup tables
- **Mirroring Rules**: Proper frontside/backside player distribution
- **State Management**: Comprehensive transaction-based match state tracking and validation
- **Auto-advancement**: Intelligent handling of walkover scenarios
- **Full Undo**: Undo uses hardcoded progression and transaction-based history for bullet-proof operation

### Data Management
- **Tournament Isolation**: Clean separation between global config and tournament data
- **History System**: Complete undo functionality with state snapshots
- **Import/Export**: JSON-based data exchange with validation
- **Multi-tournament**: Support for managing multiple tournaments

---

## 🎮 Tournament Formats Supported

### Bracket Sizes
- **8 Players**: 3 frontside rounds, 3 backside rounds + finals
- **16 Players**: 4 frontside rounds, 5 backside rounds + finals  
- **32 Players**: 5 frontside rounds, 7 backside rounds + finals

### Match Formats
- **Configurable Legs**: Best-of 3, 5, or 7 legs per round
- **Flexible Rounds**: Different formats for early rounds vs finals
- **Referee System**: Choose from registered players

### Statistics Tracking
- **Short Legs**: Games finished in 9-21 darts (configurable points)
- **High Outs**: Finishing scores of 101+ points (configurable points)
- **Tons**: Scores of 100+ points (configurable points)
- **180s**: Maximum dart scores (configurable points)
- **Ranking**: 1st-4th place individually, 5th-6th and 8th-9th place (configurable points)

---

## 📱 Browser Compatibility

**Recommended Browsers:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Requirements:**
- JavaScript enabled
- LocalStorage support
- Modern CSS support

---

## 🔧 Configuration Options

### Point System
- Participation points (default: 5)
- Placement points (1st: 15, 2nd: 13, 3rd: 10, etc.)
- Achievement points (high outs, tons, 180s, short legs)

### Match Settings
- Best-of legs for regular rounds, semifinals, finals
- Lane requirements and conflict management
- Winner confirmation dialogs

### Application Settings
- Custom club logo (place logo.png/jpg/jpeg/svg in root folder)
- Application title and branding
- UI behavior preferences

---

## 💾 Data Management

### Automatic Saving
- All changes saved immediately to browser storage
- Crash-resistant data persistence
- No manual save required

### Import/Export
- **Export**: Download tournament as JSON file
- **Import**: Load tournament from JSON file
- **Backup**: Regular exports recommended for important tournaments

### Storage Location
- **Browser LocalStorage**: All data stored locally
- **No Cloud**: Complete privacy, no external data sharing
- **Multi-device**: Export/import to move between computers

---

## 🆘 Troubleshooting

### Common Issues
- **Browser Compatibility**: Ensure JavaScript is enabled
- **Storage Limits**: Clear old tournaments if storage full
- **Performance**: Close other browser tabs for large tournaments

### Data Recovery
- **Undo System**: Reverse recent match results
- **Import Backup**: Restore from exported JSON files
- **Fresh Start**: Reset tournament to bracket generation

---

## 🎯 Use Cases

### Tournament Organizers
- Professional dart tournament management
- Club championship tracking
- League season tournaments

### Dart Clubs
- Regular tournament nights
- Member ranking systems  
- Event documentation

### Event Management
- Pub tournaments
- Corporate events
- Charity fundraisers

---

## 📄 Credits

**Created by Håvard Skrödahl**  
NewTon DC Malmö

**License**: Open source project for dart tournament management

---

## 🔗 Getting Started

1. **[Download the latest official release](https://github.com/skrodahl/NewTon/releases)** (Run `git clone` or download ZIP for the latest beta)
2. Unzip the file you just downloaded
3. **Open**: Launch `tournament.html` in your browser
4. **Configure**: Set up your club branding and point system
5. **Run**: Create your first tournament and start managing matches!

*No installation, no servers, no complexity — just pure tournament management.*
