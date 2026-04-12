# REST API Documentation

**NewTon DC Tournament Manager - Server API**

Version: 3.0.0
Base URL: `/api`

## Overview

The NewTon DC Tournament Manager includes an optional REST API for shared tournament hosting. This API enables tournament sharing, browsing, and management across multiple users when deployed to a PHP-enabled web server.

**Key Principles:**
- **Optional Feature**: API is not required for core functionality
- **Graceful Degradation**: Application works fully offline without API
- **Progressive Enhancement**: Features activate automatically when server is detected
- **Security First**: Input validation, directory traversal prevention, filename sanitization

## Architecture

### Server Requirements
- PHP 7.0 or higher (PHP 8.2+ recommended)
- PHP-FPM or FastCGI
- Write permissions to `/tournaments` directory
- Web server (nginx, Apache, etc.) configured to execute PHP

### Docker Deployment (Recommended)

The easiest way to deploy with API support is using the official Docker image:

```bash
docker run -d \
  --name newton-tournament \
  -p 8080:2020 \
  -v ./tournaments:/var/www/html/tournaments \
  ghcr.io/skrodahl/newton:latest
```

**What's included in the Docker image:**
- Alpine Linux with nginx + PHP 8.2-FPM
- All API endpoints pre-configured and working out of the box
- Persistent tournament storage via volume mount
- Internal port 2020 ("Double 20" 🎯)
- No additional configuration needed

**Environment Variables:**
- `NEWTON_API_ENABLED=true` (default) - Enable/disable API endpoints
- `NEWTON_DEMO_MODE=false` (default) - Show demo banner for public sites
- Set `NEWTON_API_ENABLED=false` to disable all API endpoints (returns HTTP 403)

**Docker Compose example:**
```yaml
services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:latest
    container_name: newton
    ports:
      - "8080:2020"
    volumes:
      - ./tournaments:/var/www/html/tournaments
    environment:
      - NEWTON_API_ENABLED=true
      - NEWTON_DEMO_MODE=false
```

See [DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md) for complete Docker setup guide.

### Directory Structure
```
/var/www/html/
├── api/
│   ├── list-tournaments.php
│   ├── upload-tournament.php
│   ├── delete-tournament.php
│   ├── relay.php
│   └── README.md
├── tournaments/
│   └── [tournament JSON files]
└── [application files]
```

### Data Storage
- Tournaments stored as JSON files in `/tournaments` directory
- Filename format: `{TournamentName}_{YYYY-MM-DD}.json`
- Files created with 0644 permissions
- Directory requires 0755 permissions

## Endpoints

### 1. List Tournaments

**Endpoint:** `GET /api/list-tournaments.php`

**Description:** Returns list of all tournaments in the `/tournaments` directory.

**Request:**
```http
GET /api/list-tournaments.php HTTP/1.1
```

**Success Response (200 OK):**
```json
{
  "tournaments": [
    {
      "filename": "Summer_League_2025-08-15.json",
      "name": "Summer League",
      "date": "2025-08-15",
      "players": 16,
      "status": "completed"
    },
    {
      "filename": "Måndagscup_2025-09-03.json",
      "name": "Måndagscup",
      "date": "2025-09-03",
      "players": 12,
      "status": "completed"
    }
  ],
  "count": 2
}
```

**Error Responses:**

*404 Not Found* - Tournaments directory doesn't exist:
```json
{
  "error": "Tournaments directory not found"
}
```

*500 Internal Server Error* - Failed to read directory:
```json
{
  "error": "Failed to read tournaments directory"
}
```

**Notes:**
- Returns empty array if no tournaments exist
- Skips files that can't be read or have invalid JSON
- Unicode characters in filenames fully supported

---

### 2. Upload Tournament

**Endpoint:** `POST /api/upload-tournament.php`

**Description:** Uploads a tournament JSON file to the server.

**Request:**
```http
POST /api/upload-tournament.php HTTP/1.1
Content-Type: application/json

{
  "filename": "MyTournament_2025-10-02.json",
  "data": {
    "name": "My Tournament",
    "date": "2025-10-02",
    "players": [...],
    "matches": [...],
    "status": "completed"
  }
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | Yes | Tournament filename (must end with `.json`) |
| `data` | object | Yes | Complete tournament data object |

**Success Response (200 OK):**
```json
{
  "success": true,
  "filename": "MyTournament_2025-10-02.json",
  "path": "/tournaments/MyTournament_2025-10-02.json",
  "message": "Tournament uploaded successfully"
}
```

**Error Responses:**

*400 Bad Request* - Invalid JSON:
```json
{
  "error": "Invalid JSON payload"
}
```

*400 Bad Request* - Missing required fields:
```json
{
  "error": "Missing filename or data"
}
```

*400 Bad Request* - Invalid filename:
```json
{
  "error": "Filename must end with .json"
}
```

*400 Bad Request* - Dangerous characters:
```json
{
  "error": "Invalid filename - contains dangerous characters"
}
```

*500 Internal Server Error* - Directory not writable:
```json
{
  "error": "Tournaments directory is not writable"
}
```

*500 Internal Server Error* - Failed to save:
```json
{
  "error": "Failed to save tournament file"
}
```

**Security:**
- Filename sanitized with `basename()` to prevent directory traversal
- Rejects filenames containing: `..`, `/`, `\`, null bytes
- Creates directory automatically if it doesn't exist
- Validates JSON encoding before saving
- Supports Unicode characters (å, ä, ö, æ, ø, etc.)

---

### 3. Delete Tournament

**Endpoint:** `POST /api/delete-tournament.php`

**Description:** Deletes a tournament file from the server.

**Request:**
```http
POST /api/delete-tournament.php HTTP/1.1
Content-Type: application/json

{
  "filename": "MyTournament_2025-10-02.json"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | Yes | Tournament filename to delete |

**Success Response (200 OK):**
```json
{
  "success": true,
  "filename": "MyTournament_2025-10-02.json",
  "message": "Tournament deleted successfully"
}
```

**Error Responses:**

*400 Bad Request* - Invalid JSON:
```json
{
  "error": "Invalid JSON payload"
}
```

*400 Bad Request* - Missing filename:
```json
{
  "error": "Missing filename"
}
```

*400 Bad Request* - Invalid filename:
```json
{
  "error": "Filename must end with .json"
}
```

*400 Bad Request* - Dangerous characters:
```json
{
  "error": "Invalid filename - contains dangerous characters"
}
```

*404 Not Found* - File doesn't exist:
```json
{
  "error": "Tournament file not found"
}
```

*500 Internal Server Error* - Delete failed:
```json
{
  "error": "Failed to delete tournament file"
}
```

**Security:**
- Same filename validation as upload
- Confirmation required on client-side before request
- Directory traversal prevention
- File existence check before deletion

---

### 4. Relay (Remote Upload)

**Endpoint:** `POST /api/relay.php`

**Description:** Forwards a tournament upload to a remote NewTon instance. Used when the browser can't make cross-origin requests with basic auth (CORS preflight blocks authenticated OPTIONS requests). PHP handles the remote request server-side — no CORS, no preflight, auth works naturally.

**Request:**
```http
POST /api/relay.php HTTP/1.1
Content-Type: application/json

{
  "url": "https://newton.example.com/api/upload-tournament.php?overwrite=true",
  "username": "NewTon",
  "password": "tournament",
  "payload": {
    "filename": "MyTournament_2025-10-02.json",
    "data": { ... tournament object ... }
  }
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Full URL of the remote upload endpoint |
| `username` | string | No | Basic auth username for the remote server |
| `password` | string | No | Basic auth password for the remote server |
| `payload` | object | Yes | The tournament payload (filename + data) |

**Success Response:** The remote server's response is passed through directly — same status code, same JSON body.

**Error Responses:**

*400 Bad Request* - Invalid request:
```json
{
  "error": "Missing url or payload"
}
```

*400 Bad Request* - Invalid URL:
```json
{
  "error": "Invalid remote URL"
}
```

*502 Bad Gateway* - Remote server unreachable:
```json
{
  "error": "Could not reach remote server",
  "detail": "Connection refused"
}
```

**Security:**
- URL validated with `filter_var()` — only http/https allowed
- Credentials never logged or stored by the relay
- 15-second timeout on the remote request
- Follows redirects (`CURLOPT_FOLLOWLOCATION`)
- The relay requires `NEWTON_API_ENABLED=true` on the local instance

**Use Case:** A local Docker instance in a basement with spotty internet backs up tournaments to a remote server with a proper SSL certificate and basic auth. The browser talks to the local server (same origin, no CORS), and PHP relays to the remote server with credentials.

---

## CORS Configuration

All endpoints include CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

**Note:** For production deployments, restrict `Access-Control-Allow-Origin` to specific domains.

---

## Client Integration

### Feature Detection

The client application detects server availability on page load:

```javascript
async function loadSharedTournaments() {
    try {
        const response = await fetch('/api/list-tournaments.php');
        if (response.ok) {
            // Server features available
            const data = await response.json();
            showUploadButton();
            displaySharedTournaments(data.tournaments);
        }
    } catch (error) {
        // Server features not available - silent fail
    }
}
```

### Conditional UI

Features only appear when server is detected:
- "Backup to Server" button (shown when API responds)
- "Shared Tournaments" section (collapsed by default, shown when tournaments exist on the server)
- Delete buttons on shared tournaments (when `config.server.allowSharedTournamentDelete` is enabled)

### Automatic Backup

When enabled in Global Settings → Server Settings → "Automatically backup tournaments on completion", the tournament JSON is automatically uploaded to the local server at tournament finalization. If a remote server is configured (Global Settings → Remote Backup), the tournament is also relayed to the remote server.

Both uploads are fire-and-forget — they log success or failure to the console but never block the finalization flow.

### Backup to Server Modal

The "Backup to Server" button opens a modal with:
- **Source choice**: Active tournament or from file
- **Destination info**: read-only display of configured destinations (this server + remote if configured)

Uploads to all configured destinations. Shows a summary with success/failure per destination.

### Global Settings — Server Configuration

| Setting | Config key | Default | Description |
|---------|-----------|---------|-------------|
| Allow deleting shared tournaments | `config.server.allowSharedTournamentDelete` | `false` | Shows delete buttons on shared tournaments |
| Automatically backup on completion | `config.server.autoUpload` | `false` | Uploads tournament to server(s) at finalization |
| Remote server URL | `config.server.remoteUrl` | `''` | Remote NewTon instance URL |
| Remote username | `config.server.remoteUsername` | `''` | Basic auth username for remote |
| Remote password | `config.server.remotePassword` | `''` | Basic auth password for remote |

### Error Handling

All API errors are displayed to users with clear messages:
- Network errors: "Server not available"
- Validation errors: Display specific error from response
- Success: "✓ Tournament uploaded to [destination]"

---

## Data Format

### Tournament JSON Structure

Tournaments are stored with the following structure:

```json
{
  "id": 1234567890,
  "name": "My Tournament",
  "date": "2025-10-02",
  "created": "2025-10-02T10:30:00.000Z",
  "status": "completed",
  "bracketSize": 16,
  "players": [
    {
      "id": 1,
      "name": "John Smith",
      "paid": true,
      "ton": 0,
      "oneeighty": 0,
      "highCheckout": 0,
      "shortLeg": 0
    }
  ],
  "matches": [
    {
      "id": "FS-1-1",
      "player1": { "id": 1, "name": "John Smith" },
      "player2": { "id": 2, "name": "Jane Doe" },
      "completed": true,
      "winner": 1,
      "side": "frontside"
    }
  ],
  "placements": {
    "1": 1,
    "2": 2
  },
  "exportedAt": "2025-10-02T15:45:00.000Z"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployments, consider:
- Nginx rate limiting (`limit_req_zone`)
- PHP-based rate limiting
- Cloudflare or similar CDN protection

---

## Monitoring

### Debug Logging

Client-side console logging (development):
```
[Shared Tournaments] Attempting to load from server...
[Shared Tournaments] Response status: 200
[Shared Tournaments] Data received: {tournaments: Array(3), count: 3}
[Shared Tournaments] Upload button shown
[Shared Tournaments] Returning 3 tournaments
```

### Server Logs

Check web server error logs for PHP errors:
```bash
# nginx
tail -f /var/log/nginx/error.log

# Apache
tail -f /var/log/apache2/error.log
```

---

## Future Enhancements

Potential API extensions:

- **Search/Filter**: `GET /api/tournaments?player=John&date=2025-08`
- **Statistics**: `GET /api/stats/player/{id}`
- **Leaderboards**: `GET /api/leaderboard?timeframe=month`
- **Tournament Details**: `GET /api/tournament/{id}`
- **Authentication**: JWT tokens for write operations
- **Pagination**: `GET /api/tournaments?page=1&limit=20`

---

## Troubleshooting

### Upload Button Doesn't Appear

1. Check browser console for `[Shared Tournaments]` messages
2. Verify `/api/list-tournaments.php` returns 200 OK
3. Check CORS headers if serving from different domain
4. Verify PHP is executing (not returning raw PHP code)

### Upload Fails with "Invalid filename format"

- Ensure filename ends with `.json`
- Check for special characters (å, ö, ä should work)
- Verify no path separators (`/`, `\`)

### 502 Bad Gateway

- PHP-FPM not running or not configured correctly
- Check nginx configuration for `fastcgi_pass` settings
- Verify PHP-FPM socket path matches nginx config

### Tournaments Not Appearing

- Check `/tournaments` directory exists and is readable
- Verify JSON files are valid
- Check file permissions (644 for files, 755 for directory)

### Docker-Specific Issues

**API returns 403 Forbidden:**
- Check `NEWTON_API_ENABLED` environment variable is set to `true`
- Restart container after changing environment variables

**Tournaments not persisting after container restart:**
- Verify volume mount is configured: `-v ./tournaments:/var/www/html/tournaments`
- Check host directory permissions
- Verify data is being written to `/var/www/html/tournaments` inside container

**Can't access API on port 8080:**
- Container runs on internal port 2020, ensure port mapping is correct: `-p 8080:2020`
- Check if port 8080 is already in use on host: `docker compose ps`
- Try accessing via `http://localhost:8080/api/list-tournaments.php`

**View Docker container logs:**
```bash
# Using docker compose
docker compose logs -f

# Using docker run
docker logs -f newton-tournament
```

**Access container shell for debugging:**
```bash
docker exec -it newton bash
# or
docker compose exec newton-tournament sh
```

---

## Security Best Practices

1. **Restrict CORS**: Change `Access-Control-Allow-Origin: *` to specific domain
2. **HTTPS Only**: Use TLS/SSL in production
3. **File Permissions**: 644 for files, 755 for directories
4. **Input Validation**: Already implemented, but review regularly
5. **Rate Limiting**: Implement for production use
6. **Authentication**: Consider adding for write operations
7. **Backup**: Regular backups of `/tournaments` directory

---

## Additional Resources

- **[DOCKER-QUICKSTART.md](../DOCKER-QUICKSTART.md)** - Quick start guide for Docker deployment
- **[docker/README.md](../docker/README.md)** - Docker-specific configuration reference
- **[IMPORT_EXPORT.md](IMPORT_EXPORT.md)** - Tournament data format specification
- **[/api/README.md](../api/README.md)** - API implementation notes
- **[README.md](../README.md)** - General project documentation

---

*The Docker image provides the easiest path to deployment with all API endpoints pre-configured and ready to use.*
