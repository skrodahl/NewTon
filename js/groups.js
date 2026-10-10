// groups.js - the groups and cups format: groups, tables, cup fields, planned referees, placings
//
// Read-only logic for a tournament with format 'GROUPS' (Docs/GROUPS-AND-CUPS.md): who goes into
// which group, the group tables, who goes on to which cup as which seed, the planned referees, and
// the placings. It never changes tournament data itself, except planCupReferees() (on the cup
// matches being made) and the operator's tie decisions (setOrder()). Drawing the groups and the
// cups is drawGroups()/drawCups() in clean-match-progression.js; undoing the cup draw is
// undoCupDraw() in bracket-rendering.js, with the rest of undo.

/**
 * The groups and cups format.
 */
const Groups = (() => {
    const LETTERS = 'ABCDEFGH';
    const isGroupId = id => /^[A-H]-\d+$/.test(String(id));
    const isCupId = id => /^[AB]-(R\d+-\d+|QF\d+|SF\d+|F|B)$/.test(String(id));
    const real = p => !!p && p.id != null && p.name !== 'TBD' && !isWalkover(p);
    const all = () => (typeof matches !== 'undefined' && Array.isArray(matches) ? matches : []);
    const byId = id => all().find(m => m.id === id) || null;
    const playerOf = id => (typeof players !== 'undefined' ? players : []).find(p => String(p.id) === String(id)) || null;
    const on = () => typeof tournament !== 'undefined' && tournament && tournament.format === 'GROUPS';

    // ---------- settings (Global Settings → Round Robin; each tournament keeps its own) ----------
    /** The largest group: 4, 5 or 6 (absent or anything else is 4, as before the setting). */
    const maxGroupOf = v => [5, 6].includes(Number(v)) ? Number(v) : 4;
    // Structure and To the A cup chosen at the draw (Match Controls → Pick a format), for this
    // tournament's draw only; Global Settings stay as they are
    let drawChoice = null;
    /**
     * Set Round Robin's options for the next draw of the current tournament (null clears them).
     * @param {{structure?: string, cupEntry?: string, meetings?: number}|null} choice
     */
    function setDrawChoice(choice) {
        drawChoice = choice && typeof tournament !== 'undefined' && tournament ? Object.assign({ tid: tournament.id }, choice) : null;
    }
    /** The draw choice, while it is for the current tournament and the draw hasn't been made. */
    const activeChoice = () => drawChoice && typeof tournament !== 'undefined' && tournament && drawChoice.tid === tournament.id &&
        !(tournament.bracket && all().length) ? drawChoice : null;
    /** How many times each pair meets in one group: 2 (a double round robin) or 1. Absent = 1. */
    const meetingsOf = v => Number(v) === 2 ? 2 : 1;
    /** Round Robin's settings for the next draw: Global Settings, with the choices made at the draw:
     * structure 'groups' | 'single', cupEntry 'top2' | 'half', bCup, maxGroup, meetings (one group: 1 or 2). */
    function configSettings() {
        const rr = Object.assign({}, (typeof config !== 'undefined' && config.roundRobin) || {});
        const choice = activeChoice();
        if (choice) {
            if (choice.structure) rr.structure = choice.structure;
            if (choice.cupEntry) rr.cupEntry = choice.cupEntry;
            if (choice.meetings) rr.meetings = choice.meetings;
        }
        return { structure: rr.structure === 'single' ? 'single' : 'groups', cupEntry: rr.cupEntry === 'top2' ? 'top2' : 'half',
            rematches: rr.rematches === 'avoid' ? 'avoid' : 'allow', bCup: rr.bCup !== false, maxGroup: maxGroupOf(rr.maxGroup),
            meetings: rr.structure === 'single' ? meetingsOf(rr.meetings) : 1 };
    }
    /** The settings the tournament was drawn with (absent in the first build: groups and cups, top two). */
    function settings() {
        const s = (on() && tournament.groups && tournament.groups.settings) || {};
        return { structure: s.structure === 'single' ? 'single' : 'groups', cupEntry: s.cupEntry === 'half' ? 'half' : 'top2',
            rematches: s.rematches === 'avoid' ? 'avoid' : 'allow', maxGroup: maxGroupOf(s.maxGroup), meetings: meetingsOf(s.meetings) };
    }
    /** True for one group (a pure round robin: no cups, the table decides). */
    const isSingle = () => settings().structure === 'single';
    /** How many players the next draw takes, by the structure in Global Settings. */
    const limits = () => configSettings().structure === 'single' ? { minPlayers: 3, maxPlayers: 8 } : { minPlayers: 6, maxPlayers: 32 };
    /** The format in words for this tournament: "Round robin, one group" or "Round robin, groups and cups". */
    const formatName = () => isSingle() ? `Round robin, one group${settings().meetings === 2 ? ', twice' : ''}` : 'Round robin, groups and cups';

    // ---------- the group draw ----------
    /**
     * How many groups: the smallest even number that keeps every group at the largest group or fewer
     * (Global Settings → Round Robin → Largest group; this is for the next draw).
     * @param {number} n - players
     * @returns {number}
     */
    function groupCount(n) {
        let g = Math.max(2, Math.ceil(n / configSettings().maxGroup));
        if (g % 2) g++;
        return g;
    }

    /** The group a player goes into, by their place in the draw (snake order: A→D, then D→A, …). */
    const snake = (i, g) => { const r = Math.floor(i / g), k = i % g; return r % 2 ? g - 1 - k : k; };

    /**
     * The group sizes for n players, in group order.
     * @param {number} n
     * @returns {number[]}
     */
    function groupSizes(n) {
        const g = groupCount(n), sizes = new Array(g).fill(0);
        for (let i = 0; i < n; i++) sizes[snake(i, g)]++;
        return sizes;
    }

    /**
     * "4 groups of 4", or "4 groups: 4, 4, 4, 3".
     * @param {number} n
     * @returns {string}
     */
    function describeSizes(n) {
        if (configSettings().structure === 'single') return `One group of ${n}`;
        const s = groupSizes(n);
        return s.every(x => x === s[0]) ? `${s.length} groups of ${s[0]}` : `${s.length} groups: ${s.join(', ')}`;
    }

    /** True when the group draw would be by ranking (seeding on, and at least two ranked players). */
    const seededDraw = paid => typeof Seeding !== 'undefined' && !!Seeding.forGroups(paid);

    /**
     * Who goes into which group: in snake order, by ranking when seeding is on (the ranked players
     * best first, then the unranked at random), otherwise at random. A player's place in their group
     * (1 = first in) is their seed there, which sets the order of play (GROUP_SCHEDULES).
     * @param {Player[]} paid
     * @returns {{list: {name: string, players: Player[]}[], order: Player[], seeding: object|null}}
     */
    function drawGroups(paid) {
        const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
        const seeded = typeof Seeding !== 'undefined' ? Seeding.forGroups(paid) : null;
        const order = seeded ? seeded.order.concat(shuffle(paid.filter(p => !seeded.order.includes(p)))) : shuffle(paid);
        const cfg = configSettings();
        const settings = { structure: cfg.structure, cupEntry: cfg.cupEntry, rematches: cfg.rematches, maxGroup: cfg.maxGroup, meetings: cfg.meetings };
        if (cfg.structure === 'single') return { list: [{ name: 'A', players: order.slice() }], order, seeding: seeded ? seeded.record : null, settings };
        const g = groupCount(order.length);
        const list = Array.from({ length: g }, (_, i) => ({ name: LETTERS[i], players: [] }));
        order.forEach((p, i) => list[snake(i, g)].players.push(p));
        return { list, order, seeding: seeded ? seeded.record : null, settings };
    }

    // ---------- the group tables ----------
    /** The groups as drawn: [{name, players: [id, …]}] in seed order. */
    const groupList = () => (on() && tournament.groups && Array.isArray(tournament.groups.list)) ? tournament.groups.list : [];

    /** A group's matches, in their fixed order. */
    const groupMatches = name => all().filter(m => m.side === 'group' && m.group === name)
        .sort((a, b) => (a.positionInRound || 0) - (b.positionInRound || 0));

    /** Legs for one player in a completed match: [won, lost]. */
    function legsIn(m, pid) {
        const f = m.finalScore;
        if (!f) return [0, 0];
        return String(f.winnerId) === String(pid) ? [f.winnerLegs || 0, f.loserLegs || 0] : [f.loserLegs || 0, f.winnerLegs || 0];
    }

    /** Tally the completed matches among `ids` (all of them when ids is null) for each player. */
    function tally(ms, ids) {
        const t = {};
        ids.forEach(id => { t[id] = { played: 0, won: 0, lost: 0, legsWon: 0, legsLost: 0 }; });
        ms.forEach(m => {
            if (!m.completed || !m.winner) return;
            const a = String(m.player1.id), b = String(m.player2.id);
            if (!(a in t) || !(b in t)) return;
            [a, b].forEach(id => {
                const [w, l] = legsIn(m, id);
                const row = t[id];
                row.played++; row.legsWon += w; row.legsLost += l;
                if (String(m.winner.id) === id) row.won++; else row.lost++;
            });
        });
        return t;
    }

    /**
     * A group's table, best first: wins, then leg difference, then legs won, then head-to-head (a
     * mini-table of the matches between the players still level, which also settles a three-way
     * tie), then the operator's decision (setOrder()), then the seed. Rows still level after
     * head-to-head are marked `level`, once the group has played every match (before that, the
     * matches still to come can settle it).
     * @param {string} name - the group letter
     * @returns {{player: object, id: string, seed: number, played: number, won: number, lost: number,
     *            legsWon: number, legsLost: number, diff: number, level: boolean, pos: number}[]}
     */
    function standings(name) {
        const group = groupList().find(g => g.name === name);
        if (!group) return [];
        const ids = group.players.map(String);
        const ms = groupMatches(name);
        const t = tally(ms, ids);
        const done = ms.every(m => m.completed);
        const manual = (tournament.groups.order && tournament.groups.order[name]) || null;
        const rows = ids.map((id, i) => {
            const p = playerOf(id);
            return Object.assign({ player: p || { id, name: '?' }, id, seed: i + 1, level: false }, t[id], { diff: t[id].legsWon - t[id].legsLost });
        });
        const key = r => [r.won, r.diff, r.legsWon];
        const same = (a, b, k) => k(a).every((v, i) => v === k(b)[i]);
        const cmp = (a, b, k) => { const x = k(a), y = k(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; };
        rows.sort((a, b) => cmp(a, b, key) || a.seed - b.seed);
        // head-to-head inside each cluster that is level on wins, leg difference and legs won
        const out = [];
        for (let i = 0; i < rows.length;) {
            let j = i + 1;
            while (j < rows.length && same(rows[i], rows[j], key)) j++;
            let cluster = rows.slice(i, j);
            if (cluster.length > 1) {
                const mini = tally(ms, cluster.map(r => r.id));
                const h2h = r => [mini[r.id].won, mini[r.id].legsWon - mini[r.id].legsLost];
                const rank = r => manual && manual.includes(r.id) ? manual.indexOf(r.id) : 100 + r.seed;
                cluster.sort((a, b) => cmp(a, b, h2h) || rank(a) - rank(b));
                cluster.forEach((r, k) => {
                    r.level = done && cluster.some((o, m) => m !== k && same(o, r, h2h));
                });
            }
            out.push(...cluster);
            i = j;
        }
        out.forEach((r, i) => { r.pos = i + 1; });
        return out;
    }

    /** True when every match of the group has been played. */
    const groupDone = name => groupMatches(name).every(m => m.completed);

    /** True when every group match has been played (the cups can be drawn). */
    const allGroupsDone = () => on() && groupList().length > 0 && groupList().every(g => groupDone(g.name));

    /** Per match: win rate, then leg difference per match, then legs won per match (ranks across groups of different sizes). */
    const perMatch = r => r.played ? [r.won / r.played, r.diff / r.played, r.legsWon / r.played] : [0, 0, 0];
    const byPerMatch = (a, b) => { const x = perMatch(a), y = perMatch(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i]; return 0; };

    /**
     * Who goes on to which cup, as which seed: the group winners as seeds 1…g, the runners-up after
     * them (the A cup); the thirds, then the fourths, and so on (the B cup). Within each place, ranked across
     * the groups per match (win rate, leg difference per match, legs won per match), then by group.
     * Top half only applies with a B cup (it is there to keep the B cup from being tiny): without
     * one, the A cup always takes the top two of each group.
     * @param {boolean} [playB=true] - whether the B cup is played
     * @returns {{A: object[], B: object[], rows: {A: object[], B: object[]}}} A/B: players, best seed
     *   first; rows: the same as table rows with their group, for the draw step (B: everyone in no
     *   A cup, also when the B cup isn't played)
     */
    function cupFields(playB = true) {
        const byPlace = {};
        groupList().forEach(g => standings(g.name).forEach(r => { (byPlace[r.pos] = byPlace[r.pos] || []).push(Object.assign({ group: g.name }, r)); }));
        const place = n => (byPlace[n] || []).slice().sort((a, b) => byPerMatch(a, b) || a.group.localeCompare(b.group));
        const places = Object.keys(byPlace).map(Number).sort((a, b) => a - b);
        let A = place(1).concat(place(2)), B = places.filter(n => n > 2).flatMap(place);
        if (settings().cupEntry === 'half' && playB !== false) {
            // Top half: everyone in that order, split into two cups of the same size (A one larger when odd)
            const everyone = A.concat(B);
            const half = Math.ceil(everyone.length / 2);
            A = everyone.slice(0, half); B = everyone.slice(half);
        }
        return { A: A.map(r => r.player), B: B.map(r => r.player), rows: { A, B } };
    }

    /**
     * A cup's field in the order the mirror draw takes it, with group rematches in round 1 avoided
     * where possible (Round Robin → Group rematches: Avoid). The draw pairs seed i with seed K+1-i;
     * when that opponent is from the same group, the top seed gets the nearest opponent (by seed) from
     * another group instead, the best seeds first, keeping every other pairing as close to the mirror
     * as it can. When no such pairing exists (one group would have to meet itself), the mirror stands.
     * @param {object[]} field - the cup's players, best seed first
     * @param {number} size - the cup's bracket size
     * @returns {object[]} the field reordered (same players)
     */
    function avoidRematches(field, size) {
        const P = field.length, K = size;
        const groupOf = {};
        groupList().forEach(g => g.players.forEach(id => { groupOf[String(id)] = g.name; }));
        const g = p => groupOf[String(p.id)];
        const tops = [];                                  // the seeds that meet a player (not a bye)
        for (let i = Math.max(0, K - P); i < K / 2; i++) tops.push(i);
        const pool = tops.map(i => field[K - 1 - i]);     // their mirror opponents, in the same order
        const assign = new Array(tops.length), used = new Array(pool.length).fill(false);
        const search = k => {
            if (k === tops.length) return true;
            const order = pool.map((_, j) => j).filter(j => !used[j]).sort((a, b) => Math.abs(a - k) - Math.abs(b - k) || a - b);
            for (const j of order) {
                if (g(pool[j]) === g(field[tops[k]])) continue;
                used[j] = true; assign[k] = j;
                if (search(k + 1)) return true;
                used[j] = false;
            }
            return false;
        };
        if (!search(0)) return field.slice();             // impossible without a rematch: keep the mirror
        const out = field.slice();
        tops.forEach((i, k) => { out[K - 1 - i] = pool[assign[k]]; });
        return out;
    }

    // ---------- planned referees ----------
    /**
     * How many real players each of a cup's matches will have, from round 1 and the cup's SE table:
     * a winner exists when its match has at least one real player, a loser only when it has two (a
     * walkover has no loser). Known as soon as the cup is drawn.
     * @param {object[]} cupMatches - one cup's matches, round 1 with its players
     * @param {number} size - the cup's bracket size
     * @returns {function(string): number} seId -> 0, 1 or 2
     */
    function realCounts(cupMatches, size) {
        const bySe = {}, feeds = {}, memo = {};
        cupMatches.forEach(m => { bySe[m.seId] = m; });
        Object.entries(SE_MATCH_PROGRESSION[size] || {}).forEach(([src, rule]) => ['winner', 'loser'].forEach(kind => {
            if (rule[kind]) (feeds[rule[kind][0]] = feeds[rule[kind][0]] || []).push({ src, kind });
        }));
        const count = seId => {
            if (memo[seId] !== undefined) return memo[seId];
            const m = bySe[seId];
            if (!m) return (memo[seId] = 0);
            if (m.round === 1) return (memo[seId] = [m.player1, m.player2].filter(real).length);
            return (memo[seId] = (feeds[seId] || []).filter(f => f.kind === 'winner' ? count(f.src) >= 1 : count(f.src) === 2).length);
        };
        return count;
    }

    /**
     * Plan the referees of a cup's matches as they are made (Docs/GROUPS-AND-CUPS.md): round 1's
     * top half by the bye winners first, then the players of the bottom matches (the last one
     * first); its bottom half by the losers of the top half, in order. Later rounds up to the
     * semifinals: the loser of a match of the round before, counted from the bottom. The bronze final:
     * the loser of the first match two rounds back (in a cup of four, the first semifinal's winner,
     * who waits for the final anyway); the final: the bronze final's loser. Sets plannedReferee.
     * @param {object[]} cupMatches - one cup's matches, round 1 with its players
     * @param {number} size - the cup's bracket size
     * @returns {void}
     */
    function planCupReferees(cupMatches, size) {
        const round = r => cupMatches.filter(m => m.round === r).sort((a, b) => a.positionInRound - b.positionInRound);
        const total = Math.log2(size) + 1;          // rounds: the natural ones, then the final
        const semis = total - 2, bronze = round(total - 1)[0], final = round(total)[0];
        const isBye = m => isWalkover(m.player1) || isWalkover(m.player2);
        const count = realCounts(cupMatches, size);
        const twoReal = m => count(m.seId) === 2;
        const r1 = round(1), live = r1.filter(m => !isBye(m));
        const byeWinners = r1.filter(isBye).map(m => isWalkover(m.player1) ? m.player2 : m.player1).filter(real);
        const top = live.slice(0, Math.ceil(live.length / 2)), bottom = live.slice(top.length);
        const pool = byeWinners.map(p => p.id);
        bottom.slice().reverse().forEach(m => pool.push(m.player1.id, m.player2.id));
        top.forEach((m, i) => { m.plannedReferee = pool[i] != null ? { player: pool[i] } : null; });
        bottom.forEach((m, j) => { m.plannedReferee = top[j] ? { loserOf: top[j].id } : null; });
        for (let r = 2; r <= semis; r++) {
            const before = round(r - 1).filter(twoReal).reverse();
            round(r).forEach((m, k) => { m.plannedReferee = before.length ? { loserOf: before[k % before.length].id } : null; });
        }
        if (bronze && twoReal(bronze)) {
            const back = semis - 1 >= 1 ? round(semis - 1).filter(twoReal) : [];
            const sf1 = round(semis)[0];
            bronze.plannedReferee = back.length ? { loserOf: back[0].id } : (sf1 && count(sf1.seId) >= 1 ? { winnerOf: sf1.id } : null);
        }
        if (final) final.plannedReferee = bronze && twoReal(bronze) ? { loserOf: bronze.id } : null;
    }

    /**
     * The planned referee as a player, when known: the one named, or the loser (winner) of the match
     * named once it has been played. Null when there is none or it isn't known yet.
     * @param {object} match
     * @returns {object|null} a player
     */
    function plannedRefereeFor(match) {
        const plan = match && match.plannedReferee;
        if (!plan || !on()) return null;
        if (plan.player != null) return playerOf(plan.player);
        const from = byId(plan.loserOf || plan.winnerOf);
        if (!from || !from.completed) return null;
        const p = plan.loserOf ? from.loser : from.winner;
        return real(p) ? playerOf(p.id) : null;
    }

    /**
     * The planned referee in words, for a match that hasn't started: the name, or "loser of A-QF1"
     * while that match is still to be played. '' when there is no plan.
     * @param {object} match
     * @returns {string}
     */
    function plannedRefereeText(match) {
        const plan = match && match.plannedReferee;
        if (!plan) return '';
        const p = plannedRefereeFor(match);
        if (p) return p.name;
        if (plan.loserOf) return `loser of ${plan.loserOf}`;
        if (plan.winnerOf) return `winner of ${plan.winnerOf}`;
        return '';
    }

    /** The referee a match would have now: the one chosen, or the planned one once known. */
    const refereeOf = m => m.referee ? playerOf(m.referee) : plannedRefereeFor(m);

    /**
     * Why a ready match should wait, or null when it can start (Docs/GROUPS-AND-CUPS.md): one of its
     * players is the referee of an earlier match in the same group or cup that is ready but not
     * started (that match goes first), or its planned referee isn't known yet ("the loser of A-QF1")
     * and no one has been chosen. Choosing another referee for either match lets it start. A cup
     * whose matches have no plan (two players) never waits.
     * @param {object} match
     * @returns {string|null} the reason, e.g. "Ken referees A-QF1 first"
     */
    function holdFor(match) {
        if (!on() || !match || match.completed || match.active) return null;
        const order = m => m.side === 'group' ? (m.positionInRound || 0) : (m.numericId || 0);
        const peers = match.side === 'group' ? groupMatches(match.group) : match.side === 'cup' ? cupMatchesOf(match.cup) : [];
        const earlier = peers.filter(m => m.id !== match.id && order(m) < order(match) && !m.completed && !m.active && getMatchState(m) === 'ready');
        const duty = [];
        [match.player1, match.player2].forEach(p => {
            if (!real(p)) return;
            const first = earlier.find(e => { const r = refereeOf(e); return r && String(r.id) === String(p.id); });
            if (first) duty.push(`${p.name} referees ${first.id} first`);
        });
        if (duty.length) return duty.join('; ');
        const plan = match.plannedReferee;
        if (!match.referee && plan && plan.player == null && !plannedRefereeFor(match)) {
            return `its referee is the ${plan.loserOf ? 'loser' : 'winner'} of ${plan.loserOf || plan.winnerOf}`;
        }
        return null;
    }

    // ---------- the cups ----------
    /** A cup's match by its single-elimination round from the end: 0 = final, 1 = bronze final. */
    const cupMatchesOf = cup => all().filter(m => m.side === 'cup' && m.cup === cup);

    /** True when every drawn cup's final has been played: the tournament is over. */
    function isComplete() {
        if (on() && isSingle()) return allGroupsDone();
        if (!on() || !tournament.cups || !tournament.cups.A) return false;
        const done = id => { const m = byId(id); return !!m && m.completed; };
        return done('A-F') && done('A-B') && (!tournament.cups.B || (done('B-F') && done('B-B')));
    }

    /** A place in the order (1, 2, 3 …) as the placing it shows and scores: 5th–6th, 7th–8th, 9th–12th … as in the brackets. */
    const placeTier = n => n <= 4 ? n : n <= 6 ? 5 : n <= 8 ? 7 : n <= 12 ? 9 : n <= 16 ? 13 : n <= 24 ? 17 : 25;

    /**
     * The placings as the cups stand: every player gets one (Docs/GROUPS-AND-CUPS.md, Placings). In
     * order: the A cup's final pair (1st, 2nd) and bronze pair (3rd, 4th); with a B cup, its final
     * pair and bronze pair; then the A cup's other losers, the latest round first, then the B cup's,
     * each round by group performance; then anyone in no cup, by group performance. Places run on
     * through that order as shared places (5th–6th, 7th–8th, 9th–12th …), so a B cup too small to
     * fill 7th–8th leaves those places to the A cup's quarterfinal losers. Each block is placed once
     * it is decided (a round when all its matches are played; anyone in no cup at the cup draw);
     * where it starts is known from the draw.
     * @returns {Object<string, number>} player id → placement
     */
    function placements() {
        const out = {};
        // One group: the table decides, once every match is played
        if (on() && isSingle()) {
            if (allGroupsDone()) standings('A').forEach(r => { out[r.id] = placeTier(r.pos); });
            return out;
        }
        if (!on() || !tournament.cups || !tournament.cups.A) return out;
        const rowOf = {};
        groupList().forEach(g => standings(g.name).forEach(r => { rowOf[r.id] = r; }));
        const byGroups = (a, b) => { const x = rowOf[String(a.id)], y = rowOf[String(b.id)]; return x && y ? (byPerMatch(x, y) || x.pos - y.pos) : 0; };
        let next = 1;
        // a block of `size` places; `players` (in order) when decided
        const block = (size, players) => {
            if (players) players.filter(real).forEach((p, i) => { out[String(p.id)] = placeTier(next + i); });
            next += size;
        };
        const pair = (m, size) => block(size, m && m.completed ? [m.winner, m.loser] : null);
        const cupBlocks = cup => {
            const ms = cupMatchesOf(cup), c = tournament.cups[cup];
            return { ms, size: c.size, count: realCounts(ms, c.size), total: Math.log2(c.size) + 1 };
        };
        const finals = cup => {
            const k = cupBlocks(cup), at = r => k.ms.find(m => m.round === r);
            pair(at(k.total), k.count(at(k.total).seId));          // final
            pair(at(k.total - 1), k.count(at(k.total - 1).seId));  // bronze final
        };
        const losers = cup => {
            const k = cupBlocks(cup);
            for (let r = k.total - 3; r >= 1; r--) {                // before the semifinals, latest round first
                const round = k.ms.filter(m => m.round === r && k.count(m.seId) === 2);
                const decided = round.length && round.every(m => m.completed);
                block(round.length, decided ? round.map(m => m.loser).slice().sort(byGroups) : null);
            }
        };
        finals('A');
        if (tournament.cups.B) finals('B');
        losers('A');
        if (tournament.cups.B) losers('B');
        const inCup = new Set(all().filter(m => m.side === 'cup').flatMap(m => [m.player1, m.player2]).filter(real).map(p => String(p.id)));
        const rest = groupList().flatMap(g => g.players.map(String)).filter(id => !inCup.has(id)).map(id => rowOf[id] && rowOf[id].player).filter(Boolean);
        block(rest.length, rest.slice().sort(byGroups));
        return out;
    }

    // ---------- names ----------
    /**
     * The round a match is in, in words: "Group A", "A cup · Quarterfinal", "B cup · Final".
     * @param {object|string} match - a match, or its ID
     * @returns {string}
     */
    function roundName(match) {
        const m = typeof match === 'string' ? byId(match) : match;
        if (!m) return String(match || '');
        if (m.side === 'group') return isSingle() ? (m.returnRound ? 'Round robin · return round' : 'Round robin') : `Group ${m.group}`;
        if (m.side === 'cup') {
            const size = tournament.cups && tournament.cups[m.cup] && tournament.cups[m.cup].size;
            const r = typeof getSERoundDisplayName === 'function' ? getSERoundDisplayName(m.round, size) : `Round ${m.round}`;
            return `${m.cup} cup · ${r === 'Bronze' ? 'Bronze final' : r}`;
        }
        return m.id;
    }

    // ---------- the operator's tie decisions ----------
    /**
     * Move a player who is level with the one above them up one place in their group (the operator
     * decides a tie that head-to-head didn't). Only before the cups are drawn.
     * @param {string} name - the group letter
     * @param {*} playerId
     * @returns {boolean} true when the order changed
     */
    function moveUp(name, playerId) {
        if (!on() || tournament.cups || tournament.readOnly) return false;
        const rows = standings(name);
        const i = rows.findIndex(r => r.id === String(playerId));
        if (i < 1 || !rows[i].level || !rows[i - 1].level) return false;
        const ids = rows.map(r => r.id);
        [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
        tournament.groups.order = Object.assign({}, tournament.groups.order, { [name]: ids });
        if (typeof saveTournament === 'function') saveTournament();
        return true;
    }

    return {
        isGroupId, isCupId, groupCount, groupSizes, describeSizes, seededDraw, drawGroups,
        configSettings, setDrawChoice, settings, isSingle, limits, formatName, placeTier,
        groupList, groupMatches, standings, groupDone, allGroupsDone, cupFields,
        planCupReferees, avoidRematches, plannedRefereeFor, plannedRefereeText, cupMatchesOf, holdFor,
        isComplete, placements, roundName, moveUp
    };
})();
