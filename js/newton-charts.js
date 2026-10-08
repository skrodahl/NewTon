// newton-charts.js — Player form charts for Analytics → Players
//
// Draws a player's progression over the tournaments in the Lens, and compares players,
// as plain SVG: six measures (Position, Points, Finishes, Average, Matches, Highlights),
// overview cards with sparklines, a Last 10 strip, and a full-screen view. Read-only:
// it draws the figures it is given (NewtonHistory builds them from the same per-player
// rows as the Leaderboard) and never changes data. Styles: css/analytics-page.css (pc-*).

const NewtonCharts = (() => {

    /** The measures, in card order. */
    const METRICS = [
        { id: 'position', label: 'Position', desc: 'Place in the standings after each tournament, by points so far. First is at the top; the shaded zone is the top 16.' },
        { id: 'points', label: 'Points', desc: 'Points each tournament (bars) and the form line: the average of the last 5 played. With several players, the form lines only.' },
        { id: 'finish', label: 'Finishes', desc: 'Where each tournament ended, on bands: a finish in 9th–12th is “Top 16”. Hollow marks on the axis are tournaments not played.' },
        { id: 'average', label: 'Average', desc: 'Three-dart average each tournament, with the spread from the worst to the best match. Only Chalker matches have the darts to work it out.' },
        { id: 'matches', label: 'Matches', desc: 'Matches won (dark) and lost (light) each tournament. With several players: win rate over each player’s last 5 tournaments.' },
        { id: 'highlights', label: 'Highlights', desc: '180s, high outs at their value, and short legs by darts (fewer darts drawn higher), on one time axis.' }
    ];
    /** Measures that have a line for the field (the median of everyone who played). */
    const FIELD_METRICS = ['points', 'average'];
    /** Series colours: the first player is ink, then the accent and four more. */
    const COLORS = ['#111827', '#ff6b35', '#0f766e', '#7c3aed', '#2563eb', '#b45309'];
    /** The same colours, light enough to read on the dark tooltip. */
    const TIP_COLORS = ['#ffffff', '#fdba74', '#5eead4', '#c4b5fd', '#93c5fd', '#fcd34d'];
    const MAX_PLAYERS = 6;
    const TIERS = ['', 'Winner', 'Final', 'Top 4', 'Top 8', 'Top 16', '17th+'];
    const TIERS_SHORT = ['', '1st', '2nd', 'T4', 'T8', 'T16', '17+'];

    /** Shared between renders, for the visit: the chosen measure and the field switch. */
    const _view = { metric: 'position', field: true, extra: [], player: null };

    /** Live charts to redraw when the window is resized. */
    let _redraws = [];

    const NS = 'http://www.w3.org/2000/svg';

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }
    /** A path through points, lifting the pen at null. */
    function pathOf(pts) {
        let d = '', pen = false;
        pts.forEach(p => {
            if (!p) { pen = false; return; }
            d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
            pen = true;
        });
        return d;
    }
    /** A stepped path (standings change at each tournament), skipping nulls. */
    function stepOf(pts) {
        let d = '', last = null;
        pts.forEach(p => {
            if (!p) return;
            d += last ? 'H' + p[0].toFixed(1) + 'V' + p[1].toFixed(1) : 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
            last = p;
        });
        return d;
    }
    const ordinal = n => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
    const fmtDay = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    /** Placement bands: 1 Winner, 2 Final, 3 Top 4, 4 Top 8, 5 Top 16, 6 the rest. */
    const tier = p => p === 1 ? 1 : p === 2 ? 2 : p <= 4 ? 3 : p <= 8 ? 4 : p <= 16 ? 5 : 6;
    const placeShort = p => p === 1 ? '1st' : p === 2 ? '2nd' : p === 3 ? '3rd' : p === 4 ? '4th' : p === 5 ? '5–6' : p === 7 ? '7–8' : p === 9 ? '9–12' : p === 13 ? '13–16' : p === 17 ? '17–24' : p === 25 ? '25–32' : p === 33 ? '33–48' : ordinal(p);
    const placeLong = p => typeof formatRanking === 'function' ? formatRanking(p) : placeShort(p);
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

    /**
     * One player's values per tournament for a measure (null where not played or no data).
     * @param {object} data - from NewtonHistory (see _buildChartData)
     * @param {string} name
     * @param {string} metric
     */
    function series(data, name, metric) {
        const p = data.players[name];
        if (!p) return data.tournaments.map(() => null);
        if (metric === 'position') return p.position.slice();
        const roll = [];
        return p.entries.map(e => {
            if (!e) return null;
            if (metric === 'points') {
                roll.push(e.points); if (roll.length > 5) roll.shift();
                return { v: e.points, form: mean(roll) };
            }
            if (metric === 'finish') return e.place || null;
            if (metric === 'average') return e.avg == null ? null : { v: e.avg, lo: e.avgLo, hi: e.avgHi };
            if (metric === 'matches') return { w: e.matchesWon, l: e.matchesLost };
            return e; // highlights
        });
    }
    /** The field (the median of everyone who played), per tournament. */
    function fieldSeries(data, metric) {
        if (metric === 'points') {
            const roll = [];
            return data.field.points.map(v => {
                if (v == null) return null;
                roll.push(v); if (roll.length > 5) roll.shift();
                return { v, form: mean(roll) };
            });
        }
        if (metric === 'average') return data.field.average.map(v => v == null ? null : { v });
        return null;
    }

    // -------------------------------------------------------------------------
    // The chart
    // -------------------------------------------------------------------------

    /**
     * Draw one measure for up to six players into a box (which holds a .pc-tip).
     * @param {HTMLElement} box
     * @param {object} data
     * @param {string} metric
     * @param {string[]} names - the first is the main player
     * @param {boolean} field - draw the field where the measure has one
     * @param {{w:number, h:number, narrow:boolean}} size
     * @returns {string} legend HTML
     */
    function draw(box, data, metric, names, field, size) {
        box.querySelectorAll('svg').forEach(s => s.remove());
        let tip = box.querySelector('.pc-tip');
        if (!tip) { tip = document.createElement('div'); tip.className = 'pc-tip'; tip.hidden = true; box.appendChild(tip); }
        tip.hidden = true;
        const T = data.tournaments;
        if (!T.length) return '';
        const { w: W, h: H, narrow } = size;
        const M = { l: narrow ? 36 : 48, r: narrow ? 8 : 16, t: 14, b: 34 };
        const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': metric });
        box.insertBefore(svg, tip);
        const iw = W - M.l - M.r, ih = H - M.t - M.b, n = T.length, step = iw / n;
        const xc = i => M.l + step * (i + 0.5);
        const one = names.length === 1;
        const col = k => COLORS[k % COLORS.length];
        const wid = k => k === 0 ? 2.6 : 2.2;
        const off = k => names.length < 2 ? 0 : (k - (names.length - 1) / 2) * Math.min(step * 0.7 / names.length, 9);
        const legend = names.map((nm, k) => `<span><i style="border-color:${col(k)}"></i>${esc(nm)}</span>`);
        const fs = field && FIELD_METRICS.includes(metric) ? fieldSeries(data, metric) : null;
        if (fs) legend.push('<span><i class="pc-dash"></i>The field (median)</span>');
        const rows = T.map(() => []);
        const tipLine = (k, text) => `<span style="color:${TIP_COLORS[k % TIP_COLORS.length]}">${text}</span>`;

        // x axis: a dot per tournament (hollow when the player missed it), month labels
        let lastMonth = -1, lastLabelX = -99;
        const main = data.players[names[0]];
        T.forEach((t, i) => {
            if (one && metric !== 'position' && main) {
                const played = !!main.entries[i];
                el('circle', { cx: xc(i), cy: H - M.b + 7, r: 2.6, fill: played ? '#374151' : '#fff', stroke: played ? 'none' : '#9ca3af', 'stroke-width': 1.2 }, svg);
            } else {
                el('line', { x1: xc(i), x2: xc(i), y1: H - M.b + 3, y2: H - M.b + 7, stroke: '#d6d3d1' }, svg);
            }
            const m = t.date.getMonth() + 12 * t.date.getFullYear();
            if (m !== lastMonth && xc(i) - lastLabelX > (narrow ? 40 : 34)) {
                lastMonth = m; lastLabelX = xc(i);
                el('text', { x: xc(i), y: H - 6, 'text-anchor': 'middle' }, svg).textContent =
                    t.date.toLocaleDateString('en-GB', { month: 'short' }) + (t.date.getMonth() === 0 || i === 0 ? ' ’' + String(t.date.getFullYear()).slice(2) : '');
            }
        });
        const grid = (y, label, strong) => {
            el('line', { x1: M.l, x2: W - M.r, y1: y, y2: y, stroke: strong ? '#d6d3d1' : '#e2e0dc' }, svg);
            if (label != null) el('text', { x: M.l - 8, y: y + 4, 'text-anchor': 'end', class: 'pc-ylab' }, svg).textContent = label;
        };
        const line = (pts, c, w, dash) => el('path', { d: pathOf(pts), fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-dasharray': dash || '' }, svg);
        const ss = names.map(nm => series(data, nm, metric));

        if (metric === 'position') {
            const N = Math.max(2, ...data.ranked);
            const y = r => M.t + (r - 1) / (N - 1) * ih;
            const top = Math.min(16, N);
            el('rect', { x: M.l, y: y(1) - 4, width: iw, height: y(top) - y(1) + 8, fill: '#f3f1ed' }, svg);
            [1, 4, 8, 16, 24, 32, 48].filter(r => r <= N).forEach(r => grid(y(r), r === 1 ? '1st' : r, r === 16));
            if (N > 16) el('text', { x: M.l + 8, y: y(16) - 6 }, svg).textContent = 'Top 16';
            ss.slice().reverse().forEach((s, rk) => {
                const k = ss.length - 1 - rk;
                const pts = s.map((r, i) => r ? [xc(i), y(r)] : null);
                el('path', { d: stepOf(pts), fill: 'none', stroke: col(k), 'stroke-width': wid(k), 'stroke-linejoin': 'round' }, svg);
                const last = pts.filter(Boolean).pop();
                if (last) el('circle', { cx: last[0], cy: last[1], r: 4, fill: col(k) }, svg);
            });
            T.forEach((t, i) => names.forEach((nm, k) => rows[i].push(tipLine(k, `${esc(nm)}: ${ss[k][i] ? ordinal(ss[k][i]) + ' of ' + data.ranked[i] : '—'}`))));
        }

        if (metric === 'points') {
            const vals = ss.flat().filter(Boolean).map(v => one ? v.v : v.form).concat(fs ? fs.filter(Boolean).map(v => v.form) : []);
            const max = Math.ceil(Math.max(5, ...vals) / 5) * 5;
            const stepY = max > 40 ? 10 : 5;
            const y = v => M.t + ih - v / max * ih;
            for (let v = 0; v <= max; v += stepY) grid(y(v), v, v === 0);
            if (one) {
                const bw = Math.max(3, Math.min(28, step * 0.55));
                ss[0].forEach((v, i) => { if (v) el('rect', { x: xc(i) - bw / 2, y: y(v.v), width: bw, height: y(0) - y(v.v), rx: 2, fill: '#d6d3d1' }, svg); });
                legend.splice(1, 0, '<span><i class="pc-box" style="background:#d6d3d1"></i>Points that night</span>');
            }
            if (fs) line(fs.map((v, i) => v ? [xc(i), y(v.form)] : null).filter(Boolean), '#6b7280', 2, '5 4');
            ss.slice().reverse().forEach((s, rk) => {
                const k = ss.length - 1 - rk;
                line(s.map((v, i) => v ? [xc(i), y(v.form)] : null).filter(Boolean), col(k), wid(k));
            });
            T.forEach((t, i) => {
                names.forEach((nm, k) => { const v = ss[k][i]; rows[i].push(tipLine(k, `${esc(nm)}: ${v ? v.v + ' points · form ' + v.form.toFixed(1) : 'not played'}`)); });
                if (fs && fs[i]) rows[i].push(`The field: form ${fs[i].form.toFixed(1)}`);
            });
        }

        if (metric === 'finish') {
            // six equal bands that fill the plot exactly (a tier's mark sits in the middle of its band),
            // so nothing spills over the players above or the axis below, however tall the chart
            const y = tr => M.t + (tr - 0.5) / 6 * ih;
            for (let tr = 1; tr <= 6; tr++) {
                if (tr % 2) el('rect', { x: M.l, y: y(tr) - ih / 12, width: iw, height: ih / 6, fill: '#f3f1ed' }, svg);
                el('text', { x: M.l - 8, y: y(tr) + 4, 'text-anchor': 'end' }, svg).textContent = narrow ? TIERS_SHORT[tr] : TIERS[tr];
            }
            // a line through each player's finishes, then the marks on top (the first player uppermost)
            ss.slice().reverse().forEach((s, rk) => {
                const k = ss.length - 1 - rk;
                const pts = s.map((p, i) => p ? [xc(i) + off(k), y(tier(p))] : null).filter(Boolean);
                line(pts, col(k), wid(k));
                pts.forEach(pt => el('circle', { cx: pt[0], cy: pt[1], r: one ? (narrow ? 3.5 : 5.5) : (narrow ? 2.8 : 4.2), fill: col(k) }, svg));
            });
            T.forEach((t, i) => names.forEach((nm, k) => rows[i].push(tipLine(k, `${esc(nm)}: ${ss[k][i] ? esc(placeLong(ss[k][i])) : 'not played'}`))));
        }

        if (metric === 'average') {
            const vals = ss.flat().filter(Boolean).flatMap(v => one ? [v.lo, v.hi] : [v.v]).concat(fs ? fs.filter(Boolean).map(v => v.v) : []);
            if (!vals.length) {
                el('text', { x: M.l + iw / 2, y: M.t + ih / 2, 'text-anchor': 'middle', class: 'pc-empty' }, svg).textContent = 'No Chalker matches in these tournaments';
            } else {
                const lo = Math.floor((Math.min(...vals) - 1) / 10) * 10, hi = Math.ceil((Math.max(...vals) + 1) / 10) * 10;
                const y = v => M.t + ih - (v - lo) / (hi - lo) * ih;
                for (let v = lo; v <= hi; v += 10) grid(y(v), v, false);
                // tournaments without Chalker matches: shaded, no average
                T.forEach((t, i) => { if (!t.chalker) el('rect', { x: M.l + step * i, y: M.t, width: step + 0.5, height: ih, fill: '#f3f1ed' }, svg); });
                if (one) {
                    const band = ss[0].map((v, i) => v && v.lo != null ? [xc(i), y(v.hi), y(v.lo)] : null).filter(Boolean);
                    if (band.length > 1) el('path', { d: 'M' + band.map(b => b[0] + ' ' + b[1]).join('L') + 'L' + band.slice().reverse().map(b => b[0] + ' ' + b[2]).join('L') + 'Z', fill: '#111827', opacity: 0.08 }, svg);
                    legend.splice(1, 0, '<span><i class="pc-box" style="background:rgba(17,24,39,.12)"></i>Worst to best match</span>');
                }
                if (fs) line(fs.map((v, i) => v ? [xc(i), y(v.v)] : null).filter(Boolean), '#6b7280', 2, '5 4');
                ss.slice().reverse().forEach((s, rk) => {
                    const k = ss.length - 1 - rk;
                    const pts = s.map((v, i) => v ? [xc(i), y(v.v)] : null).filter(Boolean);
                    line(pts, col(k), wid(k));
                    pts.forEach(p => el('circle', { cx: p[0], cy: p[1], r: one ? 3 : 2.4, fill: col(k) }, svg));
                });
            }
            T.forEach((t, i) => {
                names.forEach((nm, k) => { const v = ss[k][i]; rows[i].push(tipLine(k, `${esc(nm)}: ${v ? v.v.toFixed(1) + (one && v.lo != null ? ' (' + v.lo.toFixed(1) + '–' + v.hi.toFixed(1) + ')' : '') : t.chalker ? 'not played' : 'no Chalker matches'}`)); });
                if (fs && fs[i]) rows[i].push(`The field: ${fs[i].v.toFixed(1)}`);
            });
        }

        if (metric === 'matches') {
            if (one) {
                const max = Math.max(4, ...ss[0].filter(Boolean).map(v => v.w + v.l));
                const y = v => M.t + ih - v / max * ih;
                for (let v = 0; v <= max; v += max > 8 ? 4 : 2) grid(y(v), v, v === 0);
                const bw = Math.max(3, Math.min(28, step * 0.55));
                ss[0].forEach((v, i) => {
                    if (!v) return;
                    el('rect', { x: xc(i) - bw / 2, y: y(v.w), width: bw, height: y(0) - y(v.w), fill: '#111827' }, svg);
                    el('rect', { x: xc(i) - bw / 2, y: y(v.w + v.l), width: bw, height: y(v.w) - y(v.w + v.l), fill: '#d6d3d1' }, svg);
                });
                legend[0] = '<span><i class="pc-box" style="background:#111827"></i>Won</span><span><i class="pc-box" style="background:#d6d3d1"></i>Lost</span>';
            } else {
                const y = v => M.t + ih - v * ih;
                [0, .25, .5, .75, 1].forEach(v => grid(y(v), Math.round(v * 100) + '%', v === .5));
                ss.slice().reverse().forEach((s, rk) => {
                    const k = ss.length - 1 - rk, win = [];
                    line(s.map((v, i) => {
                        if (!v) return null;
                        win.push(v); if (win.length > 5) win.shift();
                        const w = win.reduce((a, b) => a + b.w, 0), l = win.reduce((a, b) => a + b.l, 0);
                        return w + l ? [xc(i), y(w / (w + l))] : null;
                    }).filter(Boolean), col(k), wid(k));
                });
            }
            T.forEach((t, i) => names.forEach((nm, k) => { const v = ss[k][i]; rows[i].push(tipLine(k, `${esc(nm)}: ${v ? v.w + '–' + v.l + (v.w + v.l ? ' · ' + Math.round(100 * v.w / (v.w + v.l)) + '%' : '') : 'not played'}`)); }));
        }

        if (metric === 'highlights') {
            const gap = 14, sh = (ih - 2 * gap) / 3;
            const strip = (k, label) => {
                const y0 = M.t + k * (sh + gap);
                el('rect', { x: M.l, y: y0, width: iw, height: sh, fill: k % 2 ? '#ffffff' : '#f3f1ed' }, svg);
                el('text', { x: M.l + 8, y: y0 + 14, class: 'pc-strip' }, svg).textContent = label;
                return y0;
            };
            const y1 = strip(0, '180s'), y2 = strip(1, 'High outs'), y3 = strip(2, 'Short legs (darts)');
            const max180 = Math.max(3, ...ss.flat().filter(Boolean).map(e => e.oneEighties || 0));
            const yc = v => y1 + sh - v / max180 * (sh - 18);
            const yo = v => y2 + sh - 4 - (v - 100) / 70 * (sh - 22);
            const yl = v => y3 + 18 + (Math.min(Math.max(v, 9), 21) - 9) / 12 * (sh - 24);
            [100, 135, 170].forEach(v => el('text', { x: M.l - 8, y: yo(v) + 4, 'text-anchor': 'end', class: 'pc-ylab' }, svg).textContent = v);
            [9, 15, 21].forEach(v => el('text', { x: M.l - 8, y: yl(v) + 4, 'text-anchor': 'end', class: 'pc-ylab' }, svg).textContent = v);
            [1, max180].forEach(v => el('text', { x: M.l - 8, y: yc(v) + 4, 'text-anchor': 'end', class: 'pc-ylab' }, svg).textContent = v);
            const bw = Math.max(2.5, Math.min(step * 0.5, step * 0.8 / names.length, 20));
            ss.forEach((s, k) => s.forEach((e, i) => {
                if (!e) return;
                const x = xc(i) + off(k);
                if (e.oneEighties) el('rect', { x: x - bw / 2, y: yc(e.oneEighties), width: bw, height: y1 + sh - yc(e.oneEighties), rx: 1.5, fill: col(k) }, svg);
                (e.highOuts || []).forEach(v => el('circle', { cx: x, cy: yo(v), r: one ? 4 : 3.4, fill: col(k) }, svg));
                (e.shortLegs || []).forEach(v => el('rect', { x: x - 3.5, y: yl(v) - 3.5, width: 7, height: 7, transform: `rotate(45 ${x} ${yl(v)})`, fill: col(k) }, svg));
            }));
            T.forEach((t, i) => names.forEach((nm, k) => {
                const e = ss[k][i];
                rows[i].push(tipLine(k, `${esc(nm)}: ${e ? `180s ${e.oneEighties || '—'} · outs ${(e.highOuts || []).join(', ') || '—'} · legs ${(e.shortLegs || []).join(', ') || '—'}` : 'not played'}`));
            }));
        }

        // hover or tap a column for that tournament
        const hl = el('rect', { x: 0, y: M.t, width: step, height: ih, fill: '#111827', 'fill-opacity': 0.05, opacity: 0, 'pointer-events': 'none' }, svg);
        T.forEach((t, i) => {
            const r = el('rect', { x: M.l + step * i, y: M.t, width: step, height: ih + 14, fill: 'transparent', class: 'pc-hit' }, svg);
            const show = () => {
                const b = svg.getBoundingClientRect(), bb = box.getBoundingClientRect();
                tip.innerHTML = `<b>${esc(t.name)}</b>${fmtDay(t.date)} · ${t.players} players<br>` + rows[i].join('<br>');
                tip.hidden = false;
                const x = (xc(i) / W) * b.width + (b.left - bb.left);
                const half = tip.offsetWidth / 2 + 4;
                tip.style.left = Math.min(Math.max(x, half), bb.width - half) + 'px';
                tip.style.top = ((M.t / H) * b.height + (b.top - bb.top)) + 'px';
                hl.setAttribute('x', M.l + step * i);
                hl.setAttribute('opacity', 1);
            };
            r.addEventListener('mouseenter', show);
            r.addEventListener('click', show);
        });
        svg.addEventListener('mouseleave', () => { tip.hidden = true; hl.setAttribute('opacity', 0); });
        return legend.join('');
    }

    // -------------------------------------------------------------------------
    // Cards: one per measure, with a sparkline and a one-line verdict
    // -------------------------------------------------------------------------

    function summary(data, name, metric) {
        const p = data.players[name];
        const played = p ? p.entries.filter(Boolean) : [];
        const T = data.tournaments;
        if (!played.length) return { v: '—', t: 'No tournaments', cls: '', spark: [] };
        if (metric === 'position') {
            const ranks = p.position.filter(Boolean);
            const now = ranks[ranks.length - 1];
            const back = Math.min(10, ranks.length - 1);
            const d = back > 0 ? ranks[ranks.length - 1 - back] - now : 0;
            const span = back === 1 ? 'since last time' : 'in ' + back;
            return {
                v: ordinal(now) + `<small>of ${data.ranked[T.length - 1]}</small>`,
                t: back === 0 ? 'First tournament' : d > 0 ? `▲ ${d} place${d === 1 ? '' : 's'} ${span}` : d < 0 ? `▼ ${-d} place${d === -1 ? '' : 's'} ${span}` : 'Unchanged ' + span,
                cls: d > 0 ? 'up' : d < 0 ? 'down' : '',
                spark: p.position.map(r => r ? -r : null)
            };
        }
        if (metric === 'points') {
            const pts = played.map(e => e.points);
            const form = mean(pts.slice(-5)), season = mean(pts);
            return { v: form.toFixed(1) + '<small>last 5</small>', t: `${form >= season ? '▲' : '▼'} average ${season.toFixed(1)}`, cls: form >= season ? 'up' : 'down', spark: p.entries.map(e => e ? e.points : null) };
        }
        if (metric === 'finish') {
            const places = played.map(e => e.place).filter(Boolean);
            const last = places.slice(-10);
            const wins = places.filter(x => x === 1).length;
            return {
                v: last.filter(x => x <= 4).length + `<small>top 4 in last ${last.length}</small>`,
                t: places.length ? `Best ${placeShort(Math.min(...places))} · ${wins} win${wins === 1 ? '' : 's'}` : '—',
                cls: '', spark: p.entries.map(e => e && e.place ? -tier(e.place) : null)
            };
        }
        if (metric === 'average') {
            const withAvg = p.entries.map((e, i) => e && e.avg != null ? { v: e.avg, i } : null).filter(Boolean);
            if (!withAvg.length) return { v: '—', t: 'No Chalker matches', cls: '', spark: [] };
            const k = Math.min(3, withAvg.length);
            const first = mean(withAvg.slice(0, k).map(x => x.v)), last = mean(withAvg.slice(-k).map(x => x.v));
            const since = T[withAvg[0].i].date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            return {
                v: last.toFixed(1) + `<small>last ${k}</small>`,
                t: withAvg.length < 2 ? 'One tournament so far' : `${last >= first ? '▲' : '▼'} ${Math.abs(last - first).toFixed(1)} since ${since}`,
                cls: withAvg.length < 2 ? '' : last >= first ? 'up' : 'down',
                spark: p.entries.map(e => e && e.avg != null ? e.avg : null)
            };
        }
        if (metric === 'matches') {
            const rate = list => { const w = list.reduce((s, e) => s + e.matchesWon, 0), l = list.reduce((s, e) => s + e.matchesLost, 0); return w + l ? Math.round(100 * w / (w + l)) : 0; };
            const last = played.slice(-10), r10 = rate(last), all = rate(played);
            return { v: r10 + `%<small>last ${last.length}</small>`, t: `${r10 >= all ? '▲' : '▼'} overall ${all}%`, cls: r10 >= all ? 'up' : 'down', spark: p.entries.map(e => e && (e.matchesWon + e.matchesLost) ? e.matchesWon / (e.matchesWon + e.matchesLost) : null) };
        }
        const o = played.reduce((s, e) => s + (e.oneEighties || 0), 0);
        const ho = played.flatMap(e => e.highOuts || []), sl = played.flatMap(e => e.shortLegs || []);
        return {
            v: o + '<small>180s</small>',
            t: [ho.length ? 'best out ' + Math.max(...ho) : 'no high outs', sl.length ? Math.min(...sl) + '-dart leg' : ''].filter(Boolean).join(' · '),
            cls: '', spark: p.entries.map(e => e ? (e.oneEighties || 0) + (e.highOuts || []).length + (e.shortLegs || []).length : null)
        };
    }

    function sparkline(svg, vals) {
        const W = 120, H = 34, pad = 3;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        const nums = vals.filter(v => v != null);
        if (nums.length < 2) return;
        const lo = Math.min(...nums), hi = Math.max(...nums), span = hi - lo || 1;
        const pts = vals.map((v, i) => v == null ? null : [pad + i * (W - 2 * pad) / Math.max(1, vals.length - 1), H - pad - (v - lo) / span * (H - 2 * pad)]).filter(Boolean);
        el('path', { d: pathOf(pts), fill: 'none', stroke: '#111827', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }, svg);
        const last = pts[pts.length - 1];
        el('circle', { cx: last[0], cy: last[1], r: 2.4, fill: '#ff6b35' }, svg);
    }

    // -------------------------------------------------------------------------
    // The picker: the players (chips), + Compare with…, and The field
    // -------------------------------------------------------------------------

    /**
     * @param {HTMLElement} host
     * @param {object} o - { names, removable(k), options, onAdd(name), onRemove(name), field, fieldOn, onField(), addLabel }
     */
    function picker(host, o) {
        host.innerHTML = '';
        o.names.forEach((nm, k) => {
            const chip = document.createElement('span');
            chip.className = 'pc-chip';
            chip.innerHTML = `<i style="background:${COLORS[k % COLORS.length]}"></i>${esc(nm)}`;
            if (o.removable(k)) {
                const x = document.createElement('button');
                x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove ' + nm);
                x.addEventListener('click', () => o.onRemove(nm));
                chip.appendChild(x);
            } else chip.classList.add('pc-fixed');
            host.appendChild(chip);
        });
        const add = document.createElement('select');
        add.className = 'pc-add';
        add.setAttribute('aria-label', o.addLabel);
        const full = o.names.length >= MAX_PLAYERS;
        add.innerHTML = `<option value="">${full ? 'Six at most' : esc(o.addLabel) + '…'}</option>` +
            o.options.filter(nm => !o.names.includes(nm)).map((nm, i) => `<option value="${i}">${esc(nm)}</option>`).join('');
        const choices = o.options.filter(nm => !o.names.includes(nm));
        add.disabled = full || !choices.length;
        add.addEventListener('change', () => { if (add.value !== '') o.onAdd(choices[+add.value]); });
        host.appendChild(add);
        const f = document.createElement('button');
        f.type = 'button'; f.className = 'pc-field'; f.textContent = 'The field';
        f.setAttribute('aria-pressed', o.fieldOn);
        f.disabled = !o.field;
        f.title = o.field ? 'The median of everyone who played' : 'The field has a line for Points and Average';
        f.addEventListener('click', o.onField);
        host.appendChild(f);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /** Chart size for a box: its width, and a height that suits the measure. */
    function sizeFor(box, metric, fullHeight) {
        const w = Math.max(300, Math.floor(box.clientWidth));
        const narrow = w < 600;
        const h = fullHeight ? Math.max(260, Math.floor(fullHeight)) : (metric === 'highlights' ? (narrow ? 330 : 360) : (narrow ? 240 : 300));
        return { w, h, narrow };
    }

    function metricButtons(host, current, onPick) {
        host.innerHTML = METRICS.map(m => `<button type="button" aria-pressed="${m.id === current}" data-m="${m.id}">${m.label}</button>`).join('');
        host.querySelectorAll('button').forEach(b => b.addEventListener('click', () => onPick(b.dataset.m)));
    }

    /**
     * One player's form: the Last 10 strip, the six cards, the chart (with others to
     * compare against), and Full screen.
     * @param {HTMLElement} container
     * @param {object} opts - { data, player, options: names to compare with, ranked }
     */
    function renderForm(container, opts) {
        const { data, player } = opts;
        if (_view.player !== player) { _view.player = player; _view.extra = []; }
        _view.extra = _view.extra.filter(nm => nm !== player && data.players[nm]);
        const p = data.players[player];

        const last = data.tournaments.slice(-10).map((t, j) => {
            const i = data.tournaments.length - Math.min(10, data.tournaments.length) + j;
            const e = p && p.entries[i];
            const label = `${esc(t.name)} · ${fmtDay(t.date)}`;
            if (!e || !e.place) return `<span class="pc-res pc-dnp" title="${label} · ${e ? 'no placement' : 'not played'}">–</span>`;
            const tr = tier(e.place);
            return `<span class="pc-res${tr === 1 ? ' pc-t1' : tr === 2 ? ' pc-t2' : tr <= 4 ? ' pc-t4' : ''}" title="${label}">${placeShort(e.place)}</span>`;
        }).join('');

        container.innerHTML =
            `<div class="pc-last"><span class="pc-lbl">Last ${Math.min(10, data.tournaments.length)}</span><div class="pc-results">${last}</div><span class="pc-note">newest on the right</span></div>` +
            '<div class="pc-cards"></div>' +
            '<div class="pc-head"><div><h4 class="pc-title"></h4><p class="pc-desc"></p></div>' +
            '<div class="pc-tools"><div class="pc-legend"></div><button type="button" class="pc-fullbtn">Full screen</button></div></div>' +
            '<div class="pc-pick"></div>' +
            '<div class="pc-chart"></div>' +
            '<p class="pc-foot">Full screen shows the same players with more room. Compare up to six players.</p>';

        const cards = container.querySelector('.pc-cards');
        const box = container.querySelector('.pc-chart');
        const names = () => [player].concat(_view.extra);

        const redraw = () => {
            cards.innerHTML = '';
            METRICS.forEach(m => {
                const s = summary(data, player, m.id);
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'pc-card'; b.setAttribute('aria-pressed', m.id === _view.metric);
                b.innerHTML = `<span class="pc-k">${m.label}</span><span class="pc-v">${s.v}</span><span class="pc-t ${s.cls}">${s.t}</span>`;
                const sv = el('svg', {}); b.appendChild(sv); sparkline(sv, s.spark);
                b.addEventListener('click', () => { _view.metric = m.id; redraw(); });
                cards.appendChild(b);
            });
            const m = METRICS.find(x => x.id === _view.metric);
            container.querySelector('.pc-title').textContent = m.label;
            container.querySelector('.pc-desc').textContent = m.desc;
            picker(container.querySelector('.pc-pick'), {
                names: names(), removable: k => k > 0, options: opts.options, addLabel: '+ Compare with',
                onAdd: nm => { _view.extra.push(nm); redraw(); },
                onRemove: nm => { _view.extra = _view.extra.filter(x => x !== nm); redraw(); },
                field: FIELD_METRICS.includes(_view.metric), fieldOn: _view.field, onField: () => { _view.field = !_view.field; redraw(); }
            });
            container.querySelector('.pc-legend').innerHTML = draw(box, data, _view.metric, names(), _view.field, sizeFor(box, _view.metric));
        };
        container.querySelector('.pc-fullbtn').addEventListener('click', () => openFull({
            data, options: opts.options,
            names, removable: k => k > 0,
            onAdd: nm => _view.extra.push(nm),
            onRemove: nm => { _view.extra = _view.extra.filter(x => x !== nm); },
            onClose: redraw
        }));
        _track(container, redraw);
        redraw();
    }

    /**
     * Several players compared: measure buttons, the ticked players as chips, the chart.
     * @param {HTMLElement} container
     * @param {object} opts - { data, getNames() (the players shown, read on every redraw, since
     *   adding or removing one changes the selection the caller owns), options, onAdd(name),
     *   onRemove(name), note }
     */
    function renderCompare(container, opts) {
        const { data } = opts;
        container.innerHTML =
            '<div class="pc-seg" role="group" aria-label="Measure"></div>' +
            '<p class="pc-desc pc-desc-c"></p>' +
            '<div class="pc-pick"></div>' +
            (opts.note ? `<p class="pc-note pc-capnote">${esc(opts.note)}</p>` : '') +
            '<div class="pc-head pc-head-c"><div class="pc-legend"></div><button type="button" class="pc-fullbtn">Full screen</button></div>' +
            '<div class="pc-chart"></div>';
        const box = container.querySelector('.pc-chart');
        const redraw = () => {
            metricButtons(container.querySelector('.pc-seg'), _view.metric, id => { _view.metric = id; redraw(); });
            container.querySelector('.pc-desc').textContent = METRICS.find(x => x.id === _view.metric).desc;
            picker(container.querySelector('.pc-pick'), {
                names: opts.getNames(), removable: () => opts.getNames().length > 1, options: opts.options, addLabel: '+ Add player',
                onAdd: opts.onAdd, onRemove: opts.onRemove,
                field: FIELD_METRICS.includes(_view.metric), fieldOn: _view.field, onField: () => { _view.field = !_view.field; redraw(); }
            });
            container.querySelector('.pc-legend').innerHTML = draw(box, data, _view.metric, opts.getNames(), _view.field, sizeFor(box, _view.metric));
        };
        container.querySelector('.pc-fullbtn').addEventListener('click', () => openFull({
            data, options: opts.options,
            names: opts.getNames, removable: () => opts.getNames().length > 1,
            onAdd: opts.onAdd, onRemove: opts.onRemove, onClose: () => {}
        }));
        _track(container, redraw);
        redraw();
    }

    // -------------------------------------------------------------------------
    // Full screen
    // -------------------------------------------------------------------------

    let _full = null;

    /**
     * The chart on the whole screen: measure buttons, the players, and the chart.
     * Changes go back to the view it was opened from. Esc or × closes it.
     * @param {object} o - { data, options, names(), removable(k), onAdd(name), onRemove(name), onClose() }
     */
    function openFull(o) {
        closeFull();
        const d = document.createElement('div');
        d.className = 'pc-full';
        d.setAttribute('role', 'dialog');
        d.setAttribute('aria-modal', 'true');
        d.setAttribute('aria-label', 'Player charts');
        d.innerHTML =
            '<div class="pc-full-head"><h3>Player charts</h3><div class="pc-seg" role="group" aria-label="Measure"></div>' +
            '<button type="button" class="pc-close" aria-label="Close">×</button></div>' +
            '<div class="pc-pick"></div><p class="pc-desc"></p>' +
            '<div class="pc-chart pc-full-chart"></div><div class="pc-legend"></div>';
        document.body.appendChild(d);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const box = d.querySelector('.pc-chart');
        const redraw = () => {
            metricButtons(d.querySelector('.pc-seg'), _view.metric, id => { _view.metric = id; redraw(); });
            d.querySelector('.pc-desc').textContent = METRICS.find(x => x.id === _view.metric).desc;
            picker(d.querySelector('.pc-pick'), {
                names: o.names(), removable: o.removable, options: o.options, addLabel: '+ Add player',
                onAdd: nm => { o.onAdd(nm); redraw(); }, onRemove: nm => { o.onRemove(nm); redraw(); },
                field: FIELD_METRICS.includes(_view.metric), fieldOn: _view.field, onField: () => { _view.field = !_view.field; redraw(); }
            });
            d.querySelector('.pc-legend').innerHTML = draw(box, o.data, _view.metric, o.names(), _view.field, sizeFor(box, _view.metric, box.clientHeight));
        };
        const onKey = e => { if (e.key === 'Escape') closeFull(); };
        document.addEventListener('keydown', onKey);
        d.querySelector('.pc-close').addEventListener('click', () => closeFull());
        _full = { el: d, redraw, close: () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; d.remove(); o.onClose(); } };
        redraw();
        d.querySelector('.pc-close').focus();
    }

    function closeFull() {
        if (!_full) return;
        const f = _full; _full = null;
        f.close();
    }

    // -------------------------------------------------------------------------
    // Redraw on resize (charts are drawn to their box's width)
    // -------------------------------------------------------------------------

    function _track(container, redraw) {
        _redraws = _redraws.filter(r => r.container !== container && r.container.isConnected);
        _redraws.push({ container, redraw });
    }
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => {
            if (_full) { _full.redraw(); return; }
            _redraws = _redraws.filter(r => r.container.isConnected);
            _redraws.forEach(r => { if (r.container.offsetParent) r.redraw(); });
        }, 150);
    });

    return { renderForm, renderCompare, closeFull, MAX_PLAYERS };
})();
