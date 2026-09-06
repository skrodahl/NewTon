<?php
/**
 * Shared helpers for the network handover endpoints (proof of concept).
 *
 * Part of the `licensed/` directory — NOT covered by the project's BSD 3-Clause
 * licence. See ../../LICENSE.md.
 *
 * These endpoints are a mailbox, nothing more. The Tournament Manager remains the
 * system of record: it queues an assignment for a lane, a Chalker collects it,
 * posts a result back, and the operator accepts that result in the TM. Nothing
 * here interprets a match — payloads are stored and handed on verbatim, exactly as
 * they travel by QR code.
 *
 * State lives in `tournaments/network/`, which is the existing mounted volume, so
 * it survives a container restart and needs no new configuration.
 */

header('Content-Type: application/json');
header('Cache-Control: no-store');

/** Where the mailbox files live. */
function nw_state_dir() {
    return dirname(__DIR__, 3) . '/tournaments/network/';
}

/**
 * Ensure the state directory exists and is writable, or fail the request.
 * @return string the directory path, with a trailing slash
 */
function nw_require_state_dir() {
    $dir = nw_state_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
        nw_fail(500, 'Could not create the network state directory');
    }
    if (!is_writable($dir)) {
        nw_fail(500, 'The network state directory is not writable');
    }
    return $dir;
}

/**
 * Send a JSON error and stop.
 * @param int $status
 * @param string $message
 */
function nw_fail($status, $message) {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

/**
 * Send a JSON success payload and stop.
 * @param array $data
 */
function nw_ok($data = []) {
    echo json_encode(array_merge(['ok' => true], $data));
    exit;
}

/**
 * Restrict a request to one HTTP method (OPTIONS is answered for preflight).
 * @param string|string[] $allowed
 */
function nw_require_method($allowed) {
    $allowed = (array) $allowed;
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        nw_fail(405, 'Method not allowed');
    }
}

/**
 * Read and decode a JSON request body.
 *
 * Capped well above any real payload — an assignment is a few hundred bytes and a
 * result with full visit data is a few kilobytes.
 *
 * @return array
 */
function nw_read_json_body() {
    $raw = file_get_contents('php://input', false, null, 0, 256 * 1024);
    if ($raw === false || $raw === '') {
        nw_fail(400, 'Empty request body');
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        nw_fail(400, 'Body is not valid JSON');
    }
    return $data;
}

/**
 * Validate a lane number.
 *
 * Lanes are 1-20 in the Tournament Manager. Anything else is rejected rather than
 * clamped — a lane that isn't a lane means the caller is confused, and a filename
 * is built from this.
 *
 * @param mixed $lane
 * @return int
 */
function nw_lane($lane) {
    if (!is_numeric($lane)) {
        nw_fail(400, 'Missing or non-numeric lane');
    }
    $n = (int) $lane;
    if ($n < 1 || $n > 20) {
        nw_fail(400, 'Lane out of range (1-20)');
    }
    return $n;
}

/**
 * Validate a match id before it is used in a filename.
 *
 * Match ids are structural — 'FS-1-3', 'BS-FINAL', 'GRAND-FINAL' — so anything
 * outside that alphabet is rejected. This is the one place user input reaches a
 * path, so it is a whitelist, not an escape: no dots, no slashes, no traversal.
 *
 * @param mixed $id
 * @return string
 */
function nw_match_id($id) {
    if (!is_string($id) || $id === '' || strlen($id) > 40) {
        nw_fail(400, 'Missing or malformed match id');
    }
    if (!preg_match('/^[A-Za-z0-9-]+$/', $id)) {
        nw_fail(400, 'Match id contains unexpected characters');
    }
    return $id;
}

/**
 * Write a file atomically, so a reader never sees a half-written mailbox.
 *
 * @param string $path
 * @param array $data
 */
function nw_write_json($path, $data) {
    $tmp = $path . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, json_encode($data)) === false || !@rename($tmp, $path)) {
        @unlink($tmp);
        nw_fail(500, 'Could not write network state');
    }
}

/**
 * Read a JSON file, or null when it is absent or unreadable.
 *
 * @param string $path
 * @return array|null
 */
function nw_read_json($path) {
    if (!is_file($path)) {
        return null;
    }
    $raw = @file_get_contents($path);
    if ($raw === false) {
        return null;
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}
