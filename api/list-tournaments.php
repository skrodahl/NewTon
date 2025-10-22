<?php
/**
 * List Tournaments API
 * Returns list of tournaments from /tournaments directory
 * Gracefully fails if directory doesn't exist
 */

// Check if API is enabled
require_once 'api-check.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$tournamentsDir = dirname(__DIR__) . '/tournaments/';

// Check if directory exists
if (!is_dir($tournamentsDir)) {
    http_response_code(404);
    echo json_encode(['error' => 'Tournaments directory not found']);
    exit;
}

// Get all JSON files
$files = glob($tournamentsDir . '*.json');

if ($files === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read tournaments directory']);
    exit;
}

$tournaments = [];

foreach ($files as $file) {
    $content = file_get_contents($file);
    if ($content === false) {
        continue; // Skip files that can't be read
    }

    $data = json_decode($content, true);
    if ($data === null) {
        continue; // Skip invalid JSON files
    }

    $tournaments[] = [
        'filename' => basename($file),
        'name' => $data['name'] ?? 'Unknown',
        'date' => $data['date'] ?? 'Unknown',
        'players' => isset($data['players']) ? count($data['players']) : 0,
        'status' => $data['status'] ?? 'unknown'
    ];
}

// Return tournaments list
echo json_encode([
    'tournaments' => $tournaments,
    'count' => count($tournaments)
]);
