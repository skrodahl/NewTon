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

        const tournRecord = Object.assign({}, existing, {
            status:                 'final',
            closedAt:               closedAt,
            configSnapshot:         configSnapshot,
            tournamentAchievements: tournamentAchievements || {}
        });

        await _promisify(_store('tournaments', 'readwrite').put(tournRecord));

        // Promote all match records for this tournament to 'final'
        const matches = await getMatchesByTournament(tournamentId);
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
        exportAll,
        importAll,
        deleteTournament
    };

})();
