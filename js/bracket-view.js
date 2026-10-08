// bracket-view.js - Bracket view for double and single elimination
//
// Lays the bracket out from the progression table (getProgressionTable(), read only),
// then draws cards and lines in world coordinates under a camera (fit, zoom, pan).
// Hovering a match magnifies it; clicking selects it and shows its lines; Follow
// traces one player through the bracket. Nothing here changes tournament data.
//
// One layout per format and finals position (layoutFor()); everything else is shared.
// Design and decisions: Docs/BRACKET-REDESIGN.md

/**
 * The bracket view: layout, camera, cards, lines, magnifier, selection and Follow.
 * Rendered into #bracketMatches (inside the zoomed #bracketCanvas); the magnifier,
 * selection bar and edge markers live in a screen-space overlay in #bracketViewport.
 */
const BracketView = (() => {
    // One card for every bracket size; the spacing between cards absorbs the difference
    const W = 200, H = 80, FS = 20, META = 20, FINALS_SPLIT = 40;
    const GAP_MIN = 10, GX_MIN = 34, CG_MIN = 34, FG_MIN = 64; // row gap, column gap, centre gap (= column gap, so forks match), finals gap
    const GAP_GROW = 80, GX_GROW = 100;                        // how far spacing may grow to fill the page
    const TOP = 104, BOTTOM = 90, PAD = 16, Z_MAX = 2, Z_FIT_MAX = 1, MAG_BELOW = 0.9;
    let PITCH = H + GAP_MIN, GX = GX_MIN, CENTER_GAP = CG_MIN, FINALS_GAP = FG_MIN;

    const svgNS = 'http://www.w3.org/2000/svg';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- state ----------
    const cam = { x: 0, y: 0, z: 1 };
    let cur = null;          // the current layout: { st, prog, pos, cw, ch, mid, fitZ, cardEls, edges, M }
    let selected = null;     // match id
    let traced = null;       // player id being followed
    let bracketKey = null;   // tournament + size + finals; a change clears the selection and fits again
    let sizeKey = null;      // viewport size; a change fits again
    let anim = null, magTimer = null;
    let els = null;          // { viewport, canvas, overlay, markers, selbar, mag }

    // ---------- structure from the progression table ----------
    const sideOf = id => id.startsWith('FS') ? 'FS' : (id.startsWith('BS-') && id !== 'BS-FINAL' ? 'BS' : 'FIN');
    const roundOf = id => +id.split('-')[1];
    const numOf = id => +id.split('-')[2];

    function structure(prog) {
        const ids = Object.keys(prog);
        const feeds = {};
        ids.forEach(src => ['winner', 'loser'].forEach(kind => {
            const d = prog[src][kind]; if (!d) return;
            (feeds[d[0]] = feeds[d[0]] || []).push({ src, kind, slot: d[1] });
        }));
        const maxFS = Math.max(...ids.filter(i => sideOf(i) === 'FS').map(roundOf));
        const maxBS = Math.max(...ids.filter(i => sideOf(i) === 'BS').map(roundOf));
        return { ids, feeds, maxFS, maxBS };
    }

    // ---------- butterfly layout ----------
    // Frontside round 1 is spaced evenly; every other match sits midway between its feeders.
    function layout(st, variant, g) {
        const { ids, feeds, maxFS, maxBS } = st;
        const P = W + g.GX, pitch = g.PITCH;
        const y = {};
        const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
        const rowOf = id => {
            if (y[id] !== undefined) return y[id];
            if (/^FS-1-/.test(id)) return (y[id] = (numOf(id) - 1) * pitch);
            const f = feeds[id] || [];
            if (/^BS-1-/.test(id)) return (y[id] = avg(f.filter(x => x.kind === 'loser').map(x => rowOf(x.src))));
            return (y[id] = avg(f.filter(x => x.kind === 'winner' && sideOf(x.src) === sideOf(id)).map(x => rowOf(x.src))));
        };
        ids.filter(i => sideOf(i) !== 'FIN').forEach(rowOf);
        const fs1 = ids.filter(i => /^FS-1-/.test(i)).map(i => y[i]);
        const mid = (Math.min(...fs1) + Math.max(...fs1)) / 2;
        // grand final on top, backside final below (as with the finals on the right)
        y['GRAND-FINAL'] = mid - H / 2 - FINALS_SPLIT;
        y['BS-FINAL'] = mid + H / 2 + FINALS_SPLIT;
        const x = {};
        if (variant === 'right') {
            const fs0 = maxBS * P - g.GX + g.CENTER_GAP;
            ids.forEach(id => {
                if (sideOf(id) === 'FS') x[id] = fs0 + (roundOf(id) - 1) * P;
                else if (sideOf(id) === 'BS') x[id] = fs0 - g.CENTER_GAP - W - (roundOf(id) - 1) * P;
            });
            // Finals in their own column; the grand final level with the frontside final (a straight
            // line), the backside final below it, so the backside's line coming round from below
            // reaches the backside final first
            const fsFinal = `FS-${maxFS}-1`;
            x['BS-FINAL'] = x['GRAND-FINAL'] = fs0 + (maxFS - 1) * P + W + g.FINALS_GAP;
            y['GRAND-FINAL'] = y[fsFinal];
            y['BS-FINAL'] = y[fsFinal] + H + 2 * FINALS_SPLIT;
        } else {
            ids.forEach(id => { if (sideOf(id) === 'FS') x[id] = (roundOf(id) - 1) * P; });
            const fx = (maxFS - 1) * P + W + g.FINALS_GAP;
            x['BS-FINAL'] = x['GRAND-FINAL'] = fx;
            const bs0 = fx + W + g.FINALS_GAP;
            ids.forEach(id => { if (sideOf(id) === 'BS') x[id] = bs0 + (maxBS - roundOf(id)) * P; });
            // Each half's last match lines up with the final it feeds: the frontside final with the
            // grand final, the backside's last match with the backside final (straight lines)
            y[`FS-${maxFS}-1`] = y['GRAND-FINAL'];
            y[`BS-${maxBS}-1`] = y['BS-FINAL'];
        }
        const minX = Math.min(...ids.map(i => x[i])), minY = Math.min(...ids.map(i => y[i]));
        const pos = {};
        ids.forEach(i => { pos[i] = { x: x[i] - minX, y: y[i] - minY }; });
        const cw = Math.max(...ids.map(i => pos[i].x)) + W, ch = Math.max(...ids.map(i => pos[i].y)) + H;
        return { pos, cw, ch, mid: mid - minY + H / 2 };
    }
    // ---------- single-elimination layout ----------
    // Rounds up to the semifinals as on the frontside; then the bronze final in the next column, level
    // with the top semifinal, and the final in the column after, midway between the semifinals. The
    // semifinal winners fork straight after the semifinals and run under the bronze final to the final.
    function layoutSE(st, g) {
        const { ids, feeds, maxFS } = st;
        const P = W + g.GX, pitch = g.PITCH, semis = maxFS - 2;
        const y = {}, x = {};
        const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
        const rowOf = id => {
            if (y[id] !== undefined) return y[id];
            if (roundOf(id) === 1) return (y[id] = (numOf(id) - 1) * pitch);
            return (y[id] = avg((feeds[id] || []).filter(f => f.kind === 'winner').map(f => rowOf(f.src))));
        };
        ids.filter(i => roundOf(i) <= semis).forEach(id => { rowOf(id); x[id] = (roundOf(id) - 1) * P; });
        const sf = ids.filter(i => roundOf(i) === semis).map(i => y[i]);
        const bronze = `FS-${maxFS - 1}-1`, final = `FS-${maxFS}-1`;
        x[bronze] = semis * P; y[bronze] = Math.min(...sf);
        x[final] = (semis + 1) * P; y[final] = (Math.min(...sf) + Math.max(...sf)) / 2;
        const minY = Math.min(...ids.map(i => y[i]));
        const pos = {};
        ids.forEach(i => { pos[i] = { x: x[i], y: y[i] - minY }; });
        const cw = Math.max(...ids.map(i => pos[i].x)) + W, ch = Math.max(...ids.map(i => pos[i].y)) + H;
        return { pos, cw, ch, mid: y[final] - minY + H / 2 };
    }
    // ---------- single-elimination layout, finals in the middle ----------
    // Two halves facing a centre column: the top half of round 1 runs left to right, the bottom half
    // right to left, each down to its semifinal. The final sits in the centre, level with the
    // semifinals (a straight line in from each side), and the bronze final under it. The rules are
    // the same single elimination; only the drawing differs.
    function layoutSEMiddle(st, g) {
        const { ids, feeds, maxFS } = st;
        const P = W + g.GX, pitch = g.PITCH, semis = maxFS - 2;
        const bronze = `FS-${maxFS - 1}-1`, final = `FS-${maxFS}-1`;
        const count = r => ids.filter(i => roundOf(i) === r).length;
        const half = count(1) / 2;
        const isLeft = id => numOf(id) <= count(roundOf(id)) / 2;
        const y = {}, x = {};
        const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
        const rowOf = id => {
            if (y[id] !== undefined) return y[id];
            if (roundOf(id) === 1) return (y[id] = ((isLeft(id) ? numOf(id) : numOf(id) - half) - 1) * pitch);
            return (y[id] = avg((feeds[id] || []).filter(f => f.kind === 'winner').map(f => rowOf(f.src))));
        };
        const cx = (semis - 1) * P + W + g.FINALS_GAP; // the centre column
        ids.filter(i => roundOf(i) <= semis).forEach(id => {
            rowOf(id);
            x[id] = isLeft(id) ? (roundOf(id) - 1) * P : cx + W + g.FINALS_GAP + (semis - roundOf(id)) * P;
        });
        x[final] = x[bronze] = cx;
        y[final] = avg(ids.filter(i => roundOf(i) === semis).map(i => y[i]));
        y[bronze] = y[final] + H + 2 * FINALS_SPLIT;
        const minY = Math.min(...ids.map(i => y[i]));
        const pos = {};
        ids.forEach(i => { pos[i] = { x: x[i], y: y[i] - minY }; });
        const cw = Math.max(...ids.map(i => pos[i].x)) + W, ch = Math.max(...ids.map(i => pos[i].y)) + H;
        return { pos, cw, ch, mid: y[final] - minY + H / 2 };
    }
    // ---------- groups and cups: the cups ----------
    // Each cup is drawn as single elimination with the final in the middle (layoutSEMiddle() on its
    // own SE table), A above B, each centred on the widest; CUP_GAP leaves room for the cup's name.
    const CUP_GAP = 150;
    /**
     * The cups' structure: every cup match (by its cup ID), the feeds between them, and per cup its
     * single-elimination structure and the SE ID → cup ID map.
     * @param {Object} prog - getProgressionTable() for the cups
     */
    function cupsStructure(prog) {
        const ids = Object.keys(prog);
        const feeds = {};
        ids.forEach(src => ['winner', 'loser'].forEach(kind => {
            const d = prog[src][kind]; if (!d) return;
            (feeds[d[0]] = feeds[d[0]] || []).push({ src, kind, slot: d[1] });
        }));
        const cups = ['A', 'B'].filter(c => tournament.cups && tournament.cups[c]).map(cup => {
            const size = tournament.cups[cup].size, se = SE_MATCH_PROGRESSION[size];
            const map = {};
            Object.keys(se).forEach(seId => { map[seId] = cupMatchId(cup, seId, size); });
            return { cup, size, st: structure(se), map };
        });
        return { ids, feeds, cups, maxFS: 0, maxBS: 0 };
    }
    function layoutCups(st, g) {
        const parts = st.cups.map(c => ({ c, L: layoutSEMiddle(c.st, g) }));
        const cw = Math.max(...parts.map(p => p.L.cw));
        const pos = {};
        let y0 = 0;
        parts.forEach(p => {
            const dx = (cw - p.L.cw) / 2;
            Object.entries(p.L.pos).forEach(([seId, q]) => { pos[p.c.map[seId]] = { x: q.x + dx, y: q.y + y0 }; });
            p.c.box = { x: dx, y: y0, w: p.L.cw, h: p.L.ch };
            y0 += p.L.ch + CUP_GAP;
        });
        const ch = y0 - CUP_GAP;
        return { pos, cw, ch, mid: ch / 2 };
    }

    // The layout is the one part chosen by format and finals position (see Docs/BRACKET-REDESIGN.md, "Other Formats")
    const layoutFor = (st, variant, g) => variant === 'se' ? layoutSE(st, g)
        : variant === 'se-middle' ? layoutSEMiddle(st, g)
        : variant === 'cups' ? layoutCups(st, g) : layout(st, variant, g);

    const worldBox = L => ({ x0: -40, y0: -TOP, x1: L.cw + 50, y1: L.ch + BOTTOM }); // room for lines routed round the outside

    // The card never changes. Fit the bracket at its tightest spacing (never above 100%),
    // then grow the row and column gaps into whatever space is left, so it fills the page.
    function geometry(st, variant, vw, vh) {
        const g = (dg, dx) => ({ PITCH: H + GAP_MIN + dg, GX: GX_MIN + dx, CENTER_GAP: CG_MIN + dx, FINALS_GAP: FG_MIN + dx });
        const size = (dg, dx) => { const b = worldBox(layoutFor(st, variant, g(dg, dx))); return { w: b.x1 - b.x0, h: b.y1 - b.y0 }; };
        const b0 = size(0, 0), b1 = size(1, 1); // width and height grow linearly with the gaps
        const aw = vw - PAD * 2, ah = vh - PAD * 2;
        const z = Math.min(Z_FIT_MAX, aw / b0.w, ah / b0.h);
        const dx = Math.max(0, Math.min(GX_GROW, (aw / z - b0.w) / (b1.w - b0.w)));
        const dg = Math.max(0, Math.min(GAP_GROW, (ah / z - b0.h) / (b1.h - b0.h)));
        return g(dg, dx);
    }
    const fitZFor = (L, vw, vh) => {
        const b = worldBox(L);
        return Math.min(Z_FIT_MAX, (vw - PAD * 2) / (b.x1 - b.x0), (vh - PAD * 2) / (b.y1 - b.y0));
    };

    const ordinal = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
    function placings(size, st) {
        const out = {}; let alive = size;
        for (let r = 1; r <= st.maxBS; r++) {
            const k = st.ids.filter(i => sideOf(i) === 'BS' && roundOf(i) === r).length;
            out[r] = k === 1 ? ordinal(alive) : `${ordinal(alive - k + 1)}–${ordinal(alive)}`;
            alive -= k;
        }
        return out;
    }

    // ---------- tournament data, read only ----------
    /**
     * A player slot as the view needs it.
     * @param {Object|null} p - match.player1 or match.player2
     * @returns {{kind: 'player'|'bye'|'tbd', id?: *, name?: string}}
     */
    function slotOf(p) {
        if (!p || !p.name || p.name === 'TBD') return { kind: 'tbd' };
        if (p.isBye || p.name === 'Walkover' || (p.id && p.id.toString().startsWith('walkover-'))) return { kind: 'bye' };
        return { kind: 'player', id: p.id, name: p.name };
    }

    /**
     * Everything one card shows, derived from a match object.
     * @param {Match} match
     */
    function viewOf(match) {
        const state = getMatchState(match);
        const p = [slotOf(match.player1), slotOf(match.player2)];
        const done = state === 'completed';
        const wi = done && match.winner ? (match.winner.id === match.player1?.id ? 0 : match.winner.id === match.player2?.id ? 1 : -1) : -1;
        let score = null;
        if (done && match.finalScore && match.finalScore.winnerLegs !== undefined && wi >= 0) {
            score = wi === 0 ? [match.finalScore.winnerLegs, match.finalScore.loserLegs] : [match.finalScore.loserLegs, match.finalScore.winnerLegs];
        }
        const conflict = done ? null : checkRefereeConflict(match.id);
        return {
            match, state, p, wi, score,
            wo: done && isWalkoverMatch(match),
            out: done ? [isPlayerEliminatedInMatch(match, 'player1'), isPlayerEliminatedInMatch(match, 'player2')] : [false, false],
            refConflict: conflict ? [conflict.player1IsReferee, conflict.player2IsReferee] : [false, false],
            resultWaiting: typeof NetworkClient !== 'undefined' && typeof NetworkClient.hasPendingResult === 'function' &&
                NetworkClient.hasPendingResult(match.id)
        };
    }

    const isSEFinalOrBronze = id => getFormat() === 'SE' &&
        (isSEFinalMatch(id, tournament.bracketSize) || isSEBronzeMatch(id, tournament.bracketSize));

    const sourceLabel = (st, id, slot) => {
        const f = (st.feeds[id] || []).find(x => x.slot === slot);
        return f ? (f.kind === 'winner' ? 'Winner ' : 'Loser ') + f.src : 'Awaiting player';
    };

    function cardHTML(st, v, id) {
        const m = v.match;
        // groups and cups: a match that waits for its referee (or its players' referee duty) isn't
        // shown as Ready (Groups.holdFor(); Match Controls says why)
        const held = v.state === 'ready' && getFormat() === 'GROUPS' && typeof Groups !== 'undefined' && !!Groups.holdFor(m);
        const s = held ? 'pending' : v.state;
        const label = v.resultWaiting ? 'Result' : s === 'live' ? 'Live' : s === 'ready' ? 'Ready' : held ? 'Waits' : '';
        const meta = `<span class="bv-id">${id}</span><span class="bv-grow"></span>` +
            (label ? `<span class="bv-state">${label}</span>` : '') +
            (m.lane && s !== 'completed' ? `<span class="bv-chip">L${escapeHtml(String(m.lane))}</span>` : '') +
            `<span class="bv-chip">${v.wo ? 'W/O' : 'Bo' + escapeHtml(String(m.legs || ''))}</span>`;
        const row = i => {
            const sl = v.p[i], slot = i === 0 ? 'player1' : 'player2';
            if (sl.kind === 'tbd') return `<div class="bv-row bv-tbd"><span class="bv-throw bv-off"></span><span class="bv-name">${sourceLabel(st, id, slot)}</span></div>`;
            if (sl.kind === 'bye') return `<div class="bv-row bv-bye"><span class="bv-throw bv-off"></span><span class="bv-name">Walkover</span></div>`;
            let cls = 'bv-row';
            if (v.wi === i) cls += ' bv-win';
            if (v.wi >= 0 && v.wi !== i) cls += ' bv-lose';
            if (v.out[i]) cls += ' bv-out';
            // Player 1 throws first
            const thr = (i === 0 && s !== 'completed') ? '<span class="bv-throw" title="Throws first"></span>' : '<span class="bv-throw bv-off"></span>';
            const name = (v.refConflict[i] ? '⚠ ' : '') + escapeHtml(sl.name);
            const title = v.refConflict[i] ? ' title="Also refereeing another match"' : '';
            const sc = v.score ? `<span class="bv-score">${escapeHtml(String(v.score[i]))}</span>` : '';
            return `<div class="${cls}">${thr}<span class="bv-name"${title}>${name}</span>${sc}</div>`;
        };
        const fin = getFormat() === 'GROUPS' ? /^[AB]-[FB]$/.test(id) : (sideOf(id) === 'FIN' || isSEFinalOrBronze(id));
        const cls = 'bv-card bv-' + s + (v.wo ? ' bv-walkover' : '') + (fin ? ' bv-final' : '') +
            (v.refConflict[0] || v.refConflict[1] ? ' bv-conflict' : '');
        return { cls, html: `<div class="bv-meta">${meta}</div>${row(0)}${row(1)}` };
    }

    // ---------- DOM ----------
    /** Create the overlay and bind input once. Returns false when the bracket page is missing. */
    function ensureDom() {
        if (els) return true;
        const viewport = document.getElementById('bracketViewport');
        const canvas = document.getElementById('bracketCanvas');
        if (!viewport || !canvas) return false;
        const overlay = document.createElement('div');
        overlay.className = 'bv-overlay';
        overlay.innerHTML = '<div class="bv-markers"></div><div class="bv-mag" hidden></div><div class="bv-selbar" hidden></div>';
        viewport.appendChild(overlay);
        // groups and cups: the group stage is a page of group cards, not a bracket under the camera
        const groups = document.createElement('div');
        groups.className = 'bv-groups';
        groups.hidden = true;
        viewport.appendChild(groups);
        els = {
            viewport, canvas, overlay, groups,
            markers: overlay.querySelector('.bv-markers'),
            mag: overlay.querySelector('.bv-mag'),
            selbar: overlay.querySelector('.bv-selbar')
        };
        bindInput();
        if (typeof ResizeObserver === 'function') {
            let raf = null;
            new ResizeObserver(() => {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => { raf = null; if (isActive() && (cur || !els.groups.hidden)) render(); });
            }).observe(viewport);
        }
        return true;
    }

    const vp = () => ({ w: els.viewport.clientWidth, h: els.viewport.clientHeight });

    /**
     * True when the current tournament is drawn by this view (double or single elimination with a
     * progression table for its size).
     * @returns {boolean}
     */
    function isActive() {
        if (typeof tournament === 'undefined' || !tournament || !tournament.bracket) return false;
        if (getFormat() === 'GROUPS') return true;
        const table = getFormat() === 'SE' ? SE_MATCH_PROGRESSION : DE_MATCH_PROGRESSION;
        return !!table[tournament.bracketSize];
    }

    /** The layout to use: the format, and where the finals go (one setting for both formats). */
    function finalsVariant() {
        if (getFormat() === 'GROUPS') return 'cups'; // always the final in the middle: two cups have to fit
        const middle = typeof config !== 'undefined' && config.ui && config.ui.bracketFinals === 'middle';
        if (getFormat() === 'SE') return middle ? 'se-middle' : 'se';
        return middle ? 'middle' : 'right';
    }

    /**
     * Draw the bracket for the current tournament. Called from renderCleanBracket() for
     * double elimination. Keeps the camera, selection and Follow across re-renders of the
     * same tournament; fits the whole bracket when the tournament, size, finals position
     * or viewport size changes.
     * @returns {void}
     */
    function render() {
        if (!ensureDom()) return;
        const groupsFormat = getFormat() === 'GROUPS';
        if (groupsFormat && gcShown() === 'groups') { renderGroups(); return; }
        els.groups.hidden = true;
        els.viewport.classList.remove('bv-groups-on');
        const prog = getProgressionTable();
        const size = groupsFormat ? ['A', 'B'].map(c => tournament.cups[c] ? tournament.cups[c].size : 0).join('/') : tournament.bracketSize;
        const variant = finalsVariant();
        const st = groupsFormat ? cupsStructure(prog) : structure(prog);
        let { w: vw, h: vh } = vp();
        const hidden = vw < 100 || vh < 100;      // page not shown yet; fit again once it is
        if (hidden) { vw = 1400; vh = 800; }
        const g = geometry(st, variant, vw, vh);
        ({ PITCH, GX, CENTER_GAP, FINALS_GAP } = g);
        const L = layoutFor(st, variant, g);
        const pos = L.pos;

        const byId = {};
        (typeof matches !== 'undefined' && Array.isArray(matches) ? matches : []).forEach(m => { byId[m.id] = m; });
        const ids = st.ids.filter(id => byId[id]);
        const M = {};
        ids.forEach(id => { M[id] = viewOf(byId[id]); });

        const host = document.getElementById('bracketMatches');
        host.innerHTML = '';
        const world = document.createElement('div');
        world.className = 'bv-world';
        world.style.setProperty('--w', W + 'px');
        world.style.setProperty('--h', H + 'px');
        world.style.setProperty('--fs', FS + 'px');
        host.appendChild(world);
        els.viewport.classList.add('bv-active');
        els.overlay.hidden = false;

        const lbl = (html, x, y, cls = 'bv-col-label') => {
            const d = document.createElement('div');
            d.className = cls; d.innerHTML = html; d.style.left = x + 'px'; d.style.top = y + 'px';
            world.appendChild(d); return d;
        };
        // a label centred over a column (x is the column's left edge)
        const lblMid = (html, x, y, cls) => { const d = lbl(html, x + W / 2, y, cls); d.style.transform = 'translateX(-50%)'; return d; };

        const LABEL_GAP = 26; // every header sits the same distance above the topmost match of its round
        if (variant === 'cups') {
            // each cup: its name over the final, the rounds over each half's columns, as with the
            // final in the middle; the signature under the last cup
            const club = escapeHtml((typeof config !== 'undefined' && config.clubName) || 'NewTon DC');
            st.cups.forEach((c, k) => {
                const cs = c.st, semis = cs.maxFS - 2, at = seId => pos[c.map[seId]];
                const final = `FS-${cs.maxFS}-1`, bronze = `FS-${cs.maxFS - 1}-1`;
                const name = `${c.cup} cup`;
                lblMid(k === 0 ? `${club} · ${name}` : name, at(final).x, c.box.y - 94, 'bv-club bv-cup-name');
                const roundName = r => r === semis ? 'Semifinals' : r === semis - 1 ? 'Quarterfinals' : 'Round ' + r;
                const inRound = r => cs.ids.filter(i => roundOf(i) === r);
                for (let r = 1; r <= semis; r++) {
                    const n = inRound(r).length;
                    [inRound(r).filter(i => numOf(i) <= n / 2), inRound(r).filter(i => numOf(i) > n / 2)].forEach(side => {
                        if (side.length) lblMid(roundName(r), at(side[0]).x, Math.min(...side.map(i => at(i).y)) - LABEL_GAP);
                    });
                }
                const places = c.cup === 'A' ? ['1st', '3rd place'] : ['5th–6th', '7th–8th place'];
                lblMid('Final', at(final).x, at(final).y - LABEL_GAP, 'bv-col-label bv-finals-label');
                lblMid('Bronze final', at(bronze).x, at(bronze).y - LABEL_GAP, 'bv-col-label bv-finals-label');
                // a bronze final between two walkovers (a cup of two) decides nothing
                const bm = M[c.map[bronze]] && M[c.map[bronze]].match;
                const empty = bm && isWalkover(bm.player1) && isWalkover(bm.player2);
                lblMid(empty ? 'Not played' : places[1], at(bronze).x, at(bronze).y + H + 8, 'bv-col-label bv-sub-label bv-finals-label');
                if (c.cup === 'B') lblMid(places[0] + ' place', at(final).x, at(final).y + H + 8, 'bv-col-label bv-sub-label bv-finals-label');
            });
            const lastCup = st.cups[st.cups.length - 1];
            lblMid(String.fromCharCode(..._0x7a, ..._0x9b), pos[lastCup.map[`FS-${lastCup.st.maxFS}-1`]].x, L.ch + 44, 'bv-signature').id = 'tournament-watermark';
        } else if (variant === 'se-middle') {
            // the club name over the centre column; each half's rounds labelled over its own columns
            const club = escapeHtml((typeof config !== 'undefined' && config.clubName) || 'NewTon DC');
            const semis = st.maxFS - 2, bronze = `FS-${st.maxFS - 1}-1`, final = `FS-${st.maxFS}-1`;
            lblMid(club, pos[final].x, -94, 'bv-club');
            const roundName = r => r === semis ? 'Semifinals' : r === semis - 1 ? 'Quarterfinals' : 'Round ' + r;
            const inRound = r => st.ids.filter(i => roundOf(i) === r);
            for (let r = 1; r <= semis; r++) {
                const n = inRound(r).length;
                [inRound(r).filter(i => numOf(i) <= n / 2), inRound(r).filter(i => numOf(i) > n / 2)].forEach(side => {
                    lblMid(roundName(r), pos[side[0]].x, Math.min(...side.map(i => pos[i].y)) - LABEL_GAP);
                });
            }
            lblMid('Final', pos[final].x, pos[final].y - LABEL_GAP, 'bv-col-label bv-finals-label');
            lblMid('Bronze final', pos[bronze].x, pos[bronze].y - LABEL_GAP, 'bv-col-label bv-finals-label');
            lblMid('3rd place', pos[bronze].x, pos[bronze].y + H + 8, 'bv-col-label bv-sub-label bv-finals-label');
            // application signature, centred under the finals (checked by renderBracket())
            lblMid(String.fromCharCode(..._0x7a, ..._0x9b), pos[final].x, L.ch + 44, 'bv-signature').id = 'tournament-watermark';
        } else if (variant === 'se') {
            const club = escapeHtml((typeof config !== 'undefined' && config.clubName) || 'NewTon DC');
            lbl(club, 0, -94, 'bv-club');
            const semis = st.maxFS - 2, bronze = `FS-${st.maxFS - 1}-1`, final = `FS-${st.maxFS}-1`;
            const roundName = r => r === semis ? 'Semifinals' : r === semis - 1 ? 'Quarterfinals' : 'Round ' + r;
            const topOf = r => Math.min(...st.ids.filter(i => roundOf(i) === r).map(i => pos[i].y));
            for (let r = 1; r <= semis; r++) lblMid(roundName(r), pos[`FS-${r}-1`].x, topOf(r) - LABEL_GAP);
            lblMid('Bronze final', pos[bronze].x, pos[bronze].y - LABEL_GAP);
            lblMid('3rd place', pos[bronze].x, pos[bronze].y + H + 8, 'bv-col-label bv-sub-label bv-finals-label');
            lblMid('Final', pos[final].x, pos[final].y - LABEL_GAP);
            // application signature, centred under round 1 (checked by renderBracket())
            const lastR1 = st.ids.filter(i => roundOf(i) === 1).sort((a, b) => numOf(b) - numOf(a))[0];
            lblMid(String.fromCharCode(..._0x7a, ..._0x9b), pos[lastR1].x, L.ch + 44, 'bv-signature').id = 'tournament-watermark';
        } else {
            // backside band
            const bsIds = st.ids.filter(i => sideOf(i) === 'BS');
            // With the finals on the right, the band also takes in the line from the last backside match,
            // which leaves to the left and runs under the bracket (see the edges below)
            const around = variant === 'right' ? GX / 2 : 0, under = variant === 'right' ? 30 : 0;
            const bx0 = Math.min(...bsIds.map(i => pos[i].x)) - around - 14, bx1 = Math.max(...bsIds.map(i => pos[i].x)) + W + 14;
            const band = document.createElement('div');
            band.className = 'bv-band';
            Object.assign(band.style, { left: bx0 + 'px', top: '-42px', width: (bx1 - bx0) + 'px', height: (L.ch + under + 56) + 'px' });
            world.appendChild(band);

            // side and column labels
            const fsX0 = pos['FS-1-1'].x;
            // the club name, on the side labels' line: top left with the finals on the right; with them in
            // the middle, centred on the edge of the backside's shaded area
            const club = escapeHtml((typeof config !== 'undefined' && config.clubName) || 'NewTon DC');
            if (variant === 'right') lbl(club, 0, -94, 'bv-club');
            else lblMid(club, bx0 - W / 2, -94, 'bv-club');

            // side labels centred over each side's first round
            lblMid('Frontside ▶', fsX0, -84, 'bv-side-label');
            lblMid('◀ Backside', pos['BS-1-1'].x, -84, 'bv-side-label');
            const place = placings(size, st);
            const topOf = (side, r) => Math.min(...st.ids.filter(i => sideOf(i) === side && roundOf(i) === r).map(i => pos[i].y));
            for (let r = 1; r <= st.maxFS; r++) lblMid(r === st.maxFS ? 'Frontside final' : 'Round ' + r, pos[`FS-${r}-1`].x, topOf('FS', r) - LABEL_GAP);
            for (let r = 1; r <= st.maxBS; r++) lblMid(`${place[r]} place`, pos[`BS-${r}-1`].x, topOf('BS', r) - LABEL_GAP);
            // the line from the backside final to the grand final runs behind these
            lblMid('Backside final', pos['BS-FINAL'].x, pos['BS-FINAL'].y - LABEL_GAP, 'bv-col-label bv-finals-label');
            lblMid('3rd place', pos['BS-FINAL'].x, pos['BS-FINAL'].y + H + 8, 'bv-col-label bv-sub-label bv-finals-label');
            lblMid('Grand final', pos['GRAND-FINAL'].x, pos['GRAND-FINAL'].y - LABEL_GAP, 'bv-col-label bv-finals-label');
            // FINALS sits just above the finals, in the style of BACKSIDE and FRONTSIDE
            lblMid('Finals', pos['GRAND-FINAL'].x, pos['GRAND-FINAL'].y - LABEL_GAP - 40, 'bv-side-label');

            // application signature, below the last first-round match (checked by renderBracket())
            const lastFS1 = st.ids.filter(i => /^FS-1-/.test(i)).sort((a, b) => numOf(b) - numOf(a))[0];
            // centred under round 1 with the finals on the right; left-aligned at the bracket's edge with them in the middle
            const sigText = String.fromCharCode(..._0x7a, ..._0x9b);
            const sigY = L.ch + (variant === 'right' ? 62 : 44);
            const sig = variant === 'right' ? lblMid(sigText, pos[lastFS1].x, sigY, 'bv-signature') : lbl(sigText, pos[lastFS1].x, sigY, 'bv-signature');
            sig.id = 'tournament-watermark';
        }

        // lines
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', L.cw); svg.setAttribute('height', L.ch);
        world.appendChild(svg);
        const slotY = (id, slot) => pos[id].y + META + (slot === 'player1' ? 0.5 : 1.5) * (H - META) / 2;
        const cy = id => pos[id].y + H / 2;
        const boxes = st.ids.map(i => ({ id: i, x0: pos[i].x, x1: pos[i].x + W, y0: pos[i].y, y1: pos[i].y + H }));
        const crosses = (xa, xb, yy, skip) => boxes.some(b => !skip.includes(b.id) && yy > b.y0 - 4 && yy < b.y1 + 4 &&
            Math.max(xa, xb) > b.x0 && Math.min(xa, xb) < b.x1);
        const edges = [];
        st.ids.forEach(src => ['winner', 'loser'].forEach(kind => {
            const d = prog[src][kind]; if (!d) return;
            const [dst, slot] = d;
            const s = pos[src], t = pos[dst];
            // Loser lines show on selection only, except: the frontside final to the backside final
            // (it feeds both finals, a T-junction off its line to the grand final), and with the finals
            // on the right, round 1 to backside round 1 (mirroring the frontside forks)
            const always = kind === 'winner' || (sideOf(src) === 'FS' && dst === 'BS-FINAL') ||
                (variant === 'right' && /^FS-1-/.test(src));
            let path;
            if (variant === 'right' && sideOf(src) === 'BS' && dst === 'BS-FINAL') {
                // The backside runs right to left: its last match leaves from its left side, goes
                // round under the bracket, up the right edge, and enters the backside final from the right
                const x1 = s.x, ox = x1 - GX / 2, yR = L.ch + 30, xR = t.x + W + GX / 2;
                path = `M${x1} ${cy(src)} H${ox} V${yR} H${xR} V${cy(dst)} H${t.x + W}`;
            } else if (variant === 'se' && kind === 'winner' && !prog[dst].winner && roundOf(dst) === st.maxFS) {
                // Semifinal winners fork straight after the semifinals and run under the bronze final
                const xg = s.x + W + GX / 2;
                path = `M${s.x + W} ${cy(src)} H${xg} V${cy(dst)} H${t.x}`;
            } else if (kind === 'loser' && dst === 'BS-FINAL') {
                // The frontside final's loser drops from the bottom middle of its card and turns into the
                // backside final from the left
                path = `M${s.x + W / 2} ${s.y + H} V${cy(dst)} H${t.x}`;
            } else if (variant === 'right' && src === 'BS-FINAL') {
                // The backside final's winner continues up the same line into the grand final from the
                // right, a T-junction beside the backside final (mirroring the frontside final's split),
                // so the two halves meet in the grand final from both sides
                const xR = s.x + W + GX / 2;
                path = `M${s.x + W} ${cy(src)} H${xR} V${cy(dst)} H${t.x + W}`;
            } else if (s.x === t.x) {
                path = s.y < t.y ? `M${s.x + W / 2} ${s.y + H} V${t.y}` : `M${s.x + W / 2} ${s.y} V${t.y + H}`;
            } else {
                const dir = Math.sign((t.x + W / 2) - (s.x + W / 2));
                const x1 = dir > 0 ? s.x + W : s.x, x2 = dir > 0 ? t.x : t.x + W;
                // drawn lines: centre to centre, so two feeders make a fork and one feeder a straight line
                // loser drops on selection: enter the player row they fill
                const y1 = cy(src), y2 = always ? cy(dst) : slotY(dst, slot);
                const adjacent = Math.abs(x2 - x1) <= Math.max(GX, CENTER_GAP, FINALS_GAP) + 1;
                const mx = adjacent ? (x1 + x2) / 2 : x2 - dir * GX / 2;
                if (kind === 'winner' && !adjacent && crosses(x1, mx, y1, [src, dst])) {
                    const yR = y1 < L.mid ? -56 : L.ch + 30, ox = x1 + dir * GX / 2;
                    path = `M${x1} ${y1} H${ox} V${yR} H${mx} V${y2} H${x2}`;
                } else if (Math.abs(y1 - y2) < 0.5) {
                    path = `M${x1} ${y1} H${x2}`;
                } else {
                    path = `M${x1} ${y1} H${mx} V${y2} H${x2}`;
                }
                if (kind === 'loser') {
                    const tg = document.createElementNS(svgNS, 'text');
                    tg.setAttribute('x', dir > 0 ? x2 - 6 : x2 + 6); tg.setAttribute('y', y2 - 6);
                    tg.setAttribute('text-anchor', dir > 0 ? 'end' : 'start');
                    tg.setAttribute('class', 'bv-droptag'); tg.textContent = 'loser';
                    svg.appendChild(tg);
                    edges.push({ src, dst, kind: 'tag', el: tg });
                }
            }
            const p = document.createElementNS(svgNS, 'path');
            p.setAttribute('d', path);
            // All lines alike, except fainter into a match that has no players assigned yet
            const assigned = M[dst] && M[dst].p.some(sl => sl.kind !== 'tbd');
            p.setAttribute('class', always ? 'bv-edge' + (assigned ? ' bv-known' : '') : 'bv-drop');
            svg.appendChild(p);
            edges.push({ src, dst, kind, el: p });
        }));

        // single elimination: a dashed line ties the bronze final to the final (finals on the right:
        // from the bronze final down to the line into the final; in the middle: from the final down to
        // the bronze final under it)
        if (variant === 'cups') {
            st.cups.forEach(c => {
                const bronze = c.map[`FS-${c.st.maxFS - 1}-1`], final = c.map[`FS-${c.st.maxFS}-1`];
                const d = document.createElementNS(svgNS, 'path');
                d.setAttribute('d', `M${pos[final].x + W / 2} ${pos[final].y + H} V${pos[bronze].y}`);
                const assigned = M[bronze] && M[bronze].p.some(sl => sl.kind !== 'tbd');
                d.setAttribute('class', 'bv-edge bv-dashed' + (assigned ? ' bv-known' : ''));
                svg.appendChild(d);
            });
        }
        if (variant === 'se' || variant === 'se-middle') {
            const bronze = `FS-${st.maxFS - 1}-1`, final = `FS-${st.maxFS}-1`;
            const d = document.createElementNS(svgNS, 'path');
            d.setAttribute('d', variant === 'se'
                ? `M${pos[bronze].x + W / 2} ${pos[bronze].y + H} V${cy(final)}`
                : `M${pos[final].x + W / 2} ${pos[final].y + H} V${pos[bronze].y}`);
            const target = variant === 'se' ? final : bronze;
            const assigned = M[target] && M[target].p.some(sl => sl.kind !== 'tbd');
            d.setAttribute('class', 'bv-edge bv-dashed' + (assigned ? ' bv-known' : ''));
            svg.appendChild(d);
        }

        // cards
        const cardEls = {};
        ids.forEach(id => {
            const c = cardHTML(st, M[id], id);
            const el = document.createElement('div');
            el.className = c.cls; el.innerHTML = c.html; el.tabIndex = 0; el.dataset.id = id;
            el.id = `bracket-match-${id}`;
            el.setAttribute('role', 'button'); el.setAttribute('aria-label', 'Match ' + id);
            el.style.left = pos[id].x + 'px'; el.style.top = pos[id].y + 'px';
            el.addEventListener('click', () => { if (!suppressClick) (selected === id && !traced ? clearSel() : select(id)); });
            el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); } });
            el.addEventListener('mouseenter', () => { clearTimeout(magTimer); magTimer = setTimeout(() => showMag(id), 220); });
            el.addEventListener('mouseleave', hideMag);
            world.appendChild(el); cardEls[id] = el;
        });

        cur = { st, prog, M, pos, cw: L.cw, ch: L.ch, mid: L.mid, cardEls, edges, world };
        cur.fitZ = fitZFor(L, vw, vh);

        // keep the selection while it still makes sense
        if (selected && !cardEls[selected]) selected = null;
        if (traced !== null && !ids.some(i => playsIn(i, traced))) traced = null;

        const bKey = `${tournament.id}|${size}|${variant}`, sKey = hidden ? 'hidden' : vw + 'x' + vh;
        hideMag();
        const newBracket = bKey !== bracketKey;
        if (newBracket) { bracketKey = bKey; selected = null; traced = null; }
        if (newBracket || sKey !== sizeKey || cam.z < cur.fitZ) { sizeKey = sKey; fitAll(false); }
        else apply();
        paint();
    }

    // ---------- groups and cups: the group stage ----------
    /** The operator's Groups | Cups choice, for this tournament and cup draw; Cups once they are drawn. */
    let gcChoice = { key: null, view: null };
    const gcKey = () => `${tournament.id}|${tournament.cups && tournament.cups.A ? tournament.cups.A.seeds.join(',') : ''}`;
    const gcShown = () => !tournament.cups ? 'groups' : (gcChoice.key === gcKey() ? gcChoice.view : 'cups');

    /**
     * Groups or Cups on the bracket page (groups and cups; the header's switch). Before the cups
     * are drawn there are only groups.
     * @param {'groups'|'cups'} view
     * @returns {void}
     */
    function setGroupsView(view) {
        if (typeof tournament === 'undefined' || !tournament) return;
        gcChoice = { key: gcKey(), view: view === 'cups' ? 'cups' : 'groups' };
        updateHeader();
        if (isActive()) render();
    }

    /** A group match's state as the group card shows it: result, live on lane, ready, or waiting. */
    function groupMatchState(m) {
        const s = getMatchState(m);
        if (s === 'completed') {
            const f = m.finalScore, w = m.winner && String(m.winner.id) === String(m.player1.id) ? 0 : 1;
            const score = f ? (w === 0 ? `${f.winnerLegs}–${f.loserLegs}` : `${f.loserLegs}–${f.winnerLegs}`) : 'played';
            return `<span class="bv-gres">${escapeHtml(score)}</span>`;
        }
        if (s === 'live') return `<span class="bv-gchip bv-glive">${m.lane ? `Lane ${escapeHtml(String(m.lane))}` : 'Live'}</span>`;
        const busy = typeof getPlayersInLiveMatches === 'function' ? getPlayersInLiveMatches(m.id) : [];
        const free = ![m.player1, m.player2].some(p => p && busy.includes(parseInt(p.id)));
        const hold = Groups.holdFor(m);
        if (free && !hold) return '<span class="bv-gchip bv-gready">Ready</span>';
        return `<span class="bv-gchip bv-gwait"${hold ? ` title="${escapeHtml(hold)}"` : ''}>Waiting</span>`;
    }

    /**
     * Draw the group stage: one card per group with its table (the top two go to the A cup, the rest
     * to the B cup) and its matches in their fixed order, each with its referee and state. A played
     * match that can be undone has Undo; a match that hasn't been played opens it in Match Controls.
     * @returns {void}
     */
    function renderGroups() {
        stopAnim(); hideMag();
        cur = null; selected = null; traced = null; bracketKey = null;
        els.overlay.hidden = true;
        els.viewport.classList.add('bv-active', 'bv-groups-on');
        document.getElementById('bracketMatches').innerHTML = '';
        const drawn = !!tournament.cups;
        const refName = id => { const p = players.find(x => String(x.id) === String(id)); return p ? p.name : ''; };
        const card = g => {
            const rows = Groups.standings(g.name);
            const ms = Groups.groupMatches(g.name);
            const played = ms.filter(m => m.completed).length;
            const sign = n => n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0';
            const table = rows.map(r => `<tr class="${r.pos <= 2 ? 'bv-to-a' : 'bv-to-b'}"><td>${r.pos}</td><td class="bv-gname"><b>${escapeHtml(r.player.name)}</b>${r.level && r.played ? ' <span class="bv-glevel" title="Level on wins, legs and head-to-head">level</span>' : ''}</td><td>${r.played}</td><td>${r.won}</td><td>${r.lost}</td><td>${sign(r.diff)}</td><td>${r.legsWon}</td></tr>`).join('');
            const list = ms.map(m => {
                const done = m.completed, live = getMatchState(m) === 'live';
                const ref = m.referee ? refName(m.referee) : (!done ? Groups.plannedRefereeText(m) : '');
                const w = done && m.winner ? String(m.winner.id) : null;
                const nm = p => `<span${w && String(p.id) === w ? ' class="bv-gwin"' : ''}>${escapeHtml(p.name)}</span>`;
                const undo = done && !tournament.readOnly && isMatchUndoable(m.id) ? `<button type="button" class="bv-gundo" data-undo="${escapeHtml(m.id)}" title="Undo this result">Undo</button>` : '';
                return `<div class="bv-grow${done ? ' bv-gdone' : ''}${live ? ' bv-glive-row' : ''}" data-match="${escapeHtml(m.id)}" title="${done ? '' : 'Open in Match Controls'}">
                    <span class="bv-gno">${escapeHtml(m.id)}</span><span class="bv-gwho">${nm(m.player1)} – ${nm(m.player2)}</span>
                    <span class="bv-gref">${ref ? `ref ${escapeHtml(ref)}` : ''}</span>${groupMatchState(m)}${undo}</div>`;
            }).join('');
            return `<section class="bv-gcard"><h3>Group ${escapeHtml(g.name)}<small>${played} of ${ms.length} played</small></h3>
                <table class="bv-gtable"><thead><tr><th>#</th><th>Player</th><th title="Played">P</th><th title="Won">W</th><th title="Lost">L</th><th title="Leg difference">±</th><th title="Legs won">Legs</th></tr></thead><tbody>${table}</tbody></table>
                <div class="bv-gkey"><span><i class="bv-gkey-a"></i>to the A cup</span><span><i class="bv-gkey-b"></i>to the ${tournament.cups && !tournament.cups.B ? 'B cup (not played)' : 'B cup'}</span></div>
                <div class="bv-glist">${list}</div></section>`;
        };
        const lists = Groups.groupList();
        const note = drawn ? 'The cups are drawn, so the group results are locked.'
            : Groups.allGroupsDone() ? 'Every group match is played: draw the cups in Match Controls.'
            : 'Referees are planned from each group and filled in when a match starts; change them in Match Controls.';
        // as many columns as fit, but rows of equal length (4 groups: 4 across or 2 × 2, never 3 + 1)
        const fit = Math.max(1, Math.floor((els.viewport.clientWidth - 36) / 420));
        const cols = [8, 6, 4, 3, 2, 1].filter(c => c <= fit && lists.length % c === 0)[0] || 1;
        els.groups.innerHTML = `<div class="bv-gwrap"><div class="bv-ggrid" style="--gcols: ${cols}">${lists.map(card).join('')}</div><p class="bv-gnote">${note}</p>
            <div class="bv-signature bv-gsig" id="tournament-watermark">${String.fromCharCode(..._0x7a, ..._0x9b)}</div></div>`;
        els.groups.hidden = false;
        els.groups.querySelectorAll('[data-undo]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); handleSurgicalUndo(b.dataset.undo); }));
        els.groups.querySelectorAll('.bv-grow:not(.bv-gdone)').forEach(r => r.addEventListener('click', () => showBracketView('controls', r.dataset.match)));
    }

    /** Hide the overlay and release the viewport when another renderer takes over. */
    function deactivate() {
        if (!els) return;
        stopAnim(); hideMag();
        selected = null; traced = null; cur = null; bracketKey = null; sizeKey = null;
        els.overlay.hidden = true;
        els.markers.innerHTML = '';
        els.selbar.hidden = true;
        els.viewport.classList.remove('bv-active', 'bv-dragging', 'bv-groups-on');
        els.groups.hidden = true;
        els.canvas.style.removeProperty('--inv');
    }

    // ---------- camera: screen = world * z + (x, y) ----------
    const clampZ = z => Math.min(Z_MAX, Math.max(cur ? cur.fitZ : 0.1, z));
    // Keep the bracket on screen: centred when it fits, edges never pulled inside the viewport otherwise
    function clampCam() {
        if (!cur) return;
        const { w, h } = vp(), b = worldBox(cur);
        const axis = (p, sz, a0, a1) => {
            const len = (a1 - a0) * cam.z;
            if (len + PAD * 2 <= sz) return (sz - len) / 2 - a0 * cam.z;
            return Math.min(PAD - a0 * cam.z, Math.max(sz - PAD - a1 * cam.z, p));
        };
        cam.x = axis(cam.x, w, b.x0, b.x1);
        cam.y = axis(cam.y, h, b.y0, b.y1);
    }
    function apply() {
        if (!cur) return;
        clampCam();
        els.canvas.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
        cur.world.style.setProperty('--inv', (1 / cam.z).toFixed(4));
        const out = document.getElementById('bvZoom');
        if (out) out.textContent = Math.round(cam.z * 100) + '%';
        updateMarkers();
    }
    function zoomAt(sx, sy, factor) {
        if (!cur) return;
        stopAnim(); hideMag();
        const z = clampZ(cam.z * factor);
        const wx = (sx - cam.x) / cam.z, wy = (sy - cam.y) / cam.z;
        cam.z = z; cam.x = sx - wx * z; cam.y = sy - wy * z;
        apply();
    }
    function boxOf(ids) {
        const p = cur.pos;
        return {
            x0: Math.min(...ids.map(i => p[i].x)), y0: Math.min(...ids.map(i => p[i].y)),
            x1: Math.max(...ids.map(i => p[i].x)) + W, y1: Math.max(...ids.map(i => p[i].y)) + H
        };
    }
    function fitTarget(b, pad = 48, maxZ = 1) {
        const { w, h } = vp();
        const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
        const z = clampZ(Math.min(maxZ, (w - pad * 2) / bw, (h - pad * 2) / bh));
        return { z, x: (w - bw * z) / 2 - b.x0 * z, y: (h - bh * z) / 2 - b.y0 * z };
    }
    function stopAnim() { if (anim) cancelAnimationFrame(anim); anim = null; }
    function animateTo(t, ms = 420) {
        stopAnim(); hideMag();
        if (reduceMotion) { Object.assign(cam, t); apply(); return; }
        const { w, h } = vp();
        const view = c => ({ cx: (w / 2 - c.x) / c.z, cy: (h / 2 - c.y) / c.z, lz: Math.log(c.z) });
        const a = view(cam), b = view(t), t0 = performance.now();
        const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const step = now => {
            const k = Math.min(1, (now - t0) / ms), e = ease(k);
            const z = Math.exp(a.lz + (b.lz - a.lz) * e);
            cam.z = z;
            cam.x = w / 2 - (a.cx + (b.cx - a.cx) * e) * z;
            cam.y = h / 2 - (a.cy + (b.cy - a.cy) * e) * z;
            apply();
            anim = k < 1 ? requestAnimationFrame(step) : null;
        };
        anim = requestAnimationFrame(step);
    }
    function fitAll(animate = true) {
        if (!cur) return;
        const t = fitTarget(worldBox(cur), PAD, Z_FIT_MAX); // Fit all never zooms past 100%
        if (animate) animateTo(t); else { Object.assign(cam, t); apply(); }
    }
    const onScreen = id => {
        const p = cur.pos[id], { w, h } = vp();
        const sx = p.x * cam.z + cam.x, sy = p.y * cam.z + cam.y;
        return sx + W * cam.z > 0 && sx < w && sy + H * cam.z > 0 && sy < h;
    };
    const connected = id => ({
        out: cur.edges.filter(e => e.src === id && e.kind !== 'tag').map(e => e.dst),
        inn: cur.edges.filter(e => e.dst === id && e.kind !== 'tag').map(e => e.src)
    });
    function followIfNeeded(id) {
        const { out, inn } = connected(id);
        const all = [id, ...out, ...inn];
        if (all.every(onScreen)) return;
        const w = cur.prog[id].winner ? [cur.prog[id].winner[0]] : [];
        for (const set of [all, [id, ...out], [id, ...w]]) {
            const t = fitTarget(boxOf(set), 64, Math.max(cam.z, 0.5));
            if (t.z >= 0.35) { animateTo(t); return; }
        }
        animateTo(fitTarget(boxOf([id]), 64, Math.max(cam.z, 0.8)));
    }

    // ---------- hover: magnifier when zoomed out, progression tip when zoomed in ----------
    function hideMag() { clearTimeout(magTimer); magTimer = null; if (els) els.mag.hidden = true; }
    function progressText(id) {
        const p = cur.prog[id], m = cur.M[id].match, bits = [];
        // groups and cups: each cup's bronze and final decide places (Docs/GROUPS-AND-CUPS.md)
        const cupEnd = getFormat() === 'GROUPS' && /^[AB]-[FB]$/.test(id) ? {
            'A-F': ['Winner takes 1st', 'Loser takes 2nd'], 'A-B': ['Winner takes 3rd', 'Loser takes 4th'],
            'B-F': ['Winner and loser take 5th–6th'], 'B-B': ['Winner and loser take 7th–8th'] }[id] : null;
        if (cupEnd) bits.push(...cupEnd);
        else {
            if (p.winner) bits.push(`Winner → <b>${p.winner[0]}</b>`); else bits.push('Winner takes 1st');
            if (p.loser) bits.push(`Loser → <b>${p.loser[0]}</b>`);
            else if (id === 'GRAND-FINAL') bits.push('Loser takes 2nd');
            else bits.push('Loser is out');
        }
        if (m.referee) {
            const ref = (typeof players !== 'undefined' ? players : []).find(pl => pl.id === m.referee);
            if (ref) bits.push(`Ref ${escapeHtml(ref.name)}`);
        }
        return bits.join(' · ');
    }
    function showMag(id) {
        if (!cur || !cur.M[id] || drag || anim) return;
        const mag = els.mag, p = cur.pos[id], { w, h } = vp();
        const cx = (p.x + W / 2) * cam.z + cam.x;
        // Zoomed in: the card is already readable, so show only where its players go, below the card
        if (cam.z >= MAG_BELOW) {
            mag.className = 'bv-mag bv-tip';
            mag.innerHTML = `<div class="bv-foot">${progressText(id)}</div>`;
            mag.hidden = false;
            const mw = mag.offsetWidth, mh = mag.offsetHeight;
            const below = (p.y + H) * cam.z + cam.y + 6, above = p.y * cam.z + cam.y - mh - 6;
            mag.style.left = Math.min(w - mw - 8, Math.max(8, cx - mw / 2)) + 'px';
            mag.style.top = (below + mh + 8 <= h ? below : Math.max(8, above)) + 'px';
            return;
        }
        const c = cardHTML(cur.st, cur.M[id], id);
        mag.className = 'bv-mag';
        mag.innerHTML = `<div class="${c.cls}">${c.html}</div><div class="bv-foot">${progressText(id)}</div>`;
        mag.hidden = false;
        const cyy = (p.y + H / 2) * cam.z + cam.y;
        const mw = mag.offsetWidth, mh = mag.offsetHeight;
        mag.style.left = Math.min(w - mw - 8, Math.max(8, cx - mw / 2)) + 'px';
        mag.style.top = Math.min(h - mh - 8, Math.max(8, cyy - mh / 2)) + 'px';
    }

    // ---------- markers for off-screen connected matches ----------
    function updateMarkers() {
        if (!els) return;
        els.markers.innerHTML = '';
        if (!cur || !selected || traced !== null) return;
        const { w, h } = vp(), m = 16, p = cur.pos, prog = cur.prog[selected];
        const items = [];
        const { out, inn } = connected(selected);
        out.forEach(d => {
            const isW = prog.winner && prog.winner[0] === d;
            items.push({ id: d, cls: isW ? 'bv-winner' : 'bv-loser', text: isW ? 'Winner →' : 'Loser →' });
        });
        if (cur.M[selected].state !== 'completed') inn.forEach(s => items.push({ id: s, cls: 'bv-from', text: 'From' }));
        items.forEach(it => {
            if (!cur.cardEls[it.id] || onScreen(it.id)) return;
            const sx = (p[it.id].x + W / 2) * cam.z + cam.x, sy = (p[it.id].y + H / 2) * cam.z + cam.y;
            const dx = sx < 0 ? -1 : sx > w ? 1 : 0, dy = sy < 0 ? -1 : sy > h ? 1 : 0;
            const arrow = { '-1,-1': '↖', '0,-1': '↑', '1,-1': '↗', '-1,0': '←', '1,0': '→', '-1,1': '↙', '0,1': '↓', '1,1': '↘' }[dx + ',' + dy] || '';
            const el = document.createElement('button');
            el.type = 'button'; el.className = 'bv-marker ' + it.cls;
            el.innerHTML = `${it.text} <b>${it.id}</b> ${arrow}`;
            el.setAttribute('aria-label', `${it.text} ${it.id}, off-screen. Go there.`);
            els.markers.appendChild(el);
            const hw = el.offsetWidth / 2 + m, hh = el.offsetHeight / 2 + m;
            el.style.left = Math.min(w - hw, Math.max(hw, sx)) + 'px';
            el.style.top = Math.min(h - hh - 56, Math.max(hh, sy)) + 'px';
            el.addEventListener('pointerdown', e => e.stopPropagation());
            el.addEventListener('click', () => select(it.id, true));
        });
    }

    // ---------- selection (click only, sticky) and Follow ----------
    const playsIn = (id, pid) => !!cur.M[id] && cur.M[id].p.some(s => s.kind === 'player' && s.id === pid);
    function paint() {
        if (!cur) return;
        const world = cur.world;
        world.classList.remove('bv-dim');
        world.querySelectorAll('.bv-on,.bv-target,.bv-selected').forEach(e => e.classList.remove('bv-on', 'bv-target', 'bv-selected'));
        if (traced !== null) {
            const run = Object.keys(cur.M).filter(i => playsIn(i, traced));
            world.classList.add('bv-dim');
            run.forEach(i => cur.cardEls[i].classList.add('bv-on'));
            cur.edges.filter(e => run.includes(e.src) && run.includes(e.dst)).forEach(e => e.el.classList.add('bv-on'));
        }
        if (selected) {
            cur.cardEls[selected].classList.add('bv-selected');
            if (traced === null) {
                cur.edges.filter(e => e.src === selected || e.dst === selected).forEach(e => {
                    e.el.classList.add('bv-on');
                    const other = cur.cardEls[e.src === selected ? e.dst : e.src];
                    if (e.kind !== 'tag' && other) other.classList.add('bv-target');
                });
            }
        }
        renderSelbar();
        updateMarkers();
    }
    /**
     * The round's name as the bracket's headers give it ("Frontside final", "Semifinal", …),
     * for the selection bar.
     * @param {string} id - match ID
     * @returns {string}
     */
    function roundName(id) {
        if (getFormat() === 'GROUPS') return Groups.roundName(id);
        const st = cur.st, r = roundOf(id);
        if (getFormat() === 'SE') {
            if (r === st.maxFS) return 'Final';
            if (r === st.maxFS - 1) return 'Bronze final';
            if (r === st.maxFS - 2) return 'Semifinal';
            if (r === st.maxFS - 3) return 'Quarterfinal';
            return 'Round ' + r;
        }
        if (id === 'GRAND-FINAL') return 'Grand final';
        if (id === 'BS-FINAL') return 'Backside final';
        if (sideOf(id) === 'FS') return r === st.maxFS ? 'Frontside final' : 'Frontside round ' + r;
        return 'Backside round ' + r;
    }

    function renderSelbar() {
        const bar = els.selbar;
        if (!selected) { bar.hidden = true; bar.innerHTML = ''; return; }
        bar.hidden = false;
        const v = cur.M[selected], s = v.state;
        const what = v.wo ? 'walkover' : s === 'live' ? (v.match.lane ? `live on lane ${escapeHtml(String(v.match.lane))}` : 'live')
            : s === 'pending' ? 'waiting' : s;
        // Follow buttons toggle in place: the bar never changes under the pointer
        const follow = v.p.filter(sl => sl.kind === 'player').map(sl => {
            const on = traced === sl.id;
            return `<button type="button" data-trace="${escapeHtml(String(sl.id))}"${on ? ' class="bv-on" aria-pressed="true"' : ' aria-pressed="false"'}>Follow ${escapeHtml(sl.name)}</button>`;
        }).join('');
        // Undo only appears when the match can be undone (isMatchUndoable() decides). A read-only
        // tournament says so on every match instead.
        const undo = tournament.readOnly ? '<span class="bv-readonly" title="This tournament is read-only">Read only</span>'
            : isMatchUndoable(selected) ? '<button type="button" data-act="undo" title="Undo this result">Undo match</button>' : '';
        bar.innerHTML = `<span class="bv-sid">${selected}</span><span>${escapeHtml(roundName(selected))} · ${what}</span>` +
            follow + undo +
            // Match Controls is always the rightmost button, just before ×
            `<button type="button" class="bv-primary" data-act="controls">Match Controls</button>` +
            `<button type="button" class="bv-x" data-act="clear" aria-label="Clear selection">×</button>`;
        bar.querySelectorAll('[data-trace]').forEach(b => b.addEventListener('click', () => {
            const sl = v.p.find(x => x.kind === 'player' && String(x.id) === b.dataset.trace);
            if (!sl) return;
            if (traced === sl.id) { traced = null; paint(); followIfNeeded(selected); }
            else trace(sl.id);
        }));
        bar.querySelector('[data-act="clear"]').addEventListener('click', clearSel);
        bar.querySelector('[data-act="controls"]').addEventListener('click', () => showBracketView('controls', selected));
        const undoBtn = bar.querySelector('[data-act="undo"]');
        if (undoBtn) undoBtn.addEventListener('click', () => handleSurgicalUndo(selected));
    }
    function select(id, forceFollow) {
        if (!cur || !cur.cardEls[id]) return;
        traced = null; selected = id; hideMag();
        paint();
        if (forceFollow) {
            const { out, inn } = connected(id);
            const t = fitTarget(boxOf([id, ...out, ...inn]), 64, Math.max(cam.z, 0.6));
            animateTo(t.z >= 0.35 ? t : fitTarget(boxOf([id]), 64, Math.max(cam.z, 0.8)));
        } else followIfNeeded(id);
    }
    function trace(pid) {
        traced = pid;
        paint();
        const run = Object.keys(cur.M).filter(i => playsIn(i, pid));
        if (!run.every(onScreen)) animateTo(fitTarget(boxOf(run), 64, Math.max(cam.z, 0.6)));
    }
    function clearSel() { selected = null; traced = null; paint(); }

    // ---------- input: drag, wheel, pinch, click on empty space ----------
    const pointers = new Map();
    let drag = null, pinch = null, suppressClick = false;
    function bindInput() {
        const viewport = els.viewport;
        viewport.addEventListener('pointerdown', e => {
            if (!isActive() || !cur) return;
            if (e.target.closest('.bv-selbar, .bv-marker')) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            stopAnim();
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            suppressClick = false;
            if (pointers.size === 1) drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, onCard: !!e.target.closest('.bv-card') };
            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                const r = viewport.getBoundingClientRect();
                pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top };
                drag = null;
            }
        });
        viewport.addEventListener('pointermove', e => {
            if (!pointers.has(e.pointerId)) return;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pinch && pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                zoomAt(pinch.mx, pinch.my, (pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d) / cam.z);
                suppressClick = true;
                return;
            }
            if (drag && drag.id === e.pointerId) {
                const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
                if (!drag.moved && Math.hypot(dx, dy) > 4) {
                    drag.moved = true; suppressClick = true; hideMag();
                    viewport.setPointerCapture(e.pointerId);
                    viewport.classList.add('bv-dragging');
                }
                if (drag.moved) { cam.x = drag.cx + dx; cam.y = drag.cy + dy; apply(); }
            }
        });
        const endPointer = e => {
            if (drag && drag.id === e.pointerId && !drag.moved && !drag.onCard && e.type === 'pointerup') clearSel();
            pointers.delete(e.pointerId);
            if (pointers.size < 2) pinch = null;
            if (drag && drag.id === e.pointerId) drag = null;
            viewport.classList.remove('bv-dragging');
        };
        viewport.addEventListener('pointerup', endPointer);
        viewport.addEventListener('pointercancel', endPointer);
        // Scroll zooms at the cursor; a trackpad pinch arrives as ctrl + wheel
        viewport.addEventListener('wheel', e => {
            if (!isActive() || !cur) return;
            e.preventDefault();
            const r = viewport.getBoundingClientRect();
            const k = e.ctrlKey ? 0.01 : (e.deltaMode === 1 ? 0.05 : 0.0018);
            zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * k));
        }, { passive: false });
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape' || !cur || !isActive()) return;
            const page = document.getElementById('tournament');
            if (!page || !page.classList.contains('active')) return;
            hideMag(); clearSel();
        });
    }

    const zoomCentre = f => { if (!cur) return; const { w, h } = vp(); zoomAt(w / 2, h / 2, f); };

    /**
     * Switch the finals between the right edge and the middle, remembered in the global
     * config (config.ui.bracketFinals; missing means 'right'). One setting for both formats.
     * @param {'right'|'middle'} value
     * @returns {void}
     */
    function setFinals(value) {
        if (typeof config === 'undefined') return;
        config.ui = config.ui || {};
        config.ui.bracketFinals = value === 'middle' ? 'middle' : 'right';
        saveGlobalConfig();
        // One setting: keep the Config page's control in step, so saving there doesn't undo this
        const configControl = document.getElementById('bracketFinals');
        if (configControl) configControl.value = config.ui.bracketFinals;
        updateHeader();
        if (isActive()) render();
    }

    /**
     * Fill the bracket page header: tournament name and date, the status line, and the
     * Finals toggle (both formats). Called on every bracket render.
     * @returns {void}
     */
    function updateHeader() {
        const title = document.getElementById('bvTitle');
        if (!title) return;
        const sub = document.getElementById('bvSubtitle');
        const status = document.getElementById('bvStatus');
        const finals = document.getElementById('bvFinals');
        // Results that have arrived from the Chalker over the network and wait to be accepted:
        // counted on the Match Controls tab until accepted there
        const mcCount = document.getElementById('bvResultsWaiting');
        if (mcCount) {
            const all = (typeof matches !== 'undefined' && Array.isArray(matches)) ? matches : [];
            const waiting = (typeof NetworkClient !== 'undefined' && typeof NetworkClient.hasPendingResult === 'function')
                ? all.filter(m => NetworkClient.hasPendingResult(m.id)).length : 0;
            mcCount.textContent = waiting ? `${waiting} result${waiting > 1 ? 's' : ''}` : '';
            mcCount.hidden = !waiting;
        }
        // Console tab only when the Developer Console is enabled in Config
        const consoleTab = document.getElementById('bvConsoleTab');
        if (consoleTab) {
            consoleTab.hidden = !isDeveloperMode();
            if (consoleTab.hidden && consoleTab.getAttribute('aria-pressed') === 'true') showBracketView('bracket');
        }
        if (!tournament) {
            title.textContent = 'No tournament';
            sub.textContent = '';
            status.innerHTML = '';
            if (finals) finals.hidden = true;
            return;
        }
        title.textContent = tournament.name || 'Tournament';
        title.title = title.textContent; // a long name is cut short with …; hover shows it in full
        sub.textContent = tournament.date || '';
        const all = (typeof matches !== 'undefined' && Array.isArray(matches)) ? matches : [];
        const paid = (typeof players !== 'undefined' && Array.isArray(players)) ? players.filter(p => p.paid).length : 0;
        const wo = all.filter(m => m.completed && isWalkoverMatch(m)).length;
        const played = all.filter(m => m.completed).length - wo;
        const live = all.filter(m => getMatchState(m) === 'live').length;
        const ready = all.filter(m => getMatchState(m) === 'ready').length;
        const groupsFormat = getFormat() === 'GROUPS' && !!tournament.bracket;
        status.innerHTML = groupsFormat
            ? `<b>${paid}</b> players · ${Groups.groupList().length} groups · ${all.filter(m => m.side === 'group').length} group matches${tournament.cups ? ` · ${tournament.cups.B ? 'A and B cups' : 'A cup'}` : ''} · ${played} played${wo ? `, ${wo} walkovers` : ''} · <b>${live}</b> live · <b>${ready}</b> ready`
            : tournament.bracket
            ? `<b>${paid}</b> players · ${all.length} matches · ${played} played, ${wo} walkovers · <b>${live}</b> live · <b>${ready}</b> ready`
            : `<b>${paid}</b> players · no bracket yet`;
        // groups and cups: Groups | Cups instead of the finals position (the cups always have it in the middle)
        const gc = document.getElementById('bvGroupsView');
        if (gc) {
            gc.hidden = !groupsFormat;
            const shown = groupsFormat ? gcShown() : 'groups';
            gc.querySelectorAll('button[data-gc]').forEach(b => {
                b.setAttribute('aria-pressed', String(b.dataset.gc === shown));
                if (b.dataset.gc === 'cups') { b.disabled = !tournament.cups; b.title = tournament.cups ? 'The A and B cups' : 'The cups are drawn when every group match is played'; }
            });
        }
        const zoomTools = document.querySelectorAll('#tournament .bv-tools > .bv-btn, #tournament .bv-tools > .bv-zoom');
        zoomTools.forEach(el => { el.hidden = groupsFormat && gcShown() === 'groups'; });
        if (finals) {
            finals.hidden = !isActive() || getFormat() === 'GROUPS'; // both bracket formats: finals on the right or in the middle
            // the setting, not the layout name (single elimination's layouts are 'se' and 'se-middle')
            const v = typeof config !== 'undefined' && config.ui && config.ui.bracketFinals === 'middle' ? 'middle' : 'right';
            finals.querySelectorAll('button[data-finals]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.finals === v)));
        }
    }

    return {
        isActive,
        render,
        deactivate,
        updateHeader,
        setFinals,
        setGroupsView,
        fitAll: () => fitAll(true),
        zoomIn: () => zoomCentre(1.25),
        zoomOut: () => zoomCentre(0.8)
    };
})();
