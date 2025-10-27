# REST API Documentation

**NewTon DC Tournament Manager - Server API**

Version: 2.3.0
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
- "Upload to Server" button (shown when API responds)
- "Shared Tournaments" section (shown when tournaments exist)
- Delete buttons on shared tournaments

### Error Handling

All API errors are displayed to users with clear messages:
- Network errors: "Error uploading tournament to server"
- Validation errors: Display specific error from response
- Success: "✓ Tournament uploaded to server successfully!"

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
