// seeding.js - seeding the draw: who the seeds are
//
// Before the draw, Match Controls can seed it: the best players, by the ranking of earlier
// tournaments with the same name, are kept apart in the bracket. This file decides WHO the
// seeds are (the "mini-lens": which tournaments count, the ranking on them, the panel in
// Match Controls) and hands the list to the draw; WHERE they go is the format's business
// (placeSeededPlayers() in clean-match-progression.js). It knows nothing about brackets, so a
// group draw can take the same list. Reads the tournaments in this browser (NewtonHistory).

/**
 * Seeding for the tournament being set up.
 */
const Seeding = (() => {
    /** Words that say nothing about which cup this is (compared without accents). */
    const NOISE = new Set(['final', 'finale', 'week', 'uke', 'vecka', 'vko', 'cup']);
    /** How much of the bracket is seeded: the label, and how many seeds in a bracket of K (all: every ranked player). */
    const FRACTIONS = {
        eighth: { label: '1/8', seeds: K => K / 8 },
        quarter: { label: '1/4', seeds: K => K / 4 },
        half: { label: '1/2', seeds: K => K / 2 },
        all: { label: 'All', seeds: () => Infinity }
    };

    /**
     * The mini-lens for the tournament being set up. Kept here, not in the page, because
     * Match Controls redraws itself after every action.
     * @type {{tid: *, on: boolean, fraction: string, keyword: string, period: 'current'|'previous'|'all',
     *         list: {id: string, name: string, date: string}[], ticked: Set<string>,
     *         ranking: Map<string, {points: number, rank: number}>, ready: boolean, error: boolean,
     *         seq: number, othersOpen: boolean}|null}
     */
    let st = null;

    // ---------- names ----------
    const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const words = s => String(s || '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);

    /**
     * The word that says which cup a tournament is: the longest word left once numbers,
     * dates and words like "week" and "Final" are taken away. "Måndagscup", "Måndagscup
     * week 43", "NewTon Måndagscup" and "Måndagscup Final" all give "Måndagscup".
     * @param {string} name
     * @returns {string} '' when nothing is left
     */
    function keywordFor(name) {
        let best = '';
        words(name).forEach(w => {
            const p = plain(w);
            if (/^\d+$/.test(p) || NOISE.has(p) || p.length < 2) return;
            if (w.length > best.length) best = w;
        });
        return best;
    }

    /** True when the name has a Final in it ("Måndagscup Final"). Finals never count in a ranking. */
    const isFinal = name => words(name).some(w => plain(w).startsWith('final'));

    /** True when the tournament belongs to the cup: its name contains the word, ignoring case and accents. */
    const nameMatches = (name, keyword) => !!keyword && plain(name).includes(plain(keyword));

    // ---------- the lens ----------
    const halfYear = offset => NewtonHistory.halfYear(offset);

    /** The tournaments of the chosen period, newest first. */
    function inPeriod(s, period) {
        if (period === 'all') return s.list;
        const hy = halfYear(period === 'previous' ? -1 : 0);
        return s.list.filter(t => t.date >= hy.from && t.date <= hy.to);
    }

    /** The tournaments in the period that count by name: the cup's, and not a Final. */
    const matchesIn = (s, period) => inPeriod(s, period).filter(t => nameMatches(t.name, s.keyword) && !isFinal(t.name));

    /**
     * Choose the period and the ticks from the name: the current half-year, or the previous
     * one while the current has no tournament of this cup (the first match of the season).
     * @param {object} s - the state
     */
    function pickPeriod(s) {
        s.period = matchesIn(s, 'current').length || !matchesIn(s, 'previous').length ? 'current' : 'previous';
        s.ticked = new Set(matchesIn(s, s.period).map(t => t.id));
    }

    /** Rank the players on the ticked tournaments. A newer call makes an older one stale. */
    async function rank(s) {
        const seq = ++s.seq;
        const ranking = s.ticked.size ? await NewtonHistory.seedingRanking([...s.ticked]) : new Map();
        if (seq === s.seq) s.ranking = ranking;
    }

    /** Redraw Match Controls, when this state is still the current one. */
    function refresh(s) {
        if (s === st && typeof _mcRefresh === 'function') _mcRefresh(0);
    }

    async function load(s) {
        try {
            s.list = await NewtonHistory.seedingTournaments();
            pickPeriod(s);
            await rank(s);
        } catch (e) {
            console.error('Seeding: the ranking could not be read', e);
            s.error = true;
        }
        s.ready = true;
        refresh(s);
    }

    /** The state for the tournament being set up (started on first use), or null when seeding is off. */
    function ensure() {
        const cfg = typeof config !== 'undefined' && config.seeding;
        if (!cfg || cfg.mode === 'off' || typeof tournament === 'undefined' || !tournament) { st = null; return null; }
        if (st && st.tid === tournament.id) return st;
        st = { tid: tournament.id, on: cfg.mode === 'on', fraction: FRACTIONS[cfg.seeds] ? cfg.seeds : 'quarter', keyword: keywordFor(tournament.name), period: 'current',
            list: [], ticked: new Set(), ranking: new Map(), ready: false, error: false, seq: 0, othersOpen: false };
        load(st);
        return st;
    }

    // ---------- the seeds ----------
    /**
     * Who would be seeded in a bracket of this size: the ranked players (those with points in
     * the ranking, best first), of whom as many as the setting says go in as seeds. Players
     * without a ranking (new players) are never seeded. Fewer than two seeds means no seeding.
     * @param {object[]} paid - the players going into the draw
     * @param {number} bracketSize
     * @returns {{ranked: {player: object, rank: number, points: number}[], unranked: object[],
     *            seeds: {player: object, rank: number, points: number}[], wanted: number}}
     *   wanted is how many seeds the setting asks for (Infinity for All)
     */
    function plan(paid, bracketSize) {
        const s = st;
        const ranked = [], unranked = [];
        if (s && s.on && s.ready) {
            paid.forEach(player => {
                const r = s.ranking.get(NewtonHistory.seedingPlayerKey(player));
                if (r && r.points > 0) ranked.push({ player, rank: r.rank, points: r.points }); else unranked.push(player);
            });
            ranked.sort((a, b) => a.rank - b.rank);
        }
        const wanted = s ? FRACTIONS[s.fraction].seeds(bracketSize) : 0;
        const n = Math.min(wanted, ranked.length);
        return { ranked, unranked, seeds: n >= 2 ? ranked.slice(0, n) : [], wanted };
    }

    /**
     * The seeding for the draw that is about to be made, or null for a random draw.
     * @param {object[]} paid - the players going into the draw
     * @param {number} bracketSize
     * @returns {{seeds: object[], all: boolean, record: object}|null}
     *   seeds are player objects, best first; `all` is the mirror draw; record is what the tournament keeps of it
     */
    function forDraw(paid, bracketSize) {
        if (!config.seeding || config.seeding.mode === 'off') return null;
        const seeds = plan(paid, bracketSize).seeds;
        if (!seeds.length) return null;
        return { seeds: seeds.map(x => x.player), all: st.fraction === 'all', record: recordOf(seeds, st.fraction) };
    }

    /**
     * The seeding for a group draw (groups and cups), or null for a random one: every ranked player,
     * best first, go into the groups in snake order (the Seeded players choice is a bracket's, so it
     * doesn't apply). Fewer than two ranked players means no seeding.
     * @param {object[]} paid - the players going into the draw
     * @returns {{order: object[], record: object}|null} order: the ranked players, best first
     */
    function forGroups(paid) {
        if (!config.seeding || config.seeding.mode === 'off') return null;
        const ranked = plan(paid, 0).ranked;
        if (ranked.length < 2) return null;
        return { order: ranked.map(x => x.player), record: recordOf(ranked, 'groups') };
    }

    /** What the tournament keeps of a seeded draw: who was seeded, and from which tournaments. */
    function recordOf(seeds, fraction) {
        const hy = st.period === 'all' ? null : halfYear(st.period === 'previous' ? -1 : 0);
        return {
            fraction,
            seeds: seeds.map(x => ({ id: x.player.id, name: x.player.name, rank: x.rank, points: x.points })),
            keyword: st.keyword,
            period: hy ? hy.label : 'All time',
            tournaments: st.list.filter(t => st.ticked.has(t.id)).map(t => ({ id: t.id, name: t.name }))
        };
    }

    // ---------- the panel in Match Controls ----------
    /**
     * The Seeding panel for Match Controls' setup view ('' when seeding is off).
     * @returns {string}
     */
    function html() {
        const s = ensure();
        if (!s) return '';
        const paid = players.filter(p => p.paid);
        const fmts = typeof getVisibleFormats === 'function' ? getVisibleFormats() : [];
        const size = calculateBracketSize(Math.max(paid.length, 4), fmts.length ? fmts[0].id : 'DE') || 32;
        let body = '';
        if (s.on) {
            if (!s.ready) body = '<p class="mc-note">Reading earlier tournaments…</p>';
            else if (s.error) body = '<p class="mc-note">The ranking could not be read, so the draw is random.</p>';
            else if (!s.list.length) body = '<p class="mc-note">No earlier tournaments in this browser, so the draw is random. To seed from the club\'s history, restore a backup on this computer first.</p>';
            else body = controlsHtml(s, size) + listHtml(s) + seedsHtml(s, paid, size);
        }
        return `<section class="mc-panel mc-seeding"><div class="mc-ph"><h3>Seeding<small>keeps the best players apart</small></h3></div>
            <label class="mc-check mc-seedon"><input type="checkbox"${s.on ? ' checked' : ''} onchange="Seeding.setOn(this.checked)"> Seed the draw by ranking</label>${body}</section>`;
    }

    /** An option of the Seeded players choice, with how many players it is in a bracket this size. */
    function fractionLabel(key, size) {
        const f = FRACTIONS[key], n = f.seeds(size);
        return key === 'all' ? 'All ranked' : `${f.label} (${n >= 2 ? n : 'none'})`;
    }

    function controlsHtml(s, size) {
        const cur = halfYear(0), prev = halfYear(-1);
        const opt = (v, label) => `<option value="${v}"${s.period === v ? ' selected' : ''}>${label}</option>`;
        return `<div class="mc-seedctl">
            <label>Ranked on<input type="text" class="mc-text" value="${escapeHtml(s.keyword)}" onchange="Seeding.setKeyword(this.value)" placeholder="Part of the name" autocomplete="off"></label>
            <label>Period<select onchange="Seeding.setPeriod(this.value)">${opt('current', cur.label)}${opt('previous', prev.label)}${opt('all', 'All time')}</select></label>
            <label>Seeded players<select onchange="Seeding.setFraction(this.value)">${Object.keys(FRACTIONS).map(k => `<option value="${k}"${s.fraction === k ? ' selected' : ''}>${fractionLabel(k, size)}</option>`).join('')}</select></label>
        </div>`;
    }

    function listHtml(s) {
        const row = t => `<label class="mc-check"><input type="checkbox"${s.ticked.has(t.id) ? ' checked' : ''} onchange="Seeding.toggle(${s.list.indexOf(t)})"> ${escapeHtml(t.name || t.id)} <small>${t.date}</small></label>`;
        const here = inPeriod(s, s.period);
        if (!here.length) return '<p class="mc-note">No tournaments in this period.</p>';
        const mine = here.filter(t => nameMatches(t.name, s.keyword) && !isFinal(t.name));
        const others = here.filter(t => !mine.includes(t));
        return `<div class="mc-seedlist">${mine.length ? mine.map(row).join('') : '<p class="mc-note">None of them match the name. Tick the ones to rank on, or change the name.</p>'}
            ${others.length ? `<details${s.othersOpen ? ' open' : ''} ontoggle="Seeding.setOthersOpen(this.open)"><summary>Other tournaments (${others.length})</summary>${others.map(row).join('')}</details>` : ''}</div>`;
    }

    function seedsHtml(s, paid, size) {
        if (!s.ticked.size) return '<p class="mc-note">No tournament is ticked, so the draw is random.</p>';
        const p = plan(paid, size), names = list => list.map(x => escapeHtml((x.player || x).name)).join(', ');
        if (!p.seeds.length) {
            return `<p class="mc-note">${p.ranked.length} of the ${paid.length} players ${p.ranked.length === 1 ? 'has' : 'have'} points in these tournaments, which is too few to seed, so the draw is random.</p>`;
        }
        const all = s.fraction === 'all', byes = size - paid.length;
        const lines = [`<b>${p.seeds.length} seeded</b> of ${paid.length} players${all ? ': all of the ranked players' : ` (${FRACTIONS[s.fraction].label} of ${size === 8 ? 'an' : 'a'} ${size}-player bracket)`}.`];
        if (!all && p.wanted > p.seeds.length) lines.push(`Only ${p.seeds.length} of the ${p.wanted} seeds could be filled: the rest have no ranking.`);
        if (p.unranked.length) lines.push(`Not ranked, so not seeded${all ? ' (they take the places left over, at random)' : ' (drawn at random)'}: ${names(p.unranked)}.`);
        if (byes > 0 && byes <= p.seeds.length) lines.push(`The bracket has ${byes} bye${byes === 1 ? '' : 's'}; the best seed${byes === 1 ? ' gets it' : 's get them'}.`);
        else if (byes > 0) lines.push(`The bracket has ${byes} byes: each of the ${p.seeds.length} seeds gets one, and the other ${byes - p.seeds.length} go to unseeded players at random.`);
        if (all) lines.push('The top seed meets the bottom seed in round 1, the second seed the second-last, and so on.');
        return `<ol class="mc-seeds">${p.seeds.map(x => `<li><b>${escapeHtml(x.player.name)}</b><span>${x.points} pts</span></li>`).join('')}</ol>
            <p class="mc-note">${lines.join(' ')}</p>`;
    }

    // ---------- the panel's controls ----------
    /** @param {boolean} on */
    function setOn(on) { if (st) { st.on = !!on; refresh(st); } }
    /** @param {string} f - a key of FRACTIONS */
    function setFraction(f) { if (st && FRACTIONS[f]) { st.fraction = f; refresh(st); } }
    /** @param {boolean} open */
    function setOthersOpen(open) { if (st) st.othersOpen = !!open; }

    /** A new name word: choose the period and ticks again. @param {string} v */
    async function setKeyword(v) {
        const s = st;
        if (!s) return;
        s.keyword = String(v || '').trim();
        pickPeriod(s);
        await rank(s);
        refresh(s);
    }

    /** A new period: tick the cup's tournaments in it. @param {string} v */
    async function setPeriod(v) {
        const s = st;
        if (!s || !['current', 'previous', 'all'].includes(v)) return;
        s.period = v;
        s.ticked = new Set(matchesIn(s, v).map(t => t.id));
        await rank(s);
        refresh(s);
    }

    /** Tick or untick a tournament by hand. @param {number} i - its place in the list */
    async function toggle(i) {
        const s = st, t = s && s.list[i];
        if (!t) return;
        if (s.ticked.has(t.id)) s.ticked.delete(t.id); else s.ticked.add(t.id);
        await rank(s);
        refresh(s);
    }

    return { html, forDraw, forGroups, keywordFor, isFinal, nameMatches, setOn, setFraction, setKeyword, setPeriod, toggle, setOthersOpen };
})();
