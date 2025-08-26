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

        document.getElementById('participationPoints').value = config.points.participation;
        document.getElementById('firstPlacePoints').value = config.points.first;
        document.getElementById('secondPlacePoints').value = config.points.second;
        document.getElementById('thirdPlacePoints').value = config.points.third;
        document.getElementById('highOutPoints').value = config.points.highOut;
        document.getElementById('tonPoints').value = config.points.ton;
        document.getElementById('oneEightyPoints').value = config.points.oneEighty;

        document.getElementById('round1Legs').value = config.legs.round1;
        document.getElementById('round2Legs').value = config.legs.round2;
        document.getElementById('semifinalLegs').value = config.legs.semifinal;
        document.getElementById('finalLegs').value = config.legs.final;

        // Load application title
        if (config.applicationTitle) {
            document.getElementById('applicationTitle').value = config.applicationTitle;
            updateApplicationTitle(config.applicationTitle);
        }
        
        if (config.lanes) {
            document.getElementById('maxLanes').value = config.lanes.maxLanes || 10;
            document.getElementById('requireLaneForStart').checked = config.lanes.requireLaneForStart || false;
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

    config.legs.round1 = parseInt(document.getElementById('round1Legs').value);
    config.legs.round2 = parseInt(document.getElementById('round2Legs').value);
    config.legs.semifinal = parseInt(document.getElementById('semifinalLegs').value);
    config.legs.final = parseInt(document.getElementById('finalLegs').value);

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
