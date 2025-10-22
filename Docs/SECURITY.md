# Security Considerations

Security guidance for self-hosting NewTon Tournament Manager.

---

## Overview

NewTon Tournament Manager is designed for **trusted environments** (local networks, VPNs, club deployments). The REST API endpoints have **no built-in authentication** for simplicity.

**⚠️ Do not expose the Docker deployment directly to the public internet without additional security measures.**

---

## Attack Surface

### Browser-Only Deployment (tournament.html)
✅ **Completely safe** - Everything runs in visitor's browser LocalStorage, no server state, no shared data.

### Docker Deployment (with PHP REST API)
⚠️ **Requires protection** - Unauthenticated API endpoints allow anyone with network access to:
- Upload tournaments (`POST /api/upload-tournament.php`)
- Delete tournaments (`POST /api/delete-tournament.php`)
- List tournaments (`GET /api/list-tournaments.php`)

---

## Security Options

Choose the approach that fits your deployment scenario:

### Option 1: Network Isolation (Recommended for Most Users)

**Best for:** Club deployments, home networks, trusted environments

**Bind to localhost only:**
```yaml
# docker-compose.yml
services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:latest
    ports:
      - "127.0.0.1:8080:80"  # Only accessible from localhost
    # ... rest of config
```

**Access methods:**
- **SSH tunnel:**
  ```bash
  ssh -L 8080:localhost:8080 user@your-server.com
  # Access at http://localhost:8080 on your local machine
  ```

- **VPN** (Tailscale, WireGuard, OpenVPN):
  - Connect to VPN
  - Access server's private IP: `http://10.0.0.5:8080`

- **Reverse proxy with authentication** (see Option 2)

**Pros:**
- Simple configuration
- Maximum security (not accessible from internet)
- No authentication complexity

**Cons:**
- Requires VPN or SSH tunnel for remote access

---

### Option 2: Reverse Proxy Authentication

**Best for:** Accessing from multiple locations without VPN

#### Using nginx

**Add basic authentication:**
```nginx
# /etc/nginx/sites-available/newton
server {
    listen 80;
    server_name darts.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        auth_basic "Tournament Manager API";
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Generate password file:**
```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
sudo systemctl reload nginx
```

**Configure SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d darts.example.com
```

#### Using Caddy

**Automatic HTTPS + basic auth:**
```caddy
darts.example.com {
    reverse_proxy localhost:8080

    @api path /api/*
    basic_auth @api {
        admin $2a$14$hashed_password_here
    }
}
```

**Generate hashed password:**
```bash
caddy hash-password
```

**Pros:**
- Accessible from anywhere
- Standard HTTP authentication
- Works with existing browser tools

**Cons:**
- Credentials sent with every request
- Browser may cache credentials

---

### Option 3: IP Whitelist

**Best for:** Fixed IP addresses (office, home with static IP)

**nginx configuration:**
```nginx
server {
    listen 80;
    server_name darts.example.com;

    location /api/ {
        # Allow specific IPs
        allow 192.168.1.0/24;    # Local network
        allow 203.0.113.42;      # Office IP
        allow 198.51.100.10;     # Home IP
        deny all;

        proxy_pass http://localhost:8080;
    }

    location / {
        proxy_pass http://localhost:8080;
    }
}
```

**Docker network isolation:**
```yaml
# docker-compose.yml
networks:
  default:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          ip_range: 172.20.240.0/20
```

**Pros:**
- No authentication complexity
- Simple configuration
- Works transparently

**Cons:**
- Requires static IPs
- Needs updating if IPs change
- Breaks when traveling

---

### Option 4: Rate Limiting (Defense in Depth)

**Add to any of the above options for additional protection**

**nginx rate limiting:**
```nginx
# Limit API requests to 10 per minute per IP
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;

    server {
        location /api/ {
            limit_req zone=api burst=5 nodelay;
            limit_req_status 429;

            # ... rest of config
        }
    }
}
```

**Benefits:**
- Prevents spam/DoS attacks
- Limits impact of credential theft
- Protects against automated scanners

**Limitations:**
- Doesn't prevent authenticated malicious access
- May need tuning for legitimate high-frequency usage

---

## Future Enhancement: API Key Authentication

**Planned for future version (v3.1 or later)**

Optional API key authentication will allow self-hosters to:
- Set environment variable: `API_KEY=your-secret-key`
- Configure API key in Config page
- All API requests require `X-API-Key` header

**Will be backward compatible:**
- If `API_KEY` not set → Works without authentication (current behavior)
- If `API_KEY` set → Requires key for API access

See `Docs/PARKING-LOT.md` for status.

---

## Recommended Deployment Patterns

### Pattern 1: Club Local Network (Most Common)
```
Club members → Local WiFi → Docker on local server (192.168.x.x:8080)
```
**Security:** Network isolation (club WiFi only)
**No additional auth needed**

### Pattern 2: Home Network
```
You → Home WiFi → Docker on home server (10.0.0.x:8080)
```
**Security:** Network isolation (home network only)
**No additional auth needed**

### Pattern 3: VPS with VPN
```
You → VPN (Tailscale/WireGuard) → VPS (10.x.x.x:8080)
```
**Security:** VPN provides authentication and encryption
**Bind to VPN interface only**

### Pattern 4: VPS with Reverse Proxy
```
Internet → nginx/Caddy (HTTPS + basic auth) → Docker (localhost:8080)
```
**Security:** HTTPS + HTTP basic authentication
**Rate limiting recommended**

---

## Not Recommended

❌ **Exposing Docker container directly to internet:**
```yaml
# DON'T DO THIS without additional security
ports:
  - "8080:80"  # Accessible from 0.0.0.0 (all interfaces)
```

**Why:** Unauthenticated API allows anyone to upload/delete tournaments

---

## Security Checklist

Before deploying to production:

- [ ] **Deployment pattern chosen** (local network, VPN, reverse proxy)
- [ ] **Port binding verified** (`127.0.0.1:8080:80` if not on trusted network)
- [ ] **Firewall rules configured** (if applicable)
- [ ] **HTTPS configured** (if exposing to internet)
- [ ] **Authentication enabled** (if exposing to internet)
- [ ] **Rate limiting configured** (if exposing to internet)
- [ ] **Backups configured** (tournaments directory)
- [ ] **Monitor logs** for suspicious activity

---

## Monitoring & Maintenance

### Check for suspicious activity

**Monitor nginx/Docker logs:**
```bash
# Check for excessive API calls
docker logs newton | grep "/api/" | tail -100

# Check for failed authentication (if using basic auth)
grep "401\|403" /var/log/nginx/access.log
```

**Watch for:**
- Repeated API calls from unknown IPs
- Large number of upload/delete requests
- Unusual file sizes

### Backup strategy

**Automatic backups:**
```bash
# Cron job to backup tournaments directory
0 2 * * * tar czf /backups/tournaments-$(date +\%Y\%m\%d).tar.gz /path/to/tournaments/
```

**Retention policy:**
- Keep daily backups for 7 days
- Keep weekly backups for 4 weeks
- Keep monthly backups for 12 months

---

## Incident Response

**If you suspect unauthorized access:**

1. **Stop the container immediately:**
   ```bash
   docker stop newton
   ```

2. **Check logs for suspicious activity:**
   ```bash
   docker logs newton > /tmp/newton-logs.txt
   ```

3. **Verify tournament files:**
   ```bash
   ls -lat tournaments/
   ```

4. **Restore from backup if needed:**
   ```bash
   tar xzf /backups/tournaments-20251022.tar.gz
   ```

5. **Implement stricter security** before restarting:
   - Add authentication
   - Bind to localhost
   - Add IP whitelist
   - Enable rate limiting

6. **Restart with new security measures:**
   ```bash
   docker start newton
   ```

---

## Reporting Security Issues

**Found a security vulnerability?**

Please report via GitHub Issues:
- https://github.com/skrodahl/NewTon/issues

**For sensitive security issues:**
- Email maintainer directly (see README.md for contact)
- Do not publicly disclose until patched

---

## Philosophy

NewTon Tournament Manager prioritizes:
1. **Simplicity** - No complex authentication for trusted environments
2. **Resilience** - Offline-first, works without server
3. **Flexibility** - Deploy however fits your needs

**Security is your responsibility when self-hosting.** Choose the deployment pattern that matches your threat model and technical comfort level.

For most clubs running tournaments on local networks, network isolation is sufficient. For internet-facing deployments, use reverse proxy authentication or VPN.

---

**Last updated:** October 22, 2025
