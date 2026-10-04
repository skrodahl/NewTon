<?php
/**
 * Key check: does this instance ask for an API key, and does the X-API-Key header match?
 * Writes nothing. Used by Global Settings → Remote backup → Test connection, which reaches
 * it through the club computer's relay, the same way a backup travels.
 *
 * Response (always 200 when the API is on):
 *   { "ok": true, "app": "newton", "keyRequired": bool, "keyAccepted": bool }
 */

require_once 'api-check.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$apiKey = getenv('NEWTON_API_KEY');
$required = $apiKey !== false && trim($apiKey) !== '';
$given = isset($_SERVER['HTTP_X_API_KEY']) ? (string)$_SERVER['HTTP_X_API_KEY'] : '';

echo json_encode([
    'ok' => true,
    'app' => 'newton',
    'keyRequired' => $required,
    'keyAccepted' => !$required || hash_equals(trim($apiKey), trim($given))
]);
