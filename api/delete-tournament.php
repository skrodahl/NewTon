<?php
/**
 * Delete Tournament API
 * Accepts POST with filename and deletes tournament from /tournaments directory
 * Requires write permissions to tournaments directory
 */

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

// Check if directory exists
if (!is_dir($tournamentsDir)) {
    http_response_code(404);
    echo json_encode(['error' => 'Tournaments directory not found']);
    exit;
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
if (!isset($payload['filename'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing filename']);
    exit;
}

$filename = basename($payload['filename']); // Security: prevent directory traversal

// Validate filename
if (!str_ends_with($filename, '.json')) {
    http_response_code(400);
    echo json_encode(['error' => 'Filename must end with .json']);
    exit;
}

// Prevent dangerous characters
if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false || strpos($filename, "\0") !== false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename - contains dangerous characters']);
    exit;
}

$filepath = $tournamentsDir . $filename;

// Check if file exists
if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Tournament file not found']);
    exit;
}

// Delete the file
if (!unlink($filepath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete tournament file']);
    exit;
}

// Success
echo json_encode([
    'success' => true,
    'filename' => $filename,
    'message' => 'Tournament deleted successfully'
]);
