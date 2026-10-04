// player-management.js - Player Operations and Statistics
//
// Tournament players come from the club's player database (js/player-registry.js): each
// carries its database ID as `registryId`, and its short name as `name`. The tournament's
// own player `id` (used by the bracket, the history and undo) is created here as before.

/**
 * The database's active short names. Kept for tournament exports (`playerList`), which
 * older versions of the app read.
 * @returns {string[]}
 */
function getPlayerList() {
    return typeof PlayerRegistry !== 'undefined' ? PlayerRegistry.shortNames() : [];
}

/** The Registration page's search text, kept while the page is redrawn. */
let _playerSearch = '';
/** Which Registration tab is showing: 'tonight' or 'database'. */
let _registrationTab = 'tonight';

// TAB SWITCHING
// Update Registration Page Layout based on tournament state
function updateRegistrationPageLayout() {
    const playerListSection = document.getElementById('playerListSection');
    const tournamentResultsSection = document.getElementById('tournamentResultsSection');
    if (!playerListSection || !tournamentResultsSection) return;

    // Before the draw: players wide, payment and saved players beside them.
    // After it: the Leaderboard wide, payments locked.
    const tournamentStarted = !!(tournament && tournament.bracket && matches.length > 0);
    playerListSection.style.display = tournamentStarted ? 'none' : '';
    tournamentResultsSection.style.display = tournamentStarted ? '' : 'none';

    const cols = document.getElementById('registrationCols');
    if (cols) cols.classList.toggle('rg-running', tournamentStarted);
    const hint = document.getElementById('registrationPlayersHint');
    if (hint) hint.textContent = !tournament ? '' : tournamentStarted ? 'payments locked' : 'click a player to toggle paid';
    const subtitle = document.getElementById('registrationSubtitle');
    if (subtitle) {
        subtitle.textContent = !tournamentStarted ? 'Add the players, and mark who has paid.'
            : tournament.status === 'completed' ? 'The tournament is over. Click a player in the Leaderboard to correct statistics.'
            : 'The bracket is drawn: payments are locked, and the Leaderboard is live.';
    }
    updatePlayerCount();
}

/**
 * Fill the Registration page's next step: what to do now and the button for it. Before
 * the draw it follows the paid count against the formats' player limits; after it, the
 * matches still to play.
 * @returns {void}
 */
function renderRegistrationNext() {
    const title = document.getElementById('registrationNextTitle');
    const hint = document.getElementById('registrationNextHint');
    const btn = document.getElementById('registrationNextBtn');
    if (!title || !hint || !btn) return;

    const paid = players.filter(p => p.paid).length;
    const unpaid = players.length - paid;
    const started = !!(tournament && tournament.bracket && matches.length > 0);
    const formats = typeof getVisibleFormats === 'function' ? getVisibleFormats() : [];
    const minPlayers = formats.length ? Math.min(...formats.map(f => f.minPlayers)) : 4;
    const maxPlayers = formats.length ? Math.max(...formats.map(f => f.maxPlayers)) : 32;

    let text = ['Draw the bracket', `Only paid players go into the bracket. ${unpaid ? `${unpaid} still unpaid.` : 'Everyone has paid.'}`];
    let button = ['Open bracket →', "showPage('tournament')"];
    let enabled = true;
    if (!tournament) {
        text = ['No tournament loaded', 'Create or load one on the Setup page.'];
        button = ['Go to Setup →', "showPage('setup')"];
    } else if (started && tournament.status === 'completed') {
        text = ['Tournament completed', 'Final standings are in the Leaderboard.'];
    } else if (started) {
        const toGo = matches.filter(m => !m.completed).length;
        const live = matches.filter(m => getMatchState(m) === 'live').length;
        text = ['Run the matches', `${toGo} match${toGo === 1 ? '' : 'es'} to go${live ? `, ${live} being played now` : ''}.`];
    } else if (paid < minPlayers) {
        const needed = minPlayers - paid;
        text = [`Register at least ${minPlayers} paid players`, `${needed} more paid player${needed > 1 ? 's' : ''} needed before the draw.`];
        enabled = false;
    } else if (paid > maxPlayers) {
        text = ['Too many paid players', `A bracket holds at most ${maxPlayers} players, and ${paid} have paid.`];
        enabled = false;
    }

    title.textContent = text[0];
    hint.textContent = text[1];
    btn.textContent = button[0];
    btn.setAttribute('onclick', button[1]);
    btn.disabled = !enabled;
}

/**
 * Fill the Registration page's "Add from the database": the active players matching the
 * search (short, first, last or previous name), the most active first, and those already
 * in the tournament marked. Click a player to add them; Enter adds the first match.
 * @returns {void}
 */
function renderPlayerList() {
    const container = document.getElementById('playerListContainer');
    const countSpan = document.getElementById('playerListCount');
    if (!container || typeof PlayerRegistry === 'undefined') return;
    _linkTournamentPlayers();

    const q = _playerSearch.toLowerCase();
    const inTournament = new Set(players.map(p => p.registryId).filter(Boolean));
    const matchesSearch = p => !q || [p.short, p.first, p.last, ...p.prev].some(s => s && s.toLowerCase().includes(q));
    const usage = renderPlayerList._usage || new Map();
    const list = PlayerRegistry.active()
        .filter(matchesSearch)
        .sort((a, b) => ((usage.get(b.id) || {}).played || 0) - ((usage.get(a.id) || {}).played || 0) || a.short.localeCompare(b.short));
    if (countSpan) countSpan.textContent = `${PlayerRegistry.active().filter(p => !inTournament.has(p.id)).length} available`;

    const mark = (text) => {
        const safe = escapeHtml(text);
        if (!q || !text) return safe;
        const i = text.toLowerCase().indexOf(q);
        return i < 0 ? safe : escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' + escapeHtml(text.slice(i + q.length));
    };
    const canAdd = !!tournament && !(tournament.bracket && matches.length > 0);
    const rows = [];
    container.innerHTML = list.map(p => {
        const inT = inTournament.has(p.id);
        const idx = rows.push(p.id) - 1;
        const full = PlayerRegistry.fullName(p);
        const was = q && p.prev.some(n => n.toLowerCase().includes(q)) ? ` · was ${escapeHtml(p.prev.join(', '))}` : '';
        const played = (usage.get(p.id) || {}).played;
        return `<div class="rg-pick-row${inT ? ' rg-in' : ''}"${inT || !canAdd ? '' : ` data-rg-add="${idx}" role="button" tabindex="0"`}>` +
            `<div class="rg-who"><b>${mark(p.short)}</b><span>${full ? mark(full) : 'No full name yet'}${was}${played ? ` · ${played} played` : ''}</span></div>` +
            `<span class="rg-pick-add">${inT ? 'In' : '+'}</span></div>`;
    }).join('') || (q
        ? `<div class="st-empty st-small"><span>No one matches “${escapeHtml(_playerSearch)}”.</span><button type="button" class="st-btn st-sm st-primary" data-rg-new>+ New player “${escapeHtml(_playerSearch)}”</button></div>`
        : '<div class="st-empty st-small"><span>The database is empty. Add the first player with + New player.</span></div>');
    renderPlayerList._rows = rows;

    if (!container._rgDelegated) {
        container._rgDelegated = true;
        const act = (e) => {
            if (e.target.closest('[data-rg-new]')) { openPlayerForm(null, _playerSearch); return; }
            const row = e.target.closest('[data-rg-add]');
            if (!row) return;
            const id = (renderPlayerList._rows || [])[+row.getAttribute('data-rg-add')];
            if (id) addRegistryPlayer(id);
        };
        container.addEventListener('click', act);
        container.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(e); } });
    }

    // played counts load from the Analytics register; draw again once they are in
    if (!renderPlayerList._usageLoading && !renderPlayerList._usage) {
        renderPlayerList._usageLoading = true;
        PlayerRegistry.usage().then(u => { renderPlayerList._usage = u; renderPlayerList._usageLoading = false; renderPlayerList(); });
    }
}

/**
 * The search box: filter as you type; Enter adds the first match, or offers to create
 * the player when no one matches.
 */
function onPlayerSearchInput(value) {
    _playerSearch = String(value || '').trim();
    renderPlayerList();
}
function onPlayerSearchEnter() {
    const first = document.querySelector('#playerListContainer [data-rg-add]');
    if (first) {
        const id = (renderPlayerList._rows || [])[+first.getAttribute('data-rg-add')];
        if (id) addRegistryPlayer(id);
        const input = document.getElementById('playerName');
        if (input) input.value = '';
        _playerSearch = '';
        renderPlayerList();
    } else if (_playerSearch) {
        openPlayerForm(null, _playerSearch);
    }
}

/**
 * A new tournament player for a database player: their short name, a new tournament id
 * (as before), and the database ID.
 * @param {object} entry - from PlayerRegistry
 * @param {boolean} [paid]
 * @returns {object}
 */
function _newTournamentPlayer(entry, paid) {
    return {
        id: Date.now(),
        name: entry.short,
        registryId: entry.id,
        paid: paid !== undefined ? paid : !!(config && config.ui && config.ui.defaultPaid),
        stats: { shortLegs: [], highOuts: [], tons: 0, oneEighties: 0 },
        placement: null,
        eliminated: false
    };
}

/**
 * Add a database player to the tournament (before the draw).
 * @param {string} registryId
 * @returns {void}
 */
function addRegistryPlayer(registryId) {
    if (!tournament) { alert('Create or load a tournament first.'); return; }
    if (tournament.bracket && matches.length > 0) { showTournamentProgressWarning(); return; }
    const entry = PlayerRegistry.get(registryId);
    if (!entry) return;
    if (players.some(p => p.registryId === entry.id || p.name.toLowerCase() === entry.short.toLowerCase())) {
        alert(`${entry.short} is already in the tournament.`);
        return;
    }
    players.push(_newTournamentPlayer(entry));
    updatePlayersDisplay();
    updatePlayerCount();
    saveTournament();
    updateResultsTable();
    renderPlayerList();
}

/**
 * Give the loaded tournament's players their database ID where they don't have one yet
 * (tournaments from before the database), by name. Only before the draw: a running or
 * finished tournament is left as it is; Analytics links those by name.
 */
function _linkTournamentPlayers() {
    if (!tournament || typeof PlayerRegistry === 'undefined' || tournament.readOnly) return;
    if (tournament.bracket && matches.length > 0) return;
    let changed = false;
    players.forEach(p => {
        if (p.registryId) return;
        const entry = PlayerRegistry.findOrCreate(p.name);
        if (entry) { p.registryId = entry.id; changed = true; }
    });
    if (changed) saveTournament();
}

/**
 * Switch the Registration page between Tonight and the Player database.
 * @param {'tonight'|'database'} tab
 */
function switchRegistrationTab(tab) {
    _registrationTab = tab === 'database' ? 'database' : 'tonight';
    document.querySelectorAll('#registrationTabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === _registrationTab));
    const tonight = document.getElementById('registrationTonight');
    const db = document.getElementById('registrationDatabase');
    if (tonight) tonight.hidden = _registrationTab !== 'tonight';
    if (db) db.hidden = _registrationTab !== 'database';
    if (_registrationTab === 'database') renderPlayerDatabase();
    else renderPlayerList();
}

// ---------------------------------------------------------------------------
// Player database tab
// ---------------------------------------------------------------------------

let _dbSearch = '';
let _dbShowArchived = false;

/**
 * Fill the Player database tab: every player with their names, previous names, how many
 * finished tournaments they have played, and whether they can be deleted (only players
 * who were never in Analytics) or archived.
 * @returns {Promise<void>}
 */
async function renderPlayerDatabase() {
    const body = document.getElementById('playerDbBody');
    if (!body || typeof PlayerRegistry === 'undefined') return;
    const count = document.getElementById('playerDbCount');
    const banner = document.getElementById('playerDbNotice');
    const notice = PlayerRegistry.importNotice();
    if (banner) {
        banner.hidden = !notice;
        const n = document.getElementById('playerDbNoticeCount');
        if (n) n.textContent = notice === 1 ? '1 player was' : `${notice} players were`;
    }

    const usage = await PlayerRegistry.usage();
    renderPlayerList._usage = usage;
    const all = PlayerRegistry.all();
    if (count) count.textContent = `${all.filter(p => !p.archived).length} active · ${all.filter(p => p.archived).length} archived`;
    const q = _dbSearch.toLowerCase();
    const list = all
        .filter(p => (_dbShowArchived || !p.archived) && (!q || [p.short, p.first, p.last, ...p.prev].some(s => s && s.toLowerCase().includes(q))))
        .sort((a, b) => (a.archived - b.archived) || a.short.localeCompare(b.short));
    const dash = '<span class="rg-dim">—</span>';
    const fmt = ms => { if (!ms) return dash; const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const rows = [];
    body.innerHTML = list.map(p => {
        const u = usage.get(p.id) || { played: 0, lastPlayed: null, entered: false };
        const idx = rows.push(p.id) - 1;
        const status = p.archived ? '<span class="st-pill rg-status">Archived</span>'
            : u.entered ? '<span class="st-pill rg-status rg-lock" title="Has been in Analytics: can be archived, not deleted">Has played</span>'
            : '<span class="st-pill rg-status">New</span>';
        const second = u.entered
            ? `<button type="button" class="st-btn st-sm" data-db-arch="${idx}">${p.archived ? 'Unarchive' : 'Archive'}</button>`
            : `<button type="button" class="st-btn st-sm rg-danger" data-db-del="${idx}">Delete</button>`;
        return `<tr class="${p.archived ? 'rg-archived' : ''}">` +
            `<td class="rg-short">${escapeHtml(p.short)}</td><td>${p.first ? escapeHtml(p.first) : dash}</td><td>${p.last ? escapeHtml(p.last) : dash}</td>` +
            `<td class="rg-prev">${escapeHtml(p.prev.join(', '))}</td><td class="rg-num">${u.played || dash}</td><td class="rg-num">${fmt(u.lastPlayed)}</td>` +
            `<td>${status}</td><td class="rg-acts"><button type="button" class="st-btn st-sm" data-db-edit="${idx}">Edit</button>${second}</td></tr>`;
    }).join('') || `<tr><td colspan="8" class="rg-db-empty">${q ? 'No one matches.' : 'No players yet.'}</td></tr>`;
    renderPlayerDatabase._rows = rows;
    renderPlayerDatabase._usage = usage;

    if (!body._rgDelegated) {
        body._rgDelegated = true;
        body.addEventListener('click', (e) => {
            const pick = (attr) => { const b = e.target.closest(`[${attr}]`); return b ? (renderPlayerDatabase._rows || [])[+b.getAttribute(attr)] : null; };
            let id;
            if ((id = pick('data-db-edit'))) openPlayerForm(id);
            else if ((id = pick('data-db-arch'))) { const p = PlayerRegistry.get(id); PlayerRegistry.setArchived(id, !p.archived); renderPlayerDatabase(); }
            else if ((id = pick('data-db-del'))) confirmDeletePlayer(id);
        });
    }
}

function onPlayerDbSearch(value) { _dbSearch = String(value || '').trim(); renderPlayerDatabase(); }
function onPlayerDbShowArchived(on) { _dbShowArchived = !!on; renderPlayerDatabase(); }
function dismissPlayerDbNotice() { PlayerRegistry.dismissImportNotice(); renderPlayerDatabase(); }

/** Redraw what shows players after the database changed. */
function _afterRegistryChange() {
    renderPlayerList._usage = null;
    updatePlayersDisplay();
    renderPlayerList();
    if (_registrationTab === 'database') renderPlayerDatabase();
}

// ---------------------------------------------------------------------------
// Dialogs: new / edit player, merge, delete, import (one shared #playerDbModal)
// ---------------------------------------------------------------------------

function _openPlayerDialog(html) {
    const d = document.getElementById('playerDbDialog');
    if (!d) return null;
    d.innerHTML = html;
    pushDialog('playerDbModal', null, true);
    const first = d.querySelector('input, select');
    if (first) setTimeout(() => first.focus(), 0);
    d.querySelectorAll('[data-dlg-cancel]').forEach(b => b.addEventListener('click', () => popDialog()));
    return d;
}

/**
 * New player (id null) or edit one. The short name is suggested from the first name, with
 * the last name's initial when that name is taken; it must be unique. Renaming keeps the
 * old short name as a previous name.
 * @param {string|null} id
 * @param {string} [presetShort] - from the search box
 */
function openPlayerForm(id, presetShort) {
    const p = id ? PlayerRegistry.get(id) : null;
    const isNew = !p;
    const usage = (renderPlayerDatabase._usage || renderPlayerList._usage || new Map()).get(p ? p.id : '') || {};
    const d = _openPlayerDialog(`
        <div class="dlg__main">
            <h2 class="dlg__title">${isNew ? 'New player' : 'Edit ' + escapeHtml(p.short)}</h2>
            <div class="rg-form2">
                <div><label class="dlg__label" for="pfFirst">First name</label><input type="text" class="dlg__input" id="pfFirst" autocomplete="off" value="${escapeHtml(p ? p.first : '')}"></div>
                <div><label class="dlg__label" for="pfLast">Last name</label><input type="text" class="dlg__input" id="pfLast" autocomplete="off" value="${escapeHtml(p ? p.last : '')}"></div>
            </div>
            <div><label class="dlg__label" for="pfShort">Short name</label><input type="text" class="dlg__input" id="pfShort" autocomplete="off" value="${escapeHtml(p ? p.short : (presetShort || ''))}">
                <p class="rg-form-msg" id="pfMsg"></p></div>
            ${p && p.prev.length ? `<div><span class="dlg__label">Previous names</span><div class="rg-prevs">${p.prev.map(n => `<span>${escapeHtml(n)}</span>`).join('')}</div><p class="rg-form-msg">Older results under these names still count for ${escapeHtml(p.short)}.</p></div>` : ''}
            ${p ? `<p class="rg-form-id">Player ID <code>${escapeHtml(p.id)}</code>${usage.played ? ` · ${usage.played} tournament${usage.played === 1 ? '' : 's'}` : ''}</p>` : ''}
        </div>
        <div class="dlg__foot">
            <button type="button" class="btn" data-dlg-cancel>Cancel</button>
            <button type="button" class="btn btn-success" id="pfSave">${isNew ? (tournament && _registrationTab === 'tonight' && !(tournament.bracket && matches.length > 0) ? 'Create and add' : 'Create player') : 'Save'}</button>
        </div>`);
    if (!d) return;
    const first = d.querySelector('#pfFirst'), last = d.querySelector('#pfLast'), short = d.querySelector('#pfShort');
    const msg = d.querySelector('#pfMsg'), save = d.querySelector('#pfSave');
    let touched = !isNew || !!presetShort;
    const help = 'Shown in the bracket, Match Controls, the Chalker and the Leaderboard. Must be unique.';
    const check = () => {
        const problem = PlayerRegistry.shortNameProblem(short.value, p ? p.id : undefined);
        msg.textContent = problem ? problem + (problem.includes('already') ? ' Try adding an initial.' : '') : help;
        msg.classList.toggle('rg-err', !!problem);
        short.classList.toggle('rg-err', !!problem);
        save.disabled = !!problem;
    };
    const suggest = () => {
        if (touched) return;
        let s = first.value.trim();
        if (s && PlayerRegistry.byShort(s) && last.value.trim()) s += ' ' + last.value.trim()[0].toUpperCase();
        short.value = s;
        check();
    };
    first.addEventListener('input', suggest);
    last.addEventListener('input', suggest);
    short.addEventListener('input', () => { touched = true; check(); });
    d.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter' && !save.disabled) save.click(); }));
    check();
    save.addEventListener('click', () => {
        const fields = { short: short.value, first: first.value, last: last.value };
        if (isNew) {
            const entry = PlayerRegistry.create(fields);
            if (!entry) return;
            popDialog();
            _playerSearch = '';
            const input = document.getElementById('playerName');
            if (input) input.value = '';
            if (tournament && _registrationTab === 'tonight' && !(tournament.bracket && matches.length > 0)) addRegistryPlayer(entry.id);
        } else {
            const oldShort = p.short;
            if (!PlayerRegistry.update(p.id, fields)) return;
            // before the draw, the tournament shows the new short name too
            if (tournament && !(tournament.bracket && matches.length > 0) && !tournament.readOnly) {
                players.forEach(tp => { if (tp.registryId === p.id || (!tp.registryId && tp.name === oldShort)) tp.name = PlayerRegistry.get(p.id).short; });
                saveTournament();
            }
            popDialog();
        }
        _afterRegistryChange();
    });
}

/**
 * Merge two players who are the same person: one keeps its details, the other's ID and
 * names are kept with it, so all their tournaments and Analytics count as one player.
 */
async function openMergeDialog() {
    // who played where, for the guard below (the database tab usually has it already)
    if (!renderPlayerDatabase._usage) renderPlayerDatabase._usage = await PlayerRegistry.usage();
    const list = PlayerRegistry.all().sort((a, b) => a.short.localeCompare(b.short));
    if (list.length < 2) { alert('There need to be at least two players to merge.'); return; }
    const opts = list.map((p, i) => `<option value="${i}">${escapeHtml(p.short)}${PlayerRegistry.fullName(p) ? ' — ' + escapeHtml(PlayerRegistry.fullName(p)) : ''}${p.archived ? ' (archived)' : ''}</option>`).join('');
    const d = _openPlayerDialog(`
        <div class="dlg__main">
            <h2 class="dlg__title">Merge two players</h2>
            <p class="dlg__desc">For duplicates, like “Erik” and “Eirik”. Their tournaments and Analytics become one player's. This can't be undone.</p>
            <div class="rg-form2">
                <div><label class="dlg__label" for="mgA">Player</label><select class="dlg__input" id="mgA">${opts}</select></div>
                <div><label class="dlg__label" for="mgB">Same person as</label><select class="dlg__input" id="mgB">${opts}</select></div>
            </div>
            <div><span class="dlg__label">Keep the details of</span><div class="rg-merge-keep" id="mgKeep"></div>
                <p class="rg-form-msg">The other's short name is kept as a previous name.</p></div>
            <p class="rg-merge-block" id="mgBlock" hidden></p>
        </div>
        <div class="dlg__foot">
            <button type="button" class="btn" data-dlg-cancel>Cancel</button>
            <button type="button" class="btn btn-danger" id="mgDo">Merge</button>
        </div>`);
    if (!d) return;
    const a = d.querySelector('#mgA'), b = d.querySelector('#mgB'), keep = d.querySelector('#mgKeep'), go = d.querySelector('#mgDo');
    const block = d.querySelector('#mgBlock');
    b.value = '1';
    const usage = renderPlayerDatabase._usage || new Map();
    // Two players who were in the same tournament are two people: refuse, and say where
    const together = (pa, pb) => {
        const ta = (usage.get(pa.id) || {}).tournaments, tb = (usage.get(pb.id) || {}).tournaments;
        if (!ta || !tb) return [];
        return [...ta.entries()].filter(([id]) => tb.has(id)).map(([, name]) => name);
    };
    const draw = () => {
        const pa = list[+a.value], pb = list[+b.value];
        keep.innerHTML = [pa, pb].map((p, i) => {
            const u = usage.get(p.id) || {};
            return `<label><input type="radio" name="mgKeep" value="${i}"${i === 0 ? ' checked' : ''}><span><b>${escapeHtml(p.short)}</b> ${escapeHtml(PlayerRegistry.fullName(p))}<small>${u.played || 0} tournaments${p.prev.length ? ' · was ' + escapeHtml(p.prev.join(', ')) : ''}</small></span></label>`;
        }).join('');
        const both = a.value === b.value ? [] : together(pa, pb);
        block.hidden = !both.length;
        if (both.length) {
            const shown = both.slice(0, 3).join(', ') + (both.length > 3 ? ` and ${both.length - 3} more` : '');
            block.textContent = `${pa.short} and ${pb.short} both played in ${both.length === 1 ? 'the same tournament' : both.length + ' of the same tournaments'} (${shown}), so they are two different people and can't be merged.`;
        }
        go.disabled = a.value === b.value || both.length > 0;
    };
    a.addEventListener('change', draw);
    b.addEventListener('change', draw);
    draw();
    go.addEventListener('click', () => {
        const pair = [list[+a.value], list[+b.value]];
        const k = +(d.querySelector('input[name="mgKeep"]:checked') || { value: 0 }).value;
        const kept = pair[k], gone = pair[1 - k];
        if (together(kept, gone).length) return;
        if (!PlayerRegistry.merge(kept.id, gone.id)) return;
        // the loaded tournament: the merged player is now the kept one
        if (tournament && !tournament.readOnly) {
            const started = tournament.bracket && matches.length > 0;
            players.forEach(tp => {
                if (tp.registryId === gone.id) { tp.registryId = kept.id; if (!started) tp.name = PlayerRegistry.get(kept.id).short; }
            });
            saveTournament();
        }
        popDialog();
        _afterRegistryChange();
    });
}

/** Delete a player who was never in Analytics. */
function confirmDeletePlayer(id) {
    const p = PlayerRegistry.get(id);
    if (!p) return;
    const u = (renderPlayerDatabase._usage || new Map()).get(p.id);
    if (u && u.entered) { alert(`${p.short} has played, so they are kept for Analytics. Archive them instead.`); return; }
    const d = _openPlayerDialog(`
        <div class="dlg__main">
            <h2 class="dlg__title">Delete ${escapeHtml(p.short)}?</h2>
            <p class="dlg__desc">${escapeHtml(p.short)} has never played a match, so nothing in Analytics depends on them.${players.some(tp => tp.registryId === p.id) ? ' They are also taken out of this tournament.' : ''}</p>
        </div>
        <div class="dlg__foot">
            <button type="button" class="btn" data-dlg-cancel>Cancel</button>
            <button type="button" class="btn btn-danger" id="pdDo">Delete player</button>
        </div>`);
    if (!d) return;
    d.querySelector('#pdDo').addEventListener('click', () => {
        PlayerRegistry.remove(p.id);
        if (tournament && !(tournament.bracket && matches.length > 0) && players.some(tp => tp.registryId === p.id)) {
            players = players.filter(tp => tp.registryId !== p.id);
            saveTournament();
            updatePlayerCount();
        }
        popDialog();
        _afterRegistryChange();
    });
}

/**
 * Bring in players from a tournament file: its player database (by ID), or the saved
 * players of an older file. Adds; never replaces.
 */
function importPlayerListFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = JSON.parse(await file.text());
            if (!data || (!data.playerDatabase && !Array.isArray(data.playerList))) {
                alert('This file has no players to import.');
                return;
            }
            const added = PlayerRegistry.mergeFrom(data);
            _afterRegistryChange();
            alert(added ? `✓ ${added} player${added === 1 ? '' : 's'} added to the database.` : 'Everyone in the file is already in the database.');
        } catch (error) {
            console.error('Error importing players:', error);
            alert('Error reading file. Please check the file format.');
        }
    };
    input.click();
}

/**
 * Add a player by name (Match Controls' add-player field fills #playerName and calls
 * this): the database player with that short or previous name, or a new one.
 * Blocked once the bracket is drawn.
 * @returns {void}
 */
function addPlayer() {
    if (tournament && tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return;
    }
    const nameInput = document.getElementById('playerName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
        alert('Please enter a player name');
        return;
    }
    const entry = PlayerRegistry.findOrCreate(name);
    if (!entry) { alert('Could not add that player.'); return; }
    if (nameInput) nameInput.value = '';
    _playerSearch = '';
    addRegistryPlayer(entry.id);
}

/**
 * Removes a player from the tournament by ID.
 * Blocked if tournament bracket already exists.
 *
 * @param {number} playerId - The player ID to remove
 * @returns {void}
 *
 * @description
 * - Filters player from global players array
 * - Updates UI displays and saves tournament
 * - Re-renders Player List
 */
function removePlayer(playerId) {
    // Check if tournament is in progress (bracket exists)
    if (tournament && tournament.bracket && matches.length > 0) {
        showTournamentProgressWarning();
        return;
    }

    players = players.filter(p => p.id !== playerId);
    updatePlayersDisplay();
    updatePlayerCount();
    saveTournament();
    updateResultsTable();

    // Re-render Player List to show updated state
    renderPlayerList();
}

/**
 * Toggles a player's paid status.
 * Blocked if tournament is active or completed.
 *
 * @param {number} playerId - The player ID to toggle
 * @returns {void}
 *
 * @description
 * - Flips player.paid boolean value
 * - Updates UI displays and saves tournament
 * - Re-renders Player List with new sort order
 * - Shows help hint when 4 players are paid
 */
function togglePaid(playerId) {
    // Prevent changes if tournament is active or completed
    if (tournament && (tournament.status === 'active' || tournament.status === 'completed')) {
        showTournamentProgressWarning();
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (player) {
        player.paid = !player.paid;
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
        updateResultsTable();

        // Re-render Player List to show updated payment status and re-sort
        renderPlayerList();

    }
}

function openStatsModal(playerId) {
    // Silent early return for read-only tournaments - clicking does nothing
    if (tournament && tournament.readOnly) {
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    currentStatsPlayer = player;
    document.getElementById('statsPlayerName').textContent = `Edit ${player.name}'s statistics`;

    // Clear input fields when opening modal
    document.getElementById('statsShortLegDarts').value = '';
    document.getElementById('statsHighOut').value = '';

    // Convert old format to new format if needed
    if (typeof player.stats.shortLegs === 'number') {
        player.stats.shortLegs = [];
    }

    // Update counters instead of input values
    updateStatsCounters();
    updateShortLegsList();
    updateHighOutsList();

    // Use dialog stack to show modal with automatic parent hiding/restoration
    pushDialog('statsModal', null, true); // No restore function needed - this is a leaf dialog
}

function addHighOut() {
    const score = parseInt(document.getElementById('statsHighOut').value);
    if (!score || score < 101 || score > 170) {
        alert('Please enter a valid high out score (101-170)');
        return;
    }

    if (!currentStatsPlayer.stats.highOuts) {
        currentStatsPlayer.stats.highOuts = [];
    }

    currentStatsPlayer.stats.highOuts.push(score);
    document.getElementById('statsHighOut').value = '';
    updateHighOutsList();
}

function updateHighOutsList() {
    const container = document.getElementById('highOutsList');
    container.replaceChildren();
    if (!currentStatsPlayer || !Array.isArray(currentStatsPlayer.stats.highOuts)) return;

    currentStatsPlayer.stats.highOuts.forEach((score, index) => {
        container.appendChild(_buildStatListItem(score, () => removeHighOut(index)));
    });
}

function removeHighOut(index) {
    if (currentStatsPlayer && currentStatsPlayer.stats.highOuts) {
        currentStatsPlayer.stats.highOuts.splice(index, 1);
        updateHighOutsList();
    }
}

function saveStats() {
    if (!currentStatsPlayer) return;

    // Remove these lines - no longer needed:
    // currentStatsPlayer.stats.tons = parseInt(document.getElementById('statsTons').value) || 0;
    // currentStatsPlayer.stats.oneEighties = parseInt(document.getElementById('stats180s').value) || 0;

    updatePlayersDisplay();
    // Call saveTournament if it exists, otherwise just continue
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // Refresh the results table dynamically
    if (typeof updateResultsTable === 'function') {
        updateResultsTable();

        // Also update the statistics table if the statistics modal is open
        const statisticsModal = document.getElementById('statisticsModal');
        if (statisticsModal && statisticsModal.style.display !== 'none') {
            updateResultsTable('statisticsTableBody');
        }
    }

    closeStatsModal();
}

function closeStatsModal() {
    currentStatsPlayer = null;
    popDialog(); // Use dialog stack to close and restore parent
}

function updatePlayersDisplay() {
    const container = document.getElementById('playersContainer');
    if (!container) return;

    const tournamentStarted = !!(tournament && tournament.bracket && matches.length > 0);
    const lateRegBtn = document.getElementById('lateRegBtnContainer');
    if (lateRegBtn) {
        lateRegBtn.innerHTML = tournamentStarted
            ? '<span>Someone arrived after the draw?</span><button type="button" class="st-link" onclick="showLateRegInfoModal()">Player arrived late?</button>'
            : '';
    }

    if (players.length === 0) {
        container.innerHTML = `<div class="st-empty st-small"><span>${tournament ? 'No players yet. Pick them from the database.' : 'No tournament loaded.'}</span></div>`;
        return;
    }

    // Alphabetical (case-insensitive). Before the draw a row toggles paid and an unpaid
    // player can be removed; after it the list is locked, so rows get neither.
    const sortedPlayers = [...players].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    container.innerHTML = sortedPlayers.map(player => {
        const pill = player.paid
            ? (tournamentStarted ? '' : '<span class="rg-paid rg-yes">Paid</span>')
            : '<span class="rg-paid rg-no">Unpaid</span>';
        const removeButton = !player.paid && !tournamentStarted
            ? `<button type="button" class="rg-x" title="Remove ${escapeHtml(player.name)}" aria-label="Remove ${escapeHtml(player.name)}" onclick="event.stopPropagation(); removePlayer(${player.id})">×</button>`
            : '';
        const toggle = tournamentStarted ? '' : ` onclick="togglePaid(${player.id})" title="Click to mark ${player.paid ? 'unpaid' : 'paid'}"`;
        const entry = typeof PlayerRegistry !== 'undefined' ? (PlayerRegistry.get(player.registryId) || PlayerRegistry.byName(player.name)) : null;
        const full = entry ? PlayerRegistry.fullName(entry) : '';
        return `<div class="rg-prow"${toggle}><span class="rg-who"><b class="rg-name">${escapeHtml(player.name)}</b>${full ? `<span>${escapeHtml(full)}</span>` : ''}</span><span class="rg-right">${pill}${removeButton}</span></div>`;
    }).join('');
}

function showLateRegInfoModal() {
    const developerMode = isDeveloperMode();

    const firstPara = document.getElementById('lateRegInfoFirstPara');
    if (firstPara) {
        firstPara.innerHTML = developerMode
            ? 'To register a late arrival, open the <strong>Developer Console</strong> from the <strong>Console</strong> link in the Tournament Bracket header.'
            : 'To register a late arrival, enable the <strong>Developer Console</strong> in <strong>Global Settings</strong>, then open it from the <strong>Console</strong> link in the Tournament Bracket header.';
    }

    pushDialog('lateRegInfoModal', null, true);
}

/**
 * Update the Registration page's Players / Paid / Unpaid counts and its next step.
 * Called whenever players or their payments change, and when the page is shown.
 * @returns {void}
 */
function updatePlayerCount() {
    const totalPlayers = players.length;
    const paidPlayers = players.filter(p => p.paid).length;
    const total = document.getElementById('playerCount');
    const paid = document.getElementById('paidCount');
    const unpaid = document.getElementById('unpaidCount');
    if (total) total.textContent = totalPlayers;
    if (paid) paid.textContent = paidPlayers;
    if (unpaid) {
        unpaid.textContent = totalPlayers - paidPlayers;
        unpaid.classList.toggle('rg-warn', totalPlayers > paidPlayers);
    }
    renderRegistrationNext();
}

function clearAllPlayers() {
    if (confirm('Are you sure you want to remove all players? This cannot be undone.')) {
        players = [];
        updatePlayersDisplay();
        updatePlayerCount();
        saveTournament();
    }
}

function addShortLeg() {
    const darts = parseInt(document.getElementById('statsShortLegDarts').value);
    if (!darts || darts < 9 || darts > 21) {
        alert('Please enter valid dart count (9-21)');
        return;
    }

    if (!Array.isArray(currentStatsPlayer.stats.shortLegs)) {
        currentStatsPlayer.stats.shortLegs = [];
    }

    currentStatsPlayer.stats.shortLegs.push(darts);
    document.getElementById('statsShortLegDarts').value = '';
    updateShortLegsList();
}

function updateShortLegsList() {
    const container = document.getElementById('shortLegsList');
    container.replaceChildren();
    if (!currentStatsPlayer || !Array.isArray(currentStatsPlayer.stats.shortLegs)) return;

    currentStatsPlayer.stats.shortLegs.forEach((darts, index) => {
        container.appendChild(_buildStatListItem(darts, () => removeShortLeg(index)));
    });
}

function removeShortLeg(index) {
    if (currentStatsPlayer && Array.isArray(currentStatsPlayer.stats.shortLegs)) {
        currentStatsPlayer.stats.shortLegs.splice(index, 1);
        updateShortLegsList();
    }
}

function increment180s() {
    if (!currentStatsPlayer) return;
    currentStatsPlayer.stats.oneEighties = (currentStatsPlayer.stats.oneEighties || 0) + 1;
    updateStatsCounters();
}

function decrement180s() {
    if (!currentStatsPlayer) return;
    const current = currentStatsPlayer.stats.oneEighties || 0;
    if (current > 0) {
        currentStatsPlayer.stats.oneEighties = current - 1;
        updateStatsCounters();
    }
}

function incrementTons() {
    if (!currentStatsPlayer) return;
    currentStatsPlayer.stats.tons = (currentStatsPlayer.stats.tons || 0) + 1;
    updateStatsCounters();
}

function decrementTons() {
    if (!currentStatsPlayer) return;
    const current = currentStatsPlayer.stats.tons || 0;
    if (current > 0) {
        currentStatsPlayer.stats.tons = current - 1;
        updateStatsCounters();
    }
}

function incrementLollipops() {
    if (!currentStatsPlayer) return;
    currentStatsPlayer.stats.lollipops = (currentStatsPlayer.stats.lollipops || 0) + 1;
    updateStatsCounters();
}

function decrementLollipops() {
    if (!currentStatsPlayer) return;
    const current = currentStatsPlayer.stats.lollipops || 0;
    if (current > 0) {
        currentStatsPlayer.stats.lollipops = current - 1;
        updateStatsCounters();
    }
}

function updateStatsCounters() {
    const current180s = currentStatsPlayer?.stats.oneEighties || 0;
    const currentTons = currentStatsPlayer?.stats.tons || 0;
    const currentLollipops = currentStatsPlayer?.stats.lollipops || 0;

    document.getElementById('current180sCount').textContent = current180s;
    document.getElementById('currentTonsCount').textContent = currentTons;
    document.getElementById('currentLollipopsCount').textContent = currentLollipops;
}

/**
 * Build a chip-style list item. The whole chip is a button — click anywhere
 * on it to remove. Hover turns red to signal the destructive action.
 */
function _buildStatListItem(value, onRemove) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'stat-list-item';
    chip.title = 'Click to remove';
    chip.onclick = onRemove;

    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    chip.appendChild(valueSpan);

    const xSpan = document.createElement('span');
    xSpan.className = 'stat-list-item__x';
    xSpan.textContent = '×';
    chip.appendChild(xSpan);

    return chip;
}
