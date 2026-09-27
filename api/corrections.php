<?php
/**
 * Achievement Corrections API
 *
 * Corrections are a layer on top of Analytics: per tournament, per player, they add or
 * subtract achievements (180s, tons, lollipops, high outs, short legs). They live on the
 * server so every browser sees the same thing — the register in each browser's IndexedDB
 * is never modified. Analytics applies them at load time.
 *
 *   GET  → { corrections: [ ... ] }  (all tournaments)
 *   POST { tournamentId, corrections: [ ... ] }
 *        → replaces every correction for that tournament. An empty list removes them.
 *
 * Stored in tournaments/corrections/corrections.json — inside the tournaments volume so
 * it survives container rebuilds, but in a subfolder so list-tournaments.php (which only
 * reads tournaments/*.json) never mistakes it for a tournament.
 */

// Check if API is enabled
require_once 'api-check.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$correctionsDir  = dirname(__DIR__) . '/tournaments/corrections/';
$correctionsFile = $correctionsDir . 'corrections.json';

/**
 * Decode the stored file. Missing or unreadable → no corrections.
 */
function readCorrections($contents) {
    $data = json_decode($contents ?: '', true);
    return (is_array($data) && isset($data['corrections']) && is_array($data['corrections']))
        ? $data['corrections']
        : [];
}

// ─── GET ─────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $contents = is_file($correctionsFile) ? file_get_contents($correctionsFile) : '';
    echo json_encode(['corrections' => readCorrections($contents)]);
    exit;
}

// ─── POST ────────────────────────────────────────────────────────────────────
$input = file_get_contents('php://input');

// Corrections for one tournament are a few hundred bytes; anything this size is a mistake
if (strlen($input) > 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Payload too large (max 1 MB)']);
    exit;
}

$payload = json_decode($input, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

$tournamentId = isset($payload['tournamentId']) ? (string)$payload['tournamentId'] : '';
if ($tournamentId === '' || strlen($tournamentId) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid tournamentId']);
    exit;
}

if (!isset($payload['corrections']) || !is_array($payload['corrections']) || count($payload['corrections']) > 512) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid corrections list']);
    exit;
}

/** Keep only integers from a list of values. */
function intList($list) {
    if (!is_array($list)) return [];
    return array_values(array_map('intval', array_filter(array_slice($list, 0, 100), 'is_numeric')));
}

// Normalize each record to the known shape — unknown fields are dropped
$incoming = [];
foreach ($payload['corrections'] as $c) {
    if (!is_array($c) || !isset($c['playerId'])) continue;
    $incoming[] = [
        'tournamentId' => $tournamentId,
        'playerId'     => (string)$c['playerId'],
        'playerName'   => isset($c['playerName']) ? mb_substr((string)$c['playerName'], 0, 200) : '',
        'oneEighties'  => isset($c['oneEighties']) ? (int)$c['oneEighties'] : 0,
        'tons'         => isset($c['tons']) ? (int)$c['tons'] : 0,
        'lollipops'    => isset($c['lollipops']) ? (int)$c['lollipops'] : 0,
        'highOuts'     => [
            'add'    => intList($c['highOuts']['add'] ?? []),
            'remove' => intList($c['highOuts']['remove'] ?? []),
        ],
        'shortLegs'    => [
            'add'    => intList($c['shortLegs']['add'] ?? []),
            'remove' => intList($c['shortLegs']['remove'] ?? []),
        ],
        'updatedAt'    => time(),
    ];
}

if (!is_dir($correctionsDir) && !@mkdir($correctionsDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create corrections directory']);
    exit;
}

// Read-modify-write under an exclusive lock, so two saves can't overwrite each other
$fh = @fopen($correctionsFile, 'c+');
if (!$fh) {
    http_response_code(500);
    echo json_encode(['error' => 'Corrections file is not writable']);
    exit;
}

flock($fh, LOCK_EX);

$existing = readCorrections(stream_get_contents($fh));
$kept = array_values(array_filter($existing, function ($c) use ($tournamentId) {
    return !isset($c['tournamentId']) || (string)$c['tournamentId'] !== $tournamentId;
}));
$all = array_merge($kept, $incoming);

ftruncate($fh, 0);
rewind($fh);
$written = fwrite($fh, json_encode(['corrections' => $all], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save corrections']);
    exit;
}

echo json_encode(['success' => true, 'corrections' => $all]);
