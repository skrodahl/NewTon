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

    const sortedPlayers = [...players].sort((a, b) => {
        if (a.placement && b.placement) {
            return a.placement - b.placement;
        }
        if (a.placement) return -1;
        if (b.placement) return 1;
        return 0;
    });

    tbody.innerHTML = sortedPlayers.map(player => {
        const points = calculatePlayerPoints(player);
        return `
            <tr>
                <td>${player.placement || 'TBD'}</td>
                <td>${player.name}</td>
                <td>${points}</td>
                <td>${player.stats.shortLegs || 0}</td>
                <td>${(player.stats.highOuts || []).length}</td>
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
        
        const oneEightyEl = document.getElementById('oneEightyPoints');
        if (oneEightyEl) oneEightyEl.value = config.points.oneEighty;

	const regularRoundsLegsEl = document.getElementById('regularRoundsLegs');
	if (regularRoundsLegsEl) regularRoundsLegsEl.value = config.legs.regularRounds;

	const semifinalLegsEl = document.getElementById('semifinalLegs');
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
    }
}

function saveConfiguration() {
    config.points.participation = parseInt(document.getElementById('participationPoints').value);
    config.points.first = parseInt(document.getElementById('firstPlacePoints').value);
    config.points.second = parseInt(document.getElementById('secondPlacePoints').value);
    config.points.third = parseInt(document.getElementById('thirdPlacePoints').value);
    config.points.highOut = parseInt(document.getElementById('highOutPoints').value);
    config.points.ton = parseInt(document.getElementById('tonPoints').value);
    config.points.oneEighty = parseInt(document.getElementById('oneEightyPoints').value);

    config.legs.regularRounds = parseInt(document.getElementById('regularRoundsLegs').value);
    config.legs.semifinal = parseInt(document.getElementById('semifinalLegs').value);
    config.legs.backsideFinal = parseInt(document.getElementById('backsideFinalLegs').value);
    config.legs.grandFinal = parseInt(document.getElementById('grandFinalLegs').value);

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
