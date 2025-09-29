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

### Docker + nginx Deployment Strategy

**Two deployment options maintain flexibility:**
- **Option 1**: Download web app directly (current method) - remains primary supported approach
- **Option 2**: Run Docker container with nginx serving the same files

**Docker container benefits:**
- nginx serves static files to tablets/displays on local network
- Auto-update capability when internet connection available
- Persistent storage for tournament data
- Zero changes to existing web application code
- Clean deployment without system dependencies
- Future-proofs for potential advanced features without committing to them

**Hybrid deployment approach:**
```bash
# Container startup logic:
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
# Start nginx serving /app/ directory
nginx -g 'daemon off;'
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
├── nginx serves web app files to local network
├── Persistent volume for tournament storage
├── Auto-update from internet when available
└── API endpoints for tournament CRUD operations

Venue WiFi Network (No Internet Required)
├── Tournament Overview Display(s)
│   └── Connect to http://tournament-computer-ip/
├── Referee Tablets
│   ├── Connect to same nginx-served web app
│   ├── 501 scoring interface
│   └── Statistics sync via API
└── Tournament Manager Browser
    └── Enhanced with persistent disk storage
```

### Resilient Storage Architecture

**Triple-redundant data storage:**
```
Disk Storage (Persistent) ↔ localStorage (Working Copy) ↔ Browser UI
```

**Data flow patterns:**
- **Load Tournament**: Disk → localStorage → UI
- **Tournament Changes**: UI → localStorage → auto-save to disk
- **Browser Refresh**: localStorage provides instant availability
- **Container Restart**: Disk storage provides authoritative state

**Failure resilience:**
- **Network fails**: Browser continues using localStorage, syncs when reconnected
- **Container crashes**: Browser works from localStorage until container restarts
- **Browser crashes**: Container maintains authoritative copy on disk
- **Power failure**: Both localStorage and disk storage survive

### Enhanced Tournament Management

**Current workflow:**
- Tournament data in browser LocalStorage only
- Export tournament → download JSON file
- Import tournament → upload JSON file

**With persistent storage:**
- Tournament data automatically saved to container's persistent volume
- "Save Tournament" writes directly to disk
- Tournament list shows all previously saved tournaments
- "Load Tournament" picks from disk-saved tournaments
- Export/import still available for sharing between venues

**localStorage becomes resilience layer:**
- Maintains existing Sky High Resilience within browser
- PLUS persistent storage surviving browser/computer failures
- PLUS network access for tablets/displays
- Working copy principle: localStorage like Git working directory with persistent backing store

### Browser Technology Stack
- **nginx Web Server**: Serves static web app files and provides API endpoints
- **Docker Container**: Provides consistent deployment and persistent storage
- **WebSocket/HTTP Communication**: Real-time updates between devices
- **localStorage**: Working copy storage for offline resilience
- **Persistent Volume**: Authoritative tournament data storage
- **Responsive Web Design**: Same codebase adapts to different screen sizes

## Implementation Priorities

### High Priority (Phase 1)
- [ ] Tournament Overview display page
- [ ] Local HTTP server capability
- [ ] Basic tournament state broadcasting

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
- nginx container serving on local network without authentication - anyone can access
- Referee tablets could potentially corrupt tournament data if compromised
- Malicious devices connecting to venue WiFi pose security risks
- Tournament computer becomes a network attack surface

**Mitigation Strategies:**
- Implement basic HTTP authentication for tournament management endpoints
- Read-only access for display devices, limited write access for referee tablets
- Network isolation through VLAN or guest network configuration
- Regular security updates through auto-update mechanism

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
- Docker adds significant complexity for non-technical tournament directors
- Version mismatches between container and referee tablets
- Venue IT policies may block Docker or custom containers
- Network configuration becomes tournament director responsibility

**Mitigation Strategies:**
- Provide pre-configured Docker images with simple startup scripts
- Automated version compatibility checks and warnings
- Alternative deployment options for restrictive environments
- Network setup documentation and venue requirements checklist
- Technical support resources and troubleshooting guides

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