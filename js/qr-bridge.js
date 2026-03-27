// qr-bridge.js — QR code generation for match assignment (TM → Chalker)
// Builds the assignment payload, signs it with CRC-32, and displays the QR code.

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
    codeEl.innerHTML       = qr.createSvgTag(6, 2);

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

    if (!('BarcodeDetector' in window)) {
        errorEl.textContent = 'QR scanning is not supported in this browser. Use Chrome or Edge.';
        errorEl.style.display = 'block';
        pushDialog('qrResultScanModal', null, true);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        videoEl.srcObject = stream;
        _resultScanStream = stream;
        pushDialog('qrResultScanModal', null, true);

        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        _resultScanInterval = setInterval(async () => {
            try {
                const codes = await detector.detect(videoEl);
                if (codes.length > 0) {
                    handleResultQRPayload(codes[0].rawValue, matchId);
                }
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
 * @param {object} payload
 */
function showResultQRPreview(payload) {
    const contentEl = document.getElementById('qrResultPreviewContent');

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
    document.getElementById('qrResultPreviewTitle').textContent = 'Result QR';
    contentEl.innerHTML = html;
    pushDialog('qrResultPreviewModal', null, true);
}

window.openResultQRScanner = openResultQRScanner;
window.stopResultQRScanner = stopResultQRScanner;

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

    if (!('BarcodeDetector' in window)) {
        errorEl.textContent = 'QR scanning is not supported in this browser. Use Chrome or Edge.';
        errorEl.style.display = 'block';
        pushDialog('qrResultScanModal', null, true);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        videoEl.srcObject = stream;
        _resultScanStream = stream;
        pushDialog('qrResultScanModal', null, true);

        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        _resultScanInterval = setInterval(async () => {
            try {
                const codes = await detector.detect(videoEl);
                if (codes.length > 0) {
                    handleQRInspectorPayload(codes[0].rawValue);
                }
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

    document.getElementById('qrResultPreviewTitle').textContent = 'QR Payload Inspector';
    contentEl.innerHTML = html;
    pushDialog('qrResultPreviewModal', null, true);
}

window.openQRInspector = openQRInspector;
