# Docker Quick Start

Get NewTon DC Tournament Manager running in Docker in under 2 minutes.

**Prerequisites:** Docker and Docker Compose installed. Don't have Docker? [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS/Windows) or install via your package manager (Linux).

---

## Quick Start

### Step 1: Download Configuration

```bash
mkdir newton-tournament
cd newton-tournament

curl -O https://raw.githubusercontent.com/skrodahl/NewTon/main/docker/docker-compose.yml
```

### Step 2: Start the Container

```bash
docker compose up -d
```

### Step 3: Access the Application

Open your browser and go to `http://localhost:8080` — you should see the NewTon DC Tournament Manager.

**Port 2020 = "Double 20"** — The container runs nginx on port 2020 internally. The default host port (8080) maps to this. This non-standard internal port also helps avoid conflicts when using a reverse proxy.

---

## Configuration

This is the complete default `docker-compose.yml`. Inline comments explain each option.

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    container_name: newton
    ports:
      - "${NEWTON_HOST_PORT:-8080}:2020"  # Change host port via env var or edit directly
    volumes:
      - ./tournaments:/var/www/html/tournaments  # Persistent tournament storage
      - ./images:/var/www/html/images:ro         # Custom logo and payment QR
      # - ./logs:/var/log/nginx                  # Optional: persist nginx logs
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - NEWTON_API_ENABLED=true        # Set false to disable REST API (upload/download)
      - NEWTON_DEMO_MODE=false         # Set true to show privacy banner
      # - NEWTON_LANDING_PAGE=true     # Uncomment to show landing page at root URL
      # - NEWTON_BASE_URL=https://darts.example.com  # Canonical URL for Open Graph meta tags
      - NEWTON_GITHUB_URL=https://github.com/skrodahl/NewTon  # Link in demo banner
```

### Persistent Storage

- `./tournaments` — Stores tournament JSON files uploaded via the REST API. Persists across container restarts and updates.
- `./images` — Custom logo and payment QR code. Mounted read-only; replace files on the host and they are picked up immediately.

The paths above are relative to the directory where `docker-compose.yml` lives. You can use absolute paths if you prefer — for example `/var/lib/docker/volumes/newton/tournaments:/var/www/html/tournaments`.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEWTON_API_ENABLED` | `true` | Enables/disables REST API endpoints for tournament upload, download, and delete |
| `NEWTON_DEMO_MODE` | `false` | Shows a privacy banner at the top of the app |
| `NEWTON_LANDING_PAGE` | `false` | Shows a landing page at the root URL instead of loading the app directly |
| `NEWTON_BASE_URL` | *(unset)* | Canonical URL for Open Graph and Twitter Card meta tags on the landing page |
| `NEWTON_GITHUB_URL` | `https://github.com/skrodahl/NewTon` | GitHub link shown in the demo banner |
| `NEWTON_HOST_PORT` | `8080` | Host port the container is accessible on |

---

## Reverse Proxy Setup

The container listens on **port 2020** internally. When using a reverse proxy like Nginx Proxy Manager:

1. Add the container to the same Docker network as your reverse proxy
2. Point your proxy to `newton:2020` (not port 80)
3. Remove the `ports:` mapping — not needed behind a proxy

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    container_name: newton
    # ports:
    #   - "8080:2020"  # Remove when using reverse proxy
    networks:
      - proxy_network
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
    environment:
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false

networks:
  proxy_network:
    external: true
```

In NPM, configure the proxy host to forward to `newton:2020`.

### Nginx Proxy Manager — Camera Access (Chalker QR)

NPM sets its own `Permissions-Policy` header that overrides the container's nginx headers. This blocks camera access in the Chalker, which is required for QR scanning. Add the following to the **Advanced** tab of your NPM proxy host:

```nginx
more_set_headers "Permissions-Policy: geolocation=(), microphone=(), camera=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()";
```

`more_set_headers` replaces the header rather than adding a duplicate. OpenResty (which NPM runs on) includes the `headers-more` module, so this directive is available without any additional setup.

### Demo / Public Site

```yaml
environment:
  - NEWTON_API_ENABLED=false   # Disable upload API for security
  - NEWTON_DEMO_MODE=true      # Show privacy banner
  - NEWTON_LANDING_PAGE=true   # Show landing page at root
```

---

## SSL / HTTPS and Camera Support (v5.0.1-beta.7+)

Camera features — QR scanning in the Chalker via BarcodeDetector/getUserMedia — require a **secure context**. Browsers only grant camera access over HTTPS (or localhost). HTTP-only deployments cannot use QR scanning.

### Three Tiers

| Tier | Platform | Setup | Access |
|---|---|---|---|
| HTTP only | All | Default, no changes | `http://localhost:8080` — no camera |
| SSL with port mapping | All (Mac, Windows, Linux) | `SSL_ENABLED=true` + `ports: 443:443` | `https://localhost` — camera works |
| SSL + mDNS | **Linux only** | `network_mode: host` + `SSL_ENABLED=true` | `https://newtondarts.local` — camera works |

### Tier 2: SSL with Port Mapping (All Platforms)

Enables HTTPS and camera access on any platform including Mac and Windows.

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    container_name: newton
    ports:
      - "2020:2020"   # HTTP → redirects to HTTPS
      - "443:443"     # HTTPS
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
      - newton-ssl:/etc/nginx/ssl    # Persists the auto-generated cert
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false
      - SSL_ENABLED=true

volumes:
  newton-ssl:
```

Access at `https://localhost`. The self-signed certificate will trigger a browser security warning on first visit — accept the exception once and it won't appear again. The cert is persisted in the `newton-ssl` named volume and survives container restarts and upgrades.

### Tier 3: SSL + mDNS (Linux Only)

Adds mDNS broadcasting so devices on the same LAN can reach the container at `newtondarts.local` without any DNS configuration. Requires `network_mode: host`.

```yaml
services:
  newton-tournament:
    image: skrodahl/newton:latest
    container_name: newton
    network_mode: host   # Required for mDNS multicast to reach the LAN
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./images:/var/www/html/images:ro
      - newton-ssl:/etc/nginx/ssl
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false
      - SSL_ENABLED=true
      - MDNS_HOSTNAME=newtondarts    # Reachable as newtondarts.local

volumes:
  newton-ssl:
```

Access at `https://newtondarts.local`. All devices on the same LAN — phones, tablets, scoring stations — can reach it by name.

> **Docker Desktop limitation:** `network_mode: host` does not work on Docker Desktop for Mac or Windows. On those platforms, host networking binds to the Docker VM's network, not the host machine's. Use Tier 2 (port mapping) for Mac/Windows. Tier 3 is for Linux hosts only (Raspberry Pi, Ubuntu, Debian, etc.).

### SSL Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SSL_ENABLED` | `false` | Set to `true` to auto-generate a self-signed certificate (30-year expiry) |
| `HTTPS_PORT` | `443` | HTTPS listening port |
| `MDNS_HOSTNAME` | `newtondarts` | mDNS hostname — container is reachable as `<value>.local` |

### Nginx Proxy Manager + SSL

When using `network_mode: host`, the container binds directly to host ports. NPM should proxy to `localhost:2020` (HTTP) or `localhost:443` (HTTPS) rather than `newton:2020`. No shared Docker network is needed.

---

## Security

### REST API

**The REST API has no built-in authentication.** Do not expose the container directly to the public internet without additional protection. Safe options:

- ✅ **Local network only** — home or club WiFi, default setup is fine
- ✅ **Localhost only** — bind to `127.0.0.1:8080:2020`
- ✅ **Behind VPN** — Tailscale, WireGuard, or similar
- ✅ **Reverse proxy with auth** — nginx or Caddy with HTTP basic authentication
- ✅ **Disable API** — set `NEWTON_API_ENABLED=false`

### Security Headers

The Docker image includes comprehensive security headers enabled by default:

- **X-Frame-Options: SAMEORIGIN** — Prevents clickjacking
- **X-Content-Type-Options: nosniff** — Prevents MIME-type sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** — Limits referrer data leakage
- **Permissions-Policy** — Disables geolocation, microphone, camera, and other unused features
- **Content-Security-Policy** — Prevents loading external resources
- **Server tokens hidden** — nginx and PHP versions not disclosed

NewTon DC Tournament Manager achieves an **A grade** on [securityheaders.com](https://securityheaders.com) out of the box.

### HSTS

**Strict-Transport-Security (HSTS) is included automatically when SSL is active** (`SSL_ENABLED=true` or user-provided certs). It is not set in HTTP-only mode to avoid breaking non-SSL deployments.

When using a reverse proxy for HTTPS termination, add HSTS at the proxy level instead:

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

Default images bundled in the Docker image: `images/logo.jpg` (club logo placeholder) and `images/payment.png` (GitHub project QR code).

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

Expected behaviour with a self-signed certificate. Accept the security exception once — it won't appear again. The cert is stored in the `newton-ssl` named volume and persists across restarts.

### https://newtondarts.local Not Reachable

- Confirm you are on a **Linux host** — mDNS via `network_mode: host` does not work on Docker Desktop for Mac or Windows
- Confirm `MDNS_HOSTNAME=newtondarts` is set
- Check logs: `docker compose logs` — should show `[newtondarts] nginx: HTTPS mode`
- Confirm the host has mDNS resolution: `ping newtondarts.local` from another device on the LAN

---

## Need Help?

- **Application help:** Press F1 inside the tournament manager
- **REST API reference:** [rest-api.html](rest-api.html)
- **Privacy model:** [privacy.html](privacy.html)
- **Issues & feedback:** [GitHub Issues](https://github.com/skrodahl/NewTon/issues)
