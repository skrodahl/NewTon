<?php
/**
 * Lane presence — one file per lane, written by the Chalker.
 *
 * POST { lane, deviceId, status }
 *
 * Replaces MQTT's Last Will: rather than the broker noticing a dropped socket,
 * each Chalker states it is still there and the Tournament Manager treats silence
 * as absence (see lanes.php). More robust than a live connection for this job,
 * because a phone that sleeps and wakes simply resumes posting — there is no
 * session to re-establish.
 *
 * Part of `licensed/` — see ../../LICENSE.md. Not BSD.
 */

require_once __DIR__ . '/_common.php';

nw_require_method('POST');
$dir = nw_require_state_dir();

$body = nw_read_json_body();
$lane = nw_lane(isset($body['lane']) ? $body['lane'] : null);

$deviceId = isset($body['deviceId']) ? (string) $body['deviceId'] : '';
if (strlen($deviceId) > 64) {
    $deviceId = substr($deviceId, 0, 64);
}

$status = isset($body['status']) ? (string) $body['status'] : 'idle';
if (!in_array($status, ['idle', 'busy'], true)) {
    $status = 'idle';
}

nw_write_json($dir . 'lane-' . $lane . '-beat.json', [
    'lane'     => $lane,
    'deviceId' => $deviceId,
    'status'   => $status,
    'matchId'  => isset($body['matchId']) && $body['matchId'] ? nw_match_id($body['matchId']) : null,
    'seenAt'   => time(),
]);

nw_ok(['lane' => $lane]);
