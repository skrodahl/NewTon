# Docker Quick Start Guide

Get NewTon Tournament Manager running in Docker in under 2 minutes.

---

## Prerequisites

- Docker and Docker Compose installed
- 5 minutes of your time

**Don't have Docker?**
- **macOS/Windows:** [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux:** Install docker and docker-compose via your package manager

---

## Quick Start

### Step 1: Download Configuration

```bash
# Create a directory for your tournament manager
mkdir newton-tournament
cd newton-tournament

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/skrodahl/NewTon/main/docker/docker-compose.yml
```

### Step 2: Start the Container

```bash
docker compose up -d
```

That's it! The container is now running.

### Step 3: Access the Application

Open your browser and go to:

```
http://localhost:8080
```

You should see the NewTon Tournament Manager interface!

> **Port 2020 = "Double 20" 🎯**
> The container runs nginx on **port 2020** internally (a darts reference - the highest scoring segment!). The default host port (8080) maps to this internal port. This non-standard port also helps avoid conflicts when using reverse proxies like Nginx Proxy Manager.

---

## What Just Happened?

Docker Compose:
- ✅ Downloaded the pre-built image from GitHub Container Registry
- ✅ Created persistent storage directories (`tournaments/` and `images/`)
- ✅ Started nginx + PHP-FPM serving your tournament manager
- ✅ Made it accessible on port 8080
- ✅ Included default logo and payment QR code

---

## Common Commands

### View Logs
```bash
docker compose logs -f
```

### Stop the Container
```bash
docker compose down
```

### Restart the Container
```bash
docker compose restart
```

### Update to Latest Version
```bash
docker compose pull
docker compose up -d
```

---

## Configuration

### Environment Variables

The application supports several configuration options via environment variables in `docker-compose.yml`:

#### `NEWTON_API_ENABLED` (default: `true`)
Enable or disable the REST API endpoints for tournament upload/download/delete.

**Use case:** Demo sites or security-conscious deployments can disable the API entirely.

```yaml
environment:
  - NEWTON_API_ENABLED=false  # Disables API, returns HTTP 403
```

#### `NEWTON_DEMO_MODE` (default: `false`)
Show a demo banner at the top of the page explaining that data is stored locally.

**Use case:** Public demo sites that want to clarify privacy (like https://darts.skrodahl.net).

```yaml
environment:
  - NEWTON_DEMO_MODE=true  # Shows privacy banner
```

#### `NEWTON_GITHUB_URL` (default: `https://github.com/skrodahl/NewTon`)
Customize the GitHub link shown in the demo banner.

**Use case:** Forks or customized versions that want to link to their own repository.

```yaml
environment:
  - NEWTON_GITHUB_URL=https://github.com/yourname/yourfork
```

#### `NEWTON_HOST_PORT` (default: `8080`)
Change the host port that the container is accessible on.

**Use case:** Avoid port conflicts with other services on your host machine.

```bash
# Set via environment variable
NEWTON_HOST_PORT=9000 docker compose up -d

# Or edit docker-compose.yml
ports:
  - "${NEWTON_HOST_PORT:-9000}:2020"
```

### Reverse Proxy Setup (Nginx Proxy Manager, Caddy, etc.)

The container listens on **port 2020** internally ("Double 20" 🎯). When using a reverse proxy like Nginx Proxy Manager:

1. Add the container to the same Docker network as your reverse proxy
2. Point your reverse proxy to `newton:2020` (not 80!)
3. Optionally remove the `ports:` mapping (not needed when using reverse proxy)

**Example for NPM users:**

```yaml
services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:latest
    container_name: newton
    # Remove ports mapping when using reverse proxy
    # ports:
    #   - "8080:2020"
    networks:
      - proxy_network  # Same network as NPM
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

Then in NPM, configure proxy host to forward to `newton:2020`.

### Demo Site Setup

To replicate a demo site like https://darts.skrodahl.net:

```yaml
environment:
  - NEWTON_API_ENABLED=false  # Disable API for security
  - NEWTON_DEMO_MODE=true     # Show privacy banner
```

### Change the Host Port

The default host port is 8080. To change it:

**Option 1: Environment variable**
```bash
NEWTON_HOST_PORT=9000 docker compose up -d
```

**Option 2: Edit docker-compose.yml**
```yaml
ports:
  - "9000:2020"  # Change 8080 to your preferred port
```

Then restart:
```bash
docker compose down
docker compose up -d
```

### Customize Logo and Payment QR Code

The application includes default images, but you can customize them by placing your own files in the `images/` folder:

```bash
# Create images folder if it doesn't exist
mkdir -p images

# Copy your custom logo (supports .png, .jpg, .jpeg, or .svg)
cp /path/to/your/logo.jpg ./images/logo.jpg

# Copy your custom payment QR code
cp /path/to/your/payment-qr.png ./images/payment.png

# Restart container to apply changes
docker compose restart
```

**Default images included:**
- `images/logo.jpg` - Default club logo
- `images/payment.png` - GitHub project QR code

Simply replace these files with your own to customize!

---

## Persistent Data

Tournament data uploaded via the REST API is stored in:

```
./tournaments/
```

This directory persists even when you stop/restart/update the container.

**To backup your tournaments:**
```bash
# All your tournament files are here
ls tournaments/

# Backup
cp -r tournaments/ tournaments-backup/
```

---

## Advanced: Homelab & Absolute Paths

If you're managing a homelab or prefer absolute paths for better control:

### Using Absolute Paths

Edit your `docker-compose.yml` to use absolute paths instead of relative paths:

```yaml
services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:latest
    container_name: newton
    ports:
      - "8080:2020"  # Internal port 2020 ("Double 20" 🎯)
    volumes:
      # Use absolute paths for better control
      - /home/user/docker-data/newton/tournaments:/var/www/html/tournaments
      - /home/user/docker-data/newton/images:/var/www/html/images:ro
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false
```

**Benefits:**
- Clear visibility of where data is stored
- Easier to manage with existing backup systems
- Works better with NFS/shared storage
- No confusion about working directories

### Named Volumes (Alternative)

For more portable deployments, use Docker named volumes:

```yaml
services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:latest
    container_name: newton
    ports:
      - "8080:2020"  # Internal port 2020 ("Double 20" 🎯)
    volumes:
      - newton-tournaments:/var/www/html/tournaments
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false

volumes:
  newton-tournaments:
    driver: local
```

**To find where Docker stores the volume:**
```bash
docker volume inspect newton-tournaments
```

**To backup a named volume:**
```bash
docker run --rm -v newton-tournaments:/data -v $(pwd):/backup alpine tar czf /backup/tournaments-backup.tar.gz -C /data .
```

**To restore a named volume:**
```bash
docker run --rm -v newton-tournaments:/data -v $(pwd):/backup alpine tar xzf /backup/tournaments-backup.tar.gz -C /data
```

---

## ⚠️ Security Notice

**Important:** The REST API has no built-in authentication. Do not expose the Docker container directly to the public internet without additional security measures.

**Safe deployment options:**
- ✅ **Local network only** (home/club WiFi) - Default setup is fine
- ✅ **Localhost only** - Change port binding to `127.0.0.1:8080:2020` in docker-compose.yml
- ✅ **Behind VPN** - Tailscale, WireGuard, or similar
- ✅ **Reverse proxy with auth** - nginx/Caddy with HTTP basic authentication
- ✅ **Disable API** - Set `NEWTON_API_ENABLED=false` to disable all REST API endpoints

**Quick localhost-only configuration:**
```yaml
ports:
  - "127.0.0.1:8080:2020"  # Only accessible from this machine
```

**Disable API entirely (demo mode):**
```yaml
environment:
  - NEWTON_API_ENABLED=false  # Returns HTTP 403 for all API calls
  - NEWTON_DEMO_MODE=true     # Optional: Show privacy banner
```

Then access via SSH tunnel or VPN when remote.

---

## Troubleshooting

### Port Already in Use

If port 8080 is already taken, change the host port:

```bash
# Use environment variable
NEWTON_HOST_PORT=9000 docker compose up -d

# Or edit docker-compose.yml
ports:
  - "9000:2020"  # Change 8080 to another port
```

### Container Won't Start

Check the logs:
```bash
docker compose logs
```

### Can't Access http://localhost:8080

1. Verify container is running:
   ```bash
   docker compose ps
   ```

2. Check if port is mapped correctly:
   ```bash
   docker compose ps
   ```
   Should show: `0.0.0.0:8080->2020/tcp`

3. Try http://127.0.0.1:8080 instead

---

## Next Steps

- **Configure your tournament** - Set up point systems, match formats, etc.
- **Add your logo** - Customize branding
- **Read full documentation** - See [Docs/DOCKER.md](Docs/DOCKER.md) for advanced setup
- **Set up reverse proxy** - For production deployments with SSL

---

## Need Help?

- **Full Docker documentation:** [Docs/DOCKER.md](Docs/DOCKER.md)
- **Application help:** Press F1 in the tournament manager
- **Issues:** [GitHub Issues](https://github.com/skrodahl/NewTon/issues)

---

**You're all set!** Start creating tournaments at http://localhost:8080 🎯
