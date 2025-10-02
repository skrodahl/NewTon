# Server API Scripts (Optional Feature)

This directory contains optional server-side PHP scripts that enable shared tournament hosting.

## Features

When deployed to a PHP-enabled web server, these scripts enable:

1. **Shared Tournament Viewing**: Browse and load tournaments uploaded to the server
2. **Tournament Upload**: Share completed tournaments by uploading them to the server
3. **Graceful Degradation**: Features appear only when server is configured; local-only usage remains fully functional

## Requirements

- PHP 7.0 or higher
- Write permissions to `/tournaments` directory
- Web server (Apache, Nginx, etc.)

## Setup

1. **Create tournaments directory:**
   ```bash
   mkdir -p ../tournaments
   chmod 755 ../tournaments
   ```

2. **Deploy to web server:**
   - Upload entire application to web-accessible directory
   - Ensure `/api` and `/tournaments` directories are accessible
   - Verify PHP is enabled for `.php` files

3. **Test endpoints:**
   - List: `https://yourdomain.com/api/list-tournaments.php`
   - Upload: POST to `https://yourdomain.com/api/upload-tournament.php`

## Endpoints

### GET /api/list-tournaments.php

Returns list of available tournaments.

**Response:**
```json
{
  "tournaments": [
    {
      "filename": "MyTournament_2025-10-01.json",
      "name": "My Tournament",
      "date": "2025-10-01",
      "players": 16,
      "status": "completed"
    }
  ],
  "count": 1
}
```

### POST /api/upload-tournament.php

Uploads a tournament to the server.

**Request:**
```json
{
  "filename": "MyTournament_2025-10-01.json",
  "data": { /* tournament data object */ }
}
```

**Response:**
```json
{
  "success": true,
  "filename": "MyTournament_2025-10-01.json",
  "path": "/tournaments/MyTournament_2025-10-01.json",
  "message": "Tournament uploaded successfully"
}
```

## Security

- **Filename validation**: Only alphanumeric, spaces, hyphens, underscores, and `.json` extension allowed
- **Directory traversal prevention**: `basename()` ensures files stay in tournaments directory
- **CORS headers**: Configured for cross-origin requests (adjust as needed)
- **File permissions**: Tournaments directory requires write access (755 recommended)

## Local Development

These scripts are **not required** for local development. The application works fully offline using browser localStorage. This is a bonus feature for organizations wanting to share tournament data across users.

## Troubleshooting

**Upload button doesn't appear:**
- Server endpoint `/api/list-tournaments.php` must return valid JSON response
- Check browser console for network errors

**Upload fails:**
- Verify `/tournaments` directory exists and is writable
- Check PHP error logs for permission issues
- Ensure PHP has file write permissions

**CORS errors:**
- Adjust `Access-Control-Allow-Origin` header in PHP files
- For production, restrict to specific domains
