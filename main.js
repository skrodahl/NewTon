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
        oneEighty: 1
    },
    legs: {
        round1: 3,
        round2: 3,
        semifinal: 5,
        final: 5
    },
    applicationTitle: "NewTon DC - Tournament Manager"
};
let currentStatsPlayer = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadConfiguration();
    loadRecentTournaments();
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
                updateTournamentStatus();
                updatePlayersDisplay();
                updatePlayerCount();

                if (tournament.bracket && matches.length > 0) {
                    renderBracket();
                }

                if (tournament.status === 'completed') {
                    displayResults();
                }
            }
        } catch (e) {
            console.error('Error loading current tournament:', e);
        }
    }
});
