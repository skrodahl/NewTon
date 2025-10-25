# NewTon DC Tournament Manager v4.0.0 Release Notes

**Release Date:** October 2025
**Architecture Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.0** represents a fundamental rebuild of the application's data architecture. This major release isolates tournament storage, improves data portability, and strengthens the foundations that make NewTon reliable for live tournament operations.

This is a **major version bump** because it changes how tournament data is stored internally. The release maintains data compatibility with pre-v4.0 exports (undo history not preserved for pre-import matches).

**Key Highlights:**
- Per-tournament history isolation eliminates cross-contamination
- Export files reduced from 9.9MB to ~110KB (99% smaller)
- Complete tournament portability with undo functionality preserved
- Data compatible import of pre-v4.0 exports (undo unavailable for pre-import matches)
- Enhanced Developer Console with granular storage visibility
- Consistent placement system across all bracket scenarios

---

## Why v4.0.0: Architecture Foundations

Version 4.0.0 represents a comprehensive rebuild of six core systems:

### 1. Transaction History
**Previous Architecture:** Global `tournamentHistory` accumulated transactions from all tournaments ever played, creating bloated exports and potential data contamination.

**New Architecture:** Each tournament stores its own history in `tournament_${id}_history` localStorage key, completely isolated from other tournaments.

**Impact:** Clean exports, no cross-contamination, history deleted with tournament, complete data portability.

### 2. Storage System
**Previous Architecture:** Tournament data spread across global keys with unclear boundaries and no visibility into storage usage patterns.

**New Architecture:** Clear separation between per-tournament data, global configuration, and shared resources. Developer Console provides granular breakdown showing exactly what's using storage.

**Impact:** Easy identification of storage optimization opportunities, tournament names shown instead of IDs, cleanup suggestions for orphaned data.

### 3. Import/Export
**Previous Architecture:** Export format included contaminated multi-tournament history, no version validation, exports could reach 9.9MB for a 32-player tournament.

**New Architecture:** Export format v4.0 includes `exportVersion` field, per-tournament history only, complete data snapshot. Exports are ~110KB for 32-player tournaments (99% reduction).

**Impact:** Fast file transfers, version validation on import, complete tournament portability, undo functionality preserved after import.

### 4. Referee Assignment
**Previous Architecture:** Referee validation had unclear error detection, flagging scenarios that weren't actual tournament errors.

**New Architecture:** Validation only flags genuine error states - one referee assigned to multiple active matches simultaneously.

**Impact:** No false positives, clear distinction between operational constraints and error states, cleaner analytics.

### 5. Match/Referee Conflict Detection
**Previous Architecture:** Validation checked non-existent `match.state` property, causing completed matches to be flagged incorrectly.

**New Architecture:** Validation correctly checks `match.completed` boolean property, understanding that match state is calculated dynamically.

**Impact:** Accurate conflict detection, no false alarms, trustworthy Developer Console validation results.

### 6. Developer Console
**Previous Architecture:** Storage display showed tournament IDs, lacked granular breakdown, no cleanup suggestions.

**New Architecture:** Comprehensive storage analysis showing current tournament breakdown (players, matches, bracket, placements, metadata), other tournaments by name, global storage, cleanup opportunities, high storage warnings.

**Impact:** Complete visibility into storage patterns, actionable insights, easy identification of storage hogs, tournament names for better UX.

---

## 🏗️ Per-Tournament History Isolation

The foundation of v4.0.0's improvements is complete transaction history isolation.

**How It Works:**
- Each tournament stores history in dedicated localStorage key: `tournament_${id}_history`
- History is created when tournament starts, deleted when tournament is deleted
- Export includes tournament's history only, not contaminated with other tournaments
- Import restores history to correct isolated key

**Why It Matters:**
Before v4.0.0, completing 3 tournaments would accumulate 1000+ transactions in global history. Exporting any tournament would include all 1000+ transactions, creating 9.9MB files.

After v4.0.0, each tournament has exactly the transactions it needs. A 32-player tournament with 62 matches generates ~200 transactions, resulting in ~110KB exports.

**Data Integrity:**
The undo system clears and recalculates all placements after any operation, ensuring no stale data from the isolated history system.

---

## 📦 Export Format v4.0

Exports now include version validation and complete tournament portability.

**New Export Structure:**
```json
{
  "exportVersion": "4.0",
  "name": "Tournament Name",
  "date": "2025-10-23",
  "status": "completed",
  "bracketSize": 32,
  "players": [...],
  "matches": [...],
  "bracket": [...],
  "placements": {...},
  "history": [...],
  "playerList": [...],
  "exportedAt": "2025-10-23T..."
}
```

**What Changed:**
- Added `exportVersion: "4.0"` field for validation
- Added `history` array containing per-tournament transactions only
- Added `playerList` snapshot for saved players restoration
- Dramatically reduced file size (99% smaller for typical tournaments)

**Import Validation:**
v4.0 includes import confirmation modal that adapts based on export version:
- **Pre-v4.0 exports:** Shows yellow warning about missing undo history, allows import
- **v4.0 exports:** Shows green indicators confirming full functionality

**Backwards Compatibility:**
Pre-v4.0 exports import successfully as new tournaments with all tournament data intact (players, matches, bracket, placements, results). Imported tournaments are fully playable, but undo functionality is only available for matches completed after import. The imported tournament receives a new ID, so it won't overwrite any existing tournament with the same name.

---

## 🎯 Enhanced Placement System

The placement system is now fully consistent across all bracket scenarios.

**What Changed:**
- Winner confirmation modal shows eliminated player's final placement rank
- BS-FINAL loser gets 3rd place set immediately (consistent with other backside matches)
- Undo operations correctly restore 3rd place when Grand Final is undone
- All backside bracket eliminations display placement immediately

**User Experience:**
Instead of seeing "• Chris is eliminated", users now see "• Chris is placed 13th-16th" (or appropriate rank based on which backside match they lost).

**Technical Foundation:**
Uses existing hardcoded elimination rank mappings (`getEliminationRankForMatch`) that define placement based on tournament bracket structure. Same mappings used by Results Table calculations.

**Safety:**
All placements are cleared and recalculated atomically when Grand Final completes or when any match is undone, ensuring data integrity regardless of when placement was initially set.

---

## 🔍 Developer Console Enhancements

The Developer Console now provides comprehensive storage visibility and cleanup guidance.

**Current Tournament Detailed View:**
- Tournament data breakdown: players array, matches array, bracket structure, placements, metadata (with sizes and counts)
- Transaction history details: total count, average size, oldest/newest timestamps
- Total size and percentage of overall storage
- Smart pruning suggestions for optimization

**Other Tournaments Summary:**
- Shows tournament names (not IDs) for easy identification
- Combined data + history size per tournament
- Total storage for all inactive tournaments

**Global Storage Section:**
- Human-readable names (Tournament registry, Config, Saved Players)
- Individual sizes for each global key

**Orphaned Data Detection:**
- Detects tournament data not in registry (orphaned from deleted tournaments or v3.x migration)
- Shows exact removal commands for surgical cleanup
- Labels each orphan type (history, data, old global history)
- Manual deletion prevents accidental data loss

**High Storage Warning:**
- Alert when usage >= 80%
- Suggests deleting older tournaments with export reminder

**Fallback Logic:**
Storage display checks localStorage first, falls back to in-memory data if not yet saved. This ensures accurate display even for brand new tournaments.

---

## 🚀 Migration from v3.0.x

### Automatic
- Fully compatible with v3.0.x tournaments
- Existing tournaments continue working without modification
- Configuration preserved
- All features work identically

### First Run After Upgrade
When you first run v4.0.0:
1. Existing tournaments remain in localStorage (unchanged)
2. Open any tournament to start using it with v4.0.0
3. Tournament history migrates to per-tournament key automatically
4. Export creates v4.0 format with isolated history

### For Tournament Organizers
**During Active Tournament:**
- No interruption - upgrade anytime between matches
- Current tournament state preserved
- Undo functionality continues working

**After Tournament Completion:**
- Export creates clean v4.0 format (110KB vs 9.9MB)
- All placements, results, and history included
- Can be imported on any v4.0+ installation with full undo functionality

### For Self-Hosters (Docker)
**Upgrade Process:**
1. Pull latest image: `docker compose pull`
2. Restart container: `docker compose up -d`
3. No configuration changes required
4. Shared tournaments remain accessible

**Demo Site Update:**
Update is seamless - visitors see no changes to functionality, only improved performance and smaller export files.

### Data Migration Details
**What Migrates Automatically:**
- Tournament structure
- Player data and statistics
- Match results and bracket state
- Configuration and saved players

**What Changes:**
- Transaction history moves from global key to per-tournament keys
- Export format gains version field and isolated history
- Storage becomes more efficient (no cross-contamination)

**What's Preserved:**
- All tournament functionality
- Undo/redo operations
- Results calculations
- Point tracking
- Lane and referee assignments

### Compatibility
- v4.0.0 can import pre-v4.0 exports (backwards compatible)
- Pre-v4.0 installations cannot import v4.0 exports (forward compatibility not possible due to architecture changes)
- v4.0.0 tournaments work independently of pre-v4.0 tournament data
- Mixed environment support: v3.0.x and v4.0.0 can coexist (export from one, import to other)

---

## 🛡️ Security Headers

Version 4.0.0 includes comprehensive security headers in the Docker image for defense-in-depth protection.

### Headers Included by Default

**X-Frame-Options: SAMEORIGIN**
- Prevents clickjacking attacks where malicious sites embed NewTon in hidden iframes
- Allows embedding within same origin (good for legitimate use cases)
- Industry standard protection

**X-Content-Type-Options: nosniff**
- Prevents MIME-type sniffing attacks
- Browser respects Content-Type header exactly
- Stops browsers from interpreting files as different types

**Referrer-Policy: strict-origin-when-cross-origin**
- Controls how much referrer information is sent
- Protects privacy by limiting data leakage
- Balances functionality with privacy

**Permissions-Policy**
- Disables unused browser features that NewTon doesn't need
- Prevents malicious code from accessing: geolocation, microphone, camera, payment APIs, USB, magnetometer, gyroscope, accelerometer
- Reduces attack surface by explicitly denying permissions

**Content-Security-Policy (CSP)**
- Prevents loading scripts/styles/resources from external domains
- Primary defense against cross-site scripting (XSS) attacks via external resources
- Prevents data exfiltration to external servers

**Server Tokens Hidden**
- `server_tokens off` hides nginx version from HTTP headers
- Prevents attackers from targeting known vulnerabilities in specific versions
- Standard security practice

**PHP Version Hidden**
- `expose_php = Off` removes X-Powered-By header that reveals PHP version
- Prevents attackers from identifying PHP version and targeting known vulnerabilities
- Minimizes information disclosure

### Content Security Policy Details

NewTon's CSP is configured as:
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
frame-ancestors 'self';
```

**Why 'unsafe-inline' is Required:**

NewTon's architecture uses inline JavaScript and CSS throughout `tournament.html`:
- **68+ inline event handlers** (`onclick`, `onchange`, `onfocus`, etc.)
- **217+ inline style attributes** (`style="..."`)

These are architectural requirements for:
- Single-file deployment model (open `tournament.html` directly)
- Offline operation without bundling/build process
- Simplicity and maintainability

**What CSP Still Protects Against (even with 'unsafe-inline'):**
- ✅ Loading scripts from external domains (primary XSS vector)
- ✅ Loading styles from external domains
- ✅ Unauthorized API calls to external servers
- ✅ Data exfiltration attempts
- ✅ Embedding in malicious iframes

**What 'unsafe-inline' Weakens:**
- ❌ Cannot prevent XSS via injected inline scripts (if vulnerability existed)

**Why This is Acceptable:**
- NewTon has **no user-generated content** (no comments, no posts, no profiles)
- NewTon has **no XSS attack vectors** (all data is locally stored, no URL parameters parsed)
- The alternative would require massive refactoring and break the single-file deployment model

**Security Rating:** NewTon with these headers achieves **A grade** on [securityheaders.com](https://securityheaders.com), with an informational warning about 'unsafe-inline' (expected and acceptable).

### HSTS Not Included (Intentional)

Strict-Transport-Security (HSTS) is **not** included in the Docker image by default.

**Why:**
- HSTS forces HTTPS for extended period (typically 1 year)
- Setting it incorrectly can break access if HTTPS certificate expires or is misconfigured
- Should be user's choice based on their deployment

**How to Add HSTS:**

If you have HTTPS configured at your reverse proxy (Nginx Proxy Manager, Caddy, Traefik), add HSTS there:

**Nginx Proxy Manager:**
```
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Caddy:**
```
header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

**Why This Approach is Better:**
- Reverse proxy handles SSL/TLS termination (knows if HTTPS is actually working)
- Avoids breaking deployments that use HTTP-only locally
- Gives self-hosters full control over HTTPS enforcement

### Testing Security Headers

**Verify your deployment:**
1. Deploy NewTon v4.0.0 Docker image
2. Visit https://securityheaders.com
3. Enter your NewTon URL
4. Should see **A grade** with security headers present
5. Expected warning: "This policy contains 'unsafe-inline'" (informational only)

**Expected Results:**
- **Grade:** A
- **Headers Present:** 6 (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy, plus hidden server tokens)
- **Warning:** CSP 'unsafe-inline' (expected, explained above)

### Impact

**For Self-Hosters:**
- Security headers enabled by default (no configuration needed)
- Defense-in-depth protection out of the box
- A-grade security rating from deployment day one
- No breaking changes (headers are additive only)

**For Demo Site (darts.skrodahl.net):**
- Immediate security improvements
- Protects visitors from clickjacking and resource injection
- Maintains existing functionality (headers don't change behavior)

**For Privacy:**
- Security headers complement NewTon's privacy-by-architecture model
- Referrer-Policy reduces data leakage
- CSP prevents unauthorized network requests
- See [Docs/PRIVACY.md](PRIVACY.md) for complete privacy documentation

---

## 🖼️ Docker Images Folder

Version 4.0.0 improves the Docker image customization workflow with a dedicated images folder and default assets.

### What Changed

**Previous Behavior:**
- Individual file mounts: `./logo.png:/var/www/html/logo.png`, `./payment.png:/var/www/html/payment.png`
- **Bug:** If files don't exist, Docker creates directories instead
- **Impact:** 10-second browser hang when loading tournament page

**New Behavior:**
- Single folder mount: `./images:/var/www/html/images:ro`
- Default images included: `logo.jpg` (club logo) and `payment.png` (GitHub QR code)
- Missing images result in fast 404 instead of hang

### Benefits

**Professional Out-of-Box Experience:**
- Working logo and payment QR code from first run
- No confusing slow loads for new users
- Professional appearance without customization

**Easy Customization:**
- Drop files in `images/` folder on host
- Supports: `logo.png`, `logo.jpg`, `logo.jpeg`, `logo.svg`
- Payment image: `payment.png`
- Container automatically picks up changes

**Cleaner Configuration:**
- Single mount instead of two individual file mounts
- No directory creation bug
- Files go in correct location when copied into container

### Default Images

**images/logo.jpg:**
- Generic club logo placeholder
- Professional appearance for demos and testing

**images/payment.png:**
- GitHub project QR code
- Links to https://github.com/Havajos/newtondc

### Customization

To customize your Docker deployment:

1. Create `images/` folder in your Docker Compose directory
2. Add your files:
   - `images/logo.png` (or .jpg, .jpeg, .svg)
   - `images/payment.png`
3. Restart container: `docker compose restart`

Files are mounted read-only for security.

---

## 📖 Additional Resources

- **[Docs/IMPORT_EXPORT.md](IMPORT_EXPORT.md)**: Complete export format specification and architecture details
- **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)**: Docker deployment guide
- **[CHANGELOG.md](../CHANGELOG.md)**: Detailed version history with all changes

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

## 🎉 Why This Matters

Version 4.0.0 represents a fundamental investment in NewTon's architecture. By rebuilding the data storage foundation, we've created a more reliable, more maintainable, and more trustworthy tournament management system.

**For Tournament Organizers:**
- Faster exports (99% smaller files)
- Complete tournament portability
- Accurate validation (no false alarms)
- Clear placement feedback

**For Developers:**
- Clean architecture with clear boundaries
- Comprehensive storage visibility
- Easy debugging with Developer Console
- Solid foundation for future features

**For Self-Hosters:**
- Efficient storage usage
- Easy tournament management across installations
- Clear upgrade path
- No breaking changes to worry about

The foundations are solid. The system is trustworthy. NewTon v4.0.0 is ready for production tournament operations.

---

**NewTon DC Tournament Manager v4.0.0** - Rebuilt foundations. Proven reliability. 🎯
