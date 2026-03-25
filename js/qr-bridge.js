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
