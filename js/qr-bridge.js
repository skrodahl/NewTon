// qr-bridge.js — QR code generation for match assignment (TM → Chalker)
// Builds the assignment payload, signs it with CRC-32, and displays the QR code.

// ---------------------------------------------------------------------------
// QR Detection Helper — BarcodeDetector with jsQR fallback
// ---------------------------------------------------------------------------

/** @type {HTMLCanvasElement|null} reusable canvas for jsQR fallback */
let _qrFallbackCanvas = null;

/**
 * Scan a video element for QR codes.
 * Uses native BarcodeDetector when available, falls back to jsQR.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<string|null>} decoded QR string, or null if nothing found
 */
async function detectQRCode(videoEl) {
    if ('BarcodeDetector' in window) {
        const detector = detectQRCode._detector || (detectQRCode._detector = new BarcodeDetector({ formats: ['qr_code'] }));
        const codes = await detector.detect(videoEl);
        return codes.length > 0 ? codes[0].rawValue : null;
    }
    // jsQR fallback — render video frame to canvas, decode from pixel data
    if (typeof jsQR === 'function') {
        if (!_qrFallbackCanvas) _qrFallbackCanvas = document.createElement('canvas');
        const w = videoEl.videoWidth;
        const h = videoEl.videoHeight;
        if (!w || !h) return null;
        _qrFallbackCanvas.width = w;
        _qrFallbackCanvas.height = h;
        const ctx = _qrFallbackCanvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h);
        return code ? code.data : null;
    }
    return null;
}

/**
 * Check if QR scanning is available (native or jsQR fallback).
 * @returns {boolean}
 */
function isQRScanAvailable() {
    return ('BarcodeDetector' in window) || (typeof jsQR === 'function');
}

/**
 * Open the QR modal for a live match.
 * Lane and referee are optional — included in the payload when assigned.
 * @param {string} matchId
 */
function openMatchQR(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const warningEl  = document.getElementById('matchQRWarning');
    const codeEl     = document.getElementById('matchQRCode');
    const titleEl    = document.getElementById('matchQRTitle');
    const subtitleEl = document.getElementById('matchQRSubtitle');

    // Reset state
    codeEl.innerHTML = '';
    warningEl.style.display = 'none';
    warningEl.textContent = '';

    // Resolve referee name (if assigned)
    let refName = null;
    if (match.referee) {
        const refereePlayer = players.find(p => String(p.id) === String(match.referee));
        refName = refereePlayer ? refereePlayer.name : String(match.referee);
    }

    // Build assignment payload — omit lane/referee if not assigned
    const payload = {
        v:   1,
        t:   'a',
        mid: match.id,
        tid: String(tournament.id),
        sid: config.server.serverId,
        p1:  match.player1.name,
        p2:  match.player2.name,
        sc:  config.legs.x01Format  || 501,
        bo:  match.legs             || 3,
        mr:  config.legs.maxRounds  || 13,
        ts:  Math.floor(Date.now() / 1000)
    };
    if (match.lane) payload.ln  = parseInt(match.lane);
    if (refName)    payload.ref = refName;

    const signed = NewtonIntegrity.sign(payload);
    const json   = JSON.stringify(signed);

    // Generate QR code (qrcode-generator: typeNumber 0 = auto, EC level M)
    const qr = qrcode(0, 'M');
    qr.addData(json);
    qr.make();

    // Build subtitle with available info
    const parts = [`${match.player1.name} vs ${match.player2.name}`];
    if (match.lane) parts.push(`Lane ${match.lane}`);
    parts.push(`${config.legs.x01Format || 501} Bo${match.legs || 3}`);
    if (refName) parts.push(`Ref: ${refName}`);

    titleEl.textContent    = `${match.id} — Chalker QR`;
    subtitleEl.textContent = parts.join(' · ');
    codeEl.innerHTML       = qr.createSvgTag(8, 2);

    pushDialog('matchQRModal', null, true);
}

window.openMatchQR = openMatchQR;

// ---------------------------------------------------------------------------
// Result QR Scanner (Chalker → TM)
// ---------------------------------------------------------------------------

/** @type {number|null} setInterval handle for the BarcodeDetector scan loop */
let _resultScanInterval = null;

/** @type {MediaStream|null} active camera stream */
let _resultScanStream = null;

/**
 * Open the result QR scanner camera modal.
 * matchId is known when called from winnerConfirmModal (validated against payload).
 * matchId is null when called from Match Controls (resolved from payload).
 * @param {string|null} matchId
 */
async function openResultQRScanner(matchId) {
    const videoEl = document.getElementById('qrResultScanVideo');
    const errorEl = document.getElementById('qrResultScanError');

    errorEl.style.display = 'none';
    errorEl.textContent = '';

    if (!isQRScanAvailable()) {
        errorEl.textContent = 'QR scanning is not available. Camera requires Chrome, Edge, or a secure context (HTTPS).';
        errorEl.style.display = 'block';
        pushDialog('qrResultScanModal', null, true);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        videoEl.srcObject = stream;
        _resultScanStream = stream;
        pushDialog('qrResultScanModal', null, true);

        _resultScanInterval = setInterval(async () => {
            try {
                const result = await detectQRCode(videoEl);
                if (result) handleResultQRPayload(result, matchId);
            } catch (_) { /* ignore per-frame errors */ }
        }, 300);
    } catch (err) {
        errorEl.textContent = `Camera error: ${err.name} — ${err.message}`;
        errorEl.style.display = 'block';
        pushDialog('qrResultScanModal', null, true);
    }
}

/**
 * Stop the camera stream and scan interval.
 */
function stopResultQRScanner() {
    clearInterval(_resultScanInterval);
    _resultScanInterval = null;
    if (_resultScanStream) {
        _resultScanStream.getTracks().forEach(t => t.stop());
        _resultScanStream = null;
    }
    const videoEl = document.getElementById('qrResultScanVideo');
    if (videoEl) videoEl.srcObject = null;
}

/**
 * Handle a raw QR scan value.
 * Validates CRC, type, tournament, server, and optionally match ID.
 * On success, stops camera and shows the result preview modal.
 * On failure, shows an inline error and keeps the camera open.
 * @param {string} rawValue
 * @param {string|null} expectedMatchId
 */
function handleResultQRPayload(rawValue, expectedMatchId) {
    let payload;
    try {
        payload = JSON.parse(rawValue);
    } catch (_) {
        showResultScanError('Invalid QR code. Please scan a NewTon result QR from the Chalker.');
        return;
    }

    if (payload.t !== 'r') {
        showResultScanError('Wrong QR type. Please scan a result QR from the Chalker.');
        return;
    }

    if (!NewtonIntegrity.verify(payload)) {
        showResultScanError('Integrity check failed. The QR code may be corrupted or tampered.');
        return;
    }

    if (payload.tid !== String(tournament.id)) {
        showResultScanError('Wrong tournament. This result belongs to a different tournament.');
        return;
    }

    if (payload.sid !== config.server.serverId) {
        showResultScanError('Wrong server. This result was not generated by this Tournament Manager.');
        return;
    }

    if (expectedMatchId && payload.mid !== expectedMatchId) {
        showResultScanError(`Match mismatch. Expected ${expectedMatchId}, got ${payload.mid}.`);
        return;
    }

    const match = matches.find(m => m.id === payload.mid);
    if (!match) {
        showResultScanError(`Match ${payload.mid} not found in this tournament.`);
        return;
    }

    // Valid — stop camera, close scan modal, show preview
    stopResultQRScanner();
    popDialog();
    showResultQRPreview(payload);
}

/**
 * Show an error message in the scan modal without closing it.
 * @param {string} message
 */
function showResultScanError(message) {
    const errorEl = document.getElementById('qrResultScanError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Decode a base64-encoded visit score string into an array of numbers.
 * @param {string} encoded
 * @returns {number[]}
 */
function decodeVisitScores(encoded) {
    try {
        const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
        return Array.from(bytes);
    } catch (_) {
        return [];
    }
}

/**
 * Populate and open the result preview modal with decoded payload data.
 * If the referenced match is live, also shows extracted achievements,
 * lollipop counters, and completion buttons.
 * @param {object} payload
 */
function showResultQRPreview(payload) {
    const contentEl  = document.getElementById('qrResultPreviewContent');
    const actionsEl  = document.getElementById('qrResultPreviewActions');

    // Determine if this match can be completed from here
    const match      = matches.find(m => m.id === payload.mid);
    const isLive     = match && getMatchState(match) === 'live';

    // Store for use by completion buttons
    _qrCompletionPayload = isLive ? payload : null;
    _qrLollipops = [0, 0];

    const winnerName = payload.w === 1 ? payload.p1 : payload.p2;
    let p1Legs = 0, p2Legs = 0;
    payload.legs.forEach(l => { if (l.w === 1) p1Legs++; else p2Legs++; });

    let html = `<div class="qr-result-header">
        <div class="qr-result-match">${payload.mid} &mdash; ${payload.sc} Bo${payload.bo}</div>
        <div class="qr-result-winner"><strong>${winnerName}</strong> wins ${p1Legs}&ndash;${p2Legs}</div>
    </div>
    <table class="qr-result-legs">
        <thead><tr>
            <th>#</th>
            <th>Winner</th>
            <th>${payload.p1}</th>
            <th>${payload.p2}</th>
            <th>CD</th>
        </tr></thead>
        <tbody>`;

    payload.legs.forEach((leg, i) => {
        const [enc1, enc2] = leg.s.split('|');
        const v1 = decodeVisitScores(enc1);
        const v2 = decodeVisitScores(enc2);
        const legWinnerName = leg.w === 1 ? payload.p1 : payload.p2;
        const cd = leg.cd === 0 ? 'TB' : String(leg.cd);
        html += `<tr>
            <td>${i + 1}</td>
            <td>${legWinnerName}</td>
            <td class="qr-visits">${v1.join(', ')}</td>
            <td class="qr-visits">${v2.join(', ')}</td>
            <td>${cd}</td>
        </tr>`;
    });

    html += '</tbody></table>';

    // --- Achievements section (only for live matches) ---
    if (isLive) {
        const threshold = (config.legs && config.legs.shortLegThreshold) || 21;
        const s1 = NewtonStats.extractAchievements(payload.legs, 0, threshold);
        const s2 = NewtonStats.extractAchievements(payload.legs, 1, threshold);
        const hasAny = NewtonStats.hasAny(s1) || NewtonStats.hasAny(s2);

        html += `<div class="completion-achievements-box" style="margin-top:16px;">
            <div class="completion-achievements-title">Achievements from this match</div>`;

        html += `<table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr>
                <th style="text-align:left;padding:4px 8px;">Achievement</th>
                <th style="text-align:center;padding:4px 8px;">${payload.p1}</th>
                <th style="text-align:center;padding:4px 8px;">${payload.p2}</th>
            </tr></thead><tbody>`;

        const rows = [
            ['180s',        s1.oneEighties,                    s2.oneEighties],
            ['Tons',           s1.tons,                        s2.tons],
            ['High outs',   s1.highOuts.join(', ') || '—',     s2.highOuts.join(', ') || '—'],
            ['Short legs',  s1.shortLegs.join(', ') || '—',    s2.shortLegs.join(', ') || '—'],
        ];
        rows.forEach(([label, v1, v2]) => {
            html += `<tr>
                <td style="padding:3px 8px;">${label}</td>
                <td style="text-align:center;padding:3px 8px;">${v1}</td>
                <td style="text-align:center;padding:3px 8px;">${v2}</td>
            </tr>`;
        });

        // Lollipop row — only shown if at least one player had a visit of 3
        const p1Has3 = payload.legs.some(leg => { const [e1] = leg.s.split('|'); return decodeVisitScores(e1).includes(3); });
        const p2Has3 = payload.legs.some(leg => { const parts = leg.s.split('|'); return decodeVisitScores(parts[1] || '').includes(3); });
        if (p1Has3 || p2Has3) {
            const p1Cell = p1Has3
                ? `<button class="btn" onclick="qrDecrementLollipop(0)" style="width:24px;height:24px;padding:0;margin-right:2px;display:inline-flex;align-items:center;justify-content:center;color:#dc2626;border-color:#dc2626;">−</button>
                   <span id="qrLollipop0" style="display:inline-block;min-width:20px;text-align:center;">0</span>
                   <button class="btn" onclick="qrIncrementLollipop(0)" style="width:24px;height:24px;padding:0;margin-left:1px;display:inline-flex;align-items:center;justify-content:center;color:#166534;border-color:#166534;">+</button>`
                : '—';
            const p2Cell = p2Has3
                ? `<button class="btn" onclick="qrDecrementLollipop(1)" style="width:24px;height:24px;padding:0;margin-right:2px;display:inline-flex;align-items:center;justify-content:center;color:#dc2626;border-color:#dc2626;">−</button>
                   <span id="qrLollipop1" style="display:inline-block;min-width:20px;text-align:center;">0</span>
                   <button class="btn" onclick="qrIncrementLollipop(1)" style="width:24px;height:24px;padding:0;margin-left:1px;display:inline-flex;align-items:center;justify-content:center;color:#166534;border-color:#166534;">+</button>`
                : '—';
            html += `<tr>
                <td style="padding:3px 8px;">Lollipops</td>
                <td style="text-align:center;padding:3px 4px;">${p1Cell}</td>
                <td style="text-align:center;padding:3px 4px;">${p2Cell}</td>
            </tr>`;
        }

        html += '</tbody></table>';

        if (!hasAny && !(p1Has3 || p2Has3)) {
            html += `<p style="font-size:13px;color:#6b7280;margin:6px 0 0;">No achievements detected in this match.</p>`;
        } else if (!hasAny) {
            html += `<p style="font-size:13px;color:#6b7280;margin:6px 0 0;">No automatic achievements detected. Add lollipops manually if needed.</p>`;
        }

        html += '</div>';
    }

    // --- Status message when completion is not available ---
    if (!isLive) {
        let reason = '';
        if (payload.tid !== String(tournament.id)) {
            reason = 'This result belongs to a different tournament.';
        } else if (payload.sid !== config.server.serverId) {
            reason = 'This result was generated by a different Tournament Manager instance.';
        } else if (!match) {
            reason = `Match ${payload.mid} was not found in this tournament.`;
        } else {
            const state = getMatchState(match);
            if (state === 'completed') {
                reason = `Match ${payload.mid} has already been completed.`;
            } else if (state === 'pending') {
                reason = `Match ${payload.mid} is not yet ready — waiting for players to advance.`;
            } else if (state === 'ready') {
                reason = `Match ${payload.mid} has not been started yet.`;
            } else {
                reason = `Match ${payload.mid} is not in a live state (current state: ${state}).`;
            }
        }
        html += `<p style="color:#92400e;font-style:italic;margin-top:16px;">${reason} This result cannot be applied from here.</p>`;
    }

    document.getElementById('qrResultPreviewTitle').textContent = isLive ? 'Complete Match via QR' : 'Result QR';
    contentEl.innerHTML = html;

    // --- Action buttons ---
    if (isLive) {
        actionsEl.innerHTML = `
            <button class="btn btn-secondary" onclick="popDialog()">Cancel</button>
            <button class="btn" onclick="applyQRResult(false)">Score only</button>
            <button class="btn btn-primary" onclick="applyQRResult(true)">Score + achievements</button>`;
    } else {
        actionsEl.innerHTML = `<button class="btn" onclick="popDialog()">Close</button>`;
    }

    pushDialog('qrResultPreviewModal', null, true);
}

/**
 * Increment lollipop counter for one player.
 * @param {number} idx - 0 for p1, 1 for p2
 */
function qrIncrementLollipop(idx) {
    _qrLollipops[idx]++;
    const el = document.getElementById(`qrLollipop${idx}`);
    if (el) el.textContent = _qrLollipops[idx];
}

/**
 * Decrement lollipop counter for one player (minimum 0).
 * @param {number} idx - 0 for p1, 1 for p2
 */
function qrDecrementLollipop(idx) {
    if (_qrLollipops[idx] > 0) _qrLollipops[idx]--;
    const el = document.getElementById(`qrLollipop${idx}`);
    if (el) el.textContent = _qrLollipops[idx];
}

/**
 * Apply achievements from the QR payload to a player's stats object.
 * Adds to existing values.
 * @param {object} player
 * @param {{ oneEighties, tons, highOuts, shortLegs, lollipops }} stats
 */
function applyAchievementsToPlayer(player, stats) {
    if (!player || !player.stats || !stats) return;
    player.stats.oneEighties = (player.stats.oneEighties || 0) + (stats.oneEighties || 0);
    player.stats.tons        = (player.stats.tons        || 0) + (stats.tons        || 0);
    player.stats.lollipops   = (player.stats.lollipops   || 0) + (stats.lollipops   || 0);
    if (stats.highOuts && stats.highOuts.length) {
        player.stats.highOuts = (player.stats.highOuts || []).concat(stats.highOuts);
    }
    if (stats.shortLegs && stats.shortLegs.length) {
        player.stats.shortLegs = (player.stats.shortLegs || []).concat(stats.shortLegs);
    }
}

/**
 * Complete the match from the QR payload.
 * @param {boolean} includeAchievements - whether to extract and apply achievements
 */
function applyQRResult(includeAchievements) {
    const payload = _qrCompletionPayload;
    if (!payload) return;

    const match = matches.find(m => m.id === payload.mid);
    if (!match || getMatchState(match) !== 'live') return;

    let p1Legs = 0, p2Legs = 0;
    payload.legs.forEach(l => { if (l.w === 1) p1Legs++; else p2Legs++; });
    const winnerPlayerNumber = payload.w; // 1 or 2
    const winnerLegs = winnerPlayerNumber === 1 ? p1Legs : p2Legs;
    const loserLegs  = winnerPlayerNumber === 1 ? p2Legs : p1Legs;

    let achievements = null;

    if (includeAchievements) {
        const threshold = (config.legs && config.legs.shortLegThreshold) || 21;
        const s1 = NewtonStats.extractAchievements(payload.legs, 0, threshold);
        const s2 = NewtonStats.extractAchievements(payload.legs, 1, threshold);
        s1.lollipops = _qrLollipops[0];
        s2.lollipops = _qrLollipops[1];

        // Resolve actual player objects from the match
        const p1 = players.find(p => String(p.id) === String(match.player1.id));
        const p2 = players.find(p => String(p.id) === String(match.player2.id));

        if (p1) applyAchievementsToPlayer(p1, s1);
        if (p2) applyAchievementsToPlayer(p2, s2);

        // Build achievements map keyed by player ID (for transaction record)
        achievements = {};
        if (p1 && NewtonStats.hasAny(s1)) achievements[String(p1.id)] = s1;
        if (p2 && NewtonStats.hasAny(s2)) achievements[String(p2.id)] = s2;
        if (Object.keys(achievements).length === 0) achievements = null;
    }

    popDialog();
    completeMatch(payload.mid, winnerPlayerNumber, winnerLegs, loserLegs, 'QR', achievements, payload.legs || null, payload.fls || null);
    renderBracket();
    refreshTournamentUI();

    // Refresh Match Controls if it is currently open
    const ccIsOpen = window.dialogStack && window.dialogStack.some(d => d.id === 'matchCommandCenterModal');
    if (ccIsOpen && typeof showMatchCommandCenter === 'function') {
        showMatchCommandCenter();
    }
}

window.openResultQRScanner = openResultQRScanner;
window.stopResultQRScanner = stopResultQRScanner;

/** @type {[number, number]} lollipop counters for [p1, p2] in the preview modal */
let _qrLollipops = [0, 0];

/** @type {object|null} the validated payload currently shown in the preview modal */
let _qrCompletionPayload = null;

// ---------------------------------------------------------------------------
// QR Inspector (Developer Console — Validate Stats QR)
// ---------------------------------------------------------------------------

/**
 * Open the result QR scanner in inspector mode.
 * CRC-only validation — no tid/sid/mid blocking.
 * Shows full raw payload with per-field validation status.
 */
async function openQRInspector() {
    const videoEl = document.getElementById('qrResultScanVideo');
    const errorEl = document.getElementById('qrResultScanError');

    errorEl.style.display = 'none';
    errorEl.textContent = '';

    if (!isQRScanAvailable()) {
        errorEl.textContent = 'QR scanning is not available. Camera requires Chrome, Edge, or a secure context (HTTPS).';
        errorEl.style.display = 'block';
        pushDialog('qrResultScanModal', null, true);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        videoEl.srcObject = stream;
        _resultScanStream = stream;
        pushDialog('qrResultScanModal', null, true);

        _resultScanInterval = setInterval(async () => {
            try {
                const result = await detectQRCode(videoEl);
                if (result) handleQRInspectorPayload(result);
            } catch (_) { /* ignore per-frame errors */ }
        }, 300);
    } catch (err) {
        errorEl.textContent = `Camera error: ${err.name} — ${err.message}`;
        errorEl.style.display = 'block';
        pushDialog('qrResultScanModal', null, true);
    }
}

/**
 * Handle a scanned QR in inspector mode.
 * Shows full raw payload with validation status for each check.
 * Never blocks — always shows what arrived.
 * @param {string} rawValue
 */
function handleQRInspectorPayload(rawValue) {
    stopResultQRScanner();
    popDialog();

    const contentEl = document.getElementById('qrResultPreviewContent');

    let payload;
    try {
        payload = JSON.parse(rawValue);
    } catch (_) {
        contentEl.innerHTML = '<p style="color:#dc2626;">Could not parse QR data as JSON.</p><pre style="font-size:12px;overflow-x:auto;">' + rawValue + '</pre>';
        pushDialog('qrResultPreviewModal', null, true);
        return;
    }

    const ok  = '<span style="color:#065f46;font-weight:600;">✓</span>';
    const err = '<span style="color:#dc2626;font-weight:600;">✗</span>';

    const crcValid   = NewtonIntegrity.verify(payload);
    const tidMatch   = payload.tid === String(tournament.id);
    const sidMatch   = payload.sid === config.server.serverId;
    const isResult   = payload.t === 'r';
    const matchFound = payload.mid ? !!matches.find(m => m.id === payload.mid) : false;

    const fmtTs = payload.ts ? new Date(payload.ts * 1000).toLocaleString() : '—';
    const firstStarter = payload.fls ? (payload.fls === 1 ? payload.p1 : payload.p2) : '—';

    let html = `
        <div class="qr-result-header">
            <div class="qr-result-match">QR Payload Inspector</div>
        </div>

        <table class="qr-result-legs" style="margin-bottom:16px;">
            <thead><tr><th colspan="2">This Tournament Manager</th></tr></thead>
            <tbody>
                <tr><td>Tournament ID</td><td style="font-family:monospace;">${tournament.id}</td></tr>
                <tr><td>Server ID</td><td style="font-family:monospace;">${config.server.serverId}</td></tr>
            </tbody>
        </table>

        <table class="qr-result-legs" style="margin-bottom:16px;">
            <thead><tr><th>Field</th><th>Value</th><th>Check</th></tr></thead>
            <tbody>
                <tr><td>Type <code>t</code></td><td>${payload.t ?? '—'}</td><td>${payload.t === 'r' ? ok + ' Result QR' : payload.t === 'a' ? ok + ' Assignment QR' : err + ' unknown type'}</td></tr>
                <tr><td>CRC</td><td style="font-family:monospace;">${payload.crc ?? '—'}</td><td>${crcValid ? ok + ' valid' : err + ' FAILED'}</td></tr>
                <tr><td>Version <code>v</code></td><td>${payload.v ?? '—'}</td><td></td></tr>
                <tr><td>Match <code>mid</code></td><td>${payload.mid ?? '—'}</td><td>${matchFound ? ok + ' found' : err + ' not in tournament'}</td></tr>
                <tr><td>Tournament <code>tid</code></td><td style="font-family:monospace;">${payload.tid ?? '—'}</td><td>${tidMatch ? ok + ' match' : err + ' mismatch'}</td></tr>
                <tr><td>Server <code>sid</code></td><td style="font-family:monospace;">${payload.sid ?? '—'}</td><td>${sidMatch ? ok + ' match' : err + ' mismatch'}</td></tr>
                <tr><td>Timestamp <code>ts</code></td><td>${fmtTs}</td><td></td></tr>
                <tr><td>Player 1 <code>p1</code></td><td>${payload.p1 ?? '—'}</td><td></td></tr>
                <tr><td>Player 2 <code>p2</code></td><td>${payload.p2 ?? '—'}</td><td></td></tr>
                <tr><td>Winner <code>w</code></td><td>${payload.w ?? '—'}</td><td></td></tr>
                <tr><td>First starter <code>fls</code></td><td>${firstStarter}</td><td></td></tr>
                <tr><td>Format <code>sc</code></td><td>${payload.sc ?? '—'}</td><td></td></tr>
                <tr><td>Best-of <code>bo</code></td><td>${payload.bo ?? '—'}</td><td></td></tr>
                <tr><td>Max rounds <code>mr</code></td><td>${payload.mr ?? '—'}</td><td></td></tr>
                ${payload.ln  ? `<tr><td>Lane <code>ln</code></td><td>${payload.ln}</td><td></td></tr>` : ''}
                ${payload.ref ? `<tr><td>Referee <code>ref</code></td><td>${payload.ref}</td><td></td></tr>` : ''}
                ${payload.t1  ? `<tr><td>Team 1 <code>t1</code></td><td>${payload.t1}</td><td></td></tr>` : ''}
                ${payload.t2  ? `<tr><td>Team 2 <code>t2</code></td><td>${payload.t2}</td><td></td></tr>` : ''}
            </tbody>
        </table>`;

    if (Array.isArray(payload.legs)) {
        let p1Legs = 0, p2Legs = 0;
        payload.legs.forEach(l => { if (l.w === 1) p1Legs++; else p2Legs++; });

        html += `<div class="qr-result-winner" style="margin-bottom:8px;"><strong>${payload.w === 1 ? payload.p1 : payload.p2}</strong> wins ${p1Legs}&ndash;${p2Legs}</div>`;
        html += `<table class="qr-result-legs">
            <thead><tr>
                <th>#</th><th>Winner</th><th>First</th>
                <th>${payload.p1 ?? 'P1'}</th>
                <th>${payload.p2 ?? 'P2'}</th>
                <th>CD</th>
            </tr></thead><tbody>`;

        payload.legs.forEach((leg, i) => {
            const [enc1, enc2] = (leg.s || '|').split('|');
            const v1 = decodeVisitScores(enc1 || '');
            const v2 = decodeVisitScores(enc2 || '');
            const legWinner = leg.w === 1 ? payload.p1 : payload.p2;
            const throwsFirst = ((payload.fls - 1 + i) % 2 === 0) ? payload.p1 : payload.p2;
            const cd = leg.cd === 0 ? 'TB' : String(leg.cd);
            html += `<tr>
                <td>${i + 1}</td>
                <td>${legWinner}</td>
                <td>${throwsFirst}</td>
                <td class="qr-visits">${v1.join(', ')}</td>
                <td class="qr-visits">${v2.join(', ')}</td>
                <td>${cd}</td>
            </tr>`;
        });

        html += '</tbody></table>';
    }

    // Completion support: offer buttons if this is a valid result for a live match in this TM
    const canComplete = crcValid && tidMatch && sidMatch && isResult &&
                        matchFound && Array.isArray(payload.legs) &&
                        getMatchState(matches.find(m => m.id === payload.mid)) === 'live';

    if (canComplete) {
        const threshold = (config.legs && config.legs.shortLegThreshold) || 21;
        const s1 = NewtonStats.extractAchievements(payload.legs, 0, threshold);
        const s2 = NewtonStats.extractAchievements(payload.legs, 1, threshold);
        const hasAny = NewtonStats.hasAny(s1) || NewtonStats.hasAny(s2);

        html += `<div class="completion-achievements-box" style="margin-top:16px;">
            <div class="completion-achievements-title">Achievements from this match</div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead><tr>
                    <th style="text-align:left;padding:4px 8px;">Achievement</th>
                    <th style="text-align:center;padding:4px 8px;">${payload.p1 ?? 'P1'}</th>
                    <th style="text-align:center;padding:4px 8px;">${payload.p2 ?? 'P2'}</th>
                </tr></thead><tbody>
                <tr><td style="padding:3px 8px;">180s</td><td style="text-align:center;">${s1.oneEighties}</td><td style="text-align:center;">${s2.oneEighties}</td></tr>
                <tr><td style="padding:3px 8px;">Tons</td><td style="text-align:center;">${s1.tons}</td><td style="text-align:center;">${s2.tons}</td></tr>
                <tr><td style="padding:3px 8px;">High outs</td><td style="text-align:center;">${s1.highOuts.join(', ') || '—'}</td><td style="text-align:center;">${s2.highOuts.join(', ') || '—'}</td></tr>
                <tr><td style="padding:3px 8px;">Short legs</td><td style="text-align:center;">${s1.shortLegs.join(', ') || '—'}</td><td style="text-align:center;">${s2.shortLegs.join(', ') || '—'}</td></tr>
            ${(() => {
                const ip1 = payload.legs.some(leg => { const [e1] = leg.s.split('|'); return decodeVisitScores(e1).includes(3); });
                const ip2 = payload.legs.some(leg => { const parts = leg.s.split('|'); return decodeVisitScores(parts[1] || '').includes(3); });
                if (!ip1 && !ip2) return '';
                const c1 = ip1
                    ? '<button class="btn" onclick="qrDecrementLollipop(0)" style="width:24px;height:24px;padding:0;margin-right:2px;display:inline-flex;align-items:center;justify-content:center;color:#dc2626;border-color:#dc2626;">−</button><span id="qrLollipop0" style="display:inline-block;min-width:20px;text-align:center;">0</span><button class="btn" onclick="qrIncrementLollipop(0)" style="width:24px;height:24px;padding:0;margin-left:1px;display:inline-flex;align-items:center;justify-content:center;color:#166534;border-color:#166534;">+</button>'
                    : '—';
                const c2 = ip2
                    ? '<button class="btn" onclick="qrDecrementLollipop(1)" style="width:24px;height:24px;padding:0;margin-right:2px;display:inline-flex;align-items:center;justify-content:center;color:#dc2626;border-color:#dc2626;">−</button><span id="qrLollipop1" style="display:inline-block;min-width:20px;text-align:center;">0</span><button class="btn" onclick="qrIncrementLollipop(1)" style="width:24px;height:24px;padding:0;margin-left:1px;display:inline-flex;align-items:center;justify-content:center;color:#166534;border-color:#166534;">+</button>'
                    : '—';
                return `<tr><td style="padding:3px 8px;">Lollipops</td><td style="text-align:center;padding:3px 4px;">${c1}</td><td style="text-align:center;padding:3px 4px;">${c2}</td></tr>`;
            })()}
            </tbody></table>
            ${!hasAny ? '<p style="font-size:13px;color:#6b7280;margin:6px 0 0;">No automatic achievements detected. Add lollipops manually if needed.</p>' : ''}
        </div>`;
    }

    _qrCompletionPayload = canComplete ? payload : null;
    _qrLollipops = [0, 0];

    const actionsEl = document.getElementById('qrResultPreviewActions');
    document.getElementById('qrResultPreviewTitle').textContent = canComplete ? 'Inspector — Complete Match' : 'QR Payload Inspector';
    contentEl.innerHTML = html;

    if (canComplete) {
        actionsEl.innerHTML = `
            <button class="btn btn-secondary" onclick="popDialog()">Cancel</button>
            <button class="btn" onclick="applyQRResult(false)">Score only</button>
            <button class="btn btn-primary" onclick="applyQRResult(true)">Score + achievements</button>`;
    } else {
        actionsEl.innerHTML = `<button class="btn" onclick="popDialog()">Close</button>`;
    }

    pushDialog('qrResultPreviewModal', null, true);
}

window.openQRInspector = openQRInspector;
window.qrIncrementLollipop = qrIncrementLollipop;
window.qrDecrementLollipop = qrDecrementLollipop;
window.applyQRResult = applyQRResult;
