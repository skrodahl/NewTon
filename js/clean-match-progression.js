// clean-match-progression.js - Single Source of Truth Lookup System
// Based on the *_players.md files - hardcoded bracket progressions

// Pending format selection — set by showBracketConfirmation(), read by confirmBracketGeneration()
let pendingFormat = 'DE';

// Pointer into the active match's preMatchSnapshot (anchored at Start Match in
// toggleActive). Reassigned by showWinnerConfirmation when the dialog opens.
// Used by renderCompletionAchievements / handleConfirm / handleCancel as the baseline
// for the achievement diff and the restore-on-cancel rollback target. Don't null out
// after use — the underlying match.preMatchSnapshot lives on the match object.
let _completionSnapshot = null;

// Monotonic counter so transaction IDs stay unique even when several transactions
// are minted within the same millisecond (e.g. walkover chains in
// processAutoAdvancements). Undo looks transactions up by ID — duplicates would
// let it strip an unrelated match's transaction from history.
let _txIdCounter = 0;

/**
 * Generate a unique transaction ID.
 * @returns {string}
 */
function generateTransactionId() {
    return `tx_${Date.now()}_${++_txIdCounter}`;
}

/**
 * Snapshot the achievement-relevant stats for a player.
 * @param {object} player
 * @returns {{ oneEighties: number, tons: number, lollipops: number, highOuts: number[], shortLegs: number[] }}
 */
function snapshotPlayerStats(player) {
    const s = player.stats || {};
    return {
        oneEighties: s.oneEighties || 0,
        tons: s.tons || 0,
        lollipops: s.lollipops || 0,
        highOuts: Array.isArray(s.highOuts) ? [...s.highOuts] : [],
        shortLegs: Array.isArray(s.shortLegs) ? [...s.shortLegs] : []
    };
}

/**
 * Diff two stat snapshots. Returns the delta (what was added during the session),
 * or null if nothing changed.
 * @param {{ oneEighties, tons, lollipops, highOuts, shortLegs }} before
 * @param {{ oneEighties, tons, lollipops, highOuts, shortLegs }} after
 * @returns {object|null}
 */
function diffPlayerStats(before, after) {
    const d = {};
    const oneEighties = (after.oneEighties || 0) - (before.oneEighties || 0);
    if (oneEighties > 0) d.oneEighties = oneEighties;
    const tons = (after.tons || 0) - (before.tons || 0);
    if (tons > 0) d.tons = tons;
    const lollipops = (after.lollipops || 0) - (before.lollipops || 0);
    if (lollipops > 0) d.lollipops = lollipops;

    // Arrays: find values present in after that weren't in before (handles duplicates)
    const beforeHighOuts = [...(before.highOuts || [])];
    const added = [];
    (after.highOuts || []).forEach(v => {
        const idx = beforeHighOuts.indexOf(v);
        idx !== -1 ? beforeHighOuts.splice(idx, 1) : added.push(v);
    });
    if (added.length) d.highOuts = added;

    const beforeShortLegs = [...(before.shortLegs || [])];
    const addedSL = [];
    (after.shortLegs || []).forEach(v => {
        const idx = beforeShortLegs.indexOf(v);
        idx !== -1 ? beforeShortLegs.splice(idx, 1) : addedSL.push(v);
    });
    if (addedSL.length) d.shortLegs = addedSL;

    return Object.keys(d).length ? d : null;
}

/**
 * Restore a player's stats from a snapshot, reversing any changes made during the session.
 * @param {object} player
 * @param {{ oneEighties, tons, lollipops, highOuts, shortLegs }} snapshot
 */
function restorePlayerStats(player, snapshot) {
    player.stats.oneEighties = snapshot.oneEighties;
    player.stats.tons = snapshot.tons;
    player.stats.lollipops = snapshot.lollipops;
    player.stats.highOuts = [...snapshot.highOuts];
    player.stats.shortLegs = [...snapshot.shortLegs];
}

/**
 * Renders the current session achievement diff into the completion modal summary box.
 * Hides the box if no achievements have been entered.
 */
function renderCompletionAchievements() {
    const container = document.getElementById('completionAchievementsSummary');
    if (!container || !_completionSnapshot) {
        if (container) container.style.display = 'none';
        return;
    }

    const rows = [];
    Object.entries(_completionSnapshot).forEach(([pid, snap]) => {
        const player = players.find(p => String(p.id) === String(pid));
        if (!player) return;
        const diff = diffPlayerStats(snap, snapshotPlayerStats(player));
        if (!diff) return;
        const parts = [];
        if (diff.oneEighties) parts.push(`${diff.oneEighties}&times; 180`);
        if (diff.tons)        parts.push(`${diff.tons}&times; ton`);
        if (diff.highOuts?.length) parts.push(diff.highOuts.map(v => `high out (${v})`).join(', '));
        if (diff.shortLegs?.length) parts.push(`${diff.shortLegs.length}&times; short leg`);
        if (diff.lollipops)   parts.push(`${diff.lollipops}&times; lollipop`);
        if (parts.length) rows.push(`<div class="completion-achievement-row"><strong>${player.name}:</strong> ${parts.join(', ')}</div>`);
    });

    if (!rows.length) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = `<div class="completion-achievements-box">
        <div class="completion-achievements-title">Achievements entered this session:</div>
        ${rows.join('')}
    </div>`;
    container.style.display = '';
}

/**
 * Returns the correct match progression table for the current tournament format.
 * Uses SE_MATCH_PROGRESSION for Single Elimination, DE_MATCH_PROGRESSION for Double Elimination,
 * and for Groups and Cups the drawn cups' SE tables with cup IDs (cupsProgressionTable(); empty
 * before the cup draw, and group matches are never in it).
 *
 * @returns {Object} The progression table for the current format and bracket size
 */
function getProgressionTable() {
    const format = getFormat();
    // Groups and cups: only the cups progress anyone (group matches are not in the table)
    if (format === 'GROUPS') return cupsProgressionTable(tournament.cups);
    const table = format === 'SE' ? SE_MATCH_PROGRESSION : DE_MATCH_PROGRESSION;
    const base = table[tournament.bracketSize];
    // Qualifiers (33-48 players): the round 0 matches in front of the 32-player table, which itself
    // is unchanged (Docs/QUALIFIERS.md)
    if (tournament.qualifiers && base && typeof Qualifiers !== 'undefined') return Qualifiers.withTable(base);
    return base;
}

/**
 * Calculates the smallest power-of-2 bracket size that fits the given player count.
 * SE supports smaller brackets (2, 4) that DE doesn't. 33 to 48 players play a 32-player
 * bracket with qualifiers before it (Docs/QUALIFIERS.md).
 *
 * @param {number} playerCount - Number of paid players
 * @param {'DE'|'SE'} format - Tournament format
 * @returns {2|4|8|16|32|null} Bracket size, or null if player count is out of range
 */
function calculateBracketSize(playerCount, format) {
    if (playerCount > 48) return null;
    if (playerCount > 32) return 32; // with playerCount - 32 qualifiers
    if (format === 'SE') {
        if (playerCount <= 4) return 4;
    }
    if (playerCount <= 8) return 8;
    if (playerCount <= 16) return 16;
    if (playerCount <= 32) return 32;
    return null;
}

/**
 * SINGLE SOURCE OF TRUTH: CORRECTED Match progression lookup tables
 * Based on proper double elimination mirroring rules
 * Format: matchId -> { winner: [targetMatchId, slot], loser: [targetMatchId, slot] }
 */
const DE_MATCH_PROGRESSION = {
    8: {
        // === FRONTSIDE ===
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-2', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-1', 'player2'] },
        'FS-3-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

        // === BACKSIDE ===
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player2'] },
        'BS-3-1': { winner: ['BS-FINAL', 'player2'] },
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] },

        // Grand Final: FS champion vs BS champion
        // Winner = 1st place, Loser = 2nd place
        'GRAND-FINAL': {} // Tournament complete
    },

    16: {
        // === FRONTSIDE ===
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-4', 'player2'] },

        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-3', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-4', 'player2'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-1', 'player2'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-2', 'player2'] },

        // Winners side semis
        'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-4-2', 'player2'] }, // mirror into BS-4
        'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-4-1', 'player2'] },

        // Winners side final
        'FS-4-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

        // === BACKSIDE (16) ===
        // BS-R1 (4 matches) winners → BS-R2.player1
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
        'BS-1-3': { winner: ['BS-2-3', 'player1'] },
        'BS-1-4': { winner: ['BS-2-4', 'player1'] },

        // BS-R2 winners → BS-R3.player1
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player2'] }, // player2 supplied later by FS-3-2 loser
        'BS-2-3': { winner: ['BS-3-2', 'player1'] },
        'BS-2-4': { winner: ['BS-3-2', 'player2'] }, // player2 supplied later by FS-3-1 loser

        // BS-R3 winners go straight to BS-R4 player1
        'BS-3-1': { winner: ['BS-4-1', 'player1'] },
        'BS-3-2': { winner: ['BS-4-2', 'player1'] },

        // BS-R4 winners meet in BS-R5-1
        'BS-4-1': { winner: ['BS-5-1', 'player1'] },
        'BS-4-2': { winner: ['BS-5-1', 'player2'] },

        // BS-R5 winner → BS-FINAL.player2
        'BS-5-1': { winner: ['BS-FINAL', 'player2'] },

        // BS champion → GRAND-FINAL.player2
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] },

        // Grand Final: FS champion vs BS champion
        // Winner = 1st place, Loser = 2nd place
        'GRAND-FINAL': {} // Tournament complete
    },

    32: {
        // === FRONTSIDE MATCHES ===

        // Round 1 (16 matches: FS-1-1 through FS-1-16)
        'FS-1-1': { winner: ['FS-2-1', 'player1'], loser: ['BS-1-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'], loser: ['BS-1-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'], loser: ['BS-1-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'], loser: ['BS-1-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'], loser: ['BS-1-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'], loser: ['BS-1-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'], loser: ['BS-1-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'], loser: ['BS-1-4', 'player2'] },
        'FS-1-9': { winner: ['FS-2-5', 'player1'], loser: ['BS-1-5', 'player1'] },
        'FS-1-10': { winner: ['FS-2-5', 'player2'], loser: ['BS-1-5', 'player2'] },
        'FS-1-11': { winner: ['FS-2-6', 'player1'], loser: ['BS-1-6', 'player1'] },
        'FS-1-12': { winner: ['FS-2-6', 'player2'], loser: ['BS-1-6', 'player2'] },
        'FS-1-13': { winner: ['FS-2-7', 'player1'], loser: ['BS-1-7', 'player1'] },
        'FS-1-14': { winner: ['FS-2-7', 'player2'], loser: ['BS-1-7', 'player2'] },
        'FS-1-15': { winner: ['FS-2-8', 'player1'], loser: ['BS-1-8', 'player1'] },
        'FS-1-16': { winner: ['FS-2-8', 'player2'], loser: ['BS-1-8', 'player2'] },

        // Round 2 (8 matches: FS-2-1 through FS-2-8)  
        'FS-2-1': { winner: ['FS-3-1', 'player1'], loser: ['BS-2-5', 'player2'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'], loser: ['BS-2-6', 'player2'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'], loser: ['BS-2-7', 'player2'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'], loser: ['BS-2-8', 'player2'] },
        'FS-2-5': { winner: ['FS-3-3', 'player1'], loser: ['BS-2-1', 'player2'] },
        'FS-2-6': { winner: ['FS-3-3', 'player2'], loser: ['BS-2-2', 'player2'] },
        'FS-2-7': { winner: ['FS-3-4', 'player1'], loser: ['BS-2-3', 'player2'] },
        'FS-2-8': { winner: ['FS-3-4', 'player2'], loser: ['BS-2-4', 'player2'] },

        // Round 3 (4 matches: FS-3-1 through FS-3-4)
        'FS-3-1': { winner: ['FS-4-1', 'player1'], loser: ['BS-4-2', 'player2'] },
        'FS-3-2': { winner: ['FS-4-1', 'player2'], loser: ['BS-4-1', 'player2'] },
        'FS-3-3': { winner: ['FS-4-2', 'player1'], loser: ['BS-4-4', 'player2'] },
        'FS-3-4': { winner: ['FS-4-2', 'player2'], loser: ['BS-4-3', 'player2'] },

        // Round 4 (2 matches: FS-4-1 through FS-4-2)
        'FS-4-1': { winner: ['FS-5-1', 'player1'], loser: ['BS-6-2', 'player2'] },
        'FS-4-2': { winner: ['FS-5-1', 'player2'], loser: ['BS-6-1', 'player2'] },

        // Round 5 (1 match: FS-5-1) - Frontside Final
        'FS-5-1': { winner: ['GRAND-FINAL', 'player1'], loser: ['BS-FINAL', 'player1'] },

        // === BACKSIDE MATCHES ===

        // Round 1 (8 matches: BS-1-1 through BS-1-8)
        // FS-R1 losers compete, losers eliminated
        // Losers gets 25th-32nd place
        'BS-1-1': { winner: ['BS-2-1', 'player1'] },
        'BS-1-2': { winner: ['BS-2-2', 'player1'] },
        'BS-1-3': { winner: ['BS-2-3', 'player1'] },
        'BS-1-4': { winner: ['BS-2-4', 'player1'] },
        'BS-1-5': { winner: ['BS-2-5', 'player1'] },
        'BS-1-6': { winner: ['BS-2-6', 'player1'] },
        'BS-1-7': { winner: ['BS-2-7', 'player1'] },
        'BS-1-8': { winner: ['BS-2-8', 'player1'] },

        // Round 2 (8 matches: BS-2-1 through BS-2-8)
        // BS-R1 winners meet FS-R2 losers, losers eliminated
        // Losers gets 17th-24th place
        'BS-2-1': { winner: ['BS-3-1', 'player1'] },
        'BS-2-2': { winner: ['BS-3-1', 'player2'] },
        'BS-2-3': { winner: ['BS-3-2', 'player1'] },
        'BS-2-4': { winner: ['BS-3-2', 'player2'] },
        'BS-2-5': { winner: ['BS-3-3', 'player1'] },
        'BS-2-6': { winner: ['BS-3-3', 'player2'] },
        'BS-2-7': { winner: ['BS-3-4', 'player1'] },
        'BS-2-8': { winner: ['BS-3-4', 'player2'] },

        // Round 3 (4 matches: BS-3-1 through BS-3-4)
        // Only backside winners, no frontside input, losers eliminated
        // Losers gets 13th-16tth place
        'BS-3-1': { winner: ['BS-4-1', 'player1'] },
        'BS-3-2': { winner: ['BS-4-2', 'player1'] },
        'BS-3-3': { winner: ['BS-4-3', 'player1'] },
        'BS-3-4': { winner: ['BS-4-4', 'player1'] },

        // Round 4 (4 matches: BS-4-1 through BS-4-4)
        // BS-R3 winners meet FS-R3 losers, losers eliminated
        // Losers gets 9th-12th place
        'BS-4-1': { winner: ['BS-5-1', 'player1'] },
        'BS-4-2': { winner: ['BS-5-1', 'player2'] },
        'BS-4-3': { winner: ['BS-5-2', 'player1'] },
        'BS-4-4': { winner: ['BS-5-2', 'player2'] },

        // Round 5 (2 matches: BS-5-1 through BS-5-2)
        // Only backside winners, no frontside input, losers eliminated
        // Losers gets 7th-8th place
        'BS-5-1': { winner: ['BS-6-1', 'player1'] },
        'BS-5-2': { winner: ['BS-6-2', 'player1'] },

        // Round 6 (2 matches: BS-6-1 through BS-6-2)
        // BS-R5 winners meet FS-R4 losers, losers eliminated
        // Losers gets 5th-6th place
        'BS-6-1': { winner: ['BS-7-1', 'player1'] },
        'BS-6-2': { winner: ['BS-7-1', 'player2'] },

        // Round 7 (1 matches: BS-7-1) - Backside final
        // Only backside winners, no frontside input, losers eliminated
        // Loser gets 4th place
        'BS-7-1': { winner: ['BS-FINAL', 'player2'] },

        // === FINAL MATCHES ===

        // Backside Final: FS-5-1 loser vs BS-7-1 winner
        // Loser gets 3rd place
        'BS-FINAL': { winner: ['GRAND-FINAL', 'player2'] },

        // Grand Final: FS champion vs BS champion
        // Winner = 1st place, Loser = 2nd place
        'GRAND-FINAL': {} // Tournament complete
    }

    // TODO: Add 48-player progression when needed
};

/**
 * SINGLE ELIMINATION: Match progression lookup tables
 * Derived from DE_MATCH_PROGRESSION frontside entries with loser paths removed.
 * Format: matchId -> { winner: [targetMatchId, slot] }
 * The final match in each bracket has {} — tournament complete.
 *
 * These tables are separate from DE to eliminate any risk of interference.
 * Verify by inspection: each SE table should match the FS- entries of the
 * corresponding DE table, with loser entries stripped and the last round
 * match having {} instead of advancing to GRAND-FINAL.
 */
const SE_MATCH_PROGRESSION = {
    4: {
        // Round 1 — Semifinals (2 matches)
        'FS-1-1': { winner: ['FS-3-1', 'player1'], loser: ['FS-2-1', 'player1'] },
        'FS-1-2': { winner: ['FS-3-1', 'player2'], loser: ['FS-2-1', 'player2'] },

        // Round 2 — Bronze (semifinal losers)
        'FS-2-1': {}, // No further progression

        // Round 3 — Final (semifinal winners)
        'FS-3-1': {} // Tournament complete
    },

    8: {
        // Round 1 — Quarterfinals (4 matches)
        'FS-1-1': { winner: ['FS-2-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'] },

        // Round 2 — Semifinals (2 matches)
        'FS-2-1': { winner: ['FS-4-1', 'player1'], loser: ['FS-3-1', 'player1'] },
        'FS-2-2': { winner: ['FS-4-1', 'player2'], loser: ['FS-3-1', 'player2'] },

        // Round 3 — Bronze (semifinal losers)
        'FS-3-1': {}, // No further progression

        // Round 4 — Final (semifinal winners)
        'FS-4-1': {} // Tournament complete
    },

    16: {
        // Round 1 (8 matches)
        'FS-1-1': { winner: ['FS-2-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'] },

        // Round 2 — Quarterfinals (4 matches)
        'FS-2-1': { winner: ['FS-3-1', 'player1'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'] },

        // Round 3 — Semifinals (2 matches)
        'FS-3-1': { winner: ['FS-5-1', 'player1'], loser: ['FS-4-1', 'player1'] },
        'FS-3-2': { winner: ['FS-5-1', 'player2'], loser: ['FS-4-1', 'player2'] },

        // Round 4 — Bronze (semifinal losers)
        'FS-4-1': {}, // No further progression

        // Round 5 — Final (semifinal winners)
        'FS-5-1': {} // Tournament complete
    },

    32: {
        // Round 1 (16 matches)
        'FS-1-1': { winner: ['FS-2-1', 'player1'] },
        'FS-1-2': { winner: ['FS-2-1', 'player2'] },
        'FS-1-3': { winner: ['FS-2-2', 'player1'] },
        'FS-1-4': { winner: ['FS-2-2', 'player2'] },
        'FS-1-5': { winner: ['FS-2-3', 'player1'] },
        'FS-1-6': { winner: ['FS-2-3', 'player2'] },
        'FS-1-7': { winner: ['FS-2-4', 'player1'] },
        'FS-1-8': { winner: ['FS-2-4', 'player2'] },
        'FS-1-9': { winner: ['FS-2-5', 'player1'] },
        'FS-1-10': { winner: ['FS-2-5', 'player2'] },
        'FS-1-11': { winner: ['FS-2-6', 'player1'] },
        'FS-1-12': { winner: ['FS-2-6', 'player2'] },
        'FS-1-13': { winner: ['FS-2-7', 'player1'] },
        'FS-1-14': { winner: ['FS-2-7', 'player2'] },
        'FS-1-15': { winner: ['FS-2-8', 'player1'] },
        'FS-1-16': { winner: ['FS-2-8', 'player2'] },

        // Round 2 (8 matches)
        'FS-2-1': { winner: ['FS-3-1', 'player1'] },
        'FS-2-2': { winner: ['FS-3-1', 'player2'] },
        'FS-2-3': { winner: ['FS-3-2', 'player1'] },
        'FS-2-4': { winner: ['FS-3-2', 'player2'] },
        'FS-2-5': { winner: ['FS-3-3', 'player1'] },
        'FS-2-6': { winner: ['FS-3-3', 'player2'] },
        'FS-2-7': { winner: ['FS-3-4', 'player1'] },
        'FS-2-8': { winner: ['FS-3-4', 'player2'] },

        // Round 3 — Quarterfinals (4 matches)
        'FS-3-1': { winner: ['FS-4-1', 'player1'] },
        'FS-3-2': { winner: ['FS-4-1', 'player2'] },
        'FS-3-3': { winner: ['FS-4-2', 'player1'] },
        'FS-3-4': { winner: ['FS-4-2', 'player2'] },

        // Round 4 — Semifinals (2 matches)
        'FS-4-1': { winner: ['FS-6-1', 'player1'], loser: ['FS-5-1', 'player1'] },
        'FS-4-2': { winner: ['FS-6-1', 'player2'], loser: ['FS-5-1', 'player2'] },

        // Round 5 — Bronze (semifinal losers)
        'FS-5-1': {}, // No further progression

        // Round 6 — Final (semifinal winners)
        'FS-6-1': {} // Tournament complete
    }
};

/**
 * GROUPS AND CUPS: the fixed order of each group's matches, by group size (Docs/GROUPS-AND-CUPS.md).
 * Each entry is [player 1, player 2, referee] by seed in the group (1 = the first player drawn into
 * it); the referee is from the group, or null. Group matches progress no one (everybody plays
 * everybody), so they are not in any progression table.
 *
 * Group of 4: rounds are matches 1-2, 3-4 and 5-6; duties 2/2/1/1, nobody referees twice in a row,
 * and only two back-to-back plays (players 2 and 3, once each), the minimum for four players.
 * Group of 3: the player not playing referees, once each.
 */
const GROUP_SCHEDULES = {
    2: [[1, 2, null]],
    3: [[2, 3, 1], [1, 3, 2], [1, 2, 3]],
    4: [[1, 4, 2], [2, 3, 4], [2, 4, 1], [1, 3, 2], [3, 4, 1], [1, 2, 3]]
};

/**
 * The fixed order of a round robin of n players: GROUP_SCHEDULES for up to four; for five to eight
 * (one group, or groups of five or six under Largest group), the circle method's rounds in order, each match with a
 * referee from the group: never twice in a row, then the fewest duties so far (a player who plays
 * in the same round counts one extra, so the one sitting the round out is asked first), then the
 * lowest seed. Every pair meets once; duties come out even or within one (two at seven players).
 * The same n always gives the same schedule. Entries are [player 1, player 2, referee] by seed (1 = first drawn).
 * @param {number} n - players in the group
 * @returns {Array<[number, number, number|null]>}
 */
function roundRobinSchedule(n) {
    if (GROUP_SCHEDULES[n]) return GROUP_SCHEDULES[n];
    const m = n % 2 ? n + 1 : n;                       // an odd group gets a "sits out" slot (0)
    const ring = Array.from({ length: m }, (_, i) => (i < n ? i + 1 : 0));
    const out = [], duties = {};
    let lastRef = null;
    for (let r = 0; r < m - 1; r++) {
        const pairs = [];
        for (let i = 0; i < m / 2; i++) pairs.push([ring[i], ring[m - 1 - i]]);
        const real = pairs.filter(p => p[0] && p[1]);
        const playing = new Set(real.flat());           // not the one sitting the round out
        real.forEach(([a, b]) => {
            const candidates = [];
            for (let p = 1; p <= n; p++) if (p !== a && p !== b) candidates.push(p);
            const busy = p => playing.has(p) ? 1 : 0;
            const score = p => [p === lastRef ? 1 : 0, (duties[p] || 0) + busy(p), busy(p), p];
            candidates.sort((x, y) => { const sx = score(x), sy = score(y); for (let k = 0; k < sx.length; k++) if (sx[k] !== sy[k]) return sx[k] - sy[k]; return 0; });
            const ref = candidates[0];
            duties[ref] = (duties[ref] || 0) + 1;
            lastRef = ref;
            out.push(a < b ? [a, b, ref] : [b, a, ref]);
        });
        ring.splice(1, 0, ring.pop());                  // rotate everyone but the first
    }
    return out;
}

/**
 * A cup match's ID: the cup letter and the round's short name, from its single-elimination ID.
 * 8 players: FS-1-2 → A-QF2, FS-2-1 → A-SF1, FS-3-1 → A-B (bronze final), FS-4-1 → A-F (final);
 * 16 players' first round: FS-1-3 → A-R1-3. A cup is SE_MATCH_PROGRESSION[size] with its IDs renamed
 * this way, so the SE table stays the one source of cup progression.
 * @param {'A'|'B'} cup
 * @param {string} seId - e.g. 'FS-2-1'
 * @param {4|8|16} size - the cup's bracket size
 * @returns {string}
 */
function cupMatchId(cup, seId, size) {
    const [, r, n] = seId.split('-').map(Number);
    const total = { 4: 3, 8: 4, 16: 5, 32: 6 }[size];
    if (r === total) return `${cup}-F`;
    if (r === total - 1) return `${cup}-B`;
    if (r === total - 2) return `${cup}-SF${n}`;
    if (r === total - 3) return `${cup}-QF${n}`;
    return `${cup}-R${r}-${n}`;
}

/**
 * The cups' progression: each drawn cup's SE_MATCH_PROGRESSION table with its IDs renamed
 * (cupMatchId), the two joined. Empty before the cups are drawn. Built from tournament.cups only.
 * @param {{A?: {size: number}, B?: {size: number}|null}|null|undefined} cups - tournament.cups
 * @returns {Object} matchId -> { winner: [matchId, slot], loser: [matchId, slot] }
 */
function cupsProgressionTable(cups) {
    const table = {};
    if (!cups) return table;
    ['A', 'B'].forEach(cup => {
        const c = cups[cup];
        const se = c && SE_MATCH_PROGRESSION[c.size];
        if (!se) return;
        Object.entries(se).forEach(([seId, rule]) => {
            const out = {};
            ['winner', 'loser'].forEach(kind => {
                if (rule[kind]) out[kind] = [cupMatchId(cup, rule[kind][0], c.size), rule[kind][1]];
            });
            table[cupMatchId(cup, seId, c.size)] = out;
        });
    });
    return table;
}

/**
 * Advances winner and loser to their next matches using DE_MATCH_PROGRESSION lookup table.
 * This is the ONLY function that moves players between matches - single source of truth.
 *
 * @param {string} matchId - The match ID (e.g., 'FS-1-1', 'BS-2-3')
 * @param {Player} winner - The winning player object
 * @param {Player} loser - The losing player object
 * @returns {boolean} True if advancement succeeded, false if tournament/progression missing
 *
 * @example
 * // After completing match FS-1-1
 * advancePlayer('FS-1-1', winnerPlayer, loserPlayer);
 * // Winner goes to FS-2-1 player1 slot
 * // Loser goes to BS-1-1 player1 slot
 */
function advancePlayer(matchId, winner, loser) {
    if (!tournament || !tournament.bracketSize) {
        console.error('No tournament or bracket size available');
        return false;
    }

    let success = true;

    const progression = getProgressionTable();
    if (!progression) {
        console.error(`No progression rules for ${tournament.bracketSize}-player bracket`);
        return false;
    }

    const rule = progression[matchId];
    if (!rule) {
        // No further progression (e.g., GRAND-FINAL)  just stop silently
        return true;
    }


    // Place winner
    if (rule.winner) {
        const [targetMatchId, slot] = rule.winner;
        const targetMatch = matches.find(m => m.id === targetMatchId);

        if (targetMatch) {
            targetMatch[slot] = {
                id: winner.id,
                name: winner.name,
                paid: winner.paid,
                stats: winner.stats
            };
        } else {
            console.error(`Target match ${targetMatchId} not found for winner`);
            success = false;
        }
    }

    // Place loser (if rule exists)
    if (rule.loser && loser) {
        const [targetMatchId, slot] = rule.loser;
        const targetMatch = matches.find(m => m.id === targetMatchId);

        if (targetMatch) {
            targetMatch[slot] = {
                id: loser.id,
                name: loser.name,
                paid: loser.paid,
                stats: loser.stats
            };
        } else {
            console.error(`Target match ${targetMatchId} not found for loser`);
            success = false;
        }
    }

    return success;
}

/**
 * Completes a match by setting winner/loser and advancing players using lookup table.
 * Records transaction to history before making changes for undo support.
 *
 * @param {string} matchId - The match ID to complete (e.g., 'FS-1-1')
 * @param {number} winnerPlayerNumber - Which player won: 1 for player1, 2 for player2
 * @param {number} [winnerLegs=0] - Number of legs won by winner (for score display)
 * @param {number} [loserLegs=0] - Number of legs won by loser (for score display)
 * @param {CompletionType} [completionType='MANUAL'] - 'MANUAL' for user action, 'AUTO' for walkover
 * @param {object|null} [achievements=null] - Achievement delta recorded during match completion session
 * @returns {boolean} True if match completed successfully, false on error
 *
 * @example
 * // Complete match with player 1 winning 3-1
 * completeMatch('FS-1-1', 1, 3, 1, 'MANUAL');
 *
 * @example
 * // Auto-advance walkover match
 * completeMatch('FS-1-2', 2, 0, 0, 'AUTO');
 */
function completeMatch(matchId, winnerPlayerNumber, winnerLegs = 0, loserLegs = 0, completionType = 'MANUAL', achievements = null, rawLegs = null, firstStarter = null) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error('Match ' + matchId + ' not found');
        return false;
    }

    const winner = winnerPlayerNumber === 1 ? match.player1 : match.player2;
    const loser = winnerPlayerNumber === 1 ? match.player2 : match.player1;

    if (!winner || !loser) {
        console.error('Invalid player selection');
        return false;
    }

    // --- START TRANSACTION LOGIC ---
    // Skip transaction creation during rebuild to prevent corruption
    if (!window.rebuildInProgress) {
        const transaction = {
            id: generateTransactionId(),
            type: 'COMPLETE_MATCH',
            completionType: completionType,
            description: `${matchId}: ${winner.name} (ID: ${winner.id}) defeats ${loser.name} (ID: ${loser.id})`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            winner: winner,
            loser: loser,
            // beforeState removed - never used by undo system (saves ~98% storage per transaction)
            achievements: achievements || { [winner.id]: null, [loser.id]: null }
        };
        saveTransaction(transaction);
    }
    // --- END TRANSACTION LOGIC ---

    // Apply changes to the current state
    match.winner = winner;
    match.loser = loser;
    match.completed = true;
    match.active = false;
    match.completedAt = Date.now(); // Add completion timestamp
    if (winnerLegs > 0 || loserLegs > 0) {
        match.finalScore = { winnerLegs, loserLegs, winnerId: winner.id, loserId: loser.id };
    }

    const success = advancePlayer(matchId, winner, loser);

    if (success) {

        // Persisting is deferred to a single saveTournament() at the end of this path
        // (6.2) — the hooks below still mutate `tournament` (placements, status,
        // readOnly), and every reader in between works off the in-memory object.
        if (typeof updateMatchHistory === 'function') updateMatchHistory();

        // Write to match register (fire-and-forget; skip AUTO walkovers, and qualifiers: nothing in a
        // qualifier counts, Docs/QUALIFIERS.md)
        if (completionType !== 'AUTO' && match.side !== 'qualifier' && !window.rebuildInProgress && typeof NewtonDB !== 'undefined') {
            const _p1 = match.player1, _p2 = match.player2;
            const _dbMatch = {
                tournamentId:     String(tournament.id),
                tournamentName:   tournament.name,
                tournamentFormat: tournament.format || 'DE',
                matchId:          matchId,
                matchType:        completionType === 'MANUAL' ? 'MANUAL' : 'CHALKER',
                completedAt:      Math.floor(Date.now() / 1000),
                player1Id:        String(_p1.id),
                player1Name:      _p1.name,
                player2Id:        String(_p2.id),
                player2Name:      _p2.name,
                winner:           winnerPlayerNumber,
                firstStarter:     firstStarter || null,
                legsWon:          { p1: winnerPlayerNumber === 1 ? winnerLegs : loserLegs, p2: winnerPlayerNumber === 2 ? winnerLegs : loserLegs },
                legs:             rawLegs || null,
                achievements:     achievements || null,
                format:           { sc: (typeof config !== 'undefined' && config.legs && config.legs.x01Format) || 501, bo: match.legs || 3 }
            };
            const _matchSaved = NewtonDB.saveMatch(_dbMatch).catch(e => console.warn('NewtonDB saveMatch failed:', e));
            const _metaSaved = NewtonDB.saveTournamentMeta({
                tournamentId:     String(tournament.id),
                tournamentName:   tournament.name,
                tournamentFormat: tournament.format || 'DE',
                playerCount:      (typeof players !== 'undefined' ? players.filter(p => !p.isBye).length : 0),
                startedAt:        Math.floor(Date.now() / 1000)
            }).catch(e => console.warn('NewtonDB saveTournamentMeta failed:', e));

            // Analytics caches tournament records and their match lists; drop the cached
            // copies once these writes land, so re-completing a match in an unlocked
            // tournament can't leave Analytics showing pre-edit data. Deliberately after
            // the writes, not before: invalidating first would let a read in between
            // repopulate the cache with the old records. Guarded — Analytics may not be
            // loaded, and this must never affect match completion.
            Promise.all([_matchSaved, _metaSaved]).then(() => {
                if (typeof NewtonHistory !== 'undefined' && NewtonHistory.invalidateCache) {
                    NewtonHistory.invalidateCache();
                }
            });
        }

        // Calculate live rankings after every match completion (reuse existing logic)
        // Only calculate rankings during normal play, not during rebuild or auto-advancement processing
        if (!window.rebuildInProgress && !window.processingAutoAdvancements) {
            try {
                calculateAllRankings();
            } catch (e) {
                console.warn('Could not calculate live rankings:', e);
            }
        }

        // BS-FINAL completion hook: set 3rd place immediately for consistent UX
        try {
            if (matchId === 'BS-FINAL') {
                console.log('🥉 Backside Final completed - setting 3rd place...');

                // Set 3rd place for the loser
                if (!tournament.placements) {
                    tournament.placements = {};
                }
                tournament.placements[String(loser.id)] = 3;

                console.log(`✓ 3rd place: ${loser.name}`);

                // Note: This placement will be cleared and recalculated when Grand Final completes
                // This ensures consistency with other backside matches that set placement immediately
            }
        } catch (e) {
            console.error('BS-FINAL completion error', { matchId, winner, loser, error: e });
        }

        // SE Bronze completion hook: set 3rd and 4th place immediately
        try {
            const format = getFormat();
            if (format === 'SE' && isSEBronzeMatch(matchId, tournament.bracketSize)) {
                console.log('🥉 Bronze match completed - setting 3rd/4th place...');

                if (!tournament.placements) {
                    tournament.placements = {};
                }
                tournament.placements[String(winner.id)] = 3;
                tournament.placements[String(loser.id)] = 4;

                console.log(`✓ 3rd place: ${winner.name}, 4th place: ${loser.name}`);
            }
        } catch (e) {
            console.error('Bronze completion error', { matchId, winner, loser, error: e });
        }

        // Tournament completion hook: detect final match and set placements
        // DE: GRAND-FINAL has {} progression. SE: last FS round has {} progression.
        // SE bronze also has {} but should NOT trigger completion — only the SE final does.
        try {
            // Computed inside the try so a throw here can't skip the save below
            const completionTable = getProgressionTable();
            const completionRule = completionTable && completionTable[matchId];
            const isSEBronze = getFormat() === 'SE' && isSEBronzeMatch(matchId, tournament.bracketSize);
            // Groups and cups: both cups' bronze and final have {} too, so the format says when it
            // is over instead: when every drawn cup's final has been played
            const isTournamentFinal = getFormat() === 'GROUPS'
                ? (typeof Groups !== 'undefined' && Groups.isComplete())
                : completionRule && Object.keys(completionRule).length === 0 && !isSEBronze;

            if (isTournamentFinal) {
                const format = getFormat();
                console.log(`🏆 ${format} Final completed - calculating all rankings...`);

                // Clear any existing placements
                tournament.placements = {};

                // 1st and 2nd place (final match winner/loser); groups and cups places everyone
                // from both cups in calculateAllRankings() below
                if (format !== 'GROUPS') {
                    tournament.placements[String(winner.id)] = 1;
                    tournament.placements[String(loser.id)] = 2;
                }

                if (format === 'DE') {
                    // 3rd place (BS-FINAL loser)
                    const bsFinal = matches.find(m => m.id === 'BS-FINAL');
                    if (bsFinal && bsFinal.completed && bsFinal.loser && bsFinal.loser.id) {
                        tournament.placements[String(bsFinal.loser.id)] = 3;
                    }
                }

                // Calculate remaining rankings based on bracket size and format
                calculateAllRankings();

                tournament.status = 'completed';
                tournament.readOnly = true;

                console.log(`✓ Tournament completed with full rankings — Final: ${winner.name} defeats ${loser.name}`);

                // Finalize tournament in match register (fire-and-forget)
                if (typeof NewtonDB !== 'undefined') {
                    const _configSnapshot = (typeof config !== 'undefined') ? JSON.parse(JSON.stringify(config)) : {};
                    const _tournamentAchievements = {};
                    if (typeof players !== 'undefined') {
                        players.forEach(p => {
                            if (p.stats) _tournamentAchievements[String(p.id)] = { name: p.name, stats: Object.assign({}, p.stats) };
                        });
                    }
                    NewtonDB.finalizeTournament(
                        String(tournament.id),
                        _configSnapshot,
                        _tournamentAchievements,
                        Math.floor(Date.now() / 1000)
                    ).then(() => {
                        // Store placements for Analytics ranking points
                        if (tournament.placements) {
                            return NewtonDB.getTournament(String(tournament.id)).then(t => {
                                if (t) {
                                    t.placements = tournament.placements;
                                    return NewtonDB.saveTournamentMeta(t);
                                }
                            });
                        }
                    }).then(() => {
                        // Reconcile: attribute any achievements entered outside
                        // the match completion dialog to each player's last match
                        return NewtonDB.reconcileMatchAchievements(
                            String(tournament.id), _tournamentAchievements
                        );
                    }).then(() => {
                        // Invalidate Analytics cache so the new tournament appears without reload
                        if (typeof NewtonHistory !== 'undefined' && NewtonHistory.invalidateCache) {
                            NewtonHistory.invalidateCache();
                        }
                    }).catch(e => console.warn('NewtonDB finalizeTournament failed:', e));
                }
                if (typeof updateMatchHistory === 'function') updateMatchHistory();

                // Auto-upload tournament to server (fire-and-forget, respects config)
                if (typeof autoUploadTournament === 'function' &&
                    typeof config !== 'undefined' && config.server && config.server.autoUpload) {
                    autoUploadTournament();
                }

                // Proactively refresh results UI after completion
                if (typeof displayResults === 'function') {
                    try {
                        displayResults();

                        // HELP SYSTEM INTEGRATION - Tournament completed
                        if (typeof showHelpHint === 'function') {
                            const champion = format === 'GROUPS' ? (matches.find(m => m.id === 'A-F') || {}).winner || winner : winner;
                            showHelpHint(`🏆 Tournament completed! ${champion.name} wins. Check results in Match Controls or on Registration page.`, 8000);
                        }
                    } catch (e) {
                        console.warn('displayResults failed after completion', e);
                    }
                }
            }
        } catch (e) {
            console.error('Tournament completion error', { matchId, winner, loser, error: e });
        }

        // Single persist for the whole completion (6.2). Everything above mutates the
        // in-memory tournament — the match result, live rankings, and any placement or
        // tournament-completion hook — and this writes all of it once. Before
        // processAutoAdvancements(), which completes walkovers through this same path
        // and so persists its own results.
        saveTournament();
        if (typeof updateResultsTable === 'function') updateResultsTable();

        // Skip auto-advancements during rebuild to prevent transaction corruption
        if (!window.rebuildInProgress) {
            processAutoAdvancements();
        }
        return true;
    } else {
        console.error(`Failed to advance players from ${matchId}`);
        // Here we should ideally roll back the transaction, but for now we'll log an error
        return false;
    }
}

/**
 * Calculates final tournament placements for all players based on match outcomes.
 * Called when Grand Final is completed. Determines 4th place and beyond using
 * which backside match each player lost.
 *
 * @returns {void}
 *
 * @description
 * - 1st-3rd: Set by Grand Final and BS-FINAL match outcomes
 * - 4th+: Determined by which backside match the player lost
 * - Updates tournament.placements with player ID to rank mapping
 */
/**
 * Calculates SE rankings based on which round each player was eliminated in.
 * Generic formula: losers in round R of a bracket with totalRounds rounds
 * get placement 2^(totalRounds - R) + 1.
 *
 * Examples (8-player, 3 rounds): R1 losers → 5th, R2 losers → 3rd, R3 loser → 2nd
 * Examples (4-player, 2 rounds): R1 losers → 3rd, R2 loser → 2nd
 */
function calculateSERankings() {
    const bracketSize = tournament.bracketSize;
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    console.log(`Calculating SE rankings for ${bracketSize}-player bracket (${totalRounds} natural rounds)...`);

    // Scan completed FS matches (excluding bronze and final rounds — those are handled by completion hooks)
    const completedMatches = matches.filter(m =>
        m.completed && m.loser && m.loser.id && m.id.startsWith('FS-') &&
        !isSEBronzeMatch(m.id, bracketSize) && !isSEFinalMatch(m.id, bracketSize)
    );

    for (const match of completedMatches) {
        const loserId = String(match.loser.id);

        // Skip if already placed (e.g., by bronze completion hook)
        if (tournament.placements[loserId]) continue;

        // Generic formula: losers in round R get placement 2^(totalRounds - R) + 1
        const round = match.round;
        const placement = Math.pow(2, totalRounds - round) + 1;
        tournament.placements[loserId] = placement;
        console.log(`SE placement: ${match.loser.name} eliminated in R${round} → ${placement}${placement === 3 ? 'rd' : 'th'}`);
    }

    // Bronze match overrides: if played, winner = 3rd, loser = 4th
    const bronzeMatch = matches.find(m => isSEBronzeMatch(m.id, bracketSize) && m.completed);
    if (bronzeMatch && bronzeMatch.winner && bronzeMatch.loser) {
        tournament.placements[String(bronzeMatch.winner.id)] = 3;
        tournament.placements[String(bronzeMatch.loser.id)] = 4;
        console.log(`SE bronze: ${bronzeMatch.winner.name} → 3rd, ${bronzeMatch.loser.name} → 4th`);
    }
}

function calculateAllRankings() {
    if (!tournament || !tournament.bracketSize) {
        console.error('Cannot calculate rankings: missing tournament or bracket size');
        return;
    }

    const bracketSize = tournament.bracketSize;
    console.log(`Calculating rankings for ${bracketSize}-player bracket...`);

    const format = getFormat();
    // Qualifiers: their losers are not qualified, shared 33rd (Docs/QUALIFIERS.md)
    if (format !== 'GROUPS' && typeof Qualifiers !== 'undefined') {
        if (!tournament.placements) tournament.placements = {};
        Qualifiers.place(tournament.placements);
    }
    if (format === 'SE') {
        calculateSERankings();
        return;
    }
    if (format === 'GROUPS') {
        // Derived from the cups as they stand (Docs/GROUPS-AND-CUPS.md, Placings)
        tournament.placements = typeof Groups !== 'undefined' ? Groups.placements() : {};
        return;
    }

    if (bracketSize === 8) {
        calculate8PlayerRankings();
    } else if (bracketSize === 16) {
        calculate16PlayerRankings();
    } else if (bracketSize === 32) {
        calculate32PlayerRankings();
    } else {
        console.warn(`Ranking calculation not implemented for ${bracketSize}-player bracket`);
    }

    console.log('Final tournament placements:', tournament.placements);
}

/**
 * CALCULATE 8-PLAYER RANKINGS
 */
function calculate8PlayerRankings() {
    console.log('Calculating 8-player rankings...');

    // 4th place: BS-3-1 loser
    const bs31 = matches.find(m => m.id === 'BS-3-1');
    if (bs31?.completed && bs31.loser?.id) {
        tournament.placements[String(bs31.loser.id)] = 4;
        console.log(`4th place: ${bs31.loser.name}`);
    }

    // 5th-6th place: BS-2-1 and BS-2-2 losers  
    const bs21 = matches.find(m => m.id === 'BS-2-1');
    const bs22 = matches.find(m => m.id === 'BS-2-2');

    if (bs21?.completed && bs21.loser?.id) {
        tournament.placements[String(bs21.loser.id)] = 5; // Will display as "5th-6th"
        console.log(`5th-6th place: ${bs21.loser.name}`);
    }
    if (bs22?.completed && bs22.loser?.id) {
        tournament.placements[String(bs22.loser.id)] = 5; // Same rank for tie
        console.log(`5th-6th place: ${bs22.loser.name}`);
    }

    // 7th-8th place: BS-1-1 and BS-1-2 losers
    const bs11 = matches.find(m => m.id === 'BS-1-1');
    const bs12 = matches.find(m => m.id === 'BS-1-2');

    if (bs11?.completed && bs11.loser?.id) {
        tournament.placements[String(bs11.loser.id)] = 7; // Will display as "7th-8th"
        console.log(`7th-8th place: ${bs11.loser.name}`);
    }
    if (bs12?.completed && bs12.loser?.id) {
        tournament.placements[String(bs12.loser.id)] = 7; // Same rank for tie
        console.log(`7th-8th place: ${bs12.loser.name}`);
    }

    console.log('✓ 8-player rankings calculated');
}

/**
 * CALCULATE 16-PLAYER RANKINGS
 */
function calculate16PlayerRankings() {
    console.log('Calculating 16-player rankings...');

    // 4th place: BS-5-1 loser
    const bs51 = matches.find(m => m.id === 'BS-5-1');
    if (bs51?.completed && bs51.loser?.id) {
        tournament.placements[String(bs51.loser.id)] = 4;
        console.log(`4th place: ${bs51.loser.name}`);
    }

    // 5th-6th place: BS-4-1 and BS-4-2 losers
    const bs41 = matches.find(m => m.id === 'BS-4-1');
    const bs42 = matches.find(m => m.id === 'BS-4-2');

    if (bs41?.completed && bs41.loser?.id) {
        tournament.placements[String(bs41.loser.id)] = 5;
        console.log(`5th-6th place: ${bs41.loser.name}`);
    }
    if (bs42?.completed && bs42.loser?.id) {
        tournament.placements[String(bs42.loser.id)] = 5;
        console.log(`5th-6th place: ${bs42.loser.name}`);
    }

    // 7th-8th place: BS-3-1 and BS-3-2 losers
    const bs31 = matches.find(m => m.id === 'BS-3-1');
    const bs32 = matches.find(m => m.id === 'BS-3-2');

    if (bs31?.completed && bs31.loser?.id) {
        tournament.placements[String(bs31.loser.id)] = 7;
        console.log(`7th-8th place: ${bs31.loser.name}`);
    }
    if (bs32?.completed && bs32.loser?.id) {
        tournament.placements[String(bs32.loser.id)] = 7;
        console.log(`7th-8th place: ${bs32.loser.name}`);
    }

    // 9th-12th place: BS-2-1 to BS-2-4 losers
    const bs2Matches = ['BS-2-1', 'BS-2-2', 'BS-2-3', 'BS-2-4'];
    bs2Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 9; // All get rank 9 for "9th-12th"
            console.log(`9th-12th place: ${match.loser.name}`);
        }
    });

    // 13th-16th place: BS-1-1 to BS-1-4 losers
    const bs1Matches = ['BS-1-1', 'BS-1-2', 'BS-1-3', 'BS-1-4'];
    bs1Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 13; // All get rank 13 for "13th-16th"
            console.log(`13th-16th place: ${match.loser.name}`);
        }
    });

    console.log('✓ 16-player rankings calculated');
}

/**
 * CALCULATE 32-PLAYER RANKINGS
 */
function calculate32PlayerRankings() {
    console.log('Calculating 32-player rankings...');

    // 4th place: BS-7-1 loser
    const bs71 = matches.find(m => m.id === 'BS-7-1');
    if (bs71?.completed && bs71.loser?.id) {
        tournament.placements[String(bs71.loser.id)] = 4;
        console.log(`4th place: ${bs71.loser.name}`);
    }

    // 5th-6th place: BS-6-1 and BS-6-2 losers
    const bs61 = matches.find(m => m.id === 'BS-6-1');
    const bs62 = matches.find(m => m.id === 'BS-6-2');

    if (bs61?.completed && bs61.loser?.id) {
        tournament.placements[String(bs61.loser.id)] = 5;
        console.log(`5th-6th place: ${bs61.loser.name}`);
    }
    if (bs62?.completed && bs62.loser?.id) {
        tournament.placements[String(bs62.loser.id)] = 5;
        console.log(`5th-6th place: ${bs62.loser.name}`);
    }

    // 7th-8th place: BS-5-1 and BS-5-2 losers
    const bs51 = matches.find(m => m.id === 'BS-5-1');
    const bs52 = matches.find(m => m.id === 'BS-5-2');

    if (bs51?.completed && bs51.loser?.id) {
        tournament.placements[String(bs51.loser.id)] = 7;
        console.log(`7th-8th place: ${bs51.loser.name}`);
    }
    if (bs52?.completed && bs52.loser?.id) {
        tournament.placements[String(bs52.loser.id)] = 7;
        console.log(`7th-8th place: ${bs52.loser.name}`);
    }

    // 9th-12th place: BS-4-1 to BS-4-4 losers
    const bs4Matches = ['BS-4-1', 'BS-4-2', 'BS-4-3', 'BS-4-4'];
    bs4Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 9; // All get rank 9 for "9th-12th"
            console.log(`9th-12th place: ${match.loser.name}`);
        }
    });

    // 13th-16th place: BS-3-1 to BS-3-4 losers
    const bs3Matches = ['BS-3-1', 'BS-3-2', 'BS-3-3', 'BS-3-4'];
    bs3Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 13; // All get rank 13 for "13th-16th"
            console.log(`13th-16th place: ${match.loser.name}`);
        }
    });

    // 17th-24th place: BS-2-1 to BS-2-8 losers
    const bs2Matches = ['BS-2-1', 'BS-2-2', 'BS-2-3', 'BS-2-4', 'BS-2-5', 'BS-2-6', 'BS-2-7', 'BS-2-8'];
    bs2Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 17; // All get rank 17 for "17th-24th"
            console.log(`17th-24th place: ${match.loser.name}`);
        }
    });

    // 25th-32nd place: BS-1-1 to BS-1-8 losers
    const bs1Matches = ['BS-1-1', 'BS-1-2', 'BS-1-3', 'BS-1-4', 'BS-1-5', 'BS-1-6', 'BS-1-7', 'BS-1-8'];
    bs1Matches.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (match?.completed && match.loser?.id) {
            tournament.placements[String(match.loser.id)] = 25; // All get rank 25 for "25th-32nd"
            console.log(`25th-32nd place: ${match.loser.name}`);
        }
    });

    console.log('✓ 32-player rankings calculated');
}


/**
 * CHECK IF PLAYER IS WALKOVER (for auto-advancement)
 */
function isWalkover(player) {
    if (!player) return false;

    return player.isBye === true ||
        player.name === 'Walkover' ||
        (player.id && player.id.toString().startsWith('walkover-'));
}

/**
 * AUTO-ADVANCEMENT: Real player vs Walkover = automatic win
 * FIXED: Handle walkover vs walkover matches
 */
function shouldAutoAdvance(match) {
    if (!match || match.completed) return false;
    if (!match.player1 || !match.player2) return false;

    // Never auto-advance TBD vs anything (TBD = waiting for opponent)
    if (match.player1.name === 'TBD' || match.player2.name === 'TBD') {
        return false;
    }

    const p1IsWalkover = isWalkover(match.player1);
    const p2IsWalkover = isWalkover(match.player2);

    // Auto-advance Real vs Walkover OR Walkover vs Walkover
    return (p1IsWalkover && !p2IsWalkover) || (!p1IsWalkover && p2IsWalkover) || (p1IsWalkover && p2IsWalkover);
}

/**
 * Processes all pending walkover matches where one player is a BYE.
 * Automatically advances real players past walkover opponents.
 * Skipped during rebuild operations to prevent transaction corruption.
 *
 * @returns {void}
 *
 * @description
 * - Iterates through all matches looking for walkover conditions
 * - Auto-completes matches where one player is BYE and one is real
 * - Uses completion type 'AUTO' to distinguish from manual completions
 * - Protected against recursive calls and rebuild interference
 */
function processAutoAdvancements() {
    if (!matches || matches.length === 0) return;

    // Skip auto-advancements during rebuild to prevent transaction corruption
    if (window.rebuildInProgress || window.autoAdvancementsDisabled) {
        console.log('🚫 processAutoAdvancements blocked during rebuild');
        return;
    }

    // Prevent recursive calls to avoid infinite loops
    if (window.processingAutoAdvancements) {
        console.log('🚫 processAutoAdvancements already running, skipping to prevent infinite loop');
        console.log('⚠️ Flag state check - processingAutoAdvancements:', window.processingAutoAdvancements);
        return;
    }

    // DEBUG: Log what triggered this auto-advancement
    console.log('⚡ processAutoAdvancements called - stack trace:', new Error().stack.substring(0, 500));

    // Set flag to prevent recursive calls
    window.processingAutoAdvancements = true;

    try {
        let foundAdvancement = true;
        let iterations = 0;
        const maxIterations = 10;

        const autoAdvancedMatches = [];

        while (foundAdvancement && iterations < maxIterations) {
            foundAdvancement = false;
            iterations++;

            matches.forEach(match => {
                if (shouldAutoAdvance(match)) {
                    // Determine automatic winner
                    const p1IsWalkover = isWalkover(match.player1);
                    const winnerPlayerNumber = p1IsWalkover ? 2 : 1;

                    // Mark as auto-advanced and complete
                    match.autoAdvanced = true;
                    autoAdvancedMatches.push(match.id);
                    completeMatch(match.id, winnerPlayerNumber, 0, 0, 'AUTO');
                    foundAdvancement = true;
                }
            });
        }

        if (autoAdvancedMatches.length > 0) {
            console.log(`Auto-advanced: ${autoAdvancedMatches.join(', ')} (${autoAdvancedMatches.length} matches)`);
        }
    } finally {
        // Always clear flag, even if function exits early
        console.log('🧹 Clearing processingAutoAdvancements flag');
        window.processingAutoAdvancements = false;
    }
}

/**
 * DEBUGGING: Reset stuck flags (can be called from browser console)
 */
function resetAutoAdvancementFlags() {
    console.log('🔧 Resetting auto-advancement flags');
    window.processingAutoAdvancements = false;
    window.rebuildInProgress = false;
    window.autoAdvancementsDisabled = false;
    console.log('✅ Flags reset');
}

// Make it globally available for debugging
if (typeof window !== 'undefined') {
    window.resetAutoAdvancementFlags = resetAutoAdvancementFlags;
}

/**
 * WINNER SELECTION
 */
function selectWinnerClean(matchId, playerNumber) {
    return validateAndShowWinnerDialog(matchId, playerNumber);
}

/**
 * DEBUG FUNCTION: Show progression for a specific match
 */
function debugProgression(matchId) {
    if (!tournament || !tournament.bracketSize) {
        console.log('No tournament active');
        return;
    }

    const progression = getProgressionTable();
    const rule = progression?.[matchId];

    if (rule) {
        console.log(`=== PROGRESSION FOR ${matchId} ===`);
        console.log(`Winner goes to: ${rule.winner?.[0]}.${rule.winner?.[1]}`);
        console.log(`Loser goes to: ${rule.loser?.[0]}.${rule.loser?.[1] || 'eliminated'}`);
    } else {
        console.log(`No progression rule for ${matchId}`);
    }
}

/**
 * DISABLE OLD PROGRESSION FUNCTIONS - Prevent conflicts with new system
 */
function disableOldProgressionSystem() {
    // Override old functions to prevent conflicts
    if (typeof window !== 'undefined') {
        window.advanceWinner = function () {
            console.log('Old advanceWinner disabled - using new lookup system');
        };
        window.advanceBacksideWinner = function () {
            console.log('Old advanceBacksideWinner disabled - using new lookup system');
        };
        window.dropFrontsideLoser = function () {
            console.log('Old dropFrontsideLoser disabled - using new lookup system');
        };
        window.processAutoAdvancementForMatch = function () {
            console.log('Old processAutoAdvancementForMatch disabled');
        };
        window.forceBacksideAutoAdvancement = function () {
            console.log('Old forceBacksideAutoAdvancement disabled');
        };
    }
}

// Disable old system immediately when this file loads
disableOldProgressionSystem();

/**
 * Generates the tournament bracket structure with optimized player placement.
 * Places real players first, walkovers (BYEs) last, ensuring no walkover vs walkover.
 *
 * @returns {boolean} True if bracket generated successfully, false on validation failure
 *
 * @description
 * - Validates minimum 4 players, maximum 32 players
 * - All players must be marked as paid
 * - Determines bracket size (8, 16, or 32) based on player count
 * - Creates all match objects for frontside, backside, and grand final
 * - Triggers auto-advancements for initial walkover matches
 * - Sets tournament status to 'active'
 *
 * @example
 * // Generate bracket after registering players
 * if (generateCleanBracket()) {
 *     console.log('Tournament started!');
 * }
 */
/**
 * Validates player count and shows bracket generation confirmation dialog.
 * Entry point for bracket generation — called from format selection cards in Setup Actions.
 *
 * @param {'DE'|'SE'} [format='DE'] - Tournament format
 * @returns {false} Always returns false (prevents form submission)
 */
function generateCleanBracket(format) {
    format = format || 'DE';

    if (!tournament) {
        alert('Please create a tournament first');
        return false;
    }

    // Check if bracket already exists
    if (tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return false;
    }

    const paidPlayers = players.filter(p => p.paid);

    // Check for unpaid players
    const unpaidPlayers = players.filter(p => !p.paid);
    if (unpaidPlayers.length > 0) {
        alert('All players must be marked as paid to generate bracket. Go to Player Registration to update payment status or remove players.');
        console.error(`Bracket generation blocked: ${unpaidPlayers.length} unpaid player(s) detected`);
        return false;
    }

    const formatInfo = typeof TOURNAMENT_FORMATS !== 'undefined' ? TOURNAMENT_FORMATS.find(f => f.id === format) : null;
    // Round Robin's limits follow its structure (one group: 3-8; groups and cups: 6-32)
    const limits = format === 'GROUPS' && typeof Groups !== 'undefined' ? Groups.limits() : formatInfo;
    const minPlayers = (limits && limits.minPlayers) || 4;
    if (limits && limits.maxPlayers && paidPlayers.length > limits.maxPlayers) {
        alert(`At most ${limits.maxPlayers} players can play ${formatInfo ? `a ${formatInfo.name} tournament` : 'this format'} as set up in Global Settings.`);
        return false;
    }
    if (paidPlayers.length < minPlayers) {
        alert(`At least ${minPlayers} paid players are required to draw ${formatInfo ? `a ${formatInfo.name} tournament` : 'the bracket'}.`);
        console.error(`Bracket generation blocked: fewer than ${minPlayers} paid players`);

        // HELP SYSTEM INTEGRATION
        if (typeof showHelpHint === 'function') {
            showHelpHint(`Need at least ${minPlayers} paid players to generate bracket. Add more players on Registration page.`, 5000);
        }
        return false;
    }

    // Double and single elimination: up to 48, the players above 32 through qualifiers
    const maxAll = format === 'GROUPS' ? 32 : (typeof Qualifiers !== 'undefined' ? Qualifiers.MAX_PLAYERS : 32);
    if (paidPlayers.length > maxAll) {
        alert(`Maximum ${maxAll} paid players supported. Please remove some players to generate bracket.`);
        console.error(`Bracket generation blocked: more than ${maxAll} paid players`);
        return false;
    }

    // Determine bracket size (format-aware: SE supports 2 and 4 player brackets; groups and cups:
    // the number of players drawn into the groups)
    const bracketSize = format === 'GROUPS' ? paidPlayers.length : calculateBracketSize(paidPlayers.length, format);
    const byeCount = bracketSize - paidPlayers.length; // negative above 32: that many qualifiers

    // Show confirmation dialog with player list
    showBracketConfirmation(paidPlayers, bracketSize, byeCount, format);
    return false;
}

/**
 * Shows bracket generation confirmation dialog with player cards.
 * Stores the chosen format in pendingFormat for confirmBracketGeneration() to read.
 *
 * @param {Array} paidPlayers - Array of paid player objects
 * @param {number} bracketSize - Bracket size (2, 4, 8, 16, 32)
 * @param {number} byeCount - Number of byes
 * @param {'DE'|'SE'} format - Tournament format
 */
function showBracketConfirmation(paidPlayers, bracketSize, byeCount, format) {
    pendingFormat = format;

    // Sidebar — bracket summary
    const groups = format === 'GROUPS';
    const single = groups && Groups.configSettings().structure === 'single';
    const formatLabel = groups ? (single ? 'Round Robin, one group' : 'Round Robin, groups and cups') : format === 'SE' ? 'Single Elimination' : 'Double Elimination';
    document.getElementById('bracketConfirmTitle').textContent = groups ? (single ? 'Draw the Group' : 'Draw the Groups') : `Generate ${formatLabel} Bracket`;
    document.getElementById('bracketConfirmName').textContent = (tournament && tournament.name) || '-';
    document.getElementById('bracketConfirmFormat').textContent = formatLabel;
    const sizeLabel = document.getElementById('bracketConfirmSizeLabel');
    if (sizeLabel) sizeLabel.textContent = groups ? (single ? 'Group' : 'Groups') : 'Bracket Size';
    document.getElementById('bracketConfirmSize').textContent = groups ? Groups.describeSizes(paidPlayers.length) : bracketSize;
    document.getElementById('bracketConfirmPlayerCount').textContent = paidPlayers.length;
    const desc = document.getElementById('bracketConfirmDesc');
    if (desc) desc.textContent = single
        ? `Everybody plays everybody, in a fixed order${Groups.seededDraw(paidPlayers) ? ' set by the ranking' : ' drawn at random'}. The table decides the placings.`
        : groups
        ? `These players will be drawn into groups${Groups.seededDraw(paidPlayers) ? ', by ranking' : ' at random'}. Everybody plays everybody in their group; ${Groups.configSettings().cupEntry === 'half' ? 'then the top half across the groups plays the A cup, the rest the B cup' : 'the top two of each group go on to the A cup, the rest to the B cup'}.`
        : paidPlayers.length > 32
        ? `${paidPlayers.length - 32} qualifier matches decide the last places in the 32-player bracket: ${2 * (paidPlayers.length - 32)} players are drawn into them, ${64 - paidPlayers.length} go straight into round 1. Lose a qualifier and you are not qualified (33rd); nothing in a qualifier counts.`
        : 'These players will be placed into the bracket. Make sure all players are registered before proceeding.';

    // Byes field is conditional — show only when there are byes; above 32 the same field says how
    // many qualifiers there are (the mirror of byes)
    const byesLabel = document.getElementById('bracketConfirmByesLabel');
    const byesValue = document.getElementById('bracketConfirmByes');
    if (byeCount !== 0 && !groups) {
        byesLabel.style.display = '';
        byesValue.style.display = '';
        byesLabel.textContent = byeCount > 0 ? 'Byes' : 'Qualifiers';
        byesValue.textContent = byeCount > 0 ? byeCount : `${-byeCount} (${-2 * byeCount} players)`;
    } else {
        byesLabel.style.display = 'none';
        byesValue.style.display = 'none';
    }

    // Render read-only player chips, sorted alphabetically. Safe DOM construction
    // (textContent for names) — no innerHTML interpolation.
    const playersEl = document.getElementById('bracketConfirmPlayers');
    playersEl.replaceChildren();
    const sorted = [...paidPlayers].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'bracket-confirm-player';
        chip.textContent = p.name;
        playersEl.appendChild(chip);
    });

    pushDialog('bracketConfirmModal', null, true);

    // Focus the Cancel button after dialog is shown
    const cancelBtn = document.querySelector('#bracketConfirmModal .btn:not(.btn-success)');
    if (cancelBtn) cancelBtn.focus();
}

/**
 * Executes bracket generation after user confirmation.
 * Reads pendingFormat (set by showBracketConfirmation) and stores it on the tournament object.
 */
function confirmBracketGeneration() {
    popDialog();

    const format = pendingFormat;
    const paidPlayers = players.filter(p => p.paid);

    // Groups and cups: the groups are drawn here, the cups later from the groups' results
    if (format === 'GROUPS') {
        drawGroups(paidPlayers);
        afterDraw();
        return true;
    }

    // Determine bracket size (format-aware)
    const bracketSize = calculateBracketSize(paidPlayers.length, format);

    // Create optimized bracket: real players first, walkovers strategically placed
    console.log(`Generating ${bracketSize}-player ${format} bracket for ${paidPlayers.length} players`);

    // Seeded when the operator asked for it in Match Controls (js/seeding.js); otherwise null
    let seeding = typeof Seeding !== 'undefined' ? Seeding.forDraw(paidPlayers, bracketSize) : null;
    // Qualifiers (33-48 players): the straight-in players are drawn into the 32 places as if there
    // were byes, and each gap becomes the place of a qualifier's winner (Docs/QUALIFIERS.md)
    let qualified = null;
    if (paidPlayers.length > 32 && typeof Qualifiers !== 'undefined') {
        qualified = Qualifiers.split(paidPlayers, seeding);
        seeding = qualified.seeding;
    }
    let bracket = createOptimizedBracketV2(qualified ? qualified.straightIn : paidPlayers, bracketSize, seeding);
    if (!bracket) {
        alert('Unable to generate a valid bracket without bye vs bye in Round 1. Please add more players or try again.');
        console.error('Bracket generation failed: createOptimizedBracketV2 returned null');
        return false;
    }

    let made = null;
    if (qualified) {
        const legs = format === 'SE' ? config.legs.seRegularRounds : config.legs.regularRounds;
        made = Qualifiers.fromBracket(bracket, qualified.qualifierPlayers, legs || 3, 1);
        bracket = made.bracket;
    }

    // Store bracket info
    tournament.bracket = bracket;
    tournament.bracketSize = bracketSize;
    tournament.format = format;
    if (seeding) tournament.seeding = seeding.record; // who was seeded, and from what (absent = a random draw)
    if (made) tournament.qualifiers = made.qualifiers; else delete tournament.qualifiers;
    delete tournament.notQualified;
    tournament.status = 'active';

    // Generate all match structures with clean TBD placeholders
    generateAllMatches(bracket, bracketSize);
    if (made) {
        // the qualifiers go first (Q1… are numbered 1…), the bracket's matches after them
        matches.forEach(m => { m.numericId += made.made.length; });
        matches.unshift(...made.made);
    }

    // Process initial auto-advancements (real vs walkover)
    // Skip during rebuild to prevent transaction corruption
    if (!window.rebuildInProgress) {
        processAutoAdvancements();
    }

    console.log(`✓ Clean bracket generated: ${bracketSize} positions, ${paidPlayers.length} real players`);
    afterDraw();
    return true;
}

/**
 * After a draw (any format): save, draw the bracket page, refresh results, Match Controls and
 * Registration, and go to the bracket page.
 * @returns {void}
 */
function afterDraw() {
    // Save and render
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    // Refresh results table immediately after bracket generation
    if (typeof displayResults === 'function') {
        displayResults();
    }

    // Refresh Match Controls if it's open to show new ACTIVE state
    const modal = document.getElementById('matchCommandCenterModal');
    if (modal &&
        (modal.style.display === 'flex' || modal.style.display === 'block') &&
        typeof showMatchCommandCenter === 'function') {
        setTimeout(() => {
            showMatchCommandCenter();
        }, 100);
    }

    if (typeof showPage === 'function') {
        showPage('tournament');
    }

    // Update Registration page layout (tournament now active)
    if (typeof updateRegistrationPageLayout === 'function') {
        updateRegistrationPageLayout();
    }

    // HELP SYSTEM INTEGRATION
    if (typeof onBracketGenerated === 'function') {
        onBracketGenerated();
    }
}

/** A player as a match slot holds it (as advancePlayer() places one). */
const _slotPlayer = p => ({ id: p.id, name: p.name, paid: p.paid, stats: p.stats });

/**
 * GROUPS AND CUPS: draw the groups and make every group match, in each group's fixed order
 * (GROUP_SCHEDULES) with its planned referee. Who goes into which group is Groups.drawGroups()
 * (snake order, by ranking when seeding is on). Sets the tournament's format, draw and status;
 * the caller saves. Docs/GROUPS-AND-CUPS.md
 * @param {Player[]} paid - everyone in the draw (all paid)
 * @returns {void}
 */
function drawGroups(paid) {
    const draw = Groups.drawGroups(paid);
    matches = [];
    let numericId = 1;
    draw.list.forEach(group => {
        roundRobinSchedule(group.players.length).forEach(([a, b, r], i) => {
            const ref = r ? group.players[r - 1] : null;
            matches.push({
                id: `${group.name}-${i + 1}`,
                numericId: numericId++,
                round: group.players.length === 4 ? Math.ceil((i + 1) / 2) : i + 1,
                side: 'group',
                group: group.name,
                player1: _slotPlayer(group.players[a - 1]),
                player2: _slotPlayer(group.players[b - 1]),
                winner: null,
                loser: null,
                lane: null,
                legs: (config.legs && config.legs.groupMatches) || 3,
                referee: null,
                plannedReferee: ref ? { player: ref.id } : null,
                active: false,
                completed: false,
                positionInRound: i
            });
        });
    });

    tournament.bracket = draw.order;            // the players in draw order: "the draw is made"
    tournament.bracketSize = paid.length;
    tournament.format = 'GROUPS';
    tournament.groups = { list: draw.list.map(g => ({ name: g.name, players: g.players.map(p => p.id) })), settings: draw.settings };
    delete tournament.cups;
    if (draw.seeding) tournament.seeding = draw.seeding; else delete tournament.seeding;
    tournament.status = 'active';
    console.log(`✓ Groups drawn: ${draw.list.map(g => `${g.name} (${g.players.length})`).join(', ')}; ${matches.length} group matches`);
}

/**
 * GROUPS AND CUPS: draw the cups once every group match is played. The fields and seeds come
 * from the group tables (Groups.cupFields()); each cup is single elimination seeded "All"
 * (placeSeededPlayers(), top seed v bottom seed, byes to the best seeds), its matches the SE
 * structure with cup IDs (cupMatchId). Recorded as a DRAW_CUPS transaction, which undoCupDraw()
 * removes again while no cup result has been entered. Docs/GROUPS-AND-CUPS.md
 * @param {boolean} playB - play the B cup (needs at least two players)
 * @returns {boolean} true when the cups were drawn
 */
function drawCups(playB) {
    if (getFormat() !== 'GROUPS' || tournament.cups || tournament.readOnly) return false;
    if (!Groups.allGroupsDone()) {
        alert('Every group match must be played before the cups are drawn.');
        return false;
    }
    const fields = Groups.cupFields();
    const cups = { bCup: !!playB && fields.B.length >= 2, A: null, B: null };
    let numericId = Math.max(0, ...matches.map(m => m.numericId || 0)) + 1;
    const made = [];

    ['A', 'B'].forEach(cup => {
        if (cup === 'B' && !cups.bCup) return;
        const size = calculateBracketSize(fields[cup].length, 'SE');
        // Round Robin → Group rematches: Avoid reorders the field so round 1 pairs players from different groups
        const field = (Groups.settings().rematches === 'avoid' ? Groups.avoidRematches(fields[cup], size) : fields[cup]).map(_slotPlayer);
        const bracket = placeSeededPlayers(field, size, field, true);
        cups[cup] = { size, seeds: field.map(p => p.id) };
        calculateCleanBracketStructure(size, 'SE').frontside.forEach((roundInfo, roundIndex) => {
            for (let i = 0; i < roundInfo.matches; i++) {
                const seId = `FS-${roundInfo.round}-${i + 1}`;
                // the cups' own lengths (Global Settings → Match length → Groups and cups)
                const legs = isSEFinalMatch(seId, size) ? config.legs.cupFinal
                    : isSEBronzeMatch(seId, size) ? config.legs.cupBronze
                    : isSESemifinal(seId, size) ? config.legs.cupSemifinal
                    : config.legs.cupRounds;
                const tbd = n => createTBDPlayer(`${cup.toLowerCase()}-${roundInfo.round}-${i}-${n}`);
                made.push({
                    id: cupMatchId(cup, seId, size),
                    seId,
                    numericId: numericId++,
                    round: roundInfo.round,
                    side: 'cup',
                    cup,
                    player1: roundIndex === 0 ? bracket[i * 2] : tbd(1),
                    player2: roundIndex === 0 ? bracket[i * 2 + 1] : tbd(2),
                    winner: null,
                    loser: null,
                    lane: null,
                    legs: legs || 3,
                    referee: null,
                    plannedReferee: null,
                    active: false,
                    completed: false,
                    positionInRound: i
                });
            }
        });
        Groups.planCupReferees(made.filter(m => m.cup === cup), size);
    });

    matches.push(...made);
    tournament.cups = cups;

    if (!window.rebuildInProgress) {
        saveTransaction({
            id: generateTransactionId(),
            type: 'DRAW_CUPS',
            description: `Cups drawn: A cup ${cups.A.seeds.length} players${cups.B ? `, B cup ${cups.B.seeds.length} players` : ', no B cup'}`,
            timestamp: new Date().toISOString(),
            cups: JSON.parse(JSON.stringify(cups))
        });
        processAutoAdvancements(); // round-1 walkovers, as in any draw
    }

    saveTournament();
    if (typeof renderBracket === 'function') renderBracket();
    if (typeof displayResults === 'function') displayResults();
    console.log(`✓ Cups drawn: A ${cups.A.size}${cups.B ? `, B ${cups.B.size}` : ', no B cup'}`);
    return true;
}

/**
 * CREATE OPTIMIZED BRACKET: Distributed random seeding to avoid bye-vs-bye in FS Round 1
 * - Step 1: Randomly distribute BYEs across FS-R1 matches (max 1 per match, random slot)
 * - Step 2: Fill remaining slots with shuffled real players
 *
 * Mathematical guarantee: min players = bracketSize/2, so max BYEs = bracketSize/2 = numMatches
 * This ensures we can always place max 1 BYE per match without BYE-vs-BYE scenarios
 *
 * Works for bracketSize 8, 16, 32
 *
 * With `seeding` (js/seeding.js), steps 1 and 2 are replaced by placeSeededPlayers(): the seeds
 * are kept apart and get the byes, everyone else is still random. Without it the draw is exactly
 * as before.
 *
 * @param {object[]} players - the players going into the draw
 * @param {number} bracketSize
 * @param {{seeds: object[], all: boolean}|null} [seeding] - seeds are player objects from `players`, best first; `all`: the mirror draw
 * @returns {Array|null} the bracket positions (position 2n and 2n+1 meet in FS-1-(n+1)), or null if invalid
 */
function createOptimizedBracketV2(players, bracketSize, seeding = null) {
    // Defensive checks
    if (!Array.isArray(players)) {
        console.error('createOptimizedBracketV2: players must be an array');
        return null;
    }
    if (![4, 8, 16, 32].includes(bracketSize)) {
        console.warn(`createOptimizedBracketV2: unexpected bracketSize=${bracketSize}; proceeding with distributed seeding`);
    }

    const P = players.length;
    const K = bracketSize;
    const numWalkovers = K - P;
    const numMatches = K / 2;

    console.log(`Creating bracket: ${P} real players, ${numWalkovers} walkovers, size=${K}`);

    // Assertion: numWalkovers <= numMatches (guaranteed by min 4 player requirement)
    if (numWalkovers > numMatches) {
        console.error(`IMPOSSIBLE: ${numWalkovers} walkovers exceeds ${numMatches} matches`);
        return null;
    }

    let bracket;
    if (seeding && Array.isArray(seeding.seeds) && seeding.seeds.length >= 2) {
        bracket = placeSeededPlayers(players, K, seeding.seeds, !!seeding.all);
    } else {
        // Shuffle players to ensure randomness
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

        // Initialize bracket with null slots
        bracket = new Array(K).fill(null);
        const matchesWithBye = new Set();

        // Step 1: Randomly distribute BYEs across matches
        let byesPlaced = 0;
        while (byesPlaced < numWalkovers) {
            // Pick a random match that doesn't have a BYE yet
            const matchIndex = Math.floor(Math.random() * numMatches);

            if (matchesWithBye.has(matchIndex)) continue;

            matchesWithBye.add(matchIndex);

            // Randomly choose player1 (0) or player2 (1) slot within this match
            const slotInMatch = Math.random() < 0.5 ? 0 : 1;
            const bracketPosition = matchIndex * 2 + slotInMatch;

            bracket[bracketPosition] = createWalkoverPlayer(bracketPosition);
            byesPlaced++;
        }

        // Step 2: Fill remaining slots with shuffled players
        let playerIndex = 0;
        for (let i = 0; i < K; i++) {
            if (bracket[i] === null) {
                bracket[i] = shuffledPlayers[playerIndex++];
            }
        }
    }

    // Sanity validation: ensure no FS-1 bye-vs-bye (should be impossible with this algorithm)
    const firstRoundMatches = K / 2;
    let invalidPairs = 0;
    for (let m = 0; m < firstRoundMatches; m++) {
        const a = bracket[m * 2];
        const b = bracket[m * 2 + 1];
        const aIsBye = isWalkover ? isWalkover(a) : a?.isBye === true || a?.name === 'Walkover';
        const bIsBye = isWalkover ? isWalkover(b) : b?.isBye === true || b?.name === 'Walkover';
        if (aIsBye && bIsBye) invalidPairs++;
    }

    if (invalidPairs > 0) {
        // This should NEVER happen with distributed seeding
        console.error(`ALGORITHM BUG: ${invalidPairs} bye-vs-bye pairs detected in FS-1!`);
        return null;
    }

    console.log(`✓ Distributed seeding completed: ${numWalkovers} BYEs randomly placed across ${numMatches} matches`);
    return bracket;
}

/**
 * PLACE A SEEDED DRAW: the bracket positions when the best players are seeded.
 *
 * The seeds are spread over equal segments of the bracket (the number of seeds rounded up to
 * a power of two). Seed 1 is at the very top and seed 2 at the very bottom (the two halves);
 * seeds 3 and 4 take the two middle quarters in random order; seeds 5-8 take what is left of
 * the eighths in random order, and so on, so seeds never meet in round 1. Inside its segment a
 * seed sits where the draw puts it (seed 1 and 2 at the ends). The best seeds get the byes, in
 * rank order; any byes beyond the seeds go to matches without a seed first. Everyone else fills
 * what is left, shuffled.
 *
 * With `all`, every ranked player is a seed and round 1 is the mirror draw: seed 1 meets the last
 * seed, seed 2 the second-last, and so on. The players without a ranking take the leftover
 * seed numbers at random, and the numbers beyond the players are the byes, which are therefore
 * the top seeds' (no unseeded player gets a bye while there is a seed without one).
 *
 * Only the layout: who the seeds are is decided in js/seeding.js, and what happens after
 * round 1 is the progression tables'.
 *
 * @param {object[]} players - everyone going into the draw (the seeds among them)
 * @param {number} K - bracket size
 * @param {object[]} seeds - the seeds, best first; at least 2
 * @param {boolean} all - every ranked player is seeded: the mirror draw
 * @returns {Array} K positions, byes as walkover players
 */
function placeSeededPlayers(players, K, seeds, all) {
    const numMatches = K / 2;
    const numWalkovers = K - players.length;
    const rand = n => Math.floor(Math.random() * n);
    const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

    // the segment (0 = top) of each seed, best first, when the bracket is cut into n segments
    const segmentsFor = n => {
        let segment = [0, 1];
        for (let m = 2; m < n; m *= 2) {
            const split = segment.map((s, i) => i === 0 ? 2 * s : i === 1 ? 2 * s + 1 : 2 * s + rand(2));
            const free = [];
            for (let s = 0; s < 2 * m; s++) if (!split.includes(s)) free.push(s);
            segment = split.concat(shuffle(free));
        }
        return segment;
    };

    const bracket = new Array(K).fill(null);

    if (all) {
        // seed numbers 1..K: the ranked players, then the others at random, then the byes
        const field = seeds.concat(shuffle(players.filter(p => !seeds.includes(p))));
        const at = i => field[i] || null;
        const matchOf = segmentsFor(numMatches);
        for (let i = 0; i < numMatches; i++) {
            const slot = i === 0 ? 0 : i === 1 ? 1 : rand(2);
            const top = 2 * matchOf[i] + slot, low = 2 * matchOf[i] + 1 - slot;
            bracket[top] = at(i);
            bracket[low] = at(K - 1 - i) || createWalkoverPlayer(low);
        }
        return bracket;
    }

    let n = 2;
    while (n < seeds.length) n *= 2;
    const segment = segmentsFor(n);
    const size = K / n;
    const seedMatch = new Set();
    seeds.forEach((seed, i) => {
        const position = i === 0 ? 0 : i === 1 ? K - 1 : segment[i] * size + rand(size);
        bracket[position] = seed;
        seedMatch.add(Math.floor(position / 2));
    });

    // byes: one per match, in the slot the seed (if any) is not in
    const byeMatch = new Set();
    let byes = numWalkovers;
    const placeBye = m => {
        const free = [2 * m, 2 * m + 1].filter(p => bracket[p] === null);
        const position = free[rand(free.length)];
        bracket[position] = createWalkoverPlayer(position);
        byeMatch.add(m);
        byes--;
    };
    for (const seed of seeds) {
        if (byes <= 0) break;
        placeBye(Math.floor(bracket.indexOf(seed) / 2));
    }
    const open = [...Array(numMatches).keys()].filter(m => !byeMatch.has(m));
    shuffle(open.filter(m => !seedMatch.has(m))).concat(shuffle(open.filter(m => seedMatch.has(m))))
        .forEach(m => { if (byes > 0) placeBye(m); });

    const others = shuffle(players.filter(p => !seeds.includes(p)));
    let next = 0;
    for (let i = 0; i < K; i++) if (bracket[i] === null) bracket[i] = others[next++];
    return bracket;
}

/**
 * CREATE WALKOVER PLAYER OBJECT
 */
function createWalkoverPlayer(index) {
    return {
        id: `walkover-${index}`,
        name: 'Walkover',
        isBye: true
    };
}

/**
 * GENERATE ALL MATCHES WITH CLEAN TBD PLACEHOLDERS
 */
function generateAllMatches(bracket, bracketSize) {
    matches = []; // Clear existing matches
    const format = getFormat();

    const structure = calculateCleanBracketStructure(bracketSize);
    let matchId = 1;

    console.log(`Generating ${format} frontside matches...`);
    generateFrontsideMatches(bracket, structure, matchId);

    if (format === 'DE') {
        matchId = matches.length + 1;
        console.log('Generating backside matches...');
        generateBacksideMatches(structure, matchId);

        matchId = matches.length + 1;
        console.log('Generating final matches...');
        generateFinalMatches(matchId);
    }
    // SE bronze + final rounds are included in the frontside structure
    // (added by calculateCleanBracketStructure), so no extra generation needed

    console.log(`✓ Generated ${matches.length} ${format} matches total`);
}

/**
 * CALCULATE CLEAN BRACKET STRUCTURE (rounds and matches per round)
 */
function calculateCleanBracketStructure(bracketSize, format = getFormat()) {
    // SE structures are fully hardcoded — bracketSize equals total match count.
    // Last natural frontside round (1 match) is the bronze final; one extra round
    // is added for the championship final. (A groups and cups tournament asks for 'SE' for its cups.)
    if (format === 'SE') {
        const seStructures = {
            4:  { frontsideRounds: 2, frontside: [{ round: 1, matches: 2 }, { round: 2, matches: 1 }, { round: 3, matches: 1 }], backside: [] },
            8:  { frontsideRounds: 3, frontside: [{ round: 1, matches: 4 }, { round: 2, matches: 2 }, { round: 3, matches: 1 }, { round: 4, matches: 1 }], backside: [] },
            16: { frontsideRounds: 4, frontside: [{ round: 1, matches: 8 }, { round: 2, matches: 4 }, { round: 3, matches: 2 }, { round: 4, matches: 1 }, { round: 5, matches: 1 }], backside: [] },
            32: { frontsideRounds: 5, frontside: [{ round: 1, matches: 16 }, { round: 2, matches: 8 }, { round: 3, matches: 4 }, { round: 4, matches: 2 }, { round: 5, matches: 1 }, { round: 6, matches: 1 }], backside: [] }
        };
        return seStructures[bracketSize];
    }

    // DE: derive frontside dynamically; backside is hardcoded per bracket size.
    const frontsideRounds = Math.ceil(Math.log2(bracketSize));

    const frontside = [];
    for (let round = 1; round <= frontsideRounds; round++) {
        frontside.push({ round, matches: Math.pow(2, frontsideRounds - round) });
    }

    let backside = [];
    if (bracketSize === 8) {
        backside = [
            { round: 1, matches: 2 },
            { round: 2, matches: 2 },
            { round: 3, matches: 1 }
        ];
    } else if (bracketSize === 16) {
        backside = [
            { round: 1, matches: 4 },
            { round: 2, matches: 4 },
            { round: 3, matches: 2 },
            { round: 4, matches: 2 },
            { round: 5, matches: 1 }
        ];
    } else if (bracketSize === 32) {
        backside = [
            { round: 1, matches: 8 },
            { round: 2, matches: 8 },
            { round: 3, matches: 4 },
            { round: 4, matches: 4 },
            { round: 5, matches: 2 },
            { round: 6, matches: 2 },
            { round: 7, matches: 1 }
        ];
    }

    return { frontside, backside, frontsideRounds };
}

/**
 * GENERATE FRONTSIDE MATCHES
 */
function generateFrontsideMatches(bracket, structure, startId) {
    let numericId = startId;

    structure.frontside.forEach((roundInfo, roundIndex) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            let player1, player2;

            if (roundIndex === 0) {
                // First round: use actual players from bracket
                const playerIndex = matchIndex * 2;
                player1 = bracket[playerIndex] || createTBDPlayer(`fs-1-${matchIndex}-1`);
                player2 = bracket[playerIndex + 1] || createTBDPlayer(`fs-1-${matchIndex}-2`);
            } else {
                // Later rounds: TBD players (winners from previous rounds)
                player1 = createTBDPlayer(`fs-${roundInfo.round}-${matchIndex}-1`);
                player2 = createTBDPlayer(`fs-${roundInfo.round}-${matchIndex}-2`);
            }

            // Determine leg count based on match type
            let legCount;
            const matchId = `FS-${roundInfo.round}-${matchIndex + 1}`;
            const format = getFormat();

            if (format === 'SE') {
                if (isSEFinalMatch(matchId, tournament.bracketSize)) {
                    legCount = config.legs.seFinal;
                } else if (isSEBronzeMatch(matchId, tournament.bracketSize)) {
                    legCount = config.legs.seBronze;
                } else if (isSESemifinal(matchId, tournament.bracketSize)) {
                    legCount = config.legs.seSemifinal;
                } else if (isSEQuarterfinal(matchId, tournament.bracketSize)) {
                    legCount = config.legs.seQuarterfinal;
                } else {
                    legCount = config.legs.seRegularRounds;
                }
            } else if (isFrontsideSemifinal(matchId, tournament.bracketSize)) {
                legCount = config.legs.frontsideSemifinal;
            } else {
                legCount = config.legs.regularRounds;
            }

            const match = {
                id: matchId,
                numericId: numericId++,
                round: roundInfo.round,
                side: 'frontside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: null,
                legs: legCount,
                referee: null,
                active: false,
                completed: false,
                positionInRound: matchIndex
            };

            matches.push(match);
        }
    });
}

/**
 * GENERATE BACKSIDE MATCHES
 */
function generateBacksideMatches(structure, startId) {
    let numericId = startId;

    structure.backside.forEach((roundInfo) => {
        for (let matchIndex = 0; matchIndex < roundInfo.matches; matchIndex++) {
            // All backside matches start with TBD players
            const player1 = createTBDPlayer(`bs-${roundInfo.round}-${matchIndex}-1`);
            const player2 = createTBDPlayer(`bs-${roundInfo.round}-${matchIndex}-2`);

            // Determine leg count based on match type
            let legCount;
            const matchId = `BS-${roundInfo.round}-${matchIndex + 1}`;

            if (isBacksideSemifinal(matchId, tournament.bracketSize)) {
                legCount = config.legs.backsideSemifinal;
            } else {
                legCount = config.legs.regularRounds;
            }

            const match = {
                id: matchId,
                numericId: numericId++,
                round: roundInfo.round,
                side: 'backside',
                player1: player1,
                player2: player2,
                winner: null,
                loser: null,
                lane: null,
                legs: legCount,
                referee: null,
                active: false,
                completed: false,
                positionInRound: matchIndex
            };

            matches.push(match);
        }
    });
}

/**
 * GENERATE FINAL MATCHES
 */
function generateFinalMatches(startId) {
    // Backside Final
    const backsideFinal = {
        id: 'BS-FINAL',
        numericId: startId,
        round: 'final',
        side: 'backside-final',
        player1: createTBDPlayer('bs-final-1'),
        player2: createTBDPlayer('bs-final-2'),
        winner: null,
        loser: null,
        lane: null,
        legs: config.legs.backsideFinal,
        referee: null,
        active: false,
        completed: false
    };

    // Grand Final
    const grandFinal = {
        id: 'GRAND-FINAL',
        numericId: startId + 1,
        round: 'grand-final',
        side: 'grand-final',
        player1: createTBDPlayer('grand-final-1'),
        player2: createTBDPlayer('grand-final-2'),
        winner: null,
        loser: null,
        lane: null,
        legs: config.legs.grandFinal,
        referee: null,
        active: false,
        completed: false
    };

    matches.push(backsideFinal);
    matches.push(grandFinal);
}

// generateBronzeMatch() removed — bronze is now a regular FS round match
// generated by generateFrontsideMatches() via calculateCleanBracketStructure()

/**
 * CREATE TBD PLAYER OBJECT
 */
function createTBDPlayer(id) {
    return {
        id: id,
        name: 'TBD'
    };
}

/**
 * TOGGLE MATCH ACTIVE STATE - Simple match activation/deactivation
 */
function toggleActive(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    const currentState = getMatchState(match);

    // Can only toggle between READY and LIVE states
    if (currentState === 'pending') {
        alert('Cannot start match: Players not yet determined');
        return false;
    }

    if (currentState === 'completed') {
        alert('Match is already completed');
        return false;
    }

    // Capture state before change for transaction
    const wasActive = match.active;

    // Toggle active state
    match.active = !match.active;

    console.log(`Match ${matchId} ${match.active ? 'activated' : 'deactivated'}`);

    // Anchor achievement snapshot on Start Match.
    // Captures both players' stats at the moment the match becomes active — this is
    // the baseline for the achievement diff computed on Confirm Winner. Overwritten on
    // every Start; any pending uncommitted stats from a previous winner-confirm session
    // have already been rolled back (Cancel/Esc → handleCancel restorePlayerStats).
    if (match.active && !window.rebuildInProgress) {
        match.preMatchSnapshot = {};
        [match.player1, match.player2].forEach(p => {
            if (!p || !p.id) return;
            const player = players.find(pl => String(pl.id) === String(p.id));
            if (player) match.preMatchSnapshot[player.id] = snapshotPlayerStats(player);
        });
    }

    // Create transaction for match state change
    if (!window.rebuildInProgress) {
        const transaction = {
            id: generateTransactionId(),
            type: match.active ? 'START_MATCH' : 'STOP_MATCH',
            description: `${matchId}: ${match.active ? 'Started' : 'Stopped'}`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            beforeState: { active: wasActive },
            afterState: { active: match.active }
        };

        saveTransaction(transaction);
    }

    // Save and render
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    return true;
}

/**
 * TOGGLE ACTIVE WITH VALIDATION - Wrapper that validates referee conflicts before toggling
 * @param {string} matchId - The match ID to toggle
 * @returns {boolean} - True if successful, false if validation failed
 */
function toggleActiveWithValidation(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    const currentState = getMatchState(match);

    // Only validate when trying to START a match (transition from ready to live)
    // Don't validate when stopping a match
    if (currentState === 'ready') {
        // A player can't be on two boards at once. Only possible in a group stage, where every
        // match's players are known from the start.
        const playing = typeof getPlayersInLiveMatches === 'function' ? getPlayersInLiveMatches(matchId) : [];
        const busy = [match.player1, match.player2].filter(p => p && playing.includes(parseInt(p.id))).map(p => p.name);
        if (busy.length) {
            alert(`Cannot start match: ${busy.join(' and ')} ${busy.length > 1 ? 'are' : 'is'} playing another match`);
            return false;
        }
        // Groups and cups: a referee chosen before the start must be free when it starts (a referee is
        // only taken while their match is live, so the choice itself didn't check)
        if (getFormat() === 'GROUPS' && match.referee && typeof isPlayerAvailableAsReferee === 'function' &&
            !isPlayerAvailableAsReferee(match.referee, matchId)) {
            const ref = players.find(p => String(p.id) === String(match.referee));
            alert(`Cannot start match: the referee${ref ? `, ${ref.name},` : ''} is playing or refereeing another match. Choose another referee, or wait.`);
            return false;
        }

        // Check for referee conflicts using shared utility function
        if (typeof checkRefereeConflict === 'function') {
            const conflictInfo = checkRefereeConflict(matchId);
            if (conflictInfo.hasConflict) {
                const playerNames = conflictInfo.conflictedPlayers.join(' and ');
                alert(`Cannot start match: ${playerNames} is currently refereeing another match`);
                return false;
            }
        }
    }

    // A planned referee (groups and cups) is filled in as the match starts, when no one has been
    // chosen and they are free; otherwise the operator picks one, as always
    if (currentState === 'ready' && !match.referee && typeof Groups !== 'undefined') {
        const planned = Groups.plannedRefereeFor(match);
        if (planned && isPlayerAvailableAsReferee(planned.id, matchId)) updateMatchReferee(matchId, planned.id);
    }

    // If validation passes (or we're stopping a match), call base toggle function
    return toggleActive(matchId);
}

/**
 * SIMPLE MATCH STATE GETTER - Determines current match state
 */
function getMatchState(match) {
    if (!match) return 'pending';

    if (match.completed) return 'completed';
    if (match.active) return 'live';

    // Check if both players are ready (not TBD or walkover)
    if (canMatchStart(match)) return 'ready';

    return 'pending';
}

/**
 * CHECK IF MATCH CAN START - Both players must be real
 */
function canMatchStart(match) {
    if (!match || !match.player1 || !match.player2) return false;

    const player1Valid = match.player1.name !== 'TBD' && !match.player1.isBye;
    const player2Valid = match.player2.name !== 'TBD' && !match.player2.isBye;

    return player1Valid && player2Valid;
}

/**
 * UPDATE MATCH LANE - Simple lane assignment
 */
function updateMatchLane(matchId, newLane) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    // Capture state before change for transaction
    const oldLane = match.lane;
    const parsedNewLane = newLane ? parseInt(newLane) : null;

    match.lane = parsedNewLane;

    console.log(`Lane updated for ${matchId}: ${match.lane || 'none'}`);

    // Create transaction for lane assignment
    if (!window.rebuildInProgress) {
        const transaction = {
            id: generateTransactionId(),
            type: 'ASSIGN_LANE',
            description: `${matchId}: Lane ${parsedNewLane ? `assigned to ${parsedNewLane}` : 'cleared'}`,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            afterState: { lane: parsedNewLane } // Keep for potential future analytics/audit trail
            // beforeState removed - never used by undo system
        };

        saveTransaction(transaction);
    }

    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // Refresh all lane dropdowns to update conflict detection
    if (typeof refreshAllLaneDropdowns === 'function') {
        refreshAllLaneDropdowns();
    }

    // Redraw the bracket so the match's lane label (L1, L2 …) shows the new lane
    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    // Refresh Match Controls if it's open
    const modal = document.getElementById('matchCommandCenterModal');
    if (modal &&
        (modal.style.display === 'flex' || modal.style.display === 'block') &&
        typeof showMatchCommandCenter === 'function') {
        setTimeout(() => {
            showMatchCommandCenter();
        }, 200);
    }

    return true;
}

/**
 * DEBUG: Show bracket generation results
 */
function debugBracketGeneration() {
    if (!tournament || !tournament.bracket) {
        console.log('No bracket generated yet');
        return;
    }

    console.log('=== BRACKET GENERATION DEBUG ===');
    console.log(`Bracket size: ${tournament.bracketSize}`);
    console.log(`Total matches: ${matches.length}`);

    // Show first round matches
    const firstRound = matches.filter(m => m.side === 'frontside' && m.round === 1);
    console.log(`First round matches: ${firstRound.length}`);

    firstRound.forEach(match => {
        const p1 = match.player1?.name || 'Empty';
        const p2 = match.player2?.name || 'Empty';
        const p1Type = isWalkover(match.player1) ? 'WALKOVER' : 'REAL';
        const p2Type = isWalkover(match.player2) ? 'WALKOVER' : 'REAL';

        console.log(`${match.id}: ${p1} (${p1Type}) vs ${p2} (${p2Type})`);
    });

    // Check for auto-advancement opportunities
    const autoAdvanceMatches = matches.filter(shouldAutoAdvance);
    console.log(`Matches ready for auto-advancement: ${autoAdvanceMatches.length}`);
}

/**
 * Enhanced showWinnerConfirmation with proper leg score validation
 * Replaces the existing function in clean-match-progression.js
 */

/**
 * Build the match-progression block shown in the winner confirmation body.
 * Safe — all player names and destinations go in via textContent.
 */
function _buildWinnerProgressionBlock(matchId, winner, loser, progression) {
    const block = document.createElement('div');
    block.className = 'winner-progression';

    const title = document.createElement('div');
    title.className = 'winner-progression__title';
    title.textContent = 'Match Progression';
    block.appendChild(title);

    // Winner line
    const winnerLine = document.createElement('div');
    winnerLine.className = 'winner-progression__winner';
    const wName = document.createElement('strong');
    wName.textContent = winner.name;
    winnerLine.appendChild(wName);
    // groups and cups: each cup's bronze and final decide places (getPlayerProgressionForDisplay)
    const cupEnd = getFormat() === 'GROUPS' && /^[AB]-[FB]$/.test(matchId) && typeof getPlayerProgressionForDisplay === 'function';
    if (cupEnd) {
        winnerLine.appendChild(document.createTextNode(' ' + getPlayerProgressionForDisplay(winner.id, matchId, true)));
    } else if (progression.winner) {
        winnerLine.appendChild(document.createTextNode(' advances to '));
        const dest = document.createElement('strong');
        dest.textContent = progression.winner[0];
        winnerLine.appendChild(dest);
    } else {
        winnerLine.appendChild(document.createTextNode(' wins the tournament!'));
    }
    block.appendChild(winnerLine);

    // Loser line
    const loserLine = document.createElement('div');
    loserLine.className = 'winner-progression__loser';
    const lName = document.createElement('strong');
    lName.textContent = loser.name;
    loserLine.appendChild(lName);
    if (cupEnd) {
        loserLine.appendChild(document.createTextNode(' ' + getPlayerProgressionForDisplay(loser.id, matchId, false)));
    } else if (progression.loser) {
        loserLine.appendChild(document.createTextNode(' moves to '));
        const dest = document.createElement('strong');
        dest.textContent = progression.loser[0];
        loserLine.appendChild(dest);
    } else if (typeof Qualifiers !== 'undefined' && Qualifiers.isQualifierId(matchId)) {
        loserLine.appendChild(document.createTextNode(' is not qualified ('));
        const rankText = document.createElement('strong');
        rankText.textContent = formatRanking(33);
        loserLine.appendChild(rankText);
        loserLine.appendChild(document.createTextNode(')'));
    } else {
        const rank = typeof getEliminationRankForMatch === 'function'
            ? getEliminationRankForMatch(matchId, tournament.bracketSize)
            : null;
        if (rank && typeof formatRanking === 'function') {
            loserLine.appendChild(document.createTextNode(' is placed '));
            const rankText = document.createElement('strong');
            rankText.textContent = formatRanking(rank);
            loserLine.appendChild(rankText);
        } else {
            loserLine.appendChild(document.createTextNode(' is eliminated'));
        }
    }
    block.appendChild(loserLine);

    // a qualifier only decides who gets to play (Docs/QUALIFIERS.md)
    if (typeof Qualifiers !== 'undefined' && Qualifiers.isQualifierId(matchId)) {
        const note = document.createElement('div');
        note.className = 'winner-progression__note';
        note.textContent = 'A qualifier: only the score is kept, to decide who goes through. No achievements, and no matches or legs in the statistics.';
        block.appendChild(note);
    }

    return block;
}

function showWinnerConfirmation(matchId, winner, loser, onConfirm) {
    const modal = document.getElementById('winnerConfirmModal');
    const body = document.getElementById('winnerConfirmBody');
    const cancelBtn = document.getElementById('winnerConfirmCancel');
    const confirmBtn = document.getElementById('winnerConfirmOK');

    if (!modal || !body || !cancelBtn || !confirmBtn) {
        console.error('Winner confirmation modal elements not found');
        return false;
    }

    // Sidebar — match metadata + Edit Statistics links (safe via textContent)
    document.getElementById('winnerSidebarMatch').textContent = matchId;
    document.getElementById('winnerSidebarBracket').textContent = _bracketLabel(matchId);
    const winnerLink = document.getElementById('winnerStatsLink');
    winnerLink.textContent = winner.name;
    winnerLink.onclick = () => openStatsModalFromConfirmation(winner.id, matchId);
    const loserLink = document.getElementById('loserStatsLink');
    loserLink.textContent = loser.name;
    loserLink.onclick = () => openStatsModalFromConfirmation(loser.id, matchId);
    // a qualifier: no statistics to edit (nothing in a qualifier counts)
    const isQualifier = typeof Qualifiers !== 'undefined' && Qualifiers.isQualifierId(matchId);
    const statsStack = winnerLink.parentElement;
    statsStack.style.display = isQualifier ? 'none' : '';
    if (statsStack.previousElementSibling) statsStack.previousElementSibling.style.display = isQualifier ? 'none' : '';

    // Title — "{winner} beats {loser}"
    document.getElementById('winnerConfirmDialogTitle').textContent = `${winner.name} beats ${loser.name}`;

    // Body — progression block only (declaration and hint live in title / sidebar now)
    body.replaceChildren();
    const progressionTable = getProgressionTable();
    const progression = progressionTable && progressionTable[matchId];
    if (progression) {
        body.appendChild(_buildWinnerProgressionBlock(matchId, winner, loser, progression));
    } else if (getFormat() === 'GROUPS' && typeof Groups !== 'undefined' && Groups.isGroupId(matchId)) {
        // a group match moves no one on: the result goes into the group table
        const block = document.createElement('div');
        block.className = 'winner-progression';
        const title = document.createElement('div');
        title.className = 'winner-progression__title';
        title.textContent = Groups.roundName(matchId);
        const line = document.createElement('div');
        line.textContent = 'The result goes into the group table; the legs count for the table too.';
        block.append(title, line);
        body.appendChild(block);
    }

    // Populate leg score fields
    const match = matches.find(m => m.id === matchId);
    const winnerNameSpan = document.getElementById('winnerNameForLegs');
    const loserNameSpan = document.getElementById('loserNameForLegs');
    const winnerLegsInput = document.getElementById('winnerLegs');
    const loserLegsInput = document.getElementById('loserLegs');
    const validationMessage = document.getElementById('legValidationMessage');

    if (winnerNameSpan) winnerNameSpan.textContent = winner.name;
    if (loserNameSpan) loserNameSpan.textContent = loser.name;

    // Pre-fill winner legs based on match format
    if (winnerLegsInput && match) {
        const matchLegs = match.legs || 3;
        const minToWin = Math.ceil(matchLegs / 2);
        winnerLegsInput.value = minToWin;
        winnerLegsInput.max = matchLegs;
    }

    // Set up loser legs
    if (loserLegsInput) {
        loserLegsInput.value = 0;
        if (match) {
            loserLegsInput.max = Math.max(0, match.legs - 1); // Max legs loser can have (0 for Bo1)
        }
    }

    // Clear any existing validation message
    if (validationMessage) {
        validationMessage.style.display = 'none';
    }

    // Set match ID on scan button so openResultQRScanner() knows which match to validate against.
    // Hidden unless the Chalker handover is set to QR (see getChalkerHandover()).
    const scanBtn = document.getElementById('scanResultQRBtn');
    if (scanBtn) {
        scanBtn.dataset.matchId = matchId;
        const _qrMode = (typeof getChalkerHandover !== 'function') || getChalkerHandover() === 'qr';
        scanBtn.style.display = _qrMode ? '' : 'none';
    }

    // Use the match-anchored snapshot recorded at Start Match (toggleActive).
    // This is the reliable baseline for the achievement diff — it can't drift like the
    // old "snapshot at dialog open" approach did.
    //
    // Fallback: if the snapshot is missing (match started before this feature, or some
    // unusual code path), take one now. The diff then only captures stats added from this
    // point forward — same behavior as the old approach, so the dialog still works.
    const matchObj = matches.find(m => m.id === matchId);
    if (matchObj && !matchObj.preMatchSnapshot) {
        matchObj.preMatchSnapshot = {
            [winner.id]: snapshotPlayerStats(winner),
            [loser.id]: snapshotPlayerStats(loser)
        };
    }
    // _completionSnapshot is now a pointer into the match-anchored snapshot.
    // renderCompletionAchievements, handleConfirm, and handleCancel all read through it
    // unchanged.
    _completionSnapshot = matchObj ? matchObj.preMatchSnapshot : null;

    // Use dialog stack to show modal.
    // enableEsc=false because handleKeyPress (above) handles Esc itself — routing it through
    // handleCancel so stats added in this session are rolled back. If we let the stack's
    // own Esc handler fire, the dialog would just pop without cleanup, leaving the snapshot
    // stale for the next open.
    pushDialog('winnerConfirmModal', () => {
        const modal = document.getElementById('winnerConfirmModal');
        if (modal) modal.style.display = 'block';
    }, false);

    // Hide any stale achievements box from a previous open of this dialog
    const summaryBox = document.getElementById('completionAchievementsSummary');
    if (summaryBox) summaryBox.style.display = 'none';

    // Focus cancel button by default
    setTimeout(() => {
        cancelBtn.focus();
        cancelBtn.style.boxShadow = '0 0 0 3px rgba(108, 117, 125, 0.3)';
        cancelBtn.style.transform = 'scale(1.05)';
    }, 100);

    // Add real-time validation to input fields
    const validateInputs = () => {
        const winnerLegs = parseInt(winnerLegsInput?.value) || 0;
        const loserLegs = parseInt(loserLegsInput?.value) || 0;
        const matchLegs = match?.legs || 3;

        return validateLegScores(winnerLegs, loserLegs, matchLegs);
    };

    // Add input event listeners for real-time validation.
    // Named handler stored on the modal (like _cancelHandler) so it can be removed
    // in cleanup and on re-open — anonymous handlers accumulated across opens.
    const handleLegsInput = () => {
        const validation = validateInputs();
        updateValidationDisplay(validation);
        confirmBtn.disabled = !validation.valid;
    };

    if (modal._legsInputHandler) {
        if (winnerLegsInput) winnerLegsInput.removeEventListener('input', modal._legsInputHandler);
        if (loserLegsInput) loserLegsInput.removeEventListener('input', modal._legsInputHandler);
    }
    modal._legsInputHandler = handleLegsInput;

    if (winnerLegsInput) {
        winnerLegsInput.addEventListener('input', handleLegsInput);
    }

    if (loserLegsInput) {
        loserLegsInput.addEventListener('input', handleLegsInput);
    }

    // Handle button clicks
    const handleCancel = () => {
        // Restore stats to the match's anchored baseline (Start Match snapshot).
        // The snapshot lives on match.preMatchSnapshot and stays there — it'll be the
        // baseline for the next Confirm Winner attempt on this same match. The global
        // _completionSnapshot is just a pointer; don't null it out.
        if (_completionSnapshot) {
            [winner, loser].forEach(p => {
                const snap = _completionSnapshot[p.id];
                if (!snap) return;
                const player = players.find(pl => String(pl.id) === String(p.id));
                if (player) restorePlayerStats(player, snap);
            });
            saveTournament();
        }
        console.log(`Winner selection cancelled for match ${matchId}`);
        cleanup();
        popDialog(); // Use dialog stack to close and restore parent
    };

    const handleConfirm = () => {
        const winnerLegs = parseInt(winnerLegsInput?.value) || 0;
        const loserLegs = parseInt(loserLegsInput?.value) || 0;
        const matchLegs = match?.legs || 3;

        // Final validation before confirming
        const validation = validateLegScores(winnerLegs, loserLegs, matchLegs);

        if (!validation.valid) {
            showValidationError(validation.error);
            return;
        }

        // Compute achievement delta from the match-anchored snapshot.
        // The snapshot stays on match.preMatchSnapshot as audit data — useful if anyone
        // inspects the match record later. The global _completionSnapshot pointer is
        // harmless to leave dangling (it'll be reassigned on the next dialog open).
        let achievements = null;
        if (_completionSnapshot) {
            achievements = {};
            [winner, loser].forEach(p => {
                const snap = _completionSnapshot[p.id];
                const player = players.find(pl => String(pl.id) === String(p.id));
                achievements[p.id] = (snap && player) ? diffPlayerStats(snap, snapshotPlayerStats(player)) : null;
            });
        }

        console.log(`Winner confirmed for match ${matchId}: ${winner.name} (${winnerLegs}-${loserLegs})`);

        if (isQualifier) achievements = null; // nothing in a qualifier counts
        onConfirm(winnerLegs, loserLegs, achievements);
        cleanup();
        popDialog(); // Use dialog stack to close and restore parent
    };

    const cleanup = () => {
        // Reset button styles and label
        cancelBtn.style.boxShadow = '';
        cancelBtn.style.transform = '';
        cancelBtn.textContent = 'Cancel';

        // Clear achievements summary
        const summaryBox = document.getElementById('completionAchievementsSummary');
        if (summaryBox) summaryBox.style.display = 'none';

        // Remove event listeners
        cancelBtn.removeEventListener('click', handleCancel);
        confirmBtn.removeEventListener('click', handleConfirm);
        document.removeEventListener('keydown', handleKeyPress);

        // Remove input listeners
        if (winnerLegsInput) {
            winnerLegsInput.removeEventListener('input', handleLegsInput);
        }
        if (loserLegsInput) {
            loserLegsInput.removeEventListener('input', handleLegsInput);
        }
        modal._legsInputHandler = null;

        // Clear validation message
        if (validationMessage) {
            validationMessage.style.display = 'none';
        }

        // Re-enable confirm button
        confirmBtn.disabled = false;
    };

    const handleKeyPress = (e) => {
        if (e.key !== 'Enter' && e.key !== 'Escape') return;

        // Defer when another dialog is on top of us (e.g. statsModal opened via Edit Statistics).
        const top = window.dialogStack && window.dialogStack[window.dialogStack.length - 1];
        if (!top || top.id !== 'winnerConfirmModal') return;

        if (e.key === 'Enter') {
            const validation = validateInputs();
            if (validation.valid) handleConfirm();
        } else {
            // Esc routes through handleCancel so stats added in this session are rolled back.
            // Without this, the snapshot stays stale and the next open's diff is computed
            // against the wrong baseline.
            e.preventDefault();
            handleCancel();
        }
    };

    // Remove any existing event listeners first (in case this is a restoration)
    if (modal._cancelHandler) {
        cancelBtn.removeEventListener('click', modal._cancelHandler);
    }
    if (modal._confirmHandler) {
        confirmBtn.removeEventListener('click', modal._confirmHandler);
    }
    if (modal._keyHandler) {
        document.removeEventListener('keydown', modal._keyHandler);
    }

    // Store handlers on modal for cleanup
    modal._cancelHandler = handleCancel;
    modal._confirmHandler = handleConfirm;
    modal._keyHandler = handleKeyPress;

    // Add event listeners
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleKeyPress);

    // Initial validation
    const initialValidation = validateInputs();
    updateValidationDisplay(initialValidation);
    confirmBtn.disabled = !initialValidation.valid;

    return true;
}

/**
 * Validate leg scores with comprehensive rules
 */
function validateLegScores(winnerLegs, loserLegs, matchLegs) {
    // Basic number validation
    if (isNaN(winnerLegs) || isNaN(loserLegs)) {
        return { valid: false, error: 'Please enter valid numbers for both leg counts' };
    }

    if (winnerLegs < 0 || loserLegs < 0) {
        return { valid: false, error: 'Leg counts cannot be negative' };
    }

    // Winner must have more legs than loser (core requirement)
    if (winnerLegs <= loserLegs) {
        return { valid: false, error: 'Winner must have more legs than loser' };
    }

    // Optional: Check if it makes sense for the match format
    const minToWin = Math.ceil(matchLegs / 2);
    if (winnerLegs < minToWin) {
        return {
            valid: false,
            error: `Winner needs at least ${minToWin} legs to win a best-of-${matchLegs} match`
        };
    }

    // Optional: Check if total legs is reasonable (not enforced strictly)
    const totalLegs = winnerLegs + loserLegs;
    if (totalLegs > matchLegs + 2) {
        return {
            valid: false,
            error: `Total legs (${totalLegs}) seems high for a best-of-${matchLegs} match. Maximum expected: ${matchLegs + 2}`
        };
    }

    // Check if loser has too many legs (can't exceed what's possible)
    const maxLoserLegs = matchLegs - 1; // In Bo5, max loser can have is 4 legs
    if (loserLegs > maxLoserLegs) {
        return {
            valid: false,
            error: `Loser cannot have more than ${maxLoserLegs} legs in a best-of-${matchLegs} match`
        };
    }

    return { valid: true, error: null };
}

/**
 * Update validation display in the modal
 */
function updateValidationDisplay(validation) {
    let validationMessage = document.getElementById('legValidationMessage');

    // Create validation message element if it doesn't exist
    if (!validationMessage) {
        const legScoresSection = document.getElementById('legScoresSection');
        if (legScoresSection) {
            validationMessage = document.createElement('div');
            validationMessage.id = 'legValidationMessage';
            validationMessage.style.marginTop = '10px';
            validationMessage.style.padding = '8px 12px';
            validationMessage.style.borderRadius = '4px';
            validationMessage.style.fontSize = '14px';
            validationMessage.style.fontWeight = '500';
            legScoresSection.appendChild(validationMessage);
        }
    }

    if (validationMessage) {
        if (validation.valid) {
            validationMessage.style.display = 'none';
        } else {
            validationMessage.style.display = 'block';
            validationMessage.style.background = '#fff5f5';
            validationMessage.style.color = '#dc2626';
            validationMessage.style.border = '1px solid #fecaca';
            validationMessage.textContent = validation.error;
        }
    }
}

/**
 * Show validation error as alert (fallback)
 */
function showValidationError(error) {
    alert('❌ Invalid leg scores:\n\n' + error);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showWinnerConfirmation = showWinnerConfirmation;
    window.validateLegScores = validateLegScores;
    window.updateValidationDisplay = updateValidationDisplay;
    window.showValidationError = showValidationError;
}
// TOURNAMENT HISTORY MANAGEMENT (TRANSACTIONAL)

const MAX_HISTORY_ENTRIES = 1000; // Keep last 1000 transactions (covers extensive 32-player tournaments with full operational history)

/**
 * NEW: Save a single transaction to the history log.
 * @param {object} transaction The transaction object to save.
 */
function saveTransaction(transaction) {
    if (!tournament || !tournament.id) {
        console.warn('No active tournament - transaction not saved');
        return;
    }

    const historyKey = `tournament_${tournament.id}_history`;
    let history = getTournamentHistory();
    history.unshift(transaction); // Add to the beginning

    if (history.length > MAX_HISTORY_ENTRIES) {
        history = history.slice(0, MAX_HISTORY_ENTRIES);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
}

/**
 * Get tournament history from localStorage.
 * Per-tournament isolation - reads from tournament-specific key.
 */
function getTournamentHistory() {
    if (!tournament || !tournament.id) {
        return [];
    }

    try {
        const historyKey = `tournament_${tournament.id}_history`;
        const historyData = localStorage.getItem(historyKey);

        if (!historyData || historyData === 'undefined') {
            return [];
        }

        const history = JSON.parse(historyData);
        return history;
    } catch (error) {
        console.error('Error loading tournament history:', error);
        return [];
    }
}

/**
 * Clear tournament history.
 * Per-tournament isolation - clears only current tournament's history.
 */
function clearTournamentHistory() {
    if (!tournament || !tournament.id) {
        console.warn('No active tournament - cannot clear history');
        return;
    }

    const historyKey = `tournament_${tournament.id}_history`;
    localStorage.removeItem(historyKey);
    console.log(`✓ Tournament history cleared for ${tournament.name}`);
}

/**
 * Debug function to show current history
 */
function debugHistory() {
    const history = getTournamentHistory();
    console.log('=== TOURNAMENT HISTORY ===');
    console.log(`Total entries: ${history.length}`);

    history.forEach((entry, index) => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        console.log(`${index + 1}. [${time}] ${entry.description}`);
    });

    if (history.length === 0) {
        console.log('No history entries found');
    }
}

/**
 * Open stats modal from winner confirmation dialog using dialog stack
 */
function openStatsModalFromConfirmation(playerId, matchId) {
    // Save current leg score values
    const winnerLegsInput = document.getElementById('winnerLegs');
    const loserLegsInput = document.getElementById('loserLegs');
    const savedWinnerLegs = winnerLegsInput ? winnerLegsInput.value : '';
    const savedLoserLegs = loserLegsInput ? loserLegsInput.value : '';

    // Open stats modal - dialog stack will handle hiding winner modal
    openStatsModal(playerId);

    // Override closeStatsModal to restore input values and update Cancel label after returning
    const originalClose = window.closeStatsModal;
    window.closeStatsModal = function() {
        // Call original close (which calls popDialog)
        if (originalClose) {
            originalClose();
        }

        // Restore input values and check for achievement changes after dialog stack restores winner modal
        setTimeout(() => {
            const winnerLegsInputRestore = document.getElementById('winnerLegs');
            const loserLegsInputRestore = document.getElementById('loserLegs');
            if (winnerLegsInputRestore && savedWinnerLegs !== '') {
                winnerLegsInputRestore.value = savedWinnerLegs;
            }
            if (loserLegsInputRestore && savedLoserLegs !== '') {
                loserLegsInputRestore.value = savedLoserLegs;
            }

            // Update the achievements summary and Cancel button label
            if (_completionSnapshot) {
                renderCompletionAchievements();
                const anyChanges = Object.entries(_completionSnapshot).some(([pid, snap]) => {
                    const player = players.find(p => String(p.id) === String(pid));
                    return player && diffPlayerStats(snap, snapshotPlayerStats(player)) !== null;
                });
                const cancelBtn = document.getElementById('winnerConfirmCancel');
                if (cancelBtn) {
                    cancelBtn.textContent = anyChanges ? 'Cancel & revert achievements' : 'Cancel';
                }
            }
        }, 0);

        // Restore original close function
        window.closeStatsModal = originalClose;
    };
}

// NEW: Enhanced match state detection with help suggestions
function detectMatchIssues() {
    if (!matches || matches.length === 0) return;

    const readyMatches = matches.filter(m => getMatchState && getMatchState(m) === 'ready').length;
    const liveMatches = matches.filter(m => getMatchState && getMatchState(m) === 'live').length;

    // Help suggestions based on match states
    /*
    if (readyMatches > 0 && liveMatches === 0 && typeof showHelpHint === 'function') {
        setTimeout(() => {
            showHelpHint(`${readyMatches} match${readyMatches > 1 ? 'es' : ''} ready to start. Click "Start" to begin.`);
        }, 2000);
    } */

    if (liveMatches > 3 && typeof showHelpHint === 'function') {
        setTimeout(() => {
            showHelpHint('Many matches are live. Consider using lanes to organize dartboards.');
        }, 1000);
    }
}

// NEW: Help system integration for common user actions
function onPageChange(newPageId) {
    // Trigger contextual help suggestions when switching pages
    if (typeof triggerContextualHelp === 'function') {
        setTimeout(() => {
            triggerContextualHelp();
        }, 1000);
    }

    // Page-specific help triggers
    if (newPageId === 'tournament' && tournament && tournament.bracket) {
        setTimeout(() => {
            detectMatchIssues();
        }, 1500);
    }
}

// NEW: Validation helper for leg scores in winner confirmation
function validateAndShowWinnerDialog(matchId, playerNumber) {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        console.error(`Match ${matchId} not found`);
        return false;
    }

    // Can only select winner if match is active/live
    if (!match.active) {
        alert('Match must be active to select winner');

        // HELP SYSTEM INTEGRATION
        if (typeof showHelpHint === 'function') {
            showHelpHint('Click "Start" button first to activate the match before selecting winner.');
        }
        return false;
    }

    const winner = playerNumber === 1 ? match.player1 : match.player2;
    const loser = playerNumber === 1 ? match.player2 : match.player1;

    // Cannot select walkover or TBD as winner
    if (isWalkover(winner) || winner.name === 'TBD') {
        alert('Cannot select walkover or TBD as winner');
        return false;
    }

    // Show enhanced confirmation dialog with validation
    if (config.ui && config.ui.confirmWinnerSelection) {
        return showWinnerConfirmation(matchId, winner, loser, (winnerLegs, loserLegs, achievements) => {
            // This callback runs if user confirms with validated leg scores
            const success = completeMatch(matchId, playerNumber, winnerLegs, loserLegs, 'MANUAL', achievements);

            if (success) {
                // Re-render bracket
                if (typeof renderBracket === 'function') {
                    renderBracket();
                }

                // Refresh lane dropdowns if available
                if (typeof refreshAllLaneDropdowns === 'function') {
                    setTimeout(refreshAllLaneDropdowns, 100);
                }
            }

            return success;
        });
    }

    // If no confirmation needed, complete match normally with no leg scores
    const success = completeMatch(matchId, playerNumber, 0, 0);

    if (success) {
        // Re-render bracket
        if (typeof renderBracket === 'function') {
            renderBracket();
        }

        // Refresh lane dropdowns if available
        if (typeof refreshAllLaneDropdowns === 'function') {
            setTimeout(refreshAllLaneDropdowns, 100);
        }

        // Refresh Match Controls if it's open to show updated match state
        const modal = document.getElementById('matchCommandCenterModal');
        if (modal &&
            (modal.style.display === 'flex' || modal.style.display === 'block') &&
            typeof showMatchCommandCenter === 'function') {
            setTimeout(() => {
                showMatchCommandCenter();
            }, 100);
        }

    }

    return success;
}

/**
 * Check if a match is a frontside semifinal
 */
function isFrontsideSemifinal(matchId, bracketSize) {
    const frontsideSemifinals = {
        8: 'FS-3-1',
        16: 'FS-4-1',
        32: 'FS-5-1'
    };

    return frontsideSemifinals[bracketSize] === matchId;
}

/**
 * Check if a match is a backside semifinal
 */
function isBacksideSemifinal(matchId, bracketSize) {
    const backsideSemifinals = {
        8: 'BS-3-1',
        16: 'BS-5-1',
        32: 'BS-7-1'
    };

    return backsideSemifinals[bracketSize] === matchId;
}

/**
 * Check if a match is the SE bronze match (penultimate round, 1 match).
 * Bronze match IDs by bracket size: 4→FS-2-1, 8→FS-3-1, 16→FS-4-1, 32→FS-5-1
 *
 * @param {string} matchId - The match ID to check
 * @param {number} bracketSize - The bracket size
 * @returns {boolean} True if this is the SE bronze match
 */
function isSEBronzeMatch(matchId, bracketSize) {
    const seBronzeMatches = {
        4: 'FS-2-1',
        8: 'FS-3-1',
        16: 'FS-4-1',
        32: 'FS-5-1'
    };
    return seBronzeMatches[bracketSize] === matchId;
}

/**
 * Check if a match is the SE final match (last round, 1 match).
 * Final match IDs by bracket size: 4→FS-3-1, 8→FS-4-1, 16→FS-5-1, 32→FS-6-1
 *
 * @param {string} matchId - The match ID to check
 * @param {number} bracketSize - The bracket size
 * @returns {boolean} True if this is the SE final match
 */
function isSEFinalMatch(matchId, bracketSize) {
    const seFinalMatches = {
        4: 'FS-3-1',
        8: 'FS-4-1',
        16: 'FS-5-1',
        32: 'FS-6-1'
    };
    return seFinalMatches[bracketSize] === matchId;
}

/**
 * Check if a match is an SE semifinal match (round total - 2).
 * Semifinal round by bracket size: 4→R1, 8→R2, 16→R3, 32→R4
 *
 * @param {string} matchId - The match ID to check
 * @param {number} bracketSize - The bracket size
 * @returns {boolean} True if this is an SE semifinal match
 */
function isSESemifinal(matchId, bracketSize) {
    const seSemifinalRounds = { 4: 1, 8: 2, 16: 3, 32: 4 };
    const sfRound = seSemifinalRounds[bracketSize];
    if (!sfRound) return false;
    const m = matchId.match(/^FS-(\d+)-/);
    return m && parseInt(m[1]) === sfRound;
}

/**
 * Check if a match is an SE quarterfinal match (round total - 3).
 * Quarterfinal round by bracket size: 8→R1, 16→R2, 32→R3 (not applicable for 4-player)
 *
 * @param {string} matchId - The match ID to check
 * @param {number} bracketSize - The bracket size
 * @returns {boolean} True if this is an SE quarterfinal match
 */
function isSEQuarterfinal(matchId, bracketSize) {
    const seQuarterfinalRounds = { 8: 1, 16: 2, 32: 3 };
    const qfRound = seQuarterfinalRounds[bracketSize];
    if (!qfRound) return false;
    const m = matchId.match(/^FS-(\d+)-/);
    return m && parseInt(m[1]) === qfRound;
}

/**
 * Returns the display name for a given SE round number.
 * Named from the end backwards: Final, Bronze Final, Semifinals, Quarterfinals, Round N.
 * Single source of truth — used by both Match Controls and bracket rendering.
 *
 * @param {number} round - The round number (1-based)
 * @param {number} bracketSize - The bracket size (4, 8, 16, 32)
 * @returns {string} Display name for the round
 */
function getSERoundDisplayName(round, bracketSize) {
    const totalRounds = { 4: 3, 8: 4, 16: 5, 32: 6 };
    const total = totalRounds[bracketSize];
    if (!total) return `Round ${round}`;

    if (round === total) return 'Final';
    if (round === total - 1) return 'Bronze';
    if (round === total - 2) return 'Semifinal';
    if (round === total - 3) return 'Quarterfinal';
    return `Round ${round}`;
}

/**
 * Show tournament in progress warning modal
 * Replaces browser alert with user-friendly modal dialog
 */
function showTournamentProgressWarning() {
    // Populate sidebar with current tournament state
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;
    document.getElementById('progressTournamentName').textContent = (tournament && tournament.name) || '-';
    document.getElementById('progressTournamentStatus').textContent = tournamentStatusLabel(tournament);
    document.getElementById('progressMatchProgress').textContent = `${completedMatches} of ${totalMatches}`;
    document.getElementById('progressPlayerCount').textContent = players.length;

    // Show modal with Esc support
    pushDialog('tournamentProgressModal', null, true);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    // Transactional History System
    window.saveTransaction = saveTransaction;
    window.generateTransactionId = generateTransactionId;
    window.getTournamentHistory = getTournamentHistory;
    window.clearTournamentHistory = clearTournamentHistory;
    window.debugHistory = debugHistory;

    // Original Functions (unchanged)
    window.advancePlayer = advancePlayer;
    window.completeMatch = completeMatch;
    window.selectWinnerClean = selectWinnerClean;
    window.processAutoAdvancements = processAutoAdvancements;
    window.debugProgression = debugProgression;
    window.generateCleanBracket = generateCleanBracket;
    window.debugBracketGeneration = debugBracketGeneration;
    window.toggleActive = toggleActive;
    window.toggleActiveWithValidation = toggleActiveWithValidation;
    window.getMatchState = getMatchState;
    window.updateMatchLane = updateMatchLane;
    window.DE_MATCH_PROGRESSION = DE_MATCH_PROGRESSION;
    window.SE_MATCH_PROGRESSION = SE_MATCH_PROGRESSION;
    window.calculateBracketSize = calculateBracketSize;
    window.getProgressionTable = getProgressionTable;
    window.selectWinner = selectWinnerClean;
    window.selectWinnerV2 = selectWinnerClean;
    window.selectWinnerWithValidation = selectWinnerClean;
    window.selectWinnerWithAutoAdvancement = selectWinnerClean;
    window.generateBracket = generateCleanBracket;
    window.confirmBracketGeneration = confirmBracketGeneration;
    window.showWinnerConfirmation = showWinnerConfirmation;
    window.validateLegScores = validateLegScores;
    window.updateValidationDisplay = updateValidationDisplay;
    window.showValidationError = showValidationError;
    window.openStatsModalFromConfirmation = openStatsModalFromConfirmation;
    window.detectMatchIssues = detectMatchIssues;
    window.onPageChange = onPageChange;
    window.isFrontsideSemifinal = isFrontsideSemifinal;
    window.isBacksideSemifinal = isBacksideSemifinal;
    window.isSEBronzeMatch = isSEBronzeMatch;
    window.isSEFinalMatch = isSEFinalMatch;
    window.isSESemifinal = isSESemifinal;
    window.isSEQuarterfinal = isSEQuarterfinal;
    window.getSERoundDisplayName = getSERoundDisplayName;
    window.calculateAllRankings = calculateAllRankings;
    window.calculate8PlayerRankings = calculate8PlayerRankings;
    window.isWalkover = isWalkover;
    window.showTournamentProgressWarning = showTournamentProgressWarning;

    console.log('✅ Clean match progression system loaded - old system disabled');
}
