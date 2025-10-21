# NewTon DC Tournament Manager v3.0.2 Release Notes

**Release Date:** October 2025
**Incremental Release**

---

## Overview

**NewTon DC Tournament Manager Version 3.0.2** brings Docker deployment support for self-hosting, referee conflict improvements, and quality-of-life refinements.

This release contains no breaking changes and is a drop-in replacement for v3.0.1.

**Key Highlights:**
- Docker containerization for easy self-hosting
- Improved referee conflict detection (self-refereeing support)
- Extended transaction history capacity (500 → 1000)
- UI spacing and layout refinements

---

## 🐳 Docker Deployment

Self-hosting NewTon Tournament Manager is now effortless with full Docker support.

**What You Get:**
- Lightweight Alpine-based container (~60MB)
- nginx + PHP-FPM for optimal performance
- Full PHP REST API support for tournament sharing
- Multi-architecture builds (Intel/AMD + Apple Silicon/Raspberry Pi)
- Automated builds published to GitHub Container Registry
- Persistent storage for uploaded tournaments

**Quick Start:**
```bash
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  ghcr.io/skrodahl/newton-darts:latest
```

**Why It Matters:**
Clubs can now easily host their own tournament manager instance on a server, enabling centralized tournament archives and multi-device access without relying on external services.

**Documentation:**
- **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)** - Step-by-step guide to get running in under 2 minutes
- `docker/README.md` - Docker-specific quick reference
- `Docs/DOCKER.md` - Comprehensive deployment guide with reverse proxy setup

---

## ⚖️ Referee Improvements

**Self-Refereeing Support:**
Players can now referee their own matches without triggering conflict warnings. The system still prevents players from refereeing one match while playing in another - it just recognizes that self-refereeing is valid.

**Why It Matters:**
Common in smaller tournaments where players take turns refereeing. The previous version would incorrectly block starting matches when a player was assigned as their own referee.

---

## 📊 Extended Transaction History

**Increased Capacity:**
Transaction history limit doubled from 500 to 1000 entries, providing even more operational headroom for complex tournaments.

**Why It Matters:**
Combined with the storage optimization from v3.0.1 (97% size reduction), tournaments can now handle 100+ completed matches with extensive lane/referee reassignments without any concern about hitting storage limits. This eliminates the last theoretical corner case for transaction capacity.

---

## 🎨 UI Refinements

**Consistency Improvements:**
- Fixed spacing between page titles and content (Setup page now matches Registration page)
- Adjusted payment QR code display size (200px → 175px) for better visual balance on lower resolution displays

**Why It Matters:**
Consistent visual rhythm across all pages and improved layout density for compact displays commonly used at tournament venues.

---

## 🚀 Migration from v3.0.1

### Automatic
- Fully compatible with v3.0.1 tournaments
- No data migration required
- Configuration preserved
- Docker deployment is optional (local-only usage unchanged)

### For Self-Hosters
If you want to deploy using Docker:
1. See **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)** for step-by-step setup
2. Review `Docs/DOCKER.md` for production deployment
3. Configure reverse proxy if needed (nginx/Caddy examples included)

### Compatibility
- All v3.0.1 tournaments work in v3.0.2
- v3.0.2 exports remain compatible with v3.0.1
- Docker images published to `ghcr.io/skrodahl/newton-darts`
- Multi-architecture support: linux/amd64, linux/arm64

---

## 📖 Additional Resources

- **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)**: Get Docker running in under 2 minutes
- **docker/README.md**: Docker-specific quick reference
- **Docs/DOCKER.md**: Complete Docker deployment documentation
- **Docs/UNDO.md**: Undo system documentation
- **Docs/ANALYTICS.md**: Developer Console guide
- **CHANGELOG.md**: Detailed version history

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v3.0.2** - Professional tournament management with self-hosting capabilities.
