// plate.js - Cup and Plate: single elimination where the round 1 losers play a second knockout
//
// Docs/CUP-AND-PLATE.md. Play a Plate is a switch at the draw (single elimination, brackets of 8 and
// up); the Cup is the single elimination bracket as always, and the Plate is a single elimination of
// half its size for the Cup's round 1 losers, each at a fixed place (as round 1 losers drop to the
// backside in double elimination): the losers of Cup round 1 match 1 and 2 meet in the Plate's
// first match, of 3 and 4 in its second, and so on.
//
// Read-only logic: the Plate's matches (made at the draw by confirmBracketGeneration()), its
// progression (the single elimination table of its size with its IDs renamed P-…, plus each Cup
// round 1 match's loser path into it, merged by getProgressionTable(); the tables themselves are
// never changed), its placings, and when it is over.

/**
 * Cup and Plate.
 */
const Plate = (() => {
    const isPlateId = id => /^P-(R\d+-\d+|QF\d+|SF\d+|F|B)$/.test(String(id));
    const on = () => typeof tournament !== 'undefined' && !!tournament && !!tournament.plate && !!tournament.plate.size;
    const all = () => (typeof matches !== 'undefined' && Array.isArray(matches) ? matches : []);

    // ---------- the switch at the draw ----------
    /** Cup and Plate is offered (Global Settings → Formats to offer). */
    const offered = () => typeof getVisibleFormats !== 'function' || getVisibleFormats().some(f => f.id === 'CP');
    /** A Plate needs a Cup of 8 or more (5 or more players): in a bracket of 4, round 1 is the semifinals. */
    const possible = paid => paid >= 5;
    let wish = { tid: null, on: false };
    /** Cup and Plate picked at the draw (Match Controls sets it when drawing), for the current tournament. */
    const wanted = () => offered() && wish.tid === (typeof tournament !== 'undefined' && tournament ? tournament.id : null) && wish.on;
    function setWanted(v) { wish = { tid: tournament ? tournament.id : null, on: !!v }; }

    // ---------- the Plate's matches ----------
    /** A Plate match's ID from its single elimination ID: FS-1-2 → P-QF2 (as the cups', cupMatchId()). */
    const idOf = (seId, size) => cupMatchId('P', seId, size);

    /**
     * The Plate for a Cup of cupSize: half its size, every match with TBD places (the Cup's round 1
     * losers fill the first round as round 1 is played). Lengths as single elimination's, by the
     * Plate's own rounds.
     * @param {number} cupSize - the Cup's bracket size (8, 16 or 32)
     * @param {number} startId - the first Plate match's numericId
     * @returns {{plate: {size: number}, made: object[]}}
     */
    function make(cupSize, startId) {
        const size = cupSize / 2, made = [];
        let numericId = startId;
        calculateCleanBracketStructure(size, 'SE').frontside.forEach(roundInfo => {
            for (let i = 0; i < roundInfo.matches; i++) {
                const seId = `FS-${roundInfo.round}-${i + 1}`;
                const legs = isSEFinalMatch(seId, size) ? config.legs.seFinal
                    : isSEBronzeMatch(seId, size) ? config.legs.seBronze
                    : isSESemifinal(seId, size) ? config.legs.seSemifinal
                    : isSEQuarterfinal(seId, size) ? config.legs.seQuarterfinal
                    : config.legs.seRegularRounds;
                made.push({
                    id: idOf(seId, size), seId, numericId: numericId++, round: roundInfo.round, side: 'plate',
                    player1: createTBDPlayer(`p-${roundInfo.round}-${i}-1`), player2: createTBDPlayer(`p-${roundInfo.round}-${i}-2`),
                    winner: null, loser: null, lane: null, legs: legs || 3, referee: null,
                    active: false, completed: false, positionInRound: i
                });
            }
        });
        return { plate: { size }, made };
    }

    // ---------- progression ----------
    let memo = { plate: null, base: null, table: null };
    /**
     * The progression table with the Plate merged in: each Cup round 1 match gains a loser path into
     * the Plate's first round (match k → the Plate's match ceil(k/2), player1 for odd k), and the
     * Plate's own table is the single elimination table of its size with its IDs renamed. The Cup's
     * table is untouched; the merged copy is kept while neither changes.
     * @param {Object} base - the Cup's table (with any qualifiers already merged)
     * @returns {Object}
     */
    function withTable(base) {
        const p = tournament.plate;
        if (memo.plate === p && memo.base === base) return memo.table;
        const size = p.size, table = Object.assign({}, base);
        for (let k = 1; k <= size; k++) {
            const id = `FS-1-${k}`;
            if (!base[id]) continue;
            table[id] = Object.assign({}, base[id], { loser: [idOf(`FS-1-${Math.ceil(k / 2)}`, size), k % 2 ? 'player1' : 'player2'] });
        }
        Object.entries(SE_MATCH_PROGRESSION[size] || {}).forEach(([seId, rule]) => {
            const out = {};
            ['winner', 'loser'].forEach(kind => { if (rule[kind]) out[kind] = [idOf(rule[kind][0], size), rule[kind][1]]; });
            table[idOf(seId, size)] = out;
        });
        memo = { plate: p, base, table };
        return table;
    }

    // ---------- placings ----------
    const byId = id => all().find(m => m.id === id) || null;
    const finalId = () => on() ? idOf(`FS-${Math.log2(tournament.plate.size) + 1}-1`, tournament.plate.size) : null;
    const bronzeId = () => on() ? idOf(`FS-${Math.log2(tournament.plate.size)}-1`, tournament.plate.size) : null;
    const real = p => !!p && p.id != null && p.name !== 'TBD' && !isWalkover(p);

    /**
     * Order the Cup's round 1 losers by the Plate, in the app's shared places (as everywhere beyond
     * 4th): a place within the Plate, after the Cup's K/2 places. 8 players: the Plate's finalists
     * 5th–6th, its bronze pair 7th–8th; 16: its semifinalists 9th–12th, its first round's losers
     * 13th–16th. Only places the Plate has decided; the rest keep the Cup's round 1 place.
     * Called by calculateAllRankings() after the Cup's own rankings.
     * @param {Object<string, number>} placements - tournament.placements, changed in place
     * @returns {void}
     */
    function place(placements) {
        if (!on()) return;
        const size = tournament.plate.size, offset = size, rounds = Math.log2(size);
        const tier = typeof Groups !== 'undefined' ? Groups.placeTier : (n => n);
        const set = (p, within) => { if (real(p)) placements[String(p.id)] = tier(offset + within); };
        all().filter(m => m.side === 'plate' && m.completed).forEach(m => {
            if (m.id === finalId()) { set(m.winner, 1); set(m.loser, 2); }
            else if (m.id === bronzeId()) { set(m.winner, 3); set(m.loser, 4); }
            else if (m.round < rounds) set(m.loser, Math.pow(2, rounds - m.round) + 1);
        });
    }

    /** True when the Plate's final and bronze final are both played (or there is no Plate). */
    const isComplete = () => !on() || [finalId(), bronzeId()].every(id => { const m = byId(id); return !m || m.completed; });

    /** The Plate's winner once its final is played, else null. */
    const winner = () => { const m = on() && byId(finalId()); return m && m.completed && real(m.winner) ? m.winner : null; };

    /**
     * The round a Plate match is in, in words: "Plate · Quarterfinal", "Plate · Bronze final".
     * @param {object} match
     * @returns {string}
     */
    function roundName(match) {
        const size = on() ? tournament.plate.size : 0;
        const r = typeof getSERoundDisplayName === 'function' ? getSERoundDisplayName(match.round, size) : `Round ${match.round}`;
        return `Plate · ${r === 'Bronze' ? 'Bronze final' : r}`;
    }

    return { isPlateId, on, offered, possible, wanted, setWanted, make, withTable, place, isComplete, winner,
        roundName, finalId, bronzeId };
})();
