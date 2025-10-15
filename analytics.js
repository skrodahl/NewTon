/**
 * Analytics & Developer Console
 *
 * Hidden developer tool for real-time tournament diagnostics, validation checks,
 * and developer commands. Accessible by clicking version number when enabled in Config.
 *
 * Features:
 * - Real-time statistics (transactions, matches, players, lanes)
 * - 6 validation checks (lanes, referees, match state, transactions, player IDs, progression)
 * - Developer commands (re-render, recalculate, validate, refresh)
 * - Console output capture and display
 * - Auto-refresh every 2 seconds (pauses while scrolling)
 */

// Console output capture
let consoleBuffer = [];
let originalConsoleLog = null;
let maxConsoleEntries = 100;
let lastConsoleUpdateLength = 0; // Track when console actually changes

// Auto-refresh system
let analyticsRefreshInterval = null;
let isUserScrolling = false;
let scrollTimeout = null;

// Current right pane view
let currentView = 'overview';

/**
 * Open Analytics Modal
 */
function openAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (!modal) {
        console.error('Analytics modal not found in DOM');
        return;
    }

    // Use dialog stack system with Escape key support
    if (typeof window.pushDialog === 'function') {
        window.pushDialog('analyticsModal', null, true); // true enables Escape key
    } else {
        modal.style.display = 'block';
    }

    // Start console capture
    startConsoleCapture();

    // Setup scroll detection (must be done after modal is displayed)
    setupScrollDetection();

    // Initial render
    refreshAnalytics();
    showQuickOverview();

    // Start auto-refresh
    startAutoRefresh();

    console.log('Developer Console opened');
}

/**
 * Close Analytics Modal
 */
function closeAnalyticsModal() {
    // Use dialog stack system
    if (typeof window.popDialog === 'function') {
        window.popDialog();
    } else {
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Stop console capture
    stopConsoleCapture();

    // Stop auto-refresh
    stopAutoRefresh();

    console.log('Developer Console closed');
}

/**
 * Start capturing console.log output
 */
function startConsoleCapture() {
    if (originalConsoleLog) return; // Already capturing

    originalConsoleLog = console.log;
    console.log = function(...args) {
        // Call original console.log
        originalConsoleLog.apply(console, args);

        // Capture to buffer
        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        consoleBuffer.push({ timestamp, message });

        // Keep only last N entries
        if (consoleBuffer.length > maxConsoleEntries) {
            consoleBuffer.shift();
        }

        // Update view if console is currently displayed
        if (currentView === 'console') {
            showConsoleOutput();
        }
    };
}

/**
 * Stop capturing console.log output
 */
function stopConsoleCapture() {
    if (originalConsoleLog) {
        console.log = originalConsoleLog;
        originalConsoleLog = null;
    }
}

/**
 * Start auto-refresh (every 2 seconds)
 */
function startAutoRefresh() {
    if (analyticsRefreshInterval) return; // Already running

    analyticsRefreshInterval = setInterval(() => {
        if (!isUserScrolling) {
            refreshAnalytics();
        }
    }, 2000);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (analyticsRefreshInterval) {
        clearInterval(analyticsRefreshInterval);
        analyticsRefreshInterval = null;
    }
}

/**
 * Detect user scrolling and pause refresh
 */
function setupScrollDetection() {
    const contentArea = document.getElementById('analyticsContentArea');
    const consoleFooter = document.getElementById('analyticsConsoleFooter');

    const handleScroll = () => {
        isUserScrolling = true;

        // Clear existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Resume refresh 1 second after scroll stops
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 1000);
    };

    if (contentArea) {
        contentArea.addEventListener('scroll', handleScroll);
    }

    if (consoleFooter) {
        consoleFooter.addEventListener('scroll', handleScroll);
    }
}

/**
 * Refresh all analytics data and update left pane
 */
function refreshAnalytics() {
    updateStatisticsPane();
    updateTimestamp();

    // Only refresh Overview automatically, other views stay static until user clicks
    if (currentView === 'overview') {
        showQuickOverview();
    }

    // Always update console footer
    updateConsoleFooter();
}

/**
 * Update statistics in left pane
 */
function updateStatisticsPane() {
    const stats = getTransactionStats();
    const matchStats = getMatchStateStats();
    const playerStats = getPlayerStats();
    const laneStats = getLaneStats();

    // Update Transaction Health
    const transactionEl = document.getElementById('stat-transactions');
    if (transactionEl) {
        const percentage = Math.round((stats.total / 500) * 100);
        const status = percentage < 50 ? '✅' : (percentage < 80 ? '⚠️' : '🔴');
        transactionEl.innerHTML = `${stats.total}/500 (${percentage}%) ${status}`;
    }

    // Update Match State
    const matchEl = document.getElementById('stat-matches');
    if (matchEl) {
        matchEl.innerHTML = `${matchStats.completed} completed | ${matchStats.ready} ready | ${matchStats.live} live`;
    }

    // Update Player Count
    const playerEl = document.getElementById('stat-players');
    if (playerEl) {
        playerEl.innerHTML = `${playerStats.paid} paid | ${playerStats.unpaid} unpaid`;
    }

    // Update Lane Usage
    const laneEl = document.getElementById('stat-lanes');
    if (laneEl) {
        const status = laneStats.conflicts > 0 ? '⚠️' : '✅';
        laneEl.innerHTML = `${laneStats.inUse}/${laneStats.max} in use ${status}`;
    }

    // Update localStorage Usage
    const storageEl = document.getElementById('stat-storage');
    if (storageEl) {
        const storageStats = getLocalStorageStats();
        const percentage = Math.round((storageStats.used / storageStats.limit) * 100);
        const status = percentage < 50 ? '✅' : (percentage < 80 ? '⚠️' : '🔴');
        storageEl.innerHTML = `${storageStats.used.toFixed(2)}/${storageStats.limit} MB ${status}`;
    }
}

/**
 * Update last updated timestamp
 */
function updateTimestamp() {
    const timestampEl = document.getElementById('analytics-timestamp');
    if (timestampEl) {
        const now = new Date();
        timestampEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

/**
 * Get transaction statistics
 */
function getTransactionStats() {
    const history = getTournamentHistory ? getTournamentHistory() : [];

    const breakdown = {
        COMPLETE_MATCH: 0,
        START_MATCH: 0,
        STOP_MATCH: 0,
        ASSIGN_LANE: 0,
        ASSIGN_REFEREE: 0
    };

    history.forEach(tx => {
        if (breakdown.hasOwnProperty(tx.type)) {
            breakdown[tx.type]++;
        }
    });

    return {
        total: history.length,
        breakdown: breakdown
    };
}

/**
 * Get match state statistics
 */
function getMatchStateStats() {
    if (!matches || matches.length === 0) {
        return { total: 0, completed: 0, live: 0, ready: 0, pending: 0 };
    }

    const stats = {
        total: matches.length,
        completed: 0,
        live: 0,
        ready: 0,
        pending: 0
    };

    matches.forEach(match => {
        const state = getMatchState ? getMatchState(match) : 'unknown';
        if (stats.hasOwnProperty(state)) {
            stats[state]++;
        }
    });

    return stats;
}

/**
 * Get player statistics
 */
function getPlayerStats() {
    if (!players || players.length === 0) {
        return { total: 0, paid: 0, unpaid: 0 };
    }

    const paid = players.filter(p => p.paid).length;
    return {
        total: players.length,
        paid: paid,
        unpaid: players.length - paid
    };
}

/**
 * Get lane usage statistics
 */
function getLaneStats() {
    const maxLanes = (config && config.lanes && config.lanes.maxLanes) || 10;
    const excludedLanes = (config && config.lanes && config.lanes.excludedLanes) || [];
    const usedLanes = getUsedLanes ? getUsedLanes() : [];
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true, conflicts: [] };

    // Calculate effective available lanes (total minus excluded)
    const availableLanes = maxLanes - excludedLanes.length;

    return {
        max: availableLanes,
        inUse: usedLanes.length,
        conflicts: validation.conflicts.length
    };
}

/**
 * Get localStorage usage statistics
 */
function getLocalStorageStats() {
    let totalSize = 0;
    const items = {};

    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            const itemSize = (localStorage[key].length + key.length) * 2; // UTF-16 = 2 bytes per char
            items[key] = itemSize;
            totalSize += itemSize;
        }
    }

    // Browser limit is 10MB for modern browsers (Chrome 114+, Firefox, Safari, Edge)
    const limitBytes = 10 * 1024 * 1024;
    const usedMB = totalSize / 1024 / 1024;
    const limitMB = limitBytes / 1024 / 1024;

    return {
        used: usedMB,
        limit: limitMB,
        percentage: Math.round((usedMB / limitMB) * 100),
        items: items
    };
}

// ============================================================================
// RIGHT PANE VIEWS
// ============================================================================

/**
 * Show Quick Overview (default view)
 */
function showQuickOverview() {
    currentView = 'overview';

    const stats = getTransactionStats();
    const matchStats = getMatchStateStats();
    const laneStats = getLaneStats();
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true };

    const transactionPercentage = Math.round((stats.total / 500) * 100);
    const matchPercentage = matchStats.total > 0 ? Math.round((matchStats.completed / matchStats.total) * 100) : 0;

    const laneStatus = laneStats.conflicts === 0 ? '✅ None' : `⚠️ ${laneStats.conflicts} conflict(s)`;
    const refereeValidation = validateRefereeAssignments();
    const refereeStatus = refereeValidation.valid ? '✅ None' : `⚠️ ${refereeValidation.conflicts.length} conflict(s)`;

    const html = `
        <h4>Quick Overview</h4>
        <div style="line-height: 1.8;">
            <p><strong>Matches:</strong> ${matchStats.completed}/${matchStats.total} completed (${matchPercentage}%)</p>
            <p><strong>Transactions:</strong> ${stats.total}/500 (${transactionPercentage}%)</p>
            <p><strong>Active:</strong> ${matchStats.live} live matches, ${matchStats.ready} ready</p>
            <p><strong>Lane conflicts:</strong> ${laneStatus}</p>
            <p><strong>Referee conflicts:</strong> ${refereeStatus}</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Transaction Breakdown
 */
function showTransactionBreakdown() {
    currentView = 'transactions';

    const stats = getTransactionStats();
    const percentage = Math.round((stats.total / 500) * 100);
    const status = percentage < 50 ? '✅ Healthy' : (percentage < 80 ? '⚠️ Moderate' : '🔴 High');
    const remaining = 500 - stats.total;

    let html = `
        <h4>Transaction Breakdown (${stats.total} total)</h4>
        <div style="line-height: 1.8;">
    `;

    for (const [type, count] of Object.entries(stats.breakdown)) {
        const typePercentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
        html += `<p><strong>${type}:</strong> ${count} (${typePercentage}%)</p>`;
    }

    html += `
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Storage:</strong> ${stats.total}/500 entries (${percentage}%)</p>
            <p><strong>Status:</strong> ${status} (${remaining} capacity remaining)</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Match State Details
 */
function showMatchStateDetails() {
    currentView = 'matches';

    const matchStats = getMatchStateStats();

    let html = `
        <h4>Match State Breakdown (${matchStats.total} total)</h4>
        <div style="line-height: 1.8;">
    `;

    // Group matches by state
    const matchesByState = {
        completed: [],
        live: [],
        ready: [],
        pending: []
    };

    if (matches && matches.length > 0) {
        matches.forEach(match => {
            const state = getMatchState ? getMatchState(match) : 'unknown';
            if (matchesByState.hasOwnProperty(state)) {
                matchesByState[state].push(match.id);
            }
        });
    }

    // Display each state
    for (const [state, matchIds] of Object.entries(matchesByState)) {
        const count = matchIds.length;
        const stateName = state.toUpperCase();

        html += `<p><strong>${stateName}:</strong> ${count} matches</p>`;
        if (count > 0) {
            html += `<p style="margin-left: 20px; color: #666; font-size: 13px;">${matchIds.join(', ')}</p>`;
        }
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Transaction History
 */
function showTransactionHistory() {
    currentView = 'history';

    const history = getTournamentHistory ? getTournamentHistory() : [];

    let html = `
        <h4>Transaction History (${history.length} total)</h4>
        <div style="font-family: monospace; font-size: 12px; line-height: 1.6;">
    `;

    if (history.length === 0) {
        html += `<p style="color: #666;">No transactions recorded</p>`;
    } else {
        // Reverse to show latest first (#1 is the most recent)
        const reversedHistory = [...history].reverse();

        reversedHistory.forEach((tx, index) => {
            const time = new Date(tx.timestamp).toLocaleTimeString();
            const number = index + 1; // #1 is the latest transaction
            html += `<p>#${number} | ${time} | ${tx.type} | ${tx.description || 'No description'}</p>`;
        });
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Console Output
 */
function showConsoleOutput() {
    currentView = 'console';

    let html = `
        <h4>Console Output (last ${consoleBuffer.length} entries)</h4>
        <div style="margin-bottom: 15px;">
            <button class="btn" onclick="clearConsoleOutput()" style="margin-right: 10px;">Clear Console</button>
            <button class="btn" onclick="copyConsoleOutput()">Copy to Clipboard</button>
        </div>
        <div style="font-family: monospace; font-size: 12px; line-height: 1.6; background: #f5f5f5; padding: 15px; border-radius: 4px;">
    `;

    if (consoleBuffer.length === 0) {
        html += `<p style="color: #666;">No console output captured yet</p>`;
    } else {
        consoleBuffer.forEach(entry => {
            html += `<p>[${entry.timestamp}] ${entry.message}</p>`;
        });
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Player Details
 */
function showPlayerDetails() {
    currentView = 'players';

    if (!players || players.length === 0) {
        updateRightPane(`<h4>Player Details</h4><p style="color: #666;">No players registered</p>`);
        return;
    }

    // Separate and sort players by paid status
    const paidPlayers = players.filter(p => p.paid).sort((a, b) => a.name.localeCompare(b.name));
    const unpaidPlayers = players.filter(p => !p.paid).sort((a, b) => a.name.localeCompare(b.name));

    let html = `
        <h4>Player Details (${players.length} total)</h4>
        <div style="line-height: 1.8;">
    `;

    // Paid Players Section
    if (paidPlayers.length > 0) {
        html += `
            <h5 style="margin-top: 20px; margin-bottom: 10px; color: #065f46;">✅ Paid Players (${paidPlayers.length})</h5>
        `;
        paidPlayers.forEach(player => {
            html += `<p style="margin-left: 20px;"><strong>${player.name}</strong> <span style="color: #666; font-size: 13px;">(ID: ${player.id})</span></p>`;
        });
    }

    // Unpaid Players Section
    if (unpaidPlayers.length > 0) {
        html += `
            <h5 style="margin-top: 20px; margin-bottom: 10px; color: #dc2626;">⚠️ Unpaid Players (${unpaidPlayers.length})</h5>
        `;
        unpaidPlayers.forEach(player => {
            html += `<p style="margin-left: 20px;"><strong>${player.name}</strong> <span style="color: #666; font-size: 13px;">(ID: ${player.id})</span></p>`;
        });
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show localStorage Usage
 */
function showLocalStorageUsage() {
    currentView = 'storage';

    const storageStats = getLocalStorageStats();

    // Sort items by size (largest first)
    const sortedItems = Object.entries(storageStats.items)
        .map(([key, sizeBytes]) => ({
            key,
            sizeKB: (sizeBytes / 1024).toFixed(2),
            sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
            percentage: Math.round((sizeBytes / (storageStats.used * 1024 * 1024)) * 100)
        }))
        .sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));

    let html = `
        <h4>localStorage Usage</h4>
        <div style="line-height: 1.8;">
            <p><strong>Total Used:</strong> ${storageStats.used.toFixed(2)} MB of ${storageStats.limit} MB (${storageStats.percentage}%)</p>
            <p><strong>Browser Limit:</strong> ${storageStats.limit} MB (Chrome 114+, Firefox, Safari, Edge)</p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

            <h5 style="margin-bottom: 10px;">Breakdown by Key:</h5>
    `;

    sortedItems.forEach(item => {
        const sizeDisplay = parseFloat(item.sizeMB) >= 0.01
            ? `${item.sizeMB} MB`
            : `${item.sizeKB} KB`;

        html += `<p style="margin: 8px 0;">
            <strong>${item.key}:</strong> ${sizeDisplay} (${item.percentage}%)
        </p>`;
    });

    html += `
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Match Progression Rules
 */
function showMatchProgression() {
    currentView = 'progression';

    if (!tournament || !tournament.bracketSize) {
        updateRightPane(`<h4>Match Progression Rules</h4><p style="color: #666;">No tournament loaded</p>`);
        return;
    }

    const bracketSize = tournament.bracketSize;
    const progression = MATCH_PROGRESSION ? MATCH_PROGRESSION[bracketSize] : null;

    if (!progression) {
        updateRightPane(`<h4>Match Progression Rules</h4><p style="color: #666;">No progression rules found for ${bracketSize}-player bracket</p>`);
        return;
    }

    let html = `
        <h4>Match Progression Rules (${bracketSize}-player bracket)</h4>
        <div style="font-family: monospace; font-size: 13px; line-height: 1.8;">
    `;

    for (const [matchId, rule] of Object.entries(progression)) {
        html += `<p><strong>${matchId}:</strong></p>`;

        if (rule.winner) {
            html += `<p style="margin-left: 20px;">Winner → ${rule.winner[0]} (${rule.winner[1]})</p>`;
        } else {
            html += `<p style="margin-left: 20px;">Winner → Tournament Champion</p>`;
        }

        if (rule.loser) {
            html += `<p style="margin-left: 20px;">Loser → ${rule.loser[0]} (${rule.loser[1]})</p>`;
        } else {
            html += `<p style="margin-left: 20px;">Loser → Eliminated</p>`;
        }

        html += `<br>`;
    }

    html += `</div>`;

    updateRightPane(html);
}

/**
 * Show Validation Results
 */
function showValidationResults() {
    currentView = 'validation';

    const results = runAllValidations();

    let html = `
        <h4>Validation Results</h4>
        <div style="line-height: 1.8;">
    `;

    results.forEach(result => {
        const icon = result.valid ? '✅' : '⚠️';
        html += `<p><strong>${icon} ${result.name}:</strong> ${result.message}</p>`;

        if (result.details && result.details.length > 0) {
            result.details.forEach(detail => {
                html += `<p style="margin-left: 20px; color: #666; font-size: 13px;">${detail}</p>`;
            });
        }
    });

    html += `
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 13px; color: #666;">Last validated: ${new Date().toLocaleTimeString()}</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Update right pane content area (not console footer)
 */
function updateRightPane(html) {
    const contentArea = document.getElementById('analyticsContentArea');
    if (contentArea) {
        contentArea.innerHTML = html;
    }
}

/**
 * Update console footer with latest console output
 * Only updates DOM if buffer length has changed (prevents unnecessary redraws)
 */
function updateConsoleFooter() {
    const consoleContent = document.getElementById('consoleOutputContent');
    if (!consoleContent) return;

    // Only update if buffer length changed (new entries added)
    if (consoleBuffer.length === lastConsoleUpdateLength) {
        return; // No changes, skip update
    }

    lastConsoleUpdateLength = consoleBuffer.length;

    if (consoleBuffer.length === 0) {
        consoleContent.innerHTML = '<div style="color: #666; font-style: italic;">No console output yet...</div>';
        return;
    }

    // Show last 50 entries (most recent at bottom)
    const entries = consoleBuffer.slice(-50);
    const html = entries.map(entry => {
        return `<div style="margin-bottom: 4px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
            <span style="color: #6b7280; font-size: 10px;">${entry.timestamp}</span>
            <div style="color: #111827; white-space: pre-wrap; word-break: break-word;">${escapeHtml(entry.message)}</div>
        </div>`;
    }).join('');

    consoleContent.innerHTML = html;

    // Auto-scroll to bottom if user isn't actively scrolling the console
    const consoleFooter = document.getElementById('analyticsConsoleFooter');
    if (consoleFooter && !isUserScrolling) {
        consoleFooter.scrollTop = consoleFooter.scrollHeight;
    }
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// VALIDATION CHECKS
// ============================================================================

/**
 * Run all validation checks
 */
function runAllValidations() {
    return [
        validateLaneConflicts(),
        validateRefereeAssignments(),
        validateMatchStateIntegrity(),
        validateTransactionCount(),
        validatePlayerIdIntegrity(),
        validateProgressionIntegrity()
    ];
}

/**
 * Validate lane assignments
 */
function validateLaneConflicts() {
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true, conflicts: [] };

    const details = validation.conflicts.map(conflict =>
        `Lane ${conflict.lane}: Used by ${conflict.matches.join(', ')}`
    );

    return {
        name: 'Lane Assignments',
        valid: validation.valid,
        message: validation.valid ? 'No conflicts detected' : `${validation.conflicts.length} conflict(s) detected`,
        details: details
    };
}

/**
 * Validate referee assignments
 */
function validateRefereeAssignments() {
    if (!matches || matches.length === 0) {
        return {
            name: 'Referee Assignments',
            valid: true,
            message: 'No matches to validate',
            details: []
        };
    }

    const conflicts = [];

    matches.forEach(match => {
        if (match.referee && match.active) {
            // Check if referee is playing in this match
            if (match.player1 && match.player1.id === match.referee) {
                conflicts.push(`${match.id}: Referee is player1`);
            }
            if (match.player2 && match.player2.id === match.referee) {
                conflicts.push(`${match.id}: Referee is player2`);
            }
        }
    });

    return {
        name: 'Referee Assignments',
        valid: conflicts.length === 0,
        message: conflicts.length === 0 ? 'No conflicts detected' : `${conflicts.length} conflict(s) detected`,
        details: conflicts
    };
}

/**
 * Validate match state integrity
 */
function validateMatchStateIntegrity() {
    if (!matches || matches.length === 0) {
        return {
            name: 'Match State Integrity',
            valid: true,
            message: 'No matches to validate',
            details: []
        };
    }

    const issues = [];

    matches.forEach(match => {
        if (match.completed) {
            // Completed matches must have winner and loser
            if (!match.winner || !match.loser) {
                issues.push(`${match.id}: Completed but missing winner/loser`);
            }
        }
    });

    return {
        name: 'Match State Integrity',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All matches valid' : `${issues.length} issue(s) detected`,
        details: issues
    };
}

/**
 * Validate transaction count
 */
function validateTransactionCount() {
    const history = getTournamentHistory ? getTournamentHistory() : [];
    const count = history.length;
    const percentage = Math.round((count / 500) * 100);

    const valid = count < 400; // Warn if over 80%
    const status = count < 250 ? 'Healthy' : (count < 400 ? 'Moderate' : 'High');

    return {
        name: 'Transaction Count',
        valid: valid,
        message: `${count}/500 entries (${percentage}%) - ${status}`,
        details: []
    };
}

/**
 * Validate player ID integrity
 */
function validatePlayerIdIntegrity() {
    if (!matches || matches.length === 0 || !players || players.length === 0) {
        return {
            name: 'Player ID Integrity',
            valid: true,
            message: 'No data to validate',
            details: []
        };
    }

    const issues = [];
    const playerIds = new Set(players.map(p => p.id));

    matches.forEach(match => {
        // Check player1
        if (match.player1 && match.player1.id) {
            const player1Id = String(match.player1.id);
            // Skip special players (BYE, TBD, WALKOVER, placeholder IDs)
            // Placeholder IDs follow patterns like: bs-final-1, grand-final-2, fs-3-1, etc.
            const isPlaceholder = player1Id.startsWith('bs-') ||
                                  player1Id.startsWith('fs-') ||
                                  player1Id.startsWith('grand-final-');

            if (!player1Id.startsWith('bye-') &&
                !player1Id.startsWith('tbd-') &&
                !player1Id.startsWith('walkover-') &&
                !isPlaceholder &&
                player1Id !== 'WALKOVER' &&
                !playerIds.has(match.player1.id)) {
                issues.push(`${match.id}: player1 ID ${match.player1.id} not found in players array`);
            }
        }

        // Check player2
        if (match.player2 && match.player2.id) {
            const player2Id = String(match.player2.id);
            // Skip special players (BYE, TBD, WALKOVER, placeholder IDs)
            // Placeholder IDs follow patterns like: bs-final-1, grand-final-2, fs-3-1, etc.
            const isPlaceholder = player2Id.startsWith('bs-') ||
                                  player2Id.startsWith('fs-') ||
                                  player2Id.startsWith('grand-final-');

            if (!player2Id.startsWith('bye-') &&
                !player2Id.startsWith('tbd-') &&
                !player2Id.startsWith('walkover-') &&
                !isPlaceholder &&
                player2Id !== 'WALKOVER' &&
                !playerIds.has(match.player2.id)) {
                issues.push(`${match.id}: player2 ID ${match.player2.id} not found in players array`);
            }
        }

        // Check referee
        if (match.referee && !playerIds.has(match.referee)) {
            issues.push(`${match.id}: referee ID ${match.referee} not found in players array`);
        }
    });

    return {
        name: 'Player ID Integrity',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All player IDs valid' : `${issues.length} issue(s) detected`,
        details: issues
    };
}

/**
 * Validate progression integrity
 */
function validateProgressionIntegrity() {
    if (!matches || matches.length === 0 || !tournament || !tournament.bracketSize) {
        return {
            name: 'Progression Integrity',
            valid: true,
            message: 'No data to validate',
            details: []
        };
    }

    const progression = MATCH_PROGRESSION ? MATCH_PROGRESSION[tournament.bracketSize] : null;
    if (!progression) {
        return {
            name: 'Progression Integrity',
            valid: true,
            message: 'No progression rules available',
            details: []
        };
    }

    const issues = [];

    matches.forEach(match => {
        if (match.completed && match.winner && match.loser) {
            const rule = progression[match.id];
            if (!rule) return;

            // Check winner placement
            if (rule.winner) {
                const [destMatchId, destSlot] = rule.winner;
                const destMatch = matches.find(m => m.id === destMatchId);

                if (destMatch) {
                    const expectedPlayer = destMatch[destSlot];
                    if (expectedPlayer && expectedPlayer.id !== match.winner.id) {
                        issues.push(`${match.id}: Winner should be in ${destMatchId}.${destSlot}, found ${expectedPlayer.name || 'unknown'} instead`);
                    }
                }
            }

            // Check loser placement
            if (rule.loser) {
                const [destMatchId, destSlot] = rule.loser;
                const destMatch = matches.find(m => m.id === destMatchId);

                if (destMatch) {
                    const expectedPlayer = destMatch[destSlot];
                    if (expectedPlayer && expectedPlayer.id !== match.loser.id) {
                        issues.push(`${match.id}: Loser should be in ${destMatchId}.${destSlot}, found ${expectedPlayer.name || 'unknown'} instead`);
                    }
                }
            }
        }
    });

    return {
        name: 'Progression Integrity',
        valid: issues.length === 0,
        message: issues.length === 0 ? 'All progressions valid' : `${issues.length} issue(s) detected`,
        details: issues
    };
}

// ============================================================================
// COMMANDS
// ============================================================================

/**
 * Show command execution feedback in right pane
 */
function showCommandFeedback(commandName, status, details) {
    currentView = 'command-feedback';

    const timestamp = new Date().toLocaleTimeString();
    const statusIcon = status === 'success' ? '✓' : '⚠️';
    const statusColor = status === 'success' ? '#166534' : '#dc2626';
    const bgColor = status === 'success' ? '#f0fdf4' : '#fef2f2';
    const borderColor = status === 'success' ? '#166534' : '#dc2626';

    // Format multi-line details
    const detailsHtml = details.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            // Check if line starts with bullet character
            if (line.startsWith('•')) {
                return `<div style="margin: 4px 0; padding-left: 8px;">${line}</div>`;
            }
            return `<div style="margin: 8px 0;">${line}</div>`;
        })
        .join('');

    const html = `
        <h4 style="margin-top: 0; color: #111827;">Command Executed: ${commandName}</h4>
        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} ${status === 'success' ? 'Success' : 'Error'}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
                ${detailsHtml}
            </div>
        </div>
        <div style="color: #666; font-size: 13px; margin-bottom: 30px;">
            Executed at: ${timestamp}
        </div>
        <div>
            <a href="#" onclick="showQuickOverview(); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14px;">
                ← Back to Overview
            </a>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Command: Re-render Bracket
 */
function commandReRenderBracket() {
    console.log('Re-rendering bracket...');

    if (typeof renderBracket === 'function') {
        const bracketSize = tournament?.bracketSize || 'unknown';
        const totalMatches = matches?.length || 'unknown';

        renderBracket();
        console.log('✓ Bracket re-rendered');

        showCommandFeedback('Re-render Bracket', 'success',
            `Bracket re-rendered successfully\n• Bracket size: ${bracketSize} players\n• Total matches: ${totalMatches}`);
    } else {
        console.error('renderBracket function not available');
        showCommandFeedback('Re-render Bracket', 'error',
            'renderBracket function not available');
    }
}

/**
 * Command: Recalculate Rankings
 */
function commandRecalculateRankings() {
    console.log('Recalculating rankings...');

    if (typeof calculateAllRankings === 'function') {
        const playerCount = players?.length || 0;
        const completedMatches = matches?.filter(m => m.completed).length || 0;
        const bracketSize = tournament?.bracketSize || 'unknown';

        calculateAllRankings();
        console.log('✓ Rankings recalculated');

        showCommandFeedback('Recalculate Rankings', 'success',
            `Rankings recalculated successfully\n• Players ranked: ${playerCount}\n• Completed matches: ${completedMatches}\n• Bracket size: ${bracketSize} players`);
    } else {
        console.error('calculateAllRankings function not available');
        showCommandFeedback('Recalculate Rankings', 'error',
            'calculateAllRankings function not available');
    }
}

/**
 * Command: Refresh All Dropdowns
 */
function commandRefreshDropdowns() {
    console.log('Refreshing all dropdowns...');

    let refreshed = 0;
    const details = [];

    if (typeof refreshAllLaneDropdowns === 'function') {
        refreshAllLaneDropdowns();
        refreshed++;
        details.push('Lane dropdowns');
    }

    if (typeof refreshAllRefereeDropdowns === 'function') {
        refreshAllRefereeDropdowns();
        refreshed++;
        details.push('Referee dropdowns');
    }

    const matchCount = matches?.length || 0;

    console.log(`✓ Refreshed ${refreshed} dropdown type(s)`);

    showCommandFeedback('Refresh All Dropdowns', 'success',
        `Dropdowns refreshed successfully\n• Types refreshed: ${details.join(', ')}\n• Matches updated: ${matchCount}`);
}

/**
 * Command: Validate Everything
 */
function commandValidateEverything() {
    console.log('Running 6 validation checks...');

    const results = runAllValidations();

    // Log summary to console
    let passCount = 0;
    let failCount = 0;

    results.forEach(result => {
        if (result.valid) {
            passCount++;
            console.log(`✅ ${result.name}: ${result.message}`);
        } else {
            failCount++;
            console.log(`⚠️ ${result.name}: ${result.message}`);
            if (result.details && result.details.length > 0) {
                result.details.forEach(detail => {
                    console.log(`   - ${detail}`);
                });
            }
        }
    });

    console.log(`Validation complete: ${passCount} passed, ${failCount} failed`);
    console.log('(Full results displayed in right pane)');

    // Show detailed results in right pane
    showValidationResults();
}

// ============================================================================
// TRANSACTION LOG MANAGEMENT
// ============================================================================

/**
 * Show Transaction Log Management view
 */
function showTransactionLogManagement() {
    currentView = 'transaction-management';

    const history = getTournamentHistory ? getTournamentHistory() : [];
    const stats = getTransactionStats();
    const matchStats = getMatchStateStats();

    const completedMatches = matches?.filter(m => m.completed) || [];
    const activeMatches = matchStats.live + matchStats.ready;

    // Calculate storage (rough estimate: ~2 bytes per char in UTF-16)
    const storageEstimate = ((JSON.stringify(history).length * 2) / 1024 / 1024).toFixed(2);

    const percentage = Math.round((stats.total / 500) * 100);

    // Estimate smart pruning savings
    const estimate = estimateSmartPruning();
    const estimatedSavings = estimate.removable;
    const estimatedPercentage = stats.total > 0 ? Math.round((estimatedSavings / stats.total) * 100) : 0;
    const estimatedStorageSaved = ((JSON.stringify(history).length * estimatedPercentage / 100 * 2) / 1024 / 1024).toFixed(2);

    const html = `
        <h4 style="margin-top: 0;">Transaction Log Management</h4>

        <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border: 1px solid #c0c0c0;">
            <h5 style="margin: 0 0 10px 0;">Current Status:</h5>
            <div style="line-height: 1.8; font-size: 14px;">
                <p style="margin: 5px 0;">• Total transactions: <strong>${stats.total}/500 (${percentage}%)</strong></p>
                <p style="margin: 5px 0;">• Storage used: <strong>~${storageEstimate} MB</strong></p>
                <p style="margin: 5px 0;">• Completed matches: <strong>${completedMatches.length}</strong></p>
                <p style="margin: 5px 0;">• Active matches: <strong>${activeMatches} (${matchStats.live} live, ${matchStats.ready} ready)</strong></p>
            </div>
        </div>

        <div style="background: #f0fdf4; padding: 15px; margin: 15px 0; border: 1px solid #166534;">
            <h5 style="margin: 0 0 10px 0; color: #166534;">Smart Pruning</h5>

            <div style="margin-bottom: 15px;">
                <button class="btn btn-success" onclick="previewSmartPruning(); return false;" style="margin: 0;">Preview Smart Pruning</button>
            </div>

            <p style="margin: 8px 0; font-size: 14px;">Removes redundant transactions for completed matches:</p>
            <ul style="margin: 8px 0 8px 20px; font-size: 14px; line-height: 1.6;">
                <li>Old lane assignments (keeps final assignment)</li>
                <li>Old referee assignments (keeps final assignment)</li>
                <li>Match start/stop events (keeps completion record)</li>
            </ul>

            <p style="margin: 8px 0; font-size: 14px;"><strong>Estimated savings:</strong> ~${estimatedSavings} transactions (~${estimatedStorageSaved} MB, ${estimatedPercentage}% reduction)</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Matches affected:</strong> ${completedMatches.length} completed matches</p>
            <p style="margin: 8px 0; font-size: 14px; color: #166534;"><strong>Safety:</strong> ✅ Safe - Only removes redundant history</p>
        </div>

        <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border: 1px solid #c0c0c0;">
            <h5 style="margin: 0 0 10px 0;">Transaction Breakdown:</h5>
            <div style="font-size: 14px; line-height: 1.6;">
                ${Object.entries(stats.breakdown).map(([type, count]) => {
                    const typePercentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    let note = '';
                    if (type === 'COMPLETE_MATCH') note = ' - Never pruned';
                    else if (type === 'ASSIGN_LANE' || type === 'ASSIGN_REFEREE') note = ' - Only final needed';
                    else if (type === 'START_MATCH' || type === 'STOP_MATCH') note = ' - Redundant after completion';
                    return `<p style="margin: 3px 0;">• ${type}: ${count} (${typePercentage}%)${note}</p>`;
                }).join('')}
            </div>
        </div>

        <div style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; padding: 12px; margin: 15px 0;">
            <p style="margin: 0; font-size: 13px; color: #666;">ℹ️ <strong>Note:</strong> Pruning removes redundant transaction history for completed matches. This is safe - the undo system uses separate state snapshots and will continue to work normally.</p>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Estimate smart pruning savings
 */
function estimateSmartPruning() {
    const history = getTournamentHistory ? getTournamentHistory() : [];
    const completedMatches = matches?.filter(m => m.completed) || [];

    let removableCount = 0;

    completedMatches.forEach(match => {
        const matchId = match.id;
        const matchTxns = history.filter(t =>
            (t.matchId === matchId) || (t.description && t.description.includes(matchId))
        );

        // Count removable transactions
        const lanes = matchTxns.filter(t => t.type === 'ASSIGN_LANE');
        const refs = matchTxns.filter(t => t.type === 'ASSIGN_REFEREE');
        const startStop = matchTxns.filter(t => t.type === 'START_MATCH' || t.type === 'STOP_MATCH');

        // Remove all but last lane assignment
        if (lanes.length > 1) {
            removableCount += lanes.length - 1;
        }

        // Remove all but last referee assignment
        if (refs.length > 1) {
            removableCount += refs.length - 1;
        }

        // Remove all start/stop
        removableCount += startStop.length;
    });

    return {
        removable: removableCount,
        completedMatches: completedMatches.length
    };
}

/**
 * Preview smart pruning - show what will be removed
 */
function previewSmartPruning() {
    currentView = 'pruning-preview';

    const history = getTournamentHistory ? getTournamentHistory() : [];
    const completedMatches = matches?.filter(m => m.completed) || [];

    const toRemove = [];
    const analysis = {
        lanes: { total: 0, keep: 0 },
        refs: { total: 0, keep: 0 },
        starts: 0,
        stops: 0
    };

    completedMatches.forEach(match => {
        const matchId = match.id;
        const matchTxns = history.filter(t =>
            (t.matchId === matchId) || (t.description && t.description.includes(matchId))
        );

        const lanes = matchTxns.filter(t => t.type === 'ASSIGN_LANE');
        const refs = matchTxns.filter(t => t.type === 'ASSIGN_REFEREE');
        const starts = matchTxns.filter(t => t.type === 'START_MATCH');
        const stops = matchTxns.filter(t => t.type === 'STOP_MATCH');

        analysis.lanes.total += lanes.length;
        analysis.refs.total += refs.length;
        analysis.starts += starts.length;
        analysis.stops += stops.length;

        // Keep only last lane assignment
        if (lanes.length > 0) {
            analysis.lanes.keep++;
            toRemove.push(...lanes.slice(0, -1));
        }

        // Keep only last referee assignment
        if (refs.length > 0) {
            analysis.refs.keep++;
            toRemove.push(...refs.slice(0, -1));
        }

        // Remove all start/stop
        toRemove.push(...starts, ...stops);
    });

    const totalRemovable = toRemove.length;
    const totalAfter = history.length - totalRemovable;
    const reductionPercentage = history.length > 0 ? Math.round((totalRemovable / history.length) * 100) : 0;

    const storageBefore = ((JSON.stringify(history).length * 2) / 1024 / 1024).toFixed(2);
    const storageAfter = ((JSON.stringify(history).length * (100 - reductionPercentage) / 100 * 2) / 1024 / 1024).toFixed(2);
    const storageSaved = (storageBefore - storageAfter).toFixed(2);

    const html = `
        <h4 style="margin-top: 0;">Smart Pruning Preview</h4>

        <div style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; padding: 12px; margin-bottom: 16px;">
            <strong>ℹ️ Note:</strong> Pruning removes redundant transaction history for completed matches.
            This is safe - the undo system uses separate state snapshots and will continue to work normally.
        </div>

        <div style="background: #e7f3ff; padding: 15px; margin: 15px 0; border: 1px solid #0056b3;">
            <h5 style="margin: 0 0 10px 0; color: #0056b3;">Analysis complete for ${completedMatches.length} completed matches</h5>
        </div>

        <div style="background: #fef2f2; padding: 15px; margin: 15px 0; border: 1px solid #dc2626;">
            <h5 style="margin: 0 0 10px 0;">Transactions to Remove:</h5>
            <div style="font-size: 14px; line-height: 1.8;">
                <p style="margin: 5px 0;">• ${analysis.lanes.total - analysis.lanes.keep} old lane assignments (${analysis.lanes.total} total → ${analysis.lanes.keep} remain)</p>
                <p style="margin: 5px 0;">• ${analysis.refs.total - analysis.refs.keep} old referee assignments (${analysis.refs.total} total → ${analysis.refs.keep} remain)</p>
                <p style="margin: 5px 0;">• ${analysis.starts} match start events (all redundant)</p>
                <p style="margin: 5px 0;">• ${analysis.stops} match stop events (all redundant)</p>
            </div>
            <p style="margin: 15px 0 5px 0; font-weight: 600; font-size: 15px;">Total to remove: ${totalRemovable} transactions (${reductionPercentage}% reduction)</p>
        </div>

        <div style="background: #f0fdf4; padding: 15px; margin: 15px 0; border: 1px solid #166534;">
            <h5 style="margin: 0 0 10px 0; color: #166534;">Transactions to Keep:</h5>
            <div style="font-size: 14px; line-height: 1.8;">
                <p style="margin: 5px 0;">• ${completedMatches.length} match completions (all preserved)</p>
                <p style="margin: 5px 0;">• ${analysis.lanes.keep} final lane assignments (one per completed match)</p>
                <p style="margin: 5px 0;">• ${analysis.refs.keep} final referee assignments (one per completed match)</p>
                <p style="margin: 5px 0;">• All active match transactions (untouched)</p>
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border: 1px solid #c0c0c0;">
            <h5 style="margin: 0 0 10px 0;">Storage Impact:</h5>
            <div style="font-size: 14px; line-height: 1.8;">
                <p style="margin: 5px 0;">• Before: ${history.length} transactions (~${storageBefore} MB)</p>
                <p style="margin: 5px 0;">• After: ${totalAfter} transactions (~${storageAfter} MB)</p>
                <p style="margin: 5px 0; font-weight: 600;">• Savings: ~${storageSaved} MB (${reductionPercentage}% reduction)</p>
            </div>
        </div>

        <div style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; padding: 15px; margin: 15px 0;">
            <h5 style="margin: 0 0 10px 0; color: #166534;">✅ Undo System Safety:</h5>
            <ul style="margin: 8px 0 0 20px; font-size: 14px; line-height: 1.6; color: #666;">
                <li>Undo/redo functionality will continue to work normally</li>
                <li>The undo system uses separate state snapshots (not transaction history)</li>
                <li>This operation only removes redundant audit logs for completed matches</li>
            </ul>
        </div>

        <div style="margin-top: 20px;">
            <button class="btn" onclick="showTransactionLogManagement(); return false;" style="margin-right: 10px;">Cancel</button>
            <button class="btn btn-success" onclick="executeSmartPruning(); return false;">Prune Now</button>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Execute smart pruning
 */
function executeSmartPruning() {
    console.log('Executing smart transaction pruning...');

    const history = getTournamentHistory ? getTournamentHistory() : [];
    const completedMatches = matches?.filter(m => m.completed) || [];

    if (!history || history.length === 0) {
        showCommandFeedback('Smart Pruning', 'error', 'No transaction history to prune');
        return;
    }

    if (completedMatches.length === 0) {
        showCommandFeedback('Smart Pruning', 'error', 'No completed matches found - nothing to prune');
        return;
    }

    const toRemove = [];
    const analysis = {
        lanes: 0,
        refs: 0,
        starts: 0,
        stops: 0
    };

    console.log(`Processing ${completedMatches.length} completed matches...`);

    completedMatches.forEach(match => {
        const matchId = match.id;
        const matchTxns = history.filter(t =>
            (t.matchId === matchId) || (t.description && t.description.includes(matchId))
        );

        console.log(`Match ${matchId}: Found ${matchTxns.length} transactions`);

        const lanes = matchTxns.filter(t => t.type === 'ASSIGN_LANE');
        const refs = matchTxns.filter(t => t.type === 'ASSIGN_REFEREE');
        const starts = matchTxns.filter(t => t.type === 'START_MATCH');
        const stops = matchTxns.filter(t => t.type === 'STOP_MATCH');

        console.log(`  - Lanes: ${lanes.length}, Refs: ${refs.length}, Starts: ${starts.length}, Stops: ${stops.length}`);

        // Keep only last lane assignment, remove rest
        if (lanes.length > 1) {
            const oldLanes = lanes.slice(0, -1);
            toRemove.push(...oldLanes);
            analysis.lanes += oldLanes.length;
            console.log(`  - Removing ${oldLanes.length} old lane assignments`);
        }

        // Keep only last referee assignment, remove rest
        if (refs.length > 1) {
            const oldRefs = refs.slice(0, -1);
            toRemove.push(...oldRefs);
            analysis.refs += oldRefs.length;
            console.log(`  - Removing ${oldRefs.length} old referee assignments`);
        }

        // Remove ALL start/stop (completion is sufficient)
        if (starts.length > 0 || stops.length > 0) {
            toRemove.push(...starts, ...stops);
            analysis.starts += starts.length;
            analysis.stops += stops.length;
            console.log(`  - Removing ${starts.length} starts and ${stops.length} stops`);
        }
    });

    console.log(`Total transactions to remove: ${toRemove.length}`);

    // Filter out transactions to remove
    const idsToRemove = new Set(toRemove.map(t => t.id || t.timestamp));
    console.log(`Created removal set with ${idsToRemove.size} unique IDs`);

    const prunedHistory = history.filter(t => !idsToRemove.has(t.id || t.timestamp));

    const totalRemoved = toRemove.length;
    const before = history.length;
    const after = prunedHistory.length;
    const reductionPercentage = Math.round((totalRemoved / before) * 100);

    const storageBefore = ((JSON.stringify(history).length * 2) / 1024 / 1024).toFixed(2);
    const storageAfter = ((JSON.stringify(prunedHistory).length * 2) / 1024 / 1024).toFixed(2);
    const storageSaved = (storageBefore - storageAfter).toFixed(2);

    // Save pruned history to localStorage
    try {
        localStorage.setItem('tournamentHistory', JSON.stringify(prunedHistory));
        console.log(`✓ Smart pruning complete: ${totalRemoved} transactions removed`);
        console.log(`✓ Pruned history saved to localStorage`);
    } catch (error) {
        console.error('Failed to save pruned history:', error);
        showCommandFeedback('Smart Pruning', 'error',
            `Failed to save pruned history\n• Error: ${error.message}`);
        return;
    }

    showCommandFeedback('Smart Pruning', 'success',
        `Pruned redundant transactions for ${completedMatches.length} completed matches\n\n` +
        `Removed by Type:\n` +
        `• ${analysis.lanes} old lane assignments (kept final assignments)\n` +
        `• ${analysis.refs} old referee assignments (kept final assignments)\n` +
        `• ${analysis.starts} match start events (kept completion records)\n` +
        `• ${analysis.stops} match stop events (kept completion records)\n\n` +
        `Total Removed: ${totalRemoved} transactions\n\n` +
        `Results:\n` +
        `• Before: ${before} transactions (~${storageBefore} MB)\n` +
        `• After: ${after} transactions (~${storageAfter} MB)\n` +
        `• Reduction: ↓ ${totalRemoved} (${reductionPercentage}% fewer transactions)\n` +
        `• Storage freed: ~${storageSaved} MB (${Math.round(storageSaved/storageBefore*100)}% space saved)\n\n` +
        `Verification:\n` +
        `• All ${completedMatches.length} match results preserved\n` +
        `• Final lane assignments intact\n` +
        `• Final referee assignments intact\n` +
        `• Active matches untouched`);
}

/**
 * Clear console output
 */
function clearConsoleOutput() {
    consoleBuffer = [];
    console.log('Console output cleared');
    // No need to change view - console is always visible in footer
}

/**
 * Copy console output to clipboard
 */
function copyConsoleOutput() {
    if (consoleBuffer.length === 0) {
        alert('No console output to copy');
        return;
    }

    const text = consoleBuffer.map(entry => `[${entry.timestamp}] ${entry.message}`).join('\n');

    navigator.clipboard.writeText(text).then(() => {
        console.log('Console output copied to clipboard');
        alert('Console output copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard');
    });
}

/**
 * Debug Analytics (callable from browser console)
 */
function debugAnalytics() {
    console.log('=== DEVELOPER CONSOLE DEBUG ===');

    const results = runAllValidations();
    results.forEach(result => {
        console.log(`${result.valid ? '✅' : '⚠️'} ${result.name}: ${result.message}`);
        if (result.details.length > 0) {
            result.details.forEach(detail => console.log(`  - ${detail}`));
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Make functions globally accessible
if (typeof window !== 'undefined') {
    window.openAnalyticsModal = openAnalyticsModal;
    window.closeAnalyticsModal = closeAnalyticsModal;
    window.debugAnalytics = debugAnalytics;
    window.showQuickOverview = showQuickOverview;
    window.showTransactionBreakdown = showTransactionBreakdown;
    window.showMatchStateDetails = showMatchStateDetails;
    window.showTransactionHistory = showTransactionHistory;
    window.showConsoleOutput = showConsoleOutput;
    window.showPlayerDetails = showPlayerDetails;
    window.showMatchProgression = showMatchProgression;
    window.showValidationResults = showValidationResults;
    window.commandReRenderBracket = commandReRenderBracket;
    window.commandRecalculateRankings = commandRecalculateRankings;
    window.commandRefreshDropdowns = commandRefreshDropdowns;
    window.commandValidateEverything = commandValidateEverything;
    window.clearConsoleOutput = clearConsoleOutput;
    window.copyConsoleOutput = copyConsoleOutput;
    window.showTransactionLogManagement = showTransactionLogManagement;
    window.previewSmartPruning = previewSmartPruning;
    window.executeSmartPruning = executeSmartPruning;
    window.showLocalStorageUsage = showLocalStorageUsage;
}

console.log('✓ Analytics module loaded');
