// live-view.js - Watch a tournament that is being played (Docs/HUB-DIRECTION.md)
//
// "Live now" on the Analytics page when a live copy of a tournament exists on the server (api/live.php, sent by
// js/live-upload.js). Watch opens a list of the matches, the same on a phone and a desktop: what is being played
// (with the lane), what is up next, and the latest results with what they recorded. From the list the bracket
// (the normal bracket page, read-only) and the Leaderboard are one tap away. The page asks the server every few
// seconds and redraws when something changed (an ETag keeps an unchanged answer empty). When the live copy is
// gone the page stops asking and checks the server's normal list: only when the finished tournament is there does it
// say "finished" (a reset, a deleted or an abandoned tournament loses its live copy too), and it points at
// Analytics, which takes the finished tournament in when it is opened. It does not keep showing the last frame as if
// it were current: the live and up-next groups go, the results stay, marked with when they were last updated.
//
// Nothing is stored. The live copy is loaded into the page's tournament, players and matches in memory, tagged
// _analyticsPreview so nothing is saved, and the viewer's own tournament is put back when they leave. The club's
// point values are used only while the leaderboard is calculated: the view toggles save the whole config, so they
// are never left in it.
//
// Removable: nothing depends on this file; the hooks in main.js, bracket-view.js and bracket-rendering.js
// check that LiveView exists.

const LiveView = (function () {
    const POLL_MS = 8000;       // while watching
    const STRIP_MS = 30000;     // the "Live now" strip, while the Analytics page is showing

    let open = null;            // { id, etag, saved, snap, timer, ended, finished, lastAt, view: 'list'|'bracket', backLabel }
    let stripTimer = null;
    let _noApi = false;         // this server has no live.php

    /** @returns {boolean} true while a live tournament is being watched */
    function isOpen() { return !!open; }

    /**
     * Fetch the list of live copies. Null when this server has none to offer.
     * @returns {Promise<object[]|null>}
     */
    async function fetchList() {
        if (_noApi || location.protocol === 'file:') return null;
        try {
            const res = await fetch('api/live.php', { cache: 'no-store' });
            if (res.status === 404 || res.status === 405 || res.status === 501) { _noApi = true; return null; }
            if (!res.ok) return null;
            const data = await res.json();
            return Array.isArray(data.live) ? data.live : null;
        } catch (e) { return null; }
    }

    /**
     * Show "Live now" on the Analytics page: one line per live tournament, with Watch. A tournament this
     * Tournament Manager is running itself is left out. Hidden when nothing is live.
     * @returns {Promise<void>}
     */
    async function refreshStrip() {
        const strip = document.getElementById('liveNowStrip');
        if (!strip) return;
        clearTimeout(stripTimer);
        stripTimer = setTimeout(() => {
            const page = document.getElementById('history');
            if (page && page.classList.contains('active') && !document.hidden) refreshStrip();
        }, STRIP_MS);
        const own = tournament && !tournament._analyticsPreview && !open ? String(tournament.id) : null;
        const live = ((await fetchList()) || []).filter(t => String(t.id) !== own && t.status !== 'unknown');
        strip.replaceChildren();
        strip.hidden = live.length === 0;
        live.forEach(t => {
            const row = document.createElement('div');
            row.className = 'an-live-row';
            const dot = document.createElement('span');
            dot.className = 'an-live-dot';
            const label = document.createElement('span');
            label.className = 'an-live-label';
            const b = document.createElement('b');
            b.textContent = t.name;
            const finished = t.status === 'completed';
            const progress = finished ? 'finished' : (t.matches ? `${t.played} of ${t.matches} matches played` : 'being played');
            label.append('Live now: ', b, ` · ${t.date} · ${progress}`);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'st-btn st-sm';
            btn.textContent = 'Watch';
            btn.addEventListener('click', () => watch(String(t.id)));
            row.append(dot, label, btn);
            strip.appendChild(row);
        });
    }

    /**
     * Fetch a live copy. ETag aware.
     * @param {string} id
     * @param {string} [etag]
     * @returns {Promise<{status: number, snap?: object, etag?: string}>} status 200 (new), 304 (unchanged), 404 (gone), 0 (no answer)
     */
    async function fetchSnapshot(id, etag) {
        try {
            const res = await fetch('api/live.php?id=' + encodeURIComponent(id), { cache: 'no-store', headers: etag ? { 'If-None-Match': etag } : {} });
            if (res.status === 200) return { status: 200, snap: await res.json(), etag: res.headers.get('ETag') || '' };
            return { status: res.status };
        } catch (e) { return { status: 0 }; }
    }

    /** Put a live copy into the page's tournament, players and matches, in memory, and draw it. */
    function apply(snap) {
        open.snap = snap;
        tournament = Object.assign({}, snap, { readOnly: true, _analyticsPreview: true, bracket: true });
        players = (snap.players || []).map(p => Object.assign({}, p, { paid: true })); // payment is not sent; the page counts it
        matches = snap.matches || [];
        if (open.view === 'bracket' && typeof renderBracket === 'function') renderBracket();
        renderList();
        const modal = document.getElementById('statisticsModal');
        if (modal && modal.style.display === 'block' && typeof updateStatisticsTable === 'function') updateStatisticsTable(); // an open leaderboard follows
    }

    /**
     * Run a calculation with the club's point values in config.points, and put the viewer's own back at once
     * (the view toggles save the whole config, so they must never find these in it).
     * @param {function} fn
     * @returns {*} what fn returns
     */
    function withLivePoints(fn) {
        const live = open && open.snap && open.snap.points;
        if (!live) return fn();
        const own = config.points;
        config.points = Object.assign({}, own, live);
        try { return fn(); } finally { config.points = own; }
    }

    /** The "LIVE · updated 21:14" badge in the bracket page's status line. */
    function showBadge(text, withLeave) {
        ['bvLiveBadge', 'lvBadge'].forEach(id => {
            const badge = document.getElementById(id);
            if (!badge) return;
            badge.hidden = !text;
            badge.replaceChildren();
            if (!text) return;
            badge.append(text);
            if (withLeave) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'bv-live-leave';
                btn.textContent = open && open.finished ? 'See it in Analytics' : 'Back to Analytics';
                btn.addEventListener('click', () => { close(); showPage('history'); });
                badge.append(' ', btn);
            }
        });
    }

    function stamp() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

    /**
     * The finished tournament, when the server has it: the normal list has it as completed. That is what
     * "finished" means here, since the live copy also goes when a tournament is reset or deleted. Null when it
     * is not there (or the server does not answer).
     * @param {string} id
     * @returns {Promise<object|null>} the tournament's file, as uploaded
     */
    async function fetchFinished(id) {
        try {
            const res = await fetch('api/list-tournaments.php', { cache: 'no-store' });
            if (!res.ok) return null;
            const list = await res.json();
            const entry = (list.tournaments || []).find(t => String(t.id) === String(id) && t.status === 'completed');
            if (!entry) return null;
            const file = await fetch('tournaments/' + entry.filename, { cache: 'no-store' });
            return file.ok ? await file.json() : null;
        } catch (e) { return null; }
    }

    /**
     * The live copy's shape from the finished tournament's file, so the list can show the true final results:
     * every match played, the final placements, and what each match recorded (from the file's history).
     * @param {object} prev - the last live copy
     * @param {object} data - the finished tournament's file
     * @returns {object}
     */
    function finalSnapshot(prev, data) {
        const recorded = {};
        (data.history || []).forEach(t => {
            if (t.type === 'COMPLETE_MATCH' && t.achievements && !(t.matchId in recorded)) recorded[t.matchId] = t.achievements; // newest first
        });
        const finalMatches = (data.matches || []).map(m => {
            const c = Object.assign({}, m);
            delete c.preMatchSnapshot;
            const ach = recorded[m.id] && NewtonDB.slotAchievements(recorded[m.id], m.player1 && m.player1.id, m.player2 && m.player2.id);
            if (ach) c.achievements = ach;
            return c;
        });
        return Object.assign({}, prev, {
            status: 'completed',
            placements: data.placements || prev.placements,
            players: data.players || prev.players,
            matches: finalMatches.length ? finalMatches : prev.matches
        });
    }

    /** What the badge says once the live copy is gone. */
    function endedText() {
        return open.finished ? 'This tournament has finished.' : 'This tournament is no longer live.';
    }

    /** Ask the server for a newer copy; redraw when there is one. Stops when the live copy is gone. */
    async function poll() {
        if (!open) return;
        const id = open.id;
        if (!document.hidden) {
            const r = await fetchSnapshot(id, open.etag);
            if (!open || open.id !== id) return;
            if (r.status === 200) {
                open.etag = r.etag;
                open.lastAt = stamp();
                apply(r.snap);
                showBadge(r.snap.status === 'completed' ? `Finished · ${open.lastAt}` : `● LIVE · updated ${open.lastAt}`);
            } else if (r.status === 304) {
                showBadge(open.snap && open.snap.status === 'completed' ? `Finished · ${open.lastAt}` : `● LIVE · updated ${open.lastAt}`);
            } else if (r.status === 404) {
                open.ended = true;
                const done = await fetchFinished(id);
                if (!open || open.id !== id) return;
                open.finished = !!done;
                if (done) apply(finalSnapshot(open.snap, done)); // the true final results
                else renderList();                               // not on the server: only what was last known
                return; // no more polling: the live copy is gone
            } else {
                showBadge(`Offline · last updated ${open.lastAt}`);
            }
        }
        open.timer = setTimeout(poll, POLL_MS);
    }

    /**
     * Watch a live tournament: the normal bracket page with the live copy, read-only.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async function watch(id) {
        if (open) close();
        const r = await fetchSnapshot(id);
        if (r.status !== 200) { alert('That tournament is no longer being played.'); refreshStrip(); return; }
        open = { id, etag: r.etag, saved: { tournament, players, matches }, snap: null, timer: null, finished: false, lastAt: stamp(), view: 'list', backLabel: null };
        document.body.classList.add('live-viewing');
        showPage('liveList');
        apply(r.snap);
        localStorage.setItem('newton_activePage', 'history'); // a reload lands on Analytics, not on a bracket page with nothing in it
        showBadge(r.snap.status === 'completed' ? `Finished · ${open.lastAt}` : `● LIVE · updated ${open.lastAt}`);
        open.timer = setTimeout(poll, POLL_MS);
    }

    /** Stop watching: the viewer's own tournament, players and matches come back. */
    function close() {
        if (!open) return;
        clearTimeout(open.timer);
        restoreBackLabel();
        const saved = open.saved;
        open = null;
        tournament = saved.tournament;
        players = saved.players;
        matches = saved.matches;
        document.body.classList.remove('live-viewing');
        showBadge('');
        showPage('history');
    }

    /** The bracket's back button says "⬅ List" while the bracket is open from the list. */
    function restoreBackLabel() {
        const btn = document.querySelector('.bv-header .analytics-back-btn');
        if (btn && open && open.backLabel !== null) btn.textContent = open.backLabel;
        if (open) open.backLabel = null;
    }

    /** Show the bracket (the normal bracket page, read-only) from the list. */
    function showBracket() {
        if (!open) return;
        open.view = 'bracket';
        const btn = document.querySelector('.bv-header .analytics-back-btn');
        if (btn) { open.backLabel = btn.textContent; btn.textContent = '⬅ List'; }
        showPage('tournament');
        localStorage.setItem('newton_activePage', 'history');
        if (typeof renderBracket === 'function') renderBracket();
    }

    /** Show the list of matches. */
    function showList() {
        if (!open) return;
        restoreBackLabel();
        open.view = 'list';
        showPage('liveList');
        localStorage.setItem('newton_activePage', 'history');
        renderList();
    }

    /** The back button: from the bracket to the list, from the list out to Analytics. */
    function back() {
        if (!open) return;
        if (open.view === 'bracket') showList(); else close();
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    /** One match as a row of the list. */
    function matchRow(m, kind) {
        const row = el('div', `lv-match lv-${kind}`);
        let round = '';
        try { round = typeof getRoundDescription === 'function' ? getRoundDescription(m) : ''; } catch (e) { /* the id is enough */ }
        const top = el('div', 'lv-line1');
        top.append(el('span', 'lv-round', `${m.id}${round ? ' · ' + round : ''}`));
        if (m.lane && kind !== 'result') top.append(el('span', 'lv-lane', `Lane ${m.lane}`));
        row.append(top);
        const n1 = (m.player1 && m.player1.name) || '', n2 = (m.player2 && m.player2.name) || '';
        const line = el('div', 'lv-names');
        if (kind === 'result') {
            const winnerIs1 = m.winner && m.player1 && String(m.winner.id) === String(m.player1.id);
            const f = m.finalScore;
            const wName = winnerIs1 ? n1 : n2, lName = winnerIs1 ? n2 : n1;
            line.append(el('span', 'lv-win', wName), ` ${f && f.winnerLegs !== undefined ? `${f.winnerLegs}–${f.loserLegs}` : 'beat'} `, el('span', '', lName));
        } else {
            line.append(n1, ' v ', n2);
        }
        row.append(line);
        if (kind === 'result') {
            const ach = achievementsText(m);
            if (ach) row.append(el('div', 'lv-ach', ach));
        }
        return row;
    }

    /** Draw the list of matches from the live copy: live, up next and the results, newest first. */
    function renderList() {
        const page = document.getElementById('liveList');
        if (!page || !open || !open.snap) return;
        const snap = open.snap;
        const all = (snap.matches || []);
        const skip = m => m.autoAdvanced || (typeof isWalkover === 'function' && (isWalkover(m.player1) || isWalkover(m.player2)));
        const by = (a, b) => (a.numericId || 0) - (b.numericId || 0);
        const live = all.filter(m => !m.completed && m.active && !skip(m)).sort((a, b) => (a.lane || 99) - (b.lane || 99) || by(a, b));
        const next = all.filter(m => !m.completed && !m.active && typeof canMatchStart === 'function' && canMatchStart(m) && !skip(m)).sort(by);
        const done = all.filter(m => m.completed && !skip(m)).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0) || by(b, a));
        const waiting = all.filter(m => !m.completed && !m.active && !(typeof canMatchStart === 'function' && canMatchStart(m)) && !skip(m)).length;

        const wrap = el('div', 'lv-wrap');
        const top = el('div', 'lv-top');
        const back = el('button', 'st-btn st-sm', '⬅ Analytics');
        back.type = 'button';
        back.addEventListener('click', () => close());
        const tools = el('div', 'lv-tools');
        const bracket = el('button', 'st-btn st-sm', 'Bracket');
        bracket.type = 'button';
        bracket.addEventListener('click', () => showBracket());
        const board = el('button', 'st-btn st-sm', 'Leaderboard');
        board.type = 'button';
        board.addEventListener('click', () => { if (typeof showStatisticsModal === 'function') showStatisticsModal(); });
        tools.append(bracket, board);
        top.append(back, tools);
        const title = el('div', 'lv-title');
        let fmt = '';
        try { fmt = typeof formatShortName === 'function' ? formatShortName(snap.format, snap.plate) : ''; } catch (e) { /* no format name */ }
        title.append(el('h2', '', snap.name || 'Tournament'), el('p', '', `${snap.date || ''}${fmt ? ' · ' + fmt : ''} · ${done.length} of ${all.filter(m => !skip(m)).length} played${open.ended && !open.finished ? ' as of ' + open.lastAt : ''}`));
        const status = el('p', 'lv-status');
        status.id = 'lvBadge';
        status.hidden = true;

        const group = (heading, items, kind, empty) => {
            const g = el('section', 'lv-group');
            g.append(el('h3', '', `${heading}${items.length ? ` · ${items.length}` : ''}`));
            if (!items.length) g.append(el('p', 'lv-empty', empty));
            items.forEach(m => g.append(matchRow(m, kind)));
            return g;
        };
        if (open.ended) {
            // the live copy is gone: what was live or next is no longer known, only the results as of the last update
            const g = group(open.finished ? 'Results' : `Results as of ${open.lastAt}`, done, 'result', 'No results yet.');
            wrap.append(top, title, status, g);
        } else {
            wrap.append(top, title, status,
                group('Live now', live, 'live', 'Nothing is being played right now.'),
                group('Up next', next, 'ready', 'No match is waiting.'),
                group('Results', done, 'result', 'No results yet.'));
        }
        if (waiting && !open.ended) wrap.append(el('p', 'lv-empty', `${waiting} more match${waiting === 1 ? '' : 'es'} waiting for earlier results.`));
        page.replaceChildren(wrap);
        // the badge lives in the list; draw it again
        if (open.ended) showBadge(endedText(), true);
        else showBadge(snap.status === 'completed' ? `Finished · ${open.lastAt}` : `● LIVE · updated ${open.lastAt}`);
    }

    /**
     * What a completed match recorded, as one line: "Ann 2× 180, 3× ton · Ben high out (121)". Empty when
     * nothing was recorded.
     * @param {object} match - a match of the live copy
     * @returns {string}
     */
    function achievementsText(match) {
        const a = match && match.achievements;
        if (!a) return '';
        const one = (name, s) => {
            if (!s || !name) return '';
            const parts = [];
            if (s.oneEighties) parts.push(`${s.oneEighties}× 180`);
            if (s.tons) parts.push(`${s.tons}× ton`);
            (s.highOuts || []).forEach(v => parts.push(`high out (${v})`));
            (s.shortLegs || []).forEach(v => parts.push(`short leg (${v})`));
            if (s.lollipops) parts.push(`${s.lollipops}× lollipop`);
            return parts.length ? `${name} ${parts.join(', ')}` : '';
        };
        return [one(match.player1 && match.player1.name, a.p1), one(match.player2 && match.player2.name, a.p2)].filter(Boolean).join(' · ');
    }

    return { isOpen, refreshStrip, watch, close, back, showBracket, showList, withLivePoints, achievementsText };
})();
