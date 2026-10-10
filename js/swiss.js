// swiss.js - Swiss: a fixed number of rounds, each pairing players with the same record who haven't met
//
// Docs/SWISS.md. Read-only logic for a tournament with format 'SWISS': the settings for the next draw,
// the table (wins, opponents' wins, leg difference, legs won), each round's pairing (Monrad: the table
// in order, skipping rematches, a bye for the lowest-placed player without one), the top four's
// knockout table (the 4-player single elimination table with its IDs renamed K-…), the placings, and
// what an undo may take back. Drawing rounds and the knockout is drawSwiss()/drawSwissRound()/
// drawSwissKnockout() in clean-match-progression.js; Swiss rounds progress no one.

/**
 * Swiss.
 */
const Swiss = (() => {
    const on = () => typeof tournament !== 'undefined' && !!tournament && tournament.format === 'SWISS';
    const all = () => (typeof matches !== 'undefined' && Array.isArray(matches) ? matches : []);
    const byId = id => all().find(m => m.id === id) || null;
    const playerOf = id => (typeof players !== 'undefined' ? players : []).find(p => String(p.id) === String(id)) || null;
    const isRoundId = id => /^R\d+-\d+$/.test(String(id));
    const isKnockoutId = id => /^K-(SF\d|B|F)$/.test(String(id));
    const st = () => (on() && tournament.swiss) || null;

    // ---------- settings (Global Settings → Swiss; the draw can change them for itself) ----------
    let drawChoice = null;
    /** Rounds and Finish chosen at the draw, for the current tournament's draw only (null clears). */
    function setDrawChoice(choice) {
        drawChoice = choice && typeof tournament !== 'undefined' && tournament ? Object.assign({ tid: tournament.id }, choice) : null;
    }
    const activeChoice = () => drawChoice && typeof tournament !== 'undefined' && tournament && drawChoice.tid === tournament.id &&
        !(tournament.bracket && all().length) ? drawChoice : null;
    /** The settings for the next draw: rounds 'auto' | 2..7, finish 'top4' | 'table'. */
    function configSettings() {
        const s = Object.assign({}, (typeof config !== 'undefined' && config.swiss) || {}, activeChoice() || {});
        const rounds = Number(s.rounds) >= 2 && Number(s.rounds) <= 7 ? Number(s.rounds) : 'auto';
        return { rounds, finish: s.finish === 'table' ? 'table' : 'top4' };
    }
    /** Rounds by the number of players: 2 for 4, 3 for 5-8, 4 for 9-16, 5 for 17-32, 6 for 33-48. */
    const autoRounds = n => n <= 4 ? 2 : n <= 8 ? 3 : n <= 16 ? 4 : n <= 32 ? 5 : 6;
    /** The rounds a draw of n players would have: the setting (or by players), never more than n − 1. */
    function roundsFor(n) {
        const r = configSettings().rounds;
        return Math.max(1, Math.min(r === 'auto' ? autoRounds(n) : r, n - 1));
    }
    const limits = () => ({ minPlayers: 4, maxPlayers: 48 });

    // ---------- the rounds ----------
    const roundMatches = r => all().filter(m => m.side === 'swiss' && m.round === r);
    const knockoutMatches = () => all().filter(m => m.side === 'swissko');
    /** The rounds drawn so far. */
    const drawnRounds = () => (st() && Array.isArray(st().drawn)) ? st().drawn.length : 0;
    /** True when every match of round r is played. */
    const roundDone = r => { const ms = roundMatches(r); return ms.length > 0 && ms.every(m => m.completed); };
    const byesIn = r => { const d = st() && (st().drawn || []).find(x => x.round === r); return d ? (d.byes || []).map(String) : []; };

    // ---------- the table ----------
    /**
     * The table, best first: wins (a bye is a win), opponents' wins (Buchholz), leg difference, legs
     * won, then the draw order. Rows: {player, id, played, won, lost, byes, legsWon, legsLost, diff, opp, pos}.
     * @returns {object[]}
     */
    function table() {
        if (!on()) return [];
        const order = (tournament.bracket || []).map(p => String(p && p.id != null ? p.id : p));
        const rows = {};
        order.forEach((id, i) => { rows[id] = { id, player: playerOf(id) || { id, name: '?' }, played: 0, won: 0, lost: 0, byes: 0, legsWon: 0, legsLost: 0, met: [], seq: i }; });
        all().filter(m => m.side === 'swiss' && m.completed && m.winner && m.loser).forEach(m => {
            const w = rows[String(m.winner.id)], l = rows[String(m.loser.id)];
            const f = m.finalScore || {};
            if (w) { w.played++; w.won++; w.legsWon += f.winnerLegs || 0; w.legsLost += f.loserLegs || 0; w.met.push(String(m.loser.id)); }
            if (l) { l.played++; l.lost++; l.legsWon += f.loserLegs || 0; l.legsLost += f.winnerLegs || 0; l.met.push(String(m.winner.id)); }
        });
        ((st() && st().drawn) || []).forEach(d => (d.byes || []).forEach(id => { const r = rows[String(id)]; if (r) { r.won++; r.byes++; } }));
        const list = Object.values(rows);
        list.forEach(r => { r.diff = r.legsWon - r.legsLost; r.opp = r.met.reduce((s, id) => s + (rows[id] ? rows[id].won : 0), 0); });
        list.sort((a, b) => b.won - a.won || b.opp - a.opp || b.diff - a.diff || b.legsWon - a.legsWon || a.seq - b.seq);
        list.forEach((r, i) => { r.pos = i + 1; });
        return list;
    }

    // ---------- pairing ----------
    /** Every pair that has a Swiss match (played or not), as "a|b" with the smaller id first. */
    function metPairs() {
        const key = (a, b) => (String(a) < String(b) ? `${a}|${b}` : `${b}|${a}`);
        const set = new Map();
        all().filter(m => m.side === 'swiss').forEach(m => { const k = key(m.player1.id, m.player2.id); set.set(k, (set.get(k) || 0) + 1); });
        return { key, count: (a, b) => set.get(key(a, b)) || 0 };
    }

    /**
     * Round r's pairing. Round 1: `order` (the draw order: ranked best first when seeded, otherwise at
     * random), the top half against the bottom half; the last player sits out when the number is odd.
     * Later rounds: the table in order, 1st v 2nd, 3rd v 4th, skipping anyone already played (the search
     * backtracks when a skip leaves no pairing); if no pairing without a rematch exists, the fewest
     * rematches. With an odd number, the lowest-placed player who hasn't had a bye sits out.
     * @param {number} r
     * @param {string[]} [order] - round 1: player ids in draw order
     * @returns {{pairs: Array<[string, string]>, byes: string[]}}
     */
    function pairRound(r, order) {
        let ids = r === 1 ? (order || []).map(String) : table().map(x => x.id);
        const byes = [];
        if (ids.length % 2) {
            if (r === 1) byes.push(ids[ids.length - 1]);
            else {
                const had = new Set(((st() && st().drawn) || []).flatMap(d => (d.byes || []).map(String)));
                const sit = [...ids].reverse().find(id => !had.has(id)) || ids[ids.length - 1];
                byes.push(sit);
            }
            ids = ids.filter(id => !byes.includes(id));
        }
        if (r === 1) {
            const half = ids.length / 2;
            return { pairs: ids.slice(0, half).map((a, i) => [a, ids[half + i]]), byes };
        }
        const met = metPairs();
        let steps = 0;
        const search = (list, allow) => {
            if (!list.length) return [];
            if (++steps > 200000) return null;               // never hang on a large field: fall back below
            const [a, ...rest] = list;
            const cands = rest.map((b, j) => ({ b, j, n: met.count(a, b) })).filter(c => c.n <= allow)
                .sort((x, y) => x.n - y.n || x.j - y.j);      // nearest in the table first, rematches last
            for (const c of cands) {
                const sub = search(rest.filter((_, k) => k !== c.j), allow);
                if (sub) return [[a, c.b], ...sub];
            }
            return null;
        };
        for (let allow = 0; allow <= r; allow++) {
            steps = 0;
            const p = search(ids, allow);
            if (p) return { pairs: p, byes };
        }
        const pairs = [];
        for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i], ids[i + 1]]);
        return { pairs, byes };
    }

    // ---------- the top four ----------
    let memo = { key: null, table: null };
    /** The top four's progression (SE_MATCH_PROGRESSION[4] renamed K-…) once drawn; {} before. */
    function knockoutTable() {
        if (!st() || !st().knockout) return {};
        if (memo.key === tournament.id && memo.table) return memo.table;
        const t = {};
        Object.entries(SE_MATCH_PROGRESSION[4]).forEach(([seId, rule]) => {
            const out = {};
            ['winner', 'loser'].forEach(k => { if (rule[k]) out[k] = [cupMatchId('K', rule[k][0], 4), rule[k][1]]; });
            t[cupMatchId('K', seId, 4)] = out;
        });
        memo = { key: tournament.id, table: t };
        return t;
    }

    /** True when the whole tournament is played: every round, and the top four's final and bronze final. */
    function isComplete() {
        const s = st();
        if (!s || drawnRounds() < s.rounds || !roundDone(s.rounds)) return false;
        if (s.finish === 'table') return true;
        const ko = knockoutMatches();
        return ko.length > 0 && ko.every(m => m.completed);
    }

    // ---------- placings ----------
    /**
     * The placings as they stand: the top four's from the knockout (when played), everyone else from
     * the table once every round is played, in the shared places from 5th (or from 1st when the table
     * decides).
     * @returns {Object<string, number>}
     */
    function placements() {
        const out = {}, s = st();
        if (!s) return out;
        const tier = typeof Groups !== 'undefined' ? Groups.placeTier : (n => n);
        const allRounds = drawnRounds() >= s.rounds && roundDone(s.rounds);
        if (s.finish === 'table') {
            if (allRounds) table().forEach(r => { out[r.id] = tier(r.pos); });
            return out;
        }
        if (allRounds) table().slice(4).forEach(r => { out[r.id] = tier(r.pos); });
        const f = byId('K-F'), b = byId('K-B');
        const set = (p, n) => { if (p && p.id != null) out[String(p.id)] = n; };
        if (f && f.completed) { set(f.winner, 1); set(f.loser, 2); }
        if (b && b.completed) { set(b.winner, 3); set(b.loser, 4); }
        return out;
    }

    // ---------- undo: what a result may take back, and what is locked ----------
    /**
     * The stage drawn from a Swiss round match's round: the next round's matches (or the top four's,
     * after the last round), or null when nothing has been drawn from it.
     * @param {object} match
     * @returns {{kind: 'round'|'knockout', round?: number, matches: object[]}|null}
     */
    function stageAfter(match) {
        const s = st();
        if (!s || !match || match.side !== 'swiss') return null;
        if (match.round < drawnRounds()) return { kind: 'round', round: match.round + 1, matches: roundMatches(match.round + 1) };
        if (match.round === s.rounds && s.knockout) return { kind: 'knockout', matches: knockoutMatches() };
        return null;
    }
    const started = ms => ms.some(m => m.active || (m.completed && !m.autoAdvanced));
    /** True for a Swiss round match whose next stage has started or has a result: undo is locked. */
    const isLocked = match => { const a = stageAfter(match); return !!a && started(a.matches); };

    // ---------- names ----------
    /** "Round 3", "Top four · Semifinal", "Top four · Bronze final", "Top four · Final". */
    function roundName(match) {
        const m = typeof match === 'string' ? byId(match) : match;
        if (!m) return String(match || '');
        if (m.side === 'swiss') return `Round ${m.round}`;
        if (m.side === 'swissko') return `Top four · ${/-F$/.test(m.id) ? 'Final' : /-B$/.test(m.id) ? 'Bronze final' : 'Semifinal'}`;
        return m.id;
    }

    return { isRoundId, isKnockoutId, setDrawChoice, configSettings, autoRounds, roundsFor, limits,
        roundMatches, knockoutMatches, drawnRounds, roundDone, byesIn, table, pairRound, knockoutTable,
        isComplete, placements, stageAfter, isLocked, roundName, on };
})();
