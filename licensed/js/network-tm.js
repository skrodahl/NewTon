/**
 * Tournament Manager network client — sends matches to Chalkers, collects results.
 *
 * Part of the `licensed/` directory. NOT covered by the project's BSD 3-Clause
 * licence; see ../LICENSE.md. Experimental proof of concept.
 *
 * Two responsibilities, both deliberately small:
 *
 *   1. Dispatch — hand `buildAssignmentPayload()`'s output to a lane. The same signed
 *      object the assignment QR carries, delivered a different way.
 *   2. Collect — poll for finished matches and hold them in memory until the operator
 *      accepts one, at which point the existing result preview does the rest.
 *
 * An arriving result never completes a match on its own. It waits to be accepted, and
 * accepting opens the same modal a scanned QR opens. Nothing enters a tournament
 * without the operator seeing it, and nothing here re-implements match completion.
 *
 * Pending results are held in memory only, never written into the tournament record —
 * a field invented by a proof of concept would be permanent under the project's
 * additive-only schema rule. On reload they are simply fetched again.
 */
const NetworkClient = (() => {
    'use strict';

    const API = 'licensed/api/v1/';
    const RESULT_POLL_MS = 4000;

    /** matchId -> signed result payload awaiting the operator. In memory by design. */
    let _pending = {};
    let _pollTimer = null;
    let _lanes = [];

    /** POST JSON. Resolves to the body or null; never rejects — a dropped request is normal. */
    function post(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(r => (r.ok ? r.json() : null)).catch(() => null);
    }

    /** GET JSON. Same contract as post(). */
    function get(endpoint) {
        return fetch(API + endpoint, { headers: { Accept: 'application/json' } })
            .then(r => (r.ok ? r.json() : null)).catch(() => null);
    }

    /** Should we be polling? Only during an active tournament with a match under way. */
    function shouldPoll() {
        if (typeof tournament === 'undefined' || !tournament || tournament.status !== 'active') return false;
        if (typeof matches === 'undefined' || !Array.isArray(matches)) return false;
        return matches.some(m => m && m.active);
    }

    /** Fetch pending results and note any that are new. */
    function pollResults() {
        if (!shouldPoll()) return;

        get('result.php').then(res => {
            if (!res || !res.ok || !Array.isArray(res.results)) return;

            let arrived = 0;
            res.results.forEach(entry => {
                const payload = entry && entry.payload;
                if (!payload || !payload.mid) return;

                // Verify exactly as a scanned QR would be
                if (typeof NewtonIntegrity !== 'undefined' && !NewtonIntegrity.verify(payload)) {
                    console.warn(`[network] result for ${payload.mid} failed its integrity check; ignoring.`);
                    return;
                }
                // Only a live match can accept a result — the same guard applyQRResult() uses,
                // so a stale or duplicate post for a finished match is quietly irrelevant
                const match = matches.find(m => m.id === payload.mid);
                if (!match || !match.active) return;

                if (!_pending[payload.mid]) arrived++;
                _pending[payload.mid] = payload;
            });

            if (arrived > 0) {
                if (typeof updateStatusCenter === 'function') {
                    updateStatusCenter(arrived === 1
                        ? 'Result received — open Match Controls to accept'
                        : `${arrived} results received — open Match Controls to accept`);
                }
                if (typeof renderBracket === 'function') renderBracket();
                refreshMatchControls();
            }
        });
    }

    /** Nudge Match Controls if it happens to be open, so a new result shows up there. */
    function refreshMatchControls() {
        const modal = document.getElementById('matchCommandCenterModal');
        const open = modal && (modal.style.display === 'flex' || modal.style.display === 'block');
        if (open && typeof showMatchCommandCenter === 'function') showMatchCommandCenter();
    }

    return {
        /**
         * Send a started match to the Chalker on its assigned lane.
         * @param {string} matchId
         */
        dispatchMatch(matchId) {
            const match = (typeof matches !== 'undefined' && matches)
                ? matches.find(m => m.id === matchId) : null;
            if (!match) return;

            if (!match.lane) {
                alert('Assign a lane to this match first.\n\nThe match is sent to the Chalker serving that lane.');
                return;
            }
            if (typeof buildAssignmentPayload !== 'function') {
                alert('Cannot build the match assignment. Reload the page and try again.');
                return;
            }

            const payload = buildAssignmentPayload(matchId);
            if (!payload) return;

            post('assign.php', { lane: parseInt(match.lane, 10), payload }).then(res => {
                if (res && res.ok) {
                    if (typeof updateStatusCenter === 'function') {
                        updateStatusCenter(`${matchId} sent to Lane ${match.lane}`);
                    }
                } else {
                    alert(`Could not send ${matchId} to Lane ${match.lane}.\n\nThe Chalker may still pick it up on its next check. If not, switch Handover to "QR code" on the Config page.`);
                }
                refreshMatchControls();
            });
        },

        /** @param {string} matchId @returns {boolean} is a result waiting for this match? */
        hasPendingResult(matchId) {
            return Object.prototype.hasOwnProperty.call(_pending, matchId);
        },

        /**
         * Open the received result for the operator to review and accept.
         * Hands off to the existing preview — the same modal a scanned QR opens.
         * @param {string} matchId
         */
        reviewResult(matchId) {
            const payload = _pending[matchId];
            if (!payload) return;
            if (typeof showResultQRPreview !== 'function') {
                alert('The result preview is unavailable. Reload the page and try again.');
                return;
            }
            showResultQRPreview(payload);
        },

        /**
         * Drop a result once it has been applied, and free the lane.
         * Called by the TM after applyQRResult() succeeds — never before, so a result
         * the operator has not accepted stays pending and can be looked at again.
         * @param {string} matchId
         */
        clearResult(matchId) {
            if (!matchId) return;
            const match = (typeof matches !== 'undefined' && matches)
                ? matches.find(m => m.id === matchId) : null;
            delete _pending[matchId];
            post('result.php', { clear: matchId });
            if (match && match.lane) post('assign.php', { lane: parseInt(match.lane, 10), clear: 1 });
        },

        /** @returns {object[]} last known lane registry */
        getLanes() { return _lanes; },

        /** Refresh the lane registry (who is out there, and are they still listening). */
        refreshLanes() {
            return get('lanes.php').then(res => {
                _lanes = (res && res.ok && Array.isArray(res.lanes)) ? res.lanes : [];
                return _lanes;
            });
        },

        /** Start polling. Safe to call repeatedly. */
        start() {
            if (_pollTimer) return;
            _pollTimer = setInterval(pollResults, RESULT_POLL_MS);
            pollResults();
        },

        stop() {
            if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
        }
    };
})();

// Poll only while the network handover is selected — nothing runs otherwise.
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof getChalkerHandover === 'function' && getChalkerHandover() === 'network') {
            NetworkClient.start();
        }
    }, 1000);
});
