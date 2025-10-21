# NewTon DC Tournament Manager - Docker Deployment

Quick start guide for running NewTon Tournament Manager in Docker.

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# From the repository root
cd docker
docker-compose up -d

# Access at http://localhost:8080
```

### Using Docker CLI

```bash
# Build the image
docker build -t newton -f docker/Dockerfile .

# Run the container
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  newton
```

### Using Published Image

```bash
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  ghcr.io/skrodahl/newton:latest
```

---

## 📁 What's Included

- **Dockerfile** - nginx + PHP-FPM Alpine image (~60MB)
- **docker-compose.yml** - Easy deployment configuration
- **nginx.conf** - Web server configuration

---

## 🔧 Configuration

### Port Mapping

Default: `8080:80` (host:container)

Change in `docker-compose.yml`:
```yaml
ports:
  - "8009:80"  # Change 8080 to your preferred port
```

### Persistent Storage

Tournament data (uploaded via REST API) persists in `./tournaments` directory:

```yaml
volumes:
  - ./tournaments:/var/www/html/tournaments
```

### Custom Branding

Mount your logo and payment QR code:

```yaml
volumes:
  - ./logo.png:/var/www/html/logo.png:ro
  - ./payment.png:/var/www/html/payment.png:ro
```

---

## 🛠️ Management Commands

```bash
# View logs
docker-compose logs -f

# Stop container
docker-compose down

# Restart container
docker-compose restart

# Rebuild after changes
docker-compose build --no-cache
docker-compose up -d

# View running containers
docker-compose ps

# Access container shell
docker-compose exec newton-tournament sh
```

---

## 🧪 Testing

After starting the container:

1. **Test web interface:** http://localhost:8080
2. **Test PHP REST API:**
   ```bash
   curl http://localhost:8080/api/list-tournaments.php
   ```
3. **Check container health:**
   ```bash
   docker-compose logs
   ```

---

## 🌍 Multi-Architecture Support

The Docker image supports:
- **linux/amd64** - Intel/AMD processors
- **linux/arm64** - Apple Silicon (M1/M2/M3), Raspberry Pi

Docker automatically pulls the correct version for your platform.

---

## 📚 Complete Documentation

See [Docs/DOCKER.md](../Docs/DOCKER.md) for:
- Detailed deployment guide
- Reverse proxy setup (nginx, Caddy)
- GitHub Container Registry publishing
- Troubleshooting

---

## 🐛 Troubleshooting

**Container won't start:**
```bash
docker-compose logs
```

**Port already in use:**
Change port in `docker-compose.yml` from `8080:80` to another port like `8009:80`

**PHP files not working:**
Check nginx logs:
```bash
docker-compose exec newton-tournament cat /var/log/nginx/error.log
```

**Tournament uploads not persisting:**
Verify volume mount:
```bash
docker-compose exec newton-tournament ls -la /var/www/html/tournaments
```

---

## 📝 Notes

- Build context is repository root (not `docker/` directory)
- nginx configuration in `nginx.conf` routes `*.php` to PHP-FPM
- Persistent storage only applies to REST API uploads (browser localStorage is separate)
- Default timezone: `Europe/Oslo` (change in `docker-compose.yml`)
