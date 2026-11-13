// season-final.js - Fill from season standings: the Season final, NewTon DC (Docs/SEASON-FINAL.md)
//
// In Player Registration, only with the NewTon DC switch and while the Season final format is
// offered: the season's standings (from this computer's own results, through the seeding lens),
// the 16 best available invited, Not available marks at any rank, reversible, and a button that
// adds the invited players already marked paid. The Season final draw is then seeded by season
// rank (Seeding.forGroups() asks forGroups() here). What the operator chose is kept on the
// tournament as `tournament.seasonFill` (additive: absent = never used). Gated: the panel shows
// nothing until the tournament's name is typed, as Reset tournament asks; once used, it stays open
// to that tournament.

/**
 * Fill from season standings for the tournament being set up.
 */
const SeasonFinal = (() => {
    /** How many are invited. */
    const INVITED = 16;

    /**
     * The panel's state for the loaded tournament. A lens like the Seeding panel's (keyword,
     * period, list, ticked, othersOpen) plus the standings and the marks.
     * @type {{tid: *, keyword: string, period: 'current'|'previous'|'all', list: {id: string, name: string, date: string}[],
     *         ticked: Set<string>, standings: object[], notAvailable: Set<string>, ready: boolean, error: boolean,
     *         seq: number, othersOpen: boolean, editing: boolean, open: boolean, unlocked: boolean, gateText: string}|null}
     */
    let st = null;

    const started = () => !!(tournament && tournament.bracket && matches.length > 0);

    /** True when the panel belongs on the page: the switch, the format offered, a tournament before its draw. */
    function shown() {
        return typeof isNewtonDC === 'function' && isNewtonDC() &&
            typeof getVisibleFormats === 'function' && getVisibleFormats().some(f => f.seasonFinal) &&
            typeof tournament !== 'undefined' && !!tournament && !tournament.readOnly && !started();
    }

    /**
     * The cup the season is made of: the word most tournaments this half-year are named by
     * (finals left out), or of all time when this half-year has none. "Måndagscup" on our nights.
     * @param {object[]} list - the tournaments, newest first
     * @returns {string}
     */
    function defaultKeyword(list) {
        const top = ts => {
            const n = new Map();
            ts.forEach(t => { if (Seeding.isFinal(t.name)) return; const k = Seeding.keywordFor(t.name); if (k) n.set(k, (n.get(k) || 0) + 1); });
            return [...n.entries()].sort((a, b) => b[1] - a[1])[0];
        };
        const best = top(Seeding.lens.inPeriod({ list }, 'current')) || top(list);
        return best ? best[0] : '';
    }

    /** The state for the loaded tournament (started on first use), or null when the panel isn't shown. */
    function ensure() {
        if (!shown()) return null;
        if (st && st.tid === tournament.id) return st;
        const saved = tournament.seasonFill;
        st = { tid: tournament.id, keyword: '', period: 'current', list: [], ticked: new Set(), standings: [],
            notAvailable: new Set(saved && Array.isArray(saved.notAvailable) ? saved.notAvailable : []),
            ready: false, error: false, seq: 0, othersOpen: false, editing: false,
            open: !!saved, unlocked: !!saved, gateText: '' };
        load(st, saved);
        return st;
    }

    async function load(s, saved) {
        try {
            s.list = await NewtonHistory.seedingTournaments();
            if (saved && typeof saved.keyword === 'string') {
                s.keyword = saved.keyword;
                s.period = ['current', 'previous', 'all'].includes(saved.period) ? saved.period : 'current';
                const ids = new Set((saved.tournaments || []).map(t => t.id));
                s.ticked = new Set(s.list.filter(t => ids.has(t.id)).map(t => t.id));
            } else {
                s.keyword = defaultKeyword(s.list);
                Seeding.lens.pickPeriod(s);
            }
            await rank(s);
        } catch (e) {
            console.error('Season final: the standings could not be read', e);
            s.error = true;
        }
        s.ready = true;
        render();
    }

    /** The standings on the ticked tournaments. A newer call makes an older one stale. */
    async function rank(s) {
        const seq = ++s.seq;
        const standings = s.ticked.size ? await NewtonHistory.seasonStandings([...s.ticked]) : [];
        if (seq !== s.seq) return;
        s.standings = standings;
        if (s === st && s.unlocked) store(s); // the seeds follow what the panel shows
    }

    /**
     * Everyone with points, in standings order: Invited (the 16 best available, with their seed),
     * Reserve n, or Not available. The one rule for both Fill from season standings and the
     * Season final tab in Analytics.
     * @param {object[]} rows - in ranking order, each with `points`
     * @param {function(object): boolean} isOut - true for a player marked Not available
     * @returns {{r: object, i: number, status: 'in'|'res'|'na', seed?: number, res?: number}[]}
     *   i is the row's place in rows
     */
    function classifyRows(rows, isOut) {
        let n = 0, res = 0;
        return rows.map((r, i) => ({ r, i })).filter(x => x.r.points > 0).map(x => {
            if (isOut(x.r)) return Object.assign(x, { status: 'na' });
            n++;
            return n <= INVITED ? Object.assign(x, { status: 'in', seed: n }) : Object.assign(x, { status: 'res', res: ++res });
        });
    }

    /**
     * The Not available switch on a standings row, in Fill from season standings and on the
     * Season final tab in Analytics. A click on it never reaches the row.
     * @param {boolean} on - the player is marked Not available
     * @param {string} onchange - the handler to call
     * @returns {string}
     */
    function markSwitchHtml(on, onchange) {
        return `<label class="mc-switchrow sf-mark" onclick="event.stopPropagation()"><span class="mc-switch mc-switch-sm"><input type="checkbox"${on ? ' checked' : ''} onchange="${onchange}"><span></span></span>Not available</label>`;
    }

    /** @param {object} s */
    const classify = s => classifyRows(s.standings, r => s.notAvailable.has(r.key));

    /**
     * Keep the operator's choices on the tournament: the season, the marks, and everyone
     * available in season order (the seeds; a reserve added later still has a rank).
     * Saved only when something changed.
     * @param {object} s
     */
    function store(s) {
        const hy = s.period === 'all' ? null : NewtonHistory.halfYear(s.period === 'previous' ? -1 : 0);
        const next = {
            keyword: s.keyword,
            period: s.period,
            periodLabel: hy ? hy.label : 'All time',
            tournaments: s.list.filter(t => s.ticked.has(t.id)).map(t => ({ id: t.id, name: t.name })),
            notAvailable: [...s.notAvailable],
            seeds: classify(s).filter(c => c.status !== 'na').map(c => ({ key: c.r.key, name: c.r.name, rank: c.r.rank, points: c.r.points, op: c.r.op }))
        };
        if (JSON.stringify(next) === JSON.stringify(tournament.seasonFill)) return;
        tournament.seasonFill = next;
        saveTournament();
    }

    /** The tournament player for a standings row, if they are in the tournament. */
    const playerFor = r => players.find(p => NewtonHistory.seedingPlayerKey(p) === r.key) || null;

    // ---------- the panel ----------
    /** Fill the panel on the Registration page (hidden when it doesn't belong there). */
    function render() {
        const el = document.getElementById('seasonFillPanel');
        if (!el) return;
        const s = ensure();
        el.hidden = !s;
        el.innerHTML = s ? html(s) : '';
    }

    function html(s) {
        let body;
        if (!s.unlocked) body = gateHtml(s);
        else if (!s.ready) body = '<p class="mc-note">Reading the standings…</p>';
        else if (s.error) body = '<p class="mc-note">The standings could not be read.</p>';
        else if (!s.list.length) body = '<p class="mc-note">No earlier tournaments in this browser. To fill from the season, restore a backup on this computer first.</p>';
        else body = scopeHtml(s) + (s.editing ? Seeding.lens.controlsHtml(s, 'SeasonFinal') + Seeding.lens.listHtml(s, 'SeasonFinal') : '') + tableHtml(s) + footHtml(s);
        return `<details class="st-panel rg-season"${s.open ? ' open' : ''} ontoggle="SeasonFinal.setOpen(this.open)">
            <summary class="st-panel-head"><h3>Fill from season standings<small>the season final: the ${INVITED} best available are invited</small></h3></summary>
            ${body}</details>`;
    }

    /** Before it is used: what it does, and the tournament's name to type. */
    function gateHtml(s) {
        return `<p class="mc-note">Invites the season's top ${INVITED} to this tournament, already marked paid, and seeds the Season final by season rank.</p>
            <div class="rg-season-gate"><label class="dlg__label" for="seasonFillGate">Type the tournament name to use it</label>
            <input type="text" id="seasonFillGate" class="st-text" autocomplete="off" placeholder="${escapeHtml(tournament.name)}" value="${escapeHtml(s.gateText)}" oninput="SeasonFinal.unlock(this.value)"></div>`;
    }

    function scopeHtml(s) {
        const hy = s.period === 'all' ? 'All time' : NewtonHistory.halfYear(s.period === 'previous' ? -1 : 0).label;
        const tags = [s.keyword ? `Name contains “${escapeHtml(s.keyword)}”` : 'No name word', hy, `${s.ticked.size} tournament${s.ticked.size === 1 ? '' : 's'}`];
        return `<div class="rg-season-scope">${tags.map(t => `<span class="rg-tag">${t}</span>`).join('')}
            <button type="button" class="st-btn st-sm" onclick="SeasonFinal.setEditing(${!s.editing})">${s.editing ? 'Done' : 'Change season'}</button></div>`;
    }

    function tableHtml(s) {
        const list = classify(s);
        if (!s.ticked.size) return '<p class="mc-note">No tournament is ticked. Change season to pick the tournaments.</p>';
        if (!list.length) return '<p class="mc-note">No one has points in these tournaments.</p>';
        const pill = c => c.status === 'in' ? '<span class="rg-paid rg-yes">Invited</span>'
            : c.status === 'res' ? `<span class="rg-paid rg-res">Reserve ${c.res}</span>` : '<span class="rg-paid rg-na">Not available</span>';
        const rows = list.map(c => {
            const inT = !!playerFor(c.r);
            const cut = c.status === 'in' && c.seed === INVITED ? ' class="rg-cut"' : c.status === 'na' ? ' class="rg-out"' : '';
            return `<tr${cut}><td class="rg-num">${c.r.rank}</td><td class="rg-short">${escapeHtml(c.r.name)}${inT ? ' <span class="rg-in-t">in</span>' : ''}</td>` +
                `<td class="rg-num">${c.r.points}</td><td class="rg-num">${c.r.op != null ? c.r.op.toFixed(2) : '—'}</td>` +
                `<td>${pill(c)}</td><td class="rg-num">${c.seed || ''}</td>` +
                `<td>${markSwitchHtml(c.status === 'na', `SeasonFinal.toggleAvailable(${c.i})`)}</td></tr>`;
        }).join('');
        return `<div class="rg-db-scroll rg-season-scroll"><table class="rg-db"><thead><tr><th class="rg-num">#</th><th>Player</th><th class="rg-num">Points</th><th class="rg-num">OP</th><th>Status</th><th class="rg-num">Seed</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    function footHtml(s) {
        const list = classify(s);
        if (!list.length) return '';
        const invited = list.filter(c => c.status === 'in');
        const missing = invited.filter(c => !playerFor(c.r));
        const na = list.filter(c => c.status === 'na').length;
        const invitedKeys = new Set(invited.map(c => c.r.key));
        const others = players.filter(p => !invitedKeys.has(NewtonHistory.seedingPlayerKey(p)));
        const notes = [];
        if (invited.length < INVITED) notes.push(`Only ${invited.length} available: the season final needs ${INVITED}.`);
        if (others.length) notes.push(`In the tournament but not invited: ${others.map(p => escapeHtml(p.name)).join(', ')}.`);
        const label = !missing.length ? `All ${invited.length} are in` : missing.length === invited.length ? `Add these ${invited.length} players` : `Add the ${missing.length} missing`;
        return `<div class="rg-season-foot"><span><b>${invited.length} invited</b> · ${na} not available · added as paid (invited, no payment). Seed = season rank among them.</span>
            <button type="button" class="st-btn st-primary"${missing.length ? '' : ' disabled'} onclick="SeasonFinal.addInvited()">${label}</button></div>
            ${notes.length ? `<p class="mc-note mc-warn">${notes.join(' ')}</p>` : ''}`;
    }

    // ---------- the panel's controls ----------
    /** @param {boolean} open */
    function setOpen(open) { if (st) st.open = !!open; }

    /** The gate: the tournament's name, exactly, opens the panel to this tournament for good. @param {string} v */
    function unlock(v) {
        const s = st;
        if (!s || s.unlocked) return;
        s.gateText = String(v || '');
        if (s.gateText !== tournament.name) return;
        s.unlocked = true;
        if (s.ready) store(s);
        render();
    }
    /** @param {boolean} on */
    function setEditing(on) { if (st) { st.editing = !!on; render(); } }
    /** @param {boolean} open */
    function setOthersOpen(open) { if (st) st.othersOpen = !!open; }

    /** Mark a player Not available, or take the mark back. @param {number} i - their row in the standings */
    function toggleAvailable(i) {
        const s = st, r = s && s.standings[i];
        if (!r) return;
        if (s.notAvailable.has(r.key)) s.notAvailable.delete(r.key); else s.notAvailable.add(r.key);
        store(s);
        render();
    }

    /** A new name word: choose the period and ticks again. @param {string} v */
    async function setKeyword(v) {
        const s = st;
        if (!s) return;
        s.keyword = String(v || '').trim();
        Seeding.lens.pickPeriod(s);
        await rank(s);
        store(s);
        render();
    }

    /** A new period: tick the cup's tournaments in it. @param {string} v */
    async function setPeriod(v) {
        const s = st;
        if (!s || !['current', 'previous', 'all'].includes(v)) return;
        s.period = v;
        s.ticked = new Set(Seeding.lens.matchesIn(s, v).map(t => t.id));
        await rank(s);
        store(s);
        render();
    }

    /** Tick or untick a tournament by hand. @param {number} i - its place in the list */
    async function toggle(i) {
        const s = st, t = s && s.list[i];
        if (!t) return;
        if (s.ticked.has(t.id)) s.ticked.delete(t.id); else s.ticked.add(t.id);
        await rank(s);
        store(s);
        render();
    }

    /**
     * Add the invited players who aren't in the tournament yet, from the player database,
     * already marked paid (invited, no payment); an invited player already in is marked paid.
     */
    function addInvited() {
        const s = st;
        if (!s || !s.ready || started()) return;
        classify(s).filter(c => c.status === 'in').forEach(c => {
            const p = playerFor(c.r);
            if (p) { p.paid = true; return; }
            const entry = (c.r.registryId && PlayerRegistry.get(c.r.registryId)) || PlayerRegistry.findOrCreate(c.r.name);
            if (!entry) return;
            const np = _newTournamentPlayer(entry, true);
            while (players.some(q => q.id === np.id)) np.id++; // added in one go: Date.now() repeats
            players.push(np);
        });
        store(s);
        saveTournament();
        updatePlayersDisplay();
        updatePlayerCount();
        if (typeof updateResultsTable === 'function') updateResultsTable();
        renderPlayerList();
        render();
    }

    // ---------- the draw ----------
    /**
     * The Season final's seeding: the paid players in season order (as Fill from season
     * standings last showed it), best first; players not in the standings are left to the
     * draw (at random, after them). Null when Fill wasn't used or fewer than two are ranked.
     * @param {object[]} paid
     * @returns {{order: object[], record: object}|null}
     */
    function forGroups(paid) {
        const sv = typeof tournament !== 'undefined' && tournament && tournament.seasonFill;
        if (!sv || !Array.isArray(sv.seeds) || !sv.seeds.length) return null;
        const pos = new Map(sv.seeds.map((x, i) => [x.key, i]));
        const ranked = paid.map(p => ({ p, i: pos.get(NewtonHistory.seedingPlayerKey(p)) })).filter(x => x.i != null).sort((a, b) => a.i - b.i);
        if (ranked.length < 2) return null;
        return {
            order: ranked.map(x => x.p),
            record: {
                fraction: 'season',
                seeds: ranked.map(x => { const sd = sv.seeds[x.i]; return { id: x.p.id, name: x.p.name, rank: sd.rank, points: sd.points, op: sd.op }; }),
                keyword: sv.keyword,
                period: sv.periodLabel || '',
                tournaments: sv.tournaments || []
            }
        };
    }

    /**
     * The Seeding panel in Match Controls when the Season final is picked and seeded by season rank.
     * @param {{order: object[], record: object}} sf - from forGroups()
     * @returns {string}
     */
    function seedsPanelHtml(sf) {
        const rest = players.filter(p => p.paid && !sf.order.includes(p));
        return `<section class="mc-panel mc-seeding"><div class="mc-ph"><h3>Seeding<small>by season rank</small></h3></div>
            <ol class="mc-seeds">${sf.record.seeds.map(x => `<li><b>${escapeHtml(x.name)}</b><span>${x.points} pts</span></li>`).join('')}</ol>
            <p class="mc-note">From Fill from season standings (Player Registration): the ${sf.order.length} ranked players go into the groups in snake order, best first.${rest.length ? ` Not in the standings, so placed at random after them: ${rest.map(p => escapeHtml(p.name)).join(', ')}.` : ''}</p></section>`;
    }

    return { INVITED, classifyRows, markSwitchHtml, defaultKeyword, render, forGroups, seedsPanelHtml, setOpen, unlock, setEditing, setOthersOpen, toggleAvailable, setKeyword, setPeriod, toggle, addInvited };
})();
