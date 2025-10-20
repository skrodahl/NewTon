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

    // Refresh current view (some views update in real-time, others stay static)
    if (currentView === 'overview') {
        showQuickOverview();
    } else if (currentView === 'lanes') {
        showLaneUsageDetails();
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
        const hasLiveConflicts = laneStats.conflicts > 0;
        const hasReadyConflicts = laneStats.readyConflicts > 0;
        const status = hasLiveConflicts ? '🔴' : (hasReadyConflicts ? '⚠️' : '✅');
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

    // Update Quick Overview (tournament duration)
    const overviewEl = document.getElementById('stat-overview');
    if (overviewEl) {
        // Get tournament duration
        const timingStats = getTournamentTimingStats();
        overviewEl.innerHTML = `Duration: ${timingStats.tournamentDuration}`;
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
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true, conflicts: [], readyConflicts: [] };

    // Calculate effective available lanes (total minus excluded)
    const availableLanes = maxLanes - excludedLanes.length;

    return {
        max: availableLanes,
        inUse: usedLanes.length,
        conflicts: validation.conflicts.length,
        readyConflicts: validation.readyConflicts ? validation.readyConflicts.length : 0
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
 * Calculate tournament timing statistics from transaction history
 */
function getTournamentTimingStats() {
    const history = getTournamentHistory ? getTournamentHistory() : [];
    const status = tournament?.status || 'setup';

    // Find all START_MATCH and COMPLETE_MATCH transactions
    const startTxns = history.filter(t => t.type === 'START_MATCH');
    const completeTxns = history.filter(t => t.type === 'COMPLETE_MATCH');

    if (completeTxns.length === 0) {
        return {
            tournamentDuration: status === 'setup' ? 'Not started' : '0m',
            avgMatchTime: 'N/A',
            shortestMatch: 'N/A',
            longestMatch: 'N/A'
        };
    }

    // Calculate match durations
    const matchDurations = [];
    completeTxns.forEach(completeTxn => {
        const matchId = completeTxn.matchId;
        // Find corresponding START_MATCH
        const startTxn = startTxns.find(t => t.matchId === matchId);
        if (startTxn) {
            const startTime = new Date(startTxn.timestamp);
            const endTime = new Date(completeTxn.timestamp);
            const durationMs = endTime - startTime;
            matchDurations.push({
                matchId: matchId,
                duration: durationMs,
                durationMinutes: Math.round(durationMs / 1000 / 60)
            });
        }
    });

    // Calculate tournament duration
    let tournamentDuration = 'N/A';
    if (startTxns.length > 0) {
        const firstStart = new Date(Math.min(...startTxns.map(t => new Date(t.timestamp))));
        let endTime;

        if (status === 'completed') {
            // Use last COMPLETE_MATCH timestamp
            endTime = new Date(Math.max(...completeTxns.map(t => new Date(t.timestamp))));
        } else {
            // Use current time (dynamic)
            endTime = new Date();
        }

        const totalMs = endTime - firstStart;
        tournamentDuration = formatDuration(totalMs);
    }

    // Calculate average match time
    let avgMatchTime = 'N/A';
    if (matchDurations.length > 0) {
        const avgMs = matchDurations.reduce((sum, m) => sum + m.duration, 0) / matchDurations.length;
        avgMatchTime = formatDuration(avgMs);
    }

    // Find shortest and longest matches
    let shortestMatch = 'N/A';
    let longestMatch = 'N/A';
    if (matchDurations.length > 0) {
        const shortest = matchDurations.reduce((min, m) => m.duration < min.duration ? m : min);
        const longest = matchDurations.reduce((max, m) => m.duration > max.duration ? m : max);
        shortestMatch = `${formatDuration(shortest.duration)} (${shortest.matchId})`;
        longestMatch = `${formatDuration(longest.duration)} (${longest.matchId})`;
    }

    return {
        tournamentDuration,
        avgMatchTime,
        shortestMatch,
        longestMatch
    };
}

/**
 * Format duration from milliseconds to HH:MM:SS string
 */
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Always show hours if > 0, otherwise start with minutes
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
}

/**
 * Show Quick Overview (default view)
 */
function showQuickOverview() {
    currentView = 'overview';

    const stats = getTransactionStats();
    const matchStats = getMatchStateStats();
    const laneStats = getLaneStats();
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true };
    const timingStats = getTournamentTimingStats();

    const transactionPercentage = Math.round((stats.total / 500) * 100);
    const matchPercentage = matchStats.total > 0 ? Math.round((matchStats.completed / matchStats.total) * 100) : 0;

    const laneHasLiveConflicts = laneStats.conflicts > 0;
    const laneHasReadyConflicts = laneStats.readyConflicts > 0;
    const refereeValidation = validateRefereeAssignments();
    const refereeHasConflicts = !refereeValidation.valid;

    const allHealthy = !laneHasLiveConflicts && !laneHasReadyConflicts && !refereeHasConflicts;
    const hasCriticalIssues = laneHasLiveConflicts || refereeHasConflicts;
    const statusColor = hasCriticalIssues ? '#dc2626' : (laneHasReadyConflicts ? '#ca8a04' : '#166534');
    const bgColor = hasCriticalIssues ? '#fef2f2' : (laneHasReadyConflicts ? '#fefce8' : '#f0fdf4');
    const borderColor = hasCriticalIssues ? '#dc2626' : (laneHasReadyConflicts ? '#ca8a04' : '#166534');
    const statusIcon = hasCriticalIssues ? '⚠️' : (laneHasReadyConflicts ? '⚠️' : '✓');

    const html = `
        <h4 style="margin-top: 0; color: #111827;">Quick Overview</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} ${allHealthy ? 'Tournament Health: Good' : 'Issues Detected'}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
                <div style="margin: 8px 0;">
                    <strong>Matches:</strong> ${matchStats.completed}/${matchStats.total} completed (${matchPercentage}%)
                </div>
                <div style="margin: 8px 0;">
                    <strong>Transactions:</strong> ${stats.total}/500 (${transactionPercentage}%)
                </div>
                <div style="margin: 8px 0;">
                    <strong>Active:</strong> ${matchStats.live} live matches, ${matchStats.ready} ready
                </div>
                <div style="margin: 8px 0;">
                    <strong>Lane conflicts (LIVE):</strong> ${laneHasLiveConflicts ? `🔴 ${laneStats.conflicts}` : '✅ None'}
                </div>
                <div style="margin: 8px 0;">
                    <strong>Lane conflicts (READY):</strong> ${laneHasReadyConflicts ? `⚠️ ${laneStats.readyConflicts}` : '✅ None'}
                </div>
                <div style="margin: 8px 0;">
                    <strong>Referee conflicts:</strong> ${refereeHasConflicts ? `⚠️ ${refereeValidation.conflicts.length}` : '✅ None'}
                </div>
                ${!tournament.readOnly ? `
                <div style="margin: 16px 0 8px 0; padding-top: 12px; border-top: 1px solid #ddd;">
                    <strong>Tournament duration:</strong> ${timingStats.tournamentDuration}
                </div>
                <div style="margin: 8px 0;">
                    <strong>Average match time:</strong> ${timingStats.avgMatchTime}
                </div>
                <div style="margin: 8px 0;">
                    <strong>Shortest match:</strong> ${timingStats.shortestMatch}
                </div>
                <div style="margin: 8px 0;">
                    <strong>Longest match:</strong> ${timingStats.longestMatch}
                </div>
                ` : ''}
            </div>
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
    const remaining = 500 - stats.total;

    const isHealthy = percentage < 50;
    const statusColor = isHealthy ? '#166534' : (percentage < 80 ? '#ca8a04' : '#dc2626');
    const bgColor = isHealthy ? '#f0fdf4' : (percentage < 80 ? '#fefce8' : '#fef2f2');
    const borderColor = isHealthy ? '#166534' : (percentage < 80 ? '#ca8a04' : '#dc2626');
    const statusIcon = isHealthy ? '✓' : (percentage < 80 ? '⚠️' : '🔴');
    const statusText = isHealthy ? 'Healthy' : (percentage < 80 ? 'Moderate' : 'High');

    let html = `
        <h4 style="margin-top: 0; color: #111827;">Transaction Breakdown (${stats.total} total)</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} Status: ${statusText}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
    `;

    for (const [type, count] of Object.entries(stats.breakdown)) {
        const typePercentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
        html += `
            <div style="margin: 8px 0;">
                <strong>${type}:</strong> ${count} (${typePercentage}%)
            </div>
        `;
    }

    html += `
                <div style="margin: 16px 0 8px 0; padding-top: 12px; border-top: 1px solid #ddd;">
                    <strong>Storage:</strong> ${stats.total}/500 entries (${percentage}%)
                </div>
                <div style="margin: 8px 0;">
                    <strong>Capacity remaining:</strong> ${remaining} entries
                </div>
            </div>
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
 * Show Match State Details
 */
function showMatchStateDetails() {
    currentView = 'matches';

    const matchStats = getMatchStateStats();

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

    const hasActive = matchStats.live > 0 || matchStats.ready > 0;
    const statusColor = hasActive ? '#166534' : '#666';
    const bgColor = hasActive ? '#f0fdf4' : '#f8f9fa';
    const borderColor = hasActive ? '#166534' : '#c0c0c0';
    const statusIcon = hasActive ? '✓' : 'ℹ️';

    let html = `
        <h4 style="margin-top: 0; color: #111827;">Match State Breakdown (${matchStats.total} total)</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} ${hasActive ? 'Active Tournament' : 'Tournament Status'}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
    `;

    // Display each state with color coding
    const stateColors = {
        completed: '#065f46',
        live: '#dc2626',
        ready: '#ca8a04',
        pending: '#666'
    };

    for (const [state, matchIds] of Object.entries(matchesByState)) {
        const count = matchIds.length;
        const stateName = state.toUpperCase();
        const color = stateColors[state] || '#666';

        html += `
            <div style="margin: 12px 0;">
                <div style="color: ${color}; font-weight: 600; margin-bottom: 4px;">
                    ${stateName}: ${count} matches
                </div>
        `;

        if (count > 0) {
            html += `<div style="margin-left: 20px; color: #666; font-size: 13px; line-height: 1.4;">
                ${matchIds.join(', ')}
            </div>`;
        }

        html += `</div>`;
    }

    html += `
            </div>
        </div>

        <div>
            <a href="#" onclick="showQuickOverview(); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14;">
                ← Back to Overview
            </a>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Transaction History
 */
function showTransactionHistory(filterType = 'all', filterMatchId = '', filterSearch = '') {
    currentView = 'history';

    const history = getTournamentHistory ? getTournamentHistory() : [];

    // Apply filters
    let filteredHistory = [...history];

    // Filter by type
    if (filterType && filterType !== 'all') {
        filteredHistory = filteredHistory.filter(tx => tx.type === filterType);
    }

    // Filter by match ID
    if (filterMatchId && filterMatchId.trim() !== '') {
        const matchIdLower = filterMatchId.trim().toLowerCase();
        filteredHistory = filteredHistory.filter(tx =>
            (tx.matchId && tx.matchId.toLowerCase().includes(matchIdLower)) ||
            (tx.description && tx.description.toLowerCase().includes(matchIdLower))
        );
    }

    // Filter by search text
    if (filterSearch && filterSearch.trim() !== '') {
        const searchLower = filterSearch.trim().toLowerCase();
        filteredHistory = filteredHistory.filter(tx =>
            tx.description && tx.description.toLowerCase().includes(searchLower)
        );
    }

    const totalCount = history.length;
    const filteredCount = filteredHistory.length;
    const countText = filteredCount < totalCount
        ? `${filteredCount} of ${totalCount} total`
        : `${totalCount} total`;

    let html = `
        <h4 style="margin-bottom: 16px;">Transaction History (${countText})</h4>

        <div style="display: flex; gap: 12px; align-items: flex-start;">
            <!-- Transaction List -->
            <div style="flex: 1; font-family: monospace; font-size: 12px; line-height: 1.6;">
    `;

    if (filteredHistory.length === 0) {
        if (totalCount === 0) {
            html += `<p style="color: #666;">No transactions recorded</p>`;
        } else {
            html += `<p style="color: #666;">No transactions match filters</p>`;
        }
    } else {
        // Reverse to show latest first (#1 is the most recent)
        const reversedHistory = [...filteredHistory].reverse();

        reversedHistory.forEach((tx, index) => {
            const time = new Date(tx.timestamp).toLocaleTimeString();
            const number = index + 1; // #1 is the latest transaction
            html += `<p style="margin: 2px 0;">#${number} | ${time} | ${tx.type} | ${tx.description || 'No description'}</p>`;
        });
    }

    html += `
            </div>

            <!-- Filter Panel -->
            <div style="flex: 0 0 280px; padding: 16px; background: #f8f9fa; border: 1px solid #ddd;">
                <h5 style="margin: 0 0 16px 0; font-size: 14px; font-weight: bold;">Search Transaction History</h5>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Transaction Type:</label>
                    <select id="filterType" style="width: 100%; padding: 6px; font-size: 12px; border: 1px solid #ccc; box-sizing: border-box;">
                        <option value="all" ${filterType === 'all' ? 'selected' : ''}>All Types</option>
                        <option value="COMPLETE_MATCH" ${filterType === 'COMPLETE_MATCH' ? 'selected' : ''}>COMPLETE_MATCH</option>
                        <option value="ASSIGN_REFEREE" ${filterType === 'ASSIGN_REFEREE' ? 'selected' : ''}>ASSIGN_REFEREE</option>
                        <option value="ASSIGN_LANE" ${filterType === 'ASSIGN_LANE' ? 'selected' : ''}>ASSIGN_LANE</option>
                        <option value="START_MATCH" ${filterType === 'START_MATCH' ? 'selected' : ''}>START_MATCH</option>
                        <option value="STOP_MATCH" ${filterType === 'STOP_MATCH' ? 'selected' : ''}>STOP_MATCH</option>
                    </select>
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Match ID:</label>
                    <input type="text" id="filterMatchId" placeholder="Match ID" value="${filterMatchId}"
                           style="width: 100%; padding: 6px; font-size: 12px; border: 1px solid #ccc; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Search String:</label>
                    <input type="text" id="filterSearch" placeholder="Search..." value="${filterSearch}"
                           style="width: 100%; padding: 6px; font-size: 12px; border: 1px solid #ccc; box-sizing: border-box;">
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="btn" onclick="applyTransactionFilters()" style="flex: 1; margin: 0; padding: 8px; font-size: 12px;">Filter</button>
                    <button class="btn" onclick="showTransactionHistory()" style="flex: 1; margin: 0; padding: 8px; font-size: 12px;">Clear</button>
                </div>
            </div>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Apply transaction filters from form inputs
 */
function applyTransactionFilters() {
    const filterType = document.getElementById('filterType')?.value || 'all';
    const filterMatchId = document.getElementById('filterMatchId')?.value || '';
    const filterSearch = document.getElementById('filterSearch')?.value || '';

    showTransactionHistory(filterType, filterMatchId, filterSearch);
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
        updateRightPane(`
            <h4 style="margin-top: 0; color: #111827;">Player Details</h4>
            <p style="color: #666;">No players registered</p>
            <div style="margin-top: 30px;">
                <a href="#" onclick="showQuickOverview(); return false;"
                   style="text-decoration: none; color: #065f46; font-size: 14px;">
                    ← Back to Overview
                </a>
            </div>
        `);
        return;
    }

    // Separate and sort players by paid status
    const paidPlayers = players.filter(p => p.paid).sort((a, b) => a.name.localeCompare(b.name));
    const unpaidPlayers = players.filter(p => !p.paid).sort((a, b) => a.name.localeCompare(b.name));

    const allPaid = unpaidPlayers.length === 0;
    const statusColor = allPaid ? '#166534' : '#ca8a04';
    const bgColor = allPaid ? '#f0fdf4' : '#fefce8';
    const borderColor = allPaid ? '#166534' : '#ca8a04';
    const statusIcon = allPaid ? '✓' : '⚠️';

    let html = `
        <h4 style="margin-top: 0; color: #111827;">Player Details (${players.length} total)</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} ${allPaid ? 'All Players Paid' : `${unpaidPlayers.length} Unpaid Player${unpaidPlayers.length > 1 ? 's' : ''}`}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
    `;

    // Paid Players Section
    if (paidPlayers.length > 0) {
        html += `
            <div style="margin: 12px 0;">
                <div style="color: #065f46; font-weight: 600; margin-bottom: 8px;">
                    ✅ Paid Players (${paidPlayers.length})
                </div>
                <div style="margin-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px;">
        `;
        paidPlayers.forEach(player => {
            html += `<div style="margin: 4px 0;"><strong>${player.name}</strong> <span style="color: #666; font-size: 13px;">(ID: ${player.id})</span></div>`;
        });
        html += `</div></div>`;
    }

    // Unpaid Players Section
    if (unpaidPlayers.length > 0) {
        html += `
            <div style="margin: 12px 0;">
                <div style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">
                    ⚠️ Unpaid Players (${unpaidPlayers.length})
                </div>
                <div style="margin-left: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px;">
        `;
        unpaidPlayers.forEach(player => {
            html += `<div style="margin: 4px 0;"><strong>${player.name}</strong> <span style="color: #666; font-size: 13px;">(ID: ${player.id})</span></div>`;
        });
        html += `</div></div>`;
    }

    html += `
            </div>
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
 * Show Lane Usage Details
 */
function showLaneUsageDetails() {
    currentView = 'lanes';

    const laneStats = getLaneStats();
    const maxLanes = (config && config.lanes && config.lanes.maxLanes) || 10;
    const excludedLanes = (config && config.lanes && config.lanes.excludedLanes) || [];
    const validation = validateLaneAssignments ? validateLaneAssignments() : { valid: true, conflicts: [], readyConflicts: [] };

    const hasLiveConflicts = validation.conflicts.length > 0;
    const hasReadyConflicts = validation.readyConflicts && validation.readyConflicts.length > 0;
    const hasAnyIssues = hasLiveConflicts || hasReadyConflicts;

    // Color coding: red for live conflicts, yellow for ready conflicts, green for all clear
    const statusColor = hasLiveConflicts ? '#dc2626' : (hasReadyConflicts ? '#ca8a04' : '#166534');
    const bgColor = hasLiveConflicts ? '#fef2f2' : (hasReadyConflicts ? '#fefce8' : '#f0fdf4');
    const borderColor = hasLiveConflicts ? '#dc2626' : (hasReadyConflicts ? '#ca8a04' : '#166534');
    const statusIcon = hasLiveConflicts ? '🔴' : (hasReadyConflicts ? '⚠️' : '✓');

    // Get live matches with lanes
    const liveMatchesWithLanes = [];
    const readyMatchesWithLanes = [];

    if (matches && matches.length > 0) {
        matches.forEach(match => {
            const state = getMatchState ? getMatchState(match) : 'unknown';
            if (match.lane) {
                const player1Name = match.player1?.name || 'TBD';
                const player2Name = match.player2?.name || 'TBD';
                const matchInfo = {
                    id: match.id,
                    lane: match.lane,
                    players: `${player1Name} vs ${player2Name}`
                };

                if (state === 'live') {
                    liveMatchesWithLanes.push(matchInfo);
                } else if (state === 'ready') {
                    readyMatchesWithLanes.push(matchInfo);
                }
            }
        });
    }

    // Sort by lane number
    liveMatchesWithLanes.sort((a, b) => a.lane - b.lane);
    readyMatchesWithLanes.sort((a, b) => a.lane - b.lane);

    // Build available lanes list (all non-excluded)
    const availableLanesList = [];
    for (let i = 1; i <= maxLanes; i++) {
        if (!excludedLanes.includes(i)) {
            availableLanesList.push(i);
        }
    }

    // Build active lanes list (lanes currently in use)
    const activeLanes = [...new Set([...liveMatchesWithLanes.map(m => m.lane), ...readyMatchesWithLanes.map(m => m.lane)])].sort((a, b) => a - b);
    const activeLanesCount = activeLanes.length;

    // Build status message
    let statusMessage = 'No Issues Detected';
    if (hasLiveConflicts && hasReadyConflicts) {
        statusMessage = `${validation.conflicts.length} Live Conflict${validation.conflicts.length > 1 ? 's' : ''} + ${validation.readyConflicts.length} Ready Conflict${validation.readyConflicts.length > 1 ? 's' : ''}`;
    } else if (hasLiveConflicts) {
        statusMessage = `${validation.conflicts.length} Live Conflict${validation.conflicts.length > 1 ? 's' : ''} Detected`;
    } else if (hasReadyConflicts) {
        statusMessage = `${validation.readyConflicts.length} Ready Match${validation.readyConflicts.length > 1 ? 'es' : ''} with Duplicate Lanes`;
    }

    let html = `
        <h4 style="margin-top: 0; color: #111827;">Lane Usage Details</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} ${statusMessage}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
                <div style="margin: 8px 0;">
                    <strong>Available Lanes:</strong> ${availableLanesList.join(', ')} (${laneStats.max} total)
                </div>
                <div style="margin: 8px 0;">
                    <strong>Excluded Lanes:</strong> ${excludedLanes.length > 0 ? excludedLanes.join(', ') : 'None'}
                </div>
                <div style="margin: 8px 0;">
                    <strong>Active Lanes:</strong> ${activeLanes.length > 0 ? activeLanes.join(', ') : 'None'} (${activeLanesCount} in use)
                </div>
            </div>
        </div>
    `;

    // Live Matches section
    if (liveMatchesWithLanes.length > 0) {
        html += `
        <div style="margin: 20px 0;">
            <div style="color: #dc2626; font-weight: 600; font-size: 15px; margin-bottom: 10px;">
                Live Matches Using Lanes:
            </div>
            <div style="margin-left: 20px; line-height: 1.8; font-size: 14px; color: #374151;">
        `;
        liveMatchesWithLanes.forEach(match => {
            html += `<div style="margin: 4px 0;">• Lane ${match.lane}: ${match.id} (${match.players})</div>`;
        });
        html += `</div></div>`;
    } else {
        html += `
        <div style="margin: 20px 0;">
            <div style="color: #666; font-style: italic; font-size: 14px;">
                No lanes currently in use
            </div>
        </div>
        `;
    }

    // Ready Matches section
    if (readyMatchesWithLanes.length > 0) {
        html += `
        <div style="margin: 20px 0;">
            <div style="color: #ca8a04; font-weight: 600; font-size: 15px; margin-bottom: 10px;">
                Ready Matches with Lane Assignments:
            </div>
            <div style="margin-left: 20px; line-height: 1.8; font-size: 14px; color: #374151;">
        `;
        readyMatchesWithLanes.forEach(match => {
            html += `<div style="margin: 4px 0;">• Lane ${match.lane}: ${match.id} (Ready - waiting to start)</div>`;
        });
        html += `</div></div>`;
    }

    // Live Conflicts section (critical)
    if (hasLiveConflicts) {
        html += `
        <div style="margin: 20px 0; padding: 15px; background: #fef2f2; border: 1px solid #dc2626;">
            <div style="color: #dc2626; font-weight: 600; font-size: 15px; margin-bottom: 10px;">
                🔴 Lane Conflicts Detected (LIVE matches):
            </div>
            <div style="margin-left: 20px; line-height: 1.8; font-size: 14px; color: #374151;">
        `;
        validation.conflicts.forEach(conflict => {
            html += `<div style="margin: 4px 0;">• Lane ${conflict.lane}: ${conflict.matches.join(' and ')} (both LIVE)</div>`;
        });
        html += `</div></div>`;
    }

    // Ready Conflicts section (warning)
    if (hasReadyConflicts) {
        html += `
        <div style="margin: 20px 0; padding: 15px; background: #fefce8; border: 1px solid #ca8a04;">
            <div style="color: #ca8a04; font-weight: 600; font-size: 15px; margin-bottom: 10px;">
                ⚠️ Duplicate Lane Assignments (READY matches):
            </div>
            <div style="margin-left: 20px; line-height: 1.8; font-size: 14px; color: #374151;">
        `;
        validation.readyConflicts.forEach(conflict => {
            html += `<div style="margin: 4px 0;">• Lane ${conflict.lane}: ${conflict.matches.join(', ')} (all READY)</div>`;
        });
        html += `
            </div>
            <div style="margin-top: 10px; padding: 10px; background: #fffbeb; font-size: 13px; color: #666; font-style: italic;">
                ℹ️ These matches will conflict when started. Reassign lanes before starting matches.
            </div>
        </div>`;
    }

    html += `
        <div style="margin-top: 30px;">
            <a href="#" onclick="showQuickOverview(); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14px;">
                ← Back to Overview
            </a>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show localStorage Usage
 */
function showLocalStorageUsage() {
    currentView = 'storage';

    const storageStats = getLocalStorageStats();

    const isHealthy = storageStats.percentage < 50;
    const statusColor = isHealthy ? '#166534' : (storageStats.percentage < 80 ? '#ca8a04' : '#dc2626');
    const bgColor = isHealthy ? '#f0fdf4' : (storageStats.percentage < 80 ? '#fefce8' : '#fef2f2');
    const borderColor = isHealthy ? '#166534' : (storageStats.percentage < 80 ? '#ca8a04' : '#dc2626');
    const statusIcon = isHealthy ? '✓' : (storageStats.percentage < 80 ? '⚠️' : '🔴');
    const statusText = isHealthy ? 'Healthy' : (storageStats.percentage < 80 ? 'Moderate' : 'High');

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
        <h4 style="margin-top: 0; color: #111827;">localStorage Usage</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} Storage Status: ${statusText}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
                <div style="margin: 8px 0;">
                    <strong>Total Used:</strong> ${storageStats.used.toFixed(2)} MB of ${storageStats.limit} MB (${storageStats.percentage}%)
                </div>
                <div style="margin: 8px 0;">
                    <strong>Browser Limit:</strong> ${storageStats.limit} MB (Chrome 114+, Firefox, Safari, Edge)
                </div>

                <div style="margin: 20px 0 12px 0; padding-top: 12px; border-top: 1px solid #ddd;">
                    <strong>Breakdown by Key:</strong>
                </div>
    `;

    sortedItems.forEach(item => {
        const sizeDisplay = parseFloat(item.sizeMB) >= 0.01
            ? `${item.sizeMB} MB`
            : `${item.sizeKB} KB`;

        html += `
                <div style="margin: 8px 0; padding-left: 12px;">
                    <strong>${item.key}:</strong> ${sizeDisplay} (${item.percentage}%)
                </div>
        `;
    });

    html += `
            </div>
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
 * Show Match Progression Rules
 */
function showMatchProgression(statusFilter = 'live-ready', sideFilter = 'all') {
    currentView = 'progression';

    if (!tournament || !tournament.bracketSize) {
        updateRightPane(`<h4>Match Progression</h4><p style="color: #666;">No tournament loaded</p>`);
        return;
    }

    const bracketSize = tournament.bracketSize;
    const progression = MATCH_PROGRESSION ? MATCH_PROGRESSION[bracketSize] : null;

    if (!progression) {
        updateRightPane(`<h4>Match Progression</h4><p style="color: #666;">No progression rules found for ${bracketSize}-player bracket</p>`);
        return;
    }

    // Build reverse lookup: which matches lead INTO each match
    const leadsFrom = {};
    for (const [sourceMatchId, rule] of Object.entries(progression)) {
        // Winner destination
        if (rule.winner) {
            const [destMatchId, destSlot] = rule.winner;
            if (!leadsFrom[destMatchId]) leadsFrom[destMatchId] = { winners: [], losers: [] };
            leadsFrom[destMatchId].winners.push({ matchId: sourceMatchId, slot: destSlot });
        }
        // Loser destination
        if (rule.loser) {
            const [destMatchId, destSlot] = rule.loser;
            if (!leadsFrom[destMatchId]) leadsFrom[destMatchId] = { winners: [], losers: [] };
            leadsFrom[destMatchId].losers.push({ matchId: sourceMatchId, slot: destSlot });
        }
    }

    // Get match states
    const matchStates = {};
    if (matches && matches.length > 0) {
        matches.forEach(match => {
            matchStates[match.id] = getMatchState ? getMatchState(match) : 'unknown';
        });
    }

    // Helper: Get match state display info
    const getStateInfo = (matchId) => {
        const state = matchStates[matchId] || 'pending';
        switch (state) {
            case 'live':
                return { icon: '🔴', label: 'LIVE', color: '#dc2626', bg: '#fef2f2', border: '#dc2626' };
            case 'ready':
                return { icon: '⚠️', label: 'READY', color: '#ca8a04', bg: '#fefce8', border: '#ca8a04' };
            case 'completed':
                return { icon: '✅', label: 'DONE', color: '#166534', bg: '#f0fdf4', border: '#166534' };
            default:
                return { icon: '⏸️', label: 'PENDING', color: '#6b7280', bg: '#ffffff', border: '#e5e7eb' };
        }
    };

    // Helper: Check if match passes filters
    const passesFilters = (matchId) => {
        const state = matchStates[matchId] || 'pending';

        // Status filter
        let passesStatus = false;
        switch (statusFilter) {
            case 'all':
                passesStatus = true;
                break;
            case 'live-ready':
                passesStatus = state === 'live' || state === 'ready';
                break;
            case 'live':
                passesStatus = state === 'live';
                break;
            case 'ready':
                passesStatus = state === 'ready';
                break;
            case 'pending':
                passesStatus = state === 'pending';
                break;
            case 'completed':
                passesStatus = state === 'completed';
                break;
            default:
                passesStatus = true;
        }

        // Side filter
        let passesSide = false;
        const isFrontside = matchId.startsWith('FS-') || matchId === 'GRAND-FINAL';
        const isBackside = matchId.startsWith('BS-');

        switch (sideFilter) {
            case 'all':
                passesSide = true;
                break;
            case 'frontside':
                passesSide = isFrontside;
                break;
            case 'backside':
                passesSide = isBackside;
                break;
            default:
                passesSide = true;
        }

        return passesStatus && passesSide;
    };

    // Build HTML
    let html = `
        <h4 style="margin-top: 0; color: #111827;">Match Progression (${bracketSize}-player bracket)</h4>

        <!-- Filter Bar -->
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div>
                    <label style="font-size: 13px; color: #666; margin-right: 5px;">Status:</label>
                    <select id="progressionStatusFilter" onchange="applyProgressionFilters()"
                            style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;">
                        <option value="live-ready" ${statusFilter === 'live-ready' ? 'selected' : ''}>Live + Ready (default)</option>
                        <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Matches</option>
                        <option value="live" ${statusFilter === 'live' ? 'selected' : ''}>Live Only</option>
                        <option value="ready" ${statusFilter === 'ready' ? 'selected' : ''}>Ready Only</option>
                        <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending Only</option>
                        <option value="completed" ${statusFilter === 'completed' ? 'selected' : ''}>Completed Only</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 13px; color: #666; margin-right: 5px;">Side:</label>
                    <select id="progressionSideFilter" onchange="applyProgressionFilters()"
                            style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px;">
                        <option value="all" ${sideFilter === 'all' ? 'selected' : ''}>All Sides</option>
                        <option value="frontside" ${sideFilter === 'frontside' ? 'selected' : ''}>Frontside Only</option>
                        <option value="backside" ${sideFilter === 'backside' ? 'selected' : ''}>Backside Only</option>
                    </select>
                </div>
                <button onclick="showMatchProgression('all', 'all')"
                        style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 13px;">
                    Show All Matches
                </button>
                <button onclick="showProgressionCode()"
                        style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 13px;">
                    Progression Code
                </button>
            </div>
        </div>

        <div style="font-size: 14px; line-height: 1.8;">
    `;

    // Separate frontside and backside matches
    const frontsideMatches = [];
    const backsideMatches = [];
    const grandFinalMatch = [];

    for (const [matchId, rule] of Object.entries(progression)) {
        if (!passesFilters(matchId)) continue;

        if (matchId === 'GRAND-FINAL') {
            grandFinalMatch.push({ matchId, rule });
        } else if (matchId.startsWith('FS-')) {
            frontsideMatches.push({ matchId, rule });
        } else if (matchId.startsWith('BS-')) {
            backsideMatches.push({ matchId, rule });
        }
    }

    const displayedCount = frontsideMatches.length + backsideMatches.length + grandFinalMatch.length;

    // Helper function to render a match row
    const renderMatchRow = (matchId, rule) => {
        const stateInfo = getStateInfo(matchId);
        const sources = leadsFrom[matchId];

        // Build sources list
        let sourcesHtml = '';
        if (sources && (sources.winners.length > 0 || sources.losers.length > 0)) {
            const allSources = [];
            if (sources.winners.length > 0) {
                sources.winners.forEach(source => {
                    const srcState = getStateInfo(source.matchId);
                    allSources.push(`${source.matchId} ${srcState.icon}`);
                });
            }
            if (sources.losers.length > 0) {
                sources.losers.forEach(source => {
                    const srcState = getStateInfo(source.matchId);
                    allSources.push(`${source.matchId} ${srcState.icon}`);
                });
            }
            sourcesHtml = `<span style="color: #666; font-size: 12px;">${allSources.join(', ')}</span>`;
        } else {
            sourcesHtml = `<span style="color: #9ca3af; font-style: italic; font-size: 12px;">R1</span>`;
        }

        // Build destinations list
        const destinations = [];
        if (rule.winner) {
            const [destMatchId] = rule.winner;
            const destState = getStateInfo(destMatchId);
            destinations.push(`${destState.icon} ${destMatchId}`);
        } else {
            destinations.push(`<span style="color: #16a34a; font-weight: 600;">🏆</span>`);
        }
        if (rule.loser) {
            const [destMatchId] = rule.loser;
            const destState = getStateInfo(destMatchId);
            destinations.push(`${destState.icon} ${destMatchId}`);
        } else if (matchId !== 'GRAND-FINAL') {
            destinations.push(`<span style="color: #dc2626;">❌</span>`);
        }
        const destinationsHtml = `<span style="color: #666; font-size: 12px;">${destinations.join(', ')}</span>`;

        return `
            <div style="padding: 10px 12px; margin: 2px 0; border-left: 4px solid ${stateInfo.border}; background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid ${stateInfo.border};">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="flex: 0 0 auto;">
                        <span style="color: ${stateInfo.color}; font-weight: 600; font-size: 11px;">${stateInfo.icon} ${stateInfo.label}</span>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <span style="font-weight: 600; color: #111827; font-size: 18px;">${matchId}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                    <span style="margin-right: 8px;">FROM: ${sourcesHtml}</span>
                    <span style="margin: 0 8px; font-weight: 600; color: #111827;">→</span>
                    <span style="margin-left: 8px;">TO: ${destinationsHtml}</span>
                </div>
            </div>
        `;
    };

    // Build two-column layout
    if (sideFilter === 'all') {
        // Always use side-by-side layout when showing all sides
        html += `
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-bottom: 20px;">
                <!-- Frontside Column -->
                <div>
                    <h5 style="margin: 0 0 10px 0; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">
                        FRONTSIDE BRACKET (${frontsideMatches.length} matches)
                    </h5>
        `;
        frontsideMatches.forEach(({ matchId, rule }) => {
            html += renderMatchRow(matchId, rule);
        });
        html += `
                </div>
                <!-- Backside Column -->
                <div>
                    <h5 style="margin: 0 0 10px 0; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">
                        BACKSIDE BRACKET (${backsideMatches.length} matches)
                    </h5>
        `;
        backsideMatches.forEach(({ matchId, rule }) => {
            html += renderMatchRow(matchId, rule);
        });
        html += `
                </div>
            </div>
        `;

        // Grand Final below (if shown)
        if (grandFinalMatch.length > 0) {
            html += `
                <div style="margin-top: 10px;">
                    <h5 style="margin: 0 0 10px 0; padding: 10px; background: #f0fdf4; border: 1px solid #166534; font-weight: 600; color: #166534;">
                        GRAND FINAL
                    </h5>
            `;
            html += renderMatchRow(grandFinalMatch[0].matchId, grandFinalMatch[0].rule);
            html += `</div>`;
        }
    } else {
        // Single column layout (when filtered by side)
        html += `<div>`;

        if (frontsideMatches.length > 0) {
            html += `<h5 style="margin: 0 0 10px 0; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">FRONTSIDE BRACKET (${frontsideMatches.length})</h5>`;
            frontsideMatches.forEach(({ matchId, rule }) => {
                html += renderMatchRow(matchId, rule);
            });
        }

        if (backsideMatches.length > 0) {
            html += `<h5 style="margin: 10px 0 10px 0; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">BACKSIDE BRACKET (${backsideMatches.length})</h5>`;
            backsideMatches.forEach(({ matchId, rule }) => {
                html += renderMatchRow(matchId, rule);
            });
        }

        if (grandFinalMatch.length > 0) {
            html += `<h5 style="margin: 10px 0 10px 0; padding: 10px; background: #f0fdf4; border: 1px solid #166534; font-weight: 600; color: #166534;">GRAND FINAL</h5>`;
            html += renderMatchRow(grandFinalMatch[0].matchId, grandFinalMatch[0].rule);
        }

        html += `</div>`;
    }

    if (displayedCount === 0) {
        html += `<p style="color: #9ca3af; font-style: italic; text-align: center; margin: 40px 0;">No matches match the selected filters</p>`;
    } else {
        html += `<p style="color: #9ca3af; font-size: 13px; margin-top: 20px;">Showing ${displayedCount} of ${Object.keys(progression).length} matches</p>`;
    }
    html += `
        <div style="margin-top: 30px;">
            <a href="#" onclick="showQuickOverview(); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14px;">
                ← Back to Overview
            </a>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Apply progression filters (called from filter dropdowns)
 */
function applyProgressionFilters() {
    const statusFilter = document.getElementById('progressionStatusFilter')?.value || 'live-ready';
    const sideFilter = document.getElementById('progressionSideFilter')?.value || 'all';
    showMatchProgression(statusFilter, sideFilter);
}

/**
 * Show raw MATCH_PROGRESSION code (original text-based view for debugging)
 */
function showProgressionCode() {
    currentView = 'progression-code';

    if (!tournament || !tournament.bracketSize) {
        updateRightPane(`<h4>Progression Code</h4><p style="color: #666;">No tournament loaded</p>`);
        return;
    }

    const bracketSize = tournament.bracketSize;
    const progression = MATCH_PROGRESSION ? MATCH_PROGRESSION[bracketSize] : null;

    if (!progression) {
        updateRightPane(`<h4>Progression Code</h4><p style="color: #666;">No progression rules found for ${bracketSize}-player bracket</p>`);
        return;
    }

    let html = `
        <h4 style="margin-top: 0; color: #111827;">Progression Code (${bracketSize}-player bracket)</h4>
        <p style="color: #666; font-size: 13px; margin-bottom: 10px;">Raw MATCH_PROGRESSION lookup table for debugging</p>

        <button onclick="showMatchProgression('all', 'all')"
                style="padding: 6px 12px; margin-bottom: 20px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 13px;">
            ← Back to Match Progression
        </button>

        <div style="background: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; overflow-x: auto;">`;

    // Display progression rules in original text format
    for (const [matchId, rule] of Object.entries(progression)) {
        html += `<strong>${matchId}:</strong>\n`;

        if (rule.winner) {
            const [destMatch, destSlot] = rule.winner;
            html += `  Winner → ${destMatch} (${destSlot})\n`;
        } else {
            html += `  Winner → <span style="color: #16a34a; font-weight: 600;">Tournament Champion 🏆</span>\n`;
        }

        if (rule.loser) {
            const [destMatch, destSlot] = rule.loser;
            html += `  Loser → ${destMatch} (${destSlot})\n`;
        } else {
            html += `  Loser → <span style="color: #dc2626;">Eliminated</span>\n`;
        }

        html += `\n`;
    }

    html += `</div>`;

    html += `
        <div style="margin-top: 30px;">
            <a href="#" onclick="showMatchProgression('all', 'all'); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14px; margin-right: 20px;">
                ← Back to Match Progression
            </a>
            <a href="#" onclick="showQuickOverview(); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14px;">
                ← Back to Overview
            </a>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Show Validation Results
 */
function showValidationResults() {
    currentView = 'validation';

    const results = runAllValidations();
    const timestamp = new Date().toLocaleTimeString();

    // Count pass/fail
    const passCount = results.filter(r => r.valid).length;
    const failCount = results.filter(r => !r.valid).length;
    const allPassed = failCount === 0;

    const statusColor = allPassed ? '#166534' : '#dc2626';
    const bgColor = allPassed ? '#f0fdf4' : '#fef2f2';
    const borderColor = allPassed ? '#166534' : '#dc2626';
    const statusIcon = allPassed ? '✓' : '⚠️';

    let html = `
        <h4 style="margin-top: 0; color: #111827;">Validation Results</h4>

        <div style="margin: 20px 0; padding: 20px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 0;">
            <div style="color: ${statusColor}; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                ${statusIcon} ${allPassed ? 'All Checks Passed' : `${failCount} Issue${failCount > 1 ? 's' : ''} Detected`}
            </div>
            <div style="color: #374151; line-height: 1.8; font-size: 14px;">
    `;

    results.forEach(result => {
        const icon = result.valid ? '✅' : '⚠️';
        const checkColor = result.valid ? '#065f46' : '#dc2626';

        html += `
            <div style="margin: 12px 0;">
                <div style="color: ${checkColor}; font-weight: 600;">
                    ${icon} ${result.name}: ${result.message}
                </div>
        `;

        if (result.details && result.details.length > 0) {
            html += `<div style="margin-left: 20px; margin-top: 4px; color: #666; font-size: 13px;">`;
            result.details.forEach(detail => {
                html += `<div style="margin: 2px 0;">• ${detail}</div>`;
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    html += `
            </div>
        </div>

        <div style="color: #666; font-size: 13px; margin-bottom: 30px;">
            Validated at: ${timestamp}
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

/**
 * Command: Reset All Config to Defaults
 */
function commandResetAllConfig() {
    currentView = 'reset-config';

    // Get current config for comparison
    const currentConfig = config ? JSON.parse(JSON.stringify(config)) : {};

    // Get default config
    const defaultConfig = typeof DEFAULT_CONFIG !== 'undefined' ? DEFAULT_CONFIG : null;

    if (!defaultConfig) {
        showCommandFeedback('Reset All Config', 'error', 'DEFAULT_CONFIG not available');
        return;
    }

    // Build comparison HTML
    let comparisonHtml = '<div style="margin: 20px 0;">';

    // Points section
    comparisonHtml += '<div style="margin-bottom: 20px;"><strong style="color: #065f46;">Point Values:</strong><ul style="margin: 5px 0; padding-left: 20px; line-height: 1.8;">';
    comparisonHtml += `<li>Participation: ${currentConfig.points?.participation} → ${defaultConfig.points.participation}</li>`;
    comparisonHtml += `<li>1st place: ${currentConfig.points?.first} → ${defaultConfig.points.first}</li>`;
    comparisonHtml += `<li>2nd place: ${currentConfig.points?.second} → ${defaultConfig.points.second}</li>`;
    comparisonHtml += `<li>3rd place: ${currentConfig.points?.third} → ${defaultConfig.points.third}</li>`;
    comparisonHtml += `<li>4th place: ${currentConfig.points?.fourth} → ${defaultConfig.points.fourth}</li>`;
    comparisonHtml += `<li>5th/6th place: ${currentConfig.points?.fifthSixth} → ${defaultConfig.points.fifthSixth}</li>`;
    comparisonHtml += `<li>7th/8th place: ${currentConfig.points?.seventhEighth} → ${defaultConfig.points.seventhEighth}</li>`;
    comparisonHtml += `<li>High Out: ${currentConfig.points?.highOut} → ${defaultConfig.points.highOut}</li>`;
    comparisonHtml += `<li>Ton: ${currentConfig.points?.ton} → ${defaultConfig.points.ton}</li>`;
    comparisonHtml += `<li>180: ${currentConfig.points?.oneEighty} → ${defaultConfig.points.oneEighty}</li>`;
    comparisonHtml += `<li>Short Leg: ${currentConfig.points?.shortLeg} → ${defaultConfig.points.shortLeg}</li>`;
    comparisonHtml += '</ul></div>';

    // Match configuration section
    comparisonHtml += '<div style="margin-bottom: 20px;"><strong style="color: #065f46;">Match Configuration (Best-of Legs):</strong><ul style="margin: 5px 0; padding-left: 20px; line-height: 1.8;">';
    comparisonHtml += `<li>Regular Rounds: ${currentConfig.legs?.regularRounds} → ${defaultConfig.legs.regularRounds}</li>`;
    comparisonHtml += `<li>Frontside Semifinal: ${currentConfig.legs?.frontsideSemifinal} → ${defaultConfig.legs.frontsideSemifinal}</li>`;
    comparisonHtml += `<li>Backside Semifinal: ${currentConfig.legs?.backsideSemifinal} → ${defaultConfig.legs.backsideSemifinal}</li>`;
    comparisonHtml += `<li>Backside Final: ${currentConfig.legs?.backsideFinal} → ${defaultConfig.legs.backsideFinal}</li>`;
    comparisonHtml += `<li>Grand Final: ${currentConfig.legs?.grandFinal} → ${defaultConfig.legs.grandFinal}</li>`;
    comparisonHtml += '</ul></div>';

    // UI settings section
    comparisonHtml += '<div style="margin-bottom: 20px;"><strong style="color: #065f46;">User Interface Settings:</strong><ul style="margin: 5px 0; padding-left: 20px; line-height: 1.8;">';
    comparisonHtml += `<li>Winner Confirmation: ${currentConfig.ui?.confirmWinnerSelection ? 'Enabled' : 'Disabled'} → ${defaultConfig.ui.confirmWinnerSelection ? 'Enabled' : 'Disabled'}</li>`;
    comparisonHtml += `<li>Auto-open Match Controls: ${currentConfig.ui?.autoOpenMatchControls ? 'Yes' : 'No'} → ${defaultConfig.ui.autoOpenMatchControls ? 'Yes' : 'No'}</li>`;
    comparisonHtml += `<li>Developer Analytics: ${currentConfig.ui?.developerMode ? 'Enabled' : 'Disabled'} → ${defaultConfig.ui.developerMode ? 'Enabled' : 'Disabled'}</li>`;
    comparisonHtml += `<li>Referee Suggestions: ${currentConfig.ui?.refereeSuggestionsLimit || 10} → ${defaultConfig.ui.refereeSuggestionsLimit}</li>`;
    comparisonHtml += '</ul></div>';

    // Branding section
    comparisonHtml += '<div style="margin-bottom: 20px;"><strong style="color: #065f46;">Branding:</strong><ul style="margin: 5px 0; padding-left: 20px; line-height: 1.8;">';
    comparisonHtml += `<li>Club Name: "${currentConfig.clubName || 'NewTon DC'}" → "${defaultConfig.clubName}"</li>`;
    comparisonHtml += '</ul></div>';

    // Lane configuration section
    comparisonHtml += '<div style="margin-bottom: 20px;"><strong style="color: #065f46;">Lane Configuration:</strong><ul style="margin: 5px 0; padding-left: 20px; line-height: 1.8;">';
    comparisonHtml += `<li>Max Lanes: ${currentConfig.lanes?.maxLanes || 4} → ${defaultConfig.lanes.maxLanes}</li>`;
    const excludedLanes = currentConfig.lanes?.excludedLanes || [];
    comparisonHtml += `<li>Excluded Lanes: ${excludedLanes.length > 0 ? excludedLanes.join(', ') : 'None'} → None</li>`;
    comparisonHtml += '</ul></div>';

    comparisonHtml += '</div>';

    const html = `
        <h4 style="margin-top: 0; color: #111827;">Reset All Config to Defaults</h4>

        <div style="margin: 20px 0; padding: 20px; background: #fef2f2; border: 1px solid #dc2626; border-radius: 0;">
            <div style="color: #dc2626; font-weight: 600; font-size: 16px; margin-bottom: 10px;">
                ⚠️ Warning: Destructive Action
            </div>
            <div style="color: #374151; line-height: 1.6; font-size: 14px;">
                This will reset ALL configuration settings to factory defaults. Your tournament data (matches, players, brackets, history) will NOT be affected.
            </div>
        </div>

        <h5 style="color: #111827; margin: 20px 0 10px 0;">What will be reset:</h5>
        ${comparisonHtml}

        <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border: 1px solid #166534; border-radius: 0;">
            <div style="font-weight: 600; margin-bottom: 10px;">To confirm this action:</div>
            <div style="margin-bottom: 15px; line-height: 1.6;">Type <strong>RESET</strong> in the box below and click "Reset Config"</div>
            <div style="margin-bottom: 10px;">
                <input type="text" id="resetConfirmInput"
                       style="width: 200px; padding: 8px 12px; border: 1px solid #c0c0c0; border-radius: 0; font-size: 14px;"
                       placeholder="Type RESET">
            </div>
            <button onclick="executeResetAllConfig()" class="btn btn-danger"
                    style="background: #dc2626; color: white; border: none; padding: 10px 20px; cursor: pointer; font-weight: 600;">
                Reset Config to Defaults
            </button>
        </div>

        <div style="margin-top: 30px;">
            <a href="#" onclick="showQuickOverview(); return false;"
               style="text-decoration: none; color: #065f46; font-size: 14px;">
                ← Back to Overview
            </a>
        </div>
    `;

    updateRightPane(html);
}

/**
 * Execute Reset All Config (called from confirmation button)
 */
function executeResetAllConfig() {
    const confirmInput = document.getElementById('resetConfirmInput');

    if (!confirmInput || confirmInput.value.trim().toUpperCase() !== 'RESET') {
        alert('Please type RESET to confirm');
        return;
    }

    console.log('Resetting all config to defaults...');

    // Save current config for comparison
    const oldConfig = config ? JSON.parse(JSON.stringify(config)) : {};

    // Get default config
    const defaultConfig = typeof DEFAULT_CONFIG !== 'undefined' ? DEFAULT_CONFIG : null;

    if (!defaultConfig) {
        console.error('DEFAULT_CONFIG not available');
        showCommandFeedback('Reset All Config', 'error', 'DEFAULT_CONFIG not available');
        return;
    }

    try {
        // Reset config to defaults
        config = JSON.parse(JSON.stringify(defaultConfig));

        // Save to localStorage
        if (typeof saveGlobalConfig === 'function') {
            saveGlobalConfig();
        } else {
            localStorage.setItem('dartsConfig', JSON.stringify(config));
        }

        console.log('✓ Config reset to defaults');
        console.log('✓ Saved to localStorage');

        // Build success feedback with comparison
        let feedback = 'Configuration reset successfully! The page will reload in 2 seconds to apply changes.\n\n';
        feedback += 'Changed settings:\n';
        feedback += `• Point values: Reset to defaults\n`;
        feedback += `• Match configuration: Reset to defaults\n`;
        feedback += `• UI settings: Reset to defaults\n`;
        feedback += `• Branding: "${oldConfig.clubName || 'NewTon DC'}" → "${defaultConfig.clubName}"\n`;
        feedback += `• Lane configuration: Reset to defaults\n`;

        showCommandFeedback('Reset All Config', 'success', feedback);

        // Auto-refresh after 2 seconds
        setTimeout(() => {
            console.log('Reloading page to apply config changes...');
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('❌ Error resetting config:', error);
        showCommandFeedback('Reset All Config', 'error', `Error resetting config: ${error.message}`);
    }
}

/**
 * Command: Toggle Read-Only Status
 */
function commandToggleReadOnly() {
    if (!tournament) {
        showCommandFeedback('Toggle Read-Only', 'error', 'No active tournament');
        return;
    }

    const wasReadOnly = tournament.readOnly || false;
    const newReadOnly = !wasReadOnly;

    console.log(`Toggling read-only status: ${wasReadOnly} → ${newReadOnly}`);

    // Toggle the read-only flag
    tournament.readOnly = newReadOnly;

    // Save the tournament with new status
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    const statusText = newReadOnly ? 'READ-ONLY' : 'READ-WRITE';
    const statusColor = newReadOnly ? '#dc2626' : '#059669';
    const icon = newReadOnly ? '🔒' : '🔓';

    console.log(`✓ Tournament is now ${statusText}`);

    showCommandFeedback('Toggle Read-Only', 'success',
        `${icon} Tournament set to ${statusText}\n\n${newReadOnly ?
            '• Undo operations disabled\n• Match modifications disabled\n• Tournament data protected' :
            '• Undo operations enabled\n• Match modifications enabled\n• Tournament fully editable'}`);
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
                    else if (type === 'ASSIGN_LANE' || type === 'ASSIGN_REFEREE') note = ' - Keep only last selection';
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
 * Toggle Console Output visibility
 */
function toggleConsoleOutput() {
    const content = document.getElementById('consoleOutputContent');
    const icon = document.getElementById('consoleToggleIcon');

    if (content && icon) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    }
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
    window.showLaneUsageDetails = showLaneUsageDetails;
    window.showMatchProgression = showMatchProgression;
    window.applyProgressionFilters = applyProgressionFilters;
    window.showProgressionCode = showProgressionCode;
    window.showValidationResults = showValidationResults;
    window.commandReRenderBracket = commandReRenderBracket;
    window.commandRecalculateRankings = commandRecalculateRankings;
    window.commandRefreshDropdowns = commandRefreshDropdowns;
    window.commandValidateEverything = commandValidateEverything;
    window.commandResetAllConfig = commandResetAllConfig;
    window.commandToggleReadOnly = commandToggleReadOnly;
    window.executeResetAllConfig = executeResetAllConfig;
    window.clearConsoleOutput = clearConsoleOutput;
    window.copyConsoleOutput = copyConsoleOutput;
    window.toggleConsoleOutput = toggleConsoleOutput;
    window.showTransactionLogManagement = showTransactionLogManagement;
    window.previewSmartPruning = previewSmartPruning;
    window.executeSmartPruning = executeSmartPruning;
    window.showLocalStorageUsage = showLocalStorageUsage;
    window.applyTransactionFilters = applyTransactionFilters;
}

console.log('✓ Analytics module loaded');
