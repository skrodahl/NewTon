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

---

## What Just Happened?

Docker Compose:
- ✅ Downloaded the pre-built image from GitHub Container Registry
- ✅ Created a persistent storage directory for tournaments (`tournaments/`)
- ✅ Started nginx + PHP-FPM serving your tournament manager
- ✅ Made it accessible on port 8080

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

## Customization

### Change the Port

Edit `docker-compose.yml` and change the port mapping:

```yaml
ports:
  - "8009:80"  # Change 8080 to your preferred port
```

Then restart:
```bash
docker compose down
docker compose up -d
```

### Add Your Club Logo

Place your logo file in the same directory as `docker-compose.yml`:

```bash
# Copy your logo
cp /path/to/your/logo.png ./logo.png

# Restart container
docker compose restart
```

The logo will automatically appear in the tournament manager!

### Add Payment QR Code

Similarly, for a payment QR code on the registration page:

```bash
cp /path/to/your/payment-qr.png ./payment.png
docker compose restart
```

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
      - "8080:80"
    volumes:
      # Use absolute paths for better control
      - /home/user/docker-data/newton/tournaments:/var/www/html/tournaments
      - /home/user/docker-data/newton/logo.png:/var/www/html/logo.png:ro
      - /home/user/docker-data/newton/payment.png:/var/www/html/payment.png:ro
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
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
      - "8080:80"
    volumes:
      - newton-tournaments:/var/www/html/tournaments
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo

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
- ✅ **Localhost only** - Change port binding to `127.0.0.1:8080:80` in docker-compose.yml
- ✅ **Behind VPN** - Tailscale, WireGuard, or similar
- ✅ **Reverse proxy with auth** - nginx/Caddy with HTTP basic authentication

**For detailed security guidance, see:**
- [Docs/SECURITY.md](Docs/SECURITY.md) - Complete security options and best practices

**Quick localhost-only configuration:**
```yaml
ports:
  - "127.0.0.1:8080:80"  # Only accessible from this machine
```

Then access via SSH tunnel or VPN when remote.

---

## Troubleshooting

### Port Already in Use

If port 8080 is already taken, edit `docker-compose.yml` and change `8080:80` to another port like `8009:80`.

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
   Should show: `0.0.0.0:8080->80/tcp`

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
