# NewTon DC Tournament Manager v4.0.1 Release Notes

**Release Date:** October 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.1** completes the migration to the per-tournament transaction-based history system introduced in v4.0.0, with comprehensive documentation updates to match the current implementation.

This release contains no breaking changes and is a drop-in replacement for v4.0.0.

**Key Highlights:**
- Removed legacy snapshot-based undo system file
- Complete overhaul of import/export documentation
- Clarified stats architecture (single source of truth)
- Updated Docker documentation with nginx logs information

---

## 🧹 Code Cleanup

**Removed Legacy History System:**
The old snapshot-based undo system file (`history-management.js`) has been removed from the codebase, completing the migration to the transaction-based history architecture introduced in v4.0.0.

**What Happened:**
- v4.0.0 introduced per-tournament transaction-based history in `clean-match-progression.js`
- The old snapshot-based system in `history-management.js` became obsolete
- File was never loaded in `tournament.html` and functions were never called
- Now permanently removed for a cleaner codebase

**Why It Matters:**
Eliminates confusion about which history system is in use and ensures the codebase only contains actively used files.

---

## 📖 Documentation Overhaul

**Complete Rewrite of IMPORT_EXPORT.md:**
The import/export documentation has been completely overhauled to accurately reflect the v4.0 implementation, with all examples matching real export data.

### Export Schema Updates
- Fixed `shortLegs` type: Documented as `array of integers` (not `number`)
- Updated all example IDs and timestamps to match real tournament exports
- Added inline comments explaining field types
- Documented all three status states: `setup`, `active`, `completed`

### New Detailed Sections
- **playerList Format**: Simple array of strings (not player objects)
- **placements Format**: Key-value map (playerID → placement rank)
- **Player Object Structure**: Complete schema with all fields and correct types
- **Match Object Structure**: All missing fields documented
  - `numericId` - Sequential match number
  - `positionInRound` - Position within the round
  - `autoAdvanced` - Walkover completion flag
  - `completedAt` - Completion timestamp
  - `finalScore` - Complete score object with legs and player IDs
- **Walkover Players**: Documented `isBye` flag and ID format
- **TBD Players**: Documented incomplete bracket placeholder structure

### Transaction History Complete Rewrite
- Replaced simplified examples with actual transaction structures
- Documented all 5 transaction types:
  - `COMPLETE_MATCH` - Match completion with winner/loser
  - `START_MATCH` - Match marked as active
  - `STOP_MATCH` - Match stopped (not completed)
  - `ASSIGN_LANE` - Dartboard lane assignment
  - `ASSIGN_REFEREE` - Referee assignment
- Documented transaction ID format: `tx_{timestamp}`
- Documented completion types: `MANUAL` vs `AUTO`
- Showed that `COMPLETE_MATCH` transactions contain full player objects

### Critical Clarification: Stats Architecture
**Single Source of Truth:**

Added comprehensive documentation explaining that stats embedded in match objects and transaction history are **historical snapshots only** and never used for calculations.

**Key Points:**
- ✅ **Global `players` array**: ONLY source for Statistics table and points
- ✅ **Stats in matches/transactions**: For audit trail and history keeping
- ✅ **Stat corrections**: Immediately affect current results
- ✅ **Architecture benefit**: No need to recalculate historical match data

**Why It Matters:**
Prevents confusion about which stats data is authoritative and ensures developers understand that correcting player stats through the UI immediately affects the Statistics table without touching historical records.

### Import/Export Function Updates
- Updated `validateTournamentData` to match actual implementation
- Fixed variable naming: `isPreV4` → `isOldFormat`
- Updated `continueImportProcess` to match actual code flow
- Updated all console output examples to match reality

---

## 🐳 Docker Documentation Updates

**Nginx Logs Persistence:**
Added comprehensive documentation for persisting nginx access and error logs in Docker deployments.

**Files Updated:**
- **DOCKER-QUICKSTART.md**: Added "Nginx Logs (Optional)" section with viewing commands and use cases
- **docker/README.md**: Added nginx logs to Persistent Storage section
- **docker/docker-compose.yml**: Added commented-out logs volume mount for easy enablement

**What's Included:**
- Log location: `/var/log/nginx` inside container
- Log files: `access.log` (HTTP requests), `error.log` (nginx errors/warnings)
- Viewing commands: `tail -f logs/access.log`
- Use cases: Troubleshooting, monitoring, security auditing, performance analysis

**How to Enable:**
Simply uncomment one line in `docker-compose.yml`:
```yaml
volumes:
  - ./tournaments:/var/www/html/tournaments
  - ./images:/var/www/html/images:ro
  # - ./logs:/var/log/nginx  # Uncomment this line
```

**Why It Matters:**
Makes it easy for Docker users to persist and access nginx logs for troubleshooting HTTP issues, monitoring API usage, and security auditing without having to figure out container log paths.

---

## 🚀 Migration from v4.0.0

### Automatic
- Fully compatible with v4.0.0 tournaments
- No data migration required
- No functional changes to application behavior

### For Developers
If you're working with the codebase or export files:
1. Review updated **Docs/IMPORT_EXPORT.md** for accurate export format specification
2. Note that `shortLegs` is an array, not a number
3. Understand that stats in match objects are historical snapshots only
4. All code examples in documentation now match actual implementation

### For Docker Users
If you're running NewTon in Docker:
1. Review **DOCKER-QUICKSTART.md** for nginx logs persistence information
2. Uncomment logs volume in `docker-compose.yml` to enable persistent logs
3. Use `tail -f logs/access.log` to monitor HTTP requests
4. Check `logs/error.log` for troubleshooting nginx issues

### Compatibility
- All v4.0.0 tournaments work in v4.0.1
- v4.0.1 exports identical to v4.0.0 exports
- All documentation now 100% accurate to implementation

---

## 📖 Additional Resources

- **Docs/IMPORT_EXPORT.md**: Complete import/export specification (overhauled in v4.0.1)
- **DOCKER-QUICKSTART.md**: Docker quick start guide (updated with nginx logs)
- **docker/README.md**: Docker deployment reference
- **CHANGELOG.md**: Detailed version history
- **Docs/RELEASE-NOTES-v4.0.0.md**: Per-tournament history architecture overview

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.1** - Code cleanup and documentation accuracy for the per-tournament history system.
