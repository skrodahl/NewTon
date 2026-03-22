// qr-bridge.js — QR code generation for match assignment (TM → Chalker)
// Builds the assignment payload, signs it with CRC-32, and displays the QR code.

/**
 * Open the QR modal for a live match.
 * Shows a warning if lane or referee is not set.
 * @param {string} matchId
 */
function openMatchQR(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const warningEl = document.getElementById('matchQRWarning');
    const codeEl    = document.getElementById('matchQRCode');
    const titleEl   = document.getElementById('matchQRTitle');
    const subtitleEl = document.getElementById('matchQRSubtitle');

    // Reset state
    codeEl.innerHTML = '';
    warningEl.style.display = 'none';
    warningEl.textContent = '';

    // Require lane and referee
    if (!match.lane || !match.referee) {
        const missing = [];
        if (!match.lane)    missing.push('Lane');
        if (!match.referee) missing.push('Referee');
        titleEl.textContent    = 'QR Code Unavailable';
        subtitleEl.textContent = '';
        warningEl.textContent  = `${missing.join(' and ')} must be assigned before generating a QR code.`;
        warningEl.style.display = 'block';
        pushDialog('matchQRModal', null, true);
        return;
    }

    // Resolve referee name
    const refereePlayer = players.find(p => String(p.id) === String(match.referee));
    const refName = refereePlayer ? refereePlayer.name : String(match.referee);

    // Build and sign assignment payload
    const payload = NewtonIntegrity.sign({
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
        ln:  parseInt(match.lane),
        ref: refName,
        ts:  Math.floor(Date.now() / 1000)
    });

    const json = JSON.stringify(payload);

    // Generate QR code (qrcode-generator: typeNumber 0 = auto, EC level M)
    const qr = qrcode(0, 'M');
    qr.addData(json);
    qr.make();

    titleEl.textContent    = `${match.id} — Chalker QR`;
    subtitleEl.textContent = `${match.player1.name} vs ${match.player2.name} · Lane ${match.lane} · ${config.legs.x01Format || 501} Bo${match.legs || 3}`;
    codeEl.innerHTML       = qr.createSvgTag(6, 2);

    pushDialog('matchQRModal', null, true);
}

window.openMatchQR = openMatchQR;
