# NewTon DC Tournament Manager v3.0.3 Release Notes

**Release Date:** October 2025
**Bug Fix Release**

---

## Overview

**NewTon DC Tournament Manager Version 3.0.3** fixes a critical bug in the REST API that could cause silent data loss when uploading tournaments to a self-hosted server.

This release contains no breaking changes and is a drop-in replacement for v3.0.2.

**Key Highlights:**
- Fixed: REST API now prevents accidental tournament overwrites
- Server uploads now require explicit confirmation before overwriting existing files
- Added safety dialogs to prevent data loss

---

## 🐛 Critical Bug Fix: Tournament Upload Duplicate Prevention

**The Problem:**
When using the PHP REST API to upload tournaments to a self-hosted server, uploading a tournament with the same filename as an existing file would **silently overwrite** the existing tournament without any warning. This could result in accidental data loss if an older tournament version was uploaded over a newer one.

**The Fix:**
The upload API now detects duplicate filenames and requires explicit user confirmation before overwriting.

**New User Flow:**
1. User uploads tournament that already exists on server
2. Confirmation dialog appears: *"Tournament '[filename]' already exists on server. Do you want to overwrite it?"*
3. **User confirms** → Upload retries with `?overwrite=true` parameter, file replaced
4. **User cancels** → Upload aborted, existing file preserved

**Technical Details:**
- **API Enhancement**: `POST /api/upload-tournament.php` now checks `file_exists()` before writing
- **Query Parameter**: `?overwrite=true` explicitly allows overwriting existing files
- **Response Feedback**: API returns `overwritten: true` when file was replaced
- **Error Code**: Returns `409 Conflict` status when duplicate detected without overwrite permission

**Why It Matters:**
This prevents accidental data loss in scenarios like:
- Uploading a backup from yesterday over today's completed tournament
- Multiple tournament organizers uploading different versions of the same file
- Testing/development accidentally overwriting production tournament data

**Files Modified:**
- `api/upload-tournament.php` - Added duplicate detection and overwrite parameter handling
- `js/tournament-management.js` (lines 195-264) - Added confirmation dialog and retry logic with `?overwrite=true`

---

## 🚀 Migration from v3.0.2

### Automatic
- Fully compatible with v3.0.2 tournaments
- No data migration required
- Configuration preserved
- Existing tournaments on server remain unchanged

### For Self-Hosters (Docker/PHP)
**If you're using the REST API for tournament sharing:**
1. Update to v3.0.3 (pull latest Docker image or update files)
2. No configuration changes required
3. Users will now see confirmation dialogs before overwriting existing tournaments

**If you're using local-only (offline) mode:**
- This fix does not affect you (no server upload functionality)
- Safe to upgrade for consistency

### Compatibility
- All v3.0.2 tournaments work in v3.0.3
- v3.0.3 exports remain compatible with v3.0.2 and v3.0.1
- REST API maintains backward compatibility (clients without `?overwrite=true` will get 409 responses for duplicates)

---

## 📖 Additional Resources

- **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)**: Get Docker running in under 2 minutes
- **docker/README.md**: Docker-specific quick reference
- **Docs/DOCKER.md**: Complete Docker deployment documentation
- **Docs/SECURITY.md**: Security best practices for self-hosted deployments
- **CHANGELOG.md**: Detailed version history

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v3.0.3** - Safe, reliable tournament management with duplicate protection.
