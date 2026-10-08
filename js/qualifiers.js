// qualifiers.js - qualifiers above 32 players: a round 0 before a 32-player bracket
//
// Double and single elimination take 33 to 48 players (Docs/QUALIFIERS.md). The bracket stays a
// 32-player bracket; N − 32 qualifier matches decide who takes the places byes would have had
// below 32. A qualifier only decides who gets to play: its loser is not qualified (shared 33rd),
// and nothing in it counts (no achievements, no matches or legs, never in the register).
//
// Read-only logic: who plays a qualifier, the qualifier matches made from a drawn bracket, their
// progression (Qn → its round 1 place, merged in front of the 32-player table by
// getProgressionTable()), and who is not qualified. The draw itself is confirmBracketGeneration()
// in clean-match-progression.js; the 32-player progression tables are never changed.

/**
 * Qualifiers above 32 players.
 */
const Qualifiers = (() => {
    const MAX_PLAYERS = 48;
    const isQualifierId = id => /^Q\d+$/.test(String(id));
    const on = () => typeof tournament !== 'undefined' && !!tournament && !!tournament.qualifiers;
    const all = () => (typeof matches !== 'undefined' && Array.isArray(matches) ? matches : []);
    const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

    /**
     * How many qualifier matches n players need: n − 32 above 32, otherwise none.
     * @param {number} n
     * @returns {number}
     */
    const countFor = n => Math.max(0, n - 32);

    /**
     * Who plays a qualifier and who goes straight in. With seeding All, the lowest-ranked play the
     * qualifiers (the unranked first, then up from the bottom of the ranking); otherwise the seeds
     * are exempt and the qualifier players are drawn at random from everyone else. The seeding that
     * goes on to the bracket draw keeps only the seeds who went straight in.
     * @param {Player[]} paid - everyone in the draw (33-48)
     * @param {{seeds: Player[], all: boolean, record: object}|null} seeding - Seeding.forDraw(paid, 32)
     * @returns {{straightIn: Player[], qualifierPlayers: Player[], seeding: object|null}}
     */
    function split(paid, seeding) {
        const places = 2 * countFor(paid.length);
        const seeds = seeding ? seeding.seeds : [];
        const pool = seeding && seeding.all
            ? shuffle(paid.filter(p => !seeds.includes(p))).concat(seeds.slice().reverse())
            : shuffle(paid.filter(p => !seeds.includes(p)));
        const inQualifiers = new Set(pool.slice(0, places));
        const straightIn = paid.filter(p => !inQualifiers.has(p));
        let rest = null;
        if (seeding) {
            const kept = seeds.filter(p => !inQualifiers.has(p));
            const ids = new Set(kept.map(p => String(p.id)));
            if (kept.length >= 2) {
                const record = Object.assign({}, seeding.record, { seeds: (seeding.record.seeds || []).filter(s => ids.has(String(s.id))) });
                rest = { seeds: kept, all: seeding.all, record };
            }
        }
        return { straightIn, qualifierPlayers: shuffle([...inQualifiers]), seeding: rest };
    }

    /**
     * The qualifiers from a drawn 32-place bracket: each walkover the draw left (one per round 1
     * match, where the byes go below 32) becomes a TBD place for "Winner of Qn", numbered from the
     * top of the bracket, and the qualifier players are paired in order into Q1, Q2, ...
     * @param {Array} bracket - 32 places from createOptimizedBracketV2(), the gaps as walkovers
     * @param {Player[]} qualifierPlayers - 2 per qualifier, in pairing order
     * @param {number} legs - best of (the format's regular rounds)
     * @param {number} startId - the first qualifier's numericId
     * @returns {{bracket: Array, qualifiers: {slots: Object<string, [string, string]>}, made: object[]}}
     */
    function fromBracket(bracket, qualifierPlayers, legs, startId) {
        const slots = {}, made = [];
        const slotPlayer = p => ({ id: p.id, name: p.name, paid: p.paid, stats: p.stats });
        let k = 0;
        const placed = bracket.map((p, i) => {
            if (!isWalkover(p)) return p;
            const a = qualifierPlayers[2 * k], b = qualifierPlayers[2 * k + 1];
            k++;
            const id = `Q${k}`;
            slots[id] = [`FS-1-${Math.floor(i / 2) + 1}`, i % 2 ? 'player2' : 'player1'];
            made.push({
                id, numericId: startId + k - 1, round: 0, side: 'qualifier',
                player1: slotPlayer(a), player2: slotPlayer(b),
                winner: null, loser: null, lane: null, legs, referee: null,
                active: false, completed: false, positionInRound: k - 1
            });
            return createTBDPlayer(`q-${k}`);
        });
        return { bracket: placed, qualifiers: { slots }, made };
    }

    // ---------- progression ----------
    let memo = { q: null, base: null, table: null };
    /**
     * The progression table with the qualifiers in front: Qn → { winner: [its round 1 match, slot] },
     * no loser path (a qualifier loser goes nowhere, in double elimination too). The 32-player
     * table itself is untouched; the merged copy is kept while neither changes.
     * @param {Object} base - the 32-player table
     * @returns {Object}
     */
    function withTable(base) {
        const q = tournament.qualifiers;
        if (memo.q === q && memo.base === base) return memo.table;
        const front = {};
        Object.entries(q.slots || {}).forEach(([id, slot]) => { front[id] = { winner: slot }; });
        memo = { q, base, table: Object.assign(front, base) };
        return memo.table;
    }

    // ---------- who is not qualified ----------
    /** The players who lost a qualifier, as ids, in qualifier order. */
    function notQualifiedIds() {
        if (!on()) return [];
        return all().filter(m => m.side === 'qualifier' && m.completed && m.loser && m.loser.id != null)
            .sort((a, b) => a.positionInRound - b.positionInRound).map(m => String(m.loser.id));
    }

    /**
     * Place the players who lost a qualifier: shared 33rd, and mark them on the tournament
     * (`notQualified`, absent when there are none). Called by calculateAllRankings().
     * @param {Object<string, number>} placements - tournament.placements, changed in place
     * @returns {void}
     */
    function place(placements) {
        if (!on()) return;
        const ids = notQualifiedIds();
        ids.forEach(id => { placements[id] = 33; });
        if (ids.length) tournament.notQualified = ids; else delete tournament.notQualified;
    }

    /**
     * True when the player lost a qualifier in this tournament (or in the given record).
     * @param {*} playerId
     * @param {{notQualified?: string[]}} [record] - a tournament or register record; the current tournament by default
     * @returns {boolean}
     */
    function isNotQualified(playerId, record) {
        const r = record || (typeof tournament !== 'undefined' ? tournament : null);
        return !!r && Array.isArray(r.notQualified) && r.notQualified.includes(String(playerId));
    }

    /** True for a qualifier match (by match or id). */
    const isQualifier = m => !!m && (typeof m === 'string' ? isQualifierId(m) : m.side === 'qualifier');

    /** The round 1 match a qualifier's winner goes into, e.g. 'FS-1-3' (null when unknown). */
    const feeds = id => (on() && tournament.qualifiers.slots && tournament.qualifiers.slots[id]) ? tournament.qualifiers.slots[id][0] : null;

    return { MAX_PLAYERS, isQualifierId, isQualifier, countFor, split, fromBracket, withTable,
        notQualifiedIds, place, isNotQualified, feeds, on };
})();
