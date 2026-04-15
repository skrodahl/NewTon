// newton-db.js — NewtonMatchDB IndexedDB layer
// Global match and tournament register. Self-contained, no external dependencies.
// All records are raw data — no pre-extracted stats, no references to live tournament state.

const NewtonDB = (() => {

    const DB_NAME    = 'NewtonMatchDB';
    const DB_VERSION = 1;

    /** @type {IDBDatabase|null} */
    let _db = null;

    // ---------------------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------------------

    /**
     * Open (or create) the database.
     * Safe to call multiple times — resolves immediately if already open.
     * @returns {Promise<IDBDatabase>}
     */
    function initDB() {
        if (_db) return Promise.resolve(_db);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // --- matches store ---
                if (!db.objectStoreNames.contains('matches')) {
                    const matchStore = db.createObjectStore('matches', { keyPath: 'id', autoIncrement: true });
                    matchStore.createIndex('tournamentId',  'tournamentId',  { unique: false });
                    matchStore.createIndex('player1Id',     'player1Id',     { unique: false });
                    matchStore.createIndex('player2Id',     'player2Id',     { unique: false });
                    matchStore.createIndex('matchType',     'matchType',     { unique: false });
                    matchStore.createIndex('completedAt',   'completedAt',   { unique: false });
                    // Compound index for upsert lookup
                    matchStore.createIndex('tournamentMatch', ['tournamentId', 'matchId'], { unique: true });
                }

                // --- tournaments store ---
                if (!db.objectStoreNames.contains('tournaments')) {
                    const tournStore = db.createObjectStore('tournaments', { keyPath: 'tournamentId' });
                    tournStore.createIndex('status',      'status',      { unique: false });
                    tournStore.createIndex('closedAt',    'closedAt',    { unique: false });
                    tournStore.createIndex('format',      'format',      { unique: false });
                }
            };

            request.onsuccess = (event) => {
                _db = event.target.result;
                resolve(_db);
            };

            request.onerror = (event) => {
                console.error('NewtonMatchDB open error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // ---------------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------------

    /**
     * @param {string} storeName
     * @param {'readonly'|'readwrite'} mode
     * @returns {IDBObjectStore}
     */
    function _store(storeName, mode) {
        return _db.transaction(storeName, mode).objectStore(storeName);
    }

    /**
     * Wrap an IDBRequest in a Promise.
     * @param {IDBRequest} request
     * @returns {Promise<any>}
     */
    function _promisify(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror  = () => reject(request.error);
        });
    }

    // ---------------------------------------------------------------------------
    // Matches
    // ---------------------------------------------------------------------------

    /**
     * Upsert a match record.
     * If a record with the same (tournamentId, matchId) exists, it is replaced.
     * Called on match completion and re-completion after undo.
     *
     * @param {object} data
     * @param {string}  data.tournamentId
     * @param {string}  data.tournamentName
     * @param {string}  data.tournamentFormat  - 'DE' | 'SE' | 'RR' etc.
     * @param {string}  data.matchId           - e.g. 'FS-1-1'
     * @param {string}  data.matchRound        - human-readable round label
     * @param {string}  data.matchType         - 'MANUAL' | 'CHALKER'
     * @param {number}  data.completedAt       - Unix timestamp (seconds)
     * @param {string}  data.player1Id
     * @param {string}  data.player1Name
     * @param {string}  data.player2Id
     * @param {string}  data.player2Name
     * @param {1|2}     data.winner
     * @param {number|null} data.firstStarter  - 1 | 2 | null (MANUAL)
     * @param {{p1: number, p2: number}} data.legsWon
     * @param {object[]|null} data.legs        - raw leg data with visit scores; null for MANUAL
     * @param {{p1: object|null, p2: object|null}|null} data.achievements
     * @param {{sc: number, bo: number}} data.format
     * @returns {Promise<void>}
     */
    async function saveMatch(data) {
        await initDB();

        // Check for existing record with same (tournamentId, matchId)
        const existing = await getMatch(data.tournamentId, data.matchId);

        const tx    = _db.transaction('matches', 'readwrite');
        const store = tx.objectStore('matches');

        const record = Object.assign({}, data, { status: 'live' });

        if (existing) {
            record.id = existing.id; // preserve primary key for overwrite
            store.put(record);
        } else {
            store.add(record);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror    = () => reject(tx.error);
        });
    }

    /**
     * Delete all records for a tournament (matches + tournament meta).
     * Called from the History tab delete flow.
     * @param {string} tournamentId
     * @returns {Promise<void>}
     */
    async function deleteTournament(tournamentId) {
        await initDB();

        // Delete all match records for this tournament
        const matches = await getMatchesByTournament(tournamentId);
        for (const m of matches) {
            await _promisify(_store('matches', 'readwrite').delete(m.id));
        }

        // Delete tournament meta record (keyPath is 'tournamentId', not 'id')
        await _promisify(_store('tournaments', 'readwrite').delete(tournamentId));
    }

    /**
     * Delete a match record. Called on undo.
     * @param {string} tournamentId
     * @param {string} matchId
     * @returns {Promise<void>}
     */
    async function deleteMatch(tournamentId, matchId) {
        await initDB();

        const existing = await getMatch(tournamentId, matchId);
        if (!existing) return;

        return _promisify(_store('matches', 'readwrite').delete(existing.id));
    }

    /**
     * Get a single match record by (tournamentId, matchId).
     * @param {string} tournamentId
     * @param {string} matchId
     * @returns {Promise<object|null>}
     */
    async function getMatch(tournamentId, matchId) {
        await initDB();

        const index   = _store('matches', 'readonly').index('tournamentMatch');
        const result  = await _promisify(index.get([tournamentId, matchId]));
        return result || null;
    }

    /**
     * Get all match records for a tournament.
     * @param {string} tournamentId
     * @returns {Promise<object[]>}
     */
    async function getMatchesByTournament(tournamentId) {
        await initDB();

        const index = _store('matches', 'readonly').index('tournamentId');
        return _promisify(index.getAll(tournamentId));
    }

    /**
     * Get all match records involving a player (as p1 or p2).
     * @param {string} playerId
     * @returns {Promise<object[]>}
     */
    async function getMatchesByPlayer(playerId) {
        await initDB();

        const store  = _store('matches', 'readonly');
        const [asP1, asP2] = await Promise.all([
            _promisify(store.index('player1Id').getAll(playerId)),
            _promisify(store.index('player2Id').getAll(playerId))
        ]);

        // Merge and sort by completedAt descending
        return [...asP1, ...asP2].sort((a, b) => b.completedAt - a.completedAt);
    }

    // ---------------------------------------------------------------------------
    // Tournaments
    // ---------------------------------------------------------------------------

    /**
     * Upsert a tournament metadata record.
     * Creates a 'live' record on first match completion; updated on subsequent completions.
     *
     * @param {object} data
     * @param {string} data.tournamentId
     * @param {string} data.tournamentName
     * @param {string} data.tournamentFormat  - 'DE' | 'SE' | 'RR' etc.
     * @param {number} data.playerCount
     * @param {number} data.startedAt         - Unix timestamp of first match completion
     * @returns {Promise<void>}
     */
    async function saveTournamentMeta(data) {
        await initDB();

        const existing = await getTournament(data.tournamentId);
        const record   = Object.assign({ status: 'live' }, existing || {}, data);

        return _promisify(_store('tournaments', 'readwrite').put(record));
    }

    /**
     * Promote a tournament record to 'final'.
     * Called when the operator closes the tournament.
     * Overwrites all match records for this tournament with status: 'final'.
     *
     * @param {string} tournamentId
     * @param {object} configSnapshot  - full config at close time (points, legs, server, etc.)
     * @param {object} tournamentAchievements - {[playerId]: statsObject} free-floating stats
     * @param {number} closedAt        - Unix timestamp
     * @returns {Promise<void>}
     */
    async function finalizeTournament(tournamentId, configSnapshot, tournamentAchievements, closedAt) {
        await initDB();

        // Promote tournament record
        const existing = await getTournament(tournamentId);
        if (!existing) return; // Nothing to finalize — no matches were ever completed

        // Promote all match records for this tournament to 'final'
        const matches = await getMatchesByTournament(tournamentId);

        const tournRecord = Object.assign({}, existing, {
            status:                 'final',
            closedAt:               closedAt,
            configSnapshot:         configSnapshot,
            tournamentAchievements: tournamentAchievements || {},
            matchCount:             matches.length
        });

        await _promisify(_store('tournaments', 'readwrite').put(tournRecord));

        if (matches.length === 0) return;

        const tx    = _db.transaction('matches', 'readwrite');
        const store = tx.objectStore('matches');
        matches.forEach(m => store.put(Object.assign({}, m, { status: 'final' })));

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror    = () => reject(tx.error);
        });
    }

    /**
     * Get a tournament record by ID.
     * @param {string} tournamentId
     * @returns {Promise<object|null>}
     */
    async function getTournament(tournamentId) {
        await initDB();

        const result = await _promisify(_store('tournaments', 'readonly').get(tournamentId));
        return result || null;
    }

    /**
     * Get all finalized tournament records, sorted by closedAt descending.
     * @returns {Promise<object[]>}
     */
    async function getFinalTournaments() {
        await initDB();

        const index   = _store('tournaments', 'readonly').index('status');
        const results = await _promisify(index.getAll('final'));
        return results.sort((a, b) => b.closedAt - a.closedAt);
    }

    /**
     * Get all tournament records regardless of status, sorted by closedAt descending.
     * @returns {Promise<object[]>}
     */
    async function getAllTournaments() {
        await initDB();

        const results = await _promisify(_store('tournaments', 'readonly').getAll());
        return results.sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    }

    // ---------------------------------------------------------------------------
    // Export / Import
    // ---------------------------------------------------------------------------

    /**
     * Export the full register as a raw JSON-serialisable object.
     * @returns {Promise<{matches: object[], tournaments: object[]}>}
     */
    async function exportAll() {
        await initDB();

        const [matches, tournaments] = await Promise.all([
            _promisify(_store('matches',     'readonly').getAll()),
            _promisify(_store('tournaments', 'readonly').getAll())
        ]);

        return { matches, tournaments };
    }

    /**
     * Import a register dump. Merges into the existing DB.
     * Existing records with the same primary key are overwritten.
     * @param {{ matches: object[], tournaments: object[] }} dump
     * @returns {Promise<void>}
     */
    async function importAll(dump) {
        await initDB();

        // Upsert tournament metadata records (keyPath is tournamentId — put works directly)
        const tournTx = _db.transaction('tournaments', 'readwrite');
        (dump.tournaments || []).forEach(t => tournTx.objectStore('tournaments').put(t));
        await new Promise((resolve, reject) => {
            tournTx.oncomplete = () => resolve();
            tournTx.onerror    = () => reject(tournTx.error || new Error('Tournament import failed'));
        });

        // Upsert each match by (tournamentId, matchId): overwrite if exists, add if new.
        // Preserves status and all fields from the dump. Does not touch unrelated records.
        for (const m of (dump.matches || [])) {
            const existing = await getMatch(m.tournamentId, m.matchId);
            const record   = Object.assign({}, m);
            if (existing) {
                record.id = existing.id; // use DB's key so put() replaces the right record
                await _promisify(_store('matches', 'readwrite').put(record));
            } else {
                delete record.id;
                await _promisify(_store('matches', 'readwrite').add(record));
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Achievement helpers (shared by backfill and live finalization)
    // ---------------------------------------------------------------------------

    /** Normalize a player stats object to a consistent shape. */
    function normalizeStats(stats) {
        if (!stats) return { oneEighties: 0, tons: 0, highOuts: [], shortLegs: [], lollipops: 0 };
        const sl = stats.shortLegs;
        return {
            oneEighties: stats.oneEighties || 0,
            tons: stats.tons || 0,
            highOuts: Array.isArray(stats.highOuts) ? stats.highOuts : [],
            shortLegs: Array.isArray(sl) ? sl : [],
            lollipops: stats.lollipops || 0
        };
    }

    /** Compute the delta between two normalized stats snapshots. */
    function diffStats(prev, curr) {
        return {
            oneEighties: curr.oneEighties - prev.oneEighties,
            tons: curr.tons - prev.tons,
            highOuts: curr.highOuts.slice(prev.highOuts.length),
            shortLegs: curr.shortLegs.slice(prev.shortLegs.length),
            lollipops: curr.lollipops - prev.lollipops
        };
    }

    /** Returns true if a delta has any non-zero achievement. */
    function hasAnyStats(d) {
        return d.oneEighties > 0 || d.tons > 0 || d.lollipops > 0 ||
            d.highOuts.length > 0 || d.shortLegs.length > 0;
    }

    /** Add achievement values from addition onto target (mutates target). */
    function addStats(target, addition) {
        target.oneEighties += addition.oneEighties;
        target.tons += addition.tons;
        target.lollipops += addition.lollipops;
        target.highOuts = target.highOuts.concat(addition.highOuts);
        target.shortLegs = target.shortLegs.concat(addition.shortLegs);
    }

    /**
     * Reconcile match-level achievements with player totals.
     * Sums all per-match achievement deltas for each player, compares against
     * the authoritative player stats, and attributes any remainder to the
     * player's last match. Writes updated match records back to IndexedDB.
     *
     * @param {string} tournamentId
     * @param {Object<string, {name: string, stats: object}>} playerStatsMap
     *   playerId -> { name, stats: { oneEighties, tons, highOuts, shortLegs, lollipops } }
     * @returns {Promise<void>}
     */
    async function reconcileMatchAchievements(tournamentId, playerStatsMap) {
        await initDB();

        const matches = await getMatchesByTournament(tournamentId);
        if (!matches.length) return;

        // Sort by completedAt to determine last match per player
        matches.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));

        // Sum existing match-level achievements per player, track last match
        const accumulated = {};   // playerId -> normalized sum
        const lastMatchIdx = {};  // playerId -> index in matches array

        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            const slots = [
                { id: m.player1Id, slot: 'p1' },
                { id: m.player2Id, slot: 'p2' }
            ];

            for (const { id, slot } of slots) {
                if (!id) continue;
                lastMatchIdx[id] = i;

                const ach = m.achievements && m.achievements[slot];
                if (ach) {
                    if (!accumulated[id]) accumulated[id] = normalizeStats(null);
                    addStats(accumulated[id], normalizeStats(ach));
                }
            }
        }

        // Compare accumulated vs authoritative player totals, find remainders
        const updates = {};  // match index -> { playerId -> remainder }

        for (const [playerId, entry] of Object.entries(playerStatsMap)) {
            if (!entry.stats) continue;
            const final_ = normalizeStats(entry.stats);
            const acc = accumulated[playerId] || normalizeStats(null);
            const remainder = diffStats(acc, final_);

            if (hasAnyStats(remainder) && lastMatchIdx[playerId] !== undefined) {
                const idx = lastMatchIdx[playerId];
                if (!updates[idx]) updates[idx] = {};
                updates[idx][playerId] = remainder;
            }
        }

        // Write remainders back to the last match for each player
        for (const [idxStr, playerRemainders] of Object.entries(updates)) {
            const idx = parseInt(idxStr, 10);
            const m = matches[idx];
            if (!m.achievements) m.achievements = { p1: null, p2: null };

            for (const [playerId, remainder] of Object.entries(playerRemainders)) {
                const slot = String(m.player1Id) === playerId ? 'p1' : 'p2';
                if (m.achievements[slot]) {
                    addStats(m.achievements[slot], remainder);
                } else {
                    m.achievements[slot] = remainder;
                }
            }

            // Write updated match back to IndexedDB
            await saveMatch(m);
        }
    }

    // ---------------------------------------------------------------------------
    // Backfill — import a tournament object into IndexedDB
    // ---------------------------------------------------------------------------

    /**
     * Import a full tournament object into the Analytics register (IndexedDB).
     * Shared by all import paths: file import, localStorage backfill, auto-import from disk.
     *
     * @param {object} t - Full tournament object (id, name, date, players, matches, placements, history, format)
     * @param {object} [configSnapshot] - Config snapshot to store. Falls back to empty object.
     * @returns {Promise<{matchCount: number}>} Number of matches imported
     */
    async function backfillTournament(t, configSnapshot) {
        await initDB();

        if (!t || !t.id) throw new Error('Tournament object must have an id');

        const tid = String(t.id);
        const tournamentDate = new Date((t.date || '2000-01-01') + 'T00:00:00');

        // Build tournament meta
        const meta = {
            tournamentId: tid,
            tournamentName: t.name || 'Unknown',
            tournamentDate: t.date || null,
            tournamentFormat: t.format || 'DE',
            playerCount: Array.isArray(t.players) ? t.players.length : 0,
            status: 'final',
            closedAt: Math.floor(tournamentDate.getTime() / 1000),
            configSnapshot: configSnapshot || {}
        };

        await saveTournamentMeta(meta);

        // -------------------------------------------------------------------
        // Compute per-match achievement deltas from transaction history
        // -------------------------------------------------------------------
        const matchAchievementMap = {};
        const historyData = t.history || [];

        if (Array.isArray(historyData) && historyData.length > 0) {
            const completeTxs = historyData
                .filter(tx => tx.type === 'COMPLETE_MATCH')
                .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

            const prevStats = {};

            for (const tx of completeTxs) {
                const matchId = tx.matchId;
                const matchDeltas = {};

                for (const role of ['winner', 'loser']) {
                    const p = tx[role];
                    if (!p || !p.id) continue;
                    const pid = String(p.id);
                    const curr = normalizeStats(p.stats);
                    const prev = prevStats[pid] || normalizeStats(null);
                    const delta = diffStats(prev, curr);
                    prevStats[pid] = curr;

                    if (hasAnyStats(delta)) {
                        matchDeltas[pid] = delta;
                    }
                }

                if (Object.keys(matchDeltas).length > 0) {
                    matchAchievementMap[matchId] = matchDeltas;
                }
            }
        }

        // -------------------------------------------------------------------
        // Save completed matches
        // -------------------------------------------------------------------
        let savedMatchCount = 0;
        if (Array.isArray(t.matches)) {
            for (const match of t.matches) {
                if (!match.completed || !match.winner) continue;

                const isWalkover = match.autoAdvanced ||
                    (match.player1 && (match.player1.name === 'Walkover' || match.player1.isBye)) ||
                    (match.player2 && (match.player2.name === 'Walkover' || match.player2.isBye));
                if (isWalkover) continue;

                const winnerIs1 = match.winner && match.player1 && String(match.winner.id) === String(match.player1.id);
                const p1Legs = match.finalScore ? (winnerIs1 ? match.finalScore.winnerLegs : match.finalScore.loserLegs) : 0;
                const p2Legs = match.finalScore ? (winnerIs1 ? match.finalScore.loserLegs : match.finalScore.winnerLegs) : 0;

                const deltas = matchAchievementMap[match.id] || {};
                const p1Id = match.player1 ? String(match.player1.id) : null;
                const p2Id = match.player2 ? String(match.player2.id) : null;
                const p1Ach = (p1Id && deltas[p1Id]) ? deltas[p1Id] : null;
                const p2Ach = (p2Id && deltas[p2Id]) ? deltas[p2Id] : null;
                const achievements = (p1Ach || p2Ach) ? { p1: p1Ach, p2: p2Ach } : null;

                const dbMatch = {
                    tournamentId: tid,
                    tournamentName: t.name,
                    tournamentFormat: t.format || 'DE',
                    matchId: match.id,
                    matchRound: match.id,
                    matchType: 'MANUAL',
                    completedAt: match.completedAt || Math.floor(tournamentDate.getTime() / 1000),
                    player1Id: p1Id,
                    player1Name: match.player1 ? match.player1.name : null,
                    player2Id: p2Id,
                    player2Name: match.player2 ? match.player2.name : null,
                    winner: winnerIs1 ? 1 : 2,
                    firstStarter: null,
                    legsWon: { p1: p1Legs, p2: p2Legs },
                    legs: null,
                    achievements: achievements,
                    format: match.legs ? { bo: match.legs } : null
                };

                try {
                    await saveMatch(dbMatch);
                    savedMatchCount++;
                } catch (e) {
                    console.warn('[backfill] Failed to save match:', match.id, e);
                }
            }
        }

        // -------------------------------------------------------------------
        // Save tournament-level achievements and placements
        // -------------------------------------------------------------------
        const tournamentAchievements = {};
        if (Array.isArray(t.players)) {
            for (const p of t.players) {
                if (p.stats) {
                    tournamentAchievements[String(p.id)] = {
                        name: p.name,
                        stats: {
                            oneEighties: p.stats.oneEighties || 0,
                            tons: p.stats.tons || 0,
                            highOuts: Array.isArray(p.stats.highOuts) ? p.stats.highOuts : [],
                            shortLegs: Array.isArray(p.stats.shortLegs) ? p.stats.shortLegs : [],
                            lollipops: p.stats.lollipops || 0
                        }
                    };
                }
            }
        }

        meta.tournamentAchievements = tournamentAchievements;
        meta.placements = t.placements || {};
        meta.matchCount = savedMatchCount;
        await saveTournamentMeta(meta);

        // Reconcile achievements
        if (Object.keys(tournamentAchievements).length > 0) {
            await reconcileMatchAchievements(tid, tournamentAchievements);
        }

        return { matchCount: savedMatchCount };
    }

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    return {
        initDB,
        saveMatch,
        deleteMatch,
        getMatch,
        getMatchesByTournament,
        getMatchesByPlayer,
        saveTournamentMeta,
        finalizeTournament,
        getTournament,
        getFinalTournaments,
        getAllTournaments,
        exportAll,
        importAll,
        deleteTournament,
        reconcileMatchAchievements,
        backfillTournament,
        normalizeStats,
        diffStats,
        hasAnyStats,
        addStats
    };

})();
