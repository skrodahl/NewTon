// newton-history.js — History UI for NewtonMatchDB
// Read-only views: Tournament list → Match list → Match detail
// Only shows finalized tournaments (status: 'final')

const NewtonHistory = (() => {

    /** Convert a timestamp to milliseconds, handling both seconds and milliseconds */
    function tsToMs(ts) {
        if (!ts) return 0;
        return ts > 1e12 ? ts : ts * 1000;
    }

    /** Format a timestamp as YYYY-MM-DD */
    function fmtDate(ts) {
        if (!ts) return '—';
        const d = new Date(tsToMs(ts));
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /** Format a timestamp as YYYY-MM-DD HH:MM */
    function fmtDateTime(ts) {
        if (!ts) return '—';
        const d = new Date(tsToMs(ts));
        return fmtDate(ts) + ' \u00b7 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    /** Currently selected tournament record (for match list context) */
    let _activeTournament = null;

    /** Current analytics view and point mode */
    let _activeView = 'dashboard';
    let _pointMode = 'original';
    let _controlsInitialised = false;

    /** Point layers — which components are included in the points total */
    let _layerRanking = true;
    let _layerAttendance = true;

    // ---------------------------------------------------------------------------
    // Scope — which tournaments are included in all analytics views
    // ---------------------------------------------------------------------------

    /** Selected tournament IDs, or null = all tournaments */
    let _scope = null;

    /** Cached full tournament list from DB (loaded once per render cycle) */
    let _allTournaments = null;

    /**
     * Cached match lists, keyed by tournamentId (6.5). Analytics re-renders on every
     * point-mode and layer toggle, but those change only client-side multipliers — the
     * match records are identical, so refetching them from IndexedDB each time is pure
     * waste. Cleared together with _allTournaments by _invalidateCache().
     * @type {Map<string, object[]>}
     */
    let _matchesByTournament = new Map();

    /** Dirty flags — views that need recompute after scope change */
    let _dirty = { dashboard: true, leaderboard: true, players: true, register: true };

    // Per-view generation token. Each async render captures the current value at entry
    // and bails before painting if a newer render of the same view has since started —
    // so rapid point-mode/layer/scope toggles can't let a stale render win the repaint.
    let _renderSeq = { dashboard: 0, leaderboard: 0, players: 0 };

    /**
     * Load all tournaments from DB (cached), with achievement corrections applied.
     * Every view reads tournaments through here, so corrections reach all of them.
     * Call _invalidateCache() to force reload.
     * @returns {Promise<object[]>}
     */
    async function _loadAllTournaments() {
        if (_allTournaments) return _allTournaments;
        const [records, corrections] = await Promise.all([
            NewtonDB.getFinalTournaments(),
            _fetchCorrections()
        ]);
        _allTournaments = records.map(t => _applyCorrections(t, corrections));
        return _allTournaments;
    }

    /** Invalidate the cached tournament list and match lists (e.g. after import or delete). */
    function _invalidateCache() {
        _allTournaments = null;
        _matchesByTournament.clear();
    }

    /**
     * Normalize a player name into the key players are matched on across Analytics (6.11).
     *
     * Analytics has no stable player id across tournaments — each tournament stores its
     * own ids — so players are identified by name. Every view that groups, counts or
     * selects players must agree on this exact normalization, or the same person shows
     * up as two people (or the Players tab and the Leaderboard report different
     * win/loss records for one player). Defining it once makes that agreement
     * structural instead of a convention repeated at 20 call sites.
     *
     * @param {string|null|undefined} name - a player name from a match or achievements record
     * @returns {string|null} the lookup key, or null when there is no name
     */
    function _playerKey(name) {
        return name ? String(name).trim().toLowerCase() : null;
    }

    /**
     * Tally match wins and losses into a player map (6.11).
     *
     * Shared by the Leaderboard and the Players tab, which had byte-identical copies of
     * this scan — they must report the same W/L for the same player. Callers own the map
     * and any further per-match work (the Leaderboard also accumulates legs and averages);
     * players absent from the map are skipped, exactly as before.
     *
     * @param {object[]} matches - match records for one tournament
     * @param {Object<string, {matchesWon: number, matchesLost: number}>} playerMap - keyed by _playerKey()
     * @returns {void} mutates playerMap
     */
    function _tallyMatchWinLoss(matches, playerMap) {
        matches.forEach(m => {
            const k1 = _playerKey(m.player1Name);
            const k2 = _playerKey(m.player2Name);
            const pm1 = k1 ? playerMap[k1] : null;
            const pm2 = k2 ? playerMap[k2] : null;

            if (m.winner === 1) {
                if (pm1) pm1.matchesWon++;
                if (pm2) pm2.matchesLost++;
            } else if (m.winner === 2) {
                if (pm2) pm2.matchesWon++;
                if (pm1) pm1.matchesLost++;
            }
        });
    }

    /**
     * Load the match lists for several tournaments at once (6.5).
     *
     * Replaces the `for (const t of …) await …` loops the aggregation views used to
     * run: those issued one IndexedDB round-trip after another, when the reads are
     * independent and can all be in flight together. Results are returned in the same
     * order as `tournaments` (Promise.all preserves input order), so callers that pair
     * them back up by index — or render them in order — behave exactly as before.
     *
     * Already-cached tournaments resolve without touching the DB at all.
     *
     * @param {object[]} tournaments - tournament meta records (need `tournamentId`)
     * @returns {Promise<object[][]>} one match array per tournament, in input order
     */
    async function _loadMatchesFor(tournaments) {
        return Promise.all(tournaments.map(async t => {
            const id = t.tournamentId;
            if (_matchesByTournament.has(id)) return _matchesByTournament.get(id);
            const matches = await NewtonDB.getMatchesByTournament(id);
            _matchesByTournament.set(id, matches);
            return matches;
        }));
    }

    /**
     * Get tournaments filtered by the current scope.
     * @returns {Promise<object[]>}
     */
    async function getScopedTournaments() {
        const all = await _loadAllTournaments();
        if (!_scope) return all;
        const scopeSet = new Set(_scope);
        return all.filter(t => scopeSet.has(t.tournamentId));
    }

    /**
     * Set the scope and mark all views dirty.
     * @param {string[]|null} tournamentIds - array of IDs, or null for all
     */
    function setScope(tournamentIds) {
        _scope = tournamentIds;
        _dirty = { dashboard: true, leaderboard: true, players: true, register: true };
        renderScopeIndicator();
    }

    /**
     * Open Analytics on just these tournaments (Setup's "Open in Analytics"): no date
     * range or name filter, only these ticked. Counts as the Lens for this visit, so the
     * half-year default doesn't replace it.
     * @param {string[]} tournamentIds
     */
    function scopeTo(tournamentIds) {
        _textFilter = '';
        _dateFrom = '';
        _dateTo = '';
        _checkedIds = new Set(tournamentIds);
        _lensReady = true;
        setScope(tournamentIds);
    }

    /** Set once the Lens has its starting point for this visit. Nothing is kept between visits. */
    let _lensReady = false;

    /**
     * The Lens a visit starts with: the current half-year, or the previous one while the
     * current one has no tournaments yet, or everything if both are empty. Every tournament
     * in it is ticked. Runs once per page load; changes last until the page is left.
     * @param {object[]} all - every finalized tournament
     */
    function _initLens(all) {
        _lensReady = true;
        // Lens settings used to be remembered between visits; clear what older versions saved
        try {
            ['newton_analytics_scope', 'newton_analytics_textFilter', 'newton_analytics_dateFilter']
                .forEach(k => localStorage.removeItem(k));
        } catch (e) { /* ignore */ }

        const hasTournaments = (hy) => all.some(t => {
            if (!t.closedAt) return false;
            const d = fmtDate(t.closedAt);
            return d >= hy.from && d <= hy.to;
        });
        let hy = _getHalfYear(0);
        if (!hasTournaments(hy)) hy = _getHalfYear(-1);
        if (!hasTournaments(hy)) hy = null;

        _textFilter = '';
        _dateFrom = hy ? hy.from : '';
        _dateTo = hy ? hy.to : '';
        _checkedIds = new Set(all.map(t => t.tournamentId));
        _applySelectionAsScope();
    }

    /**
     * Render the scope indicator in the Analytics header.
     * Shows "Viewing: N of M tournaments" with selection tags. Clickable → Register.
     */
    async function renderScopeIndicator() {
        const el = document.getElementById('analyticsScopeIndicator');
        if (!el) return;

        const all = await _loadAllTournaments();
        const total = all.length;
        const scoped = _scope ? _scope.length : total;
        const isAll = !_scope || scoped === total;

        // Why fewer than all are counted: the lens filters, and tournaments unticked in Register
        const why = [];
        if (_textFilter) why.push('name contains \u201c' + escHtml(_textFilter) + '\u201d');
        if (_dateFrom || _dateTo) why.push(escHtml(_dateFrom || '\u2026') + ' to ' + escHtml(_dateTo || '\u2026'));
        const unticked = _applyAllFilters(all).filter(t => !_checkedIds.has(t.tournamentId)).length;
        if (unticked) why.push(unticked + ' unticked');

        el.innerHTML = total
            ? '<b><span>' + scoped + '</span> of ' + total + ' tournaments</b>' +
              '<span class="an-why">' + (isAll ? 'All finalized tournaments' : why.join(' \u00b7 ')) + '</span>' +
              '<button type="button" class="st-link" data-an-choose>Choose tournaments</button>'
            : '<b>No finalized tournaments yet</b>';

        const choose = el.querySelector('[data-an-choose]');
        if (choose) choose.onclick = () => { switchView('register'); switchRegisterTab('tournaments'); };

        const strip = document.getElementById('analyticsStrip');
        if (strip) strip.classList.toggle('an-filtered', !isAll);
    }

    /**
     * Re-render what is on screen after the lens changed. The Register's tournament list is
     * updated by the lens handlers themselves, and a tournament or match opened from it does
     * not depend on the lens; every other view re-renders (switchView redraws a dirty view).
     */
    function _refreshActiveView() {
        if (_activeView !== 'register') { switchView(_activeView); return; }
        if (_activePanel === 'allMatches') renderAllMatches();
    }

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
        // Register breadcrumb is rendered dynamically via _updateBreadcrumb()
    }

    /**
     * Switch the active analytics view.
     * @param {string} view - 'dashboard' | 'leaderboard' | 'players' | 'register'
     */
    function switchView(view) {
        _activeView = view;

        // Update tab buttons
        document.querySelectorAll('.analytics-view-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.view === view);
        });

        // Update view panels
        document.querySelectorAll('.analytics-view').forEach(panel => {
            panel.classList.remove('active');
        });
        const viewId = 'analyticsView' + view.charAt(0).toUpperCase() + view.slice(1);
        const panel = document.getElementById(viewId);
        if (panel) panel.classList.add('active');

        // When switching to register, render the active sub-tab
        if (view === 'register') {
            switchRegisterTab(_activeRegisterTab);
            _dirty.register = false;
        }

        // When switching to dashboard, recompute if dirty
        if (view === 'dashboard') {
            if (_dirty.dashboard) {
                renderDashboard();
                _dirty.dashboard = false;
            }
        }

        // When switching to leaderboard, recompute if dirty
        if (view === 'leaderboard') {
            if (_dirty.leaderboard) {
                renderLeaderboard();
                _dirty.leaderboard = false;
            }
        }

        // When switching to players, recompute if dirty
        if (view === 'players') {
            if (_dirty.players) {
                renderPlayersTab();
                _dirty.players = false;
            }
        }
    }

    /**
     * Switch the point mode.
     * @param {string} mode - 'original' | 'current' | 'custom'
     */
    function switchPointMode(mode) {
        _pointMode = mode;

        document.querySelectorAll('.analytics-point-btn').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.pointMode === mode);
        });

        _recomputePoints();
    }

    /**
     * Get the active point values based on the current point mode.
     * @param {object} tournament - tournament record with configSnapshot
     * @returns {object} point values: { oneEighty, ton, highOut, shortLeg }
     */
    function _getActivePoints(tournament) {
        let pts;
        if (_pointMode === 'current' && typeof config !== 'undefined') {
            pts = config.points || {};
        } else {
            const cfg = tournament.configSnapshot;
            pts = cfg && cfg.points ? cfg.points : (cfg || {});
        }
        return {
            oneEighty:    Number(pts.oneEighty) || 0,
            ton:          Number(pts.ton) || 0,
            highOut:      Number(pts.highOut) || 0,
            shortLeg:     Number(pts.shortLeg) || 0,
            participation: Number(pts.participation) || 0,
            first:        Number(pts.first) || 0,
            second:       Number(pts.second) || 0,
            third:        Number(pts.third) || 0,
            fourth:       Number(pts.fourth) || 0,
            fifthSixth:   Number(pts.fifthSixth) || 0,
            seventhEighth: Number(pts.seventhEighth) || 0
        };
    }

    /**
     * Toggle a point layer (ranking/attendance) and re-render.
     * @param {string} layer - 'ranking' | 'attendance'
     * @param {HTMLElement} btn
     */
    function toggleLayer(layer, btn) {
        if (layer === 'ranking') _layerRanking = !_layerRanking;
        if (layer === 'attendance') _layerAttendance = !_layerAttendance;
        btn.setAttribute('aria-pressed', layer === 'ranking' ? _layerRanking : _layerAttendance);

        _recomputePoints();
    }

    /** Shared recompute after point mode or layer change. Preserves scroll position. */
    function _recomputePoints() {
        if (_allTournaments) {
            _allTournaments.forEach(t => { delete t._achievementPoints; });
        }
        _dirty = { dashboard: true, leaderboard: true, players: true, register: true };

        const el = document.scrollingElement || document.documentElement;
        const scrollY = el.scrollTop;

        const restore = () => requestAnimationFrame(() => { el.scrollTop = scrollY; });

        if (_activeView === 'register') {
            if (_activePanel === 'matchDetail' && _activeMatchContext) {
                openMatch(_activeMatchContext.tournamentId, _activeMatchContext.matchId).then(restore);
            } else if (_activePanel === 'matchList' && _activeTournament) {
                openTournament(_activeTournament.tournamentId).then(restore);
            } else {
                renderTournamentList().then(restore);
            }
        } else if (_activeView === 'leaderboard') {
            renderLeaderboard().then(restore);
            _dirty.leaderboard = false;
        } else if (_activeView === 'dashboard') {
            renderDashboard().then(restore);
            _dirty.dashboard = false;
        } else {
            switchView(_activeView);
            restore();
        }
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
        const seq = ++_renderSeq.dashboard;

        container.innerHTML = '<div class="analytics-placeholder"><p>Loading…</p></div>';

        try {
            const tournaments = await getScopedTournaments();
            if (seq !== _renderSeq.dashboard) return; // superseded by a newer render
            if (!tournaments.length) {
                container.innerHTML = '<div class="analytics-placeholder">' +
                    '<h3>No data yet</h3>' +
                    '<p>Dashboard stats appear after your first tournament is finalized.</p></div>';
                return;
            }

            // Gather all matches across all tournaments
            const allMatches = [];
            (await _loadMatchesFor(tournaments)).forEach(matches => {
                allMatches.push(...matches);
            });

            // Unique players (deduplicate by normalized name across tournaments)
            const playerSet = new Set();
            allMatches.forEach(m => {
                if (m.player1Name) playerSet.add(_playerKey(m.player1Name));
                if (m.player2Name) playerSet.add(_playerKey(m.player2Name));
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

            // Total points across scope (respects point mode + layers)
            let totalPoints = 0;
            tournaments.forEach(t => {
                totalPoints += _computeAchievementPoints(t);
            });

            const playerRows = await _computePlayerRows(tournaments);
            const latest = tournaments.slice().sort((a, b) => tsToMs(b.closedAt) - tsToMs(a.closedAt)).slice(0, 10);

            if (seq !== _renderSeq.dashboard) return; // superseded during the DB reads above

            // Render cards
            container.innerHTML =
                '<div class="an-tiles">' +
                    _statCard('Tournaments', tournaments.length, 'Finalized', 'register') +
                    _statCard('Matches', allMatches.length, 'Completed', 'allMatches') +
                    _statCard('Players', playerSet.size, 'Unique', 'players') +
                    _statCard('Points', totalPoints, 'Total', 'leaderboard') +
                    _statCard('180s', total180s, 'Total', 'players') +
                    (highestCheckout.score > 0
                        ? _statCard('Highest Checkout', highestCheckout.score, highestCheckout.player, 'players', highestCheckout.player)
                        : _statCard('Highest Checkout', '—', 'No data yet', null)) +
                    (shortestLeg.darts < Infinity
                        ? _statCard('Shortest Leg', shortestLeg.darts, shortestLeg.player, 'players', shortestLeg.player, 'darts')
                        : _statCard('Shortest Leg', '—', 'No data yet', null)) +
                '</div>' +
                _dashboardPanels(playerRows.slice(0, 10), latest);

            // The top 10 open a player; the latest tournaments open in the Register
            container.querySelectorAll('[data-an-player]').forEach(tr => {
                tr.addEventListener('click', () => focusPlayer(playerRows[+tr.dataset.anPlayer].name));
            });
            container.querySelectorAll('[data-an-tournament]').forEach(tr => {
                tr.addEventListener('click', () => { switchView('register'); openTournament(latest[+tr.dataset.anTournament].tournamentId); });
            });
            container.querySelectorAll('[data-an-go]').forEach(btn => {
                btn.addEventListener('click', () => switchView(btn.dataset.anGo));
            });

            // Wire up card clicks
            container.querySelectorAll('.an-tile[data-target-view]').forEach(card => {
                card.addEventListener('click', () => {
                    const target = card.dataset.targetView;
                    const playerName = card.dataset.targetPlayer;
                    if (target === 'allMatches') {
                        switchView('register');
                        switchRegisterTab('matches');
                    } else if (target === 'players' && playerName) {
                        focusPlayer(playerName);
                    } else {
                        switchView(target);
                    }
                });
            });

        } catch (e) {
            console.error('Dashboard render failed:', e);
            container.innerHTML = '<div class="analytics-placeholder">' +
                '<p>Failed to load dashboard stats.</p></div>';
        }
    }

    /**
     * Build HTML for a single stat tile.
     * @param {string} label
     * @param {string|number} value
     * @param {string} subtitle
     * @param {string|null} targetView - view to navigate to on click, or null for non-clickable
     * @param {string} [targetPlayer] - player name to focus on click (Players tab)
     * @param {string} [unit] - small unit after the value, e.g. 'darts'
     * @returns {string}
     */
    function _statCard(label, value, subtitle, targetView, targetPlayer, unit) {
        const tag = targetView ? 'button' : 'div';
        const attrs = targetView
            ? ` type="button" data-target-view="${targetView}"` + (targetPlayer ? ` data-target-player="${escHtml(targetPlayer)}"` : '')
            : '';
        return '<' + tag + ' class="an-tile"' + attrs + '>' +
            '<span class="an-tile-label">' + escHtml(label) + '</span>' +
            '<span class="an-tile-value">' + escHtml(String(value)) + (unit ? '<small>' + escHtml(unit) + '</small>' : '') + '</span>' +
            '<span class="an-tile-sub">' + escHtml(subtitle) + '</span>' +
        '</' + tag + '>';
    }

    /**
     * The Dashboard's two panels: the Leaderboard's top 10 and the latest tournaments.
     * Rows carry only an index; the click handlers look the row up.
     * @param {object[]} top - the first ten rows of _computePlayerRows()
     * @param {object[]} latest - the newest tournaments, newest first
     * @returns {string} HTML
     */
    function _dashboardPanels(top, latest) {
        const dim = (v) => v || _DIM_DASH;
        return '<div class="an-dash-cols">' +
            '<section class="st-panel">' +
                '<div class="st-panel-head"><h3>Leaderboard <small>top 10</small></h3>' +
                '<button type="button" class="st-link" data-an-go="leaderboard">Full Leaderboard</button></div>' +
                '<div class="newton-table-scroll"><table class="newton-table"><thead><tr>' +
                    '<th>#</th><th>Player</th><th style="text-align:right">Played</th><th style="text-align:right">1st</th><th style="text-align:right">Points</th>' +
                '</tr></thead><tbody>' +
                top.map((r, i) => `<tr class="newton-table-clickable" data-an-player="${i}">` +
                    `<td class="nt-rank">${r._rank}</td><td class="nt-name" style="width:100%">${escHtml(r.name)}</td>` +
                    `<td style="text-align:right">${r.tournaments}</td><td style="text-align:right">${dim(r.p1st)}</td>` +
                    `<td class="nt-pts" style="text-align:right">${r.points}</td></tr>`).join('') +
                '</tbody></table></div>' +
            '</section>' +
            '<section class="st-panel">' +
                '<div class="st-panel-head"><h3>Latest tournaments</h3>' +
                '<button type="button" class="st-link" data-an-go="register">All in the Register</button></div>' +
                '<div class="newton-table-scroll"><table class="newton-table"><thead><tr>' +
                    '<th>Tournament</th><th>Date</th><th class="an-wide-only" style="text-align:right">Players</th><th>Winner</th>' +
                '</tr></thead><tbody>' +
                latest.map((t, i) => `<tr class="newton-table-clickable" data-an-tournament="${i}">` +
                    `<td class="nt-name" style="width:100%">${escHtml(t.tournamentName || t.tournamentId)}</td>` +
                    `<td>${t.closedAt ? fmtDate(t.closedAt) : '—'}</td>` +
                    `<td class="an-wide-only" style="text-align:right">${t.playerCount || '—'}</td>` +
                    `<td>${dim(escHtml(_winnerName(t)))}</td></tr>`).join('') +
                '</tbody></table></div>' +
            '</section>' +
        '</div>';
    }

    /** Force the next render to show the Dashboard tab. */
    function showDashboard() {
        _activeView = 'dashboard';
        _dirty.dashboard = true;
    }

    // ---------------------------------------------------------------------------
    // Leaderboard
    // ---------------------------------------------------------------------------
    // PLAYERS TAB
    // ---------------------------------------------------------------------------

    /** @type {object[]|null} Current player data for the players tab */
    let _playersData = null;

    /** @type {object|null} NewtonTable instance for the players list */
    let _playersTable = null;

    /** @type {object|null} NewtonTable instance for the comparison/profile panel */
    let _comparisonTable = null;

    /** The player charts' figures for the Lens (_buildChartData), and everyone by rank. */
    let _chartData = null;
    let _chartOptions = [];

    /** @type {Set<string>} Selected player keys (lowercase trimmed) */
    let _selectedPlayers = new Set();

    /** Save player selection to localStorage. Null = all selected (default). */
    function _persistPlayerSelection() {
        try {
            if (_playersTable && _playersTable.data) {
                const allKeys = _playersTable.data.map(r => _playerKey(r.name));
                const allSelected = allKeys.every(k => _selectedPlayers.has(k));
                if (allSelected || _selectedPlayers.size === 0) {
                    localStorage.removeItem('newton_analytics_playerSelection');
                } else {
                    localStorage.setItem('newton_analytics_playerSelection', JSON.stringify([..._selectedPlayers]));
                }
            }
        } catch (e) { /* ignore */ }
    }

    /** Restore player selection from localStorage. */
    function _restorePlayerSelection(rows) {
        try {
            const raw = localStorage.getItem('newton_analytics_playerSelection');
            if (!raw) return false;
            const keys = JSON.parse(raw);
            if (!Array.isArray(keys) || keys.length === 0) return false;
            const validKeys = new Set(rows.map(r => _playerKey(r.name)));
            const filtered = keys.filter(k => validKeys.has(k));
            if (filtered.length === 0) return false;
            _selectedPlayers = new Set(filtered);
            return true;
        } catch (e) {
            localStorage.removeItem('newton_analytics_playerSelection');
            return false;
        }
    }

    /** @type {string|null} Player name to focus after next render */
    let _pendingPlayerFocus = null;

    /**
     * Compute unique players across scoped tournaments and render the players list.
     */
    async function renderPlayersTab() {
        const container = document.getElementById('playersTableContainer');
        if (!container || typeof NewtonDB === 'undefined') return;
        const seq = ++_renderSeq.players;

        if (!_playersTable) {
            container.innerHTML = '<div class="analytics-placeholder"><p>Loading…</p></div>';
        }

        try {
            const tournaments = await getScopedTournaments();
            if (seq !== _renderSeq.players) return; // superseded by a newer render
            if (!tournaments.length) {
                container.innerHTML = '<div class="analytics-placeholder">' +
                    '<h3>No data yet</h3>' +
                    '<p>Players appear after your first tournament is finalized.</p></div>';
                _playersTable = null;
                return;
            }

            // The same rows as the Leaderboard, so the list, the profile and the Leaderboard agree
            const rows = (await _computePlayerRows(tournaments)).slice();

            if (seq !== _renderSeq.players) return; // superseded during the DB reads above

            // what the player charts draw, and the players to compare with (by rank)
            _chartData = _buildChartData(rows, tournaments);
            _chartOptions = rows.slice().sort((a, b) => a._rank - b._rank).map(r => r.name);

            rows.sort((a, b) => a.name.localeCompare(b.name));
            rows.forEach(r => { r._rowId = r.name; });

            // Restore persisted selection, or default to all selected
            if (_selectedPlayers.size === 0) {
                if (!_restorePlayerSelection(rows)) {
                    rows.forEach(r => _selectedPlayers.add(_playerKey(r.name)));
                }
            }

            if (!_playersTable) {
                _playersTable = NewtonTable.create({
                    tableId: 'analytics-players',
                    containerId: 'playersTableContainer',
                    defaultSortKey: 'name',
                    defaultSortDir: 'asc',
                    emptyMessage: 'No player data available.',
                    rowClass: (row) => _selectedPlayers.has(_playerKey(row.name)) ? '' : 'an-off',
                    onRowClick: (row) => togglePlayer(row.name, !_selectedPlayers.has(_playerKey(row.name))),
                    columns: [
                        {
                            key: '_select', sortable: false, width: '1%',
                            headerRender: () => {
                                const data = _playersTable ? _playersTable.data : [];
                                const allChecked = data.length > 0 && data.every(r => _selectedPlayers.has(_playerKey(r.name)));
                                return `<input type="checkbox" class="an-check" aria-label="Tick all"${allChecked ? ' checked' : ''} onclick="NewtonHistory.toggleAllPlayers(this.checked)">`;
                            },
                            render: (v, row) => {
                                const key = _playerKey(row.name);
                                const checked = _selectedPlayers.has(key) ? ' checked' : '';
                                return `<input type="checkbox" class="an-check" aria-label="Select this player"${checked} data-nh-action="toggle-player" data-name="${escHtml(row.name)}">`;
                            }
                        },
                        {
                            key: 'name', label: 'Player', width: '100%', cellClass: 'nt-name',
                            render: (v) => escHtml(v)
                        },
                        {
                            key: 'tournaments', label: 'Played', align: 'right', defaultDir: 'desc'
                        },
                        {
                            key: 'matchesWon', label: 'W–L', align: 'right', defaultDir: 'desc',
                            render: (v, row) => `${row.matchesWon}–${row.matchesLost}`,
                            sortValue: (v, row) => row.matchesWon - row.matchesLost
                        }
                    ]
                });
            }

            _playersTable.setData(rows);
            _wireTableActions('playersTableContainer');
            const meta = document.getElementById('playersMeta');
            if (meta) meta.textContent = rows.length;

            // Apply pending focus or render profile panel with current selection
            if (_pendingPlayerFocus) {
                _applyPendingFocus();
            } else {
                renderProfilePanel();
            }
        } catch (err) {
            console.error('Players tab render error:', err);
            container.innerHTML = '<div class="analytics-placeholder"><p>Error loading players.</p></div>';
            _playersTable = null;
        }
    }

    /**
     * Toggle a single player's selection and update the profile panel.
     * @param {string} playerName
     * @param {boolean} checked
     */
    function togglePlayer(playerName, checked) {
        const key = _playerKey(playerName);
        if (checked) {
            _selectedPlayers.add(key);
        } else {
            _selectedPlayers.delete(key);
        }
        if (_playersTable) _playersTable.refresh(); // the tick-all box and the dimmed rows
        _persistPlayerSelection();
        renderProfilePanel();
    }

    /**
     * Toggle all players' selection.
     * @param {boolean} checked
     */
    function toggleAllPlayers(checked) {
        if (!_playersTable || !_playersTable.data) return;
        _selectedPlayers.clear();
        if (checked) {
            _playersTable.data.forEach(r => _selectedPlayers.add(_playerKey(r.name)));
        }
        _playersTable.refresh();
        _persistPlayerSelection();
        renderProfilePanel();
    }

    /**
     * Navigate to the Players tab and focus a single player.
     * Handles the case where the Players tab hasn't rendered yet.
     * @param {string} playerName
     */
    function focusPlayer(playerName) {
        _pendingPlayerFocus = playerName;
        switchView('players');
        // If data already loaded, apply focus now
        if (_playersTable && _playersTable.data && _playersTable.data.length) {
            _applyPendingFocus();
        }
    }

    /**
     * Apply a pending player focus — select only that player.
     */
    function _applyPendingFocus() {
        if (!_pendingPlayerFocus) return;
        const key = _playerKey(_pendingPlayerFocus);
        _pendingPlayerFocus = null;
        _selectedPlayers.clear();
        _selectedPlayers.add(key);
        if (_playersTable) _playersTable.refresh();
        _persistPlayerSelection();
        renderProfilePanel();
    }

    /**
     * Render the right-side profile panel based on current selection.
     */
    function renderProfilePanel() {
        const panel = document.getElementById('playersProfilePanel');
        if (!panel || !_playersTable || !_playersTable.data) return;

        const selected = _playersTable.data.filter(r => _selectedPlayers.has(_playerKey(r.name)));

        if (selected.length === 0) {
            _comparisonTable = null;
            panel.innerHTML = '<div class="analytics-placeholder">' +
                '<h3>No player selected</h3>' +
                '<p>Tick a name to see their profile, or several to compare them.</p></div>';
            return;
        }

        if (selected.length === 1) {
            _comparisonTable = null;
            _renderProfile(panel, selected[0], _playersTable.data.length);
            return;
        }

        // Several players: compared on the player charts (the six highest ranked when more are ticked)
        _comparisonTable = null;
        const compared = () => _playersTable.data
            .filter(r => _selectedPlayers.has(_playerKey(r.name)))
            .sort((x, y) => x._rank - y._rank)
            .slice(0, NewtonCharts.MAX_PLAYERS)
            .map(r => r.name);
        const capped = selected.length > NewtonCharts.MAX_PLAYERS;
        panel.innerHTML =
            '<div class="st-panel-head"><h3>Compare <small>' + compared().length + ' players</small></h3>' +
            '<button type="button" class="st-link" onclick="NewtonHistory.toggleAllPlayers(false)">Clear</button></div>' +
            '<div class="pc-compare"></div>';
        if (!_chartData) return;
        NewtonCharts.renderCompare(panel.querySelector('.pc-compare'), {
            data: _chartData,
            getNames: compared,
            options: _chartOptions,
            onAdd: (name) => togglePlayer(name, true),
            onRemove: (name) => togglePlayer(name, false),
            note: capped ? `${selected.length} players are ticked; the charts show the six highest ranked.` : ''
        });
    }

    /**
     * One player's profile: their Leaderboard row as facts, their placements, and every
     * tournament they played (click one to open it in the Register).
     * @param {HTMLElement} panel
     * @param {object} p - the player's row from _computePlayerRows()
     * @param {number} playerCount - players in the lens, for "Rank 4 of 28"
     */
    function _renderProfile(panel, p, playerCount) {
        const fact = (label, value, unit) => `<div><dt>${label}</dt><dd>${value}${unit ? `<small>${unit}</small>` : ''}</dd></div>`;
        const place = (label, n) => `<div${n ? '' : ' class="an-zero"'}><dt>${label}</dt><dd>${n}</dd></div>`;
        const best = p.bestShortLeg < Infinity;
        panel.innerHTML =
            '<div class="an-prof-head"><h3>' + escHtml(p.name) + '</h3>' +
                '<p>Rank ' + p._rank + ' of ' + playerCount + ' in the lens</p></div>' +
            '<dl class="an-facts an-facts--grid">' +
                fact('Points', p.points) +
                fact('Played', p.tournaments) +
                fact('Matches', p.matchesWon + '–' + p.matchesLost) +
                fact('Legs', p.legsWon + '–' + p.legsLost) +
                fact('Avg', p.avg || '—') +
                fact('Best out', p.bestHighOut > 0 ? p.bestHighOut : '—') +
                fact('Best leg', best ? p.bestShortLeg : '—', best ? 'darts' : '') +
                fact('180s', p.oneEighties) +
                fact('High outs', p.highOuts) +
                fact('Short legs', p.shortLegs) +
            '</dl>' +
            '<dl class="an-place">' +
                place('1st', p.p1st) + place('2nd', p.p2nd) + place('3rd', p.p3rd) +
                place('4th', p.p4th) + place('5–6th', p.p56th) + place('7–8th', p.p78th) +
            '</dl>' +
            '<div class="pc-form"></div>' +
            '<h4 class="an-sub">Tournaments</h4>' +
            '<div id="playerTournamentsTableContainer"></div>';
        if (_chartData && _chartData.players[p.name]) {
            NewtonCharts.renderForm(panel.querySelector('.pc-form'), { data: _chartData, player: p.name, options: _chartOptions });
        }

        const rows = p.history.map(h => Object.assign({}, h, {
            _rowId: h.tournament.tournamentId,
            name: h.tournament.tournamentName || h.tournament.tournamentId,
            closedAt: h.tournament.closedAt,
            oneEighties: h.stats.oneEighties || 0
        }));
        NewtonTable.create({
            tableId: 'analytics-player-tournaments',
            containerId: 'playerTournamentsTableContainer',
            defaultSortKey: 'closedAt',
            defaultSortDir: 'desc',
            emptyMessage: 'No tournaments.',
            onRowClick: (row) => { switchView('register'); openTournament(row._rowId); },
            columns: [
                { key: 'name', label: 'Tournament', width: '100%', cellClass: 'nt-name', render: (v) => escHtml(v) },
                { key: 'closedAt', label: 'Date', render: (v) => v ? fmtDate(v) : '—', sortValue: (v) => v ? tsToMs(v) : 0 },
                {
                    key: 'placement', label: 'Placed', defaultDir: 'asc',
                    render: (v) => v && v <= 4 ? `<span class="st-pill nt-pill${v === 1 ? ' an-first' : ''}">${formatRanking(v)}</span>` : (v ? formatRanking(v) : '—'),
                    sortValue: (v) => v || 999
                },
                Object.assign(_lbCount('oneEighties', '180s'), { columnClass: 'an-wide-only' }),
                {
                    key: 'matchesWon', label: 'Matches', align: 'right', defaultDir: 'desc', columnClass: 'an-wide-only',
                    render: (v, row) => `${row.matchesWon}–${row.matchesLost}`, sortValue: (v, row) => row.matchesWon - row.matchesLost
                },
                { key: 'points', label: 'Points', align: 'right', defaultDir: 'desc', cellClass: 'nt-pts' }
            ]
        }).setData(rows);
    }

    // ---------------------------------------------------------------------------
    // LEADERBOARD
    // ---------------------------------------------------------------------------

    /** @type {object|null} NewtonTable instance for the leaderboard */
    let _leaderboardTable = null;

    /** @type {object[]|null} Current leaderboard rows (for export) */
    let _leaderboardRows = null;

    /** A dash for "none", dimmed so the numbers stand out. */
    const _DIM_DASH = '<span class="nt-dim">\u2014</span>';

    /**
     * A Leaderboard column that counts something (placements, achievements): a dimmed dash for 0.
     * @param {string} key
     * @param {string} label
     * @param {string} group - the heading it sits under
     * @returns {object} a NewtonTable column
     */
    function _lbCount(key, label, group) {
        return { key, label, group, align: 'right', defaultDir: 'desc', render: (v) => v || _DIM_DASH };
    }

    /**
     * Every player's totals across the given tournaments: points (under the active point
     * mode and layers), placements, achievements, personal bests, three-dart average, match
     * and leg W/L, and one history entry per tournament. Ranked by points. The one source
     * for the Leaderboard, the Dashboard's top 10, and the Players list and profile.
     * @param {object[]} tournaments - the scoped tournament records
     * @returns {Promise<object[]>} rows, `_rank` 1 = most points
     */
    async function _computePlayerRows(tournaments) {
        // Aggregate per-player stats across all scoped tournaments
        const playerMap = {}; // normalized name → { name, points, tournaments, wins, oneEighties, tons, highOuts, shortLegs }

        for (const t of tournaments) {
            const p = _getActivePoints(t);
            const ta = t.tournamentAchievements || {};
            const placements = t.placements || {};

            // Build playerId → placement lookup
            const playerPlacements = {};
            Object.entries(placements).forEach(([pid, rank]) => {
                playerPlacements[String(pid)] = rank;
            });

            Object.entries(ta).forEach(([pid, entry]) => {
                const name = entry.name || pid;
                const key = _playerKey(name);
                const s = entry.stats || {};

                if (!playerMap[key]) {
                    playerMap[key] = {
                        name: name,
                        points: 0,
                        tournaments: 0,
                        p1st: 0, p2nd: 0, p3rd: 0, p4th: 0, p56th: 0, p78th: 0,
                        oneEighties: 0,
                        tons: 0,
                        highOuts: 0,
                        shortLegs: 0,
                        bestHighOut: 0,
                        bestShortLeg: Infinity,
                        matchesWon: 0,
                        matchesLost: 0,
                        legsWon: 0,
                        legsLost: 0,
                        _totalScored: 0,
                        _totalDarts: 0,
                        history: [] // one entry per tournament, in the order of `tournaments`
                    };
                }

                const pm = playerMap[key];
                pm.tournaments++;

                // Points: achievements always; placement and participation per layer
                const rank = playerPlacements[String(pid)];
                const points = calculatePoints(s, rank, p, { ranking: _layerRanking, attendance: _layerAttendance });
                pm.points += points;
                pm.history.push({ tournament: t, placement: rank || null, stats: s, points, matchesWon: 0, matchesLost: 0,
                    _scored: 0, _darts: 0, _matchAvgs: [] }); // three-dart average per tournament (Chalker matches)

                // Track placement counts
                if (rank === 1) pm.p1st++;
                else if (rank === 2) pm.p2nd++;
                else if (rank === 3) pm.p3rd++;
                else if (rank === 4) pm.p4th++;
                else if (rank === 5 || rank === 6) pm.p56th++;
                else if (rank === 7 || rank === 8) pm.p78th++;

                // Achievement totals (for display)
                pm.oneEighties += (s.oneEighties || 0);
                pm.tons += (s.tons || 0);
                pm.highOuts += (Array.isArray(s.highOuts) ? s.highOuts.length : 0);
                pm.shortLegs += (Array.isArray(s.shortLegs) ? s.shortLegs.length : 0);

                // Personal bests
                if (Array.isArray(s.highOuts)) {
                    s.highOuts.forEach(v => { if (v > pm.bestHighOut) pm.bestHighOut = v; });
                }
                if (Array.isArray(s.shortLegs)) {
                    s.shortLegs.forEach(v => { if (v < pm.bestShortLeg) pm.bestShortLeg = v; });
                }
            });
        }

        // Scan matches for win/loss (shared) and leg counts; each tournament's W/L also goes
        // into that tournament's history entry (the player profile's tournament list)
        const matchLists = await _loadMatchesFor(tournaments);
        for (let ti = 0; ti < tournaments.length; ti++) {
            const matches = matchLists[ti];
            _tallyMatchWinLoss(matches, playerMap);
            const entryFor = (pm) => pm && pm.history.find(h => h.tournament === tournaments[ti]);
            matches.forEach(m => {
                const h1 = entryFor(m.player1Name && playerMap[_playerKey(m.player1Name)]);
                const h2 = entryFor(m.player2Name && playerMap[_playerKey(m.player2Name)]);
                if (m.winner === 1) { if (h1) h1.matchesWon++; if (h2) h2.matchesLost++; }
                else if (m.winner === 2) { if (h2) h2.matchesWon++; if (h1) h1.matchesLost++; }
            });

            matches.forEach(m => {
                const k1 = _playerKey(m.player1Name);
                const k2 = _playerKey(m.player2Name);
                const pm1 = k1 ? playerMap[k1] : null;
                const pm2 = k2 ? playerMap[k2] : null;

                if (m.legsWon) {
                    if (pm1) { pm1.legsWon += (m.legsWon.p1 || 0); pm1.legsLost += (m.legsWon.p2 || 0); }
                    if (pm2) { pm2.legsWon += (m.legsWon.p2 || 0); pm2.legsLost += (m.legsWon.p1 || 0); }
                }

                // Three-dart average — Chalker matches only
                if (m.matchType === 'CHALKER' && Array.isArray(m.legs) && m.legs.length) {
                    const startScore = (m.format && m.format.sc) || 501;
                    // this match's score and darts per player, for the tournament's average
                    let s1 = 0, d1 = 0, s2 = 0, d2 = 0;
                    m.legs.forEach(leg => {
                        try {
                            // Tiebreak legs (cd === 0) have no 501 scoring — including
                            // them corrupts the average (extractAchievements excludes
                            // them for the same reason)
                            if (leg.cd === 0) return;
                            const v1 = NewtonStats.decodeVisits(leg.s, 0);
                            const v2 = NewtonStats.decodeVisits(leg.s, 1);

                            // Player 1
                            if (pm1 && v1.length) {
                                if (leg.w === 1) {
                                    s1 += startScore;
                                    d1 += (v1.length - 1) * 3 + (leg.cd || 3);
                                } else {
                                    s1 += v1.reduce((a, b) => a + b, 0);
                                    d1 += v1.length * 3;
                                }
                            }
                            // Player 2
                            if (pm2 && v2.length) {
                                if (leg.w === 2) {
                                    s2 += startScore;
                                    d2 += (v2.length - 1) * 3 + (leg.cd || 3);
                                } else {
                                    s2 += v2.reduce((a, b) => a + b, 0);
                                    d2 += v2.length * 3;
                                }
                            }
                        } catch (_) {}
                    });
                    // into the player's totals, and into this tournament's history entry
                    [[pm1, s1, d1], [pm2, s2, d2]].forEach(([pm, sc, da]) => {
                        if (!pm || !da) return;
                        pm._totalScored += sc;
                        pm._totalDarts += da;
                        const h = entryFor(pm);
                        if (h) { h._scored += sc; h._darts += da; h._matchAvgs.push(sc / da * 3); }
                    });
                }
            });
        }

        // Convert to array, sort by points descending, assign ranks
        const rows = Object.values(playerMap);
        rows.sort((a, b) => b.points - a.points);
        rows.forEach((r, i) => {
            r._rank = i + 1;
            r.avg = r._totalDarts > 0 ? ((r._totalScored / r._totalDarts) * 3).toFixed(2) : null;
            r._rowId = r.name;
            // each tournament's average, and its worst and best match
            r.history.forEach(h => {
                h.avg = h._darts > 0 ? h._scored / h._darts * 3 : null;
                h.avgLo = h._matchAvgs.length ? Math.min(...h._matchAvgs) : null;
                h.avgHi = h._matchAvgs.length ? Math.max(...h._matchAvgs) : null;
            });
        });
        return rows;
    }

    /**
     * The figures the player charts draw (js/newton-charts.js), from the player rows: the
     * tournaments in date order, each player's result per tournament, their place in the
     * standings after each tournament (by points so far, as the Leaderboard ranks), and the
     * field (the median of everyone who played).
     * @param {object[]} rows - from _computePlayerRows()
     * @param {object[]} tournaments - the scoped tournaments
     * @returns {object}
     */
    function _buildChartData(rows, tournaments) {
        const ordered = tournaments.slice().sort((a, b) => tsToMs(a.closedAt) - tsToMs(b.closedAt));
        const index = new Map(ordered.map((t, i) => [t, i]));
        const median = (a) => {
            if (!a.length) return null;
            const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
            return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
        };

        const players = {};
        rows.forEach(r => {
            const entries = ordered.map(() => null);
            r.history.forEach(h => {
                const i = index.get(h.tournament);
                if (i == null) return;
                const s = h.stats || {};
                entries[i] = {
                    place: h.placement || null, points: h.points,
                    matchesWon: h.matchesWon, matchesLost: h.matchesLost,
                    avg: h.avg, avgLo: h.avgLo, avgHi: h.avgHi,
                    oneEighties: s.oneEighties || 0,
                    highOuts: Array.isArray(s.highOuts) ? s.highOuts : [],
                    shortLegs: Array.isArray(s.shortLegs) ? s.shortLegs : []
                };
            });
            players[r.name] = { name: r.name, rank: r._rank, entries, position: ordered.map(() => null) };
        });

        // standings after each tournament: running points, ranked like the Leaderboard
        const running = {};
        const ranked = ordered.map((t, i) => {
            Object.values(players).forEach(p => { if (p.entries[i]) running[p.name] = (running[p.name] || 0) + p.entries[i].points; });
            const order = Object.keys(running).sort((a, b) => running[b] - running[a]);
            order.forEach((name, k) => { players[name].position[i] = k + 1; });
            return order.length;
        });

        const field = {
            points: ordered.map((t, i) => median(Object.values(players).map(p => p.entries[i]).filter(Boolean).map(e => e.points))),
            average: ordered.map((t, i) => median(Object.values(players).map(p => p.entries[i]).filter(e => e && e.avg != null).map(e => e.avg)))
        };

        return {
            tournaments: ordered.map((t, i) => ({
                id: t.tournamentId,
                name: t.tournamentName || t.tournamentId,
                date: new Date(tsToMs(t.closedAt)),
                players: t.playerCount || Object.values(players).filter(p => p.entries[i]).length,
                chalker: Object.values(players).some(p => p.entries[i] && p.entries[i].avg != null)
            })),
            players, ranked, field
        };
    }

    /**
     * Compute per-player points across scoped tournaments and render the leaderboard.
     */
    async function renderLeaderboard() {
        const container = document.getElementById('leaderboardTableContainer');
        if (!container || typeof NewtonDB === 'undefined') return;
        const seq = ++_renderSeq.leaderboard;

        // Only show loading placeholder on first render (don't collapse existing table)
        if (!_leaderboardTable) {
            container.innerHTML = '<div class="analytics-placeholder"><p>Loading…</p></div>';
        }

        try {
            const tournaments = await getScopedTournaments();
            if (seq !== _renderSeq.leaderboard) return; // superseded by a newer render
            if (!tournaments.length) {
                container.innerHTML = '<div class="analytics-placeholder">' +
                    '<h3>No data yet</h3>' +
                    '<p>Leaderboard appears after your first tournament is finalized.</p></div>';
                _leaderboardTable = null;
                return;
            }

            const rows = await _computePlayerRows(tournaments);

            // Create or reuse table
            if (!_leaderboardTable) {
                _leaderboardTable = NewtonTable.create({
                    tableId: 'analytics-leaderboard',
                    containerId: 'leaderboardTableContainer',
                    defaultSortKey: 'points',
                    defaultSortDir: 'desc',
                    emptyMessage: 'No player data available.',
                    // A line under the 16th player, while the table is in points order
                    rowClass: (row) => row._rank === 16 && _leaderboardTable.data.length > 16 &&
                        _leaderboardTable.sortKey === 'points' && _leaderboardTable.sortDir === 'desc' ? 'an-cut' : '',
                    onRowClick: (row) => { focusPlayer(row.name); },
                    columns: [
                        { key: '_rank', label: '#', cellClass: 'nt-rank' },
                        { key: 'name', label: 'Player', width: '100%', cellClass: 'nt-name', render: (v) => escHtml(v) },
                        { key: 'points', label: 'Points', align: 'right', defaultDir: 'desc', cellClass: 'nt-pts', render: (v) => v ?? 0 },
                        { key: 'tournaments', label: 'Played', align: 'right', defaultDir: 'desc' },
                        _lbCount('p1st', '1st', 'Placements'),
                        _lbCount('p2nd', '2nd', 'Placements'),
                        _lbCount('p3rd', '3rd', 'Placements'),
                        _lbCount('p4th', '4th', 'Placements'),
                        _lbCount('p56th', '5–6th', 'Placements'),
                        _lbCount('p78th', '7–8th', 'Placements'),
                        _lbCount('oneEighties', '180s', 'Achievements'),
                        _lbCount('highOuts', 'High outs', 'Achievements'),
                        _lbCount('shortLegs', 'Short legs', 'Achievements'),
                        {
                            key: 'bestHighOut', label: 'Out', group: 'Best', align: 'right', defaultDir: 'desc',
                            render: (v) => v > 0 ? v : _DIM_DASH,
                            sortValue: (v) => v > 0 ? v : 0
                        },
                        {
                            key: 'bestShortLeg', label: 'Leg', group: 'Best', align: 'right', defaultDir: 'asc',
                            render: (v) => v < Infinity ? v : _DIM_DASH,
                            sortValue: (v) => v < Infinity ? v : 99999
                        },
                        {
                            key: 'avg', label: 'Avg', group: 'Best', align: 'right', defaultDir: 'desc',
                            render: (v) => v || _DIM_DASH,
                            sortValue: (v) => v ? parseFloat(v) : 0
                        },
                        { key: 'matchesWon', label: 'W', group: 'Matches', align: 'right', defaultDir: 'desc' },
                        { key: 'matchesLost', label: 'L', group: 'Matches', align: 'right', defaultDir: 'desc' },
                        { key: 'legsWon', label: 'W', group: 'Legs', align: 'right', defaultDir: 'desc' },
                        { key: 'legsLost', label: 'L', group: 'Legs', align: 'right', defaultDir: 'desc' }
                    ]
                });
            }

            if (seq !== _renderSeq.leaderboard) return; // superseded during the DB reads above

            _leaderboardRows = rows;
            _leaderboardTable.setData(rows);
            const meta = document.getElementById('leaderboardMeta');
            if (meta) meta.textContent = `${rows.length} players \u00b7 ${tournaments.length} tournaments`;

        } catch (e) {
            console.error('Leaderboard render failed:', e);
            container.innerHTML = '<div class="analytics-placeholder">' +
                '<p>Failed to load leaderboard.</p></div>';
        }
    }

    /**
     * Export the current leaderboard as CSV. Respects scope, point mode, and layers.
     */
    function exportLeaderboardCSV() {
        if (!_leaderboardRows || !_leaderboardRows.length) {
            alert('No leaderboard data to export.');
            return;
        }

        const headers = ['Rank', 'Player', '1st', '2nd', '3rd', '4th', '5-6th', '7-8th',
            '180s', 'High Outs', 'Short Legs', 'Played', 'Points',
            'Best Out', 'Best Leg', 'Avg', 'Matches W', 'Matches L', 'Legs W', 'Legs L'];

        const rows = _leaderboardRows.map(r => [
            r._rank,
            r.name,
            r.p1st || 0,
            r.p2nd || 0,
            r.p3rd || 0,
            r.p4th || 0,
            r.p56th || 0,
            r.p78th || 0,
            r.oneEighties || 0,
            r.highOuts || 0,
            r.shortLegs || 0,
            r.tournaments || 0,
            r.points || 0,
            r.bestHighOut > 0 ? r.bestHighOut : '',
            r.bestShortLeg < Infinity ? r.bestShortLeg : '',
            r.avg || '',
            r.matchesWon || 0,
            r.matchesLost || 0,
            r.legsWon || 0,
            r.legsLost || 0
        ]);

        const metadata = ['NewTon DC Tournament Manager — Leaderboard Export'];

        NewtonCSV.exportCSV({
            filename: 'Leaderboard_' + new Date().toISOString().slice(0, 10) + '.csv',
            headers: headers,
            rows: rows,
            metadata: metadata
        });
    }

    /**
     * Export the current leaderboard as JSON. Respects scope, point mode, and layers.
     */
    function exportLeaderboardJSON() {
        if (!_leaderboardRows || !_leaderboardRows.length) {
            alert('No leaderboard data to export.');
            return;
        }

        const data = _leaderboardRows.map(r => ({
            rank: r._rank,
            name: r.name,
            placements: { '1st': r.p1st, '2nd': r.p2nd, '3rd': r.p3rd, '4th': r.p4th, '5-6th': r.p56th, '7-8th': r.p78th },
            oneEighties: r.oneEighties || 0,
            highOuts: r.highOuts || 0,
            shortLegs: r.shortLegs || 0,
            tournaments: r.tournaments || 0,
            points: r.points || 0,
            bestCheckout: r.bestHighOut > 0 ? r.bestHighOut : null,
            bestLeg: r.bestShortLeg < Infinity ? r.bestShortLeg : null,
            average: r.avg ? parseFloat(r.avg) : null,
            matchesWon: r.matchesWon || 0,
            matchesLost: r.matchesLost || 0,
            legsWon: r.legsWon || 0,
            legsLost: r.legsLost || 0
        }));

        const content = JSON.stringify({ leaderboard: data, exported: new Date().toISOString() }, null, 2);
        const filename = 'Leaderboard_' + new Date().toISOString().slice(0, 10) + '.json';
        NewtonCSV.downloadFile(content, filename, 'application/json;charset=utf-8;');
    }

    // ---------------------------------------------------------------------------
    // Entry point — called by showPage('history') hook in main.js
    // ---------------------------------------------------------------------------

    /**
     * Render the history page. Initialises controls and shows the active view.
     */
    async function render() {
        initControls();
        _initHalfYearButtons();
        await _autoImportFromDisk();
        try {
            const all = await _loadAllTournaments();
            if (!_lensReady) _initLens(all);
            _ensureChecked(all);
            _syncLensInputs(all);
        } catch (e) { /* the views show their own error */ }
        await renderScopeIndicator();
        switchView(_activeView);
    }

    // ---------------------------------------------------------------------------
    // Auto-import shared tournaments from disk
    // ---------------------------------------------------------------------------

    /**
     * Check for shared tournaments on disk and import any that aren't
     * already in IndexedDB. Runs silently on every Analytics load.
     */
    async function _autoImportFromDisk() {
        if (typeof NewtonDB === 'undefined') return;

        let diskTournaments;
        try {
            const res = await fetch('api/list-tournaments.php');
            if (!res.ok) return; // API not available (local file use) — skip silently
            const data = await res.json();
            diskTournaments = data.tournaments || [];
        } catch (e) {
            return; // No server — skip silently
        }

        if (!diskTournaments.length) return;

        let imported = 0;
        for (const entry of diskTournaments) {
            // Match by ID if available, otherwise skip (can't reliably match)
            if (!entry.id) continue;

            const existing = await NewtonDB.getTournament(String(entry.id));
            if (existing) continue;

            // Fetch the full tournament JSON
            try {
                const res = await fetch('tournaments/' + entry.filename);
                if (!res.ok) continue;
                const t = await res.json();

                if (!t.id || !Array.isArray(t.players)) continue;

                await NewtonDB.backfillTournament(t, typeof config !== 'undefined' ? config : {});
                _checkedIds.add(String(t.id));
                imported++;
            } catch (e) {
                console.warn('[auto-import] Failed to import', entry.filename, e);
            }
        }

        if (imported > 0) {
            _invalidateCache();
            _applySelectionAsScope();
            console.log(`[auto-import] Imported ${imported} tournament(s) from disk`);
        }
    }

    // ---------------------------------------------------------------------------
    // Panel visibility
    // ---------------------------------------------------------------------------

    /** Currently visible register panel */
    let _activePanel = 'tournamentList';

    /** Active register sub-tab: 'tournaments' or 'matches' */
    let _activeRegisterTab = 'tournaments';

    /** Currently viewed match (for re-rendering on point mode change) */
    let _activeMatchContext = null;

    function showPanel(name) {
        _activePanel = name;
        ['tournamentList', 'allMatches', 'matchList', 'matchDetail'].forEach(p => {
            document.getElementById(`history${cap(p)}`).style.display = p === name ? '' : 'none';
        });
    }

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // ---------------------------------------------------------------------------
    // Achievement points computation
    // ---------------------------------------------------------------------------

    /**
     * A tournament's total points under the active point mode and layers: the sum of each
     * player's points (calculatePoints), so it matches the Leaderboard.
     * @param {object} tournament
     * @returns {number}
     */
    function _computeAchievementPoints(tournament) {
        const ta = tournament.tournamentAchievements;
        if (!ta) return 0;

        const p = _getActivePoints(tournament);
        const placements = tournament.placements || {};
        const include = { ranking: _layerRanking, attendance: _layerAttendance };

        let total = 0;
        Object.entries(ta).forEach(([pid, entry]) => {
            total += calculatePoints(entry.stats, placements[String(pid)], p, include);
        });
        return total;
    }

    /**
     * The tournament's winner: the player placed 1st.
     * @param {object} tournament
     * @returns {string} name, or '' when there is no placement
     */
    function _winnerName(tournament) {
        const placements = tournament.placements || {};
        const pid = Object.keys(placements).find(id => placements[id] === 1);
        const entry = pid && (tournament.tournamentAchievements || {})[pid];
        return entry ? (entry.name || '') : '';
    }

    // ---------------------------------------------------------------------------
    // Tournament list
    // ---------------------------------------------------------------------------

    /** @type {object|null} NewtonTable instance for the tournament list */
    let _tournamentTable = null;

    /** Set of currently checked tournament IDs in the Register */
    let _checkedIds = new Set();

    /** Current text filter value */
    let _textFilter = '';

    /** Current date range filter (YYYY-MM-DD strings or empty) */
    let _dateFrom = '';
    let _dateTo = '';

    async function renderTournamentList() {
        let all;
        try {
            all = await _loadAllTournaments();
        } catch (e) {
            console.error('Tournament list render failed:', e);
            const c = document.getElementById('historyTournamentTableContainer');
            if (c) c.innerHTML = '<div class="analytics-placeholder"><p>Failed to load tournaments.</p></div>';
            return;
        }

        _ensureChecked(all);

        // Create the table instance once, reuse on subsequent calls
        if (!_tournamentTable) {
            _tournamentTable = NewtonTable.create({
                tableId: 'analytics-tournaments',
                containerId: 'historyTournamentTableContainer',
                defaultSortKey: 'closedAt',
                defaultSortDir: 'desc',
                emptyMessage: 'No completed tournaments yet. Close a tournament to register it here.',
                rowClass: (row) => _checkedIds.has(row.tournamentId) ? '' : 'an-off',
                columns: [
                    {
                        key: '_select', sortable: false, width: '1%',
                        headerRender: () => {
                            const visible = _allTournaments ? _applyAllFilters(_allTournaments) : [];
                            const allChecked = visible.length > 0 && visible.every(t => _checkedIds.has(t.tournamentId));
                            return `<input type="checkbox" class="an-check" aria-label="Tick all"${allChecked ? ' checked' : ''} onclick="NewtonHistory.toggleAllTournaments(this.checked)">`;
                        },
                        render: (v, row) => {
                            const checked = _checkedIds.has(row.tournamentId) ? ' checked' : '';
                            return `<input type="checkbox" class="an-check" aria-label="Count this tournament" data-nh-action="toggle-tournament" data-tid="${escHtml(row.tournamentId)}"${checked}>`;
                        }
                    },
                    {
                        key: 'tournamentName', label: 'Tournament', width: '100%', cellClass: 'nt-name',
                        render: (v, row) => escHtml(v || row.tournamentId)
                    },
                    {
                        key: 'closedAt', label: 'Date',
                        render: (v) => v ? fmtDate(v) : '',
                        sortValue: (v) => v ? tsToMs(v) : 0
                    },
                    {
                        key: 'tournamentFormat', label: 'Format', columnClass: 'an-wide-only',
                        render: (v) => v ? `<span class="st-pill nt-pill">${v === 'SE' ? 'Single elim.' : v === 'DE' ? 'Double elim.' : escHtml(v)}</span>` : '—'
                    },
                    {
                        key: 'playerCount', label: 'Players', align: 'right', defaultDir: 'desc',
                        render: (v) => v || '—'
                    },
                    {
                        key: 'matchCount', label: 'Matches', align: 'right', defaultDir: 'desc', columnClass: 'an-wide-only',
                        render: (v) => v != null ? v : '—'
                    },
                    {
                        key: '_achievementPoints', label: 'Points', align: 'right', defaultDir: 'desc', cellClass: 'nt-pts',
                        render: (v) => v != null ? v : '—',
                        sortValue: (v) => v || 0
                    },
                    {
                        key: '_winner', label: 'Winner', columnClass: 'an-wide-only',
                        render: (v) => v ? escHtml(v) : _DIM_DASH
                    },
                    {
                        key: '_actions', label: '', sortable: false, align: 'right', cellClass: 'an-acts', columnClass: 'an-wide-only',
                        render: (v, row) => {
                            let html = '';
                            if (window.NEWTON_APP_MODE === 'analytics') {
                                html += `<button type="button" class="st-btn st-sm" data-nh-action="view-bracket" data-tid="${escHtml(row.tournamentId)}">Bracket</button>`;
                            }
                            if (window.NEWTON_APP_MODE !== 'analytics' && _correctionsAvailable) {
                                html += `<button type="button" class="st-btn st-sm" data-nh-action="edit-corrections" data-tid="${escHtml(row.tournamentId)}">Edit</button>`;
                            }
                            const allowDelete = typeof config !== 'undefined' && config.server && config.server.allowSharedTournamentDelete;
                            if (allowDelete) {
                                const safeId = escHtml(row.tournamentId);
                                const safeName = escHtml(row.tournamentName || row.tournamentId);
                                const safeDate = row.closedAt ? escHtml(fmtDate(row.closedAt)) : '';
                                html += `<button type="button" class="st-btn st-sm an-danger" data-nh-action="delete-tournament" data-tid="${safeId}" data-name="${safeName}" data-date="${safeDate}">Delete</button>`;
                            }
                            return html;
                        }
                    }
                ],
                onRowClick: (row) => openTournament(row.tournamentId)
            });
        }

        // Self-heal: compute and persist matchCount for records that don't have it
        for (const t of all) {
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

        // Compute achievement points per tournament
        for (const t of all) {
            t._achievementPoints = _computeAchievementPoints(t);
            t._winner = _winnerName(t);
        }

        // Apply all filters — show only matching tournaments
        let tournaments = _applyAllFilters(all);

        // Add _rowId for row click identification
        tournaments.forEach(t => { t._rowId = t.tournamentId; });
        _tournamentTable.setData(tournaments);
        _wireTableActions('historyTournamentTableContainer');
        _updateTournamentMeta();
        _syncLensInputs(all);
    }

    /**
     * Tick every tournament the first time, or the ones in a restored scope. Done before
     * any view draws, so the lens works from every view, not only once Register has opened.
     * @param {object[]} all - every finalized tournament
     */
    function _ensureChecked(all) {
        if (_checkedIds.size) return;
        _checkedIds = new Set(_scope ? _scope : all.map(t => t.tournamentId));
    }

    /**
     * Show the lens values in its inputs: the saved ones, or the register's first and last
     * dates when no date range is set.
     * @param {object[]} all - every finalized tournament
     */
    function _syncLensInputs(all) {
        const filterInput = document.getElementById('analyticsTextFilter');
        if (filterInput && filterInput.value !== _textFilter) {
            filterInput.value = _textFilter;
        }
        const fromInput = document.getElementById('analyticsDateFrom');
        const toInput = document.getElementById('analyticsDateTo');
        if (fromInput && toInput) {
            if (_dateFrom || _dateTo) {
                fromInput.value = _dateFrom;
                toInput.value = _dateTo;
            } else {
                const dates = all.filter(t => t.closedAt).map(t => fmtDate(t.closedAt)).sort();
                fromInput.value = dates.length ? dates[0] : '';
                toInput.value = dates.length ? dates[dates.length - 1] : '';
            }
        }
    }

    /** "N of M ticked" in the tournament list's heading. */
    function _updateTournamentMeta() {
        const el = document.getElementById('historyTournamentMeta');
        if (!el) return;
        const visible = _allTournaments ? _applyAllFilters(_allTournaments) : [];
        const ticked = visible.filter(t => _checkedIds.has(t.tournamentId)).length;
        el.textContent = visible.length ? `${ticked} of ${visible.length} ticked` : '';
    }

    /**
     * Toggle a single tournament in/out of the checked set, then apply scope.
     * @param {string} tournamentId
     * @param {boolean} checked
     */
    function toggleTournament(tournamentId, checked) {
        if (checked) {
            _checkedIds.add(tournamentId);
        } else {
            _checkedIds.delete(tournamentId);
        }
        _applySelectionAsScope();
        if (_tournamentTable) _tournamentTable.refresh(); // the tick-all box and the dimmed rows
        _updateTournamentMeta();
    }

    /**
     * Toggle all tournaments on or off and apply.
     * @param {boolean} checked
     */
    function toggleAllTournaments(checked) {
        const visible = _allTournaments ? _applyAllFilters(_allTournaments) : [];
        if (checked) {
            visible.forEach(t => _checkedIds.add(t.tournamentId));
        } else {
            visible.forEach(t => _checkedIds.delete(t.tournamentId));
        }
        _applySelectionAsScope();
        if (_tournamentTable) _tournamentTable.refresh();
        _updateTournamentMeta();
    }

    /** Convert the current checkbox + filter state into the active scope. */
    function _applySelectionAsScope() {
        const all = _allTournaments || [];
        const visible = _applyAllFilters(all);
        const effectiveIds = visible.filter(t => _checkedIds.has(t.tournamentId)).map(t => t.tournamentId);

        if (effectiveIds.length === all.length) {
            setScope(null); // all selected = no filter
        } else {
            setScope(effectiveIds); // includes empty array = nothing selected
        }
    }

    // ---------------------------------------------------------------------------
    // Text filter
    // ---------------------------------------------------------------------------

    /**
     * Filter tournaments by the current text filter. AND logic: all space-separated
     * terms must match the tournament name (case-insensitive).
     * @param {object[]} tournaments
     * @returns {object[]}
     */
    function _filterByText(tournaments) {
        if (!_textFilter) return tournaments;
        const terms = _textFilter.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length) return tournaments;
        return tournaments.filter(t => {
            const name = (t.tournamentName || '').toLowerCase();
            return terms.every(term => name.includes(term));
        });
    }

    /**
     * Handle text filter input. Filters the visible table and persists.
     * @param {string} value
     */
    function onTextFilter(value) {
        _textFilter = value.trim();

        if (!_allTournaments) return;

        const filtered = _applyAllFilters(_allTournaments);
        filtered.forEach(t => { t._rowId = t.tournamentId; });
        if (_tournamentTable) _tournamentTable.setData(filtered);

        // Recompute scope — filters narrow what's in scope
        _applySelectionAsScope();
        _updateTournamentMeta();
        _refreshActiveView();
    }

    // ---------------------------------------------------------------------------
    // Date range filter
    // ---------------------------------------------------------------------------

    /**
     * Filter tournaments by the current date range. Inclusive on both ends.
     * Compares against closedAt, using the YYYY-MM-DD date portion.
     * @param {object[]} tournaments
     * @returns {object[]}
     */
    function _filterByDate(tournaments) {
        if (!_dateFrom && !_dateTo) return tournaments;
        return tournaments.filter(t => {
            if (!t.closedAt) return false;
            const d = fmtDate(t.closedAt); // YYYY-MM-DD string
            if (_dateFrom && d < _dateFrom) return false;
            if (_dateTo && d > _dateTo) return false;
            return true;
        });
    }

    /** Handle date range input change. */
    function onDateFilter() {
        const fromEl = document.getElementById('analyticsDateFrom');
        const toEl = document.getElementById('analyticsDateTo');
        _dateFrom = fromEl ? fromEl.value : '';
        _dateTo = toEl ? toEl.value : '';

        if (!_allTournaments) return;

        const filtered = _applyAllFilters(_allTournaments);
        filtered.forEach(t => { t._rowId = t.tournamentId; });
        if (_tournamentTable) _tournamentTable.setData(filtered);

        _applySelectionAsScope();
        _updateTournamentMeta();
        _refreshActiveView();
    }

    // ---------------------------------------------------------------------------
    // Half-year presets
    // ---------------------------------------------------------------------------

    /**
     * Compute the start/end dates for a half-year relative to the current one.
     * @param {number} offset - 0 = current half, -1 = previous half, etc.
     * @returns {{ from: string, to: string, label: string }}
     */
    function _getHalfYear(offset) {
        const now = new Date();
        let year = now.getFullYear();
        let half = now.getMonth() < 6 ? 1 : 2; // H1 = Jan-Jun, H2 = Jul-Dec

        // Apply offset
        half += offset;
        while (half < 1) { half += 2; year--; }
        while (half > 2) { half -= 2; year++; }

        const from = half === 1 ? `${year}-01-01` : `${year}-07-01`;
        const to   = half === 1 ? `${year}-06-30` : `${year}-12-31`;
        const label = `H${half} ${year}`;

        return { from, to, label };
    }

    /** Populate the half-year button labels. Called on render. */
    function _initHalfYearButtons() {
        const current = _getHalfYear(0);
        const previous = _getHalfYear(-1);
        const btn1 = document.getElementById('lensCurrentHalf');
        const btn2 = document.getElementById('lensPreviousHalf');
        if (btn1) btn1.textContent = current.label;
        if (btn2) btn2.textContent = previous.label;
    }

    /**
     * Set the date range to a half-year period.
     * @param {number} offset - 0 = current half, -1 = previous half
     */
    function setHalfYear(offset) {
        const hy = _getHalfYear(offset);
        _dateFrom = hy.from;
        _dateTo = hy.to;

        const fromInput = document.getElementById('analyticsDateFrom');
        const toInput = document.getElementById('analyticsDateTo');
        if (fromInput) fromInput.value = _dateFrom;
        if (toInput) toInput.value = _dateTo;

        if (!_allTournaments) return;

        const filtered = _applyAllFilters(_allTournaments);
        filtered.forEach(t => { t._rowId = t.tournamentId; });
        if (_tournamentTable) _tournamentTable.setData(filtered);

        _applySelectionAsScope();
        _updateTournamentMeta();
        _refreshActiveView();
    }

    // ---------------------------------------------------------------------------
    // Reset all filters
    // ---------------------------------------------------------------------------

    /** Reset all filters to defaults: clear text, reset dates, check all tournaments. */
    async function resetFilters() {
        _textFilter = '';
        _dateFrom = '';
        _dateTo = '';

        const all = await _loadAllTournaments();
        _checkedIds = new Set(all.map(t => t.tournamentId));
        setScope(null);

        // Reset the lens inputs (the dates show the register's range again)
        _syncLensInputs(all);

        // Re-render the list (re-created so its tick-all box resets), then the view on screen
        if (_tournamentTable) {
            _tournamentTable = null;
        }
        await renderTournamentList();
        _refreshActiveView();
    }

    // ---------------------------------------------------------------------------
    // Combined filter pipeline
    // ---------------------------------------------------------------------------

    /**
     * Apply all filters (text + date) to a tournament list.
     * @param {object[]} tournaments
     * @returns {object[]}
     */
    function _applyAllFilters(tournaments) {
        return _filterByDate(_filterByText(tournaments));
    }

    // ---------------------------------------------------------------------------
    // All matches (flat list across scope)
    // ---------------------------------------------------------------------------

    /** @type {object|null} NewtonTable instance for the all-matches view */
    let _allMatchesTable = null;

    /** Breadcrumb state for the Tournaments drill-down path */
    let _breadcrumbTournament = null; // { id, name }
    let _breadcrumbMatch = null;      // { id }

    /** Show tournament list panel (used by back buttons). */
    function showTournamentList() {
        switchRegisterTab('tournaments');
    }

    /**
     * Switch the active register sub-tab.
     * @param {'tournaments'|'matches'} tab
     */
    function switchRegisterTab(tab) {
        _activeRegisterTab = tab;

        // Reset drill-down state when switching tabs
        _breadcrumbTournament = null;
        _breadcrumbMatch = null;

        _updateBreadcrumb();

        if (tab === 'tournaments') {
            showPanel('tournamentList');
            renderTournamentList();
        } else {
            renderAllMatches();
        }
    }

    /**
     * Rebuild the breadcrumb bar based on the current drill-down state.
     * Tournaments (top) / Tournament Name / Match ID    |    Matches
     */
    // Wire one capture-phase delegated listener for in-cell action buttons/checkboxes.
    // Capture runs before NewtonTable's row onclick, so stopPropagation on an action
    // element suppresses the row click, while plain row clicks pass through untouched.
    // Action values ride in data-* attributes (HTML-escaped → safe), never in handler
    // strings — so names/ids can't break out of an onclick or inject markup.
    function _wireTableActions(containerId) {
        const container = document.getElementById(containerId);
        if (!container || container._nhActionsWired) return;
        container._nhActionsWired = true;
        container.addEventListener('click', (e) => {
            const el = e.target.closest('[data-nh-action]');
            if (!el) return;
            e.stopPropagation();
            const tid = el.getAttribute('data-tid');
            switch (el.getAttribute('data-nh-action')) {
                case 'toggle-player':     togglePlayer(el.getAttribute('data-name'), el.checked); break;
                case 'toggle-tournament': toggleTournament(tid, el.checked); break;
                case 'view-bracket':      viewBracketForTournament(tid); break;
                case 'delete-tournament': promptDeleteTournament(tid, el.getAttribute('data-name'), el.getAttribute('data-date')); break;
                case 'edit-corrections':  openCorrections(tid); break;
                case 'open-tournament':   openTournament(tid); break;
            }
        }, true);
    }

    function _updateBreadcrumb() {
        const container = document.getElementById('registerBreadcrumb');
        if (!container) return;

        const onTournaments = _activeRegisterTab === 'tournaments';
        let html = '<div class="st-seg" role="group" aria-label="Register">' +
            `<button type="button" aria-pressed="${onTournaments}" onclick="NewtonHistory.switchRegisterTab('tournaments')">Tournaments</button>` +
            `<button type="button" aria-pressed="${!onTournaments}" onclick="NewtonHistory.switchRegisterTab('matches')">Matches</button>` +
            '</div>';

        // The path back from an opened tournament or match
        if (onTournaments && _breadcrumbTournament) {
            const tLabel = escHtml(_breadcrumbTournament.name);
            const tDate = _breadcrumbTournament.date ? `<small>${escHtml(_breadcrumbTournament.date)}</small>` : '';
            html += '<div class="an-crumbs">' +
                `<button type="button" class="st-link" onclick="NewtonHistory.switchRegisterTab('tournaments')">Tournaments</button>` +
                '<span class="an-sep">/</span>';
            if (_breadcrumbMatch) {
                html += `<button type="button" class="st-link" data-nh-action="open-tournament" data-tid="${escHtml(_breadcrumbTournament.id)}">${tLabel}</button>` +
                    '<span class="an-sep">/</span>' +
                    `<b>${escHtml(_breadcrumbMatch.id)}</b>`;
            } else {
                html += `<b>${tLabel}${tDate}</b>`;
            }
            html += '</div>';
        }

        container.innerHTML = html;
        _wireTableActions('registerBreadcrumb');
    }

    /**
     * The match table's columns, shared by a tournament's matches and the list of all matches.
     * @param {boolean} withTournament - add the Tournament column (all matches)
     * @returns {object[]} NewtonTable columns
     */
    function _matchColumns(withTournament) {
        const player = (n) => (v, row) => `<span class="${row.winner === n ? 'nt-win' : 'nt-lose'}">${escHtml(v)}</span>`;
        const cols = [
            { key: 'matchId', label: 'Match', render: (v) => matchIdTag(v) },
            { key: 'player1Name', label: 'Player 1', render: player(1) },
            {
                key: 'score', label: 'Result', align: 'center', sortable: false, cellClass: 'nt-score',
                render: (v, row) => row.legsWon ? `${row.legsWon.p1}–${row.legsWon.p2}` : '—'
            },
            { key: 'player2Name', label: 'Player 2', width: '100%', render: player(2) },
            {
                key: '_achievementPoints', label: 'Points', align: 'right', defaultDir: 'desc',
                render: (v) => v || _DIM_DASH,
                sortValue: (v) => v || 0
            }
        ];
        if (withTournament) {
            cols.push({
                key: '_tournamentName', label: 'Tournament', columnClass: 'an-wide-only',
                render: (v, row) => `<button type="button" class="st-link" data-nh-action="open-tournament" data-tid="${escHtml(row._tournamentId)}">${escHtml(v)}</button>`
            });
        }
        cols.push(
            {
                key: 'completedAt', label: 'Date', columnClass: 'an-wide-only',
                render: (v) => v ? fmtDate(v) : '—',
                sortValue: (v) => v ? tsToMs(v) : 0
            },
            { key: 'matchType', label: 'Type', columnClass: 'an-wide-only', render: (v) => _typePill(v) }
        );
        return cols;
    }

    /**
     * How a match was scored, as a pill.
     * @param {string} matchType - 'CHALKER' or anything else (entered by hand)
     * @returns {string} HTML
     */
    function _typePill(matchType) {
        return matchType === 'CHALKER'
            ? '<span class="st-pill nt-pill nt-chalker">Chalker</span>'
            : '<span class="st-pill nt-pill">Manual</span>';
    }

    /**
     * Render a flat list of all matches across the scoped tournaments.
     */
    async function renderAllMatches() {
        const allMatches = [];
        try {
            const tournaments = await getScopedTournaments();

            const matchLists = await _loadMatchesFor(tournaments);

            for (let i = 0; i < tournaments.length; i++) {
                const t = tournaments[i];
                const matches = matchLists[i];
                const p = _getActivePoints(t);

                matches.forEach(m => {
                    // Compute per-match achievement points
                    const ach = m.achievements || {};
                    let pts = 0;
                    Object.values(ach).forEach(a => {
                        if (!a || typeof a !== 'object') return;
                        pts += calculateAchievementPoints(a, p);
                    });
                    m._achievementPoints = pts;
                    m._tournamentName = t.tournamentName || t.tournamentId;
                    m._tournamentId = t.tournamentId;
                    m._rowId = t.tournamentId + ':' + m.matchId;
                });

                allMatches.push(...matches);
            }

            // Update meta
            const metaEl = document.getElementById('historyAllMatchesMeta');
            if (metaEl) metaEl.textContent = `${allMatches.length} in ${tournaments.length} tournaments`;
        } catch (e) {
            console.error('All-matches render failed:', e);
            const c = document.getElementById('historyAllMatchesTableContainer');
            if (c) c.innerHTML = '<div class="analytics-placeholder"><p>Failed to load matches.</p></div>';
            return;
        }

        // Create table instance once
        if (!_allMatchesTable) {
            _allMatchesTable = NewtonTable.create({
                tableId: 'analytics-all-matches',
                containerId: 'historyAllMatchesTableContainer',
                defaultSortKey: 'completedAt',
                defaultSortDir: 'desc',
                emptyMessage: 'No matches in the lens.',
                columns: _matchColumns(true),
                onRowClick: (row) => openMatch(row._tournamentId, row.matchId)
            });
        }

        _allMatchesTable.setData(allMatches);
        _wireTableActions('historyAllMatchesTableContainer');
        showPanel('allMatches');
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

        // Update breadcrumb: Tournaments / TournamentName
        _activeRegisterTab = 'tournaments';
        _breadcrumbTournament = { id: tournamentId, name: tournament.tournamentName || tournamentId, date: tournament.tournamentDate || null };
        _breadcrumbMatch = null;
        _updateBreadcrumb();

        _activeTournament = tournament;

        let matchRecords;
        try {
            matchRecords = await NewtonDB.getMatchesByTournament(tournamentId);
        } catch (e) {
            alert('Could not load matches: ' + e.message);
            return;
        }

        // Heading, buttons and facts. Points come from the corrected record the views use.
        const counted = (_allTournaments || []).find(t => t.tournamentId === tournamentId) || tournament;
        const format = tournament.tournamentFormat === 'DE' ? 'Double elim.' : tournament.tournamentFormat === 'SE' ? 'Single elim.' : (tournament.tournamentFormat || '—');
        const fact = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
        document.getElementById('historyMatchListTitle').innerHTML =
            escHtml(tournament.tournamentName || tournamentId) + (tournament.closedAt ? ` <small>${fmtDate(tournament.closedAt)}</small>` : '');
        let tools = '';
        if (window.NEWTON_APP_MODE === 'analytics') {
            tools += `<button type="button" class="st-btn st-sm" data-nh-action="view-bracket" data-tid="${escHtml(tournamentId)}">Bracket</button>`;
        }
        if (window.NEWTON_APP_MODE !== 'analytics' && _correctionsAvailable) {
            tools += `<button type="button" class="st-btn st-sm" data-nh-action="edit-corrections" data-tid="${escHtml(tournamentId)}">Edit</button>`;
        }
        document.getElementById('historyMatchListTools').innerHTML = tools;
        _wireTableActions('historyMatchListTools');
        document.getElementById('historyMatchListMeta').innerHTML =
            fact('Format', escHtml(format)) +
            fact('Players', tournament.playerCount || '—') +
            fact('Matches', matchRecords.length) +
            fact('Points', _computeAchievementPoints(counted)) +
            fact('Winner', escHtml(_winnerName(counted)) || '—');

        // Create the table instance once, reuse on subsequent calls
        if (!_matchTable) {
            _matchTable = NewtonTable.create({
                tableId: 'analytics-matches',
                containerId: 'historyMatchTableContainer',
                defaultSortKey: 'completedAt',
                defaultSortDir: 'asc',
                emptyMessage: 'No match records found.',
                columns: _matchColumns(false),
                onRowClick: (row) => openMatch(row._tournamentId, row.matchId)
            });
        }

        // Compute per-match achievement points using active point mode
        const p = _getActivePoints(tournament);

        matchRecords.forEach(m => {
            m._tournamentId = tournamentId;
            const ach = m.achievements || {};
            let total = 0;
            Object.values(ach).forEach(a => {
                if (!a || typeof a !== 'object') return;
                total += calculateAchievementPoints(a, p);
            });
            m._achievementPoints = total;
        });

        // Add _rowId for row click identification
        matchRecords.forEach(m => { m._rowId = m.matchId; });
        _matchTable.setData(matchRecords);

        showPanel('matchList');
    }

    // ---------------------------------------------------------------------------
    // Bracket view (analytics mode only)
    // ---------------------------------------------------------------------------

    /**
     * Load bracket for a tournament by ID (from tournament list).
     * Sets _activeTournament first, then delegates to viewBracket().
     * @param {string} tournamentId
     */
    async function viewBracketForTournament(tournamentId) {
        try {
            const t = await NewtonDB.getTournament(tournamentId);
            if (!t) { alert('Tournament not found.'); return; }
            _activeTournament = t;
            await viewBracket();
        } catch (e) {
            alert('Could not load tournament: ' + e.message);
        }
    }

    /**
     * Load the active tournament's JSON from disk and show the bracket.
     * Only available in analytics mode where all tournaments have JSON on disk.
     */
    async function viewBracket() {
        if (!_activeTournament) return;

        const tid = _activeTournament.tournamentId;
        const tName = (_activeTournament.tournamentName || '').toLowerCase();
        const tDate = _activeTournament.tournamentDate || (_activeTournament.closedAt ? fmtDate(_activeTournament.closedAt) : '');

        try {
            // Find the matching file via list-tournaments API
            const listRes = await fetch('api/list-tournaments.php');
            if (!listRes.ok) throw new Error('Could not fetch tournament list');
            const listData = await listRes.json();

            // Match by ID first, fallback to name+date
            const entry = (listData.tournaments || []).find(t => {
                if (t.id != null && String(t.id) === String(tid)) return true;
                return (t.name || '').toLowerCase() === tName && t.date === tDate;
            });

            if (!entry) throw new Error('Tournament file not found on server');

            // Fetch the full tournament JSON
            const res = await fetch('tournaments/' + entry.filename);
            if (!res.ok) throw new Error('Could not load tournament file');
            const data = await res.json();

            // Write to currentTournament so watermark and existing code paths work.
            // _analyticsPreview flag prevents saveTournamentOnly() from persisting to dartsTournaments.
            data.readOnly = true;
            data._analyticsPreview = true;

            // 4.3: Preserve the real active tournament (if any) so exiting the
            // preview restores it instead of deactivating it. Don't overwrite the
            // stash when chaining preview→preview (prior is itself a preview).
            const priorCurrent = localStorage.getItem('currentTournament');
            let priorIsPreview = false;
            try {
                priorIsPreview = !!(priorCurrent && JSON.parse(priorCurrent)._analyticsPreview);
            } catch (e) { /* corrupt prior — treat as non-preview */ }
            if (!priorIsPreview) {
                if (priorCurrent) {
                    localStorage.setItem('_preAnalyticsPreviewTournament', priorCurrent);
                } else {
                    localStorage.removeItem('_preAnalyticsPreviewTournament');
                }
            }

            localStorage.setItem('currentTournament', JSON.stringify(data));

            // Set globals for the bracket renderer
            tournament = data;
            players = data.players || [];
            matches = data.matches || [];

            // Show the bracket tab and render
            if (typeof showPage === 'function') showPage('tournament');
            if (typeof renderBracket === 'function') renderBracket();

        } catch (e) {
            console.error('viewBracket failed:', e);
            alert('Could not load bracket: ' + e.message);
        }
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

        // Fetch the match's own tournament record — points must come from THIS
        // tournament's configSnapshot, not whichever was last opened via openTournament
        let matchTournament = null;
        try {
            matchTournament = await NewtonDB.getTournament(tournamentId);
        } catch (_) {}

        // Update breadcrumb: Tournaments / TournamentName / MatchId
        if (!_breadcrumbTournament || _breadcrumbTournament.id !== tournamentId) {
            const t = matchTournament;
            _breadcrumbTournament = { id: tournamentId, name: t ? (t.tournamentName || tournamentId) : tournamentId, date: t ? (t.tournamentDate || null) : null };
        }
        _breadcrumbMatch = { id: matchId };
        _activeRegisterTab = 'tournaments';
        _updateBreadcrumb();

        const bodyEl = document.getElementById('historyMatchDetailBody');
        bodyEl.innerHTML = _buildMatchDetailHtml(match, _breadcrumbTournament, matchTournament);
        _activeMatchContext = { tournamentId, matchId };
        showPanel('matchDetail');
    }

    // ---------------------------------------------------------------------------
    // Shared match detail HTML builder
    // ---------------------------------------------------------------------------

    function _buildMatchDetailHtml(match, tournamentInfo, tournamentRecord) {
        const w1 = match.winner === 1;
        const w2 = match.winner === 2;
        const n1 = escHtml(match.player1Name);
        const n2 = escHtml(match.player2Name);
        const legs = match.legsWon ? `${match.legsWon.p1}–${match.legsWon.p2}` : '—';
        const date = match.completedAt ? fmtDateTime(match.completedAt) : '—';
        const tName = (tournamentInfo && tournamentInfo.name) || match.tournamentName || '';
        const bo = match.format && match.format.bo ? `<span class="st-pill nt-pill">Best of ${match.format.bo}</span>` : '';

        // Match number, length and how it was scored; then where and when
        let html = '<div class="nt-match">' +
            '<div class="nt-match-head">' +
                `<div class="nt-match-tags">${matchIdTag(match.matchId)}${bo}${_typePill(match.matchType)}</div>` +
                `<span class="nt-match-when">${tName ? escHtml(tName) + ' · ' : ''}${date}</span>` +
            '</div>' +
            '<div class="nt-match-score">' +
                `<div class="nt-match-p${w1 ? ' nt-match-w' : ''}">${n1}</div>` +
                `<div class="nt-match-s">${legs}</div>` +
                `<div class="nt-match-p${w2 ? ' nt-match-w' : ''}">${n2}</div>` +
            '</div>';

        // Achievements and points, each player — always shown
        const ach = match.achievements || {};
        const a1 = (ach.p1 || ach[match.player1Id]) || {};
        const a2 = (ach.p2 || ach[match.player2Id]) || {};
        const num = (v) => v ? v : '<span class="nt-dim">—</span>';
        const list = (v) => (Array.isArray(v) && v.length) ? v.join(', ') : '<span class="nt-dim">—</span>';
        const p = tournamentRecord ? _getActivePoints(tournamentRecord) : { oneEighty: 0, ton: 0, highOut: 0, shortLeg: 0 };
        const row = (name, a, won) => `<tr>
                <td class="nt-name"><span class="${won ? 'nt-win' : 'nt-lose'}">${name}</span></td>
                <td>${num(a.oneEighties)}</td>
                <td>${num(a.tons)}</td>
                <td>${list(a.highOuts)}</td>
                <td>${list(a.shortLegs)}</td>
                <td class="nt-pts">${num(calculateAchievementPoints(a, p))}</td>
            </tr>`;
        html += `<div class="newton-table-scroll"><table class="newton-table nt-match-stats">
            <thead><tr><th>Player</th><th>180s</th><th>Tons</th><th>High outs</th><th>Short legs</th><th>Points</th></tr></thead>
            <tbody>${row(n1, a1, w1)}${row(n2, a2, w2)}</tbody></table></div>`;

        // Legs (Chalker only)
        if (match.matchType === 'CHALKER' && Array.isArray(match.legs) && match.legs.length > 0) {
            const fls = match.firstStarter || 1;
            html += `<h4 class="nt-match-sub">Legs <small>from the Chalker</small></h4>
            <div class="newton-table-scroll"><table class="newton-table nt-match-legs">
                <thead><tr><th>#</th><th>Winner</th><th>Threw first</th><th>${n1}</th><th>${n2}</th><th title="Darts at double">CD</th></tr></thead><tbody>`;
            match.legs.forEach((leg, i) => {
                const throwsFirst = ((fls - 1 + i) % 2 === 0) ? n1 : n2;
                const v1 = NewtonStats.decodeVisits(leg.s, 0);
                const v2 = NewtonStats.decodeVisits(leg.s, 1);
                html += `<tr>
                    <td class="nt-rank">${i + 1}</td>
                    <td class="nt-name">${leg.w === 1 ? n1 : n2}</td>
                    <td>${throwsFirst}</td>
                    <td class="nt-visits">${v1.join(', ') || '—'}</td>
                    <td class="nt-visits">${v2.join(', ') || '—'}</td>
                    <td>${leg.cd === 0 ? 'TB' : leg.cd}</td>
                </tr>`;
            });
            html += '</tbody></table></div>';
        }

        return html + '</div>';
    }

    // ---------------------------------------------------------------------------
    // Import Tournament from JSON file
    // ---------------------------------------------------------------------------

    /**
     * Import a single tournament JSON file into the Analytics register.
     * Uses the shared backfillTournament() in newton-db.js.
     * Works without the API — direct file to IndexedDB.
     * @param {Event} event - file input change event
     */
    async function importTournament(event) {
        const file = event.target.files[0];
        if (!file) return;

        let t;
        try {
            const text = await file.text();
            t = JSON.parse(text);
        } catch (e) {
            alert('Could not read file: ' + (e.message || e));
            event.target.value = '';
            return;
        }

        // Validate required fields
        if (!t.id || !t.name || !Array.isArray(t.players)) {
            alert('Invalid tournament file. Expected a tournament JSON export with id, name, and players.');
            event.target.value = '';
            return;
        }

        // Check if already in Analytics
        const existing = await NewtonDB.getTournament(String(t.id));
        if (existing) {
            alert(`"${t.name}" (${t.date || '?'}) is already in the Analytics register.`);
            event.target.value = '';
            return;
        }

        const playerCount = t.players.length;
        const completedMatches = Array.isArray(t.matches) ? t.matches.filter(m => m.completed && m.winner).length : 0;
        const totalMatches = Array.isArray(t.matches) ? t.matches.length : 0;

        // Populate sidebar with imported file's metadata (safe via textContent)
        const formatLabel = t.format === 'SE' ? 'Single Elimination' : 'Double Elimination';
        const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setText('analyticsImportName', t.name);
        setText('analyticsImportDate', t.date || '-');
        setText('analyticsImportStatus', typeof tournamentStatusLabel === 'function' ? tournamentStatusLabel(t) : '-');
        setText('analyticsImportProgress', `${completedMatches} of ${totalMatches}`);
        setText('analyticsImportPlayers', playerCount);

        // Description varies on whether the format is known
        const descEl = document.getElementById('analyticsImportDesc');
        if (descEl) {
            descEl.textContent = t.format
                ? `Add this ${formatLabel} tournament to the Analytics register. No existing data is modified.`
                : 'Add this tournament to the Analytics register. No existing data is modified.';
        }

        // Toggle the "Missing settings" pill + warning paragraph together when no config snapshot
        const showMissingSettings = !t.config;
        const pillEl = document.getElementById('analyticsImportMissingSettingsPill');
        const warningEl = document.getElementById('analyticsImportWarning');
        if (pillEl) pillEl.style.display = showMissingSettings ? '' : 'none';
        if (warningEl) warningEl.style.display = showMissingSettings ? '' : 'none';

        const confirmBtn = document.getElementById('analyticsImportConfirmBtn');
        if (!confirmBtn) { event.target.value = ''; return; }

        // Wire up confirm button with a one-time handler. Remove any handler left
        // from a previously cancelled import first — Escape/cancel never fires the
        // old one, and a stale handler would import that file alongside the new one.
        if (confirmBtn._importHandler) {
            confirmBtn.removeEventListener('click', confirmBtn._importHandler);
        }
        const handler = async () => {
            confirmBtn.removeEventListener('click', handler);
            confirmBtn._importHandler = null;
            popDialog();

            try {
                const cfgSnapshot = t.config || (typeof config !== 'undefined' ? config : {});
                const result = await NewtonDB.backfillTournament(t, cfgSnapshot);

                _invalidateCache();
                _checkedIds.add(String(t.id));
                _applySelectionAsScope();
                await renderTournamentList();
                alert(`Imported "${t.name}" — ${result.matchCount} matches.`);

            } catch (e) {
                alert('Import failed: ' + (e.message || e));
            }
        };
        confirmBtn._importHandler = handler;
        confirmBtn.addEventListener('click', handler);
        pushDialog('analyticsImportModal');

        event.target.value = '';
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

        const bodyEl = document.getElementById('matchDetailModalBody');

        const t = await NewtonDB.getTournament(tournamentId);
        const tInfo = t ? { name: t.tournamentName, date: t.tournamentDate } : null;
        bodyEl.innerHTML = _buildMatchDetailHtml(match, tInfo, t);

        pushDialog('matchDetailModal', null, true);
    }

    // ---------------------------------------------------------------------------
    // Delete tournament (History tab)
    // ---------------------------------------------------------------------------

    /** State for the delete confirmation modal */
    let _pendingDeleteId   = null;
    let _pendingDeleteName = null;

    function promptDeleteTournament(tournamentId, tournamentName, tournamentDate) {
        _pendingDeleteId   = tournamentId;
        _pendingDeleteName = tournamentName;

        document.getElementById('historyDeleteTournamentDisplayName').textContent = tournamentName;
        document.getElementById('historyDeleteTournamentDate').textContent = tournamentDate || '-';
        const input = document.getElementById('historyDeleteTournamentInput');
        input.value = '';
        input.placeholder = tournamentName;
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

        _invalidateCache();
        _checkedIds.delete(id);
        _applySelectionAsScope();
        await renderTournamentList();
    }

    // ---------------------------------------------------------------------------
    // Achievement corrections (Docker only)
    // ---------------------------------------------------------------------------
    //
    // A layer on top of the register: per tournament, per player, add or subtract
    // achievements. Stored on the server (api/corrections.php) so every browser sees
    // the same thing, and applied in _loadAllTournaments() — the register in IndexedDB
    // is never modified. Each record holds the difference from what was recorded:
    //   { tournamentId, playerId, playerName, oneEighties, tons, lollipops,
    //     highOuts: {add, remove}, shortLegs: {add, remove} }

    /** True once the corrections API has answered — i.e. we are served by the container. */
    let _correctionsAvailable = false;

    /** Correction modal state: { tournamentId, base, edited, pid } */
    let _corr = null;

    /**
     * Fetch all corrections from the server. Never cached — a correction saved on one
     * device must show on every other device's next load.
     * @returns {Promise<object[]>} empty when there is no server
     */
    async function _fetchCorrections() {
        try {
            const res = await fetch('api/corrections.php', { cache: 'no-store' });
            if (!res.ok) { _correctionsAvailable = false; return []; }
            const data = await res.json();
            _correctionsAvailable = true;
            return Array.isArray(data.corrections) ? data.corrections : [];
        } catch (e) {
            _correctionsAvailable = false;
            return [];
        }
    }

    /** Normalized stats with list copies, safe to edit. */
    function _copyStats(stats) {
        const s = NewtonDB.normalizeStats(stats);
        return Object.assign({}, s, { highOuts: s.highOuts.slice(), shortLegs: s.shortLegs.slice() });
    }

    /** Apply {add, remove} to a list of values. Removes one occurrence per value. */
    function _applyListChange(list, change) {
        const out = list.slice();
        ((change && change.remove) || []).forEach(v => {
            const i = out.indexOf(v);
            if (i > -1) out.splice(i, 1);
        });
        return out.concat((change && change.add) || []);
    }

    /** The {add, remove} that turns list `base` into list `edited`. */
    function _listDiff(base, edited) {
        const add = edited.slice();
        const remove = [];
        base.forEach(v => {
            const i = add.indexOf(v);
            if (i > -1) add.splice(i, 1);
            else remove.push(v);
        });
        return { add, remove };
    }

    /**
     * Return the tournament with its corrections applied to tournamentAchievements.
     * The record passed in is left untouched. Counts never go below zero.
     * @param {object} t - tournament record from NewtonDB
     * @param {object[]} corrections - all corrections from the server
     * @returns {object}
     */
    function _applyCorrections(t, corrections) {
        const mine = corrections.filter(c => String(c.tournamentId) === String(t.tournamentId));
        if (!mine.length || !t.tournamentAchievements) return t;

        const ta = Object.assign({}, t.tournamentAchievements);
        mine.forEach(c => {
            const pid = String(c.playerId);
            const entry = ta[pid];
            if (!entry) return;
            const s = _copyStats(entry.stats);
            s.oneEighties = Math.max(0, s.oneEighties + (c.oneEighties || 0));
            s.tons        = Math.max(0, s.tons + (c.tons || 0));
            s.lollipops   = Math.max(0, s.lollipops + (c.lollipops || 0));
            s.highOuts    = _applyListChange(s.highOuts, c.highOuts);
            s.shortLegs   = _applyListChange(s.shortLegs, c.shortLegs);
            ta[pid] = Object.assign({}, entry, { stats: s });
        });
        return Object.assign({}, t, { tournamentAchievements: ta });
    }

    /**
     * Open the correction modal for a tournament. Shows each player's totals with
     * corrections applied; saving stores only the difference from what was recorded.
     * @param {string} tournamentId
     */
    async function openCorrections(tournamentId) {
        let t, corrections;
        try {
            [t, corrections] = await Promise.all([NewtonDB.getTournament(tournamentId), _fetchCorrections()]);
        } catch (e) {
            alert('Could not load tournament: ' + e.message);
            return;
        }
        if (!t) { alert('Tournament not found.'); return; }
        if (!_correctionsAvailable) { alert('Could not reach the server. Corrections are not available.'); return; }

        const ta = t.tournamentAchievements || {};
        const pids = Object.keys(ta).sort((a, b) =>
            String(ta[a].name || a).localeCompare(String(ta[b].name || b)));
        if (!pids.length) { alert('This tournament has no player achievements to correct.'); return; }

        const corrected = _applyCorrections(t, corrections).tournamentAchievements;
        _corr = { tournamentId, base: {}, edited: {}, pid: pids[0] };
        pids.forEach(pid => {
            _corr.base[pid]   = { name: ta[pid].name || pid, stats: _copyStats(ta[pid].stats) };
            _corr.edited[pid] = _copyStats(corrected[pid].stats);
        });

        document.getElementById('correctionsTournamentName').textContent = t.tournamentName || tournamentId;
        document.getElementById('correctionsTournamentDate').textContent =
            t.tournamentDate || (t.closedAt ? fmtDate(t.closedAt) : '-');

        const select = document.getElementById('correctionsPlayer');
        select.replaceChildren();
        pids.forEach(pid => {
            const opt = document.createElement('option');
            opt.value = pid;
            opt.textContent = _corr.base[pid].name;
            select.appendChild(opt);
        });
        select.value = _corr.pid;

        document.getElementById('corrHighOutInput').value = '';
        document.getElementById('corrShortLegInput').value = '';
        _renderCorrectionPlayer();
        pushDialog('correctionsModal', null, true);
    }

    /** Redraw the modal for the selected player. */
    function _renderCorrectionPlayer() {
        if (!_corr) return;
        const s = _corr.edited[_corr.pid];
        const b = _corr.base[_corr.pid].stats;

        document.getElementById('corrOneEighties').textContent = s.oneEighties;
        document.getElementById('corrTons').textContent = s.tons;
        document.getElementById('corrLollipops').textContent = s.lollipops;

        [['highOuts', 'corrHighOutsList'], ['shortLegs', 'corrShortLegsList']].forEach(([field, id]) => {
            const container = document.getElementById(id);
            container.replaceChildren();
            s[field].forEach((v, i) => {
                container.appendChild(_buildStatListItem(v, () => {
                    s[field].splice(i, 1);
                    _renderCorrectionPlayer();
                }));
            });
        });

        const list = (arr) => arr.length ? arr.join(', ') : '—';
        document.getElementById('correctionsRecorded').textContent =
            `180s: ${b.oneEighties}\nTons: ${b.tons}\nLollipops: ${b.lollipops}\n` +
            `High outs: ${list(b.highOuts)}\nShort legs: ${list(b.shortLegs)}`;
    }

    function selectCorrectionPlayer(pid) {
        if (!_corr || !_corr.edited[pid]) return;
        _corr.pid = pid;
        _renderCorrectionPlayer();
    }

    /** Step a counter (oneEighties, tons, lollipops). Never below zero. */
    function adjustCorrection(field, step) {
        if (!_corr) return;
        const s = _corr.edited[_corr.pid];
        s[field] = Math.max(0, s[field] + step);
        _renderCorrectionPlayer();
    }

    /** Add a high out (101-170) or short leg (9-21) from its input. */
    function addCorrectionValue(field) {
        if (!_corr) return;
        const isHighOut = field === 'highOuts';
        const input = document.getElementById(isHighOut ? 'corrHighOutInput' : 'corrShortLegInput');
        const value = parseInt(input.value, 10);
        const [min, max] = isHighOut ? [101, 170] : [9, 21];
        if (!value || value < min || value > max) {
            alert(isHighOut ? 'Please enter a valid high out score (101-170)' : 'Please enter valid dart count (9-21)');
            return;
        }
        _corr.edited[_corr.pid][field].push(value);
        input.value = '';
        _renderCorrectionPlayer();
    }

    /** Put the selected player back to what was recorded. */
    function resetCorrectionPlayer() {
        if (!_corr) return;
        _corr.edited[_corr.pid] = _copyStats(_corr.base[_corr.pid].stats);
        _renderCorrectionPlayer();
    }

    /** Save the difference from what was recorded, for every player in the tournament. */
    async function saveCorrections() {
        if (!_corr) return;

        const list = [];
        Object.keys(_corr.base).forEach(pid => {
            const b = _corr.base[pid].stats;
            const e = _corr.edited[pid];
            const c = {
                playerId: pid,
                playerName: _corr.base[pid].name,
                oneEighties: e.oneEighties - b.oneEighties,
                tons: e.tons - b.tons,
                lollipops: e.lollipops - b.lollipops,
                highOuts: _listDiff(b.highOuts, e.highOuts),
                shortLegs: _listDiff(b.shortLegs, e.shortLegs)
            };
            const changed = c.oneEighties || c.tons || c.lollipops ||
                c.highOuts.add.length || c.highOuts.remove.length ||
                c.shortLegs.add.length || c.shortLegs.remove.length;
            if (changed) list.push(c);
        });

        try {
            const res = await fetch('api/corrections.php', {
                method: 'POST',
                headers: apiWriteHeaders(),
                body: JSON.stringify({ tournamentId: _corr.tournamentId, corrections: list })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
        } catch (e) {
            alert('Could not save corrections: ' + e.message);
            return;
        }

        _corr = null;
        popDialog();
        _invalidateCache();
        _recomputePoints();
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
            _invalidateCache();
            _checkedIds.clear();
            setScope(null);
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
             promptDeleteTournament, onDeleteInputChange, confirmDeleteTournament,
             setScope: scopeTo, toggleTournament, toggleAllTournaments, togglePlayer, toggleAllPlayers, exportLeaderboardCSV, exportLeaderboardJSON, onTextFilter, onDateFilter, resetFilters, setHalfYear, toggleLayer, showDashboard, showTournamentList, switchRegisterTab, renderAllMatches, viewBracket, viewBracketForTournament, importTournament, invalidateCache: _invalidateCache,
             selectCorrectionPlayer, adjustCorrection, addCorrectionValue, resetCorrectionPlayer, saveCorrections };

})();
