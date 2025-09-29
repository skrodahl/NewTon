# Network Architecture Plan

This document outlines the vision and plan for adding network capabilities to the NewTon DC Tournament Manager while maintaining the core principles of offline-first operation and zero external dependencies.

## Immediate Action Plan

**Step 1: Preserve Current Functionality**
- Keep everything as-is for running offline tournaments
- No changes to existing tournament.html, JavaScript, or workflows
- Maintain file:// protocol access as primary method

**Step 2: Docker Deployment Foundation**
- Create Docker + nginx container serving existing app unchanged
- Auto-download latest version when internet available
- Hybrid approach: manual file placement for offline venues
- Persistent storage for tournament data and app files

**Goals:**
- Future-proof deployment without feature pressure
- Force architectural discipline - network features must be additive
- Prepare infrastructure for potential advanced functionality
- Ensure offline HTML/JS/CSS app remains primary supported method

## Philosophy

The network features are designed to be **additive, not foundational**. The core tournament management functionality remains completely offline-capable, with network features providing enhanced capabilities when available.

### Core Principles Maintained
- **Offline-First**: Tournament continues normally if network fails
- **Zero External Dependencies**: No internet connection required, no cloud services
- **Single Source of Truth**: Tournament computer remains authoritative
- **Sky High Resilience**: Network failures cannot corrupt tournament data
- **Local Network Only**: All communication stays within venue network

### Forcing Function Discipline
- Docker container MUST perfectly support current offline app
- Future network features become optional layers on top
- Cannot accidentally break offline functionality while adding features
- Forces clean separation between core logic and network enhancements

## Vision Overview

Transform from tournament management software to a complete darts venue management system through three major network-enabled capabilities:

1. **Tournament Overview Display** - Large screen showing current matches and next up
2. **Digital Chalking System** - Referee tablets with 501 scoring and automatic stats
3. **Extended Tournament Formats** - Qualifying rounds, casual play, league management

## Implementation Plan

### Phase 1: Tournament Overview Display
**Goal**: Add a 5th tab "Tournament Overview" for display screens

**Technical Requirements**:
- Tournament computer serves current bracket state via local HTTP/WebSocket
- Display page consumes tournament data and renders overview
- Multiple display types: next matches, full bracket, leaderboard

**Value Delivered**:
- Players see when they're up next without asking
- Referees know their lane assignments
- Tournament flow becomes more self-organizing
- Reduces interruptions to tournament manager

### Phase 2: Digital Chalking System
**Goal**: Referee tablets with 501 scoring that sync statistics automatically

**Technical Requirements**:
- Referee tablet interface similar to Nakka N01 (proven, stable design)
- 501 scoring with large touch-optimized buttons
- Automatic statistics calculation: averages, tons, 180s, doubles attempts
- Match claiming system: referees "pick up" their lane's assigned match
- Statistics flow back to tournament computer on match completion

**Advanced Statistics Enabled**:
- Leg averages (every dart tracked)
- Match averages (aggregated across legs)
- First 9 dart averages (skill assessment metric)
- Double attempts and checkout percentages
- All existing stats (tons, 180s, high outs, short legs)

**Value Delivered**:
- Eliminates manual statistics tracking errors
- Provides professional-level match statistics
- Real-time tournament progress updates
- Referees focus on rules, not scorekeeping

### Phase 3: Extended Tournament Formats
**Goal**: Support for various tournament formats beyond double elimination

**Formats Enabled**:
- **Qualifying Rounds**: Handle 32+ player events with qualifying matches
- **Casual 501**: One-off games with statistics tracking
- **Round Robin**: Group play before elimination rounds
- **Swiss System**: Everyone plays same number of rounds
- **League Play**: Multi-session tournaments
- **Skills Competitions**: High out contests, accuracy challenges
- **Team Tournaments**: Individual stats within team format

**Value Delivered**:
- Accommodates any number of participants
- Builds comprehensive player profiles over time
- Data-driven seeding for future tournaments
- Venue becomes complete darts management platform

## Technical Architecture

### Security Architecture

**Docker Container Isolation Benefits:**
- **Network Segmentation**: SQLite database runs inside container, never exposed to venue network
- **Process Isolation**: Tournament logic and database operations protected from external access
- **Controlled API Surface**: Only specific REST endpoints exposed to referee tablets and displays
- **File System Protection**: Database files and configuration hidden inside container filesystem

**What Gets Exposed vs. Hidden:**

**Exposed to venue network:**
- Static HTML/CSS/JS files (existing tournament interface)
- Specific REST API endpoints (`/api/tournaments`, `/api/matches`, `/api/statistics`)
- WebSocket connections for real-time updates
- Tournament Overview display pages

**Hidden inside container:**
- SQLite database file (no direct database access from network devices)
- Database connection strings and credentials
- Server-side tournament progression logic and business rules
- Administrative functions and dangerous operations (tournament reset, data export)
- File system access and internal container APIs
- Backend configuration files and environment variables

**Security Benefits for Tournament Environment:**

**Referee tablets cannot:**
- Access SQLite database directly (only through controlled API transactions)
- Execute arbitrary database queries or modifications
- Access other tournaments' data or administrative functions
- Corrupt database files through direct file system writes
- Access internal container services or system commands

**Malicious devices on venue WiFi cannot:**
- Connect directly to database or internal services
- Access tournament data outside their authorized scope
- Execute system commands or access host filesystem
- Read sensitive configuration files or credentials
- Interfere with other connected devices' operations

**Contrast with File-Based Security Risks:**
- **Direct file access** would expose file system paths to network devices
- **File permission misconfiguration** could allow unauthorized data access
- **Concurrent file writes** could be exploited for data corruption attacks
- **Directory traversal vulnerabilities** could expose entire tournament archives
- **No transaction isolation** leaves tournament state vulnerable during updates

### Database-Backed Docker Deployment Strategy

**Two deployment options maintain flexibility:**
- **Option 1**: Download web app directly (current method) - remains primary supported approach
- **Option 2**: Run Docker container with SQLite database backend serving enhanced capabilities

**Docker + SQLite benefits:**
- nginx serves static files to tablets/displays on local network
- SQLite database handles concurrent access safely with ACID transactions
- WAL (Write-Ahead Logging) mode enables simultaneous readers + single writer
- Zero changes to existing web application code for Phase 1
- Proven concurrency handling prevents data corruption from multiple referee tablets
- WebSocket support for real-time tournament updates
- Standard database tooling for backup, recovery, and administration
- Future-proofs for potential PostgreSQL upgrade if needed

**Why Database over File-Based Storage:**
- **Concurrent Access Safety**: SQLite transactions prevent corruption when multiple referees submit simultaneously
- **Data Integrity**: ACID properties ensure bracket state remains consistent during power failures
- **Security Isolation**: Database hidden inside container vs files exposed to network filesystem
- **Controlled Access**: API endpoints provide granular permissions vs direct file system access
- **Proven Technology**: Mature file locking and transaction mechanisms vs experimental file APIs
- **Professional Reliability**: Database approach standard for multi-user tournament systems

**Hybrid deployment approach:**
```bash
# Docker container startup logic:
# Check if app files exist in persistent volume
if [ ! -f "/app/tournament.html" ]; then
    # Option A: Try to download latest release from GitHub
    if curl -f github.com/releases/latest; then
        # Download and extract to /app/
        echo "✓ Downloaded latest version automatically"
    else
        # Option B: Show instructions for manual placement
        echo "No internet - please add tournament files to /app/ folder"
        echo "Copy tournament.html, *.js, *.css to mounted volume"
        # Serve simple instruction page until files added
        serve_instructions_page
    fi
fi
# Initialize SQLite database with tournament schema
sqlite3 /data/tournaments.db < /app/schema.sql
# Start nginx serving /app/ directory + API backend
nginx -g 'daemon off;' &
node /app/api-server.js
```

**Strategic advantages:**
- **Architectural discipline**: Forces future network features to be additive layers
- **Deployment flexibility**: Works with or without internet at venues
- **Zero functional risk**: Same tournament management, enhanced deployment
- **Future preparation**: Infrastructure ready for advanced features if needed
- **Fallback preservation**: Manual file access always remains available

### Network Topology
```
Tournament Computer (Docker Container)
├── nginx serves static files to local network
├── SQLite database with WAL mode for concurrent access
├── Node.js/Python API backend handling database operations
├── Auto-update from internet when available
├── WebSocket connections for real-time updates
└── REST API endpoints for tournament CRUD operations

Venue WiFi Network (No Internet Required)
├── Tournament Overview Display(s)
│   └── Connect to http://tournament-computer-ip/
├── Referee Tablets
│   ├── Connect to same nginx-served web app
│   ├── 501 scoring interface
│   ├── WebSocket for real-time match updates
│   ├── Statistics sync via API with database transactions
│   └── Concurrent access safely handled by SQLite WAL mode
└── Tournament Manager Browser
    └── Enhanced with database persistence and WebSocket updates
```

### Resilient Storage Architecture

**Database-backed resilient storage:**
```
SQLite Database (ACID Transactions) ↔ localStorage (Working Copy) ↔ Browser UI
```

**Data flow patterns:**
- **Load Tournament**: SQLite → API → localStorage → UI
- **Tournament Changes**: UI → localStorage → API transaction → SQLite
- **Browser Refresh**: localStorage provides instant availability
- **Container Restart**: SQLite database provides authoritative state
- **Concurrent Operations**: SQLite WAL mode handles multiple referee updates safely

**Failure resilience:**
- **Network fails**: Browser continues using localStorage, syncs when reconnected
- **API server crashes**: Browser works from localStorage until server restarts
- **Browser crashes**: SQLite database maintains authoritative copy
- **Power failure**: SQLite WAL mode ensures transaction durability
- **Concurrent corruption**: ACID transactions prevent database corruption from simultaneous referee submissions
- **WebSocket disconnects**: Automatic reconnection with state synchronization

### Enhanced Tournament Management

**Current workflow:**
- Tournament data in browser LocalStorage only
- Export tournament → download JSON file
- Import tournament → upload JSON file

**With database persistence:**
- Tournament data automatically saved to SQLite database via ACID transactions
- "Save Tournament" commits transaction ensuring data integrity
- Tournament list queries database for all previously saved tournaments
- "Load Tournament" retrieves from database with concurrent access safety
- Export/import still available for sharing between venues (JSON export from database)
- WebSocket broadcasts tournament changes to all connected devices
- Multiple referee tablets can submit match results simultaneously without corruption

**localStorage becomes resilience layer:**
- Maintains existing Sky High Resilience within browser
- PLUS ACID database storage surviving concurrent access scenarios
- PLUS network access for tablets/displays with transaction safety
- Working copy principle: localStorage like Git working directory with database backing store
- Database handles all concurrency concerns invisible to browser clients

### Database-Backed Technology Stack
- **Docker Container**: Consistent deployment with nginx + API backend + SQLite database
- **nginx Web Server**: Serves static web app files to local network devices
- **SQLite Database**: ACID-compliant storage with WAL mode for concurrent access
- **API Backend**: Node.js/Python handling database operations with proper transactions
- **WebSocket Support**: Real-time bidirectional communication between devices
- **localStorage**: Working copy storage for offline resilience
- **Database Transactions**: All tournament operations wrapped in ACID transactions
- **WAL Mode**: Write-Ahead Logging enables concurrent readers + single writer
- **Responsive Web Design**: Same codebase adapts to different screen sizes

## Implementation Priorities

### High Priority (Phase 1)
- [ ] Create Docker container with nginx serving existing tournament.html unchanged
- [ ] Design SQLite database schema for tournament data
- [ ] Implement API backend with database transaction support
- [ ] Tournament Overview display page
- [ ] WebSocket connection for real-time tournament state broadcasting
- [ ] Database integration replacing localStorage persistence

### Medium Priority (Phase 2)
- [ ] Referee tablet 501 interface
- [ ] Match claiming system
- [ ] Advanced statistics calculation engine
- [ ] Statistics sync to tournament computer

### Lower Priority (Phase 3)
- [ ] Qualifying round bracket generation
- [ ] Casual match tracking
- [ ] Alternative tournament formats
- [ ] Player profile accumulation across sessions

## Benefits Summary

### For Tournament Managers
- Real-time tournament progress visibility
- Automatic statistics collection
- Reduced manual data entry errors
- Support for larger events

### For Players
- Clear visibility of match schedule
- Professional-level performance statistics
- Fair qualifying systems for large events
- Opportunity for casual play between tournaments

### For Referees
- Focus on rules enforcement, not scorekeeping
- Familiar tablet interface for scoring
- Automatic match assignment system
- No manual statistics tracking required

### for Venues
- Complete darts management platform
- Player skill tracking over time
- Multiple tournament format options
- Enhanced spectator experience

## Risk Mitigation & Challenges

### Security Concerns
**Potential Issues:**
- Docker container serving on local network requires proper API access controls
- Referee tablets need authenticated access to prevent unauthorized match submissions
- Malicious devices connecting to venue WiFi pose security risks
- Tournament computer becomes a network attack surface requiring protection

**Mitigation Strategies:**
- **Container Isolation**: SQLite database and sensitive operations hidden inside Docker container
- **API Access Controls**: Implement authentication tokens for referee tablets and display devices
- **Granular Permissions**: Read-only access for displays, limited match-update access for referees
- **Network Segmentation**: VLAN or guest network isolation for tournament devices
- **Controlled Endpoints**: Only expose necessary API endpoints, hide administrative functions
- **Regular Security Updates**: Auto-update mechanism with security patches
- **Database Protection**: No direct database access from network, all operations through API transactions

### Network Reliability Edge Cases
**Potential Issues:**
- Intermittent WiFi causing partial syncs and state corruption
- Multiple referees claiming same match simultaneously
- Network partitions where tablets appear connected but aren't syncing
- Race conditions when multiple devices modify tournament state concurrently

**Mitigation Strategies:**
- Implement optimistic locking with conflict resolution
- Match claiming uses atomic operations with timeout mechanisms
- Heartbeat/ping system to detect network partitions
- Queue-based synchronization with retry logic
- Tournament computer maintains authoritative state for all conflicts

### Scaling and Performance Problems
**Potential Issues:**
- 20+ tablets synchronizing statistics simultaneously
- nginx serving dozens of display screens during busy tournaments
- Docker container resource limits with large tournament datasets
- localStorage quota exceeded on referee tablets

**Mitigation Strategies:**
- Implement rate limiting and batch synchronization
- CDN-style caching for display screens
- Container resource monitoring and scaling recommendations
- Graceful degradation when storage limits reached
- Data cleanup and archival strategies

### User Experience Challenges
**Potential Issues:**
- Referees expect exact Nakka interface but get "close enough" experience
- Tournament manager loses visibility into referee activities
- Display screens show stale data during network issues
- Backup/restore complexity with three storage layers

**Mitigation Strategies:**
- Referee training and interface testing with actual tournament directors
- Tournament manager dashboard showing real-time referee activity
- Clear visual indicators for network connectivity status
- Simplified backup strategy focusing on disk storage as primary
- Fallback procedures documented for manual tournament completion

### Deployment and Technical Complexity
**Potential Issues:**
- Deno adds some complexity for non-technical tournament directors
- Version mismatches between server and referee tablets
- Venue IT policies may block custom executables or network servers
- Network configuration becomes tournament director responsibility
- Command-line permissions (--allow-net, --allow-read, --allow-write) may be intimidating

**Mitigation Strategies:**
- Provide simple startup scripts with pre-configured permissions
- Single binary deployment (simpler than Docker containers)
- Automated version compatibility checks and warnings
- Fallback to file:// protocol for restrictive environments
- Network setup documentation and venue requirements checklist
- Technical support resources and troubleshooting guides
- Wrapper scripts that handle Deno permissions automatically

### Fundamental Questions
**Critical Considerations:**
- Are we solving real problems or adding complexity for unused features?
- Current tournaments work fine - is network complexity justified?
- Could 80% of benefits be achieved with 20% complexity via improved export/statistics?
- Will tournament directors actually want to manage network infrastructure?

**Validation Requirements:**
- User research with actual tournament directors and referees
- Pilot testing with simplified feature set before full implementation
- Comparison study: network features vs enhanced offline workflows
- Cost-benefit analysis including training and support overhead

### Network Failure Scenarios
- Tournament continues with manual statistics if network fails
- Referee tablets can complete matches offline and sync later
- Tournament computer never depends on network for core functionality
- All devices maintain local state for graceful degradation

### Complexity Management
- Incremental implementation - each phase builds on previous
- Core tournament logic remains unchanged
- Network features are purely additive
- Existing tournament workflows unaffected
- Each phase includes rollback strategy to previous functionality

## Success Metrics

- Tournament overview displays reduce player inquiries about match scheduling
- Digital chalking captures statistics that were previously missed or inaccurate
- Qualifying rounds enable events with 40+ participants
- Venue can host multiple concurrent formats (tournament + casual play)
- Player satisfaction increases due to professional statistics and clear scheduling

---

*This plan maintains the NewTon philosophy of extreme reliability while enabling professional-level tournament management capabilities through local network integration.*