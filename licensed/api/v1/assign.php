<?php
/**
 * Match assignment mailbox — one slot per lane.
 *
 * POST { lane, payload }  Tournament Manager queues a match for a lane.
 * GET  ?lane=N            Chalker collects whatever is queued for its lane.
 *
 * The slot is NOT cleared on collection. A Chalker that reads an assignment and
 * then crashes would otherwise lose the match with no way to ask again; instead
 * the assignment stays until it is replaced or explicitly cleared, and the Chalker
 * ignores an assignment for the match it is already scoring. Re-reading is
 * therefore harmless, which is the property that makes polling safe.
 *
 * Part of `licensed/` — see ../../LICENSE.md. Not BSD.
 */

require_once __DIR__ . '/_common.php';

nw_require_method(['GET', 'POST']);
$dir = nw_require_state_dir();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $lane = nw_lane(isset($_GET['lane']) ? $_GET['lane'] : null);
    $slot = nw_read_json($dir . 'lane-' . $lane . '-assign.json');
    nw_ok(['assignment' => $slot ? $slot['payload'] : null,
           'queuedAt'   => $slot ? $slot['queuedAt'] : null]);
}

// POST — queue, replace, or clear a lane's assignment
$body = nw_read_json_body();
$lane = nw_lane(isset($body['lane']) ? $body['lane'] : null);
$path = $dir . 'lane-' . $lane . '-assign.json';

// An explicit clear: the TM has accepted the result, so the lane is free again
if (array_key_exists('clear', $body) && $body['clear']) {
    @unlink($path);
    nw_ok(['cleared' => true, 'lane' => $lane]);
}

if (!isset($body['payload']) || !is_array($body['payload'])) {
    nw_fail(400, 'Missing assignment payload');
}
// Sanity only — the payload is passed through verbatim, exactly as by QR
nw_match_id(isset($body['payload']['mid']) ? $body['payload']['mid'] : null);

nw_write_json($path, [
    'payload'  => $body['payload'],
    'queuedAt' => time(),
]);

nw_ok(['lane' => $lane]);
