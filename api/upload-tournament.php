<?php
/**
 * Upload Tournament API
 * Accepts POST with JSON tournament data and saves to /tournaments directory
 * Requires write permissions to tournaments directory
 */

// Check if API is enabled
require_once 'api-check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$tournamentsDir = dirname(__DIR__) . '/tournaments/';

// Check if directory exists, create if it doesn't
if (!is_dir($tournamentsDir)) {
    if (!mkdir($tournamentsDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create tournaments directory']);
        exit;
    }
}

// Check if directory is writable
if (!is_writable($tournamentsDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Tournaments directory is not writable']);
    exit;
}

// Get POST data
$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if ($payload === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Validate required fields
if (!isset($payload['filename']) || !isset($payload['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing filename or data']);
    exit;
}

$filename = basename($payload['filename']); // Security: prevent directory traversal
$data = $payload['data'];

// Validate filename - allow unicode characters but prevent directory traversal
if (!str_ends_with($filename, '.json')) {
    http_response_code(400);
    echo json_encode(['error' => 'Filename must end with .json']);
    exit;
}

// Prevent dangerous characters (path traversal, null bytes)
if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false || strpos($filename, "\0") !== false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename - contains dangerous characters']);
    exit;
}

// Save tournament data
$filepath = $tournamentsDir . $filename;

// Check if file already exists and overwrite not explicitly requested
$overwriteRequested = isset($_GET['overwrite']) && $_GET['overwrite'] === 'true';
if (file_exists($filepath) && !$overwriteRequested) {
    http_response_code(409); // Conflict
    echo json_encode([
        'error' => 'Tournament file already exists',
        'filename' => $filename,
        'exists' => true,
        'message' => 'A tournament with this filename already exists. Delete it first or use overwrite option.'
    ]);
    exit;
}

$jsonData = json_encode($data, JSON_PRETTY_PRINT);

if ($jsonData === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to encode tournament data']);
    exit;
}

if (file_put_contents($filepath, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save tournament file']);
    exit;
}

// Success
$wasOverwritten = file_exists($filepath) && $overwriteRequested;
echo json_encode([
    'success' => true,
    'filename' => $filename,
    'path' => '/tournaments/' . $filename,
    'message' => $wasOverwritten ? 'Tournament updated successfully' : 'Tournament uploaded successfully',
    'overwritten' => $wasOverwritten
]);
