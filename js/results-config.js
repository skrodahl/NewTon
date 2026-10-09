// results-config.js - Bulletproof Global Configuration System
// All Config page settings are GLOBAL and PERSISTENT

// GLOBAL CONFIG - Single Source of Truth
const DEFAULT_CONFIG = {
    points: {
        participation: 5,
        nonQualifiedParticipation: true, // players who lose a qualifier get Taking part (Docs/QUALIFIERS.md)
        first: 15,
        second: 13,
        third: 10,
        fourth: 9, // Correctly added
        fifthSixth: 8, // Correctly added
        seventhEighth: 7, // Correctly added
        highOut: 1,
        ton: 0,
        oneEighty: 1,
        shortLeg: 1
    },
    legs: {
        regularRounds: 3,
        frontsideSemifinal: 3,
        backsideSemifinal: 3,
        backsideFinal: 5,
        grandFinal: 5,
        seRegularRounds: 3,
        seQuarterfinal: 3,
        seSemifinal: 3,
        seBronze: 5,
        seFinal: 5,
        groupMatches: 3,
        cupRounds: 3,         // Round Robin's A and B cups: every round before the semifinals
        cupSemifinal: 3,
        cupBronze: 5,
        cupFinal: 5,
        x01Format: 501,
        maxRounds: 13,
        shortLegThreshold: 21
    },
    clubName: "NewTon DC",
    lanes: {
        maxLanes: 4,
        excludedLanes: [],
        requireLaneForStart: false
    },
    ui: {
        hiddenFormats: [],
        confirmWinnerSelection: true,
        offerPlate: true,     // Cup and Plate: the Play a Plate switch at single elimination's draw (Docs/CUP-AND-PLATE.md)
        autoOpenMatchControls: true,
        defaultPaid: false,
        developerMode: false,
        refereeSuggestionsLimit: 10,
        bracketFinals: 'right'
    },
    chalker: {
        handover: 'none'      // new installs; a saved config without it keeps 'qr' (loadConfiguration())
    },
    seeding: {
        mode: 'available',
        seeds: 'quarter'
    },
    roundRobin: {
        structure: 'groups',  // 'groups': groups, then an A and a B cup; 'single': one group, the table decides
        cupEntry: 'half',     // 'half': the top half across the groups to the A cup; 'top2': the top two of each group
        rematches: 'allow',   // group rematches in cup round 1: 'allow' (the mirror draw) or 'avoid'
        bCup: true,           // Play the B cup is on to start with at Draw the cups
        maxGroup: 4           // the largest group (4, 5 or 6) in groups and cups
    },
    server: {
        allowSharedTournamentDelete: false,
        autoUpload: false,
        remoteUrl: '',
        remoteApiKey: '',
        remoteVerified: false
    }
};

// BULLETPROOF CONFIG LOADING
function loadConfiguration() {
    console.log('🔧 Loading global configuration...');

    try {
        const savedConfig = localStorage.getItem('dartsConfig');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            // Handover's default became None, but a config saved before the setting existed has always
            // meant QR code (additive-only: absent keeps its old meaning), so it stays QR code
            if (!parsed.chalker || !parsed.chalker.handover) parsed.chalker = Object.assign({}, parsed.chalker, { handover: 'qr' });
            // The cups had the single elimination lengths before they got their own, so a config saved
            // before then keeps them
            const L = parsed.legs;
            if (L && L.cupRounds == null) {
                const keep = { cupRounds: L.seQuarterfinal, cupSemifinal: L.seSemifinal, cupBronze: L.seBronze, cupFinal: L.seFinal };
                Object.keys(keep).forEach(k => { if (keep[k] != null) L[k] = keep[k]; });
            }
            config = mergeWithDefaults(parsed, DEFAULT_CONFIG);
            console.log('✓ Loaded saved global config');
        } else {
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            saveGlobalConfig();
            console.log('✓ Initialized default global config');
        }
        applyConfigToUI();
    } catch (error) {
        console.error('❌ Error loading config, using defaults:', error);
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        saveGlobalConfig();
        applyConfigToUI();
    }

    // Generate server ID once — identifies this TM instance in QR payloads.
    // crypto.randomUUID is undefined in non-secure contexts (plain-HTTP LAN deploys are
    // supported), so fall back to getRandomValues, which IS available over HTTP.
    if (!config.server.serverId) {
        const hex = crypto.randomUUID
            ? crypto.randomUUID().replace(/-/g, '')
            : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
        config.server.serverId = hex.substring(0, 12);
        saveGlobalConfig();
        console.log('✓ Generated server ID:', config.server.serverId);
    }
}

// MERGE CONFIG WITH DEFAULTS
function mergeWithDefaults(userConfig, defaults) {
    const merged = JSON.parse(JSON.stringify(defaults));
    Object.keys(userConfig).forEach(key => {
        if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key]) && userConfig[key] !== null) {
            merged[key] = { ...merged[key], ...userConfig[key] };
        } else {
            merged[key] = userConfig[key];
        }
    });
    return merged;
}

// APPLY CONFIG TO UI ELEMENTS
function applyConfigToUI() {
    console.log('🎨 Applying config to UI elements...');

    // Point configuration
    safeSetValue('participationPoints', config.points.participation);
    safeSetChecked('nonQualifiedParticipation', config.points.nonQualifiedParticipation !== false);
    safeSetValue('firstPlacePoints', config.points.first);
    safeSetValue('secondPlacePoints', config.points.second);
    safeSetValue('thirdPlacePoints', config.points.third);
    safeSetValue('fourthPlacePoints', config.points.fourth);
    safeSetValue('fifthSixthPlacePoints', config.points.fifthSixth);
    safeSetValue('seventhEighthPlacePoints', config.points.seventhEighth);
    safeSetValue('highOutPoints', config.points.highOut);
    safeSetValue('tonPoints', config.points.ton);
    safeSetValue('shortLegPoints', config.points.shortLeg);
    safeSetValue('oneEightyPoints', config.points.oneEighty);

    // Match leg configuration — Double Elimination
    safeSetValue('regularRoundsLegs', config.legs.regularRounds);
    safeSetValue('frontsideSemifinalLegs', config.legs.frontsideSemifinal);
    safeSetValue('backsideSemifinalLegs', config.legs.backsideSemifinal);
    safeSetValue('backsideFinalLegs', config.legs.backsideFinal);
    safeSetValue('grandFinalLegs', config.legs.grandFinal);

    // Match leg configuration — Single Elimination
    safeSetValue('seRegularRoundsLegs', config.legs.seRegularRounds);
    safeSetValue('seQuarterfinalLegs', config.legs.seQuarterfinal);
    safeSetValue('seSemifinalLegs', config.legs.seSemifinal);
    safeSetValue('seBronzeLegs', config.legs.seBronze);
    safeSetValue('seFinalLegs', config.legs.seFinal);
    safeSetValue('groupMatchesLegs', config.legs.groupMatches || 3);
    safeSetValue('cupRoundsLegs', config.legs.cupRounds || 3);
    safeSetValue('cupSemifinalLegs', config.legs.cupSemifinal || 3);
    safeSetValue('cupBronzeLegs', config.legs.cupBronze || 5);
    safeSetValue('cupFinalLegs', config.legs.cupFinal || 5);
    initX01Toggle(config.legs.x01Format);
    safeSetValue('chalkerMaxRounds', config.legs.maxRounds);
    safeSetValue('chalkerShortLegThreshold', config.legs.shortLegThreshold || 21);
    safeSetValue('chalkerHandover', getChalkerHandover());
    renderFormatVisibilityOptions();

    // Application title
    if (config.clubName) {
        safeSetValue('applicationTitle', config.clubName);
        updateApplicationTitle(config.clubName + ' - Tournament Manager');
    } else if (config.applicationTitle) {
        // Legacy support - extract club name from old format
        const clubName = config.applicationTitle.replace(' - Tournament Manager', '');
        config.clubName = clubName;
        safeSetValue('applicationTitle', clubName);
        updateApplicationTitle(config.applicationTitle);
    } else {
        // No custom branding - use default
        const defaultClubName = 'NewTon DC';
        safeSetValue('applicationTitle', defaultClubName);
        updateApplicationTitle(defaultClubName + ' - Tournament Manager');
    }

    // Lane configuration
    if (config.lanes) {
        safeSetValue('maxLanes', config.lanes.maxLanes);
        safeSetChecked('requireLaneForStart', config.lanes.requireLaneForStart);

        // Set excluded lanes as comma-separated string
        if (config.lanes.excludedLanes && Array.isArray(config.lanes.excludedLanes)) {
            safeSetValue('excludedLanes', config.lanes.excludedLanes.join(','));
        }
    }

    // UI configuration
    if (config.ui) {
        safeSetChecked('confirmWinnerSelection', config.ui.confirmWinnerSelection);
        safeSetChecked('offerPlate', config.ui.offerPlate !== false);
        safeSetChecked('autoOpenMatchControls', config.ui.autoOpenMatchControls);
        safeSetChecked('defaultPaid', config.ui.defaultPaid);
        safeSetChecked('developerMode', config.ui.developerMode);
        safeSetValue('refereeSuggestionsLimit', config.ui.refereeSuggestionsLimit);
        safeSetValue('bracketFinals', config.ui.bracketFinals === 'middle' ? 'middle' : 'right');
    }

    // Seeding
    if (config.seeding) {
        safeSetValue('seedingMode', config.seeding.mode);
        safeSetValue('seedingSeeds', ['all', 'half', 'quarter', 'eighth'].includes(config.seeding.seeds) ? config.seeding.seeds : 'quarter');
    }

    // Round Robin (groups and cups, or one group)
    const rr = config.roundRobin || {};
    safeSetValue('rrStructure', rr.structure === 'single' ? 'single' : 'groups');
    safeSetValue('rrCupEntry', rr.cupEntry === 'top2' ? 'top2' : 'half');
    safeSetChecked('rrBCup', rr.bCup !== false);
    safeSetValue('rrRematches', rr.rematches === 'avoid' ? 'avoid' : 'allow');
    safeSetValue('rrMaxGroup', [5, 6].includes(Number(rr.maxGroup)) ? String(rr.maxGroup) : '4');

    // Server configuration
    if (config.server) {
        safeSetChecked('allowSharedTournamentDelete', config.server.allowSharedTournamentDelete);
        safeSetChecked('autoUploadTournament', config.server.autoUpload);
        safeSetValue('remoteServerUrl', config.server.remoteUrl);
        safeSetValue('remoteServerApiKey', config.server.remoteApiKey || '');
        safeSetValue('remoteServerVerified', config.server.remoteVerified ? '1' : '');
        safeSetValue('serverIdDisplay', config.server.serverId || '—');
    }

    console.log('✓ Config applied to UI');
}

// SAFE UI ELEMENT SETTERS
function safeSetValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element && value !== undefined) {
        element.value = value;
    }
}

function safeSetChecked(elementId, value) {
    const element = document.getElementById(elementId);
    if (element && value !== undefined) {
        element.checked = !!value;
    }
}

/**
 * Initialize the x01 format toggle. If the stored value matches a preset,
 * show the dropdown. Otherwise, switch to custom mode with the stored value.
 * @param {number} value - stored x01Format value
 */
function initX01Toggle(value) {
    const select = document.getElementById('chalkerX01Format');
    const custom = document.getElementById('chalkerX01Custom');
    const toggle = document.getElementById('chalkerX01CustomToggle');
    const warning = document.getElementById('chalkerX01Warning');
    if (!select || !custom || !toggle) return;

    const presets = Array.from(select.options).map(o => parseInt(o.value));
    const isCustom = value && !presets.includes(value);

    toggle.checked = isCustom;
    select.style.display = isCustom ? 'none' : '';
    custom.style.display = isCustom ? '' : 'none';
    if (warning) warning.style.display = isCustom ? '' : 'none';

    if (isCustom) {
        custom.value = value;
    } else {
        safeSetValue('chalkerX01Format', value);
    }

    toggle.onchange = () => {
        const checked = toggle.checked;
        select.style.display = checked ? 'none' : '';
        custom.style.display = checked ? '' : 'none';
        if (warning) warning.style.display = checked ? '' : 'none';
        if (checked) {
            custom.value = select.value;
            custom.focus();
        }
    };
}

/**
 * A copy of a config without the server credentials: the remote API key (and its
 * verified flag), and the username and password it replaced. Tournament files and the Analytics register keep a
 * copy of the config, and tournament files are uploaded to servers that members can read.
 * @param {object} cfg - a config (the global one, or a snapshot from a file)
 * @returns {object} a copy; the config passed in is left untouched
 */
function withoutServerCredentials(cfg) {
    const copy = JSON.parse(JSON.stringify(cfg || {}));
    if (copy.server) {
        delete copy.server.remoteApiKey;
        delete copy.server.remoteVerified;
        delete copy.server.remoteUsername;
        delete copy.server.remotePassword;
    }
    return copy;
}

/**
 * The global config as it goes into a tournament file, without the server credentials.
 * @returns {object}
 */
function configForExport() {
    return withoutServerCredentials(typeof config !== 'undefined' ? config : {});
}

// SAVE GLOBAL CONFIG
function saveGlobalConfig() {
    try {
        localStorage.setItem('dartsConfig', JSON.stringify(config));
        console.log('✓ Global config saved to localStorage');
    } catch (error) {
        console.error('❌ Failed to save global config:', error);
    }
}

// ... (The rest of the functions remain the same as the original file)

// APPLICATION SETTINGS
/**
 * Save the club name from the Global Settings form.
 * @param {{silent?: boolean}} [options] - silent: no alerts (the page's save bar reports)
 * @returns {boolean} false when the name is empty
 */
function saveApplicationSettings(options = {}) {
    const clubNameElement = document.getElementById('applicationTitle');
    const newClubName = clubNameElement ? clubNameElement.value.trim() : '';

    if (!newClubName) {
        if (!options.silent) alert('Club name cannot be empty');
        return false;
    }

    config.clubName = newClubName;
    updateApplicationTitle(newClubName + ' - Tournament Manager');

    saveGlobalConfig();

    // Re-render bracket to update tournament header with new club name
    if (typeof renderBracket === 'function') {
        renderBracket();
    }

    if (!options.silent) alert('✓ Branding saved successfully!');
    return true;
}

/**
 * Every tournament format the application can create.
 *
 * The single source for a format's presentation: its name, its one-line description,
 * and the player range it accepts. Both the Shuffle & Draw cards and the Config
 * page's visibility checkboxes are built from this list, so adding a format means
 * adding one entry here rather than editing two places that can drift apart.
 *
 * Deliberately presentation only. A format's *behaviour* — its progression tables,
 * its rendering path, its ranking rules — lives with the rest of the tournament
 * logic and is not abstracted here. Adding a new format still means teaching those
 * systems about it; this list just stops the UI from being written out twice.
 *
 * Order is display order.
 *
 * @type {Array<{id: string, name: string, blurb: string, minPlayers: number, maxPlayers: number}>}
 */
const TOURNAMENT_FORMATS = [
    {
        id: 'DE',
        name: 'Double Elimination Cup',
        blurb: 'Players get a second chance through the backside',
        minPlayers: 4,
        maxPlayers: 48  // above 32 through qualifiers (Docs/QUALIFIERS.md)
    },
    {
        id: 'SE',
        name: 'Single Elimination Cup',
        blurb: 'Players are eliminated after one loss',
        minPlayers: 4,
        maxPlayers: 48  // above 32 through qualifiers (Docs/QUALIFIERS.md)
    },
    {
        id: 'GROUPS',
        name: 'Round Robin',
        blurb: 'Everybody plays everybody: in groups followed by an A and a B cup, or in one group',
        minPlayers: 6,  // groups and cups; one group: 3-8 (Groups.limits())
        maxPlayers: 32
    }
];

/**
 * The formats offered when starting a tournament.
 *
 * Clubs that only ever play one way can hide the others on the Config page, so the
 * wrong format cannot be picked by accident on tournament night. Hiding is a display
 * filter on *creation only* — an already-created tournament in a hidden format still
 * opens, renders, undoes and exports exactly as before.
 *
 * A blocklist rather than an allowlist, by design: a format added in a future release
 * appears for everyone rather than staying invisible to the clubs most likely to have
 * configured this. Absent or empty means everything is shown, so existing installations
 * are unaffected.
 *
 * Never returns an empty list — the Config page prevents hiding the last format, and
 * this falls back to the full list if a stored value somehow hides them all.
 *
 * @returns {Array<object>} entries from TOURNAMENT_FORMATS, in display order
 */
function getVisibleFormats() {
    const hidden = (config && config.ui && Array.isArray(config.ui.hiddenFormats))
        ? config.ui.hiddenFormats : [];
    const visible = TOURNAMENT_FORMATS.filter(f => hidden.indexOf(f.id) === -1);
    return visible.length ? visible : TOURNAMENT_FORMATS.slice();
}

/**
 * Build the format visibility checkboxes on the Config page from TOURNAMENT_FORMATS.
 *
 * Rendered rather than hand-written so a new format appears here automatically. The
 * last remaining ticked box is disabled: hiding every format would leave no way to
 * start a tournament.
 *
 * @returns {void}
 */
function renderFormatVisibilityOptions() {
    const host = document.getElementById('formatVisibilityOptions');
    if (!host) return;

    const hidden = (config && config.ui && Array.isArray(config.ui.hiddenFormats))
        ? config.ui.hiddenFormats : [];

    host.innerHTML = TOURNAMENT_FORMATS.map(f => `
        <label class="cfg-choice">
            <input type="checkbox" class="format-visibility-toggle" data-format-id="${escapeHtml(f.id)}"
                   ${hidden.indexOf(f.id) === -1 ? 'checked' : ''}>
            <span><b>${escapeHtml(f.name)}</b><small>${escapeHtml(f.blurb)}</small></span>
        </label>
    `).join('');

    host.querySelectorAll('.format-visibility-toggle').forEach(cb => {
        cb.addEventListener('change', updateFormatVisibilityGuard);
    });
    updateFormatVisibilityGuard();
}

/**
 * Keep at least one format ticked by disabling the last one standing.
 * @returns {void}
 */
function updateFormatVisibilityGuard() {
    const boxes = Array.from(document.querySelectorAll('.format-visibility-toggle'));
    const checked = boxes.filter(cb => cb.checked);
    boxes.forEach(cb => {
        cb.disabled = (checked.length === 1 && cb.checked);
        cb.title = cb.disabled ? 'At least one format must remain available' : '';
    });
}

/**
 * Hand a started match over to a Chalker across the local network.
 *
 * This is only the guard. The implementation lives in `licensed/`, which is not
 * covered by this project's BSD licence and may be absent entirely — the app must
 * work without it (see `licensed/README.md`). Keeping every entry point funnelled
 * through here means the network layer has exactly one attachment point.
 *
 * @param {string} matchId - the live match to hand over, e.g. 'FS-1-3'
 * @returns {void}
 */
function transferMatchToDevice(matchId) {
    if (typeof NetworkClient !== 'undefined' && typeof NetworkClient.dispatchMatch === 'function') {
        NetworkClient.dispatchMatch(matchId);
        return;
    }
    alert('Network handover is not available yet.\n\nIt is still being built. Switch Handover to "QR code" on the Config page to hand matches over by scanning.');
}

/**
 * How a match is handed over to the Chalker.
 *
 * Global setting, chosen on the Config page:
 *   'qr'      — show the assignment QR and the result scanner
 *   'network' — hand over across the local network instead; all QR affordances are hidden
 *   'none'    — no handover at all; matches are entered manually (the default for new installs)
 *
 * Read through this helper rather than reaching into `config` directly, so configs saved
 * before the setting existed read uniformly (additive-only schema: missing means 'qr', as it
 * always has; loadConfiguration() fills that in, and DEFAULT_CONFIG's 'none' is for new installs).
 *
 * @returns {'qr'|'network'|'none'}
 */
function getChalkerHandover() {
    const mode = config && config.chalker && config.chalker.handover;
    return (mode === 'network' || mode === 'none') ? mode : 'qr';
}

/**
 * Whether developer mode is enabled — it gives access to the Developer Console via
 * the clickable header version number. Reads the in-memory global `config`
 * (single source of truth), not a fresh localStorage parse.
 * @returns {boolean}
 */
function isDeveloperMode() {
    return !!(typeof config !== 'undefined' && config.ui && config.ui.developerMode);
}

// Helper function to parse excluded lanes from string
function parseExcludedLanesString(excludedLanesString) {
    if (!excludedLanesString || typeof excludedLanesString !== 'string') {
        return [];
    }

    // Split by comma and convert to integers, filtering out invalid values
    return excludedLanesString
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => parseInt(s))
        .filter(n => !isNaN(n) && n > 0);
}

// LANE CONFIGURATION
/**
 * Save lane settings from the Global Settings form.
 * @param {{silent?: boolean}} [options] - silent: no alerts
 * @returns {void}
 */
function saveLaneConfiguration(options = {}) {
    const maxLanesElement = document.getElementById('maxLanes');
    const excludedLanesElement = document.getElementById('excludedLanes');
    const requireLaneElement = document.getElementById('requireLaneForStart');

    if (!maxLanesElement) {
        alert('Max lanes element not found');
        return;
    }

    // Parse excluded lanes from input
    const excludedLanesString = excludedLanesElement ? excludedLanesElement.value : '';
    const excludedLanes = parseExcludedLanesString(excludedLanesString);

    // Validate excluded lanes are within range
    const maxLanes = parseInt(maxLanesElement.value) || 4;
    const validExcludedLanes = excludedLanes.filter(lane => lane <= maxLanes);
    if (validExcludedLanes.length !== excludedLanes.length) {
        const invalidLanes = excludedLanes.filter(lane => lane > maxLanes);
        if (!options.silent) alert(`Warning: Some excluded lanes (${invalidLanes.join(', ')}) are above the maximum lane number (${maxLanes}) and will be ignored.`);
    }

    config.lanes = config.lanes || {};
    config.lanes.maxLanes = maxLanes;
    config.lanes.excludedLanes = validExcludedLanes;
    // No control on the page for this one: keep what is stored rather than switching it off
    config.lanes.requireLaneForStart = requireLaneElement ? requireLaneElement.checked : !!config.lanes.requireLaneForStart;

    saveGlobalConfig();

    // Refresh lane dropdowns if available
    if (typeof refreshAllLaneDropdowns === 'function') {
        setTimeout(refreshAllLaneDropdowns, 100);
    }

    if (!options.silent) alert('✓ Lane settings saved successfully!');
}

// UI CONFIGURATION
/**
 * Save user interface and server settings from the Global Settings form.
 * @param {{silent?: boolean}} [options] - silent: no alerts
 * @returns {void}
 */
function saveUIConfiguration(options = {}) {
    const confirmWinnerElement = document.getElementById('confirmWinnerSelection');
    const autoOpenElement = document.getElementById('autoOpenMatchControls');
    const defaultPaidElement = document.getElementById('defaultPaid');
    const allowDeleteElement = document.getElementById('allowSharedTournamentDelete');
    const developerModeElement = document.getElementById('developerMode');
    const refereeSuggestionsElement = document.getElementById('refereeSuggestionsLimit');

    config.ui = config.ui || {};
    config.ui.confirmWinnerSelection = confirmWinnerElement ? confirmWinnerElement.checked : true;
    const offerPlateElement = document.getElementById('offerPlate');
    config.ui.offerPlate = offerPlateElement ? offerPlateElement.checked : true;
    config.ui.autoOpenMatchControls = autoOpenElement ? autoOpenElement.checked : true;
    config.ui.defaultPaid = defaultPaidElement ? defaultPaidElement.checked : false;
    config.ui.developerMode = developerModeElement ? developerModeElement.checked : false;
    config.ui.refereeSuggestionsLimit = refereeSuggestionsElement ? parseInt(refereeSuggestionsElement.value) || 10 : 10;
    const bracketFinalsElement = document.getElementById('bracketFinals');
    if (bracketFinalsElement) config.ui.bracketFinals = bracketFinalsElement.value === 'middle' ? 'middle' : 'right';

    // Formats to hide when starting a tournament — stored as the unticked ones, so a
    // format added in a future release is shown by default. Only written when the
    // checkboxes are present, and never allowed to hide everything.
    const formatToggles = Array.from(document.querySelectorAll('.format-visibility-toggle'));
    if (formatToggles.length) {
        const hidden = formatToggles.filter(cb => !cb.checked).map(cb => cb.dataset.formatId);
        config.ui.hiddenFormats = (hidden.length < formatToggles.length) ? hidden : [];
    }

    // Seeding: how the draw may use the ranking (see js/seeding.js)
    const seedingModeElement = document.getElementById('seedingMode');
    const seedingSeedsElement = document.getElementById('seedingSeeds');
    config.seeding = config.seeding || {};
    config.seeding.mode = seedingModeElement && ['off', 'available', 'on'].includes(seedingModeElement.value) ? seedingModeElement.value : 'off';
    config.seeding.seeds = seedingSeedsElement && ['all', 'half', 'quarter', 'eighth'].includes(seedingSeedsElement.value) ? seedingSeedsElement.value : 'quarter';
    delete config.seeding.byesToSeeds; // an earlier build had this setting; the best seeds always get the byes

    // Round Robin: one group or groups and cups, who goes to the A cup, B cup on to start with
    const rrStructure = document.getElementById('rrStructure');
    const rrCupEntry = document.getElementById('rrCupEntry');
    const rrBCup = document.getElementById('rrBCup');
    const rrRematches = document.getElementById('rrRematches');
    const rrMaxGroup = document.getElementById('rrMaxGroup');
    config.roundRobin = {
        structure: rrStructure && rrStructure.value === 'single' ? 'single' : 'groups',
        cupEntry: rrCupEntry && rrCupEntry.value === 'top2' ? 'top2' : 'half',
        rematches: rrRematches && rrRematches.value === 'avoid' ? 'avoid' : 'allow',
        bCup: rrBCup ? rrBCup.checked : true,
        maxGroup: rrMaxGroup && [5, 6].includes(Number(rrMaxGroup.value)) ? Number(rrMaxGroup.value) : 4
    };

    config.server = config.server || {};
    config.server.allowSharedTournamentDelete = allowDeleteElement ? allowDeleteElement.checked : false;

    const autoUploadElement = document.getElementById('autoUploadTournament');
    const remoteUrlElement = document.getElementById('remoteServerUrl');
    const remoteApiKeyElement = document.getElementById('remoteServerApiKey');

    config.server.autoUpload = autoUploadElement ? autoUploadElement.checked : false;
    config.server.remoteUrl = remoteUrlElement ? remoteUrlElement.value.trim() : '';
    config.server.remoteApiKey = remoteApiKeyElement ? remoteApiKeyElement.value.trim() : '';
    // Set by a successful Test connection; locks the address and key (config-page.js)
    const remoteVerifiedElement = document.getElementById('remoteServerVerified');
    config.server.remoteVerified = !!(remoteVerifiedElement && remoteVerifiedElement.value === '1'
        && config.server.remoteUrl && config.server.remoteApiKey);
    // The remote username and password were replaced by the API key in v5.2.1
    delete config.server.remoteUsername;
    delete config.server.remotePassword;

    saveGlobalConfig();

    // Refresh tournament list if on Setup page to update delete button visibility
    if (typeof loadRecentTournaments === 'function') {
        loadRecentTournaments();
    }

    // Redraw the bracket so the finals position and the header's Console tab follow the new settings
    if (typeof renderBracket === 'function' && typeof tournament !== 'undefined' && tournament && tournament.bracket) {
        renderBracket();
    }

    if (!options.silent) alert('✓ UI settings saved successfully!');
}

// UPDATE APPLICATION TITLE
function updateApplicationTitle(title) {
    // Update page title (browser tab)
    document.title = title;

    // Update main header
    const headerElement = document.querySelector('.header h1');
    if (headerElement) {
        const logoPlaceholder = headerElement.querySelector('#clubLogo, .logo-placeholder');
        headerElement.innerHTML = '';
        if (logoPlaceholder) {
            headerElement.appendChild(logoPlaceholder);
        }
        headerElement.appendChild(document.createTextNode(title));
    }
}

// FORCE RELOAD CONFIG (for debugging)
function forceReloadConfig() {
    console.log('🔄 Force reloading configuration...');
    loadConfiguration();
    alert('Configuration reloaded from localStorage');
}

// The server connection survives a reset: the Analytics server's address and key, whether it was
// verified, and the server ID the Chalker's QR codes carry. They can still be changed by hand.
const SERVER_CONNECTION_KEYS = ['remoteUrl', 'remoteApiKey', 'remoteVerified', 'serverId'];

/**
 * The settings a reset gives: the defaults, keeping this instance's server connection.
 * @returns {object} a fresh config
 */
function defaultConfigKeepingConnection() {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    const server = (config && config.server) || {};
    SERVER_CONNECTION_KEYS.forEach(k => { if (server[k] !== undefined) fresh.server[k] = server[k]; });
    return fresh;
}

// Readable names for the reset preview, as on the Global Settings page. A setting without one
// shows its key, so a new setting is never left out of the preview.
const CONFIG_LABELS = {
    points: { _: 'Points', participation: 'Taking part', nonQualifiedParticipation: 'Taking part: also for qualifier losers', first: '1st', second: '2nd', third: '3rd', fourth: '4th',
        fifthSixth: '5th–6th', seventhEighth: '7th–8th', highOut: 'High out', ton: 'Ton', oneEighty: '180', shortLeg: 'Short leg' },
    legs: { _: 'Match length', regularRounds: 'Regular rounds (double elimination)', frontsideSemifinal: 'Frontside semifinal',
        backsideSemifinal: 'Backside semifinal', backsideFinal: 'Backside final', grandFinal: 'Grand final',
        seRegularRounds: 'Regular rounds (single elimination)', seQuarterfinal: 'Quarterfinal (single elimination)',
        seSemifinal: 'Semifinal (single elimination)', seBronze: 'Bronze final (single elimination)', seFinal: 'Final (single elimination)',
        groupMatches: 'Group matches (Round Robin)', cupRounds: 'Cup rounds (Round Robin)', cupSemifinal: 'Cup semifinal (Round Robin)',
        cupBronze: 'Cup bronze final (Round Robin)', cupFinal: 'Cup final (Round Robin)', x01Format: 'Game', maxRounds: 'Max rounds', shortLegThreshold: 'Short leg (darts)' },
    clubName: { _: 'Club name' },
    lanes: { _: 'Lanes', maxLanes: 'Lanes', excludedLanes: 'Lanes not in use', requireLaneForStart: 'Require a lane to start' },
    ui: { _: 'Interface', hiddenFormats: 'Hidden formats', offerPlate: 'Offer Play a Plate', confirmWinnerSelection: 'Confirm the winner',
        autoOpenMatchControls: 'Start on Match Controls', defaultPaid: 'New players are paid', developerMode: 'Developer Console',
        refereeSuggestionsLimit: 'Referee suggestions', bracketFinals: 'Finals position' },
    chalker: { _: 'Chalker', handover: 'Handover' },
    seeding: { _: 'Seeding', mode: 'Use seeding', seeds: 'Seeded players' },
    roundRobin: { _: 'Round Robin', structure: 'Structure', cupEntry: 'To the A cup', rematches: 'Group rematches in cup round 1', bCup: 'Play the B cup',
        maxGroup: 'Largest group' },
    server: { _: 'Server', allowSharedTournamentDelete: 'Allow deleting tournaments', autoUpload: 'Back up finished tournaments' }
};

/**
 * What a reset would change, setting by setting, walked from the defaults (so a new setting is
 * always included). The server connection is kept and not listed.
 * @returns {{section: string, label: string, from: *, to: *}[]}
 */
function configChangesOnReset() {
    const fresh = defaultConfigKeepingConnection();
    const now = config || {};
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const out = [];
    Object.keys(fresh).forEach(section => {
        const names = CONFIG_LABELS[section] || {};
        const value = fresh[section];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value).forEach(key => {
                if (section === 'server' && SERVER_CONNECTION_KEYS.includes(key)) return;
                const from = now[section] ? now[section][key] : undefined;
                if (!same(from, value[key])) out.push({ section: names._ || section, label: names[key] || key, from, to: value[key] });
            });
        } else if (!same(now[section], value)) {
            out.push({ section: names._ || section, label: names._ || section, from: now[section], to: value });
        }
    });
    return out;
}

// RESET TO DEFAULTS (for debugging)
function resetConfigToDefaults() {
    if (confirm('⚠️ Reset all settings to defaults? This cannot be undone.')) {
        config = defaultConfigKeepingConnection();
        saveGlobalConfig();
        applyConfigToUI();
        alert('✓ Configuration reset to defaults');
    }
}

// SAVE POINT CONFIGURATION
/**
 * Save point values from the Global Settings form.
 * @param {{silent?: boolean}} [options] - silent: no alerts
 * @returns {void}
 */
function savePointConfiguration(options = {}) {
    // Read values from UI
    config.points = config.points || {};
    config.points.participation = parseInt(document.getElementById('participationPoints').value) || 0;
    const nqp = document.getElementById('nonQualifiedParticipation');
    config.points.nonQualifiedParticipation = nqp ? nqp.checked : true;
    config.points.first = parseInt(document.getElementById('firstPlacePoints').value) || 0;
    config.points.second = parseInt(document.getElementById('secondPlacePoints').value) || 0;
    config.points.third = parseInt(document.getElementById('thirdPlacePoints').value) || 0;
    config.points.fourth = parseInt(document.getElementById('fourthPlacePoints').value) || 0;
    config.points.fifthSixth = parseInt(document.getElementById('fifthSixthPlacePoints').value) || 0;
    config.points.seventhEighth = parseInt(document.getElementById('seventhEighthPlacePoints').value) || 0;
    config.points.highOut = parseInt(document.getElementById('highOutPoints').value) || 0;
    config.points.ton = parseInt(document.getElementById('tonPoints').value) || 0;
    config.points.oneEighty = parseInt(document.getElementById('oneEightyPoints').value) || 0;
    config.points.shortLeg = parseInt(document.getElementById('shortLegPoints').value) || 0;

    // Save to localStorage
    saveGlobalConfig();

    // Update results table if visible
    if (typeof updateResultsTable === 'function') {
        updateResultsTable();
    }

    if (!options.silent) alert('✓ Point values saved successfully!');
}

// SAVE MATCH CONFIGURATION
/**
 * Save match lengths and Chalker settings from the Global Settings form.
 * @param {{silent?: boolean}} [options] - silent: no alerts
 * @returns {void}
 */
function saveMatchConfiguration(options = {}) {
    // Read values from UI — Double Elimination
    config.legs = config.legs || {};
    config.legs.regularRounds = parseInt(document.getElementById('regularRoundsLegs').value) || 3;
    config.legs.frontsideSemifinal = parseInt(document.getElementById('frontsideSemifinalLegs').value) || 3;
    config.legs.backsideSemifinal = parseInt(document.getElementById('backsideSemifinalLegs').value) || 3;
    config.legs.backsideFinal = parseInt(document.getElementById('backsideFinalLegs').value) || 5;
    config.legs.grandFinal = parseInt(document.getElementById('grandFinalLegs').value) || 5;

    // Read values from UI — Single Elimination
    config.legs.seRegularRounds = parseInt(document.getElementById('seRegularRoundsLegs').value) || 3;
    config.legs.seQuarterfinal = parseInt(document.getElementById('seQuarterfinalLegs').value) || 3;
    config.legs.seSemifinal = parseInt(document.getElementById('seSemifinalLegs').value) || 3;
    config.legs.seBronze = parseInt(document.getElementById('seBronzeLegs').value) || 5;
    config.legs.seFinal = parseInt(document.getElementById('seFinalLegs').value) || 5;
    config.legs.groupMatches = parseInt((document.getElementById('groupMatchesLegs') || {}).value) || 3;
    config.legs.cupRounds = parseInt((document.getElementById('cupRoundsLegs') || {}).value) || 3;
    config.legs.cupSemifinal = parseInt((document.getElementById('cupSemifinalLegs') || {}).value) || 3;
    config.legs.cupBronze = parseInt((document.getElementById('cupBronzeLegs') || {}).value) || 5;
    config.legs.cupFinal = parseInt((document.getElementById('cupFinalLegs') || {}).value) || 5;

    // Read values from UI — Chalker
    const x01Toggle = document.getElementById('chalkerX01CustomToggle');
    if (x01Toggle && x01Toggle.checked) {
        const customVal = parseInt(document.getElementById('chalkerX01Custom').value);
        config.legs.x01Format = (customVal >= 2 && customVal <= 1001) ? customVal : 501;
    } else {
        config.legs.x01Format = parseInt(document.getElementById('chalkerX01Format').value) || 501;
    }
    config.legs.maxRounds = parseInt(document.getElementById('chalkerMaxRounds').value) || 13;
    config.legs.shortLegThreshold = parseInt(document.getElementById('chalkerShortLegThreshold').value) || 21;

    const handoverEl = document.getElementById('chalkerHandover');
    if (handoverEl) {
        config.chalker = config.chalker || {};
        config.chalker.handover = handoverEl.value;
    }

    // Save to localStorage
    saveGlobalConfig();

    if (!options.silent) alert('✓ Match configuration saved successfully!');
}

/**
 * Put the default point values into the Global Settings form. Nothing is saved until
 * the page's Save changes.
 * @returns {void}
 */
function resetPointValuesToDefaults() {
    const d = DEFAULT_CONFIG.points;
    safeSetValue('participationPoints', d.participation);
    safeSetChecked('nonQualifiedParticipation', d.nonQualifiedParticipation !== false);
    safeSetValue('firstPlacePoints', d.first);
    safeSetValue('secondPlacePoints', d.second);
    safeSetValue('thirdPlacePoints', d.third);
    safeSetValue('fourthPlacePoints', d.fourth);
    safeSetValue('fifthSixthPlacePoints', d.fifthSixth);
    safeSetValue('seventhEighthPlacePoints', d.seventhEighth);
    safeSetValue('highOutPoints', d.highOut);
    safeSetValue('tonPoints', d.ton);
    safeSetValue('shortLegPoints', d.shortLeg);
    safeSetValue('oneEightyPoints', d.oneEighty);
}

/**
 * Put the default match lengths into the Global Settings form. Nothing is saved until
 * the page's Save changes.
 * @returns {void}
 */
function resetMatchConfigToDefaults() {
    const d = DEFAULT_CONFIG.legs;
    safeSetValue('regularRoundsLegs', d.regularRounds);
    safeSetValue('frontsideSemifinalLegs', d.frontsideSemifinal);
    safeSetValue('backsideSemifinalLegs', d.backsideSemifinal);
    safeSetValue('backsideFinalLegs', d.backsideFinal);
    safeSetValue('grandFinalLegs', d.grandFinal);
    safeSetValue('seRegularRoundsLegs', d.seRegularRounds);
    safeSetValue('seQuarterfinalLegs', d.seQuarterfinal);
    safeSetValue('seSemifinalLegs', d.seSemifinal);
    safeSetValue('seBronzeLegs', d.seBronze);
    safeSetValue('seFinalLegs', d.seFinal);
    safeSetValue('groupMatchesLegs', d.groupMatches);
    safeSetValue('cupRoundsLegs', d.cupRounds);
    safeSetValue('cupSemifinalLegs', d.cupSemifinal);
    safeSetValue('cupBronzeLegs', d.cupBronze);
    safeSetValue('cupFinalLegs', d.cupFinal);
}

/**
 * Save every Global Settings section in one go (the page's single Save changes).
 * Checks the form first, so nothing is saved when something is invalid.
 * @returns {{ok: boolean, error?: string, field?: string}}
 */
function saveAllSettings() {
    const clubName = (document.getElementById('applicationTitle')?.value || '').trim();
    if (!clubName) return { ok: false, error: 'Enter a club name', field: 'applicationTitle' };

    const customToggle = document.getElementById('chalkerX01CustomToggle');
    if (customToggle && customToggle.checked) {
        const v = parseInt(document.getElementById('chalkerX01Custom').value);
        if (!(v >= 2 && v <= 1001)) return { ok: false, error: 'Starting score must be 2 to 1001', field: 'chalkerX01Custom' };
    }

    saveApplicationSettings({ silent: true });
    saveLaneConfiguration({ silent: true });
    savePointConfiguration({ silent: true });
    saveMatchConfiguration({ silent: true });
    saveUIConfiguration({ silent: true });
    return { ok: true };
}

// RESULTS DISPLAY FUNCTIONS
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        updateResultsTable();
    }
}

/**
 * Paid players sorted for the results views: ranked players first (by placement
 * ascending), then unranked players alphabetically by name (case-insensitive).
 * Reads the global `players` array. Shared by updateResultsTable,
 * generateResultsJSON, and buildResultsCSVData.
 * @returns {object[]}
 */
function getSortedPaidPlayers() {
    return [...players].filter(p => p.paid).sort((a, b) => {
        if (a.placement && b.placement) return a.placement - b.placement;
        if (a.placement) return -1;
        if (b.placement) return 1;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}

function updateResultsTable(targetTbodyId = 'resultsTableBody') {
    const tbody = document.getElementById(targetTbodyId);
    if (!tbody) return;

    // Get placement data from tournament (use global tournament object, not localStorage)
    try {
        const t = tournament || {};
        const placementByPlayer = t && t.placements ? Object.fromEntries(
            Object.entries(t.placements)
                .filter(([k]) => {
                    const n = Number(k);
                    return !Number.isInteger(n) || n > 1000;
                })
                .map(([pid, place]) => [String(pid), Number(place)])
        ) : {};

        if (Array.isArray(players)) {
            players.forEach(p => {
                p.placement = placementByPlayer[String(p.id)] || null;
            });
        }
    } catch (e) {
        console.warn('Could not derive placements for players', e);
    }

    const sortedPlayers = getSortedPaidPlayers();

    // Determine which context we're in (main results or statistics modal)
    const isMainResults = (targetTbodyId === 'resultsTableBody');

    // Check if there are no paid players
    if (sortedPlayers.length === 0) {
        if (isMainResults) {
            // Main results: hide table and show empty message
            const table = document.getElementById('resultsSection');
            const emptyMessage = document.getElementById('resultsEmptyMessage');
            if (table) {
                table.style.display = 'none';
            }
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
        } else {
            // Statistics modal: show message in tbody
            tbody.innerHTML = `
                <tr>
                    <td colspan="9">No paid players yet.</td>
                </tr>
            `;
        }
        return;
    }

    // Show the table and hide the empty message (main results only)
    if (isMainResults) {
        const table = document.getElementById('resultsSection');
        const emptyMessage = document.getElementById('resultsEmptyMessage');
        if (table) {
            table.style.display = '';
        }
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
    }

    tbody.innerHTML = sortedPlayers.map(player => {
    const points = calculatePlayerPoints(player);
    const legs = calculatePlayerLegs(player.id);
    return `
        <tr onclick="openStatsModal(${player.id})" style="cursor: pointer;">
            <td class="rank">${formatRanking(player.placement)}</td>
            <td class="player-name"><div style="display: flex; justify-content: space-between; align-items: center;">${escapeHtml(player.name)}${player.stats.lollipops > 0 ? `<span>${player.stats.lollipops > 1 ? `🍭 x${player.stats.lollipops}` : '🍭'}</span>` : ''}</div></td>
            <td class="points">${points}</td>
            <td class="stat">${Array.isArray(player.stats.shortLegs) && player.stats.shortLegs.length > 0 ? player.stats.shortLegs.join(',') : '—'}</td>
            <td class="stat">${Array.isArray(player.stats.highOuts) && player.stats.highOuts.length > 0 ? player.stats.highOuts.join(',') : '—'}</td>
            <td class="stat">${player.stats.oneEighties || 0}</td>
            <td class="stat">${player.stats.tons || 0}</td>
            <td class="stat">${legs.legsWon}</td>
            <td class="stat">${legs.legsLost}</td>
        </tr>
    `;
}).join('');
}

/**
 * Calculate legs won/lost for a player from completed matches
 */
function calculatePlayerLegs(playerId) {
    let legsWon = 0;
    let legsLost = 0;
    
    matches.forEach(match => {
        // a qualifier's legs don't count (Docs/QUALIFIERS.md)
        if (match.completed && match.finalScore && match.side !== 'qualifier') {
            const { winnerLegs, loserLegs, winnerId, loserId } = match.finalScore;
            
            if (winnerId === playerId) {
                legsWon += winnerLegs;
                legsLost += loserLegs;
            } else if (loserId === playerId) {
                legsWon += loserLegs;
                legsLost += winnerLegs;
            }
        }
    });
    
    return { legsWon, legsLost };
}

/**
 * Placement → the point setting it earns. 5th-6th and 7th-8th are shared places, stored
 * as 5 and 7; 6 and 8 map the same way.
 * @type {Object<number, string>}
 */
const PLACEMENT_POINT_KEYS = {
    1: 'first', 2: 'second', 3: 'third', 4: 'fourth',
    5: 'fifthSixth', 6: 'fifthSixth', 7: 'seventhEighth', 8: 'seventhEighth'
};

/**
 * Achievement points: 180s, tons, high outs and short legs, each times its point value.
 * Part of the single points formula (see calculatePoints).
 * @param {object} stats - player stats or one match's achievements:
 *   { oneEighties, tons, highOuts: number[], shortLegs: number[] }
 * @param {object} pointValues - point values in the shape of config.points
 * @returns {number}
 */
function calculateAchievementPoints(stats, pointValues) {
    if (!stats || !pointValues) return 0;
    const n = v => Number(v) || 0;
    return n(stats.oneEighties) * n(pointValues.oneEighty)
        + n(stats.tons) * n(pointValues.ton)
        + (Array.isArray(stats.highOuts) ? stats.highOuts.length : 0) * n(pointValues.highOut)
        + (Array.isArray(stats.shortLegs) ? stats.shortLegs.length : 0) * n(pointValues.shortLeg);
}

/**
 * One player's points for one tournament: achievements + placement + participation.
 * The single place the points formula lives: the tournament Leaderboard (Registration,
 * the Leaderboard dialog, exports) and Analytics (Leaderboard, Dashboard) all use it.
 * @param {object} stats - see calculateAchievementPoints
 * @param {number|null} placement - final place (1, 2, 3, 4, 5 for 5th-6th, 7 for 7th-8th…)
 * @param {object} pointValues - point values in the shape of config.points
 * @param {{ranking?: boolean, attendance?: boolean, notQualified?: boolean}} [include] - leave out
 *   placement (ranking: false) or participation (attendance: false) points; both count by default.
 *   notQualified: the player lost a qualifier, so Taking part follows the point values'
 *   nonQualifiedParticipation (absent = on; Docs/QUALIFIERS.md)
 * @returns {number}
 */
function calculatePoints(stats, placement, pointValues, include = {}) {
    const p = pointValues || {};
    let points = calculateAchievementPoints(stats, p);
    if (include.ranking !== false && placement) points += Number(p[PLACEMENT_POINT_KEYS[placement]]) || 0;
    const takesPart = !(include.notQualified && p.nonQualifiedParticipation === false);
    if (include.attendance !== false && takesPart) points += Number(p.participation) || 0;
    return points;
}

/**
 * A player's points in the current tournament, with the point values in Global Settings.
 * @param {object} player - a player from the global players array (stats, placement)
 * @returns {number}
 */
function calculatePlayerPoints(player) {
    const notQualified = typeof Qualifiers !== 'undefined' && Qualifiers.isNotQualified(player.id);
    return calculatePoints(player.stats, player.placement, config.points, { notQualified });
}

/**
 * FORMAT RANKING DISPLAY - Convert numerical rank to display format
 */
function formatRanking(placement) {
    if (!placement) return '—';

    // Convert tied rankings to readable format
    switch (placement) {
        case 1: return '1st';
        case 2: return '2nd';
        case 3: return '3rd';
        case 4: return '4th';
        case 5: return '5th-6th';    // Tied ranking
        case 7: return '7th-8th';    // Tied ranking
        case 9: return '9th-12th';   // Tied ranking (16+ player brackets)
        case 13: return '13th-16th'; // Tied ranking (16+ player brackets)
        case 17: return '17th-24th'; // Tied ranking (32+ player brackets)
        case 25: return '25th-32nd'; // Tied ranking (32+ player brackets)
        case 33: return '33rd-48th'; // Not qualified: lost a qualifier (33-48 players)
        default:
            // For any other rankings, use ordinal format
            const suffix = getOrdinalSuffix(placement);
            return `${placement}${suffix}`;
    }
}

/**
 * GET ORDINAL SUFFIX (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(num) {
    const ones = num % 10;
    const tens = Math.floor(num / 10) % 10;

    if (tens === 1) return 'th'; // 11th, 12th, 13th

    switch (ones) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Export results as JSON with confirmation dialogs
 */
function exportResultsJSON() {
    if (!tournament || !tournament.name || !tournament.date) {
        alert('No active tournament to export');
        return;
    }

    // Check if tournament has final rankings
    const hasFinalisedRankings = tournament.placements && 
        Object.keys(tournament.placements).length > 0 &&
        players.some(p => p.placement);

    // Generate filename
    const filename = `${tournament.name}_${tournament.date}_Results.json`;
    
    // Show export confirmation modal
    showExportConfirmModal('JSON', filename, hasFinalisedRankings);
}

/**
 * Generate JSON content from current results
 */
function generateResultsJSON() {
    // Get sorted players (same logic as updateResultsTable)
    const sortedPlayers = getSortedPaidPlayers();

    // Get completed matches for match results section
    const completedMatches = matches ? matches
        .filter(match => match.completed)
        .sort((a, b) => {
            // Sort by completion timestamp if available, otherwise by match ID
            const aTime = a.completedAt || 0;
            const bTime = b.completedAt || 0;
            return bTime - aTime; // Latest first
        })
        .map(match => {
            const isWalkover = match.autoAdvanced || isWalkoverMatch(match);

            // Get referee name if referee ID exists
            const refereeName = match.referee ?
                (players.find(p => p.id === match.referee)?.name || 'Unknown') :
                null;

            return {
                matchId: match.id,
                player1: {
                    name: match.player1?.name || 'Unknown',
                    id: match.player1?.id || null
                },
                player2: {
                    name: match.player2?.name || 'Unknown',
                    id: match.player2?.id || null
                },
                winner: {
                    name: match.winner?.name || 'Unknown',
                    id: match.winner?.id || null
                },
                finalScore: match.finalScore || null,
                completedAt: match.completedAt || null,
                isWalkover: isWalkover,
                autoCompleted: match.autoAdvanced || false,
                lane: match.lane || null,
                referee: match.referee ? {
                    id: match.referee,
                    name: refereeName
                } : null
            };
        }) : [];

    // Build JSON structure
    const jsonData = {
        tournament: {
            name: tournament.name,
            date: tournament.date,
            exported: new Date().toISOString(),
            status: tournament.status || 'completed',
            bracketSize: tournament.bracketSize || sortedPlayers.length
        },
        players: sortedPlayers.map(player => {
            const points = calculatePlayerPoints(player);
            const legs = calculatePlayerLegs(player.id);

            return {
                rank: player.placement || 0,
                rankDisplay: formatRanking(player.placement),
                name: player.name,
                points: points,
                shortLegs: Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs : [],
                highOuts: player.stats.highOuts || [],
                oneEighties: player.stats.oneEighties || 0,
                tons: player.stats.tons || 0,
                legsWon: legs.legsWon,
                legsLost: legs.legsLost
            };
        }),
        matchResults: completedMatches
    };

    return JSON.stringify(jsonData, null, 2);
}

/**
 * Export results table as CSV with confirmation dialogs
 */
function exportResultsCSV() {
    if (!tournament || !tournament.name || !tournament.date) {
        alert('No active tournament to export');
        return;
    }

    // Check if tournament has final rankings (same logic used for placement display)
    const hasFinalisedRankings = tournament.placements && 
        Object.keys(tournament.placements).length > 0 &&
        players.some(p => p.placement);

    // Generate filename
    const filename = `${tournament.name}_${tournament.date}_Results.csv`;
    
    // Show export confirmation modal
    showExportConfirmModal('CSV', filename, hasFinalisedRankings);
}

/**
 * Generate CSV content from current results table
 */
/**
 * Build results CSV data for the active tournament.
 * @returns {{ metadata: string[], headers: string[], rows: Array<Array> }}
 */
function buildResultsCSVData() {
    const metadata = [
        'Tournament: ' + tournament.name,
        'Date: ' + tournament.date
    ];

    const headers = ['Rank', 'Player', 'Points', 'Short Legs', 'High Outs', '180s', 'Tons', 'Legs Won', 'Legs Lost'];

    // Get sorted players (same logic as updateResultsTable)
    const sortedPlayers = getSortedPaidPlayers();

    const rows = sortedPlayers.map(player => {
        const points = calculatePlayerPoints(player);
        const legs = calculatePlayerLegs(player.id);
        const rank = formatRankingForCSV(player.placement);
        const shortLegs = Array.isArray(player.stats.shortLegs) && player.stats.shortLegs.length > 0
            ? player.stats.shortLegs.join(';')
            : '0';
        const highOuts = (player.stats.highOuts || []).length > 0
            ? player.stats.highOuts.join(';')
            : '0';
        const oneEighties = player.stats.oneEighties || 0;
        const tons = player.stats.tons || 0;

        return [rank, player.name, points, shortLegs, highOuts, oneEighties, tons, legs.legsWon, legs.legsLost];
    });

    return { metadata, headers, rows };
}

/**
 * Format ranking for CSV export (remove ordinals, convert ties)
 */
function formatRankingForCSV(placement) {
    if (!placement) return '0';

    // Convert rankings for CSV
    switch (placement) {
        case 1: return '1st';
        case 2: return '2nd';
        case 3: return '3rd';
        case 4: return '4th';
        case 5: return '5th-6th';    // 5th-6th place
        case 7: return '7th-8th';    // 7th-8th place
        case 9: return '9th-12th';   // 9th-12th place
        case 13: return '13th-16th'; // 13th-16th place
        case 17: return '17th-24th'; // 17th-24th place
        case 25: return '25th-32nd'; // 25th-32nd place
        case 33: return '33rd-48th'; // not qualified (lost a qualifier)
        default: return String(placement);
    }
}

// INITIALIZATION - Load config immediately when file loads
console.log('🚀 Initializing bulletproof config system...');
loadConfiguration();

/**
 * Show export confirmation modal with tournament and export details
 */
function showExportConfirmModal(format, filename, hasFinalisedRankings) {
    // Store export details for later use
    window.pendingExport = { format, filename, hasFinalisedRankings };

    // Populate sidebar
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;
    document.getElementById('exportTournamentName').textContent = tournament.name;
    document.getElementById('exportTournamentDate').textContent = tournament.date;
    document.getElementById('exportTournamentStatus').textContent = tournamentStatusLabel(tournament);
    document.getElementById('exportMatchProgress').textContent = `${completedMatches} of ${totalMatches}`;
    document.getElementById('exportPlayerCount').textContent = players.length;

    // Populate format + filename in the description
    document.getElementById('exportFormat').textContent = format;
    document.getElementById('exportFilename').textContent = filename;

    // Toggle the incomplete pill + warning paragraph together
    const pill = document.getElementById('exportIncompletePill');
    const warning = document.getElementById('exportIncompleteWarning');
    const showWarning = !hasFinalisedRankings;
    pill.style.display = showWarning ? '' : 'none';
    warning.style.display = showWarning ? '' : 'none';

    // Show modal with Esc support
    pushDialog('exportConfirmModal', null, true);
}

function confirmExport() {
    const exportDetails = window.pendingExport;

    if (!exportDetails) {
        alert('Export details not found.');
        popDialog();
        return;
    }

    // Close modal first
    popDialog();

    // Perform the actual export
    executeExport(exportDetails.format, exportDetails.filename);
}

function executeExport(format, filename) {
    if (format === 'JSON') {
        const content = generateResultsJSON();
        NewtonCSV.downloadFile(content, filename, 'application/json;charset=utf-8;');
    } else {
        const data = buildResultsCSVData();
        NewtonCSV.exportCSV({
            filename: filename,
            headers: data.headers,
            rows: data.rows,
            metadata: data.metadata
        });
    }
    console.log('Results exported as ' + format + ': ' + filename);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.loadConfiguration = loadConfiguration;
    window.saveApplicationSettings = saveApplicationSettings;
    window.saveLaneConfiguration = saveLaneConfiguration;
    window.saveUIConfiguration = saveUIConfiguration;
    window.updateApplicationTitle = updateApplicationTitle;
    window.displayResults = displayResults;
    window.updateResultsTable = updateResultsTable;
    window.calculatePlayerPoints = calculatePlayerPoints;
    window.calculatePoints = calculatePoints;
    window.calculateAchievementPoints = calculateAchievementPoints;
    window.formatRanking = formatRanking;
    window.getOrdinalSuffix = getOrdinalSuffix;
    window.exportResultsCSV = exportResultsCSV;
    window.formatRankingForCSV = formatRankingForCSV;
    window.exportResultsJSON = exportResultsJSON;
    window.generateResultsJSON = generateResultsJSON;

    // Debug functions
    window.forceReloadConfig = forceReloadConfig;
    window.resetConfigToDefaults = resetConfigToDefaults;

    // Reset to defaults functions
    window.resetPointValuesToDefaults = resetPointValuesToDefaults;
    window.resetMatchConfigToDefaults = resetMatchConfigToDefaults;
    window.saveAllSettings = saveAllSettings;

    // Export modal functions
    window.showExportConfirmModal = showExportConfirmModal;
    window.confirmExport = confirmExport;
}
