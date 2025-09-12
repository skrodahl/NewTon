// main.js - Bulletproof Config Initialization and Core Application Logic

// Global variables for tournament data ONLY (never config)
let tournament = null;
let players = [];
let matches = [];
let currentStatsPlayer = null;

// Application version
const APP_VERSION = '1.1.1';

// Global config is loaded by results-config.js - NEVER override it here
// let config = {}; // This is loaded by results-config.js

// Initialize application with bulletproof config loading
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Starting tournament manager...');

    // Step 1: Ensure global config is loaded FIRST
    if (typeof loadConfiguration === 'function') {
        console.log('✓ Global config loaded by results-config.js');
    } else {
        console.warn('⚠️ loadConfiguration not available - config may not be loaded');
    }

    // Step 2: Auto-detect and load logo
    loadClubLogo();

    // Step 3: Load recent tournaments list (but NOT tournament config)
    setTimeout(() => {
        try {
            if (typeof loadRecentTournaments === 'function') {
                loadRecentTournaments();
            }
        } catch (error) {
            console.error('Failed to load recent tournaments:', error);
        }
    }, 100);

    // Step 4: Setup event listeners
    setupEventListeners();

    // Step 5: Set today's date
    setTodayDate();

    // Step 6: Auto-load current tournament (if exists) - Never loads config
    autoLoadCurrentTournament();

    // Update footer with version
    const footerContent = document.getElementById('footerContent');
    if (footerContent) {
        footerContent.textContent = `NewTon DC Tournament Manager version ${APP_VERSION}`;
    }
});

function loadClubLogo() {
    const logoContainer = document.getElementById('clubLogo');
    if (!logoContainer) return;

    // Try different logo file extensions
    const logoFiles = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg'];
    let logoLoaded = false;

    logoFiles.forEach(filename => {
        if (logoLoaded) return;

        const img = new Image();
        img.onload = function () {
            logoContainer.innerHTML = '';
            logoContainer.className = 'club-logo';
            logoContainer.appendChild(img);
            img.alt = 'Club Logo';
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            logoLoaded = true;
        };
        img.onerror = function () {
            // Logo not found - keep placeholder
        };
        img.src = filename;
    });
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateElement = document.getElementById('tournamentDate');
    if (dateElement) {
        dateElement.value = today;
    }
}

function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = this.dataset.page;
            showPage(page);
        });
    });

    // Enter key handlers
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                addPlayer();
            }
        });
    }

    // Auto-save configuration on config page changes
    setupConfigAutoSave();

    // Initialize bracket controls
    if (typeof initializeBracketControls === 'function') {
        initializeBracketControls();
    }
}

function setupConfigAutoSave() {
    // Auto-save point configuration
    const pointFields = [
        'participationPoints', 'firstPlacePoints', 'secondPlacePoints', 'thirdPlacePoints',
        'fourthPlacePoints', 'fifthSixthPlacePoints', 'seventhEighthPlacePoints',
        'highOutPoints', 'tonPoints', 'oneEightyPoints', 'shortLegPoints'
    ];

    pointFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function () {
                // Save immediately when config changes
                if (typeof saveConfiguration === 'function') {
                    console.log(`💾 Auto-saving config change: ${id} = ${this.value}`);

                    // Update global config object
                    const configKey = id.replace('Points', '')
                        .replace('participation', 'participation')
                        .replace('firstPlace', 'first')
                        .replace('secondPlace', 'second')
                        .replace('thirdPlace', 'third')
                        .replace('fourthPlace', 'fourth')
                        .replace('fifthSixthPlace', 'fifthSixth')
                        .replace('seventhEighthPlace', 'seventhEighth')
                        .replace('highOut', 'highOut')
                        .replace('ton', 'ton')
                        .replace('oneEighty', 'oneEighty')
                        .replace('shortLeg', 'shortLeg');

                    if (config && config.points) {
                        config.points[configKey] = parseInt(this.value) || 0;
                    }

                    // Save to localStorage immediately
                    if (typeof saveGlobalConfig === 'function') {
                        saveGlobalConfig();
                    }
                }
            });
        }
    });

    // Auto-save match leg configuration - Updated for split semifinals
    const legFields = ['regularRoundsLegs', 'frontsideSemifinalLegs', 'backsideSemifinalLegs', 'backsideFinalLegs', 'grandFinalLegs'];

    legFields.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function () {
                if (typeof saveConfiguration === 'function') {
                    console.log(`💾 Auto-saving leg config: ${id} = ${this.value}`);

                    // Update global config object
                    if (config && config.legs) {
                        if (id === 'regularRoundsLegs') config.legs.regularRounds = parseInt(this.value) || 3;
                        else if (id === 'frontsideSemifinalLegs') config.legs.frontsideSemifinal = parseInt(this.value) || 5;  // NEW
                        else if (id === 'backsideSemifinalLegs') config.legs.backsideSemifinal = parseInt(this.value) || 3;    // NEW
                        else if (id === 'backsideFinalLegs') config.legs.backsideFinal = parseInt(this.value) || 5;
                        else if (id === 'grandFinalLegs') config.legs.grandFinal = parseInt(this.value) || 5;
                    }

                    // Save to localStorage immediately
                    if (typeof saveGlobalConfig === 'function') {
                        saveGlobalConfig();
                    }
                }
            });
        }
    });
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

// AUTO-LOAD CURRENT TOURNAMENT - Never loads config, only tournament data
function autoLoadCurrentTournament() {
    console.log('🔄 Auto-loading current tournament (config stays global)...');

    const currentTournament = localStorage.getItem('currentTournament');
    if (!currentTournament) {
        console.log('No current tournament found');
        return;
    }

    try {
        const tournamentData = JSON.parse(currentTournament);

        // Load ONLY tournament data - NEVER config
        tournament = {
            id: tournamentData.id,
            name: tournamentData.name,
            date: tournamentData.date,
            created: tournamentData.created,
            status: tournamentData.status,
            bracket: tournamentData.bracket,
            bracketSize: tournamentData.bracketSize, // ✅ Fixed: Include bracketSize
            placements: tournamentData.placements || {}
            // NO CONFIG loading - config stays global
        };

        players = tournamentData.players || [];
        matches = tournamentData.matches || [];

        // Update UI with tournament data - preserve user input during navigation
        if (tournament.name && tournament.date) {
            // Don't modify the input fields during navigation - preserve user's work

            // Update tournament-specific UI
            if (typeof updateTournamentStatus === 'function') {
                updateTournamentStatus();
            }

            if (typeof updatePlayersDisplay === 'function') {
                updatePlayersDisplay();
                updatePlayerCount();
            }

            // Render bracket if exists
            if (tournament.bracket && matches.length > 0 && typeof renderBracket === 'function') {
                renderBracket();
            }

            // Display results using global config
            if (typeof displayResults === 'function') {
                displayResults();
            }

            // Refresh lane dropdowns with correct config after tournament load
            if (tournament.bracket && matches.length > 0) {
                setTimeout(() => {
                    if (typeof refreshAllLaneDropdowns === 'function') {
                        refreshAllLaneDropdowns();
                    }
                }, 200);
            }

            console.log('✓ Current tournament loaded (global config preserved)');
        }
    } catch (error) {
        console.error('❌ Error loading current tournament:', error);
    }
}

// FORCE CONFIG RELOAD (for debugging)
function forceConfigReload() {
    if (typeof forceReloadConfig === 'function') {
        forceReloadConfig();
    } else {
        console.error('forceReloadConfig function not available');
    }
}

// DEBUG FUNCTIONS
function debugConfigState() {
    console.log('=== CONFIG DEBUG ===');
    console.log('Global config object:', config);
    console.log('Config in localStorage:', JSON.parse(localStorage.getItem('dartsConfig') || 'null'));
    console.log('Tournament object:', tournament);
    console.log('Current tournament in localStorage:', JSON.parse(localStorage.getItem('currentTournament') || 'null'));
}

// UPDATE: Enhanced showPage function with help integration
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

    // HELP SYSTEM INTEGRATION
    onPageChange(pageId);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showPage = showPage;
    window.forceConfigReload = forceConfigReload;
    window.debugConfigState = debugConfigState;
    window.APP_VERSION = APP_VERSION;

    // Also make these available for console debugging
    window.autoLoadCurrentTournament = autoLoadCurrentTournament;
}
