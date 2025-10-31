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
  -p 8080:2020 \
  -v ./tournaments:/var/www/html/tournaments \
  -v ./images:/var/www/html/images:ro \
  -v ./logs:/var/log/nginx \
  newton
```

### Using Published Image

```bash
docker run -d \
  --name newton-tournament \
  -p 8080:2020 \
  -v ./tournaments:/var/www/html/tournaments \
  -v ./images:/var/www/html/images:ro \
  -v ./logs:/var/log/nginx \
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

Default: `8080:2020` (host:container)

The container runs nginx on **port 2020** internally ("Double 20" 🎯).

Change in `docker-compose.yml`:
```yaml
ports:
  - "9000:2020"  # Change 8080 to your preferred port
```

### Persistent Storage

**Tournament data** (uploaded via REST API) persists in `./tournaments` directory:

```yaml
volumes:
  - ./tournaments:/var/www/html/tournaments
```

**Nginx logs** (optional) can be persisted by adding a logs volume:

```yaml
volumes:
  - ./tournaments:/var/www/html/tournaments
  - ./logs:/var/log/nginx  # Access and error logs
```

The `logs/` directory will contain:
- `access.log` - All HTTP requests
- `error.log` - Nginx errors and warnings

### Custom Branding

The application includes default logo and payment QR code in the `images/` folder.

To customize, mount your own images folder:

```yaml
volumes:
  - ./tournaments:/var/www/html/tournaments
  - ./images:/var/www/html/images:ro  # Your custom logo.jpg and payment.png
```

**Default images included:**
- `images/logo.jpg` - Default club logo
- `images/payment.png` - GitHub project QR code

Place your custom images in the `images/` folder to replace the defaults.

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

## 🛡️ Security Headers

Version 4.0.0 includes comprehensive security headers in the Docker image for defense-in-depth protection.

### Headers Included by Default

The nginx configuration includes these security headers automatically:

**X-Frame-Options: SAMEORIGIN**
- Prevents clickjacking attacks where malicious sites embed NewTon in hidden iframes
- Allows embedding within same origin (good for legitimate use cases)
- Industry standard protection

**X-Content-Type-Options: nosniff**
- Prevents MIME-type sniffing attacks
- Browser respects Content-Type header exactly
- Stops browsers from interpreting files as different types

**Referrer-Policy: strict-origin-when-cross-origin**
- Controls how much referrer information is sent
- Protects privacy by limiting data leakage
- Balances functionality with privacy

**Permissions-Policy**
- Disables unused browser features that NewTon doesn't need
- Prevents malicious code from accessing: geolocation, microphone, camera, payment APIs, USB, magnetometer, gyroscope, accelerometer
- Reduces attack surface by explicitly denying permissions

**Content-Security-Policy (CSP)**
- Prevents loading scripts/styles/resources from external domains
- Primary defense against cross-site scripting (XSS) attacks via external resources
- Prevents data exfiltration to external servers

**Server Tokens Hidden**
- `server_tokens off` hides nginx version from HTTP headers
- `expose_php = Off` removes X-Powered-By header that reveals PHP version
- Prevents attackers from targeting known vulnerabilities in specific versions

### Content Security Policy Details

NewTon's CSP is configured as:
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
frame-ancestors 'self';
```

**Why 'unsafe-inline' is Required:**

NewTon's architecture uses inline JavaScript and CSS throughout `tournament.html`:
- **68+ inline event handlers** (`onclick`, `onchange`, `onfocus`, etc.)
- **217+ inline style attributes** (`style="..."`)

These are architectural requirements for:
- Single-file deployment model (open `tournament.html` directly)
- Offline operation without bundling/build process
- Simplicity and maintainability

**What CSP Still Protects Against (even with 'unsafe-inline'):**
- ✅ Loading scripts from external domains (primary XSS vector)
- ✅ Loading styles from external domains
- ✅ Unauthorized API calls to external servers
- ✅ Data exfiltration attempts
- ✅ Embedding in malicious iframes

**What 'unsafe-inline' Weakens:**
- ❌ Cannot prevent XSS via injected inline scripts (if vulnerability existed)

**Why This is Acceptable:**
- NewTon has **no user-generated content** (no comments, no posts, no profiles)
- NewTon has **no XSS attack vectors** (all data is locally stored, no URL parameters parsed)
- The alternative would require massive refactoring and break the single-file deployment model

**Security Rating:** NewTon with these headers achieves **A grade** on [securityheaders.com](https://securityheaders.com), with an informational warning about 'unsafe-inline' (expected and acceptable).

### HSTS Not Included (Intentional)

Strict-Transport-Security (HSTS) is **not** included in the Docker image by default.

**Why:**
- HSTS forces HTTPS for extended period (typically 1 year)
- Setting it incorrectly can break access if HTTPS certificate expires or is misconfigured
- Should be user's choice based on their deployment

**How to Add HSTS:**

If you have HTTPS configured at your reverse proxy (Nginx Proxy Manager, Caddy, Traefik), add HSTS there:

**Nginx Proxy Manager:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Caddy:**
```
header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

**Why This Approach is Better:**
- Reverse proxy handles SSL/TLS termination (knows if HTTPS is actually working)
- Avoids breaking deployments that use HTTP-only locally
- Gives self-hosters full control over HTTPS enforcement

### Testing Security Headers

**Verify your deployment:**
1. Deploy NewTon v4.0.0 Docker image
2. Visit https://securityheaders.com
3. Enter your NewTon URL
4. Should see **A grade** with security headers present
5. Expected warning: "This policy contains 'unsafe-inline'" (informational only)

**Expected Results:**
- **Grade:** A
- **Headers Present:** 6 (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy, plus hidden server tokens)
- **Warning:** CSP 'unsafe-inline' (expected, explained above)

### Impact

**For Self-Hosters:**
- Security headers enabled by default (no configuration needed)
- Defense-in-depth protection out of the box
- A-grade security rating from deployment day one
- No breaking changes (headers are additive only)

**For Demo Site:**
- Immediate security improvements
- Protects visitors from clickjacking and resource injection
- Maintains existing functionality (headers don't change behavior)

**For Privacy:**
- Security headers complement NewTon's privacy-by-architecture model
- Referrer-Policy reduces data leakage
- CSP prevents unauthorized network requests
- See [Docs/PRIVACY.md](../Docs/PRIVACY.md) for complete privacy documentation

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
