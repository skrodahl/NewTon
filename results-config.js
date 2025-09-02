// results-config.js - Results Display and Configuration

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

    // Populate per-player placement from tournament.placements (playerId -> placement)
    try {
        const t = JSON.parse(localStorage.getItem('currentTournament') || '{}');
        const placementByPlayer = t && t.placements ? Object.fromEntries(
        Object.entries(t.placements)
        // Ignore legacy placement->playerId numeric keys like "1","2"
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

    tbody.innerHTML = sortedPlayers.map(player => {
    const points = calculatePlayerPoints(player);
    return `
    <tr>
    <td>${player.placement || '—'}</td>
    <td><span class="clickable-player-name" onclick="openStatsModal(${player.id})">${player.name}</span></td>
    <td>${points}</td>
    <td>${Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs.join(',') : '—'}</td>
    <td>${(player.stats.highOuts || []).join(',') || '—'}</td>
    <td>${player.stats.tons || 0}</td>
    <td>${player.stats.oneEighties || 0}</td>
    </tr>
    `;
    }).join('');
}

function calculatePlayerPoints(player) {
    let points = 0;

    points += config.points.participation;

    if (player.placement === 1) {
    points += config.points.first;
    } else if (player.placement === 2) {
    points += config.points.second;
    } else if (player.placement === 3) {
    points += config.points.third;
    }

    const shortLegsCount = Array.isArray(player.stats.shortLegs) ? player.stats.shortLegs.length : 0;
    points += shortLegsCount * (config.points.shortLeg || 0);
    points += (player.stats.highOuts || []).length * config.points.highOut;
    points += (player.stats.tons || 0) * config.points.ton;
    points += (player.stats.oneEighties || 0) * config.points.oneEighty;

    return points;
}

function loadConfiguration() {
    const savedConfig = localStorage.getItem('dartsConfig');
    if (savedConfig) {
    config = JSON.parse(savedConfig);

    // Load point configuration
    const participationEl = document.getElementById('participationPoints');
    if (participationEl) participationEl.value = config.points.participation;
    
    const firstPlaceEl = document.getElementById('firstPlacePoints');
    if (firstPlaceEl) firstPlaceEl.value = config.points.first;
    
    const secondPlaceEl = document.getElementById('secondPlacePoints');
    if (secondPlaceEl) secondPlaceEl.value = config.points.second;
    
    const thirdPlaceEl = document.getElementById('thirdPlacePoints');
    if (thirdPlaceEl) thirdPlaceEl.value = config.points.third;
    
    const highOutEl = document.getElementById('highOutPoints');
    if (highOutEl) highOutEl.value = config.points.highOut;
    
    const tonEl = document.getElementById('tonPoints');
    if (tonEl) tonEl.value = config.points.ton;

    const shortLegEl = document.getElementById('shortLegPoints');
    if (shortLegEl) shortLegEl.value = config.points.shortLeg;
    
    const oneEightyEl = document.getElementById('oneEightyPoints');
    if (oneEightyEl) oneEightyEl.value = config.points.oneEighty;

    const regularRoundsLegsEl = document.getElementById('regularRoundsLegs');
    if (regularRoundsLegsEl) regularRoundsLegsEl.value = config.legs.regularRounds;

    const semifinalLegsEl = document.getElementById('semiFinalsLegs');
    if (semifinalLegsEl) semifinalLegsEl.value = config.legs.semifinal;

    const backsideFinalLegsEl = document.getElementById('backsideFinalLegs');
    if (backsideFinalLegsEl) backsideFinalLegsEl.value = config.legs.backsideFinal;

    const grandFinalLegsEl = document.getElementById('grandFinalLegs');
    if (grandFinalLegsEl) grandFinalLegsEl.value = config.legs.grandFinal;

    // Load application title
    if (config.applicationTitle) {
    const appTitleEl = document.getElementById('applicationTitle');
    if (appTitleEl) appTitleEl.value = config.applicationTitle;
    updateApplicationTitle(config.applicationTitle);
    }
    
    // Load lane configuration (with null checks)
    if (config.lanes) {
    const maxLanesEl = document.getElementById('maxLanes');
    if (maxLanesEl) maxLanesEl.value = config.lanes.maxLanes || 10;
    
    const requireLaneEl = document.getElementById('requireLaneForStart');
    if (requireLaneEl) requireLaneEl.checked = config.lanes.requireLaneForStart || false;
    }

    // Load UI configuration (with null checks)
    if (config.ui) {
        const confirmWinnerEl = document.getElementById('confirmWinnerSelection');
        if (confirmWinnerEl) confirmWinnerEl.checked = config.ui.confirmWinnerSelection !== false; // Default to true
    }
    }
}

//function saveConfiguration() {
//    config.points.participation = parseInt(document.getElementById('participationPoints').value);
//    config.points.first = parseInt(document.getElementById('firstPlacePoints').value);
//    config.points.second = parseInt(document.getElementById('secondPlacePoints').value);
//    config.points.third = parseInt(document.getElementById('thirdPlacePoints').value);
//    config.points.highOut = parseInt(document.getElementById('highOutPoints').value);
//    config.points.ton = parseInt(document.getElementById('tonPoints').value);
//    config.points.shortLeg = parseInt(document.getElementById('shortLegPoints').value);
//    config.points.oneEighty = parseInt(document.getElementById('oneEightyPoints').value);
//
//    config.legs.regularRounds = parseInt(document.getElementById('regularRoundsLegs').value);
//    config.legs.semifinal = parseInt(document.getElementById('semiFinalsLegs').value);
//    config.legs.backsideFinal = parseInt(document.getElementById('backsideFinalLegs').value);
//    config.legs.grandFinal = parseInt(document.getElementById('grandFinalLegs').value);
//
//    localStorage.setItem('dartsConfig', JSON.stringify(config));
//    alert('Configuration saved successfully!');
//}

function saveConfiguration() {
    // Debug each element to find which one is null
    const elements = {
        'participationPoints': document.getElementById('participationPoints'),
        'firstPlacePoints': document.getElementById('firstPlacePoints'),
        'secondPlacePoints': document.getElementById('secondPlacePoints'),
        'thirdPlacePoints': document.getElementById('thirdPlacePoints'),
        'highOutPoints': document.getElementById('highOutPoints'),
        'tonPoints': document.getElementById('tonPoints'),
        'shortLegPoints': document.getElementById('shortLegPoints'),
        'oneEightyPoints': document.getElementById('oneEightyPoints'),
        'regularRoundsLegs': document.getElementById('regularRoundsLegs'),
        'semiFinalsLegs': document.getElementById('semiFinalsLegs'),
        'backsideFinalLegs': document.getElementById('backsideFinalLegs'),
        'grandFinalLegs': document.getElementById('grandFinalLegs')
    };
    
    // Check which elements are null
    for (const [id, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element with id '${id}' not found!`);
            alert(`Element with id '${id}' not found!`);
            return;
        }
    }
    
    // If we get here, all elements exist
    config.points.participation = parseInt(elements.participationPoints.value);
    config.points.first = parseInt(elements.firstPlacePoints.value);
    config.points.second = parseInt(elements.secondPlacePoints.value);
    config.points.third = parseInt(elements.thirdPlacePoints.value);
    config.points.highOut = parseInt(elements.highOutPoints.value);
    config.points.ton = parseInt(elements.tonPoints.value);
    config.points.shortLeg = parseInt(elements.shortLegPoints.value);
    config.points.oneEighty = parseInt(elements.oneEightyPoints.value);
    
    config.legs.regularRounds = parseInt(elements.regularRoundsLegs.value);
    config.legs.semifinal = parseInt(elements.semiFinalsLegs.value);
    config.legs.backsideFinal = parseInt(elements.backsideFinalLegs.value);
    config.legs.grandFinal = parseInt(elements.grandFinalLegs.value);

    localStorage.setItem('dartsConfig', JSON.stringify(config));
    alert('Configuration saved successfully!');
}

function saveApplicationSettings() {
    const newTitle = document.getElementById('applicationTitle').value.trim();
    
    if (!newTitle) {
    alert('Application title cannot be empty');
    return;
    }

    config.applicationTitle = newTitle;
    updateApplicationTitle(newTitle);
    
    localStorage.setItem('dartsConfig', JSON.stringify(config));
    alert('Application settings saved successfully!');
}

function updateApplicationTitle(title) {
    // Update page title (browser tab)
    document.title = title;
    
    // Update main header
    const headerElement = document.querySelector('.header h1');
    if (headerElement) {
    const logoPlaceholder = headerElement.querySelector('.logo-placeholder');
    headerElement.innerHTML = '';
    if (logoPlaceholder) {
    headerElement.appendChild(logoPlaceholder);
    }
    headerElement.appendChild(document.createTextNode(title));
    }
}

function saveUIConfiguration() {
    const confirmWinnerChecked = document.getElementById('confirmWinnerSelection').checked;
    
    if (!config.ui) {
        config.ui = {};
    }
    
    config.ui.confirmWinnerSelection = confirmWinnerChecked;
    
    localStorage.setItem('dartsConfig', JSON.stringify(config));
    alert('UI settings saved successfully!');
}
