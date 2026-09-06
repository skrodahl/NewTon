<?php
/**
 * Lane registry — which Chalkers are out there, and are they still listening.
 *
 * GET  → [{ lane, deviceId, status, matchId, seenAt, secondsAgo, online }]
 *
 * `online` is derived here rather than by the caller so every view agrees on what
 * "still there" means. Lanes are returned in numeric order, and stale entries are
 * reported rather than hidden — a lane that has gone quiet is worth seeing.
 *
 * Part of `licensed/` — see ../../LICENSE.md. Not BSD.
 */

require_once __DIR__ . '/_common.php';

/** A lane is considered present if it has checked in within this many seconds. */
define('NW_LANE_TIMEOUT', 30);

nw_require_method('GET');
$dir = nw_require_state_dir();

$now = time();
$lanes = [];

foreach (glob($dir . 'lane-*-beat.json') as $file) {
    $beat = nw_read_json($file);
    if (!$beat || !isset($beat['lane'], $beat['seenAt'])) {
        continue;
    }
    $age = $now - (int) $beat['seenAt'];
    $lanes[] = [
        'lane'       => (int) $beat['lane'],
        'deviceId'   => isset($beat['deviceId']) ? $beat['deviceId'] : '',
        'status'     => isset($beat['status']) ? $beat['status'] : 'idle',
        'matchId'    => isset($beat['matchId']) ? $beat['matchId'] : null,
        'seenAt'     => (int) $beat['seenAt'],
        'secondsAgo' => $age,
        'online'     => $age <= NW_LANE_TIMEOUT,
    ];
}

usort($lanes, function ($a, $b) { return $a['lane'] - $b['lane']; });

nw_ok(['lanes' => $lanes, 'timeout' => NW_LANE_TIMEOUT]);
