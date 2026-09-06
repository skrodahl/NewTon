/**
 * Chalker network client — collects match assignments and posts results back.
 *
 * Part of the `licensed/` directory. NOT covered by the project's BSD 3-Clause
 * licence; see ../LICENSE.md. Experimental proof of concept.
 *
 * Deliberately a poller rather than a live connection. A phone sleeps, backgrounds,
 * and roams between access points all evening; a socket has to survive all of that,
 * whereas a request that simply happens again in three seconds does not care. There
 * is no connection to lose, no reconnect logic, and no session to re-establish.
 *
 * Everything it moves is the payload the QR path already defines. It starts matches
 * through NewtonChalkerBridge and never touches scoring.
 */
(function () {
    'use strict';

    var API = '../licensed/api/v1/';
    var ASSIGNMENT_POLL_MS = 3000;
    var HEARTBEAT_MS = 10000;

    var _lane = null;
    var _deviceId = null;
    var _pollTimer = null;
    var _beatTimer = null;
    /** Match ids already acted on, so a still-queued assignment isn't started twice. */
    var _handled = {};

    /**
     * A stable id for this device.
     *
     * crypto.randomUUID() is undefined outside a secure context, and the LAN
     * deployment this is built for is plain http — so the fallback is the norm here,
     * not an edge case. Uniqueness only has to hold across the handful of phones in
     * one venue.
     *
     * @returns {string}
     */
    function deviceId() {
        if (_deviceId) return _deviceId;
        try {
            _deviceId = localStorage.getItem('chalker_device_id');
        } catch (e) { /* private mode */ }
        if (!_deviceId) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                _deviceId = crypto.randomUUID();
            } else {
                _deviceId = 'dev-' + Date.now().toString(36) + '-' +
                            Math.floor(Math.random() * 0xffffff).toString(36);
            }
            try { localStorage.setItem('chalker_device_id', _deviceId); } catch (e) { /* ignore */ }
        }
        return _deviceId;
    }

    /**
     * POST JSON, resolving to the parsed body or null.
     * Never rejects: a failed request on a flaky network is normal, not exceptional,
     * and the next poll is three seconds away.
     */
    function post(endpoint, body) {
        return fetch(API + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });
    }

    /** GET JSON, resolving to the parsed body or null. Same reasoning as post(). */
    function get(endpoint) {
        return fetch(API + endpoint, { headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; });
    }

    var bridge = function () { return window.NewtonChalkerBridge; };

    /** Tell the Tournament Manager this lane is still here, and what it is doing. */
    function heartbeat() {
        if (_lane === null) return;
        var b = bridge();
        var current = b ? b.getCurrentMatchId() : null;
        post('heartbeat.php', {
            lane: _lane,
            deviceId: deviceId(),
            status: (b && b.isIdle()) ? 'idle' : 'busy',
            matchId: current
        });
    }

    /**
     * Look for a match queued for this lane.
     *
     * The server does not clear an assignment when it is collected — losing a match
     * to a crashed read would be worse than reading it twice — so the client is
     * responsible for ignoring one it has already acted on, and for staying out of
     * the way while a match is in progress.
     */
    function pollAssignment() {
        if (_lane === null) return;
        var b = bridge();
        if (!b || !b.isIdle()) return;

        get('assign.php?lane=' + encodeURIComponent(_lane)).then(function (res) {
            if (!res || !res.ok || !res.assignment) return;

            var payload = res.assignment;
            if (!payload.mid || _handled[payload.mid]) return;

            // Verify exactly as a scanned QR would be — same signature, same check
            if (typeof NewtonIntegrity !== 'undefined' && !NewtonIntegrity.verify(payload)) {
                console.warn('Network assignment failed its integrity check; ignoring.');
                _handled[payload.mid] = true;
                return;
            }

            var again = bridge();
            if (!again || !again.isIdle()) return;   // a match started while we waited

            _handled[payload.mid] = true;
            again.startFromAssignment(payload);
        });
    }

    /** Send a finished match back. Retried by the TM's poll if it does not land. */
    function sendResult(payload) {
        if (!payload) return;
        post('result.php', { payload: payload }).then(function (res) {
            if (!res || !res.ok) {
                console.warn('Result did not reach the Tournament Manager; show the result QR instead.');
            }
        });
        heartbeat();
    }

    window.NewtonNetwork = {
        /**
         * Begin serving a lane. Called when the operator picks a lane in Network Mode.
         * @param {string|number} lane
         */
        start: function (lane) {
            _lane = parseInt(lane, 10);
            if (!_lane || _lane < 1) { _lane = null; return; }

            var b = bridge();
            if (b) b.onMatchComplete = sendResult;

            this.stopTimers();
            heartbeat();
            pollAssignment();
            _beatTimer = setInterval(heartbeat, HEARTBEAT_MS);
            _pollTimer = setInterval(pollAssignment, ASSIGNMENT_POLL_MS);
            console.log('[network] serving lane ' + _lane + ' as ' + deviceId());
        },

        /** Stop serving. The lane goes stale in the TM within the heartbeat timeout. */
        stop: function () {
            this.stopTimers();
            _lane = null;
        },

        stopTimers: function () {
            if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
            if (_beatTimer) { clearInterval(_beatTimer); _beatTimer = null; }
        },

        /** @returns {number|null} the lane being served */
        getLane: function () { return _lane; }
    };
})();
