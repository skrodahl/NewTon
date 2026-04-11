// newton-history.js — History UI for NewtonMatchDB
// Read-only views: Tournament list → Match list → Match detail
// Only shows finalized tournaments (status: 'final')

const NewtonHistory = (() => {

    /** Convert a timestamp to milliseconds, handling both seconds and milliseconds */
    function tsToMs(ts) {
        if (!ts) return 0;
        return ts > 1e12 ? ts : ts * 1000;
    }

    /** Currently selected tournament record (for match list context) */
    let _activeTournament = null;

    /** Current analytics view and point mode */
    let _activeView = 'dashboard';
    let _pointMode = 'original';
    let _controlsInitialised = false;

    // ---------------------------------------------------------------------------
    // Analytics controls — view tabs + point mode toggle
    // ---------------------------------------------------------------------------

    /** Wire up control bar buttons. Safe to call multiple times. */
    function initControls() {
        if (_controlsInitialised) return;
        _controlsInitialised = true;
        // View tabs
        document.querySelectorAll('.analytics-view-btn').forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        });
        // Point mode toggle
        document.querySelectorAll('.analytics-point-btn').forEach(btn => {
            btn.addEventListener('click', () => switchPointMode(btn.dataset.pointMode));
        });
    }

    /**
     * Switch the active analytics view.
     * @param {string} view - 'dashboard' | 'leaderboard' | 'players' | 'register'
     */
    function switchView(view) {
        _activeView = view;

        // Update tab buttons
        document.querySelectorAll('.analytics-view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update view panels
        document.querySelectorAll('.analytics-view').forEach(panel => {
            panel.classList.remove('active');
        });
        const viewId = 'analyticsView' + view.charAt(0).toUpperCase() + view.slice(1);
        const panel = document.getElementById(viewId);
        if (panel) panel.classList.add('active');

        // When switching to register, render the tournament list
        if (view === 'register') {
            showPanel('tournamentList');
            renderTournamentList();
        }

        // When switching to dashboard, compute stats
        if (view === 'dashboard') {
            renderDashboard();
        }
    }

    /**
     * Switch the point mode.
     * @param {string} mode - 'original' | 'current' | 'custom'
     */
    function switchPointMode(mode) {
        _pointMode = mode;

        document.querySelectorAll('.analytics-point-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pointMode === mode);
        });

        // TODO: recompute active view with new point mode
        console.log('Point mode:', mode);
    }

    // ---------------------------------------------------------------------------
    // Dashboard
    // ---------------------------------------------------------------------------

    /**
     * Compute headline stats from finalized data and render stat cards.
     */
    async function renderDashboard() {
        const container = document.getElementById('analyticsViewDashboard');
        if (!container || typeof NewtonDB === 'undefined') return;

        container.innerHTML = '<div class="analytics-placeholder"><p>Loading…</p></div>';

        try {
            const tournaments = await NewtonDB.getFinalTournaments();
            if (!tournaments.length) {
                container.innerHTML = '<div class="analytics-placeholder">' +
                    '<h3>No data yet</h3>' +
                    '<p>Dashboard stats appear after your first tournament is finalized.</p></div>';
                return;
            }

            // Gather all matches across all tournaments
            const allMatches = [];
            for (const t of tournaments) {
                const matches = await NewtonDB.getMatchesByTournament(t.tournamentId);
                allMatches.push(...matches);
            }

            // Unique players
            const playerSet = new Set();
            allMatches.forEach(m => {
                if (m.player1Id) playerSet.add(m.player1Id);
                if (m.player2Id) playerSet.add(m.player2Id);
            });

            // Scan tournament-level achievements (includes both manual and Chalker data)
            let total180s = 0;
            let highestCheckout = { score: 0, player: null };
            let shortestLeg = { darts: Infinity, player: null };

            tournaments.forEach(t => {
                const ta = t.tournamentAchievements;
                if (!ta) return;
                Object.values(ta).forEach(entry => {
                    const stats = entry.stats;
                    if (!stats) return;

                    // 180s
                    if (stats.oneEighties) total180s += stats.oneEighties;

                    // Highest checkout
                    if (stats.highOuts && stats.highOuts.length) {
                        const max = Math.max(...stats.highOuts);
                        if (max > highestCheckout.score) {
                            highestCheckout = { score: max, player: entry.name };
                        }
                    }

                    // Shortest leg
                    const legs = stats.shortLegs;
                    if (Array.isArray(legs) && legs.length) {
                        const min = Math.min(...legs);
                        if (min < shortestLeg.darts) {
                            shortestLeg = { darts: min, player: entry.name };
                        }
                    }
                });
            });

            // Render cards
            container.innerHTML =
                '<div class="analytics-dashboard">' +
                    _statCard('Tournaments', tournaments.length, 'Finalized', 'register') +
                    _statCard('Matches', allMatches.length, 'Completed', null) +
                    _statCard('Players', playerSet.size, 'Unique', 'players') +
                    _statCard('180s', total180s, 'Total', 'leaderboard') +
                    (highestCheckout.score > 0
                        ? _statCard('Highest Checkout', highestCheckout.score, highestCheckout.player, null)
                        : _statCard('Highest Checkout', '—', 'No data yet', null)) +
                    (shortestLeg.darts < Infinity
                        ? _statCard('Shortest Leg', shortestLeg.darts, shortestLeg.player, null)
                        : _statCard('Shortest Leg', '—', 'No data yet', null)) +
                '</div>';

            // Wire up card clicks
            container.querySelectorAll('.analytics-stat-card[data-target-view]').forEach(card => {
                card.addEventListener('click', () => switchView(card.dataset.targetView));
            });

        } catch (e) {
            console.error('Dashboard render failed:', e);
            container.innerHTML = '<div class="analytics-placeholder">' +
                '<p>Failed to load dashboard stats.</p></div>';
        }
    }

    /**
     * Build HTML for a single stat card.
     * @param {string} label
     * @param {string|number} value
     * @param {string} subtitle
     * @param {string|null} targetView - view to navigate to on click, or null for non-clickable
     * @returns {string}
     */
    function _statCard(label, value, subtitle, targetView) {
        const clickable = targetView ? ` data-target-view="${targetView}"` : '';
        const clickClass = targetView ? ' clickable' : '';
        return '<div class="analytics-stat-card' + clickClass + '"' + clickable + '>' +
            '<div class="analytics-stat-value">' + escHtml(String(value)) + '</div>' +
            '<div class="analytics-stat-label">' + escHtml(label) + '</div>' +
            '<div class="analytics-stat-subtitle">' + escHtml(subtitle) + '</div>' +
        '</div>';
    }

    // ---------------------------------------------------------------------------
    // Entry point — called by showPage('history') hook in main.js
    // ---------------------------------------------------------------------------

    /**
     * Render the history page. Initialises controls and shows the active view.
     */
    async function render() {
        initControls();
        switchView(_activeView);
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

    /** @type {object|null} NewtonTable instance for the tournament list */
    let _tournamentTable = null;

    async function renderTournamentList() {
        // Create the table instance once, reuse on subsequent calls
        if (!_tournamentTable) {
            _tournamentTable = NewtonTable.create({
                tableId: 'analytics-tournaments',
                containerId: 'historyTournamentTableContainer',
                defaultSortKey: 'closedAt',
                defaultSortDir: 'desc',
                emptyMessage: 'No completed tournaments yet. Close a tournament to register it here.',
                columns: [
                    {
                        key: 'tournamentName', label: 'Tournament',
                        render: (v, row) => escHtml(v || row.tournamentId)
                    },
                    {
                        key: 'tournamentFormat', label: 'Format', width: '80px',
                        render: (v) => escHtml(v || '—')
                    },
                    {
                        key: 'closedAt', label: 'Date', width: '120px',
                        render: (v) => v ? new Date(tsToMs(v)).toLocaleDateString() : '—',
                        sortValue: (v) => v ? tsToMs(v) : 0
                    },
                    {
                        key: 'playerCount', label: 'Players', align: 'center', width: '80px',
                        render: (v) => v || '—'
                    },
                    {
                        key: 'matchCount', label: 'Matches', align: 'center', width: '80px',
                        render: (v) => v != null ? v : '—'
                    },
                    {
                        key: '_actions', label: '', sortable: false, align: 'right',
                        render: (v, row) => {
                            const safeId = escHtml(row.tournamentId);
                            const safeName = escHtml(row.tournamentName || row.tournamentId);
                            return `<button class="btn btn-sm" onclick="event.stopPropagation();NewtonHistory.openTournament('${safeId}')">View →</button>` +
                                `<button class="btn btn-sm" onclick="event.stopPropagation();NewtonHistory.promptDeleteTournament('${safeId}','${safeName}')" style="margin-left:6px;color:#dc2626;border-color:#dc2626;">Delete</button>`;
                        }
                    }
                ],
                onRowClick: (row) => openTournament(row.tournamentId)
            });
        }

        let tournaments;
        try {
            tournaments = await NewtonDB.getFinalTournaments();
        } catch (e) {
            const container = document.getElementById('historyTournamentTableContainer');
            if (container) container.innerHTML = `<p style="color:#dc2626;padding:16px;">Could not load history: ${escHtml(e.message)}</p>`;
            return;
        }

        // Self-heal: compute and persist matchCount for records that don't have it
        for (const t of tournaments) {
            if (t.matchCount == null) {
                try {
                    const matches = await NewtonDB.getMatchesByTournament(t.tournamentId);
                    t.matchCount = matches.length;
                    NewtonDB.saveTournamentMeta(t).catch(() => {});
                } catch (e) {
                    t.matchCount = 0;
                }
            }
        }

        // Add _rowId for row click identification
        tournaments.forEach(t => { t._rowId = t.tournamentId; });
        _tournamentTable.setData(tournaments);
    }

    // ---------------------------------------------------------------------------
    // Match list
    // ---------------------------------------------------------------------------

    /** @type {object|null} NewtonTable instance for the match list */
    let _matchTable = null;

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

        document.getElementById('historyMatchListTitle').textContent = escHtml(tournament.tournamentName || tournamentId);
        document.getElementById('historyMatchListMeta').textContent =
            `${tournament.tournamentFormat || ''} · ${tournament.playerCount || '?'} players · ${tournament.closedAt ? new Date(tsToMs(tournament.closedAt)).toLocaleDateString() : ''}`;

        // Create the table instance once, reuse on subsequent calls
        if (!_matchTable) {
            _matchTable = NewtonTable.create({
                tableId: 'analytics-matches',
                containerId: 'historyMatchTableContainer',
                defaultSortKey: 'completedAt',
                defaultSortDir: 'asc',
                emptyMessage: 'No match records found.',
                columns: [
                    {
                        key: 'matchId', label: 'Match', width: '130px',
                        render: (v) => `<span style="font-family:monospace;font-size:13px;">${escHtml(v)}</span>`
                    },
                    {
                        key: 'player1Name', label: 'Player 1',
                        render: (v, row) => row.winner === 1 ? `<strong>${escHtml(v)}</strong>` : escHtml(v)
                    },
                    {
                        key: 'player2Name', label: 'Player 2',
                        render: (v, row) => row.winner === 2 ? `<strong>${escHtml(v)}</strong>` : escHtml(v)
                    },
                    {
                        key: 'score', label: 'Result', align: 'center', width: '80px', sortable: false,
                        render: (v, row) => row.legsWon ? `${row.legsWon.p1}–${row.legsWon.p2}` : '—'
                    },
                    {
                        key: 'matchType', label: 'Type', width: '90px',
                        render: (v) => v === 'CHALKER'
                            ? '<span class="history-type-badge history-type-chalker">Chalker</span>'
                            : '<span class="history-type-badge history-type-manual">Manual</span>'
                    },
                    {
                        key: 'completedAt', label: 'Date', width: '110px',
                        render: (v) => v ? new Date(tsToMs(v)).toLocaleDateString() : '—',
                        sortValue: (v) => v ? tsToMs(v) : 0
                    }
                ],
                onRowClick: (row) => openMatch(tournamentId, row.matchId)
            });
        }

        // Add _rowId for row click identification
        matchRecords.forEach(m => { m._rowId = m.matchId; });
        _matchTable.setData(matchRecords);

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
        const date       = match.completedAt ? new Date(tsToMs(match.completedAt)).toLocaleString() : '—';
        const typeBadge  = match.matchType === 'CHALKER'
            ? '<span class="history-type-badge history-type-chalker">Chalker</span>'
            : '<span class="history-type-badge history-type-manual">Manual</span>';

        titleEl.innerHTML = `<span class="match-detail-match-id">${escHtml(match.matchId)}</span><span class="match-detail-players">${escHtml(match.player1Name)} vs ${escHtml(match.player2Name)}</span>`;

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
        const date       = match.completedAt ? new Date(tsToMs(match.completedAt)).toLocaleString() : '—';
        const typeBadge  = match.matchType === 'CHALKER'
            ? '<span class="history-type-badge history-type-chalker">Chalker</span>'
            : '<span class="history-type-badge history-type-manual">Manual</span>';

        let html = `<div class="history-detail-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
            <div>${date}</div>
            <div style="margin-top:8px;font-size:16px;">${match.winner === 1 ? `<strong>${escHtml(match.player1Name)}</strong>` : `<span style="color:#6b7280;">${escHtml(match.player1Name)}</span>`} <span style="font-family:'SF Mono',Monaco,'Cascadia Code','Courier New',monospace;font-size:14px;color:#374151;margin:0 4px;">${legs}</span> ${match.winner === 2 ? `<strong>${escHtml(match.player2Name)}</strong>` : `<span style="color:#6b7280;">${escHtml(match.player2Name)}</span>`}</div>
            </div>
            <div>${match.format && match.format.bo ? `<span class="history-type-badge" style="background:#f3f4f6;color:#374151;">Best of ${match.format.bo}</span> ` : ''}${typeBadge}</div>
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

        // Match stats table — always shown, same format as Results/Leaderboard
        const ach = match.achievements || {};
        const a1 = (ach.p1 || ach[match.player1Id]) || {};
        const a2 = (ach.p2 || ach[match.player2Id]) || {};
        const fmt = (v) => (v !== undefined && v !== null && v !== 0) ? v : '—';
        const fmtArr = (v) => (Array.isArray(v) && v.length) ? v.join(', ') : '—';

        const p1Bold = match.winner === 1;
        const p2Bold = match.winner === 2;
        const p1Name = p1Bold ? `<strong>${escHtml(match.player1Name)}</strong>` : escHtml(match.player1Name);
        const p2Name = p2Bold ? `<strong>${escHtml(match.player2Name)}</strong>` : escHtml(match.player2Name);

        html += `<table class="history-table newton-table" style="margin-top:16px;">
            <thead><tr>
                <th>Player</th>
                <th style="text-align:center;">Short Legs</th>
                <th style="text-align:center;">High Outs</th>
                <th style="text-align:center;width:70px;">180s</th>
                <th style="text-align:center;width:70px;">Tons</th>
            </tr></thead><tbody>
            <tr>
                <td>${p1Name}</td>
                <td style="text-align:center;">${fmtArr(a1.shortLegs)}</td>
                <td style="text-align:center;">${fmtArr(a1.highOuts)}</td>
                <td style="text-align:center;">${fmt(a1.oneEighties)}</td>
                <td style="text-align:center;">${fmt(a1.tons)}</td>
            </tr>
            <tr>
                <td>${p2Name}</td>
                <td style="text-align:center;">${fmtArr(a2.shortLegs)}</td>
                <td style="text-align:center;">${fmtArr(a2.highOuts)}</td>
                <td style="text-align:center;">${fmt(a2.oneEighties)}</td>
                <td style="text-align:center;">${fmt(a2.tons)}</td>
            </tr>
            </tbody></table>`;

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
    // Delete tournament (History tab)
    // ---------------------------------------------------------------------------

    /** State for the delete confirmation modal */
    let _pendingDeleteId   = null;
    let _pendingDeleteName = null;

    function promptDeleteTournament(tournamentId, tournamentName) {
        _pendingDeleteId   = tournamentId;
        _pendingDeleteName = tournamentName;

        document.getElementById('historyDeleteTournamentDisplayName').textContent = tournamentName;
        document.getElementById('historyDeleteTournamentInput').value = '';
        document.getElementById('historyDeleteTournamentBtn').disabled = true;

        pushDialog('historyDeleteTournamentModal', null, true);
    }

    function onDeleteInputChange() {
        const typed = document.getElementById('historyDeleteTournamentInput').value;
        document.getElementById('historyDeleteTournamentBtn').disabled = (typed !== _pendingDeleteName);
    }

    async function confirmDeleteTournament() {
        if (!_pendingDeleteId) return;

        const id = _pendingDeleteId;
        _pendingDeleteId   = null;
        _pendingDeleteName = null;

        popDialog();

        try {
            await NewtonDB.deleteTournament(id);
        } catch (e) {
            alert('Delete failed: ' + e.message);
            return;
        }

        await renderTournamentList();
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
            alert('Import failed: ' + (e && e.message ? e.message : String(e)));
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

    return { render, openTournament, openMatch, openMatchModal, exportDB, importDB,
             promptDeleteTournament, onDeleteInputChange, confirmDeleteTournament };

})();
