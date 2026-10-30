<?php
/**
 * Live copy API: a slim snapshot of the tournament being played (Docs/HUB-DIRECTION.md, step 3).
 *
 *   POST { id, rev, snapshot }   store the snapshot (key required). Overwrites the one before,
 *                                unless it carries an older rev (a late arrival): then nothing
 *                                is changed and the answer says stale.
 *   POST { id, delete: true }    remove the live copy (key required)
 *   GET                          { live: [ { id, name, date, status, rev, updatedAt } ] }
 *   GET ?id=<id>                 the snapshot, with an ETag (304 when unchanged)
 *
 * Stored in tournaments/live/<id>.json: a subfolder that list-tournaments.php (which reads only
 * tournaments/*.json) never lists, so Analytics cannot import a tournament that is still being
 * played. Reading never needs the key, as elsewhere; the setting that sends it says so.
 * A live copy not written to for three days is removed (an abandoned tournament).
 */

require_once 'api-check.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, If-None-Match');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$liveDir = dirname(__DIR__) . '/tournaments/live/';
const LIVE_MAX_BYTES = 1048576;   // a snapshot is a few tens of KB; this is a ceiling, not a target
const LIVE_KEEP_SECONDS = 259200; // three days

/** A tournament id is a number (Date.now()); nothing else ever reaches the file system. */
function live_valid_id($id) {
    return is_string($id) && preg_match('/^[0-9]{1,20}$/', $id) === 1;
}

/** Remove live copies nobody has written to for a while. */
function live_prune($dir) {
    foreach (glob($dir . '*.json') ?: [] as $file) {
        if (time() - (int)@filemtime($file) > LIVE_KEEP_SECONDS) @unlink($file);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? (string)$_GET['id'] : null;

    if ($id !== null) {
        if (!live_valid_id($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid id']);
            exit;
        }
        $file = $liveDir . $id . '.json';
        if (!is_file($file)) {
            http_response_code(404);
            echo json_encode(['error' => 'No live copy of that tournament']);
            exit;
        }
        $etag = '"' . filemtime($file) . '-' . filesize($file) . '"';
        header('ETag: ' . $etag);
        if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
            http_response_code(304);
            exit;
        }
        readfile($file);
        exit;
    }

    $live = [];
    foreach (glob($liveDir . '*.json') ?: [] as $file) {
        if (time() - (int)@filemtime($file) > LIVE_KEEP_SECONDS) continue;
        $data = json_decode((string)@file_get_contents($file), true);
        if (!is_array($data)) continue;
        $live[] = [
            'id' => (string)($data['id'] ?? basename($file, '.json')),
            'name' => $data['name'] ?? 'Unknown',
            'date' => $data['date'] ?? 'Unknown',
            'status' => $data['status'] ?? 'unknown',
            'rev' => $data['rev'] ?? 0,
            'updatedAt' => filemtime($file)
        ];
    }
    echo json_encode(['live' => $live, 'count' => count($live)]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_api_key();

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > LIVE_MAX_BYTES) {
    http_response_code(413);
    echo json_encode(['error' => 'Snapshot too large']);
    exit;
}
$request = json_decode($raw, true);
if (!is_array($request) || !live_valid_id(isset($request['id']) ? (string)$request['id'] : '')) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid id']);
    exit;
}
$id = (string)$request['id'];
$file = $liveDir . $id . '.json';

if (!empty($request['delete'])) {
    if (is_file($file)) @unlink($file);
    echo json_encode(['success' => true, 'deleted' => true]);
    exit;
}

$snapshot = $request['snapshot'] ?? null;
if (!is_array($snapshot) || !isset($snapshot['rev']) || !is_numeric($snapshot['rev'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing snapshot or rev']);
    exit;
}
$snapshot['id'] = $id;

if (!is_dir($liveDir) && !@mkdir($liveDir, 0755, true) && !is_dir($liveDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not create the live directory']);
    exit;
}

// A late arrival must not overwrite a newer state
if (is_file($file)) {
    $existing = json_decode((string)@file_get_contents($file), true);
    if (is_array($existing) && isset($existing['rev']) && $existing['rev'] >= $snapshot['rev']) {
        echo json_encode(['success' => true, 'stale' => true, 'rev' => $existing['rev']]);
        exit;
    }
}

$tmp = $file . '.tmp';
if (file_put_contents($tmp, json_encode($snapshot), LOCK_EX) === false || !@rename($tmp, $file)) {
    @unlink($tmp);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save the live copy']);
    exit;
}
@chmod($file, 0644);
live_prune($liveDir);

echo json_encode(['success' => true, 'rev' => $snapshot['rev']]);
