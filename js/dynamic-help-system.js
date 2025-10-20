// dynamic-help-system.js - Context-aware help system for tournament manager

/**
 * HELP CONTENT DATABASE
 * Organized by page and context with progressive disclosure
 */
const HELP_CONTENT = {
    // Setup Page Help
    setup: {
        title: "Tournament Setup",
        overview: "Create, load, or manage tournaments. Start here for each new tournament.",
        sections: {
            creation: {
                title: "Creating Tournaments",
                content: `
                    <p><strong>Quick Start:</strong></p>
                    <ol>
                        <li>Enter a descriptive tournament name (e.g., "Weekly League Round 5")</li>
                        <li>Select the tournament date (defaults to today)</li>
                        <li>Click "Create New Tournament"</li>
                        <li>Go to Registration page to add players</li>
                    </ol>
                    <p><strong>Tips:</strong></p>
                    <ul>
                        <li>Use consistent naming for easy organization</li>
                        <li>Tournament names appear in export files and results</li>
                        <li>Dates help track tournament history</li>
                    </ul>
                `
            },
            management: {
                title: "Tournament Management",
                content: `
                    <p><strong>Export Tournament:</strong> Save tournament data as JSON file for backup or sharing between computers.</p>
                    <p><strong>Import Tournament:</strong> Load previously exported tournament data. Useful for:</p>
                    <ul>
                        <li>Moving tournaments between computers</li>
                        <li>Restoring from backups</li>
                        <li>Sharing tournament setups</li>
                    </ul>
                    <p><strong>Reset Tournament:</strong> Clear all bracket progress while keeping players. Use when you need to restart with same players.</p>
                    <p><strong>⚠️ Warning:</strong> Reset permanently deletes all match results and standings.</p>
                `
            },
            recent: {
                title: "Recent Tournaments",
                content: `
                    <p>View and manage previously created tournaments:</p>
                    <ul>
                        <li><strong>Load:</strong> Switch to a different tournament</li>
                        <li><strong>Delete (×):</strong> Permanently remove tournament</li>
                        <li><strong>[ACTIVE]:</strong> Shows your current tournament</li>
                    </ul>
                    <p><strong>Note:</strong> You cannot delete the currently active tournament.</p>
                `
            },
            results: {
                title: "Match Results",
                content: `
                    <p><strong>Live Match Results:</strong> View completed matches with enhanced progression information.</p>
                    <p><strong>Display Format:</strong></p>
                    <ul>
                        <li><strong>Player Names:</strong> Winner highlighted in green</li>
                        <li><strong>Progression Info:</strong> <em>Shows where each player advances (FS-2-1) or elimination rank (7th-8th)</em></li>
                        <li><strong>Match Score:</strong> Right-aligned final leg scores when available</li>
                    </ul>
                    <p><strong>💡 Tip:</strong> Progression info updates immediately after each match completion.</p>
                `
            }
        }
    },

    // Registration Page Help
    registration: {
        title: "Player Registration & Management",
        overview: "Add players, manage payment status, and access saved players or tournament results based on tournament state.",
        sections: {
            adding: {
                title: "Adding Players",
                content: `
                    <p><strong>Quick Add:</strong></p>
                    <ol>
                        <li>Type player name in the "Add New Player" field</li>
                        <li>Press Enter or click "Add Player"</li>
                        <li>Click player card to toggle paid status (Paid/Unpaid)</li>
                        <li>Only paid players can be removed (× button hidden for paid players)</li>
                    </ol>
                    <p><strong>Saved Players (During Setup):</strong></p>
                    <ul>
                        <li><strong>Available Players:</strong> Click any player to add to tournament</li>
                        <li><strong>In Tournament:</strong> Click to remove from tournament (warns if paid)</li>
                        <li>Players automatically move between sections when added/removed</li>
                        <li>Click <strong>×</strong> on Available Players to permanently delete from saved list</li>
                        <li>Cannot delete players currently in tournament</li>
                        <li>Saved Players automatically switches to Tournament Results when bracket is generated</li>
                    </ul>
                    <p><strong>Import Saved Players:</strong></p>
                    <ul>
                        <li>Import from tournament export file to quickly rebuild player roster</li>
                        <li>Saved Players persist across tournaments for easy reuse</li>
                    </ul>
                    <p><strong>Important:</strong> Only paid players are included in the tournament bracket.</p>
                    <p><strong>Minimum Players:</strong> You need at least 4 paid players to generate an 8-player bracket.</p>
                `
            },
            statistics: {
                title: "Player Statistics",
                content: `
                    <p><strong>Tracking Performance:</strong></p>
                    <p>Click any player name to open their statistics panel and record:</p>
                    <ul>
                        <li><strong>Short Legs:</strong> Games finished in 9-21 darts</li>
                        <li><strong>High Outs:</strong> Finishing scores of 101+ points</li>
                        <li><strong>180s:</strong> Maximum dart scores</li>
                        <li><strong>Tons:</strong> Any score of 100+ points</li>
                    </ul>
                    <p><strong>💡 Tip:</strong> Statistics affect final point calculations and can be edited during matches.</p>
                `
            },
            results: {
                title: "Live Results Table",
                content: `
                    <p><strong>Understanding the Results:</strong></p>
                    <ul>
                        <li><strong>Rank:</strong> Tournament placement (1st, 2nd, 3rd, etc.)</li>
                        <li><strong>Points:</strong> Total calculated based on placement + achievements</li>
                        <li><strong>Legs Won/Lost:</strong> Match performance from completed games</li>
                    </ul>
                    <p><strong>Export Results:</strong></p>
                    <ul>
                        <li><strong>Export CSV:</strong> Save results table for record keeping or league management</li>
                        <li><strong>Export JSON:</strong> Export results and tournament match history in JSON format</li>
                    </ul>
                    <p><strong>Note:</strong> Rankings update automatically as matches are completed.</p>
                    <p><strong>💡 Tip:</strong> Use Export JSON for automated import into external tournament statistics websites and league management systems.</p>
                `
            }
        }
    },

    // Tournament Page Help
    tournament: {
        title: "Tournament Management",
        overview: "Run the tournament bracket, manage matches, and track live progress.",
        sections: {
            bracket: {
                title: "Tournament Setup & Bracket Generation",
                content: `
                    <p><strong>Setting Up Your Tournament:</strong></p>
                    <ol>
                        <li>Click "<strong>Match Controls</strong>" button (top-left)</li>
                        <li>Use the Setup Command Center to manage players and tournament</li>
                        <li>Add players directly in Match Controls or navigate to Registration page</li>
                        <li>Toggle player paid status by clicking on player names</li>
                        <li>When ready, click the "<strong>Generate [X]-Player Bracket</strong>" button</li>
                    </ol>
                    <p><strong>Bracket Sizes:</strong></p>
                    <ul>
                        <li>4-8 players → 8-player bracket</li>
                        <li>9-16 players → 16-player bracket</li>
                        <li>17-32 players → 32-player bracket</li>
                    </ul>
                    <p><strong>💡 Tip:</strong> Match Controls adapts based on tournament state - use it for both setup and active tournament management!</p>
                `
            },
            navigation: {
                title: "Bracket Navigation & Quick Access",
                content: `
                    <p><strong>Top-Left Navigation Buttons:</strong></p>
                    <ul>
                        <li><strong>Statistics (≡):</strong> View tournament statistics, rankings, and detailed results</li>
                        <li><strong>Match Controls (➹):</strong> Manage LIVE and ready matches - start, complete, assign lanes/referees</li>
                        <li><strong>Setup (⬅):</strong> Return to Setup page for tournament management</li>
                        <li><strong>Registration (⬅):</strong> Navigate to Registration page to manage players</li>
                        <li><strong>Config (⬅):</strong> Access Config page for point values and match formats</li>
                    </ul>
                    <p><strong>Bracket Controls:</strong></p>
                    <ul>
                        <li><strong>Mouse:</strong> Click and drag to pan around the bracket</li>
                        <li><strong>Zoom:</strong> Use + and - buttons or mouse wheel</li>
                        <li><strong>Hover Zoom:</strong> When zoomed out, hover over any match for 1 second to automatically scale it to readable size</li>
                        <li><strong>Reset (⌂):</strong> Return to default view</li>
                    </ul>
                    <p><strong>Developer Console:</strong></p>
                    <ul>
                        <li><strong>Enable in Config page:</strong> Turn on "Enable Developer Analytics"</li>
                        <li><strong>Access:</strong> Click version number (bottom-right watermark) on Tournament page</li>
                        <li><strong>Features:</strong> Real-time statistics, validation checks, lane usage monitoring, transaction management, and developer commands</li>
                    </ul>
                    <p><strong>💡 Tip:</strong> Use the top-left navigation buttons to quickly access other pages without leaving the bracket view.</p>
                `
            },
            matches: {
                title: "Match Management",
                content: `
                    <p><strong>Match States:</strong></p>
                    <ul>
                        <li><strong>Grey (Pending):</strong> Waiting for players to advance</li>
                        <li><strong>Yellow (Ready):</strong> Both players determined, can start</li>
                        <li><strong>Orange (Live):</strong> Match is currently active</li>
                        <li><strong>Green (Completed):</strong> Winner has been selected</li>
                    </ul>
                    <p><strong>Starting Matches:</strong></p>
                    <ol>
                        <li>Click "<strong>Start</strong>" button on ready matches</li>
                        <li>Match becomes LIVE</li>
                        <li>Assign lane number (optional)</li>
                        <li>Select referee from dropdown (optional)</li>
                    </ol>
                `
            },
            completion: {
                title: "Completing & Correcting Matches",
                content: `
            <p><strong>Selecting Winners:</strong></p>
            <ol>
                <li>Click on winner's name in LIVE match</li>
                <li>Confirmation dialog appears</li>
                <li>Enter leg scores (optional but recommended)</li>
                <li>Click "<strong>Confirm Winner</strong>"</li>
            </ol>
            <p><strong>Leg Score Validation:</strong></p>
            <ul>
                <li>Winner must have more legs than loser</li>
                <li>Scores must be reasonable for match format (Bo3/5/7)</li>
                <li>Real-time validation prevents invalid entries</li>
                <li>Change match formats in Config page</li>
            </ul>
            <p><strong>Correcting Match Results:</strong></p>
            <ul>
                <li><strong>Hover over completed matches</strong> to see if undo is available</li>
                <li><strong>Click the undo symbol (↺)</strong> to reverse that specific match</li>
                <li><strong>Only safe matches show the undo option</strong> - no downstream matches completed</li>
                <li><strong>Safety protection</strong> prevents accidentally undoing large portions of the tournament</li>
                <li><strong>Multi-step correction</strong> allows undoing several matches by working backwards through the bracket</li>
                <li><strong>Perfect for late discoveries</strong> - fix errors found well into the tournament</li>
            </ul>
            <p><strong>💡 Tips:</strong> The undo symbol only appears when safe to use. Great for 32-player tournaments where mistakes might be discovered late.</p>
            `
            },
            lanes: {
                title: "Lane/Referee Management",
                content: `
                    <p><strong>Assigning Lanes/Referees:</strong></p>
                    <ul>
                        <li>Use lane/referee dropdown (L)/(Ref) in each match</li>
                        <li>System prevents multiple matches with same lane/referee</li>
                        <li>Players in LIVE matches cannot be selected as referees</li>
                        <li>Players in LIVE matches may be selected as referees in their own match</li>
                        <li>Completed matches will release their assigned lanes/referees</li>
                        <li>Lane/referee history is retained for completed matches</li>
                        <li>Configure max lanes in Config page</li>
                    </ul>
                    <p><strong>💡 Tip:</strong> Assign lanes to organize physical dartboard usage and avoid conflicts.</p>
                `
            },
            matchControls: {
                title: "Match Controls Interface",
                content: `
                    <p><strong>Accessing Match Controls:</strong></p>
                    <ul>
                        <li>Click the "<strong>Match Controls (➹)</strong>" button in the bracket toolbar</li>
                        <li>Centralized command center for all match management</li>
                        <li>Stay in one interface instead of clicking individual matches</li>
                    </ul>
                    <p><strong>Interface Organization:</strong></p>
                    <ul>
                        <li><strong>LIVE Matches Section:</strong> Currently active matches shown first</li>
                        <li><strong>Frontside Ready:</strong> Ready frontside matches</li>
                        <li><strong>Backside Ready:</strong> Ready backside matches with darker styling</li>
                    </ul>
                    <p><strong>Available Actions:</strong></p>
                    <ul>
                        <li><strong>Start Match:</strong> Move ready matches to LIVE status</li>
                        <li><strong>[Player Name] Wins:</strong> Direct winner selection buttons</li>
                        <li><strong>Lane/Referee Assignment:</strong> Dropdowns for each match</li>
                        <li><strong>Statistics Button:</strong> Access tournament and player statistics without leaving the Tournament page</li>
                    </ul>
                    <p><strong>Real-time Updates:</strong> Interface refreshes automatically after each action</p>
                    <p><strong>💡 Tip:</strong> Use Match Controls for efficient tournament management - everything in one place!</p>
                `
            }
        }
    },

    // Config Page Help
    config: {
        title: "Tournament Configuration",
        overview: "Customize point values, match formats, and application settings.",
        sections: {
            points: {
                title: "Point System Configuration",
                content: `
                    <p><strong>Point Categories:</strong></p>
                    <ul>
                        <li><strong>Participation:</strong> Base points for entering tournament</li>
                        <li><strong>Placement:</strong> Bonus points based on final ranking</li>
                        <li><strong>Achievements:</strong> Points for 180s, high outs, short legs, tons</li>
                    </ul>
                    <p><strong>Auto-save:</strong> Point values save automatically when changed.</p>
                    <p><strong>💡 Tip:</strong> Adjust values to balance participation vs. performance rewards.</p>
                `
            },
            matches: {
                title: "Match Format Configuration",
                content: `
                    <p><strong>Match Length Options:</strong></p>
                    <ul>
                        <li><strong>Regular Rounds:</strong> Early bracket matches</li>
                        <li><strong>Semi-Finals:</strong> Last frontside and backside matches</li>
                        <li><strong>Backside Final:</strong> Qualifier match for Grand Final</li>
                        <li><strong>Grand Final:</strong> Championship match</li>
                    </ul>
                    <p><strong>Format:</strong> Choose Best of 3, 5, or 7 legs for each round type.</p>
                    <p><strong>Auto-save:</strong> Settings apply immediately to new tournaments.</p>
                `
            },
            application: {
                title: "Application Settings",
                content: `
                    <p><strong>Customization Options:</strong></p>
                    <ul>
                        <li><strong>Application Title:</strong> Customize header text and browser title</li>
                        <li><strong>Club Logo:</strong> Add logo.png/jpg/jpeg/svg file to root folder</li>
                        <li><strong>Lane Management:</strong> Set maximum lanes and requirements</li>
                    </ul>
                    <p><strong>UI Settings:</strong></p>
                    <ul>
                        <li><strong>Winner Confirmation:</strong> Enable/disable confirmation dialogs (disabling skips match result and statistics entry)</li>
                        <li><strong>Match Controls Auto-Open:</strong> Automatically show Command Center when entering Tournament page</li>
                    </ul>
                    <p><strong>Developer Analytics:</strong></p>
                    <ul>
                        <li><strong>Enable Developer Analytics:</strong> Show advanced diagnostics and developer tools
                            <ul>
                                <li>When enabled, click version number in Tournament page to open Developer Console</li>
                                <li><strong>Real-time statistics:</strong> Transaction health, match states, player counts, lane usage, localStorage usage</li>
                                <li><strong>Lane Usage monitoring:</strong> Track dartboard lane availability, detect conflicts in LIVE matches (critical), and READY matches (preventive warnings)</li>
                                <li><strong>Validation checks:</strong> Lane conflicts, referee conflicts, match state integrity, transaction limits, player IDs, progression integrity</li>
                                <li><strong>Developer commands:</strong> Re-render bracket, recalculate rankings, refresh dropdowns, validate everything, manage transaction log</li>
                                <li><strong>Transaction management:</strong> Smart pruning to free up storage space while preserving tournament data</li>
                                <li>Hidden developer tool - no visual changes when enabled, only version number becomes clickable</li>
                                <li>Auto-refreshes every 2 seconds for real-time monitoring during tournaments</li>
                            </ul>
                        </li>
                    </ul>
                    <p><strong>Server Settings:</strong></p>
                    <ul>
                        <li><strong>Allow Deleting Shared Tournaments:</strong> Control delete button visibility for server-hosted tournaments</li>
                        <li>Default: Disabled (prevents accidental deletion on shared deployments)</li>
                        <li>Enable this only if you want operators to be able to delete shared tournaments</li>
                    </ul>
                    <p><strong>💡 Tip:</strong> Personalize the application for your club or organization.</p>
                `
            }
        }
    },

    // Contextual Help for Common Scenarios
    scenarios: {
        firstTime: {
            title: "First Time Setup",
            content: `
                <h4>Welcome to Tournament Manager!</h4>
                <p><strong>Quick Start Guide:</strong></p>
                <ol>
                    <li><strong>Setup:</strong> Create your first tournament with name and date</li>
                    <li><strong>Registration:</strong> Add players and mark them as paid</li>
                    <li><strong>Tournament:</strong> Generate bracket and start managing matches</li>
                    <li><strong>Config:</strong> Customize point values and settings (optional)</li>
                </ol>
                <p><strong>💡 Need help?</strong> Each page has specific guidance - click the help button (?) for detailed instructions.</p>
            `
        },
        troubleshooting: {
            title: "Common Issues",
            content: `
                <p><strong>Can't generate bracket:</strong></p>
                <ul>
                    <li>Need at least 4 paid players</li>
                    <li>Check that players are marked as "Paid"</li>
                    <li>If tournament is in progress, use "Reset Tournament" first</li>
                </ul>
                <p><strong>Match won't start:</strong></p>
                <ul>
                    <li>Both players must be determined (not "Awaiting Player")</li>
                    <li>Previous matches may need to be completed first</li>
                    <li>Check for walkover situations</li>
                </ul>
                <p><strong>Points not calculating correctly:</strong></p>
                <ul>
                    <li>Verify point values in Config page</li>
                    <li>Check player statistics are entered correctly</li>
                    <li>Ensure tournament is properly completed</li>
                </ul>
            `
        }
    }
};

/**
 * HELP SYSTEM STATE MANAGEMENT
 */
let helpState = {
    isVisible: false,
    currentPage: 'setup',
    currentSection: null,
    position: { x: 100, y: 100 }
};

/**
 * INITIALIZE HELP SYSTEM
 * Call this after DOM is loaded
 */
function initializeHelpSystem() {
    console.log('🔧 Initializing dynamic help system...');

    // Initialize help icons with tooltips
    initializeHelpIcons();

    // Create help modal
    createHelpModal();

    // Setup context detection
    setupContextDetection();

    // Add keyboard shortcuts
    setupHelpKeyboardShortcuts();

    console.log('✓ Help system initialized');
}

/**
 * INITIALIZE HELP ICONS
 * Add click functionality to help info icons
 */
function initializeHelpIcons() {
    const helpIcons = document.querySelectorAll('.help-info-icon');

    helpIcons.forEach(icon => {
        const pageId = icon.getAttribute('data-page');
        if (!pageId) return;

        // Click icon to open help
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            showHelp(pageId);
        });
    });
}

/**
 * CREATE HELP MODAL
 * Build the floating help interface
 */
function createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'dynamicHelpModal';
    modal.className = 'help-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 50px;
        right: 50px;
        width: 400px;
        max-height: 80vh;
        background: #ffffff;
        border: 2px solid #ff6b35;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        overflow: hidden;
        resize: both;
        min-width: 350px;
        min-height: 200px;
    `;

    modal.innerHTML = `
        <div class="help-header" style="
            background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        ">
            <span id="helpTitle">Tournament Help</span>
            <div>
                <button id="helpMinimize" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-right: 10px;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                ">−</button>
                <button id="helpClose" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                ">×</button>
            </div>
        </div>
        
        <div class="help-content" style="
            padding: 20px;
            max-height: calc(80vh - 60px);
            overflow-y: auto;
            color: #111827;
            line-height: 1.6;
        ">
            <div id="helpOverview" style="margin-bottom: 20px;"></div>
            <div id="helpSections"></div>
            <div id="helpNavigation" style="
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <button id="helpShowScenarios" class="btn" style="font-size: 12px; padding: 6px 12px;">
                    Common Issues
                </button>
                <span style="font-size: 12px; color: #6b7280;">
                    Press F1 for help • ESC to close
                </span>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup modal interactions
    setupHelpModalInteractions(modal);
}

/**
 * SETUP HELP MODAL INTERACTIONS
 */
function setupHelpModalInteractions(modal) {
    const header = modal.querySelector('.help-header');
    const closeBtn = modal.querySelector('#helpClose');
    const minimizeBtn = modal.querySelector('#helpMinimize');
    const scenariosBtn = modal.querySelector('#helpShowScenarios');

    // Make modal draggable
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffset.x = e.clientX - modal.offsetLeft;
        dragOffset.y = e.clientY - modal.offsetTop;
        modal.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep modal within viewport
        const maxX = window.innerWidth - modal.offsetWidth;
        const maxY = window.innerHeight - modal.offsetHeight;

        modal.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        modal.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        modal.style.right = 'auto'; // Remove right positioning
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        modal.style.cursor = 'auto';
    });

    // Close button
    closeBtn.addEventListener('click', hideHelp);

    // Minimize button
    minimizeBtn.addEventListener('click', () => {
        const content = modal.querySelector('.help-content');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            minimizeBtn.textContent = '−';
            modal.style.height = 'auto';
        } else {
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            modal.style.height = '60px';
        }
    });

    // Scenarios button
    scenariosBtn.addEventListener('click', () => {
        showHelpSection('scenarios', 'troubleshooting');
    });
}

/**
 * SETUP CONTEXT DETECTION
 * Automatically detect user context and show relevant help
 */
function setupContextDetection() {
    // Detect page changes
    const observer = new MutationObserver(() => {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id;
            if (pageId !== helpState.currentPage) {
                helpState.currentPage = pageId;
                updateHelpContext();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });

    // Detect first-time user
    if (!localStorage.getItem('helpSystemSeen')) {
        setTimeout(() => {
            showHelp('scenarios', 'firstTime');
            localStorage.setItem('helpSystemSeen', 'true');
        }, 2000);
    }
}

/**
 * SETUP KEYBOARD SHORTCUTS
 */
function setupHelpKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // F1 - Show help for current page
        if (e.key === 'F1') {
            e.preventDefault();
            if (helpState.isVisible) {
                hideHelp();
            } else {
                showHelp(helpState.currentPage);
            }
        }

        // ESC - Close help
        if (e.key === 'Escape' && helpState.isVisible) {
            hideHelp();
        }

        // Ctrl+H - Toggle help
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            toggleHelp();
        }
    });
}

/**
 * SHOW HELP
 * Display help for specific page and optionally specific section
 */
function showHelp(pageId = 'setup', sectionId = null) {
    const modal = document.getElementById('dynamicHelpModal');
    if (!modal) return;

    helpState.isVisible = true;
    helpState.currentPage = pageId;
    helpState.currentSection = sectionId;

    // Update help content
    updateHelpContent(pageId, sectionId);

    // Show modal
    modal.style.display = 'block';

    // Focus for keyboard navigation
    modal.focus();

    console.log(`📖 Help shown for ${pageId}${sectionId ? ` > ${sectionId}` : ''}`);
}

/**
 * HIDE HELP
 */
function hideHelp() {
    const modal = document.getElementById('dynamicHelpModal');
    if (!modal) return;

    modal.style.display = 'none';
    helpState.isVisible = false;

    console.log('📖 Help hidden');
}

/**
 * TOGGLE HELP
 */
function toggleHelp() {
    if (helpState.isVisible) {
        hideHelp();
    } else {
        showHelp(helpState.currentPage);
    }
}

/**
 * UPDATE HELP CONTEXT
 * Called when page changes to update help relevance
 */
function updateHelpContext() {
    if (!helpState.isVisible) return;

    // Update help content for new page
    updateHelpContent(helpState.currentPage);
}

/**
 * UPDATE HELP CONTENT
 * Populate modal with relevant help information
 */
function updateHelpContent(pageId, sectionId = null) {
    const helpData = HELP_CONTENT[pageId];
    if (!helpData) {
        console.warn(`No help content found for page: ${pageId}`);
        return;
    }

    const titleElement = document.getElementById('helpTitle');
    const overviewElement = document.getElementById('helpOverview');
    const sectionsElement = document.getElementById('helpSections');

    // Update title
    if (titleElement) {
        titleElement.textContent = helpData.title;
    }

    // Update overview
    if (overviewElement) {
        overviewElement.innerHTML = `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b35;">
                <strong>Overview:</strong> ${helpData.overview}
            </div>
        `;
    }

    // Update sections
    if (sectionsElement && helpData.sections) {
        let sectionsHTML = '';

        Object.entries(helpData.sections).forEach(([key, section]) => {
            const isExpanded = sectionId === key || sectionId === null;

            sectionsHTML += `
                <div class="help-section" style="margin-bottom: 15px;">
                    <h4 style="
                        cursor: pointer;
                        color: #ff6b35;
                        margin: 0 0 10px 0;
                        padding: 8px 12px;
                        background: #fff7f0;
                        border-radius: 6px;
                        border-left: 3px solid #ff6b35;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    " onclick="toggleHelpSection('${key}')">
                        ${section.title}
                        <span id="toggle-${key}" style="font-size: 14px;">
                            ${isExpanded ? '−' : '+'}
                        </span>
                    </h4>
                    <div id="section-${key}" style="
                        display: ${isExpanded ? 'block' : 'none'};
                        padding-left: 15px;
                        border-left: 2px solid #f3f4f6;
                        margin-left: 10px;
                    ">
                        ${section.content}
                    </div>
                </div>
            `;
        });

        sectionsElement.innerHTML = sectionsHTML;
    }

    // Add quick actions based on current page
    addQuickActions(pageId);
}

/**
 * ADD QUICK ACTIONS
 * Context-sensitive action buttons
 */
function addQuickActions(pageId) {
    const navigation = document.getElementById('helpNavigation');
    if (!navigation) return;

    // Remove existing quick actions
    const existingActions = navigation.querySelector('.quick-actions');
    if (existingActions) {
        existingActions.remove();
    }

    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    let actionsHTML = '';

    switch (pageId) {
        case 'setup':
            if (!tournament) {
                actionsHTML = '<button class="btn btn-success" onclick="hideHelp(); showPage(\'setup\');" style="font-size: 12px; padding: 6px 12px;">Create Tournament</button>';
            }
            break;

        case 'registration':
            if (tournament && players.filter(p => p.paid).length < 4) {
                actionsHTML = '<button class="btn btn-warning" onclick="hideHelp(); document.getElementById(\'playerName\').focus();" style="font-size: 12px; padding: 6px 12px;">Add Players</button>';
            } else if (tournament && !tournament.bracket) {
                actionsHTML = '<button class="btn btn-success" onclick="hideHelp(); showPage(\'tournament\');" style="font-size: 12px; padding: 6px 12px;">Go to Tournament</button>';
            }
            break;

        case 'tournament':
            if (tournament && !tournament.bracket) {
                actionsHTML = '<button class="btn btn-success" onclick="hideHelp(); showMatchCommandCenter();" style="font-size: 12px; padding: 6px 12px;">Open Match Controls</button>';
            } else if (matches && matches.some(m => getMatchState && getMatchState(m) === 'ready')) {
                actionsHTML = '<button class="btn btn-warning" onclick="hideHelp(); showMatchDetails();" style="font-size: 12px; padding: 6px 12px;">Show Ready Matches</button>';
            }
            break;

        case 'config':
            actionsHTML = '<button class="btn" onclick="hideHelp(); showPage(\'setup\');" style="font-size: 12px; padding: 6px 12px;">Back to Setup</button>';
            break;
    }

    if (actionsHTML) {
        quickActions.innerHTML = actionsHTML;
        navigation.insertBefore(quickActions, navigation.firstChild);
    }
}

/**
 * TOGGLE HELP SECTION
 * Expand/collapse individual help sections
 */
function toggleHelpSection(sectionId) {
    const section = document.getElementById(`section-${sectionId}`);
    const toggle = document.getElementById(`toggle-${sectionId}`);

    if (!section || !toggle) return;

    if (section.style.display === 'none') {
        section.style.display = 'block';
        toggle.textContent = '−';
    } else {
        section.style.display = 'none';
        toggle.textContent = '+';
    }
}

/**
 * SHOW HELP SECTION
 * Direct navigation to specific help section
 */
function showHelpSection(pageId, sectionId) {
    showHelp(pageId, sectionId);
}

/**
 * SMART HELP SUGGESTIONS
 * Analyze current context and suggest relevant help
 */
function suggestHelp() {
    // No tournament created
    if (!tournament) {
        return { page: 'setup', section: 'creation', reason: 'No active tournament' };
    }

    // Few players
    if (players.filter(p => p.paid).length < 4) {
        return { page: 'registration', section: 'adding', reason: 'Need more paid players' };
    }

    // No bracket generated
    if (!tournament.bracket) {
        return { page: 'tournament', section: 'bracket', reason: 'Ready to generate bracket in Match Controls' };
    }

    // Active matches available
    /*
    if (matches && matches.some(m => getMatchState && getMatchState(m) === 'live')) {
        return { page: 'tournament', section: 'completion', reason: 'Live matches need attention' };
    } */

    return null;
}

/**
 * CONTEXTUAL HELP NOTIFICATIONS
 * Show subtle help hints based on user actions
 */
function showHelpHint(message, duration = 3000) {
    // Remove existing hints
    const existingHint = document.getElementById('helpHint');
    if (existingHint) {
        existingHint.remove();
    }

    const hint = document.createElement('div');
    hint.id = 'helpHint';
    hint.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(255,107,53,0.3);
        z-index: 1001;
        font-size: 14px;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;

    hint.innerHTML = `
        💡 ${message}
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            margin-left: 10px;
            cursor: pointer;
            font-size: 16px;
        ">×</button>
    `;

    // Add animation CSS if not exists
    if (!document.querySelector('#helpAnimations')) {
        const style = document.createElement('style');
        style.id = 'helpAnimations';
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(hint);

    // Auto-remove after duration
    setTimeout(() => {
        if (hint.parentElement) {
            hint.remove();
        }
    }, duration);
}

/**
 * INTEGRATION HOOKS
 * Functions to call from main application
 */

// Call when user seems confused or stuck
function triggerContextualHelp() {
    const suggestion = suggestHelp();
    if (suggestion) {
        showHelpHint(`${suggestion.reason}. Press F1 for help with ${suggestion.page}.`);
    }
}

// Call when significant actions occur
function onTournamentCreated() {
    showHelpHint('Tournament created! Add players on the Registration page.');
}

function onBracketGenerated() {
    showHelpHint('Bracket generated! Click "Start" on ready matches to begin.');
}

function onFirstMatchCompleted() {
    showHelpHint('Great! Tournament is underway. Use undo (↩) if needed.');
}

// Make functions globally available
if (typeof window !== 'undefined') {
    // Core help functions
    window.initializeHelpSystem = initializeHelpSystem;
    window.showHelp = showHelp;
    window.hideHelp = hideHelp;
    window.toggleHelp = toggleHelp;
    window.toggleHelpSection = toggleHelpSection;
    window.showHelpSection = showHelpSection;

    // Utility functions
    window.showHelpHint = showHelpHint;
    window.triggerContextualHelp = triggerContextualHelp;
    window.suggestHelp = suggestHelp;

    // Integration hooks
    window.onTournamentCreated = onTournamentCreated;
    window.onBracketGenerated = onBracketGenerated;
    window.onFirstMatchCompleted = onFirstMatchCompleted;

    console.log('✅ Dynamic help system functions registered globally');
}
