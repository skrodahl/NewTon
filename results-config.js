// results-config.js - Bulletproof Global Configuration System
// All Config page settings are GLOBAL and PERSISTENT

// GLOBAL CONFIG - Single Source of Truth
const DEFAULT_CONFIG = {
    points: {
        participation: 5,
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
        grandFinal: 5
    },
    applicationTitle: "NewTon DC - Tournament Manager",
    lanes: {
        maxLanes: 4,
        excludedLanes: [],
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

    // Match leg configuration
    safeSetValue('regularRoundsLegs', config.legs.regularRounds);
    safeSetValue('frontsideSemifinalLegs', config.legs.frontsideSemifinal);
    safeSetValue('backsideSemifinalLegs', config.legs.backsideSemifinal);
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

        // Set excluded lanes as comma-separated string
        if (config.lanes.excludedLanes && Array.isArray(config.lanes.excludedLanes)) {
            safeSetValue('excludedLanes', config.lanes.excludedLanes.join(','));
        }
    }

    // UI configuration
    if (config.ui) {
        safeSetChecked('confirmWinnerSelection', config.ui.confirmWinnerSelection);
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

// SAVE GLOBAL CONFIG
function saveGlobalConfig() {
    try {
        localStorage.setItem('dartsConfig', JSON.stringify(config));
        console.log('✓ Global config saved to localStorage');
    } catch (error) {
        console.error('❌ Failed to save global config:', error);
    }
}

// SAVE CONFIGURATION FROM UI
function saveConfiguration() {
    console.log('💾 Saving all configuration...');

    try {
        // Points configuration
        config.points.participation = parseInt(document.getElementById('participationPoints').value) || 0;
        config.points.first = parseInt(document.getElementById('firstPlacePoints').value) || 0;
        config.points.second = parseInt(document.getElementById('secondPlacePoints').value) || 0;
        config.points.third = parseInt(document.getElementById('thirdPlacePoints').value) || 0;
        config.points.fourth = parseInt(document.getElementById('fourthPlacePoints').value) || 0;
        config.points.fifthSixth = parseInt(document.getElementById('fifthSixthPlacePoints').value) || 0;
        config.points.seventhEighth = parseInt(document.getElementById('seventhEighthPlacePoints').value) || 0;
        config.points.highOut = parseInt(document.getElementById('highOutPoints').value) || 0;
        config.points.ton = parseInt(document.getElementById('tonPoints').value) || 0;
        config.points.shortLeg = parseInt(document.getElementById('shortLegPoints').value) || 0;
        config.points.oneEighty = parseInt(document.getElementById('oneEightyPoints').value) || 0;

        // Match legs configuration
        config.legs.regularRounds = parseInt(document.getElementById('regularRoundsLegs').value) || 3;
        config.legs.frontsideSemifinal = parseInt(document.getElementById('frontsideSemifinalLegs').value) || 3;
        config.legs.backsideSemifinal = parseInt(document.getElementById('backsideSemifinalLegs').value) || 3;
        config.legs.backsideFinal = parseInt(document.getElementById('backsideFinalLegs').value) || 3;
        config.legs.grandFinal = parseInt(document.getElementById('grandFinalLegs').value) || 3;

        saveGlobalConfig();
        alert('✓ Configuration saved successfully!');

    } catch (error) {
        console.error('❌ Error saving configuration:', error);
        alert('❌ Error saving configuration. Please check the console.');
    }
}

// ... (The rest of the functions remain the same as the original file)

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
function saveLaneConfiguration() {
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
        alert(`Warning: Some excluded lanes (${invalidLanes.join(', ')}) are above the maximum lane number (${maxLanes}) and will be ignored.`);
    }

    config.lanes = config.lanes || {};
    config.lanes.maxLanes = maxLanes;
    config.lanes.excludedLanes = validExcludedLanes;
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
    const legs = calculatePlayerLegs(player.id);
    return `
        <tr onclick="openStatsModal(${player.id})" style="cursor: pointer;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor=''">
            <td>${formatRanking(player.placement)}</td>
            <td style="font-weight: 500;">${player.name}</td>
            <td>${points}</td>
            <td>${Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs.join(',') : '—'}</td>
            <td>${(player.stats.highOuts || []).join(',') || '—'}</td>
            <td>${player.stats.oneEighties || 0}</td>
            <td>${player.stats.tons || 0}</td>
            <td>${legs.legsWon}</td>
            <td>${legs.legsLost}</td>
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
        if (match.completed && match.finalScore) {
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
function generateResultsCSV() {
    // Tournament metadata rows
    const tournamentInfo = [
        [`Tournament: ${tournament.name}`],
        [`Date: ${tournament.date}`],
        [''] // Empty row for spacing
    ];

    // CSV Headers
    const headers = ['Rank', 'Player', 'Points', 'Short Legs', 'High Outs', '180s', 'Tons', 'Legs Won', 'Legs Lost'];
    
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
        const legs = calculatePlayerLegs(player.id);
        
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
        
        return [rank, player.name, points, shortLegs, highOuts, oneEighties, tons, legs.legsWon, legs.legsLost];
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
    window.pendingExport = {
        format: format,
        filename: filename,
        hasFinalisedRankings: hasFinalisedRankings
    };

    // Populate tournament details
    document.getElementById('exportTournamentName').textContent = tournament.name;
    document.getElementById('exportTournamentDate').textContent = tournament.date;

    // Calculate tournament status
    const completedMatches = matches.filter(m => m.completed).length;
    const totalMatches = matches.length;
    const status = hasFinalisedRankings ? 'Complete' : 'In Progress';

    document.getElementById('exportTournamentStatus').textContent = status;
    document.getElementById('exportPlayerCount').textContent = `${players.length} registered`;
    document.getElementById('exportMatchProgress').textContent = `${completedMatches}/${totalMatches} matches`;

    // Populate export details
    document.getElementById('exportFormat').textContent = format;
    document.getElementById('exportFilename').textContent = filename;

    const contentDescription = format === 'JSON'
        ? 'Complete tournament data with match results and statistics'
        : 'Results table with rankings, points, and player statistics';
    document.getElementById('exportContent').textContent = contentDescription;

    // Show/hide status sections
    const warningSection = document.getElementById('exportWarningSection');
    const completeSection = document.getElementById('exportCompleteSection');

    if (hasFinalisedRankings) {
        warningSection.style.display = 'none';
        completeSection.style.display = 'block';
    } else {
        warningSection.style.display = 'block';
        completeSection.style.display = 'none';
    }

    // Populate what will be included list
    const includesList = document.getElementById('exportIncludesList');
    const items = format === 'JSON' ? [
        'Complete tournament configuration',
        'All player information and statistics',
        'Complete match history and results',
        'Bracket structure and progression',
        'Current rankings and placements'
    ] : [
        'Final rankings and positions',
        'Player names and statistics',
        'Points breakdown (placement, participation, achievements)',
        'Tournament totals and summary'
    ];

    includesList.innerHTML = items.map(item => `<li>${item}</li>`).join('');

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
    let content, mimeType;

    if (format === 'JSON') {
        content = generateResultsJSON();
        mimeType = 'application/json;charset=utf-8;';
    } else {
        content = generateResultsCSV();
        mimeType = 'text/csv;charset=utf-8;';
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log(`✓ Results exported as ${format}: ${filename}`);
}

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
    window.exportResultsJSON = exportResultsJSON;
    window.generateResultsJSON = generateResultsJSON;

    // Debug functions
    window.forceReloadConfig = forceReloadConfig;
    window.resetConfigToDefaults = resetConfigToDefaults;

    // Export modal functions
    window.showExportConfirmModal = showExportConfirmModal;
    window.confirmExport = confirmExport;
}
