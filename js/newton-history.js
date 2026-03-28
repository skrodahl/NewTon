// newton-history.js — History UI for NewtonMatchDB
// Read-only views: Tournament list → Match list → Match detail
// Only shows finalized tournaments (status: 'final')

const NewtonHistory = (() => {

    /** Currently selected tournament record (for match list context) */
    let _activeTournament = null;

    // ---------------------------------------------------------------------------
    // Entry point — called by showPage('history') hook in main.js
    // ---------------------------------------------------------------------------

    /**
     * Render the history page. Always starts at tournament list.
     */
    async function render() {
        showPanel('tournamentList');
        await renderTournamentList();
    }

    // ---------------------------------------------------------------------------
    // Panel visibility
    // ---------------------------------------------------------------------------

    function showPanel(name) {
        ['tournamentList', 'matchList', 'matchDetail'].forEach(p => {
            document.getElementById(`history${cap(p)}`).style.display = p === name ? '' : 'none';
        });
    }

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // ---------------------------------------------------------------------------
    // Tournament list
    // ---------------------------------------------------------------------------

    async function renderTournamentList() {
        const el = document.getElementById('historyTournamentListBody');
        el.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:24px;">Loading…</td></tr>';

        let tournaments;
        try {
            tournaments = await NewtonDB.getFinalTournaments();
        } catch (e) {
            el.innerHTML = `<tr><td colspan="6" style="color:#dc2626;padding:16px;">Could not load history: ${e.message}</td></tr>`;
            return;
        }

        if (tournaments.length === 0) {
            el.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:24px;">No completed tournaments yet. Close a tournament to register it here.</td></tr>';
            return;
        }

        el.innerHTML = tournaments.map(t => {
            const date    = t.closedAt ? new Date(t.closedAt * 1000).toLocaleDateString() : '—';
            const format  = t.tournamentFormat || '—';
            const players = t.playerCount || '—';
            return `<tr class="history-row" onclick="NewtonHistory.openTournament('${t.tournamentId}')">
                <td>${escHtml(t.tournamentName || t.tournamentId)}</td>
                <td>${format}</td>
                <td>${date}</td>
                <td style="text-align:center;">${players}</td>
                <td style="text-align:center;"><span class="history-type-badge history-type-final">Final</span></td>
                <td style="text-align:center;"><button class="btn btn-sm" onclick="event.stopPropagation();NewtonHistory.openTournament('${t.tournamentId}')">View →</button></td>
            </tr>`;
        }).join('');
    }

    // ---------------------------------------------------------------------------
    // Match list
    // ---------------------------------------------------------------------------

    async function openTournament(tournamentId) {
        let tournament;
        try {
            tournament = await NewtonDB.getTournament(tournamentId);
        } catch (e) {
            alert('Could not load tournament: ' + e.message);
            return;
        }
        if (!tournament) { alert('Tournament not found.'); return; }

        _activeTournament = tournament;

        let matchRecords;
        try {
            matchRecords = await NewtonDB.getMatchesByTournament(tournamentId);
        } catch (e) {
            alert('Could not load matches: ' + e.message);
            return;
        }

        // Filter to final records only, sort by completedAt
        const finalMatches = matchRecords
            .filter(m => m.status === 'final')
            .sort((a, b) => a.completedAt - b.completedAt);

        document.getElementById('historyMatchListTitle').textContent = escHtml(tournament.tournamentName || tournamentId);
        document.getElementById('historyMatchListMeta').textContent =
            `${tournament.tournamentFormat || ''} · ${tournament.playerCount || '?'} players · ${tournament.closedAt ? new Date(tournament.closedAt * 1000).toLocaleDateString() : ''}`;

        const el = document.getElementById('historyMatchListBody');

        if (finalMatches.length === 0) {
            el.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:24px;">No match records found.</td></tr>';
        } else {
            el.innerHTML = finalMatches.map(m => {
                const winner = m.winner === 1 ? m.player1Name : m.player2Name;
                const legs   = m.legsWon ? `${m.legsWon.p1}–${m.legsWon.p2}` : '—';
                const type   = m.matchType === 'CHALKER'
                    ? '<span class="history-type-badge history-type-chalker">Chalker</span>'
                    : '<span class="history-type-badge history-type-manual">Manual</span>';
                const date   = m.completedAt ? new Date(m.completedAt * 1000).toLocaleDateString() : '—';
                return `<tr class="history-row" onclick="NewtonHistory.openMatch('${escHtml(tournamentId)}', '${escHtml(m.matchId)}')">
                    <td style="font-family:monospace;font-size:13px;">${escHtml(m.matchId)}</td>
                    <td>${escHtml(m.player1Name)}</td>
                    <td>${escHtml(m.player2Name)}</td>
                    <td><strong>${escHtml(winner)}</strong> ${legs}</td>
                    <td>${type}</td>
                    <td>${date}</td>
                </tr>`;
            }).join('');
        }

        showPanel('matchList');
    }

    // ---------------------------------------------------------------------------
    // Match detail
    // ---------------------------------------------------------------------------

    async function openMatch(tournamentId, matchId) {
        let match;
        try {
            match = await NewtonDB.getMatch(tournamentId, matchId);
        } catch (e) {
            alert('Could not load match: ' + e.message);
            return;
        }
        if (!match) { alert('Match record not found.'); return; }

        const titleEl = document.getElementById('historyMatchDetailTitle');
        const bodyEl  = document.getElementById('historyMatchDetailBody');

        const winnerName = match.winner === 1 ? match.player1Name : match.player2Name;
        const legs       = match.legsWon ? `${match.legsWon.p1}–${match.legsWon.p2}` : '—';
        const date       = match.completedAt ? new Date(match.completedAt * 1000).toLocaleString() : '—';
        const typeBadge  = match.matchType === 'CHALKER'
            ? '<span class="history-type-badge history-type-chalker">Chalker</span>'
            : '<span class="history-type-badge history-type-manual">Manual</span>';

        titleEl.textContent = `${match.matchId} — ${match.player1Name} vs ${match.player2Name}`;

        // Wire back button to return to match list for this tournament
        const backBtn = document.getElementById('historyMatchDetailBackBtn');
        if (backBtn) backBtn.onclick = () => openTournament(tournamentId);

        bodyEl.innerHTML = _buildMatchDetailHtml(match);
        showPanel('matchDetail');
    }

    // ---------------------------------------------------------------------------
    // Shared match detail HTML builder
    // ---------------------------------------------------------------------------

    function _buildMatchDetailHtml(match) {
        const winnerName = match.winner === 1 ? match.player1Name : match.player2Name;
        const legs       = match.legsWon ? `${match.legsWon.p1}–${match.legsWon.p2}` : '—';
        const date       = match.completedAt ? new Date(match.completedAt * 1000).toLocaleString() : '—';
        const typeBadge  = match.matchType === 'CHALKER'
            ? '<span class="history-type-badge history-type-chalker">Chalker</span>'
            : '<span class="history-type-badge history-type-manual">Manual</span>';

        let html = `<div class="history-detail-header">
            <div>${typeBadge} &nbsp; ${escHtml(match.format ? `${match.format.sc} Bo${match.format.bo}` : '')} &nbsp; ${date}</div>
            <div style="margin-top:8px;font-size:16px;"><strong>${escHtml(winnerName)}</strong> wins ${legs}</div>
        </div>`;

        // Legs table (Chalker only)
        if (match.matchType === 'CHALKER' && Array.isArray(match.legs) && match.legs.length > 0) {
            html += `<h4 style="margin:16px 0 6px;">Legs</h4>
            <div style="overflow-x:auto;">
            <table class="qr-result-legs">
                <thead><tr>
                    <th>#</th><th>Winner</th><th>First</th>
                    <th>${escHtml(match.player1Name)}</th>
                    <th>${escHtml(match.player2Name)}</th>
                    <th>CD</th>
                </tr></thead><tbody>`;

            match.legs.forEach((leg, i) => {
                const fls = match.firstStarter || 1;
                const throwsFirst = ((fls - 1 + i) % 2 === 0) ? match.player1Name : match.player2Name;
                const legWinner   = leg.w === 1 ? match.player1Name : match.player2Name;
                const cd          = leg.cd === 0 ? 'TB' : String(leg.cd);

                let v1 = [], v2 = [];
                try {
                    const parts = (leg.s || '|').split('|');
                    v1 = Array.from(Uint8Array.from(atob(parts[0] || ''), c => c.charCodeAt(0)));
                    v2 = Array.from(Uint8Array.from(atob(parts[1] || ''), c => c.charCodeAt(0)));
                } catch (_) {}

                html += `<tr>
                    <td>${i + 1}</td>
                    <td>${escHtml(legWinner)}</td>
                    <td>${escHtml(throwsFirst)}</td>
                    <td class="qr-visits">${v1.join(', ') || '—'}</td>
                    <td class="qr-visits">${v2.join(', ') || '—'}</td>
                    <td>${cd}</td>
                </tr>`;
            });

            html += '</tbody></table></div>';
        }

        // Achievements
        const ach = match.achievements;
        if (ach) {
            const a1 = (ach.p1 || ach[match.player1Id]) || null;
            const a2 = (ach.p2 || ach[match.player2Id]) || null;
            if (a1 || a2) {
                html += `<h4 style="margin:16px 0 6px;">Achievements</h4>
                <table class="qr-result-legs">
                    <thead><tr>
                        <th style="text-align:left;">Achievement</th>
                        <th style="text-align:center;">${escHtml(match.player1Name)}</th>
                        <th style="text-align:center;">${escHtml(match.player2Name)}</th>
                    </tr></thead><tbody>`;

                const fmt = (v) => (v !== undefined && v !== null && v !== 0) ? v : '—';
                const fmtArr = (v) => (Array.isArray(v) && v.length) ? v.join(', ') : '—';

                [
                    ['180s',         a1?.oneEighties,   a2?.oneEighties],
                    ['Tons',         a1?.tons,          a2?.tons],
                    ['Lollipops',    a1?.lollipops,     a2?.lollipops],
                    ['High outs',    fmtArr(a1?.highOuts),  fmtArr(a2?.highOuts)],
                    ['Short legs',   fmtArr(a1?.shortLegs), fmtArr(a2?.shortLegs)],
                ].forEach(([label, v1, v2]) => {
                    const d1 = typeof v1 === 'string' ? v1 : fmt(v1);
                    const d2 = typeof v2 === 'string' ? v2 : fmt(v2);
                    if (d1 !== '—' || d2 !== '—') {
                        html += `<tr>
                            <td>${label}</td>
                            <td style="text-align:center;">${d1}</td>
                            <td style="text-align:center;">${d2}</td>
                        </tr>`;
                    }
                });

                html += '</tbody></table>';
            }
        }

        return html;
    }

    // ---------------------------------------------------------------------------
    // Match detail modal (called from Setup → Match History cards)
    // ---------------------------------------------------------------------------

    async function openMatchModal(tournamentId, matchId) {
        let match;
        try {
            match = await NewtonDB.getMatch(tournamentId, matchId);
        } catch (e) {
            alert('Could not load match: ' + e.message);
            return;
        }
        if (!match) { alert('No detailed record found for this match.'); return; }

        const titleEl = document.getElementById('matchDetailModalTitle');
        const bodyEl  = document.getElementById('matchDetailModalBody');

        titleEl.textContent = `${match.matchId} — ${match.player1Name} vs ${match.player2Name}`;
        bodyEl.innerHTML    = _buildMatchDetailHtml(match);

        pushDialog('matchDetailModal', null, true);
    }

    // ---------------------------------------------------------------------------
    // Export / Import
    // ---------------------------------------------------------------------------

    async function exportDB() {
        try {
            const dump = await NewtonDB.exportAll();
            const json = JSON.stringify(dump, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `NewtonMatchDB_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Export failed: ' + e.message);
        }
    }

    async function importDB(event) {
        const file = event.target.files[0];
        if (!file) return;

        const confirmed = confirm(
            'Import will merge this file into the existing match register.\n\n' +
            'Existing records with matching IDs will be overwritten.\n\nContinue?'
        );
        if (!confirmed) { event.target.value = ''; return; }

        try {
            const text = await file.text();
            const dump = JSON.parse(text);
            await NewtonDB.importAll(dump);
            event.target.value = '';
            await renderTournamentList();
            alert('Import complete.');
        } catch (e) {
            alert('Import failed: ' + e.message);
            event.target.value = '';
        }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    function escHtml(str) {
        return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    return { render, openTournament, openMatch, openMatchModal, exportDB, importDB };

})();
