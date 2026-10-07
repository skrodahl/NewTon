// tournament-management.js - Config-Free Tournament Operations
// NEVER touches global config - only tournament-specific data

// Setup page tournament list: which tab shows ('local' | 'server'), and whether a server answered
let setupListSource = 'local';
let setupServerAvailable = false;

// One-time guard so a corrupt registry only alerts the user once per session
let _registryReadFailed = false;

// One-time guard so a failed save (quota/corruption) only alerts once, until the next good save
let _saveFailedAlerted = false;

/**
 * Reads and parses the saved-tournaments registry ('dartsTournaments') from localStorage.
 * Single guarded reader: on corrupt/unparseable data it returns an empty array instead of
 * throwing, so one bad value can't simultaneously break loading, deletion, and the Recent
 * Tournaments list. Surfaces the failure (console every time, a single alert once per session).
 *
 * NOTE: read-modify-write-back callers (saveTournamentOnly, import) deliberately do NOT use
 * this helper — for them, returning [] on corruption would overwrite and destroy the other
 * tournaments. Those sites keep the throw-and-abort behavior until Phase 4.2 adds write handling.
 *
 * @returns {Array<object>} Saved tournament records, or [] on missing/corrupt data
 */
function readTournamentsRegistry() {
    const raw = localStorage.getItem('dartsTournaments');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to parse dartsTournaments registry — treating as empty:', e);
        if (!_registryReadFailed) {
            _registryReadFailed = true;
            alert('Warning: the saved tournaments list could not be read (the stored data may ' +
                  'be corrupted). Existing tournaments are temporarily unavailable. Do NOT create, ' +
                  'save, or import tournaments until this is resolved, or the stored data may be ' +
                  'overwritten.');
        }
        return [];
    }
}

/**
 * Returns the current tournament's format, defaulting to 'DE' for backward compatibility.
 * Tournaments created before SE support have no format field — they are always DE.
 *
 * @returns {'DE'|'SE'} The tournament format
 */
function getFormat() {
    return (tournament && tournament.format) || 'DE';
}

/**
 * Returns a display label for a tournament's status (Setup / Active / Completed).
 * Prefers the explicit `status` field; falls back to deriving from bracket + matches state
 * for older tournaments that don't carry the field.
 *
 * @param {object} t - tournament-shaped object (active, saved, or imported)
 * @returns {string} capitalized status label, or '-' if no tournament
 */
function tournamentStatusLabel(t) {
    if (!t) return '-';
    // Shown as New / Active / Completed; the stored status 'setup' reads as New
    const label = { setup: 'New', active: 'Active', completed: 'Completed' };
    if (t.status) {
        return label[t.status] || t.status.charAt(0).toUpperCase() + t.status.slice(1);
    }
    if (!t.bracket) return 'New';
    const matchesArr = t.matches || [];
    if (matchesArr.length === 0) return 'New';
    if (matchesArr.every(m => m.completed)) return 'Completed';
    return 'Active';
}

// Helper function to clear tournament input fields
function clearTournamentFields() {
    const nameElement = document.getElementById('tournamentName');
    const dateElement = document.getElementById('tournamentDate');
    
    if (nameElement) nameElement.value = '';
    if (dateElement) {
        const today = new Date().toISOString().split('T')[0];
        dateElement.value = today;
    }
}

/**
 * Creates a new tournament from form inputs and initializes global state.
 * Entry point for starting a new tournament - clears all existing data.
 *
 * @returns {void}
 *
 * @description
 * - Reads name and date from DOM form elements
 * - Validates required fields and checks for duplicates
 * - Creates clean tournament object with 'setup' status
 * - Resets global players and matches arrays
 * - Clears UI and saves to localStorage
 * - Navigates to Setup page
 */
/**
 * Storage-full guard. Pre-empts the localStorage quota problem at the entry points
 * (create / import) instead of handling a QuotaExceededError mid-save. Best-effort:
 * if usage can't be read it does NOT block — the saveTournamentOnly() try/catch is the
 * real backstop. Reuses getLocalStorageStats() (analytics.js).
 * @param {string} action - short phrase for the message, e.g. "create a new tournament"
 * @returns {boolean} true if the action should be blocked
 */
function storageGateBlocks(action) {
    if (typeof getLocalStorageStats !== 'function') return false;
    let stats;
    try {
        stats = getLocalStorageStats();
    } catch (e) {
        console.warn('Storage usage check failed — not blocking:', e);
        return false;
    }
    if (stats && stats.percentage >= 90) {
        alert(`Browser storage is ${stats.percentage}% full — there may not be room to ${action}.\n\n` +
              `Free up space first: open "Storage Space" on the Tournament Setup page to export and delete old ` +
              `tournaments. Deleting a finalized tournament keeps its stats in Analytics.`);
        return true;
    }
    return false;
}

function createTournament() {
    const name = document.getElementById('tournamentName').value.trim();
    const date = document.getElementById('tournamentDate').value;

    if (!name || !date) {
        alert('Please enter both tournament name and date');
        return;
    }

    if (storageGateBlocks('create a new tournament')) return;

    // Check for duplicate tournament with same name and date
    const existingTournaments = readTournamentsRegistry();
    const duplicateTournament = existingTournaments.find(t => t.name === name && t.date === date);
    
    if (duplicateTournament) {
        alert(`A tournament named "${name}" on ${date} already exists.\n\nPlease choose a different name or date.`);
        // Clear fields after failed creation attempt
        clearTournamentFields();
        return;
    }

    // CREATE CLEAN TOURNAMENT OBJECT - No config contamination
    tournament = {
        id: Date.now(),
        name: name,
        date: date,
        created: new Date().toISOString(),
        status: 'setup',
        players: [],
        matches: [],
        bracket: null,
        placements: {}
    };

    // Clear all existing tournament data for fresh start
    players = [];
    matches = [];
    localStorage.removeItem('undoneTransactions');

    // Clear the UI
    updatePlayersDisplay();
    updatePlayerCount();
    if (typeof clearBracket === 'function') {
        clearBracket();
    }

    // Hide results section if visible
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    // Reset date to today for next tournament creation
    setTodayDate();

    // Save tournament (but NOT config)
    saveTournamentOnly();
    updateTournamentStatus();

    // Refresh recent tournaments list to show the new tournament
    loadRecentTournaments();

    // Clear fields after successful creation. Setup stays open: its current tournament card
    // shows the next step (Register players)
    clearTournamentFields();

    // Ensure results table is populated
    if (typeof displayResults === 'function') {
        displayResults();
    }


    alert('✓ New tournament created successfully! Start by adding players.');

    // HELP SYSTEM INTEGRATION
    if (typeof onTournamentCreated === 'function') {
        onTournamentCreated();
    }
}

// Helper function to prune transaction history for completed tournaments
// Uses same smart pruning algorithm as Developer Console
function pruneTransactionHistory(history, completedMatches) {
    if (!history || history.length === 0 || !completedMatches || completedMatches.length === 0) {
        return history; // Nothing to prune
    }

    const toRemove = [];

    completedMatches.forEach(match => {
        const matchId = match.id;
        // Match strictly on matchId — a description substring check would let
        // 'FS-1-1' claim transactions belonging to FS-1-10..FS-1-16
        const matchTxns = history.filter(t => t.matchId === matchId);

        const lanes = matchTxns.filter(t => t.type === 'ASSIGN_LANE');
        const refs = matchTxns.filter(t => t.type === 'ASSIGN_REFEREE');
        const starts = matchTxns.filter(t => t.type === 'START_MATCH');
        const stops = matchTxns.filter(t => t.type === 'STOP_MATCH');

        // Keep only last lane assignment, remove rest
        if (lanes.length > 1) {
            toRemove.push(...lanes.slice(0, -1));
        }

        // Keep only last referee assignment, remove rest
        if (refs.length > 1) {
            toRemove.push(...refs.slice(0, -1));
        }

        // Remove ALL start/stop (completion is sufficient)
        toRemove.push(...starts, ...stops);
    });

    // Filter out transactions to remove. Skip transactions with no identifier —
    // an undefined key would match (and drop) every other id-less transaction.
    const keyOf = t => t.id || t.timestamp || null;
    const idsToRemove = new Set(toRemove.map(keyOf).filter(k => k !== null));
    const prunedHistory = history.filter(t => {
        const key = keyOf(t);
        return key === null || !idsToRemove.has(key);
    });

    console.log(`✓ Export pruning: Removed ${toRemove.length} redundant transactions from export`);
    return prunedHistory;
}

/**
 * Exports current tournament to a JSON file for backup or sharing.
 * Includes tournament data, players, matches, bracket, and transaction history.
 * Prunes redundant transactions for completed tournaments to reduce file size.
 *
 * @returns {void}
 *
 * @description
 * - Creates downloadable JSON file with v4.0 export format
 * - Includes per-tournament transaction history for undo support
 * - Prunes history for completed tournaments (removes superseded transactions)
 * - Includes Saved Players snapshot for player list restoration
 */
function exportTournament() {
    // Reuse the shared payload builder (single source of truth for the export shape,
    // history pruning, and filename) rather than re-assembling it here.
    const payload = buildTournamentPayload();
    if (!payload) {
        alert('No active tournament to export');
        return;
    }

    const dataStr = JSON.stringify(payload.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = payload.filename;
    link.click();
    URL.revokeObjectURL(url); // release the blob URL (previously leaked for the page lifetime)

    console.log(`✓ Tournament exported (v4.0 format, ${payload.data.history.length} transactions)`);
}

/**
 * Build the tournament export payload from the current in-memory state.
 * Shared by exportTournament() and autoUploadTournament().
 * @returns {{ filename: string, data: object }|null}
 */
function buildTournamentPayload() {
    if (!tournament || !tournament.id) return null;

    const historyKey = `tournament_${tournament.id}_history`;
    let history = [];
    try {
        const historyData = localStorage.getItem(historyKey);
        if (historyData) history = JSON.parse(historyData);
    } catch (e) { /* ignore */ }

    if (tournament.status === 'completed' && history.length > 0) {
        const completedMatches = matches.filter(m => m.completed);
        history = pruneTransactionHistory(history, completedMatches);
    }

    const playerList = getPlayerList();

    // Sanitize filesystem-hostile characters so the name is safe as both a download
    // filename and a server-side upload filename. Deterministic (same tournament →
    // same name, so re-uploads still overwrite); a name without hostile chars is
    // unchanged. Server-side matching is by JSON id/name+date, not the filename.
    const safeName = `${tournament.name}_${tournament.date}`
        .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '-')
        .replace(/^[.\s]+|[.\s]+$/g, '') || 'tournament';

    return {
        filename: `${safeName}.json`,
        data: {
            exportVersion: "4.1",
            id: tournament.id,
            name: tournament.name,
            date: tournament.date,
            created: tournament.created,
            status: tournament.status,
            bracketSize: tournament.bracketSize,
            format: tournament.format,
            seeding: tournament.seeding,
            groups: tournament.groups, // groups and cups: the group draw (absent in other formats)
            cups: tournament.cups, // groups and cups: the cup draw (absent until drawn)
            readOnly: tournament.readOnly || false,
            config: configForExport(),
            players: players,
            matches: matches,
            bracket: tournament.bracket,
            placements: tournament.placements || {},
            history: history,
            playerList: playerList, // the active short names, for older versions of the app
            playerDatabase: typeof PlayerRegistry !== 'undefined' ? PlayerRegistry.exportData() : undefined,
            exportedAt: new Date().toISOString()
        }
    };
}

/**
 * Global Settings → Remote backup → Test connection. Asks the remote server's key check
 * (api/key-check.php) through this computer's relay, the way a backup travels, with the
 * address and API key as they are in the form (saved or not). Says whether the server was
 * reached, and whether it asks for a key and accepts this one. Writes nothing anywhere.
 * @returns {Promise<void>}
 */
async function testRemoteConnection() {
    const out = document.getElementById('remoteTestResult');
    const btn = document.getElementById('remoteTestBtn');
    const url = (document.getElementById('remoteServerUrl') || {}).value || '';
    const key = (document.getElementById('remoteServerApiKey') || {}).value || '';
    if (!out) return;
    const say = (cls, text) => { out.className = 'cfg-test ' + cls; out.textContent = text; out.hidden = false; };
    const base = url.trim().replace(/\/+$/, '');
    if (!base) { say('cfg-warn', 'Enter the server address first.'); return; }
    if (!/^https?:\/\//i.test(base)) { say('cfg-warn', 'The address must start with https:// (or http://).'); return; }
    let host = base;
    try { host = new URL(base).host; } catch (e) { say('cfg-warn', 'That doesn\'t look like a web address.'); return; }

    say('', `Testing ${host}…`);
    if (btn) btn.disabled = true;
    try {
        let res;
        try {
            res = await fetch('/api/relay.php', {
                method: 'POST',
                headers: apiWriteHeaders(),
                body: JSON.stringify({ url: base + '/api/key-check.php', apiKey: key.trim(), payload: {} })
            });
        } catch (e) {
            say('cfg-bad', 'This computer has no backup server to send through. Backups need the Docker version of NewTon.');
            return;
        }
        let data = null;
        try { data = await res.json(); } catch (e) { data = null; }

        if (data && data.app === 'newton') {
            if (data.keyRequired && data.keyAccepted) {
                say('cfg-ok', `✓ Connected to ${host}. The API key is accepted.`);
                // Lock the address and key (an unsaved change, like any other on the page)
                const flag = document.getElementById('remoteServerVerified');
                if (flag && flag.value !== '1') {
                    flag.value = '1';
                    flag.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            else if (data.keyRequired) say('cfg-bad', key.trim() ? `✗ ${host} answered, but the API key is wrong.` : `✗ ${host} asks for an API key. Enter the NEWTON_API_KEY set on that server.`);
            else say('cfg-warn', `Connected to ${host}, but it doesn't ask for an API key${key.trim() ? ', so the key here isn\'t needed' : ''}. Anyone who can reach it can upload; set NEWTON_API_KEY there to protect it.`);
        } else if (res.status === 502) {
            say('cfg-bad', `✗ Could not reach ${host}${data && data.detail ? ': ' + data.detail : ''}. Check the address, and that the server is running.`);
        } else if (res.status === 401 && data && data.error) {
            say('cfg-bad', `✗ This computer's own server needs its API key to send backups (${data.error}).`);
        } else if (res.status === 401) {
            say('cfg-bad', `✗ ${host} asks for a login (a password on the web server in front of it). Backups use the API key instead; remove that login, or let /api/ through.`);
        } else if (res.status === 403 && data && data.error) {
            say('cfg-bad', `✗ ${data.error}`);
        } else if (res.status === 404) {
            say('cfg-warn', `${host} answered, but it is an older version of NewTon (or not NewTon), so the key can't be checked. Backups may still work.`);
        } else {
            say('cfg-bad', `✗ ${host} answered with an error (${res.status}${data && data.error ? ': ' + data.error : ''}).`);
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}

/**
 * Headers for a request that changes something on this server (upload, delete,
 * corrections). Adds the API key when the server handed one to the page, which it does
 * only for a ?tm page opened with the correct password (NEWTON_API_KEY, api/api-check.php).
 * @returns {Object<string, string>}
 */
function apiWriteHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const key = window.NEWTON_CONFIG && window.NEWTON_CONFIG.apiKey;
    if (key) headers['X-API-Key'] = key;
    return headers;
}

/**
 * Upload a tournament payload to a server.
 * @param {object} payload - { filename, data } from buildTournamentPayload()
 * @param {object} [options]
 * @param {boolean} [options.silent=false] - true for fire-and-forget, false for user feedback
 * @param {string} [options.remoteUrl] - remote server URL (uses relay.php); omit for local upload
 * @param {string} [options.apiKey] - the remote server's API key (sent on by relay.php)
 * @returns {Promise<boolean>} true if upload succeeded
 */
async function uploadToServer(payload, options = {}) {
    const silent = options.silent || false;
    const remoteUrl = options.remoteUrl || '';

    if (!payload) {
        if (!silent) alert('No active tournament to upload.');
        return false;
    }

    let fetchUrl, fetchBody;

    if (remoteUrl) {
        // Remote upload via relay — PHP forwards it with the remote server's API key
        fetchUrl = '/api/relay.php';
        fetchBody = JSON.stringify({
            url: remoteUrl.replace(/\/+$/, '') + '/api/upload-tournament.php?overwrite=true',
            apiKey: options.apiKey || '',
            payload: payload
        });
    } else {
        // Local upload — direct to same-origin API
        fetchUrl = '/api/upload-tournament.php?overwrite=true';
        fetchBody = JSON.stringify(payload);
    }

    const label = remoteUrl ? remoteUrl : 'local server';

    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: apiWriteHeaders(),
            body: fetchBody
        });

        if (response.ok) {
            console.log(`✓ Tournament uploaded to ${label}: ${payload.filename}`);
            if (!silent) {
                alert(`✓ Tournament uploaded to ${label}.\n\n${payload.filename}`);
                if (typeof loadRecentTournaments === 'function') loadRecentTournaments();
            }
            return true;
        } else {
            const result = await response.json().catch(() => ({}));
            const msg = result.error || 'Unknown error';
            console.warn(`Upload to ${label} failed (${response.status}):`, msg);
            if (!silent) alert(`Upload to ${label} failed: ${msg}`);
            return false;
        }
    } catch (e) {
        console.log(`Upload to ${label} skipped — not available`);
        if (!silent) alert(`${label} not available.`);
        return false;
    }
}

/**
 * Auto-upload the current tournament. Fire-and-forget.
 * Uploads to local server, and to remote if configured.
 * Called at tournament finalization when config.server.autoUpload is enabled.
 */
async function autoUploadTournament() {
    const payload = buildTournamentPayload();
    if (!payload) return;

    // Upload to local server
    uploadToServer(payload, { silent: true });

    // Upload to remote server if configured
    const remote = config && config.server && config.server.remoteUrl;
    if (remote) {
        uploadToServer(payload, {
            silent: true,
            remoteUrl: remote,
            apiKey: config.server.remoteApiKey || ''
        });
    }
}

/**
 * Show the upload modal with destination info.
 */
function showUploadModal() {
    // Build destination info — config.server.remoteUrl is user-configurable, so build with
    // textContent rather than innerHTML interpolation.
    const destinations = ['This server'];
    const remote = config && config.server && config.server.remoteUrl;
    if (remote) destinations.push(remote);

    const infoEl = document.getElementById('uploadDestinationInfo');
    if (infoEl) {
        infoEl.replaceChildren();
        const title = document.createElement('div');
        title.className = 'upload-destination__title';
        title.textContent = 'Uploads to:';
        infoEl.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'upload-destination__list';
        destinations.forEach(d => {
            const li = document.createElement('li');
            li.textContent = d;
            list.appendChild(li);
        });
        infoEl.appendChild(list);
    }

    // Reset source selection
    const activeRadio = document.querySelector('input[name="uploadSource"][value="active"]');
    if (activeRadio) activeRadio.checked = true;

    pushDialog('uploadToServerModal', null, true);
}

/**
 * Execute the upload based on modal selections.
 */
async function executeUpload() {
    const source = document.querySelector('input[name="uploadSource"]:checked');
    if (!source) return;

    popDialog();

    if (source.value === 'file') {
        // Trigger file picker — handleUploadFileSelected() will do the upload
        document.getElementById('uploadFileInput').click();
    } else {
        // Upload active tournament
        const payload = buildTournamentPayload();
        if (!payload) {
            alert('No active tournament to upload.');
            return;
        }
        await _uploadToAllDestinations(payload);
    }
}

/**
 * Handle file selected for upload. Reads the file and uploads.
 */
async function handleUploadFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    try {
        const text = await file.text();
        const data = JSON.parse(text);
        const payload = { filename: file.name, data: data };
        await _uploadToAllDestinations(payload);
    } catch (e) {
        alert('Failed to read file: ' + e.message);
    }
}

/**
 * Upload a payload to all configured destinations (local + remote).
 * Shows user feedback.
 * @param {object} payload - { filename, data }
 */
async function _uploadToAllDestinations(payload) {
    const results = [];

    // Local upload
    const localOk = await uploadToServer(payload, { silent: true });
    results.push(localOk ? '✓ This server' : '✗ This server');

    // Remote upload if configured
    const remote = config && config.server && config.server.remoteUrl;
    if (remote) {
        const remoteOk = await uploadToServer(payload, {
            silent: true,
            remoteUrl: remote,
            apiKey: config.server.remoteApiKey || ''
        });
        results.push(remoteOk ? `✓ ${remote}` : `✗ ${remote}`);
    }

    alert(`Upload complete:\n\n${results.join('\n')}\n\nFile: ${payload.filename}`);
    if (typeof loadRecentTournaments === 'function') loadRecentTournaments();
}

// Upload tournament file to server (bonus feature - file picker based)
async function uploadTournamentFile(event, overwrite = false) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Read file content
        const fileContent = await file.text();
        const tournamentData = JSON.parse(fileContent);

        const filename = file.name;

        // Build URL with optional overwrite parameter
        const url = overwrite
            ? '/api/upload-tournament.php?overwrite=true'
            : '/api/upload-tournament.php';

        const response = await fetch(url, {
            method: 'POST',
            headers: apiWriteHeaders(),
            body: JSON.stringify({
                filename: filename,
                data: tournamentData
            })
        });

        const result = await response.json();

        // Handle 409 Conflict (file already exists)
        if (response.status === 409) {
            const confirmOverwrite = confirm(
                `Tournament "${filename}" already exists on the server.\n\n` +
                `Do you want to overwrite it?`
            );

            if (confirmOverwrite) {
                // Retry with overwrite flag
                await uploadTournamentFile(event, true);
            } else {
                // Clear file input
                event.target.value = '';
            }
            return;
        }

        if (!response.ok) {
            alert(`Upload failed: ${result.error || 'Unknown error'}`);
            return;
        }

        const message = result.overwritten
            ? `✓ Tournament updated on server successfully!\n\n${filename}`
            : `✓ Tournament uploaded to server successfully!\n\n${filename}`;

        alert(message);

        // Reload tournament list to show newly uploaded tournament
        if (typeof loadRecentTournaments === 'function') {
            loadRecentTournaments();
        }

        // Clear file input
        event.target.value = '';

    } catch (error) {
        console.error('Error uploading tournament:', error);
        alert('Error uploading tournament to server: ' + error.message);
    }
}

/**
 * Saves current tournament to localStorage without touching global config.
 * This is the core save function - saveTournament() is a wrapper around this.
 *
 * @param {boolean} [shouldLog=true] - Whether to log save confirmation to console
 * @returns {void}
 *
 * @description
 * - Saves to both 'dartsTournaments' array and 'currentTournament' snapshot
 * - Never modifies global config (point values, UI settings, etc.)
 * - Includes all tournament-specific data: players, matches, bracket, placements
 * - Called frequently during tournament operations
 */
function saveTournamentOnly(shouldLog = true) {
    if (!tournament) return true;
    if (tournament._analyticsPreview) return true; // Analytics previews never persist

    try {
        // Build clean tournament object with current data
        const tournamentToSave = {
            id: tournament.id,
            name: tournament.name,
            date: tournament.date,
            created: tournament.created,
            status: tournament.status,
            players: players, // Tournament-specific player data
            matches: matches, // Tournament-specific match data
            bracket: tournament.bracket,
            bracketSize: tournament.bracketSize, // ✅ Fixed: Include bracketSize
            format: tournament.format, // SE/DE format (absent = DE for backward compat)
            seeding: tournament.seeding, // who was seeded in the draw (absent = a random draw)
            groups: tournament.groups, // groups and cups: the group draw (absent in other formats)
            cups: tournament.cups, // groups and cups: the cup draw (absent until drawn)
            placements: tournament.placements || {},
            readOnly: tournament.readOnly, // ✅ Fixed: Include readOnly flag
            lastSaved: new Date().toISOString()
            // NO CONFIG DATA - Config stays global
        };

        // Save to tournaments list
        let tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
        const index = tournaments.findIndex(t => t.id === tournament.id);

        if (index >= 0) {
            tournaments[index] = tournamentToSave;
        } else {
            tournaments.push(tournamentToSave);
        }

        localStorage.setItem('dartsTournaments', JSON.stringify(tournaments));
        localStorage.setItem('currentTournament', JSON.stringify(tournamentToSave));

        _saveFailedAlerted = false; // a good save clears the sticky alert
        if (shouldLog) {
            console.log('✓ Tournament saved (config unchanged)');
        }
        return true;
    } catch (e) {
        // Quota exhausted, or a corrupt dartsTournaments value that won't parse. Either way the
        // write is aborted before it can overwrite/diverge, and the in-memory tournament is
        // unchanged — freeing space and repeating the action will persist it. Alert once (this
        // runs on every match completion, so don't spam) until the next successful save.
        console.error('Failed to save tournament:', e);
        if (!_saveFailedAlerted) {
            _saveFailedAlerted = true;
            alert('Could not save — browser storage is full or unreadable, so your latest change is NOT stored.\n\n' +
                  'Open "Storage Space" on the Tournament Setup page to export and delete old tournaments, then repeat the action.');
        }
        return false;
    }
}

// Simple debouncing to prevent save spam
let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 100; // Wait 100ms between save logs

/**
 * Saves current tournament with debounced logging and UI updates.
 * Wrapper around saveTournamentOnly() for backward compatibility.
 *
 * @returns {void}
 *
 * @description
 * - Debounces console logging to prevent spam (100ms threshold)
 * - Updates tournament watermark display after save
 * - Updates storage indicator to show current usage
 * - Primary save function called throughout the application
 */
function saveTournament() {
    const now = Date.now();
    const shouldLog = (now - lastSaveTime) > SAVE_DEBOUNCE_MS;

    saveTournamentOnly(shouldLog);

    // Update CAD-style information box whenever tournament is saved

    // Update storage indicator
    if (typeof updateStorageIndicator === 'function') {
        updateStorageIndicator();
    }

    if (shouldLog) {
        lastSaveTime = now;
    }
}

function updateTournamentStatus() {
    const headerStatusDiv = document.getElementById('headerTournamentStatus');
    const headerStatusNarrow = document.getElementById('headerTournamentStatusNarrow');

    if (tournament) {
        const safeName = escapeHtml(tournament.name);
        const safeDate = escapeHtml(tournament.date);

        // Update wide header (two-row: name over date)
        if (headerStatusDiv) {
            headerStatusDiv.innerHTML = `<strong>${safeName}</strong><span class="tournament-date">${safeDate}</span>`;
        }

        // Update narrow header (single line with prefix)
        if (headerStatusNarrow) {
            headerStatusNarrow.innerHTML = `<span class="status-prefix">Active Tournament: </span><strong>${safeName}</strong> (${safeDate})`;
        }
    } else {
        // No tournament
        if (headerStatusDiv) {
            headerStatusDiv.innerHTML = '<strong>None</strong><span class="tournament-date"></span>';
        }

        if (headerStatusNarrow) {
            headerStatusNarrow.innerHTML = '<span class="status-prefix">Active Tournament: </span><strong>None</strong>';
        }
    }

    // Setup stays open when a tournament is created, loaded or imported, so its panels follow along
    renderSetupCurrent();
    if (typeof updateMatchHistory === 'function') updateMatchHistory();
}

/**
 * The loaded tournament's status band, across the top of Setup's current tournament and
 * Registration's next step: New / Active / Completed with a short fact, tinted by status
 * (css/setup-page.css, .st-band).
 * @returns {string} HTML, or '' when no tournament is loaded
 */
function currentTournamentStatusBand() {
    if (!tournament) return '';
    const status = tournamentStatusLabel(tournament);
    return `<div class="st-band st-band-${status.toLowerCase()}"><b>${escapeHtml(status)}</b><span>${currentTournamentStatusFact(status)}</span></div>`;
}

/**
 * The short fact beside the loaded tournament's status: the bracket isn't drawn yet, how many
 * matches are completed, or who won. Used by the status band and by Setup's current tournament.
 * @param {string} status - tournamentStatusLabel() of the loaded tournament
 * @returns {string} HTML-safe text
 */
function currentTournamentStatusFact(status) {
    const all = Array.isArray(matches) ? matches : [];
    const done = all.filter(m => m.completed).length;
    if (status === 'Completed') {
        const winnerId = Object.keys(tournament.placements || {}).find(id => tournament.placements[id] === 1);
        const winner = winnerId && (players || []).find(p => String(p.id) === winnerId);
        return winner ? `won by ${escapeHtml(winner.name)}` : 'the bracket is played out';
    }
    if (status === 'Active') return `${done} of ${all.length} matches completed`;
    return 'the bracket isn\'t drawn yet';
}

/** The state the New tournament form was last opened or closed for ('none', New, Active or Completed; null: not decided yet). */
let setupNewForState = null;

/**
 * Open or close the New tournament form on Setup.
 * @param {boolean} open
 * @returns {void}
 */
function setSetupNewOpen(open) {
    const form = document.getElementById('setupNewForm');
    const panel = document.getElementById('setupNew');
    const toggle = document.getElementById('setupNewToggle');
    if (!form || !panel || !toggle) return;
    form.hidden = !open;
    panel.classList.toggle('st-collapsed', !open);
    toggle.setAttribute('aria-expanded', String(open));
}

/**
 * The bar's toggle: open the form (and put the cursor in the name) or close it.
 * @returns {void}
 */
function toggleSetupNew() {
    const form = document.getElementById('setupNewForm');
    if (!form) return;
    const open = form.hidden;
    setSetupNewOpen(open);
    if (open) {
        const name = document.getElementById('tournamentName');
        if (name) name.focus();
    }
}

/**
 * Let the state decide what Setup puts first. New and Active: the current tournament, with its
 * next step as the one dark button, and New tournament a quiet bar. Completed, or nothing loaded:
 * the next job is a new tournament, so the form goes first, always open under a heading (it can't
 * be folded away), and Create is the dark button. Whichever panel is the one to act on is framed
 * (.st-focus). In New and Active the form only opens or closes when the state changes, so a redraw
 * never closes it under the user's hands.
 * @param {string|null} status - tournamentStatusLabel() of the loaded tournament, or null when none is loaded
 * @returns {void}
 */
function syncSetupNew(status) {
    const wantsNew = !status || status === 'Completed';
    const top = document.querySelector('.st-top');
    if (top) top.classList.toggle('st-new-first', wantsNew);
    const create = document.getElementById('setupCreateBtn');
    if (create) create.classList.toggle('st-primary', wantsNew);
    // The panel to act on is framed (css/setup-page.css, .st-focus)
    const current = document.getElementById('setupCurrent');
    const form = document.getElementById('setupNew');
    if (current) current.classList.toggle('st-focus', !wantsNew);
    if (form) form.classList.toggle('st-focus', wantsNew);
    // Completed or none: the form is the thing to do, so it is always open, under a heading
    // instead of the +/− toggle. New or Active: a quiet bar that opens on request, closed when
    // the state changes to one of them.
    const toggle = document.getElementById('setupNewToggle');
    const heading = document.getElementById('setupNewHeading');
    if (toggle) toggle.hidden = wantsNew;
    if (heading) heading.hidden = !wantsNew;
    const key = status || 'none';
    if (wantsNew) setSetupNewOpen(true);
    else if (setupNewForState !== key) setSetupNewOpen(false);
    setupNewForState = key;
}

/**
 * Fill the Setup page's current tournament panel: its status and the fact beside it, the name,
 * date and format, one line of facts (players, bracket, live now), the next step for its status,
 * and Export / Backup to server / Reset. Also lets the state decide what Setup puts first
 * (syncSetupNew()). Reads the live globals only.
 * @returns {void}
 */
function renderSetupCurrent() {
    const panel = document.getElementById('setupCurrent');
    if (!panel) return;
    syncSetupNew(tournament ? tournamentStatusLabel(tournament) : null);
    if (!tournament) {
        panel.classList.remove('st-current');
        panel.innerHTML = '<div class="st-empty"><b>No tournament loaded</b><span>Start a new one, or load one from the list below.</span></div>';
        return;
    }

    const status = tournamentStatusLabel(tournament);
    const all = Array.isArray(matches) ? matches : [];
    const list = Array.isArray(players) ? players : [];
    const paid = list.filter(p => p.paid).length;
    const done = all.filter(m => m.completed).length;
    const live = all.filter(m => getMatchState(m) === 'live');
    const hasBracket = !!tournament.bracket && all.length > 0;
    const format = hasBracket ? TOURNAMENT_FORMATS.find(f => f.id === getFormat()) : null;
    const lanes = live.map(m => m.lane).filter(Boolean).sort((a, b) => a - b);

    // One line of facts: the players, the bracket, and what is being played now
    const facts = [];
    facts.push(list.length ? `${list.length} player${list.length === 1 ? '' : 's'}, ${paid === list.length ? 'all paid' : `${paid} paid`}` : 'No players yet');
    if (hasBracket) facts.push(getFormat() === 'GROUPS' && typeof Groups !== 'undefined'
        ? `${Groups.groupList().length} groups${tournament.cups ? (tournament.cups.B ? ', A and B cups' : ', A cup') : ''}`
        : `${tournament.bracketSize}-player bracket`);
    if (hasBracket && status !== 'Completed') facts.push(`${live.length} live now${lanes.length ? ` (lane${lanes.length > 1 ? 's' : ''} ${lanes.join(', ')})` : ''}`);

    // The next step for the tournament's status: [title, hint, secondary button, main button]
    const toGo = all.length - done;
    const next = {
        New: ['Register players',
            list.length ? 'Draw the bracket from the bracket page when everyone is in.' : 'Add the players who are taking part.',
            ['Open bracket', "showPage('tournament')"], ['Register players', "showPage('registration')"]],
        Active: ['Run the matches',
            `${toGo} match${toGo === 1 ? '' : 'es'} to go${live.length ? `, ${live.length} being played now` : ''}.`,
            ['Player registration', "showPage('registration')"], ['Open bracket', "showPage('tournament')"]],
        Completed: ['See the results', 'Final standings, points and statistics are in Analytics.',
            ['Open bracket', "showPage('tournament')"], ['Open in Analytics', 'openAnalyticsForTournament(tournament.id)']]
    }[status] || null;

    panel.classList.add('st-current');
    panel.innerHTML = `
        <div class="st-current-head">
            <div>
                <p class="st-state"><span class="st-pill st-${status.toLowerCase()}">${escapeHtml(status)}</span><span>${currentTournamentStatusFact(status)}</span></p>
                <h3>${escapeHtml(tournament.name)}</h3>
                <div class="st-sub">${escapeHtml(tournament.date)}${format ? ` · ${escapeHtml(format.name)}` : ''}</div>
            </div>
        </div>
        <p class="st-facts-line">${facts.join(' · ')}</p>
        ${status === 'Active' && all.length ? `<div class="st-progress"><span style="width: ${Math.round(100 * done / all.length)}%"></span></div>` : ''}
        ${next ? `<div class="st-next">
            <div class="st-next-what"><p class="st-eyebrow">Next step</p><b>${next[0]}</b><span class="st-hint" id="setupNextHint">${next[1]}</span></div>
            <div class="st-next-acts"><button type="button" class="st-btn" onclick="${next[2][1]}">${next[2][0]}</button><button type="button" class="st-btn${status === 'Completed' ? '' : ' st-primary'}" id="setupNextMain" onclick="${next[3][1]}">${next[3][0]} →</button></div>
        </div>` : ''}
        <div class="st-quiet">
            <button type="button" class="st-link" onclick="exportTournament()">Export tournament</button>
            <button type="button" class="st-link" id="uploadToServerBtn" onclick="showUploadModal()"${setupServerAvailable ? '' : ' hidden'}>Backup to server</button>
            <button type="button" class="st-link st-danger" onclick="showResetTournamentModal()">Reset tournament…</button>
        </div>`;

    // A completed tournament that isn't in Analytics yet: offer to add it instead
    if (status === 'Completed' && typeof NewtonDB !== 'undefined') {
        const id = tournament.id;
        NewtonDB.getTournament(String(id)).then(found => {
            const main = document.getElementById('setupNextMain');
            if (found || !main || !tournament || tournament.id !== id) return;
            main.textContent = 'Add to Analytics →';
            main.setAttribute('onclick', 'addTournamentToAnalytics(tournament.id)');
            document.getElementById('setupNextHint').textContent = 'Add it to Analytics to see final standings, points and statistics.';
        }).catch(() => {});
    }
}

// SHARED TOURNAMENTS (SERVER FEATURE)
// Attempts to load tournaments from server - fails silently if not available
async function loadSharedTournaments() {
    console.log('[Shared Tournaments] Attempting to load from server...');
    try {
        const response = await fetch('/api/list-tournaments.php', {
            method: 'GET',
            cache: 'no-cache'
        });

        console.log('[Shared Tournaments] Response status:', response.status);

        if (!response.ok) {
            console.log('[Shared Tournaments] Server endpoint not available (status:', response.status, ')');
            return null;
        }

        const data = await response.json();
        console.log('[Shared Tournaments] Data received:', data);

        // A server answered: offer Backup to server and the Server tab
        setupServerAvailable = true;
        const uploadBtn = document.getElementById('uploadToServerBtn');
        if (uploadBtn) uploadBtn.hidden = false;

        console.log('[Shared Tournaments] Returning', data.tournaments?.length || 0, 'tournaments');
        return data.tournaments || [];

    } catch (error) {
        console.log('[Shared Tournaments] Error:', error.message);
        return null;
    }
}

/**
 * Fill the Setup page's Tournaments table: the tournaments saved on this computer, newest
 * first, or (on the Server tab, shown when a server answers) the tournaments shared on it.
 * The table scrolls; the loaded tournament is marked and can't be loaded or deleted again.
 * @returns {Promise<void>}
 */
async function loadRecentTournaments() {
    const container = document.getElementById('recentTournaments');
    if (!container) return;

    // Calls overlap (each waits for the server); only the latest one renders, so an earlier
    // call that finishes late can't overwrite the list with what it read before a save
    const token = loadRecentTournaments._token = (loadRecentTournaments._token || 0) + 1;

    // Try to load shared tournaments from server (null when there is no server)
    const sharedTournaments = await loadSharedTournaments();
    if (token !== loadRecentTournaments._token) return;
    if (!sharedTournaments) setupListSource = 'local';
    const tournaments = readTournamentsRegistry();

    // Per-render lookup: interactive elements reference entries by numeric index so
    // server-supplied filenames and tournament ids never enter inline handler strings.
    const rowActions = [];

    // This computer | Server tabs, only when a server answered
    const tabs = document.getElementById('setupListSource');
    if (tabs) {
        tabs.hidden = !sharedTournaments;
        tabs.innerHTML = sharedTournaments ? [['local', 'This computer', tournaments.length], ['server', 'Server', sharedTournaments.length]]
            .map(([src, label, n]) => `<button type="button" data-rt-idx="${rowActions.push({ action: 'source', value: src }) - 1}" aria-pressed="${setupListSource === src}">${label}<span class="st-n">${n}</span></button>`)
            .join('') : '';
    }

    // One delegated click listener per element (attached once): dispatches by the numeric
    // index stored on each interactive element via the current render's rowActions lookup.
    loadRecentTournaments._rowActions = rowActions;
    [container, tabs].forEach(el => {
        if (!el || el._rtDelegated) return;
        el._rtDelegated = true;
        el.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-rt-idx]');
            if (!btn) return;
            const entry = (loadRecentTournaments._rowActions || [])[parseInt(btn.getAttribute('data-rt-idx'), 10)];
            if (!entry) return;
            switch (entry.action) {
                case 'source':         setupListSource = entry.value; loadRecentTournaments(); break;
                case 'import':         loadSharedTournament(entry.value); break;
                case 'shared-delete':  deleteSharedTournament(entry.value); break;
                case 'analytics-view': openAnalyticsForTournament(entry.value); break;
                case 'analytics-add':  addTournamentToAnalytics(entry.value); break;
                case 'load':           loadSpecificTournament(entry.value); break;
                case 'local-delete':   deleteTournament(entry.value); break;
            }
        });
    });


    if (setupListSource === 'server') {
        const localTournamentKeys = new Set(tournaments.map(t => `${t.name}_${t.date}`));
        const allowDelete = config.server && config.server.allowSharedTournamentDelete;
        const sortedShared = sharedTournaments.slice().sort((a, b) =>
            new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));
        const rows = sortedShared.map(t => {
            const isLocal = localTournamentKeys.has(`${t.name}_${t.date}`);
            const importIdx = rowActions.push({ action: 'import', value: t.filename }) - 1;
            const deleteButton = allowDelete
                ? `<button type="button" class="st-btn st-sm st-icon" title="Delete from server" aria-label="Delete from server" data-rt-idx="${rowActions.push({ action: 'shared-delete', value: t.filename }) - 1}">×</button>`
                : '';
            return `<tr>
                <td class="st-name"><b>${escapeHtml(t.name)}</b></td>
                <td class="st-date">${escapeHtml(t.date)}</td>
                <td class="st-num">${escapeHtml(String(t.players || '?'))}</td>
                <td>${isLocal ? 'Yes' : '<span class="st-faint">No</span>'}</td>
                <td><span class="st-row-acts"><button type="button" class="st-btn st-sm" data-rt-idx="${importIdx}">${isLocal ? 'Re-import' : 'Import'}</button>${deleteButton}</span></td>
            </tr>`;
        }).join('');
        container.innerHTML = rows
            ? `<table class="st-table"><thead><tr><th>Name</th><th>Date</th><th class="st-num">Players</th><th>On this computer</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
            : '<div class="st-empty st-small"><span>No tournaments on the server yet.</span></div>';
    } else if (tournaments.length === 0) {
        container.innerHTML = '<div class="st-empty st-small"><span>No tournaments on this computer yet.</span></div>';
    } else {
        // Newest first, by creation time (older records without it by date)
        const sortedTournaments = tournaments.sort((a, b) => {
            if (a.created && b.created) return new Date(b.created) - new Date(a.created);
            if (a.created) return -1;
            if (b.created) return 1;
            return new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00');
        });

        const rows = sortedTournaments.map((t, i) => {
            const isLoaded = tournament && tournament.id === t.id;
            const status = tournamentStatusLabel(t);
            // The loaded tournament can't be loaded again or deleted, so it gets neither button
            const acts = isLoaded ? '' :
                `<button type="button" class="st-btn st-sm" data-rt-idx="${rowActions.push({ action: 'load', value: t.id }) - 1}">Load</button>` +
                `<button type="button" class="st-btn st-sm st-icon" title="Delete ${escapeHtml(t.name)}" aria-label="Delete ${escapeHtml(t.name)}" data-rt-idx="${rowActions.push({ action: 'local-delete', value: t.id }) - 1}">×</button>`;
            return `<tr${isLoaded ? ' class="st-loaded"' : ''}>
                <td class="st-name"><b>${escapeHtml(t.name)}</b>${isLoaded ? '<span class="st-tag">Loaded</span>' : ''}</td>
                <td class="st-date">${escapeHtml(t.date)}</td>
                <td class="st-num">${Array.isArray(t.players) ? t.players.length : 0}</td>
                <td><span class="st-pill st-${status.toLowerCase()}">${escapeHtml(status)}</span></td>
                <td data-analytics-row="${i}"></td>
                <td><span class="st-row-acts">${acts}</span></td>
            </tr>`;
        }).join('');
        container.innerHTML = `<table class="st-table"><thead><tr><th>Name</th><th>Date</th><th class="st-num">Players</th><th>Status</th><th>Analytics</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;

        // The Analytics column is filled in when the Analytics registry answers, so the list
        // is never held up by it
        let analyticsIds = new Set();
        try {
            if (typeof NewtonDB !== 'undefined') {
                const analyticsTournaments = await NewtonDB.getFinalTournaments();
                analyticsIds = new Set(analyticsTournaments.map(t => String(t.tournamentId)));
            }
        } catch (e) {
            console.warn('Could not check Analytics registry:', e);
        }
        if (token !== loadRecentTournaments._token) return;
        container.querySelectorAll('[data-analytics-row]').forEach(cell => {
            const t = sortedTournaments[parseInt(cell.getAttribute('data-analytics-row'), 10)];
            if (analyticsIds.has(String(t.id))) {
                cell.innerHTML = `<button type="button" class="st-alink" title="View in Analytics" data-rt-idx="${rowActions.push({ action: 'analytics-view', value: t.id }) - 1}">View</button>`;
            } else if (t.status === 'completed') {
                cell.innerHTML = `<button type="button" class="st-alink st-add" title="Add to the Analytics registry" data-rt-idx="${rowActions.push({ action: 'analytics-add', value: t.id }) - 1}">+ Add</button>`;
            } else {
                cell.innerHTML = '<span class="st-faint">—</span>';
            }
        });
    }
}

// Load shared tournament from server
async function loadSharedTournament(filename) {
    try {
        const response = await fetch(`/tournaments/${filename}`, {
            method: 'GET',
            cache: 'no-cache'
        });

        if (!response.ok) {
            alert('Failed to load shared tournament');
            return;
        }

        const tournamentData = await response.json();

        // Use same validation as file imports
        processImportedTournament(tournamentData);

    } catch (error) {
        console.error('Error loading shared tournament:', error);
        alert('Error loading shared tournament');
    }
}

// Delete shared tournament from server
async function deleteSharedTournament(filename) {
    if (!confirm(`Delete "${filename}" from server?\n\nThis cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete-tournament.php', {
            method: 'POST',
            headers: apiWriteHeaders(),
            body: JSON.stringify({ filename: filename })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(`Delete failed: ${errorData.error || 'Unknown error'}`);
            return;
        }

        const result = await response.json();
        alert(`✓ Tournament deleted from server`);

        // Reload tournament list
        if (typeof loadRecentTournaments === 'function') {
            loadRecentTournaments();
        }

    } catch (error) {
        console.error('Error deleting shared tournament:', error);
        alert('Error deleting tournament from server: ' + error.message);
    }
}

/**
 * Initiates tournament loading by showing confirmation modal.
 * Entry point for loading a tournament from the Setup page's Tournaments list.
 *
 * @param {number} id - Tournament ID (timestamp-based) to load
 * @returns {void}
 *
 * @description
 * - Finds tournament in localStorage by ID
 * - Shows confirmation modal with current vs selected tournament details
 * - User must confirm before actual loading occurs via continueLoadProcess()
 */
function loadSpecificTournament(id) {
    console.log(`🔄 Loading tournament ${id} (config will stay global)...`);

    const tournaments = readTournamentsRegistry();
    const selectedTournament = tournaments.find(t => t.id === id);

    if (!selectedTournament) {
        alert('Tournament not found');
        return;
    }

    showLoadTournamentModal(id, selectedTournament);
}

function showLoadTournamentModal(tournamentId, selectedTournament) {
    // Store tournament info for later use
    window.selectedTournamentId = tournamentId;
    window.selectedTournamentData = selectedTournament;

    // Populate sidebar with the tournament being loaded
    const selectedCompletedMatches = (selectedTournament.matches || []).filter(m => m.completed).length;
    const selectedTotalMatches = (selectedTournament.matches || []).length;
    document.getElementById('loadTournamentName').textContent = selectedTournament.name;
    document.getElementById('loadTournamentDate').textContent = selectedTournament.date;
    document.getElementById('loadTournamentStatus').textContent = tournamentStatusLabel(selectedTournament);
    document.getElementById('loadMatchProgress').textContent = `${selectedCompletedMatches} of ${selectedTotalMatches}`;
    document.getElementById('loadPlayerCount').textContent = (selectedTournament.players || []).length;

    // Description varies depending on whether a tournament is currently active
    const desc = document.getElementById('loadTournamentDesc');
    if (tournament && tournament.name) {
        desc.textContent = `Your current tournament "${tournament.name}" will be saved automatically and replaced. Settings and configurations remain unchanged.`;
    } else {
        desc.textContent = 'The selected tournament will become active. Settings and configurations remain unchanged.';
    }

    pushDialog('loadTournamentModal', null, true);
}

function confirmLoadTournament() {
    console.log('🔄 confirmLoadTournament called');
    const selectedTournament = window.selectedTournamentData;
    console.log('📝 selectedTournament:', selectedTournament);

    if (!selectedTournament) {
        alert('Tournament data not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Continue with loading process
    continueLoadProcess(selectedTournament);
}

/**
 * Actually loads tournament data into global state after user confirmation.
 * Called by confirmLoadTournament() after modal is closed.
 *
 * @param {Object} selectedTournament - Tournament object from localStorage
 * @returns {void}
 *
 * @description
 * - Sets global tournament, players, and matches from selected data
 * - Calculates bracketSize for legacy tournaments if missing
 * - Sets readOnly flag for completed tournaments
 * - Never overrides global config (point values, UI settings)
 * - Navigates to Setup page and renders bracket
 */
function continueLoadProcess(selectedTournament) {
    // Calculate bracketSize if missing (for older tournaments)
    let bracketSize = selectedTournament.bracketSize;
    if (!bracketSize && selectedTournament.bracket) {
        bracketSize = selectedTournament.bracket.length;
    }

    console.log('DEBUG: calculated bracketSize:', bracketSize);
    console.log('DEBUG: selectedTournament.bracket.length:', selectedTournament.bracket?.length);

    // Load ONLY tournament data - NEVER override global config
    tournament = {
        id: selectedTournament.id,
        name: selectedTournament.name,
        date: selectedTournament.date,
        created: selectedTournament.created,
        status: selectedTournament.status,
        players: selectedTournament.players || [],
        matches: selectedTournament.matches || [],
        bracket: selectedTournament.bracket,
        bracketSize: bracketSize,
        format: selectedTournament.format, // SE/DE format (absent = DE for backward compat)
        seeding: selectedTournament.seeding, // who was seeded in the draw (absent = a random draw)
        groups: selectedTournament.groups, // groups and cups: the group draw (absent in other formats)
        cups: selectedTournament.cups, // groups and cups: the cup draw (absent until drawn)
        placements: selectedTournament.placements || {},
        readOnly: (selectedTournament.status === 'completed') // Read-only for completed tournaments
        // NO CONFIG loading - config stays global
    };

    console.log('DEBUG: tournament.bracketSize after assignment:', tournament.bracketSize);

    // Set global arrays from tournament object
    players = tournament.players;
    matches = tournament.matches;

    // Save tournament to ensure proper persistence
    saveTournamentOnly();

    // Don't modify input fields when loading tournament - preserve user's work during navigation

    updateTournamentStatus();
    updatePlayersDisplay();
    updatePlayerCount();

    // Display results with current global config
    if (typeof displayResults === 'function') {
        displayResults();
    }

    if (tournament.bracket && typeof renderBracket === 'function') {
        renderBracket();
    }

    console.log('✓ Tournament loaded (global config preserved)');

    // CRITICAL FIX: Save the loaded tournament as current tournament
    localStorage.setItem('currentTournament', JSON.stringify(tournament));
    console.log(`✓ Set "${tournament.name}" as current tournament for persistence`);

    // Update the Tournaments list to mark the loaded tournament
    loadRecentTournaments();
}

function deleteTournament(tournamentId) {
    const tournaments = readTournamentsRegistry();
    const tournamentToDelete = tournaments.find(t => t.id === tournamentId);

    if (!tournamentToDelete) {
        alert('Tournament not found.');
        return;
    }

    if (tournament && tournament.id === tournamentId) {
        alert('Cannot delete the currently active tournament.\n\nPlease create a new tournament or load a different one first.');
        return;
    }

    showDeleteTournamentModal(tournamentId, tournamentToDelete);
}

function showDeleteTournamentModal(tournamentId, tournamentToDelete) {
    // Store the tournament ID for later use
    window.tournamentToDeleteId = tournamentId;

    // Populate modal with tournament details
    document.getElementById('deleteTournamentName').textContent = tournamentToDelete.name;
    document.getElementById('deleteTournamentDate').textContent = tournamentToDelete.date;

    // Calculate players count
    const playerCount = tournamentToDelete.players ? tournamentToDelete.players.length : 0;
    document.getElementById('deleteTournamentPlayers').textContent = playerCount;

    // Determine status (unified Setup / Active / Completed)
    document.getElementById('deleteTournamentStatus').textContent = tournamentStatusLabel(tournamentToDelete);

    // Show modal with Esc support
    pushDialog('deleteTournamentModal', null, true);
}

function confirmDeleteTournament() {
    const tournamentId = window.tournamentToDeleteId;
    const tournaments = readTournamentsRegistry();
    const tournamentToDelete = tournaments.find(t => t.id === tournamentId);

    if (!tournamentToDelete) {
        alert('Tournament not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Delete the tournament from registry
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    localStorage.setItem('dartsTournaments', JSON.stringify(updatedTournaments));

    // Delete the per-tournament history key (v4.0+ storage isolation)
    const historyKey = `tournament_${tournamentId}_history`;
    localStorage.removeItem(historyKey);

    loadRecentTournaments();

    // Update storage indicator
    if (typeof updateStorageIndicator === 'function') {
        updateStorageIndicator();
    }

    alert(`✓ Tournament "${tournamentToDelete.name}" has been deleted successfully.`);
}

function showImportOverwriteModal(importedData) {
    // Store the imported data for later use
    window.importedTournamentData = importedData;

    // Populate sidebar with imported file's details
    document.getElementById('importTournamentName').textContent = importedData.name;
    document.getElementById('importTournamentDate').textContent = importedData.date;
    document.getElementById('importTournamentStatus').textContent = tournamentStatusLabel(importedData);

    // Show modal with Esc support
    pushDialog('importOverwriteModal', null, true);
}

function confirmOverwriteTournament() {
    const importedData = window.importedTournamentData;

    if (!importedData) {
        alert('Import data not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Continue with the import process (same logic as before)
    continueImportProcess(importedData);
}

function showImportConfirmModal(importedData, isOldFormat) {
    // Store import data for later
    window.pendingImportData = importedData;
    window.isOldFormatImport = isOldFormat;

    // Populate sidebar with tournament details
    const completedMatches = (importedData.matches || []).filter(m => m.completed).length;
    const totalMatches = (importedData.matches || []).length;
    document.getElementById('importConfirmName').textContent = importedData.name;
    document.getElementById('importConfirmDate').textContent = importedData.date;
    document.getElementById('importConfirmStatus').textContent = tournamentStatusLabel(importedData);
    document.getElementById('importConfirmMatches').textContent = `${completedMatches} of ${totalMatches}`;
    document.getElementById('importConfirmPlayers').textContent = (importedData.players || []).length;

    // Toggle old-format pill + warning paragraph
    const pill = document.getElementById('importOldFormatPill');
    const warning = document.getElementById('importOldFormatWarning');
    pill.style.display = isOldFormat ? '' : 'none';
    warning.style.display = isOldFormat ? '' : 'none';

    // Update button text
    document.getElementById('confirmImportBtn').textContent = isOldFormat ? 'Import Anyway' : 'Import Tournament';

    // Show modal
    pushDialog('importConfirmModal', null, true);
}

function confirmImport() {
    const importedData = window.pendingImportData;

    if (!importedData) {
        alert('Import data not found.');
        popDialog();
        return;
    }

    // Close modal
    popDialog();

    // Proceed with import
    continueImportProcess(importedData);
}

function continueImportProcess(importedData) {
    try {
        // Calculate bracketSize if missing (for older exported tournaments)
        let bracketSize = importedData.bracketSize;
        if (!bracketSize && importedData.bracket) {
            bracketSize = importedData.bracket.length;
        }

        // Import ONLY tournament data - Strip any config contamination
        tournament = {
            id: importedData.id,
            name: importedData.name,
            date: importedData.date,
            created: importedData.created,
            status: importedData.status || 'setup',
            players: importedData.players || [],
            matches: importedData.matches || [],
            bracket: importedData.bracket || null,
            placements: importedData.placements || {},
            bracketSize: bracketSize,
            format: importedData.format, // SE/DE format (absent = DE for backward compat)
            seeding: importedData.seeding, // who was seeded in the draw (absent = a random draw)
            groups: importedData.groups, // groups and cups: the group draw (absent in other formats)
            cups: importedData.cups, // groups and cups: the cup draw (absent until drawn)
            readOnly: (importedData.status === 'completed') // Read-only for completed imports
        };

        // Set global arrays
        players = tournament.players;
        matches = tournament.matches;

        // Restore per-tournament history (v4.0+ format only)
        // Pre-v4.0 formats use incompatible snapshot-based history (too large, won't work with v4.0 undo)
        const isOldFormat = window.isOldFormatImport;
        if (importedData.history && Array.isArray(importedData.history) && importedData.history.length > 0) {
            if (!isOldFormat) {
                // v4.0+ format: lightweight transaction log compatible with replay-based undo
                const historyKey = `tournament_${tournament.id}_history`;
                try {
                    localStorage.setItem(historyKey, JSON.stringify(importedData.history));
                    console.log(`✓ Restored ${importedData.history.length} transaction history entries to ${historyKey}`);
                } catch (e) {
                    console.warn('Could not restore tournament history:', e);
                }
            } else {
                // Pre-v4.0 format: skip bloated snapshot-based history
                console.log(`⚠ Skipped importing ${importedData.history.length} pre-v4.0 history entries (incompatible snapshot format, ~${Math.round(JSON.stringify(importedData.history).length / 1024 / 1024 * 10) / 10} MB)`);
            }
        }

        // Clear any undone transactions (fresh import)
        localStorage.removeItem('undoneTransactions');

        // Bring the file's players into the player database: by ID from its playerDatabase,
        // or by name from an older file's playerList. Adds; never replaces the database.
        if (typeof PlayerRegistry !== 'undefined') {
            try {
                const added = PlayerRegistry.mergeFrom(importedData);
                if (added) console.log(`✓ Added ${added} players to the player database from the file`);
            } catch (e) {
                console.warn('Could not add the file\'s players to the player database:', e);
            }
        }

        // Save tournament (but not global config)
        saveTournamentOnly();

        // Debug: Verify what got saved
        const saved = JSON.parse(localStorage.getItem('currentTournament'));
        console.log(`✓ Saved tournament "${saved.name}" as current tournament`);

        // Update displays
        updateTournamentStatus();
        updatePlayersDisplay();
        updatePlayerCount();
        loadRecentTournaments();

        // Update storage indicator
        if (typeof updateStorageIndicator === 'function') {
            updateStorageIndicator();
        }

        // Render bracket if exists
        if (tournament.bracket && typeof renderBracket === 'function') {
            renderBracket();
        }

        // Display results using global config
        if (typeof displayResults === 'function') {
            displayResults();
        }

        // Show success with detailed info
        const historyCount = importedData.history ? importedData.history.length : 0;
        showImportStatus('success',
            `✓ Tournament "${escapeHtml(tournament.name)}" imported successfully! ` +
            `${players.length} players, ${matches.filter(m => m.completed).length} completed matches, ` +
            `and ${historyCount} transaction history entries loaded.`
        );

        // Update watermark

        console.log(`✓ Tournament imported (v${importedData.exportVersion} format, global config preserved)`);
    } catch (error) {
        showImportStatus('error', 'Error importing tournament. Please check the file format.');
        console.error('Import error:', error);
    }
}

function showResetTournamentModal() {
    const tournamentName = tournament.name;
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;

    // Populate sidebar with tournament details
    document.getElementById('resetTournamentName').textContent = tournamentName;
    document.getElementById('resetTournamentStatus').textContent = tournamentStatusLabel(tournament);
    document.getElementById('resetMatchProgress').textContent = `${completedMatches} of ${totalMatches}`;
    document.getElementById('resetPlayerCount').textContent = players.length;

    // Reset input + button state
    const input = document.getElementById('resetConfirmationInput');
    input.value = '';
    input.placeholder = tournamentName;
    document.getElementById('confirmResetBtn').disabled = true;

    // Replace with a clone to drop any prior listeners
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    // Enable the reset button only when input matches exactly
    newInput.addEventListener('input', function() {
        document.getElementById('confirmResetBtn').disabled = this.value !== tournamentName;
    });

    // Enter submits when input matches
    newInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && this.value === tournamentName) {
            confirmReset();
        }
    });

    // Focus input after modal renders
    setTimeout(() => newInput.focus(), 100);

    // Show modal with Esc support
    pushDialog('resetTournamentModal', null, true);
}

function confirmReset() {
    const input = document.getElementById('resetConfirmationInput');
    const tournamentName = tournament.name;

    if (input.value !== tournamentName) {
        alert('Tournament name did not match. Reset cancelled for your protection.');
        return;
    }

    // Close the modal first
    popDialog();

    // Reset tournament data only
    matches = [];
    tournament.bracket = null;
    delete tournament.groups; // groups and cups: the draws go with the bracket
    delete tournament.cups;
    tournament.status = 'setup';
    tournament.placements = {};
    tournament.readOnly = false; // Clear read-only flag (escape hatch)

    // Clear per-tournament history
    if (tournament && tournament.id) {
        const historyKey = `tournament_${tournament.id}_history`;
        localStorage.removeItem(historyKey);
    }
    localStorage.removeItem('undoneTransactions');

    players.forEach(player => {
        player.eliminated = false;
        player.placement = null;
        // Clear player statistics
        player.stats = { shortLegs: [], highOuts: [], tons: 0, oneEighties: 0 };
    });

    saveTournamentOnly(); // Save tournament but not config

    if (typeof clearBracket === 'function') {
        clearBracket();
    }

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }

    // Refresh the results display after reset (with delay to ensure DOM updates)
    if (typeof displayResults === 'function') {
        setTimeout(() => {
            displayResults();
        }, 100);
    }

    // Refresh Match Controls if it's open to show new SETUP state
    if (document.getElementById('matchCommandCenterModal') &&
        ['flex', 'block'].includes(document.getElementById('matchCommandCenterModal').style.display) &&
        typeof showMatchCommandCenter === 'function') {
        setTimeout(() => {
            showMatchCommandCenter();
        }, 100);
    }

    // Refresh the Setup page: status, match history and the tournament list
    updateTournamentStatus();
    if (typeof updateMatchHistory === 'function') updateMatchHistory();
    loadRecentTournaments();

    alert(`✓ Tournament "${tournamentName}" has been reset successfully.\n\nYou can now generate a new bracket using Match Controls.`);
}

/**
 * Imports a tournament from a JSON file selected by the user.
 * Handles file reading, JSON parsing, and passes to processImportedTournament().
 *
 * @param {Event} event - File input change event containing selected file
 * @returns {void}
 *
 * @description
 * - Validates file is JSON format
 * - Reads file content asynchronously
 * - Parses JSON and delegates to processImportedTournament()
 * - Shows error status for invalid files
 * - Supports both v4.0 and legacy export formats
 */
function importTournament(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset file input for future imports
    event.target.value = '';

    if (!file.name.endsWith('.json')) {
        showImportStatus('error', 'Please select a valid JSON file');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            processImportedTournament(importedData);
        } catch (error) {
            showImportStatus('error', 'Invalid JSON file. Please check the file format.');
            console.error('JSON parse error:', error);
        }
    };

    reader.onerror = function () {
        showImportStatus('error', 'Error reading file. Please try again.');
    };

    reader.readAsText(file);
}

// PROCESS IMPORTED TOURNAMENT - Strip any config contamination
function processImportedTournament(importedData) {
    console.log('📥 Processing imported tournament (stripping any config data)...');

    const validation = validateTournamentData(importedData);
    if (!validation.valid) {
        alert(`Invalid tournament data:\n\n${validation.error}`);
        showImportStatus('error', `Invalid tournament data: ${escapeHtml(validation.error)}`);
        return;
    }

    if (storageGateBlocks('import this tournament')) return;

    // Set before branching — the overwrite path skips showImportConfirmModal,
    // which would otherwise leave a stale flag from a previous import
    window.isOldFormatImport = validation.isOldFormat;

    // Check if tournament already exists
    const tournaments = JSON.parse(localStorage.getItem('dartsTournaments') || '[]');
    const existingTournament = tournaments.find(t => t.id === importedData.id);

    if (existingTournament) {
        showImportOverwriteModal(importedData);
        return; // Exit here, modal will handle the decision
    }

    // Show import confirmation modal
    showImportConfirmModal(importedData, validation.isOldFormat);
}

function validateTournamentData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Data must be a valid tournament object' };
    }

    // EXPORT VERSION DETECTION - Support old formats with warning
    let isOldFormat = false;

    if (!data.exportVersion) {
        // Old format (pre-v4.0) - no exportVersion field
        isOldFormat = true;
    } else {
        const exportVersion = parseFloat(data.exportVersion);
        if (exportVersion < 4.0) {
            // Old format with version number < 4.0
            isOldFormat = true;
        }
    }

    if (!data.name || typeof data.name !== 'string') {
        return { valid: false, error: 'Tournament name is required' };
    }

    if (!data.date || typeof data.date !== 'string') {
        return { valid: false, error: 'Tournament date is required' };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
        return { valid: false, error: 'Tournament date must be in YYYY-MM-DD format' };
    }

    // Ensure ID exists (generate if missing)
    if (!data.id) {
        data.id = Date.now();
        console.warn('Generated new ID for imported tournament:', data.id);
    }

    // Validate players array
    if (data.players && !Array.isArray(data.players)) {
        return { valid: false, error: 'Players must be an array' };
    }

    // Validate matches array
    if (data.matches && !Array.isArray(data.matches)) {
        return { valid: false, error: 'Matches must be an array' };
    }

    // Validate history array (v4.0 requirement)
    if (data.history && !Array.isArray(data.history)) {
        return { valid: false, error: 'History must be an array' };
    }

    // Set default values for missing optional fields
    if (!data.status) data.status = 'setup';
    if (!data.players) data.players = [];
    if (!data.matches) data.matches = [];
    if (!data.created) data.created = new Date().toISOString();
    if (!data.history) data.history = [];

    // Validate each player has required fields
    if (data.players.length > 0) {
        for (let i = 0; i < data.players.length; i++) {
            const player = data.players[i];
            if (typeof player.name !== 'string' || !player.name.trim() || !player.id) {
                return { valid: false, error: `Player ${i + 1} is missing required fields (a string name, and an id)` };
            }

            // Set default player values
            if (typeof player.paid === 'undefined') player.paid = false;
            if (!player.stats) player.stats = { shortLegs: [], highOuts: [], tons: 0, oneEighties: 0 };
        }
    }

    // Validate placements are a map of numeric ranks (consumed directly as ranks / placement points)
    if (data.placements != null) {
        if (typeof data.placements !== 'object' || Array.isArray(data.placements)) {
            return { valid: false, error: 'Placements must be an object' };
        }
        for (const [pid, rank] of Object.entries(data.placements)) {
            if (typeof rank !== 'number' || !isFinite(rank)) {
                return { valid: false, error: `Placement for player ${pid} must be a number` };
            }
        }
    }

    // Validate match shape — malformed matches otherwise flow into renderBracket, the
    // progression lookups, and innerHTML, crashing at render rather than failing at import.
    for (let i = 0; i < data.matches.length; i++) {
        const m = data.matches[i];
        if (!m || typeof m !== 'object') {
            return { valid: false, error: `Match ${i + 1} is not a valid object` };
        }
        if (typeof m.id !== 'string') {
            return { valid: false, error: `Match ${i + 1} is missing a valid (string) id` };
        }
        if (m.player1 != null && typeof m.player1 !== 'object') {
            return { valid: false, error: `Match ${m.id}: player1 must be an object or null` };
        }
        if (m.player2 != null && typeof m.player2 !== 'object') {
            return { valid: false, error: `Match ${m.id}: player2 must be an object or null` };
        }
        // completed feeds boolean checks throughout — coerce rather than reject if not already boolean
        if (typeof m.completed !== 'boolean') {
            m.completed = !!m.completed;
        }
    }

    return { valid: true, isOldFormat: isOldFormat };
}

function showImportStatus(type, message) {
    const statusDiv = document.getElementById('importStatus');
    if (!statusDiv) return;

    // Set styling based on type
    statusDiv.className = `st-import-status alert-${type}`;
    statusDiv.innerHTML = message;
    statusDiv.style.display = 'block';

    // Auto-hide success/warning messages after 5 seconds
    if (type === 'success' || type === 'warning') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Update clocks in Status Panel and header
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // Update header clock (visible on all pages)
    const headerClockElement = document.getElementById('headerClock');
    if (headerClockElement) {
        headerClockElement.textContent = timeString;
    }

    // Update bracket page clock (the bracket runs full screen, hiding the OS clock)
    const bracketClockElement = document.getElementById('bvClock');
    if (bracketClockElement) {
        bracketClockElement.textContent = timeString;
    }
}

// Start clock update interval (every 10 seconds to catch minute changes quickly)
setInterval(updateClock, 10000);

// Initialize clock immediately when script loads
updateClock();

/**
 * Get storage color class based on percentage thresholds
 * @param {number} percentage - Storage usage percentage
 * @returns {string} Color class name
 */
function getStorageColor(percentage) {
    if (percentage < 75) return 'green';
    if (percentage < 90) return 'yellow';
    return 'amber';
}

/**
 * Update the storage meter in the Setup page's Tournaments header
 */
function updateStorageIndicator() {
    const link = document.getElementById('storage-indicator-link');
    const text = document.getElementById('storageIndicatorText');
    const bar = document.getElementById('storageIndicatorBar');
    if (!link || !text || !bar) return;

    // Get storage stats from analytics.js
    if (typeof getLocalStorageStats !== 'function') {
        text.textContent = 'Storage N/A';
        return;
    }

    const percentage = Math.round(getLocalStorageStats().percentage);
    text.textContent = `Storage ${percentage}%`;
    bar.style.width = `${Math.min(100, percentage)}%`;
    link.className = `st-storage storage-${getStorageColor(percentage)}`;
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Show the storage modal with usage details and instructions
 */
function showStorageModal() {
    // Get storage stats
    if (typeof getLocalStorageStats !== 'function') {
        alert('Storage statistics are not available');
        return;
    }

    const stats = getLocalStorageStats();
    const percentage = Math.round(stats.percentage);
    const colorClass = getStorageColor(percentage);
    const usedMB = stats.used.toFixed(1);
    const limitMB = stats.limit.toFixed(0);

    // Calculate status message
    let statusMessage;
    if (percentage < 75) {
        statusMessage = 'Good - Plenty of space available';
    } else if (percentage < 90) {
        statusMessage = 'Running low - Consider freeing up space soon';
    } else {
        statusMessage = 'Almost full - Free up space to avoid issues';
    }

    // Calculate breakdown
    let tournamentsSize = 0;
    let historySize = 0;
    let globalSize = 0;
    let tournamentCount = 0;

    for (const [key, size] of Object.entries(stats.items)) {
        if (key.startsWith('tournament_') && !key.includes('_history')) {
            tournamentsSize += size;
            tournamentCount++;
        } else if (key.includes('_history')) {
            historySize += size;
        } else {
            globalSize += size;
        }
    }

    // Create modal HTML
    const modalHTML = `
        <div id="storageModal" class="modal" style="display: block;">
            <div class="dlg dlg--wide">
                <div class="dlg__grid">
                    <aside class="dlg__sidebar">
                        <div class="dlg__sidebar-label">Tournaments</div>
                        <div class="dlg__sidebar-value">${formatBytes(tournamentsSize)} (${tournamentCount} tournaments)</div>
                        <div class="dlg__sidebar-label">Tournament History</div>
                        <div class="dlg__sidebar-value">${formatBytes(historySize)}</div>
                        <div class="dlg__sidebar-label">Settings & Players</div>
                        <div class="dlg__sidebar-value">${formatBytes(globalSize)}</div>
                    </aside>
                    <div class="dlg__main">
                        <h2 class="dlg__title">Storage Space</h2>
                        <div>
                            <div class="storage-progress-bar">
                                <div class="storage-progress-fill storage-${colorClass}" style="width: ${percentage}%"></div>
                            </div>
                            <div class="storage-details">
                                <strong>Using ${usedMB} MB of ${limitMB} MB available (${percentage}%)</strong>
                                <div style="margin-top: 4px; color: #6b7280;">${statusMessage}</div>
                            </div>
                        </div>
                        <div class="dlg__note">
                            <p class="dlg__label" style="margin-bottom: 0;">How to Free Up Space</p>
                            <ol style="margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 10px;">
                                    <strong>Export old tournaments you want to keep</strong>
                                    <ul style="margin: 4px 0 0 0; padding-left: 18px;">
                                        <li>Click on a tournament name to load it</li>
                                        <li>Click "Export Tournament" button to save it</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Delete tournaments you no longer need</strong>
                                    <ul style="margin: 4px 0 0 0; padding-left: 18px;">
                                        <li>Click the X button next to old tournaments in the list above</li>
                                        <li>Deleted tournaments can't be recovered (unless you exported them)</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                        ${historySize > 1024 * 1024 ? `
                        <p class="dlg__desc"><strong>Advanced:</strong> Your tournament history is using ${formatBytes(historySize)}. History lets you undo match results — clean up old history from the Developer Console (Ctrl+Shift+D) if you're low on space.</p>
                        ` : ''}
                        <p class="dlg__desc" style="font-style: italic;">Tip: Focus on older tournaments from several months ago.</p>
                    </div>
                </div>
                <div class="dlg__foot">
                    <button class="btn btn-primary" onclick="closeStorageModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    const container = document.createElement('div');
    container.id = 'storageModalContainer';
    container.innerHTML = modalHTML;
    document.body.appendChild(container);

    // Show modal using dialog stack system
    if (typeof window.pushDialog === 'function') {
        window.pushDialog('storageModal', null, true); // true enables ESC key
    }
    // Modal is already visible via inline style="display: block;"
}

/**
 * Close the storage modal
 */
function closeStorageModal() {
    const container = document.getElementById('storageModalContainer');
    if (container) {
        // Use dialog stack system if available
        if (typeof window.popDialog === 'function') {
            window.popDialog();
        }

        container.remove();
    }
}

// Open Analytics tab scoped to a specific tournament
function openAnalyticsForTournament(tournamentId) {
    if (typeof NewtonHistory !== 'undefined') {
        if (NewtonHistory.setScope) NewtonHistory.setScope([String(tournamentId)]);
        if (NewtonHistory.showDashboard) NewtonHistory.showDashboard();
    }
    if (typeof showPage === 'function') {
        showPage('history');
    }
}

// Add a localStorage tournament to the Analytics registry (IndexedDB)
async function addTournamentToAnalytics(tournamentId) {
    if (typeof NewtonDB === 'undefined') {
        console.warn('NewtonDB not available');
        return;
    }

    // Find the tournament in localStorage
    const tournaments = readTournamentsRegistry();
    const t = tournaments.find(tr => String(tr.id) === String(tournamentId));
    if (!t) {
        console.warn('Tournament not found in localStorage:', tournamentId);
        return;
    }

    // Confirmation dialog
    const playerCount = Array.isArray(t.players) ? t.players.length : 0;
    if (!confirm(`Add "${t.name}" (${t.date}, ${playerCount} players) to the Analytics registry?\n\nMatch results and achievements will be imported.`)) {
        return;
    }

    // Check if already in Analytics
    const existing = await NewtonDB.getTournament(String(t.id));
    if (existing) {
        console.log('Tournament already in Analytics:', t.name);
        return;
    }

    // Merge history from localStorage (stored separately under tournament_${id}_history)
    if (!t.history) {
        const historyKey = `tournament_${t.id}_history`;
        const historyRaw = localStorage.getItem(historyKey);
        if (historyRaw) {
            try { t.history = JSON.parse(historyRaw); } catch (e) { /* ignore */ }
        }
    }

    // Delegate to shared backfill
    const result = await NewtonDB.backfillTournament(t, config || {});

    console.log(`[Analytics] Added tournament "${t.name}" — ${result.matchCount} matches`);

    // Refresh Analytics cache so the new tournament appears without reload
    if (typeof NewtonHistory !== 'undefined') {
        if (NewtonHistory.invalidateCache) NewtonHistory.invalidateCache();
    }

    // Refresh the tournament list to update the label
    loadRecentTournaments();
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showResetTournamentModal = showResetTournamentModal;
    window.confirmReset = confirmReset;
    window.showDeleteTournamentModal = showDeleteTournamentModal;
    window.confirmDeleteTournament = confirmDeleteTournament;
    window.showImportOverwriteModal = showImportOverwriteModal;
    window.confirmOverwriteTournament = confirmOverwriteTournament;
    window.showLoadTournamentModal = showLoadTournamentModal;
    window.confirmLoadTournament = confirmLoadTournament;
    window.updateStorageIndicator = updateStorageIndicator;
    window.showStorageModal = showStorageModal;
    window.closeStorageModal = closeStorageModal;
    window.openAnalyticsForTournament = openAnalyticsForTournament;
    window.addTournamentToAnalytics = addTournamentToAnalytics;
}
