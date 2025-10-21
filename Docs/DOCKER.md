# Docker Deployment Guide

## Overview

NewTon DC Tournament Manager can be packaged as a Docker container for easy self-hosting. This guide covers Docker packaging options, deployment strategies, and hosting the image via GitHub Container Registry.

---

## Docker Hosting Options

### Option 1: GitHub Container Registry (GHCR) - Recommended

Host the Docker image directly in your existing GitHub repository using GitHub's built-in container registry.

**Advantages:**
- Same repository, no second repo needed
- Free for public images
- Image lives at `ghcr.io/skrodahl/newton`
- Integrates perfectly with GitHub Actions for automated builds
- Version tags automatically match Git releases

**Setup:**
1. Add `Dockerfile` to repository root
2. Create `.github/workflows/docker-build.yml` for automated builds on releases
3. Git tag triggers automatic image building and publishing to GHCR

**Usage:**
```bash
docker pull ghcr.io/skrodahl/newton:latest
docker pull ghcr.io/skrodahl/newton:v3.0.2
```

### Option 2: Docker Hub

Traditional approach - link your GitHub repository to Docker Hub for automatic builds.

**Advantages:**
- Most discoverable (selfhosters check Docker Hub first)
- Auto-builds on push
- Image at `dockerhub.io/skrodahl/newton`

**Disadvantages:**
- Separate service to manage
- Free tier limitations (1 private repo, rate limiting on pulls)

### Option 3: Both GHCR + Docker Hub

Many projects publish to both registries - build once, push to both.

**Advantages:**
- Maximum discoverability (Docker Hub)
- GitHub integration (GHCR)
- Redundancy

**Implementation:**
GitHub Action workflow can push to multiple registries simultaneously.

---

## Repository Structure

No second repository needed - Docker files live in the existing project:

```
/NewTon/
├── tournament.html
├── js/
├── css/
├── docker/                       # NEW - Docker configuration directory
│   ├── Dockerfile                # Container build instructions
│   ├── docker-compose.yml        # Easy deployment example
│   ├── nginx.conf                # nginx configuration for container
│   └── README.md                 # Quick start guide
├── .dockerignore                 # Exclude unnecessary files from image
├── .github/
│   └── workflows/
│       └── docker-build.yml      # Auto-build on release tags
├── Docs/
│   └── DOCKER.md                 # This file
└── README.md                     # Updated with Docker deployment instructions
```

---

## Docker Image Requirements

### Base Image Options

Since NewTon Tournament Manager includes optional PHP REST API for tournament sharing, the Docker image needs PHP support.

#### Option A: PHP with Apache (Recommended)
```dockerfile
FROM php:8.2-apache
```

**Advantages:**
- Complete feature set (static files + REST API)
- Battle-tested, reliable
- ~150MB image size
- Supports tournament sharing features out of the box

#### Option B: PHP with nginx + PHP-FPM
```dockerfile
FROM php:8.2-fpm
# + nginx configuration
```

**Advantages:**
- Slightly better performance under high load
- More configuration complexity

#### Option C: Static-only (nginx)
```dockerfile
FROM nginx:alpine
```

**Advantages:**
- Tiny image (~25MB)
- Ultra-fast for static content

**Disadvantages:**
- **No tournament sharing features** (REST API requires PHP)
- Limited functionality

### Recommendation

Use **nginx + PHP-FPM Alpine** (Option B) - provides full feature set including tournament sharing, small image size (~60MB), and excellent performance. This is the implementation used in the official Docker image.

---

## Dockerfile (Actual Implementation)

**nginx + PHP-FPM with Persistent Tournament Storage:**

```dockerfile
FROM php:8.2-fpm-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy application files
COPY . /var/www/html/

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Create tournaments directory for persistent storage
RUN mkdir -p /var/www/html/tournaments

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Create directory for nginx pid
RUN mkdir -p /run/nginx

# Volume for persistent tournament storage
VOLUME ["/var/www/html/tournaments"]

# Expose port 80
EXPOSE 80

# Start both PHP-FPM and nginx
CMD php-fpm -D && nginx -g 'daemon off;'
```

**nginx Configuration (docker/nginx.conf):**

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    index tournament.html index.html index.htm;

    # Allow large tournament file uploads (up to 10MB)
    client_max_body_size 10M;

    # Default location - serve static files
    location / {
        try_files $uri $uri/ =404;
    }

    # PHP handler for ALL .php files (REST API in api/ directory)
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

**PHP Configuration (docker/php.ini):**

```ini
; Custom PHP configuration for NewTon Tournament Manager Docker container
; Increases upload limits to support large tournament files (up to 10MB)

; File upload limits
upload_max_filesize = 10M
post_max_size = 10M

; Memory limit
memory_limit = 128M

; UTF-8 encoding for international characters (Swedish/Norwegian å, ä, ö, etc.)
default_charset = "UTF-8"
```

**Note:** The 10MB upload limit supports large tournament files with extensive match history, player statistics, and international characters. Most tournaments are much smaller (<1MB), but complex 32-player tournaments with full transaction history can reach 2-3MB.

---

## Docker Compose Example

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:latest
    container_name: newton
    ports:
      - "8080:80"
    volumes:
      # Persistent tournament storage (PHP REST API uploads)
      - ./tournaments:/var/www/html/tournaments
      # Optional: Mount custom logo
      - ./logo.png:/var/www/html/logo.png:ro
      # Optional: Mount payment QR code
      - ./payment.png:/var/www/html/payment.png:ro
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
```

**For local development (build from source):**

```yaml
version: '3.8'

services:
  newton-tournament:
    build: .
    container_name: newton
    ports:
      - "8080:80"
    volumes:
      - ./tournaments:/var/www/html/tournaments
      - ./logo.png:/var/www/html/logo.png:ro
      - ./payment.png:/var/www/html/payment.png:ro
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo
```

**Usage:**
```bash
# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Update to latest version
docker-compose pull
docker-compose up -d
```

**Access:** http://localhost:8080

---

## GitHub Actions Workflow

**Automated Docker builds on release tags:**

`.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags (v3.0.2, etc.)
  workflow_dispatch:  # Allow manual trigger

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

**Workflow triggers:**
- Push a Git tag: `git tag v3.0.2 && git push origin v3.0.2`
- GitHub Action automatically builds and publishes to GHCR
- Image available at `ghcr.io/USERNAME/newton:v3.0.2`
- Also tagged as `latest` if from default branch

---

## .dockerignore

Exclude unnecessary files from Docker image:

```
.git
.github
*.md
!README.md
.gitignore
.DS_Store
node_modules
Docs/*.md
```

---

## Deployment for Selfhosters

### Quick Start

**Using Docker Compose (Recommended):**
```bash
# Create directory
mkdir newton-tournament && cd newton-tournament

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/skrodahl/NewTon/main/docker/docker-compose.yml

# Start container
docker-compose up -d

# Access at http://localhost:8080
```

**Using Docker CLI:**
```bash
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  --restart unless-stopped \
  ghcr.io/skrodahl/newton:latest
```

### Custom Logo/Branding

Mount custom logo as volume:
```bash
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  -v ./logo.png:/var/www/html/logo.png:ro \
  -v ./payment.png:/var/www/html/payment.png:ro \
  --restart unless-stopped \
  ghcr.io/skrodahl/newton:latest
```

### Reverse Proxy Setup

**Example nginx reverse proxy config:**
```nginx
server {
    listen 80;
    server_name tournament.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Example Caddy reverse proxy config:**
```
tournament.example.com {
    reverse_proxy localhost:8080
}
```

---

## Why Selfhosters Will Love This

**Perfect fit for r/selfhosted community:**

✅ **Self-contained** - No external dependencies, no cloud services
✅ **Offline-first** - Tournament data stored in browser localStorage
✅ **No telemetry** - Zero phone-home, complete privacy
✅ **Open source** - Full transparency, community-driven
✅ **Zero database** - No PostgreSQL, MySQL, MongoDB setup required
✅ **Static files** - Runs entirely in browser after initial load
✅ **Professional-grade** - Solves real problems for darts clubs worldwide
✅ **Lightweight** - ~60MB Alpine-based Docker image with nginx + PHP-FPM
✅ **Battle-tested** - Used in production at NewTon Darts Club with tens of players

---

## Versioning Strategy

**Git tags → Docker tags:**
- `v3.0.2` → `ghcr.io/skrodahl/newton:3.0.2`
- `v3.0.2` → `ghcr.io/skrodahl/newton:3.0`
- `main` branch → `ghcr.io/skrodahl/newton:latest`

**Selfhosters can choose:**
- `latest` - Always get newest features (auto-updates)
- `3.0` - Stay on 3.0.x series (minor updates only)
- `3.0.2` - Pin to exact version (maximum stability)

---

## Publishing Workflow

**Step-by-step release process:**

1. **Update version in code:**
   ```javascript
   // js/main.js
   const APP_VERSION = '3.0.2';
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Release v3.0.2"
   git push
   ```

4. **Create and push tag:**
   ```bash
   git tag v3.0.2
   git push origin v3.0.2
   ```

5. **GitHub Action automatically:**
   - Builds Docker image
   - Publishes to GHCR
   - Tags with version number and `latest`

6. **Announce on r/selfhosted** with Docker deployment instructions

---

## Future Enhancements

**Potential additions:**
- Multi-architecture builds (ARM64 for Raspberry Pi)
- Health check endpoint for container orchestration
- Environment variables for configuration
- Optional persistent storage volume for tournament exports
- Docker Swarm / Kubernetes manifests

---

## Support

**For Docker-specific issues:**
- Check container logs: `docker logs newton-tournament`
- Verify port mapping: `docker ps`
- Test from inside container: `docker exec -it newton-tournament bash`

**For application issues:**
- See main README.md
- Check Docs/ANALYTICS.md for Developer Console troubleshooting
- Open GitHub issue

---

## License

Same as main project - open source and free for community use.
