// player-registry.js — The club's player database
//
// Every player has a permanent ID, a short name (what the bracket, Match Controls, the
// Chalker and the Leaderboard show; unique) and a first and last name. Tournament players
// carry the ID as `registryId`; the tournament's own per-player `id` is untouched (the
// bracket, the history and undo rely on it). Analytics groups by the ID, so renaming or
// merging players keeps their results together.
//
// Stored in localStorage under 'playerDatabase' (additive schema, no version marker):
//   { players: [ { id, short, first, last, prev: [names], merged: [ids], archived, created } ],
//     updatedAt, migrated, importNotice }
// A player who has ever been in Analytics can be archived but not deleted.

const PlayerRegistry = (() => {

    const KEY = 'playerDatabase';
    let _cache = null;

    /** A new permanent ID: random, so IDs from different computers never clash. */
    function newId() {
        const bytes = new Uint8Array(6);
        if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
        else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        return 'p_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    const norm = s => String(s || '').trim().toLowerCase();
    const clean = s => String(s || '').trim();

    /** Make a stored or imported entry safe to use (missing fields get defaults). */
    function _entry(e) {
        if (!e || typeof e !== 'object' || !e.id || !clean(e.short)) return null;
        return {
            id: String(e.id),
            short: clean(e.short),
            first: clean(e.first),
            last: clean(e.last),
            prev: Array.isArray(e.prev) ? e.prev.map(clean).filter(Boolean) : [],
            merged: Array.isArray(e.merged) ? e.merged.map(String) : [],
            archived: !!e.archived,
            created: e.created || null
        };
    }

    function _load() {
        if (_cache) return _cache;
        let data = null;
        try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { data = null; }
        if (!data || typeof data !== 'object' || !Array.isArray(data.players)) data = { players: [] };
        data.players = data.players.map(_entry).filter(Boolean);
        _cache = data;
        return data;
    }

    function _save() {
        const data = _load();
        data.updatedAt = Date.now();
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error('Could not save the player database:', e); }
    }

    // -------------------------------------------------------------------------
    // Reading
    // -------------------------------------------------------------------------

    function all() { return _load().players.slice(); }
    function active() { return _load().players.filter(p => !p.archived); }
    function get(id) {
        if (!id) return null;
        const players = _load().players;
        return players.find(p => p.id === id) || players.find(p => p.merged.includes(id)) || null;
    }
    function byShort(name) {
        const n = norm(name);
        return n ? _load().players.find(p => norm(p.short) === n) || null : null;
    }
    /** The player a name belongs to: their short name first, then a previous name. */
    function byName(name) {
        const n = norm(name);
        if (!n) return null;
        const players = _load().players;
        return players.find(p => norm(p.short) === n) || players.find(p => p.prev.some(x => norm(x) === n)) || null;
    }
    const fullName = p => p ? [p.first, p.last].filter(Boolean).join(' ') : '';
    /** Active short names, for older app versions reading an export (playerList). */
    function shortNames() { return active().map(p => p.short); }

    // -------------------------------------------------------------------------
    // Changing
    // -------------------------------------------------------------------------

    /**
     * Whether a short name can be used (not empty, not another player's).
     * @param {string} short
     * @param {string} [exceptId] - the player being edited
     * @returns {null|string} why not, or null when it is fine
     */
    function shortNameProblem(short, exceptId) {
        const s = clean(short);
        if (!s) return 'A short name is needed.';
        const other = byShort(s);
        if (other && other.id !== exceptId) return `“${other.short}” is already ${fullName(other) || 'taken'}.`;
        return null;
    }

    function create({ short, first, last }) {
        if (shortNameProblem(short)) return null;
        const p = _entry({ id: newId(), short, first, last, created: Date.now() });
        _load().players.push(p);
        _save();
        return p;
    }

    /** Find a player by short or previous name, or create one with that short name. */
    function findOrCreate(name) {
        return byName(name) || create({ short: name });
    }

    /**
     * Change a player's names. A changed short name is kept as a previous name, so older
     * results under it still count for the player.
     */
    function update(id, { short, first, last }) {
        const p = get(id);
        if (!p || shortNameProblem(short, p.id)) return false;
        const s = clean(short);
        if (s !== p.short) {
            if (!p.prev.some(x => norm(x) === norm(p.short))) p.prev.push(p.short);
            p.prev = p.prev.filter(x => norm(x) !== norm(s));
        }
        p.short = s;
        p.first = clean(first);
        p.last = clean(last);
        _save();
        return true;
    }

    function setArchived(id, archived) {
        const p = get(id);
        if (!p) return;
        p.archived = !!archived;
        _save();
    }

    /** Delete a player. Only for players who were never in Analytics (the caller checks). */
    function remove(id) {
        const data = _load();
        data.players = data.players.filter(p => p.id !== id);
        _save();
    }

    /**
     * Merge two entries for the same person. `keepId` keeps its details; the other's ID
     * and names are kept with it (as merged ID and previous names), so its tournaments
     * and Analytics now count for the kept player.
     */
    function merge(keepId, goneId) {
        const keep = get(keepId), gone = get(goneId);
        if (!keep || !gone || keep === gone) return false;
        keep.merged.push(gone.id, ...gone.merged);
        [gone.short, ...gone.prev].forEach(n => {
            if (norm(n) !== norm(keep.short) && !keep.prev.some(x => norm(x) === norm(n))) keep.prev.push(n);
        });
        if (!keep.first) keep.first = gone.first;
        if (!keep.last) keep.last = gone.last;
        keep.archived = keep.archived && gone.archived;
        const data = _load();
        data.players = data.players.filter(p => p !== gone);
        _save();
        return true;
    }

    // -------------------------------------------------------------------------
    // Moving between computers: exports, imports, uploads
    // -------------------------------------------------------------------------

    /** The database as it goes into a tournament file or upload. */
    function exportData() {
        const data = _load();
        return { players: data.players.map(p => Object.assign({}, p)), updatedAt: data.updatedAt || Date.now() };
    }

    /**
     * Bring in players from a tournament file: its playerDatabase (by ID: new players are
     * added, merges are followed; names already here win), or, from an older file, its
     * playerList of names. Never replaces the database.
     * @param {object} fileData - a tournament export
     * @returns {number} how many players were added
     */
    function mergeFrom(fileData) {
        if (!fileData) return 0;
        let added = 0;
        const db = fileData.playerDatabase;
        if (db && Array.isArray(db.players)) {
            db.players.map(_entry).filter(Boolean).forEach(e => {
                const here = get(e.id) || e.merged.map(get).find(Boolean);
                if (here) {
                    // same person: keep our names, learn their merges and old names
                    e.merged.concat(e.id).forEach(id => { if (id !== here.id && !here.merged.includes(id)) here.merged.push(id); });
                    [e.short, ...e.prev].forEach(n => { if (norm(n) !== norm(here.short) && !here.prev.some(x => norm(x) === norm(n))) here.prev.push(n); });
                    return;
                }
                if (byShort(e.short)) {
                    // a different ID with a short name we already use: keep both, theirs numbered
                    let s = e.short + ' (2)', k = 2;
                    while (byShort(s)) s = `${e.short} (${++k})`;
                    e.short = s;
                }
                _load().players.push(e);
                added++;
            });
        } else if (Array.isArray(fileData.playerList)) {
            fileData.playerList.filter(n => typeof n === 'string' && clean(n)).forEach(n => {
                if (!byName(n)) { _load().players.push(_entry({ id: newId(), short: n, created: Date.now() })); added++; }
            });
        }
        if (added || db) _save();
        return added;
    }

    // -------------------------------------------------------------------------
    // First run: create players from the saved players and the names in Analytics
    // -------------------------------------------------------------------------

    /**
     * Create the database the first time: one player per saved player (playerList), plus
     * every name in the Analytics register and the tournaments on this computer. First and
     * last names are left to fill in. Runs once; returns how many players it created.
     * @returns {Promise<number>}
     */
    async function migrate() {
        const data = _load();
        if (data.migrated || onAnalyticsInstance()) return 0;
        let created = 0;
        const add = (n) => {
            if (typeof n === 'string' && clean(n) && !byName(n)) {
                data.players.push(_entry({ id: newId(), short: n, created: Date.now() }));
                created++;
            }
        };
        // this computer's names first (no waiting), then the Analytics register's
        try { (JSON.parse(localStorage.getItem('playerList') || '[]') || []).forEach(add); } catch (e) { /* none */ }
        try { (JSON.parse(localStorage.getItem('dartsTournaments') || '[]') || []).forEach(t => (t.players || []).forEach(p => add(p && p.name))); } catch (e) { /* none */ }
        data.importNotice = created; // the notice counts what is in so far, then the rest
        _save();
        if (typeof NewtonDB !== 'undefined') {
            try {
                const records = await NewtonDB.getAllTournaments();
                records.forEach(t => Object.values(t.tournamentAchievements || {}).forEach(a => add(a && a.name)));
            } catch (e) { /* the register is not available here */ }
        }
        data.migrated = true;
        data.importNotice = created;
        _save();
        return created;
    }

    /**
     * An analytics-only instance (NEWTON_MODE=analytics), even when opened with ?tm: its
     * player database is the copy the club uploads, not one of its own.
     */
    function onAnalyticsInstance() {
        return !!(window.NEWTON_CONFIG && window.NEWTON_CONFIG.instanceMode === 'analytics');
    }

    function importNotice() { return _load().importNotice || 0; }
    function dismissImportNotice() { _load().importNotice = 0; _save(); }

    // -------------------------------------------------------------------------
    // Tournaments: which registry player each tournament player is
    // -------------------------------------------------------------------------

    /**
     * A tournament's players as { tournament player id: registry id }, found from the
     * tournament itself (the live one, or the saved copy). Used when a tournament goes
     * into Analytics.
     * @param {string|number} tournamentId
     * @param {object[]} [list] - the tournament's players, when the caller has them
     * @returns {Object<string, string>}
     */
    function registryIdsFor(tournamentId, list) {
        let ps = list;
        if (!ps && typeof tournament !== 'undefined' && tournament && String(tournament.id) === String(tournamentId) && typeof players !== 'undefined') ps = players;
        if (!ps) {
            try {
                const saved = (JSON.parse(localStorage.getItem('dartsTournaments') || '[]') || []).find(t => String(t.id) === String(tournamentId));
                ps = saved && saved.players;
            } catch (e) { ps = null; }
        }
        const map = {};
        (ps || []).forEach(p => { if (p && p.registryId) map[String(p.id)] = String(p.registryId); });
        return map;
    }

    /**
     * Who has played: per registry player, the finished tournaments in the Analytics
     * register and the last date, and whether they have ever been in Analytics at all
     * (a finished tournament there, or a played match in a tournament on this computer).
     * Players who have been in Analytics can't be deleted.
     * @returns {Promise<Map<string, {played: number, lastPlayed: number|null, entered: boolean}>>}
     */
    async function usage() {
        const out = new Map();
        const mark = (p, closedAt, final) => {
            if (!p) return;
            const u = out.get(p.id) || { played: 0, lastPlayed: null, entered: false };
            u.entered = true;
            if (final) {
                u.played++;
                if (closedAt && (!u.lastPlayed || closedAt > u.lastPlayed)) u.lastPlayed = closedAt;
            }
            out.set(p.id, u);
        };
        if (typeof NewtonDB !== 'undefined') {
            try {
                const records = await NewtonDB.getAllTournaments();
                records.forEach(t => {
                    const ids = t.registryIds || {};
                    const ms = t.closedAt ? (t.closedAt > 1e12 ? t.closedAt : t.closedAt * 1000) : null;
                    Object.entries(t.tournamentAchievements || {}).forEach(([pid, a]) => {
                        mark(get(ids[pid]) || byName(a && a.name), ms, t.status === 'final');
                    });
                });
            } catch (e) { /* the register is not available here */ }
        }
        // tournaments on this computer with a played match: their players are in Analytics
        let local = [];
        try { local = JSON.parse(localStorage.getItem('dartsTournaments') || '[]') || []; } catch (e) { local = []; }
        if (typeof tournament !== 'undefined' && tournament && typeof players !== 'undefined') {
            local = local.filter(t => String(t.id) !== String(tournament.id)).concat([{ players, matches: typeof matches !== 'undefined' ? matches : [] }]);
        }
        local.forEach(t => {
            const played = (t.matches || []).filter(m => m.completed && !m.autoAdvanced);
            if (!played.length) return;
            const inPlay = new Set();
            played.forEach(m => [m.player1, m.player2].forEach(x => { if (x && x.id != null) inPlay.add(String(x.id)); }));
            (t.players || []).forEach(pl => { if (inPlay.has(String(pl.id))) mark(get(pl.registryId) || byName(pl.name), null, false); });
        });
        return out;
    }

    return {
        usage, onAnalyticsInstance,
        all, active, get, byShort, byName, fullName, shortNames,
        shortNameProblem, create, findOrCreate, update, setArchived, remove, merge,
        exportData, mergeFrom, migrate, importNotice, dismissImportNotice, registryIdsFor
    };
})();
