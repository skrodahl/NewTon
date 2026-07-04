<?php
/**
 * API Access Check
 * Checks if API is enabled via NEWTON_API_ENABLED environment variable
 * Include this file at the top of all API endpoints
 */

// Check if API is disabled via environment variable.
// Normalized: 'false', 'FALSE', '0', 'off', 'no' all disable; unset keeps the
// API enabled (documented opt-out model — deployers protect exposed instances).
$newtonApiEnabled = getenv('NEWTON_API_ENABLED');
if ($newtonApiEnabled !== false && in_array(strtolower(trim($newtonApiEnabled)), ['false', '0', 'off', 'no'], true)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'API is disabled on this instance',
        'message' => 'The REST API has been disabled by the server administrator. Use the browser interface to manage tournaments locally.'
    ]);
    exit;
}
