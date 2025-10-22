<?php
/**
 * API Access Check
 * Checks if API is enabled via NEWTON_API_ENABLED environment variable
 * Include this file at the top of all API endpoints
 */

// Check if API is disabled via environment variable
if (getenv('NEWTON_API_ENABLED') === 'false') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'API is disabled on this instance',
        'message' => 'The REST API has been disabled by the server administrator. Use the browser interface to manage tournaments locally.'
    ]);
    exit;
}
