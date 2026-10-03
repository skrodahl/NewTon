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

/**
 * Require the API key for a request that changes something (upload, delete, corrections,
 * relay). NEWTON_API_KEY gates it:
 *   unset  -> no key needed (unchanged behaviour; protect the instance at the deployment)
 *   set    -> the X-API-Key header must match, or the request is refused with 401
 * Reading (the page, the tournament list and files, corrections) never needs the key, so
 * an analytics-only instance can be public while only the club's backups can write to it.
 * The ?tm page receives the key from tournament.html when the ?tm password is correct.
 */
function require_api_key() {
    $apiKey = getenv('NEWTON_API_KEY');
    if ($apiKey === false || trim($apiKey) === '') return;
    $given = isset($_SERVER['HTTP_X_API_KEY']) ? (string)$_SERVER['HTTP_X_API_KEY'] : '';
    if (!hash_equals(trim($apiKey), trim($given))) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Missing or wrong API key']);
        exit;
    }
}
