// results-config.js - Bulletproof Global Configuration System
// All Config page settings are GLOBAL and PERSISTENT

// GLOBAL CONFIG - Single Source of Truth
const DEFAULT_CONFIG = {
    points: {
        participation: 1,
        first: 3,
        second: 2,
        third: 1,
        highOut: 1,
        ton: 0,
        oneEighty: 1,
        shortLeg: 1
    },
    legs: {
        regularRounds: 3,
        semifinal: 3,
        backsideFinal: 5,
        grandFinal: 5
    },
    applicationTitle: "NewTon DC - Tournament Manager",
    lanes: {
        maxLanes: 4,
        requireLaneForStart: false
    },
    ui: {
        confirmWinnerSelection: true
    }
};

// BULLETPROOF CONFIG LOADING
function loadConfiguration() {
    console.log('🔧 Loading global configuration...');

    try {
        const savedConfig = localStorage.getItem('dartsConfig');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);

            // Merge with defaults to handle new config options
            config = mergeWithDefaults(parsed, DEFAULT_CONFIG);
            console.log('✓ Loaded saved global config');
        } else {
            // Use defaults for first-time users
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            saveGlobalConfig();
            console.log('✓ Initialized default global config');
        }

        // Apply config to UI elements
        applyConfigToUI();

    } catch (error) {
        console.error('❌ Error loading config, using defaults:', error);
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        saveGlobalConfig();
        applyConfigToUI();
    }
}

// MERGE CONFIG WITH DEFAULTS (handles new config options)
function mergeWithDefaults(userConfig, defaults) {
    const merged = JSON.parse(JSON.stringify(defaults));

    // Deep merge user config over defaults
    Object.keys(userConfig).forEach(key => {
        if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
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
    safeSetValue('firstPlacePoints', config.points.first);
    safeSetValue('secondPlacePoints', config.points.second);
    safeSetValue('thirdPlacePoints', config.points.third);
    safeSetValue('highOutPoints', config.points.highOut);
    safeSetValue('tonPoints', config.points.ton);
    safeSetValue('shortLegPoints', config.points.shortLeg);
    safeSetValue('oneEightyPoints', config.points.oneEighty);

    // Match leg configuration
    safeSetValue('regularRoundsLegs', config.legs.regularRounds);
    safeSetValue('semiFinalsLegs', config.legs.semifinal);
    safeSetValue('backsideFinalLegs', config.legs.backsideFinal);
    safeSetValue('grandFinalLegs', config.legs.grandFinal);

    // Application title
    if (config.applicationTitle) {
        safeSetValue('applicationTitle', config.applicationTitle);
        updateApplicationTitle(config.applicationTitle);
    }

    // Lane configuration
    if (config.lanes) {
        safeSetValue('maxLanes', config.lanes.maxLanes);
        safeSetChecked('requireLaneForStart', config.lanes.requireLaneForStart);
    }

    // UI configuration
    if (config.ui) {
        safeSetChecked('confirmWinnerSelection', config.ui.confirmWinnerSelection);
    }

    console.log('✓ Config applied to UI');
}

// SAFE UI ELEMENT SETTERS (won't crash if element doesn't exist)
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

// SAVE GLOBAL CONFIG - Always immediate
function saveGlobalConfig() {
    try {
        localStorage.setItem('dartsConfig', JSON.stringify(config));
        console.log('✓ Global config saved to localStorage');
    } catch (error) {
        console.error('❌ Failed to save global config:', error);
    }
}

// BULLETPROOF CONFIG SAVE - All Config page settings
function saveConfiguration() {
    console.log('💾 Saving all configuration...');

    try {
        // Points configuration
        config.points.participation = parseInt(document.getElementById('participationPoints').value) || 1;
        config.points.first = parseInt(document.getElementById('firstPlacePoints').value) || 3;
        config.points.second = parseInt(document.getElementById('secondPlacePoints').value) || 2;
        config.points.third = parseInt(document.getElementById('thirdPlacePoints').value) || 1;
        config.points.highOut = parseInt(document.getElementById('highOutPoints').value) || 1;
        config.points.ton = parseInt(document.getElementById('tonPoints').value) || 0;
        config.points.shortLeg = parseInt(document.getElementById('shortLegPoints').value) || 1;
        config.points.oneEighty = parseInt(document.getElementById('oneEightyPoints').value) || 1;

        // Match legs configuration
        config.legs.regularRounds = parseInt(document.getElementById('regularRoundsLegs').value) || 3;
        config.legs.semifinal = parseInt(document.getElementById('semiFinalsLegs').value) || 3;
        config.legs.backsideFinal = parseInt(document.getElementById('backsideFinalLegs').value) || 5;
        config.legs.grandFinal = parseInt(document.getElementById('grandFinalLegs').value) || 5;

        saveGlobalConfig();
        alert('✓ Configuration saved successfully!');

    } catch (error) {
        console.error('❌ Error saving configuration:', error);
        alert('❌ Error saving configuration. Please check the console.');
    }
}

// APPLICATION SETTINGS
function saveApplicationSettings() {
    const titleElement = document.getElementById('applicationTitle');
    const newTitle = titleElement ? titleElement.value.trim() : '';

    if (!newTitle) {
        alert('Application title cannot be empty');
        return;
    }

    config.applicationTitle = newTitle;
    updateApplicationTitle(newTitle);

    saveGlobalConfig();
    alert('✓ Application settings saved successfully!');
}

// LANE CONFIGURATION
function saveLaneConfiguration() {
    const maxLanesElement = document.getElementById('maxLanes');
    const requireLaneElement = document.getElementById('requireLaneForStart');

    if (!maxLanesElement) {
        alert('Max lanes element not found');
        return;
    }

    config.lanes = config.lanes || {};
    config.lanes.maxLanes = parseInt(maxLanesElement.value) || 4;
    config.lanes.requireLaneForStart = requireLaneElement ? requireLaneElement.checked : false;

    saveGlobalConfig();

    // Refresh lane dropdowns if available
    if (typeof refreshAllLaneDropdowns === 'function') {
        setTimeout(refreshAllLaneDropdowns, 100);
    }

    alert('✓ Lane settings saved successfully!');
}

// UI CONFIGURATION
function saveUIConfiguration() {
    const confirmWinnerElement = document.getElementById('confirmWinnerSelection');

    config.ui = config.ui || {};
    config.ui.confirmWinnerSelection = confirmWinnerElement ? confirmWinnerElement.checked : true;

    saveGlobalConfig();
    alert('✓ UI settings saved successfully!');
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

// RESET TO DEFAULTS (for debugging)
function resetConfigToDefaults() {
    if (confirm('⚠️ Reset all settings to defaults? This cannot be undone.')) {
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        saveGlobalConfig();
        applyConfigToUI();
        alert('✓ Configuration reset to defaults');
    }
}

// RESULTS DISPLAY FUNCTIONS
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        updateResultsTable();
    }
}

function updateResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    // Get placement data from tournament
    try {
        const t = JSON.parse(localStorage.getItem('currentTournament') || '{}');
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

    const sortedPlayers = [...players].filter(p => p.paid).sort((a, b) => {
        // First sort by placement (rank)
        if (a.placement && b.placement) {
            return a.placement - b.placement;
        }
        if (a.placement) return -1;
        if (b.placement) return 1;

        // Then sort alphabetically by name (case-insensitive)
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return nameA.localeCompare(nameB);
    });

    // Check if there are no paid players
    if (sortedPlayers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                    No players added yet
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = sortedPlayers.map(player => {
        const points = calculatePlayerPoints(player);
        return `
            <tr>
                <td>${formatRanking(player.placement)}</td>
                <td><span class="clickable-player-name" onclick="openStatsModal(${player.id})">${player.name}</span></td>
                <td>${points}</td>
                <td>${Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs.join(',') : '—'}</td>
                <td>${(player.stats.highOuts || []).join(',') || '—'}</td>
                <td>${player.stats.oneEighties || 0}</td>
                <td>${player.stats.tons || 0}</td>
            </tr>
        `;
    }).join('');
}

function calculatePlayerPoints(player) {
    let points = 0;

    // Use GLOBAL config for point calculation
    points += config.points.participation;


    // Placement points based on ranking
    if (player.placement === 1) {
        points += config.points.first;
    } else if (player.placement === 2) {
        points += config.points.second;
    } else if (player.placement === 3) {
        points += config.points.third;
    } else if (player.placement === 4) {
        points += config.points.fourth || 0;
    } else if (player.placement === 5) {
        points += config.points.fifthSixth || 0;
    } else if (player.placement === 7) {
        points += config.points.seventhEighth || 0;
    }

    const shortLegsCount = Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs.length : 0;
    points += shortLegsCount * (config.points.shortLeg || 0);
    points += (player.stats.highOuts || []).length * config.points.highOut;
    points += (player.stats.tons || 0) * config.points.ton;
    points += (player.stats.oneEighties || 0) * config.points.oneEighty;

    return points;
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
    
    // Show appropriate confirmation dialog
    let confirmMessage;
    if (hasFinalisedRankings) {
        confirmMessage = `Save results to "${filename}"?`;
    } else {
        confirmMessage = `Tournament incomplete, export to "${filename}" anyway?.`;
    }

    if (!confirm(confirmMessage)) {
        return; // User cancelled
    }

    // Generate CSV content
    const csvContent = generateResultsCSV();
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✓ Results exported: ${filename}`);
}

/**
 * Generate CSV content from current results table
 */
function generateResultsCSV() {
    // Tournament metadata rows
    const tournamentInfo = [
        [`Tournament: ${tournament.name}`],
        [`Date: ${tournament.date}`],
        [''] // Empty row for spacing
    ];

    // CSV Headers
    const headers = ['Rank', 'Player', 'Points', 'Short Legs', 'High Outs', '180s', 'Tons'];
    
    // Get sorted players (same logic as updateResultsTable)
    const sortedPlayers = [...players].filter(p => p.paid).sort((a, b) => {
        if (a.placement && b.placement) {
            return a.placement - b.placement;
        }
        if (a.placement) return -1;
        if (b.placement) return 1;

        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return nameA.localeCompare(nameB);
    });

    // Generate CSV rows
    const rows = sortedPlayers.map(player => {
        const points = calculatePlayerPoints(player);
        
        // Format ranking (remove ordinal suffixes, convert ties)
        let rank = formatRankingForCSV(player.placement);
        
        // Format short legs (semicolon-separated)
        const shortLegs = Array.isArray(player.stats.shortLegs) && player.stats.shortLegs.length > 0 
            ? player.stats.shortLegs.join(';') 
            : '0';
        
        // Format high outs (semicolon-separated)
        const highOuts = (player.stats.highOuts || []).length > 0 
            ? player.stats.highOuts.join(';') 
            : '0';
        
        const oneEighties = player.stats.oneEighties || 0;
        const tons = player.stats.tons || 0;
        
        return [rank, player.name, points, shortLegs, highOuts, oneEighties, tons];
    });

    // Convert to CSV format
    const csvRows = [...tournamentInfo, headers, ...rows];
    return csvRows.map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

/**
 * Format ranking for CSV export (remove ordinals, convert ties)
 */
function formatRankingForCSV(placement) {
    if (!placement) return '0';

    // Convert tied rankings to number ranges
    switch (placement) {
        case 1: return '1';
        case 2: return '2';
        case 3: return '3';
        case 4: return '4';
        case 5: return '5-6';    // 5th-6th place
        case 7: return '7-8';    // 7th-8th place
        case 9: return '9-12';   // 9th-12th place
        case 13: return '13-16'; // 13th-16th place
        case 17: return '17-24'; // 17th-24th place
        case 25: return '25-32'; // 25th-32nd place
        default: return String(placement);
    }
}

// INITIALIZATION - Load config immediately when file loads
console.log('🚀 Initializing bulletproof config system...');
loadConfiguration();

// Make functions globally available
if (typeof window !== 'undefined') {
    window.loadConfiguration = loadConfiguration;
    window.saveConfiguration = saveConfiguration;
    window.saveApplicationSettings = saveApplicationSettings;
    window.saveLaneConfiguration = saveLaneConfiguration;
    window.saveUIConfiguration = saveUIConfiguration;
    window.updateApplicationTitle = updateApplicationTitle;
    window.displayResults = displayResults;
    window.updateResultsTable = updateResultsTable;
    window.calculatePlayerPoints = calculatePlayerPoints;
    window.formatRanking = formatRanking;
    window.getOrdinalSuffix = getOrdinalSuffix;
    window.exportResultsCSV = exportResultsCSV;
    window.generateResultsCSV = generateResultsCSV;
    window.formatRankingForCSV = formatRankingForCSV;

    // Debug functions
    window.forceReloadConfig = forceReloadConfig;
    window.resetConfigToDefaults = resetConfigToDefaults;
}
