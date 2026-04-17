## NewTon DC Tournament Manager v4.0.8 Release Notes

**Release Date:** October 1, 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 4.0.8** improves Docker documentation and fixes a Match Controls sorting issue, making deployment easier and match management more intuitive.

This release contains no breaking changes and is a drop-in replacement for v4.0.7.

**Key Highlights:**
- Docker documentation now prioritizes Docker Hub over GHCR
- Match Controls displays matches in correct numerical order (FS-1-1, FS-1-2, FS-1-10 instead of alphabetical)

---

## ✨ Enhancements

**Docker Hub as Primary Registry:**

Docker documentation and compose files now use Docker Hub as the recommended registry, reflecting actual user behavior (90+ Docker Hub pulls vs 8 GHCR pulls).

**What Changed:**
- Quickstart guide examples use `skrodahl/newton:latest` instead of `ghcr.io/skrodahl/newton:latest`
- Docker Compose files default to Docker Hub with GHCR as commented alternative
- Deployment documentation reordered to show Docker Hub first

**Why It Matters:**
Simpler syntax, better discoverability, and documentation that matches real-world usage patterns. GHCR remains available for GitHub-native workflows.

---

## 🐛 Bug Fixes

**Match Controls Numerical Sorting:**

Fixed Match Controls match list sorting to use numerical order instead of alphabetical. Previously, matches sorted incorrectly as FS-1-1, FS-1-10, FS-1-11, FS-1-15, FS-1-16, FS-1-2.

**What's Fixed:**
- Ready matches now sort numerically within rounds: FS-1-1, FS-1-2, FS-1-10, FS-1-11
- LIVE matches use numerical sort as tiebreaker when lanes are equal
- Applies to both Frontside and Backside brackets

**Implementation:**
Parses match number from match ID and sorts numerically rather than treating IDs as text strings.

---

## 🚀 Migration from v4.0.7

### Automatic
- Fully compatible with all v4.0.x tournaments
- No data migration required
- No functional changes to existing tournament behavior

### What's New
If you use Docker deployment:
1. Update docker-compose.yml to use `skrodahl/newton:latest` for cleaner syntax
2. GHCR still works (`ghcr.io/skrodahl/newton:latest`)

If you use Match Controls:
1. Matches now display in correct numerical order
2. No action required - sorting automatically corrected

### Compatibility
- All v4.0.x tournaments work in v4.0.8
- Docker images available on both Docker Hub and GHCR
- No changes to core tournament functionality

---

## 📖 Additional Resources

- **CHANGELOG.md**: Detailed version history with technical implementation details
- **DOCKER-QUICKSTART.md**: Quick start guide for Docker deployment
- **docker/README.md**: Comprehensive Docker deployment documentation
- **Docs/RELEASE-NOTES-v4.0.7.md**: Security headers documentation and Docker Hub publishing
- **Docs/RELEASE-NOTES-v4.0.3.md**: Developer Console placement rank enhancement

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v4.0.8** - Simplified Docker deployment and improved match sorting.
