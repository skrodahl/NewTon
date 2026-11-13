<?php
/**
 * Season final API (NewTon DC only, Docs/SEASON-FINAL.md)
 *
 * The saved season behind Analytics → Leaderboard → Season final: the name word and dates
 * the season is made of, tournaments ticked in or left out by hand, and the players marked
 * Not available. One record per instance. Exists only where NEWTON_DC=1 is set; anywhere
 * else it answers 404, as if it weren't there.
 *
 *   GET  → { season: { ... } | null }
 *   POST { season: { ... } }  → replaces the saved season
 *   POST { season: null }     → removes it (the tab is gone for members)
 *
 * Stored in tournaments/season-final/season.json — inside the tournaments volume so it
 * survives container rebuilds, in a subfolder so list-tournaments.php never reads it.
 */

// Check if API is enabled
require_once 'api-check.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

if (!in_array(getenv('NEWTON_DC'), ['1', 'true'], true)) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

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

$seasonDir  = dirname(__DIR__) . '/tournaments/season-final/';
$seasonFile = $seasonDir . 'season.json';

// ─── GET ─────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $data = is_file($seasonFile) ? json_decode(file_get_contents($seasonFile) ?: '', true) : null;
    $season = (is_array($data) && isset($data['season']) && is_array($data['season'])) ? $data['season'] : null;
    echo json_encode(['season' => $season]);
    exit;
}

// ─── POST ────────────────────────────────────────────────────────────────────
// Saving needs the API key when NEWTON_API_KEY is set; reading (GET) never does
require_api_key();

$input = file_get_contents('php://input');

// A season is a few kilobytes; anything this size is a mistake
if (strlen($input) > 256 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Payload too large (max 256 KB)']);
    exit;
}

$payload = json_decode($input, true);
if (!is_array($payload) || !array_key_exists('season', $payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Remove the season
if ($payload['season'] === null) {
    if (is_file($seasonFile) && !@unlink($seasonFile)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to remove the season']);
        exit;
    }
    echo json_encode(['success' => true, 'season' => null]);
    exit;
}

$in = $payload['season'];
if (!is_array($in)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid season']);
    exit;
}

/** A string of at most $max characters, or '' */
function text($v, $max) {
    return is_string($v) ? mb_substr(trim($v), 0, $max) : '';
}

/** A date YYYY-MM-DD, or null (no limit) */
function day($v) {
    return (is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) ? $v : null;
}

/** A list of tournament ids */
function ids($list) {
    if (!is_array($list)) return [];
    $out = [];
    foreach (array_slice($list, 0, 1000) as $id) {
        if ((is_string($id) || is_int($id)) && (string)$id !== '' && strlen((string)$id) <= 200) $out[] = (string)$id;
    }
    return array_values(array_unique($out));
}

// Normalize to the known shape — unknown fields are dropped
$marks = [];
foreach (array_slice(is_array($in['notAvailable'] ?? null) ? $in['notAvailable'] : [], 0, 500) as $m) {
    if (!is_array($m)) continue;
    $key = text($m['key'] ?? '', 200);
    if ($key === '') continue;
    $marks[$key] = ['key' => $key, 'name' => text($m['name'] ?? '', 200)];
}

$season = [
    'keyword'      => text($in['keyword'] ?? '', 100),
    'from'         => day($in['from'] ?? null),
    'to'           => day($in['to'] ?? null),
    'periodLabel'  => text($in['periodLabel'] ?? '', 60),
    'ticked'       => ids($in['ticked'] ?? []),
    'unticked'     => ids($in['unticked'] ?? []),
    'notAvailable' => array_values($marks),
    'updatedAt'    => time(),
];

if (!is_dir($seasonDir) && !@mkdir($seasonDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create the season directory']);
    exit;
}

// Write under an exclusive lock, so two saves can't interleave
$fh = @fopen($seasonFile, 'c');
if (!$fh) {
    http_response_code(500);
    echo json_encode(['error' => 'Season file is not writable']);
    exit;
}

flock($fh, LOCK_EX);
ftruncate($fh, 0);
rewind($fh);
$written = fwrite($fh, json_encode(['season' => $season], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save the season']);
    exit;
}

echo json_encode(['success' => true, 'season' => $season]);
