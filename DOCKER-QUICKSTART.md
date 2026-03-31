# Docker Quick Start

Get NewTon DC Tournament Manager running in Docker in under 2 minutes.

**Prerequisites:** Docker and Docker Compose installed. Don't have Docker? [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS/Windows) or install via your package manager (Linux).

---

## Quick Start

```bash
mkdir newton-tournament
cd newton-tournament

curl -O https://raw.githubusercontent.com/skrodahl/NewTon/main/docker/docker-compose.yml
docker compose up -d
```

Open `http://localhost:8080` — NewTon is running.

**Port 2020 = "Double 20"** — nginx runs on port 2020 internally. The default host port (8080) maps to this.

> **Camera / QR scanning requires HTTPS.** The quick start runs HTTP only. Pick one of the three setups below to enable camera access.

---

## Setup Options

> **Image tag:** All compose files below use `skrodahl/newton:latest` (Docker Hub) with GHCR as a commented alternative.

### Mac / Windows

SSL enabled by default — gives you HTTPS and camera access on any platform.

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    # Alternative: ghcr.io/skrodahl/newton:latest
    container_name: newton
    ports:
      - "2020:2020"   # HTTP — redirects to HTTPS
      - "443:443"     # HTTPS
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
      - newton-ssl:/etc/nginx/ssl    # Persists the auto-generated certificate
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - SSL_ENABLED=true             # Auto-generates a self-signed cert (30-year, SAN)
      - NEWTON_API_ENABLED=true      # Set false to disable tournament upload/download
      - NEWTON_DEMO_MODE=false       # Set true to show a privacy banner
      # - NEWTON_LANDING_PAGE=true   # Show landing page at root URL
      # - NEWTON_BASE_URL=https://darts.example.com

volumes:
  newton-ssl:
```

Save as `docker-compose.yml` in a folder of your choice, then run `docker compose up -d`. That's it.

Access at `https://localhost`. Your browser will warn about the self-signed certificate on first visit — accept the exception once and it will not appear again.

---

### Linux — SSL + mDNS

All devices on your LAN can reach the container at `https://newtondarts.local` without any DNS configuration. Requires `network_mode: host` — Linux only (not supported on Docker Desktop for Mac/Windows).

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    # Alternative: ghcr.io/skrodahl/newton:latest
    container_name: newton
    network_mode: host             # Required for mDNS multicast to reach the LAN
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
      - newton-ssl:/etc/nginx/ssl
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - SSL_ENABLED=true
      - MDNS_HOSTNAME=newtondarts  # Reachable as newtondarts.local on the LAN
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false
      # - NEWTON_LANDING_PAGE=true
      # - NEWTON_BASE_URL=https://darts.example.com

volumes:
  newton-ssl:
```

Save as `docker-compose.yml` in a folder of your choice, then run `docker compose up -d`. That's it.

Access at `https://newtondarts.local`. Phones, tablets, and scoring stations on the same network can all reach it by name.

---

### Behind a Reverse Proxy

The container joins your proxy's Docker network. SSL termination and HTTPS are handled by the proxy — no `SSL_ENABLED` needed.

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    # Alternative: ghcr.io/skrodahl/newton:latest
    container_name: newton
    # ports:
    #   - "8080:2020"  # Remove when using a reverse proxy
    networks:
      - proxy_network
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false
      # - NEWTON_LANDING_PAGE=true
      # - NEWTON_BASE_URL=https://darts.example.com

networks:
  proxy_network:
    external: true
```

Save as `docker-compose.yml` in a folder of your choice, then run `docker compose up -d`. That's it.

In Nginx Proxy Manager, point the proxy host to `newton:2020`.

#### Camera Access Behind NPM

NPM sets its own `Permissions-Policy` header that overrides the container's, blocking camera access in the Chalker. Add this to the **Advanced** tab of your NPM proxy host:

```nginx
more_set_headers "Permissions-Policy: geolocation=(), microphone=(), camera=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()";
```

#### Demo / Public Site

```yaml
environment:
  - NEWTON_API_ENABLED=false   # Disable upload API for security
  - NEWTON_DEMO_MODE=true      # Show privacy banner
  - NEWTON_LANDING_PAGE=true   # Show landing page at root
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SSL_ENABLED` | `false` | Auto-generates a self-signed certificate; enables HTTPS on port 443 and redirects HTTP on port 2020 |
| `HTTPS_PORT` | `443` | HTTPS listening port |
| `MDNS_HOSTNAME` | `newtondarts` | mDNS hostname — container reachable as `<value>.local` on the LAN (Linux only) |
| `NEWTON_API_ENABLED` | `true` | Enables REST API endpoints for tournament upload, download, and delete |
| `NEWTON_DEMO_MODE` | `false` | Shows a privacy banner at the top of the app |
| `NEWTON_LANDING_PAGE` | `false` | Shows a landing page at the root URL instead of loading the app directly |
| `NEWTON_BASE_URL` | *(unset)* | Canonical URL for Open Graph and Twitter Card meta tags on the landing page |
| `NEWTON_GITHUB_URL` | `https://github.com/skrodahl/NewTon` | GitHub link shown in the demo banner |
| `NEWTON_HOST_PORT` | `8080` | Host port for the basic HTTP compose (quick start only) |

---

## Security

### REST API

**The REST API has no built-in authentication.** Do not expose the container directly to the public internet without additional protection. Safe options:

- ✅ **Local network only** — home or club WiFi, default setup is fine
- ✅ **Localhost only** — by default, Docker binds to `0.0.0.0`, meaning the container is reachable from any device on your network. To restrict access to the local machine only, specify the loopback address explicitly in your `ports` mapping:
  ```yaml
  ports:
    - "127.0.0.1:8080:2020"
  ```
  With this in place, `http://localhost:8080` still works, but other devices on the network cannot reach the container.
- ✅ **Behind VPN** — Tailscale, WireGuard, or similar
- ✅ **Reverse proxy with auth** — nginx or Caddy with HTTP basic authentication
- ✅ **Disable API** — set `NEWTON_API_ENABLED=false`

### Security Headers

The Docker image includes comprehensive security headers enabled by default:

- **X-Frame-Options: SAMEORIGIN** — Prevents clickjacking
- **X-Content-Type-Options: nosniff** — Prevents MIME-type sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** — Limits referrer data leakage
- **Permissions-Policy** — Restricts camera and other device access to the app origin
- **Content-Security-Policy** — Prevents loading external resources
- **Server tokens hidden** — nginx and PHP versions not disclosed

NewTon DC Tournament Manager achieves an **A grade** on [securityheaders.com](https://securityheaders.com) out of the box.

### HSTS

Strict-Transport-Security is included automatically when `SSL_ENABLED=true`. It is not set in HTTP-only mode to avoid breaking non-SSL deployments.

When terminating HTTPS at a reverse proxy, add HSTS there instead:

```nginx
# Nginx Proxy Manager — Advanced tab
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## Customization

### Logo and Payment QR Code

Place your own files in the `images/` folder. The volume is mounted read-only from the host, so changes are picked up immediately — no container restart needed.

```bash
mkdir -p images

# Custom logo — supports .png, .jpg, .jpeg, or .svg
cp /path/to/your/logo.jpg ./images/logo.jpg

# Custom payment QR code
cp /path/to/your/payment-qr.png ./images/payment.png
```

---

## Troubleshooting

### Port Already in Use

```bash
NEWTON_HOST_PORT=9000 docker compose up -d
```

### Container Won't Start

```bash
docker compose logs
```

### Can't Access http://localhost:8080

1. Verify the container is running: `docker compose ps` — should show `0.0.0.0:8080->2020/tcp`
2. Try `http://127.0.0.1:8080` instead of `localhost`
3. Check logs: `docker compose logs`

### Browser Warning on https://localhost

Expected with a self-signed certificate. Accept the exception once — it will not appear again. The cert is stored in the `newton-ssl` named volume and persists across restarts.

### https://newtondarts.local Not Reachable

- Confirm you are on a **Linux host** — mDNS via `network_mode: host` does not work on Docker Desktop for Mac or Windows
- Confirm `MDNS_HOSTNAME=newtondarts` is set
- Check logs: `docker compose logs` — should show `[newtondarts] nginx: HTTPS mode`
- Confirm mDNS resolution from another device on the LAN: `ping newtondarts.local`

---

## Need Help?

- **Application help:** Press F1 inside the tournament manager
- **REST API reference:** [rest-api.html](rest-api.html)
- **Privacy model:** [privacy.html](privacy.html)
- **Issues & feedback:** [GitHub Issues](https://github.com/skrodahl/NewTon/issues)
