// bracket-view.js - Bracket view for double elimination
//
// Lays the bracket out from the progression table (getProgressionTable(), read only),
// then draws cards and lines in world coordinates under a camera (fit, zoom, pan).
// Hovering a match magnifies it; clicking selects it and shows its lines; Follow
// traces one player through the bracket. Nothing here changes tournament data.
//
// Single elimination still uses the classic renderer in bracket-rendering.js.
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
    const worldBox = L => ({ x0: -40, y0: -TOP, x1: L.cw + 50, y1: L.ch + BOTTOM }); // room for lines routed round the outside

    // The card never changes. Fit the bracket at its tightest spacing (never above 100%),
    // then grow the row and column gaps into whatever space is left, so it fills the page.
    function geometry(st, variant, vw, vh) {
        const g = (dg, dx) => ({ PITCH: H + GAP_MIN + dg, GX: GX_MIN + dx, CENTER_GAP: CG_MIN + dx, FINALS_GAP: FG_MIN + dx });
        const size = (dg, dx) => { const b = worldBox(layout(st, variant, g(dg, dx))); return { w: b.x1 - b.x0, h: b.y1 - b.y0 }; };
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

    const sourceLabel = (st, id, slot) => {
        const f = (st.feeds[id] || []).find(x => x.slot === slot);
        return f ? (f.kind === 'winner' ? 'Winner ' : 'Loser ') + f.src : 'Awaiting player';
    };

    function cardHTML(st, v, id) {
        const m = v.match, s = v.state;
        const label = v.resultWaiting ? 'Result' : s === 'live' ? 'Live' : s === 'ready' ? 'Ready' : '';
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
        const cls = 'bv-card bv-' + s + (v.wo ? ' bv-walkover' : '') + (sideOf(id) === 'FIN' ? ' bv-final' : '') +
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
        els = {
            viewport, canvas, overlay,
            markers: overlay.querySelector('.bv-markers'),
            mag: overlay.querySelector('.bv-mag'),
            selbar: overlay.querySelector('.bv-selbar')
        };
        bindInput();
        if (typeof ResizeObserver === 'function') {
            let raf = null;
            new ResizeObserver(() => {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => { raf = null; if (isActive() && cur) render(); });
            }).observe(viewport);
        }
        return true;
    }

    const vp = () => ({ w: els.viewport.clientWidth, h: els.viewport.clientHeight });

    /**
     * True when the current tournament is drawn by this view (double elimination with a
     * progression table). Single elimination keeps the classic renderer for now.
     * @returns {boolean}
     */
    function isActive() {
        return !!(typeof tournament !== 'undefined' && tournament && tournament.bracket &&
            getFormat() === 'DE' && DE_MATCH_PROGRESSION[tournament.bracketSize]);
    }

    function finalsVariant() {
        return (typeof config !== 'undefined' && config.ui && config.ui.bracketFinals === 'middle') ? 'middle' : 'right';
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
        const prog = getProgressionTable();
        const size = tournament.bracketSize;
        const variant = finalsVariant();
        const st = structure(prog);
        let { w: vw, h: vh } = vp();
        const hidden = vw < 100 || vh < 100;      // page not shown yet; fit again once it is
        if (hidden) { vw = 1400; vh = 800; }
        const g = geometry(st, variant, vw, vh);
        ({ PITCH, GX, CENTER_GAP, FINALS_GAP } = g);
        const L = layout(st, variant, g);
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
        // every header sits the same distance above the topmost match of its round
        const LABEL_GAP = 26;
        const topOf = (side, r) => Math.min(...st.ids.filter(i => sideOf(i) === side && roundOf(i) === r).map(i => pos[i].y));
        for (let r = 1; r <= st.maxFS; r++) lblMid(r === st.maxFS ? 'Frontside final' : 'Round ' + r, pos[`FS-${r}-1`].x, topOf('FS', r) - LABEL_GAP);
        for (let r = 1; r <= st.maxBS; r++) lblMid(`${place[r]} place`, pos[`BS-${r}-1`].x, topOf('BS', r) - LABEL_GAP);
        // the line from the backside final to the grand final runs behind these
        lblMid('Backside final', pos['BS-FINAL'].x, pos['BS-FINAL'].y - LABEL_GAP, 'bv-col-label bv-finals-label');
        lblMid('3rd place', pos['BS-FINAL'].x, pos['BS-FINAL'].y + H + 8, 'bv-col-label bv-sub-label');
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

    /** Hide the overlay and release the viewport when another renderer takes over. */
    function deactivate() {
        if (!els) return;
        stopAnim(); hideMag();
        selected = null; traced = null; cur = null; bracketKey = null; sizeKey = null;
        els.overlay.hidden = true;
        els.markers.innerHTML = '';
        els.selbar.hidden = true;
        els.viewport.classList.remove('bv-active', 'bv-dragging');
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
        const t = fitTarget(worldBox(cur), PAD, Z_MAX);
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
        if (p.winner) bits.push(`Winner → <b>${p.winner[0]}</b>`); else bits.push('Winner takes 1st');
        if (p.loser) bits.push(`Loser → <b>${p.loser[0]}</b>`);
        else if (id === 'GRAND-FINAL') bits.push('Loser takes 2nd');
        else bits.push('Loser is out');
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
        // Undo only appears when the match can be undone (isMatchUndoable() decides)
        const undo = isMatchUndoable(selected) ? '<button type="button" data-act="undo" title="Undo this result">Undo match</button>' : '';
        bar.innerHTML = `<span class="bv-sid">${selected}</span><span>${escapeHtml(getRoundDescription(v.match))} · ${what}</span>` +
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
        bar.querySelector('[data-act="controls"]').addEventListener('click', () => showMatchCommandCenter());
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
     * config (config.ui.bracketFinals; missing means 'right').
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
     * Finals toggle (shown for double elimination only). Called on every bracket render.
     * @returns {void}
     */
    function updateHeader() {
        const title = document.getElementById('bvTitle');
        if (!title) return;
        const sub = document.getElementById('bvSubtitle');
        const status = document.getElementById('bvStatus');
        const finals = document.getElementById('bvFinals');
        // Console link only when the Developer Console is enabled in Config
        const consoleLink = document.getElementById('bvConsole');
        if (consoleLink) consoleLink.hidden = !isDeveloperMode();
        if (!tournament) {
            title.textContent = 'No tournament';
            sub.textContent = '';
            status.innerHTML = '';
            if (finals) finals.hidden = true;
            return;
        }
        title.textContent = tournament.name || 'Tournament';
        sub.textContent = tournament.date || '';
        const all = (typeof matches !== 'undefined' && Array.isArray(matches)) ? matches : [];
        const paid = (typeof players !== 'undefined' && Array.isArray(players)) ? players.filter(p => p.paid).length : 0;
        const wo = all.filter(m => m.completed && isWalkoverMatch(m)).length;
        const played = all.filter(m => m.completed).length - wo;
        const live = all.filter(m => getMatchState(m) === 'live').length;
        const ready = all.filter(m => getMatchState(m) === 'ready').length;
        status.innerHTML = tournament.bracket
            ? `<b>${paid}</b> players · ${all.length} matches · ${played} played, ${wo} walkovers · <b>${live}</b> live · <b>${ready}</b> ready`
            : `<b>${paid}</b> players · no bracket yet`;
        if (finals) {
            finals.hidden = !isActive();
            const v = finalsVariant();
            finals.querySelectorAll('button[data-finals]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.finals === v)));
        }
    }

    return {
        isActive,
        render,
        deactivate,
        updateHeader,
        setFinals,
        fitAll: () => fitAll(true),
        zoomIn: () => zoomCentre(1.25),
        zoomOut: () => zoomCentre(0.8)
    };
})();
