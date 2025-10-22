# NewTon DC Tournament Manager v3.0.4 Release Notes

**Release Date:** October 2025
**Configuration Release**

---

## Overview

**NewTon DC Tournament Manager Version 3.0.4** brings flexible Docker configuration via environment variables and changes the internal port to 2020 ("Double 20" 🎯) to improve compatibility with reverse proxies.

This release contains no breaking changes and is a drop-in replacement for v3.0.3.

**Key Highlights:**
- Environment variable configuration for Docker deployments
- API can now be disabled for security-conscious deployments
- Demo mode with privacy banner for public demo sites
- Internal port changed to 2020 ("Double 20") to avoid reverse proxy conflicts
- Comprehensive reverse proxy documentation (Nginx Proxy Manager, Caddy, Traefik)

---

## ⚙️ Environment Variable Configuration

Docker deployments can now be configured via environment variables without modifying files or building custom images.

**Available Configuration:**
- **`NEWTON_API_ENABLED`** - Enable/disable REST API endpoints (default: `true`)
- **`NEWTON_DEMO_MODE`** - Show privacy banner on demo sites (default: `false`)
- **`NEWTON_GITHUB_URL`** - Customize GitHub link in banner (default: `https://github.com/skrodahl/NewTon`)
- **`NEWTON_HOST_PORT`** - Configure host port mapping (default: `8080`)

**Example Use Case - Demo Site:**
```yaml
environment:
  - NEWTON_API_ENABLED=false  # Disable uploads for security
  - NEWTON_DEMO_MODE=true     # Show privacy notice
```

**Example Use Case - Security Hardening:**
```yaml
environment:
  - NEWTON_API_ENABLED=false  # Read-only mode, no uploads/deletes
```

**Why It Matters:**
Public demo sites (like https://darts.skrodahl.net) can now use the standard Docker image with different configuration, eliminating the need for custom builds. Security-conscious self-hosters can disable the API entirely while still benefiting from Docker deployment.

---

## 🎯 Port 2020: "Double 20"

The internal nginx port has been changed from 80 to **2020** - a thematic nod to darts' highest scoring segment!

**What Changed:**
- nginx now listens on port **2020** internally (was port 80)
- Default port mapping remains `8080:2020` (users still access via `http://localhost:8080`)
- Reverse proxy users now point to `newton:2020` instead of `newton:80`

**Why It Matters:**
When using reverse proxies like Nginx Proxy Manager with Docker networks, many containers listen on port 80, causing conflicts. Port 2020 virtually eliminates this conflict while adding a fun thematic touch - "Double 20" is the highest scoring segment in darts! 🎯🎯

**For Reverse Proxy Users:**
Update your proxy configuration to point to `newton:2020`:
```yaml
# In NPM or your reverse proxy
Scheme: http
Forward Hostname: newton
Forward Port: 2020
```

**For Direct Users:**
No change! Still access via `http://localhost:8080` (the host port maps to the internal port).

---

## 🛡️ Demo Mode with Privacy Banner

Public demo sites can now display a privacy-focused banner automatically.

**What It Shows:**
> 📍 Demo Site. Everything you do is stored locally in your browser. Your data never leaves your device. [View on GitHub]

**When to Use:**
Perfect for public demo deployments where you want to immediately clarify that:
- Data is stored in browser LocalStorage only
- Nothing is uploaded to servers
- Users' tournament data remains completely private

**Example - Replicating darts.skrodahl.net:**
```yaml
environment:
  - NEWTON_API_ENABLED=false  # No server uploads
  - NEWTON_DEMO_MODE=true     # Show privacy banner
```

**Why It Matters:**
Visitors to demo sites immediately understand the privacy model. Particularly important in r/selfhosted communities that value data ownership and privacy.

**Technical Note:**
The demo banner preserves the core feature of opening `tournament.html` directly as a static file. The PHP configuration block only executes when served via nginx/PHP-FPM (Docker), and is gracefully ignored when opening the file locally.

---

## 📚 Enhanced Documentation

**DOCKER-QUICKSTART.md Improvements:**
- New "Configuration" section documenting all environment variables
- "Reverse Proxy Setup" guide for NPM/Caddy/Traefik users
- "Demo Site Setup" showing how to replicate public demo deployments
- Updated security notice with API disable option
- All port references updated with "Double 20" explanations throughout

**Why It Matters:**
Self-hosters using reverse proxies now have clear, tested examples for common setups. The "Double 20" port reference adds a memorable detail that helps with troubleshooting ("remember, it's port 2020, not 80!").

---

## 🚀 Migration from v3.0.3

### Automatic
- Fully compatible with v3.0.3 tournaments
- No data migration required
- Configuration preserved
- Existing deployments continue working

### For Docker Users
**If using default configuration:**
- Pull latest image: `docker compose pull && docker compose up -d`
- Container now listens on port 2020 internally (mapped to 8080 externally)
- No user-facing changes

**If using reverse proxy (NPM, Caddy, etc.):**
- Update proxy configuration: Change target port from `80` to `2020`
- Container hostname remains the same (e.g., `newton`)
- Example: `http://newton:2020` instead of `http://newton:80`

**If using localhost-only binding:**
- Update docker-compose.yml port binding:
- Old: `127.0.0.1:8080:80`
- New: `127.0.0.1:8080:2020`

### For Static HTML Users
- No changes required
- `tournament.html` still works when opened directly
- PHP configuration is gracefully ignored (as designed)

### Compatibility
- All v3.0.3 tournaments work in v3.0.4
- v3.0.4 exports remain compatible with v3.0.3, v3.0.2, and v3.0.1
- Environment variables have sensible defaults (backward compatible)
- REST API unchanged (when enabled)

---

## 📖 Additional Resources

- **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)**: Configuration options and reverse proxy setup
- **docker/README.md**: Docker-specific quick reference
- **Docs/DOCKER.md**: Complete Docker deployment documentation
- **CHANGELOG.md**: Detailed version history

---

## 🐛 Known Issues

None at time of release. Please report issues through GitHub repository.

---

**NewTon DC Tournament Manager v3.0.4** - Flexible, secure, and reverse proxy-friendly tournament management. 🎯
