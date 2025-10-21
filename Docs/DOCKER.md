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
- Image lives at `ghcr.io/USERNAME/newton-tournament-manager`
- Integrates perfectly with GitHub Actions for automated builds
- Version tags automatically match Git releases

**Setup:**
1. Add `Dockerfile` to repository root
2. Create `.github/workflows/docker-build.yml` for automated builds on releases
3. Git tag triggers automatic image building and publishing to GHCR

**Usage:**
```bash
docker pull ghcr.io/USERNAME/newton-tournament-manager:latest
docker pull ghcr.io/USERNAME/newton-tournament-manager:v3.0.2
```

### Option 2: Docker Hub

Traditional approach - link your GitHub repository to Docker Hub for automatic builds.

**Advantages:**
- Most discoverable (selfhosters check Docker Hub first)
- Auto-builds on push
- Image at `dockerhub.io/USERNAME/newton-tournament-manager`

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
├── Dockerfile                    # NEW - Container build instructions
├── docker-compose.yml            # NEW - Easy deployment example (optional)
├── .dockerignore                 # NEW - Exclude unnecessary files from image
├── .github/
│   └── workflows/
│       └── docker-build.yml      # NEW - Auto-build on release tags
├── Docs/
│   └── DOCKER.md                 # This file
└── README.md                     # Update with Docker deployment instructions
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

Use **PHP with Apache** (Option A) - provides full feature set including tournament sharing, well-known to selfhosters, and image size is negligible for the value provided.

---

## Dockerfile Template

**Basic PHP + Apache Dockerfile:**

```dockerfile
FROM php:8.2-apache

# Copy application files
COPY . /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

# Enable Apache mod_rewrite (if needed for REST API)
RUN a2enmod rewrite

# Expose port 80
EXPOSE 80

# Apache runs automatically via base image CMD
```

**With custom logo support:**

```dockerfile
FROM php:8.2-apache

# Copy application files
COPY . /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html

# Enable Apache modules
RUN a2enmod rewrite

EXPOSE 80

# Volume for custom logo (optional)
VOLUME ["/var/www/html/logo.png"]
```

---

## Docker Compose Example

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  newton-tournament:
    image: ghcr.io/USERNAME/newton-tournament-manager:latest
    container_name: newton-darts
    ports:
      - "8080:80"
    volumes:
      # Optional: Mount custom logo
      - ./logo.png:/var/www/html/logo.png
      # Optional: Mount payment QR code
      - ./payment.png:/var/www/html/payment.png
    restart: unless-stopped
    environment:
      - TZ=Europe/Oslo  # Set timezone for PHP
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
- Image available at `ghcr.io/USERNAME/newton-tournament-manager:v3.0.2`
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
curl -O https://raw.githubusercontent.com/USERNAME/newton-tournament-manager/main/docker-compose.yml

# Start container
docker-compose up -d

# Access at http://localhost:8080
```

**Using Docker CLI:**
```bash
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  --restart unless-stopped \
  ghcr.io/USERNAME/newton-tournament-manager:latest
```

### Custom Logo/Branding

Mount custom logo as volume:
```bash
docker run -d \
  --name newton-tournament \
  -p 8080:80 \
  -v ./logo.png:/var/www/html/logo.png \
  -v ./payment.png:/var/www/html/payment.png \
  --restart unless-stopped \
  ghcr.io/USERNAME/newton-tournament-manager:latest
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
✅ **Lightweight** - ~150MB Docker image with full PHP support
✅ **Battle-tested** - Used in production at NewTon Darts Club with tens of players

---

## Versioning Strategy

**Git tags → Docker tags:**
- `v3.0.2` → `ghcr.io/USERNAME/newton-tournament-manager:3.0.2`
- `v3.0.2` → `ghcr.io/USERNAME/newton-tournament-manager:3.0`
- `main` branch → `ghcr.io/USERNAME/newton-tournament-manager:latest`

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
