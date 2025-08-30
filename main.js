// main.js - Core Application Logic and Initialization

// Global variables
let tournament = null;
let players = [];
let matches = [];
let config = {
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
        ui: {
        confirmWinnerSelection: true  // Default to true for safety
    }
};
let currentStatsPlayer = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadConfiguration();
    
    // Try to load recent tournaments, but don't fail if function isn't available yet
    try {
    loadRecentTournaments();
    } catch (error) {
    console.log('loadRecentTournaments not available yet, will retry');
    // Retry after a short delay to ensure all JS files are loaded
    setTimeout(() => {
    try {
    loadRecentTournaments();
    } catch (e) {
    console.error('Failed to load recent tournaments:', e);
    }
    }, 100);
    }
    
    setupEventListeners();
    setTodayDate();
});

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tournamentDate').value = today;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
    const page = this.dataset.page;
    showPage(page);
    });
    });

    // Enter key handlers
    document.getElementById('playerName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
    addPlayer();
    }
    });

    // Auto-save configuration
    ['participationPoints', 'firstPlacePoints', 'secondPlacePoints', 'thirdPlacePoints', 
    'highOutPoints', 'tonPoints', 'oneEightyPoints'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
    element.addEventListener('change', function() {
    const key = id.replace('Points', '').replace('oneEighty', 'oneEighty');
    config.points[key] = parseInt(this.value);
    saveConfiguration();
    });
    }
    });

    // Initialize bracket controls
    initializeBracketControls();
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
}

// AUTO-LOAD CURRENT TOURNAMENT ON PAGE LOAD
window.addEventListener('load', function() {
    const currentTournament = localStorage.getItem('currentTournament');
    if (currentTournament) {
    try {
    tournament = JSON.parse(currentTournament);
    players = tournament.players || [];
    matches = tournament.matches || [];

    if (tournament.name && tournament.date) {
    document.getElementById('tournamentName').value = tournament.name;
    document.getElementById('tournamentDate').value = tournament.date;
    
    // Make sure updateTournamentStatus exists before calling
    if (typeof updateTournamentStatus === 'function') {
    updateTournamentStatus();
    }
    
    // Make sure updatePlayersDisplay exists before calling  
    if (typeof updatePlayersDisplay === 'function') {
    updatePlayersDisplay();
    updatePlayerCount();
    }

    if (tournament.bracket && matches.length > 0 && typeof renderBracket === 'function') {
    renderBracket();
    }

    if (typeof displayResults === 'function') {
    displayResults();
    }
    }
    } catch (e) {
    console.error('Error loading current tournament:', e);
    }
    }
});
