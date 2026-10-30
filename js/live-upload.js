// live-upload.js - A slim copy of the tournament being played, on the server (Docs/HUB-DIRECTION.md, step 3)
//
// After every change (saveTournamentOnly() calls scheduleLiveUpload()) a snapshot of the loaded tournament
// is sent to api/live.php: on this computer's own server, and on the remote server when one is configured.
// Each send replaces the one before, so a dropped one is mended by the next; nothing is queued. The
// snapshot is slim on purpose: the players (with their statistics, for the leaderboard), the matches (state,
// score, lane, referee and what each one recorded in achievements) and the club's point values; no transaction
// history. A viewer, when there is one, lays it out with the bracket view and the leaderboard.
//
// Removable: nothing depends on this file. With the setting off (Global Settings → Server, off by default)
// or the file deleted, the Tournament Manager behaves exactly as before. It never alerts and never throws:
// a failed send is logged and the next change sends again.

const LIVE_DEBOUNCE_MS = 1500;

let _liveTimer = null;
let _liveSending = false;
let _liveDirty = false;
let _liveLastRev = 0;
let _liveLocalOff = false;          // this computer has no live.php (the page opened as a file, or a plain web server)
const _liveClosed = new Set();      // tournaments whose live copy was removed after the final upload

/** The match fields a viewer needs. Whitelisted: the live copy is public. */
const LIVE_MATCH_FIELDS = ['id', 'seId', 'numericId', 'round', 'side', 'group', 'cup', 'returnRound', 'legs',
    'player1', 'player2', 'winner', 'loser', 'completed', 'active', 'autoAdvanced', 'state', 'lane', 'referee',
    'finalScore', 'positionInRound', 'completedAt'];
/** The player fields a viewer needs: the statistics for the leaderboard, not the payment. */
const LIVE_PLAYER_FIELDS = ['id', 'name', 'isBye', 'seed', 'eliminated', 'placement', 'stats'];
/** A player in a match slot (or as its winner or loser): who, no statistics (they are on the player). */
const LIVE_SLOT_FIELDS = ['id', 'name', 'isBye', 'seed', 'eliminated', 'placement'];

function _livePick(obj, fields) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    fields.forEach(f => { if (obj[f] !== undefined) out[f] = obj[f]; });
    return out;
}

/** @returns {boolean} true when the setting is on */
function liveUploadEnabled() {
    return !!(config && config.server && config.server.liveUpload);
}

/**
 * The slim snapshot of the loaded tournament.
 * @returns {object|null} null when there is nothing to show yet (no bracket drawn)
 */
function buildLiveSnapshot() {
    if (!tournament || !tournament.id || !tournament.bracket) return null;
    const slimPlayer = p => {
        const out = _livePick(p, LIVE_PLAYER_FIELDS);
        if (out.stats) out.stats = JSON.parse(JSON.stringify(out.stats));
        return out;
    };
    // What each completed match recorded, from its transaction (the history itself is not sent), as { p1, p2 }
    const recorded = {};
    getTournamentHistory().forEach(t => {
        if (t.type === 'COMPLETE_MATCH' && t.achievements && !(t.matchId in recorded)) recorded[t.matchId] = t.achievements; // newest first
    });
    const slimMatch = m => {
        const out = _livePick(m, LIVE_MATCH_FIELDS);
        ['player1', 'player2', 'winner', 'loser'].forEach(k => { if (out[k]) out[k] = _livePick(out[k], LIVE_SLOT_FIELDS); });
        if (m.completed && recorded[m.id] && m.player1 && m.player2) {
            const ach = NewtonDB.slotAchievements(recorded[m.id], m.player1.id, m.player2.id);
            if (ach) out.achievements = ach;
        }
        return out;
    };
    _liveLastRev = Math.max(Date.now(), _liveLastRev + 1);
    return {
        id: tournament.id,
        rev: _liveLastRev,
        name: tournament.name,
        date: tournament.date,
        status: tournament.status,
        format: tournament.format,
        bracketSize: tournament.bracketSize,
        seeding: tournament.seeding,
        groups: tournament.groups,
        cups: tournament.cups,
        qualifiers: tournament.qualifiers,
        notQualified: tournament.notQualified,
        plate: tournament.plate,
        swiss: tournament.swiss,
        placements: tournament.placements || {},
        points: config && config.points ? JSON.parse(JSON.stringify(config.points)) : undefined, // the club's point values, for the leaderboard
        players: (Array.isArray(players) ? players : []).map(slimPlayer),
        matches: (Array.isArray(matches) ? matches : []).map(slimMatch),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Called after the tournament is saved: send a snapshot soon, once for a burst of changes.
 * @returns {void}
 */
function scheduleLiveUpload() {
    if (!liveUploadEnabled() || !tournament || tournament._analyticsPreview) return;
    if (tournament.status === 'active') _liveClosed.delete(tournament.id); // an undo reopened it
    clearTimeout(_liveTimer);
    _liveTimer = setTimeout(sendLiveUpload, LIVE_DEBOUNCE_MS);
}

/**
 * POST a body to live.php here and on the remote server (through the relay, which adds the key).
 * @param {object} body - { id, rev, snapshot } or { id, delete: true }
 * @returns {Promise<void>}
 */
async function _livePost(body) {
    const sends = [];
    if (!_liveLocalOff && location.protocol !== 'file:') {
        sends.push(fetch('/api/live.php', { method: 'POST', headers: apiWriteHeaders(), body: JSON.stringify(body) })
            .then(r => { if (r.status === 404 || r.status === 405 || r.status === 501) _liveLocalOff = true; })
            .catch(() => { /* no server here: normal */ }));
    }
    const remote = config && config.server && config.server.remoteUrl;
    if (remote) {
        sends.push(fetch('/api/relay.php', {
            method: 'POST',
            headers: apiWriteHeaders(),
            body: JSON.stringify({ url: remote.replace(/\/+$/, '') + '/api/live.php', apiKey: config.server.remoteApiKey || '', payload: body })
        }).catch(() => { /* unreachable now: the next change sends again */ }));
    }
    await Promise.all(sends);
}

/** Send the snapshot now. One send at a time; changes during a send are sent right after it. */
async function sendLiveUpload() {
    _liveTimer = null;
    if (_liveSending) { _liveDirty = true; return; }
    if (!liveUploadEnabled() || _liveClosed.has(tournament && tournament.id)) return;
    const snapshot = buildLiveSnapshot();
    if (!snapshot) return;
    _liveSending = true;
    try {
        await _livePost({ id: String(snapshot.id), rev: snapshot.rev, snapshot });
    } catch (e) {
        console.warn('Live upload failed:', e);
    } finally {
        _liveSending = false;
    }
    if (_liveDirty) { _liveDirty = false; scheduleLiveUpload(); }
}

/**
 * Remove a tournament's live copy (here and on the remote server): the tournament was reset or deleted.
 * @param {string|number} id
 * @returns {void}
 */
function liveUploadForget(id) {
    if (!liveUploadEnabled()) return;
    _liveClosed.add(id);
    _livePost({ id: String(id), delete: true });
}

/**
 * The final upload of a finished tournament succeeded: the final copy is the authoritative one, so the live
 * copy goes, on the destination it reached. Not before: a failed final upload leaves the live copy to show
 * the finished state.
 * @param {object} payload - { filename, data } of the final upload
 * @param {string} remoteUrl - the remote it went to, '' for this computer's own server
 * @returns {void}
 */
function liveUploadDone(payload, remoteUrl) {
    if (!liveUploadEnabled() || !payload || !payload.data || payload.data.status !== 'completed') return;
    const id = payload.data.id;
    _liveClosed.add(id);
    clearTimeout(_liveTimer);
    const body = JSON.stringify({ id: String(id), delete: true });
    if (remoteUrl) {
        fetch('/api/relay.php', {
            method: 'POST',
            headers: apiWriteHeaders(),
            body: JSON.stringify({ url: remoteUrl.replace(/\/+$/, '') + '/api/live.php', apiKey: (config.server && config.server.remoteApiKey) || '', payload: { id: String(id), delete: true } })
        }).catch(() => {});
    } else if (!_liveLocalOff && location.protocol !== 'file:') {
        fetch('/api/live.php', { method: 'POST', headers: apiWriteHeaders(), body }).catch(() => {});
    }
}
