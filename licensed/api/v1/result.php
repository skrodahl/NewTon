<?php
/**
 * Completed-match mailbox — one slot per match.
 *
 * POST { payload }        Chalker posts a finished match.
 * GET                     Tournament Manager collects everything pending.
 * POST { clear: matchId } Tournament Manager discards one after applying it.
 *
 * Keyed by match id, so a corrected resend replaces the pending copy rather than
 * queueing a second one — last write wins. A result is never deleted except by the
 * TM after the operator has accepted it: if the operator does not accept, it stays
 * pending, which is what makes "declining" simply mean "not yet".
 *
 * Part of `licensed/` — see ../../LICENSE.md. Not BSD.
 */

require_once __DIR__ . '/_common.php';

nw_require_method(['GET', 'POST']);
$dir = nw_require_state_dir();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $results = [];
    foreach (glob($dir . 'result-*.json') as $file) {
        $slot = nw_read_json($file);
        if ($slot && isset($slot['payload'])) {
            $results[] = ['payload' => $slot['payload'], 'postedAt' => $slot['postedAt']];
        }
    }
    nw_ok(['results' => $results]);
}

$body = nw_read_json_body();

if (isset($body['clear'])) {
    $mid = nw_match_id($body['clear']);
    @unlink($dir . 'result-' . $mid . '.json');
    nw_ok(['cleared' => $mid]);
}

if (!isset($body['payload']) || !is_array($body['payload'])) {
    nw_fail(400, 'Missing result payload');
}
$mid = nw_match_id(isset($body['payload']['mid']) ? $body['payload']['mid'] : null);

nw_write_json($dir . 'result-' . $mid . '.json', [
    'payload'  => $body['payload'],
    'postedAt' => time(),
]);

nw_ok(['matchId' => $mid]);
