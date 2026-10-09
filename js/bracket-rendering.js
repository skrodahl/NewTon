// bracket-rendering.js - Bracket page entry points, match state helpers, lanes/referees, undo,
// and Match Controls. The bracket itself is drawn by BracketView (js/bracket-view.js).

// Cross-validation helper
const _0x7a = [78,101,119,84,111,110];
const _0x9b = [32,68,67,32,84,111,117,114,110,97,109,101,110,116,32,77,97,110,97,103,101,114];

/**
 * Draw the bracket for the current tournament (both formats, via BracketView), refresh the
 * bracket page header, and check the application signature. Called after every change that
 * affects the bracket.
 * @returns {void}
 */
function renderBracket() {
    const canvas = document.getElementById('bracketCanvas');
    if (!canvas) return;

    BracketView.updateHeader();

    if (!tournament || !tournament.bracket || !BracketView.isActive()) {
        BracketView.deactivate();
        document.getElementById('bracketMatches').innerHTML = '<p style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333;">No bracket generated yet</p>';
        return;
    }

    clearBracket();
    BracketView.render();

    // Verify application identity integrity
    setTimeout(() => {
        const w2 = document.getElementById('tournament-watermark');
        const _check = String.fromCharCode(..._0x7a, ..._0x9b);
        if (w2 && w2.textContent !== _check) {
            w2.textContent = _check;
            console.log('Application configuration restored');
        }
    }, 300);
}

function clearBracket() {
    const matchesContainer = document.getElementById('bracketMatches');
    const linesContainer = document.getElementById('bracketLines');

    if (matchesContainer) {
        matchesContainer.innerHTML = '';
    }
    if (linesContainer) {
        linesContainer.innerHTML = '';
    }

    // Clear progression lines directly added to bracketCanvas (but preserve structure)
    const bracketCanvas = document.getElementById('bracketCanvas');
    if (bracketCanvas) {
        // Remove only direct children that are not the essential containers
        const childNodes = Array.from(bracketCanvas.children);
        childNodes.forEach(child => {
            if (child.id !== 'bracketMatches' && child.id !== 'bracketLines') {
                child.remove();
            }
        });
    }
}

/**
 * Returns a numeric round order for a match ID so later rounds have higher values.
 * Used to determine which is a player's final (elimination) match.
 * @param {string} matchId
 * @returns {number}
 */
function getMatchRoundOrder(matchId) {
    // Groups and cups: group matches first, then each cup's rounds (A-R1-3, A-QF1, A-SF1, A-B, A-F)
    if (typeof Groups !== 'undefined' && Groups.isGroupId(matchId)) return 0;
    if (typeof Groups !== 'undefined' && Groups.isCupId(matchId)) {
        const r = matchId.slice(2);
        return r === 'F' ? 1000 : r === 'B' ? 999 : r.startsWith('SF') ? 30 : r.startsWith('QF') ? 20 : parseInt(r.slice(1)) || 1;
    }
    if (matchId === 'FINAL' || matchId === 'GRAND-FINAL') return 1000;
    if (matchId === 'BRONZE') return 999;
    if (matchId === 'BS-FINAL') return 900;
    const fsParts = matchId.match(/^FS-(\d+)-/);
    if (fsParts) return parseInt(fsParts[1]);
    const bsParts = matchId.match(/^BS-(\d+)-/);
    if (bsParts) return 500 + parseInt(bsParts[1]);
    return 0;
}

/**
 * Returns true if this is the specific match where the player was eliminated
 * (has a placement AND did not appear in any later-round completed match).
 * Works correctly for both SE (placement = only trigger in elimination round) and
 * DE (frontside losers continue to backside, so their strikethrough is on the
 * backside loss, not the earlier frontside loss).
 * @param {object} match - The match object
 * @param {string} playerSlot - 'player1' or 'player2'
 * @returns {boolean}
 */
function isPlayerEliminatedInMatch(match, playerSlot) {
    if (!match.completed) return false;
    const playerObj = match[playerSlot];
    if (!playerObj || !playerObj.name || playerObj.name === 'Walkover') return false;
    if (match.winner?.id === playerObj.id) return false; // winner, not loser
    if (!tournament.placements?.[String(playerObj.id)]) return false; // no placement = still competing
    // Show strikethrough only in the player's LAST completed match.
    // If they appear in any completed match with a higher round order, that is their
    // actual elimination match and this one is not (e.g. DE frontside vs backside).
    const matchOrder = getMatchRoundOrder(match.id);
    // The live global, not tournament.matches — nothing ever assigns that, so it is
    // frozen at whatever it held when the tournament object was built (usually empty).
    // Reading it made this scan find nothing, striking through a player in every match
    // they lost rather than only their elimination.
    const allMatches = (typeof matches !== 'undefined' && Array.isArray(matches)) ? matches : [];
    const eliminatedLater = allMatches.some(m =>
        m.id !== match.id &&
        m.completed &&
        getMatchRoundOrder(m.id) > matchOrder &&
        (m.player1?.id === playerObj.id || m.player2?.id === playerObj.id)
    );
    return !eliminatedLater;
}

// HELPER FUNCTIONS

/**
 * Determines the current state of a match for UI rendering.
 *
 * @param {Match} match - The match object to evaluate
 * @returns {MatchState} 'pending', 'ready', 'live', or 'completed'
 *
 * @description
 * - pending: Waiting for players (TBD slots)
 * - ready: Both players assigned, can start
 * - live: Match in progress (active = true)
 * - completed: Match finished with winner/loser
 */
function getMatchState(match) {
    if (!match) return 'pending';

    if (match.completed) return 'completed';
    if (match.active) return 'live';

    // Check if both players are ready
    if (canMatchStart && canMatchStart(match)) return 'ready';

    return 'pending';
}

function canMatchStart(match) {
    if (!match || !match.player1 || !match.player2) return false;

    const player1Valid = match.player1.name !== 'TBD' && !match.player1.isBye;
    const player2Valid = match.player2.name !== 'TBD' && !match.player2.isBye;

    if (!player1Valid || !player2Valid) return false;

    // SE Final gating: can't start the Final until Bronze is completed
    if (typeof isSEFinalMatch === 'function' && typeof isSEBronzeMatch === 'function' &&
        tournament && tournament.format === 'SE' &&
        isSEFinalMatch(match.id, tournament.bracketSize)) {
        const bronzeMatch = matches.find(m => isSEBronzeMatch(m.id, tournament.bracketSize));
        if (bronzeMatch && !bronzeMatch.completed) {
            return false;
        }
    }

    // Groups and cups: each cup's final waits for its bronze final, as in single elimination
    if (tournament && tournament.format === 'GROUPS' && match.side === 'cup' && /-F$/.test(match.id)) {
        const bronzeMatch = matches.find(m => m.id === `${match.cup}-B`);
        if (bronzeMatch && !bronzeMatch.completed) return false;
    }

    return true;
}

function getButtonClickHandler(matchState, matchId) {
    if (matchState === 'pending' || matchState === 'completed') {
        return '';
    }

    const functionName = typeof toggleActiveWithValidation !== 'undefined' ?
        'toggleActiveWithValidation' : 'toggleActive';
    return `${functionName}('${matchId}')`;
}

// ZOOM — the header's buttons; the bracket view owns the camera

/** Zoom in on the bracket. @returns {void} */
function zoomIn() { BracketView.zoomIn(); }

/** Zoom out on the bracket (never past Fit all). @returns {void} */
function zoomOut() { BracketView.zoomOut(); }

/** Fit the whole bracket (the header's Fit all). @returns {void} */
function resetZoom() { BracketView.fitAll(); }

// --- START: Functions for Referee and Lane Management ---

function getAssignedReferees(excludeMatchId = null) {
    if (!matches || matches.length === 0) return [];
    const assignedReferees = [];
    // Groups and cups: a referee is only taken while the match is live; one chosen for a match that
    // hasn't started is a plan (Match Controls holds the matches that depend on it instead)
    const liveOnly = typeof tournament !== 'undefined' && tournament && tournament.format === 'GROUPS';
    matches.forEach(match => {
        if (excludeMatchId && match.id === excludeMatchId) return;
        if (match.referee && !match.completed && (!liveOnly || match.active)) {
            assignedReferees.push(parseInt(match.referee));
        }
    });
    return assignedReferees;
}

function getPlayersInLiveMatches(excludeMatchId = null) {
    if (!matches || matches.length === 0) return [];
    const playersInLiveMatches = [];
    matches.forEach(match => {
        if (excludeMatchId && match.id === excludeMatchId) return;
        if (getMatchState(match) === 'live') {
            if (match.player1 && match.player1.id && !match.player1.isBye) {
                playersInLiveMatches.push(parseInt(match.player1.id));
            }
            if (match.player2 && match.player2.id && !match.player2.isBye) {
                playersInLiveMatches.push(parseInt(match.player2.id));
            }
        }
    });
    return playersInLiveMatches;
}

function isPlayerAvailableAsReferee(playerId, excludeMatchId = null) {
    const assignedReferees = getAssignedReferees(excludeMatchId);
    const playersInLiveMatches = getPlayersInLiveMatches(excludeMatchId);
    const playerIdInt = parseInt(playerId);
    return !assignedReferees.includes(playerIdInt) && !playersInLiveMatches.includes(playerIdInt);
}

/**
 * Check if a match has referee conflicts (players are refereeing other matches)
 * @param {string} matchId - The match ID to check
 * @returns {Object} - {hasConflict: boolean, player1IsReferee: boolean, player2IsReferee: boolean, conflictedPlayers: string[]}
 */
function checkRefereeConflict(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.player1 || !match.player2) {
        return { hasConflict: false, player1IsReferee: false, player2IsReferee: false, conflictedPlayers: [] };
    }

    const player1Id = match.player1.id;
    const player2Id = match.player2.id;
    let player1IsReferee = false;
    let player2IsReferee = false;
    const conflictedPlayers = [];

    // Groups and cups: only a live match's referee is busy (see getAssignedReferees())
    const liveOnly = tournament && tournament.format === 'GROUPS';
    if (matches && player1Id && player2Id) {
        matches.forEach(m => {
            // Skip the current match - players can referee their own matches
            if (m.id === matchId) return;

            const matchState = getMatchState(m);
            if ((matchState === 'live' || (matchState === 'ready' && !liveOnly)) && m.referee) {
                if (m.referee === player1Id) {
                    player1IsReferee = true;
                    if (!conflictedPlayers.includes(match.player1.name)) {
                        conflictedPlayers.push(match.player1.name);
                    }
                }
                if (m.referee === player2Id) {
                    player2IsReferee = true;
                    if (!conflictedPlayers.includes(match.player2.name)) {
                        conflictedPlayers.push(match.player2.name);
                    }
                }
            }
        });
    }

    return {
        hasConflict: player1IsReferee || player2IsReferee,
        player1IsReferee,
        player2IsReferee,
        conflictedPlayers
    };
}

function updateMatchReferee(matchId, refereeId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return false;

    let parsedRefereeId = null;
    let description;

    if (!refereeId) {
        // Clear referee
        match.referee = null;
        description = `${matchId}: Referee cleared`;
    } else {
        // Assign referee — validate availability first
        const currentRefereeId = match.referee;
        if (refereeId !== currentRefereeId && !isPlayerAvailableAsReferee(refereeId, matchId)) {
            alert('This referee is already assigned to another match or currently playing.');
            // Put the Match Controls dropdown back to the current referee
            const dropdown = document.querySelector(`#cc-match-card-${matchId} select[onchange*="updateMatchReferee"]`);
            if (dropdown) dropdown.value = currentRefereeId || '';
            return false;
        }
        parsedRefereeId = parseInt(refereeId);
        match.referee = parsedRefereeId;

        const referee = players && players.find(p => p.id === parsedRefereeId);
        const refereeName = referee ? referee.name : 'Unknown';
        description = `${matchId}: Referee assigned to ${refereeName} (ID: ${parsedRefereeId})`;
    }

    // Shared path: record the transaction, persist, re-render, refresh Match Controls.
    if (!window.rebuildInProgress && typeof saveTransaction === 'function') {
        saveTransaction({
            id: generateTransactionId(),
            type: 'ASSIGN_REFEREE',
            description: description,
            timestamp: new Date().toISOString(),
            matchId: matchId,
            afterState: { referee: parsedRefereeId } // Keep for referee suggestions timeline
        });
    }

    saveTournament();

    // Re-render the bracket to update referee conflict markers; Match Controls (below)
    // rebuilds its own referee dropdowns
    renderBracket();

    // Refresh Match Controls if it is open
    const modal = document.getElementById('matchCommandCenterModal');
    if (modal &&
        (modal.style.display === 'flex' || modal.style.display === 'block') &&
        typeof showMatchCommandCenter === 'function') {
        setTimeout(() => {
            showMatchCommandCenter();
        }, 200);
    }

    return true;
}

/**
 * Rolls back achievements recorded in a COMPLETE_MATCH transaction from player.stats.
 * Subtracts exactly what the transaction recorded; counters are floored at zero.
 * @param {object} achievements - { [playerId]: { oneEighties, tons, lollipops, highOuts, shortLegs } }
 */
function rollbackAchievements(achievements) {
    if (!achievements) return;
    Object.entries(achievements).forEach(([playerId, stats]) => {
        if (!stats) return;
        const player = players.find(p => String(p.id) === String(playerId));
        if (!player || !player.stats) return;

        if (stats.oneEighties) {
            player.stats.oneEighties = Math.max(0, (player.stats.oneEighties || 0) - stats.oneEighties);
        }
        if (stats.tons) {
            player.stats.tons = Math.max(0, (player.stats.tons || 0) - stats.tons);
        }
        if (stats.lollipops) {
            player.stats.lollipops = Math.max(0, (player.stats.lollipops || 0) - stats.lollipops);
        }
        if (Array.isArray(stats.highOuts)) {
            stats.highOuts.forEach(val => {
                const idx = (player.stats.highOuts || []).indexOf(val);
                if (idx !== -1) player.stats.highOuts.splice(idx, 1);
            });
        }
        if (Array.isArray(stats.shortLegs)) {
            stats.shortLegs.forEach(val => {
                const idx = (player.stats.shortLegs || []).indexOf(val);
                if (idx !== -1) player.stats.shortLegs.splice(idx, 1);
            });
        }
    });
    saveTournament();
    if (typeof updateResultsTable === 'function') updateResultsTable();
    console.log('🏆 Achievement rollback complete');
}

/**
 * Returns a human-readable label for a match's bracket position.
 * @param {string} matchId - e.g. 'FS-1-1', 'BS-2-3', 'GRAND-FINAL', 'BS-FINAL'
 * @returns {string}
 */
function _bracketLabel(matchId) {
    if (typeof getFormat === 'function' && getFormat() === 'GROUPS' && typeof Groups !== 'undefined') return Groups.roundName(matchId);
    if (matchId === 'GRAND-FINAL') return 'Grand Final';
    if (matchId === 'BS-FINAL') return 'Backside Final';
    if (matchId.startsWith('FS-')) return `Frontside Round ${matchId.split('-')[1]}`;
    if (matchId.startsWith('BS-')) return `Backside Round ${matchId.split('-')[1]}`;
    return matchId;
}

/**
 * Builds a consequence match card safely (no innerHTML / no template interpolation of user data).
 */
function _buildUndoMatchCard(id, match, isFrontside) {
    const card = document.createElement('div');
    card.className = 'undo-match-card';

    const header = document.createElement('div');
    header.className = 'undo-match-header';

    const idDiv = document.createElement('div');
    idDiv.className = 'undo-match-id';
    idDiv.textContent = id;
    header.appendChild(idDiv);

    const typeDiv = document.createElement('div');
    typeDiv.className = 'undo-bracket-type';
    if (typeof getFormat === 'function' && getFormat() === 'GROUPS' && typeof Groups !== 'undefined') {
        typeDiv.textContent = Groups.roundName(match);
    } else if (match.id === 'GRAND-FINAL' || match.id === 'BS-FINAL') {
        typeDiv.textContent = match.id;
    } else if (isFrontside) {
        typeDiv.textContent = `⚪ Frontside - Round ${match.id.split('-')[1]}`;
    } else {
        typeDiv.textContent = `⚫ Backside - Round ${match.id.split('-')[1]}`;
    }
    header.appendChild(typeDiv);
    card.appendChild(header);

    const playersDiv = document.createElement('div');
    playersDiv.className = 'undo-match-players';
    const p1 = match.player1?.name || 'TBD';
    const p2 = match.player2?.name || 'TBD';
    playersDiv.textContent = `${p1} vs ${p2}`;
    card.appendChild(playersDiv);

    return card;
}

/**
 * Builds the achievements section safely.
 */
function _buildUndoAchievementsSection(achievements, isQR) {
    const section = document.createElement('div');
    section.className = 'undo-achievements';

    const title = document.createElement('div');
    title.className = 'undo-achievements-title';
    title.textContent = `Recorded achievements for this match${isQR ? ' (Chalker)' : ' (Manual)'}:`;
    section.appendChild(title);

    Object.entries(achievements).forEach(([playerId, stats]) => {
        if (!stats) return;
        const player = players.find(p => String(p.id) === String(playerId));
        const name = player?.name || `Player ${playerId}`;
        const lines = [];
        if (stats.oneEighties) lines.push(`${stats.oneEighties}× 180`);
        if (stats.tons)        lines.push(`${stats.tons}× ton`);
        if (stats.highOuts?.length) lines.push(stats.highOuts.map(v => `high out (${v})`).join(', '));
        if (stats.shortLegs?.length) lines.push(`${stats.shortLegs.length}× short leg`);
        if (stats.lollipops)   lines.push(`${stats.lollipops}× lollipop`);
        if (!lines.length) return;

        const row = document.createElement('div');
        row.className = 'undo-achievement-row';
        const nameBold = document.createElement('strong');
        nameBold.textContent = `${name}:`;
        row.appendChild(nameBold);
        row.appendChild(document.createTextNode(` ${lines.join(', ')}`));
        section.appendChild(row);
    });

    return section;
}

/**
 * Show the undo confirmation modal.
 * @param {object} opts
 * @param {string} opts.matchId - The match being undone (e.g. 'FS-1-1')
 * @param {Array} opts.consequentialMatches - Other matches that will reset
 * @param {object} opts.transaction - The transaction being undone (carries achievements + completionType)
 * @param {Function} opts.onConfirm - Called when "Undo match" is clicked
 * @param {Function|null} [opts.onCancel] - Called when cancelled (button, Esc, or X)
 * @param {Function|null} [opts.onConfirmWithAchievements] - When provided, shows "Undo match + achievements" button
 */
function showUndoConfirmationModal({matchId, consequentialMatches, transaction, onConfirm, onCancel = null, onConfirmWithAchievements = null}) {
    const cancelBtn = document.getElementById('undoConfirmCancel');
    const confirmBtn = document.getElementById('undoConfirmOK');
    const confirmWithAchievementsBtn = document.getElementById('undoConfirmOKWithAchievements');
    const body = document.getElementById('undoConsequences');

    if (!cancelBtn || !confirmBtn || !confirmWithAchievementsBtn || !body) {
        // Never fall through to the destructive action without user confirmation
        console.error('Undo confirmation modal elements not found - undo aborted');
        return;
    }

    // Sidebar — match metadata (safe via textContent)
    const matchObj = matches.find(m => m.id === matchId);
    const p1 = matchObj?.player1?.name || 'TBD';
    const p2 = matchObj?.player2?.name || 'TBD';
    document.getElementById('undoSidebarMatch').textContent = matchId;
    document.getElementById('undoSidebarBracket').textContent = _bracketLabel(matchId);
    document.getElementById('undoSidebarPlayers').textContent = `${p1} vs ${p2}`;

    // Build consequences body safely (no innerHTML / no interpolation of user data)
    body.replaceChildren();

    if (!consequentialMatches || consequentialMatches.length === 0) {
        const noMatches = document.createElement('div');
        noMatches.className = 'undo-no-matches';
        noMatches.textContent = 'No other matches will be affected.';
        body.appendChild(noMatches);
    } else {
        const header = document.createElement('div');
        header.className = 'undo-header';
        header.textContent = `Undoing ${matchId} will reset the following matches:`;
        body.appendChild(header);

        const container = document.createElement('div');
        container.className = 'undo-matches-container';
        consequentialMatches.forEach(({id, match: cMatch, isFrontside}) => {
            container.appendChild(_buildUndoMatchCard(id, cMatch, isFrontside));
        });
        body.appendChild(container);
    }

    // Optional achievements section + info/warning footer line
    const achievements = transaction?.achievements || {};
    const isQR = transaction?.completionType === 'QR';
    const hasAchievements = Object.values(achievements).some(a => a !== null);

    if (hasAchievements) {
        body.appendChild(_buildUndoAchievementsSection(achievements, isQR));
    }

    const footerLine = document.createElement('div');
    if (isQR) {
        footerLine.className = 'undo-achievements-info';
        footerLine.textContent = 'Achievements were recorded automatically from Chalker visit scores.';
    } else {
        footerLine.className = 'undo-achievements-warning';
        footerLine.textContent = '⚠️ Achievements may have been entered manually for these players. Review the leaderboard.';
    }
    body.appendChild(footerLine);

    // Show/hide the "+ achievements" button
    confirmWithAchievementsBtn.style.display = onConfirmWithAchievements ? '' : 'none';

    // Wire buttons + Esc — close via popDialog and fire user callbacks
    const handleEscape = (e) => {
        if (e.key === 'Escape') closeAndCancel();
    };
    const cleanup = () => {
        cancelBtn.onclick = null;
        confirmBtn.onclick = null;
        confirmWithAchievementsBtn.onclick = null;
        document.removeEventListener('keydown', handleEscape);
    };
    const closeAndCancel = () => { cleanup(); popDialog(); if (onCancel) onCancel(); };

    cancelBtn.onclick = closeAndCancel;
    confirmBtn.onclick = () => { cleanup(); popDialog(); onConfirm(); };
    if (onConfirmWithAchievements) {
        confirmWithAchievementsBtn.onclick = () => { cleanup(); popDialog(); onConfirmWithAchievements(); };
    }

    // Show modal (Esc handled manually so it routes through onCancel for debounce cleanup)
    pushDialog('undoConfirmModal', null, false);
    document.addEventListener('keydown', handleEscape);

    // Focus Cancel for safety; inline boxShadow overrides the global outline-none rule
    setTimeout(() => {
        cancelBtn.focus();
        cancelBtn.style.boxShadow = '0 0 0 3px rgba(108, 117, 125, 0.3)';
    }, 100);
}

// --- END: Functions for Referee and Lane Management ---


// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History






/**
 * Refresh all tournament UI components after a state change (like undo).
 */
function refreshTournamentUI() {
    try {
        // Update tournament status display
        if (typeof updateTournamentStatus === 'function') {
            updateTournamentStatus();
        }

        // Update players display and count
        if (typeof updatePlayersDisplay === 'function') {
            updatePlayersDisplay();
        }
        if (typeof updatePlayerCount === 'function') {
            updatePlayerCount();
        }

        // Force re-render bracket
        if (typeof renderBracket === 'function') {
            renderBracket();
        }

        // Update match states  
        if (typeof updateAllMatchStates === 'function') {
            updateAllMatchStates();
        }

        // Update results table
        if (typeof displayResults === 'function') {
            displayResults();
        }

        // Refresh lane dropdowns if available
        if (typeof refreshAllLaneDropdowns === 'function') {
            setTimeout(refreshAllLaneDropdowns, 100);
        }

        // Save tournament
        if (typeof saveTournament === 'function') {
            saveTournament();
        }

    } catch (error) {
        console.error('Error during UI refresh:', error);
    }
}

/**
 * Generate referee dropdown options with conflict detection.
 */
function generateRefereeOptionsWithConflicts(currentMatchId, currentRefereeId = null) {
    let options = '<option value="">No referee</option>';

    if (typeof players !== 'undefined' && Array.isArray(players)) {
        const paidPlayers = players.filter(player => player.paid);
        const sortedPlayers = paidPlayers.sort((a, b) => a.name.localeCompare(b.name));

        const assignedReferees = getAssignedReferees(currentMatchId);
        const playersInLiveMatches = getPlayersInLiveMatches(currentMatchId);

        sortedPlayers.forEach(player => {
            const playerId = parseInt(player.id);
            const isCurrentReferee = currentRefereeId && playerId === parseInt(currentRefereeId);
            const isAssignedElsewhere = assignedReferees.includes(playerId);
            const isInLiveMatch = playersInLiveMatches.includes(playerId);

            if (isCurrentReferee || (!isAssignedElsewhere && !isInLiveMatch)) {
                const selected = isCurrentReferee ? 'selected' : '';
                options += `<option value="${player.id}" ${selected}>${escapeHtml(player.name)}</option>`;
            } else {
                let reason = isAssignedElsewhere ? ' (assigned)' : ' (playing)';
                options += `<option value="${player.id}" disabled style="color: #ccc;">${escapeHtml(player.name)}${reason}</option>`;
            }
        });
    }

    return options;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    
    window.refreshTournamentUI = refreshTournamentUI;
    window.undoCupDraw = undoCupDraw;
    window.undoCupDrawConfirmed = undoCupDrawConfirmed;

    // Original functions needed by HTML
    window.updateMatchReferee = updateMatchReferee;
    window.generateRefereeOptionsWithConflicts = generateRefereeOptionsWithConflicts;
    window.getAssignedReferees = getAssignedReferees;
    window.getPlayersInLiveMatches = getPlayersInLiveMatches;
    window.isPlayerAvailableAsReferee = isPlayerAvailableAsReferee;
    window.checkRefereeConflict = checkRefereeConflict;
}

// --- START: Surgical Undo Implementation ---

/**
 * Finds the downstream matches that block undoing a completed match (6.8).
 *
 * Single source for the "is anything downstream in the way?" scan. Undoing a match
 * un-advances its winner and loser, so it is unsafe once a destination match has
 * started (live) or has a result a human/Chalker entered (MANUAL/QR). An AUTO
 * (walkover) completion downstream does not block — it is re-derivable.
 *
 * Both callers derive their answer from this list rather than repeating the walk:
 * isMatchUndoable() only asks whether it is empty; getDetailedMatchState() turns it
 * into the "Cannot Undo, blocked by ..." status text. The two had byte-identical
 * copies of this scan that had to be kept in lockstep — and both carried the same
 * bug when QR completions were introduced.
 *
 * Does NOT decide undo eligibility on its own: each caller keeps its own read-only,
 * walkover and "has a MANUAL/QR transaction" gates, which differ in what they return.
 *
 * @param {string} matchId - The match ID being considered for undo (e.g., 'FS-1-1')
 * @param {Array<object>} history - Already-loaded transaction history (passed in so
 *   the caller controls the read — the render pass reuses one parsed copy)
 * @returns {Array<{matchId: string, live: boolean}>} Blocking matches in
 *   winner-then-loser order; empty when nothing blocks (including when the
 *   tournament has no progression table or no entry for this match)
 */
function getUndoBlockingMatches(matchId, history) {
    const blockers = [];

    const progressionTable = getProgressionTable();
    if (!tournament || !tournament.bracketSize || !progressionTable) return blockers;

    const progression = progressionTable[matchId];
    if (!progression) return blockers;

    // Check where this match's winner and loser were advanced to
    ['winner', 'loser'].forEach(outcome => {
        if (!progression[outcome]) return;

        const [targetMatchId] = progression[outcome];
        const targetMatch = matches.find(m => m.id === targetMatchId);
        if (!targetMatch) return;

        if (targetMatch.active) {
            blockers.push({ matchId: targetMatchId, live: true });
        } else if (targetMatch.completed) {
            const targetTransaction = history.find(t => t.matchId === targetMatchId && t.type === 'COMPLETE_MATCH');
            if (targetTransaction && (targetTransaction.completionType === 'MANUAL' || targetTransaction.completionType === 'QR')) {
                blockers.push({ matchId: targetMatchId, live: false });
            }
        }
    });

    return blockers;
}

/**
 * Checks if a match can be safely undone without breaking tournament integrity.
 *
 * @param {string} matchId - The match ID to check (e.g., 'FS-1-1', 'BS-2-3')
 * @returns {boolean} True if match can be undone, false otherwise
 *
 * @description
 * A match is undoable only if:
 * - Tournament is not read-only (completed)
 * - Match has a MANUAL completion transaction (not AUTO walkover)
 * - No downstream matches are live or have MANUAL completions
 *
 * Uses DE_MATCH_PROGRESSION to check winner/loser destinations.
 * Prevents undo when it would corrupt manually-entered results or a live match in progress.
 */
function isMatchUndoable(matchId) {
    // Read-only tournaments cannot be undone
    if (tournament && tournament.readOnly) return false;

    // Groups and cups: the group stage is locked once the cups are drawn (undo the cup draw first)
    if (isGroupMatchLocked(matchId)) return false;

    const history = getTournamentHistory();
    if (history.length === 0) return false;

    const match = matches.find(m => m.id === matchId);
    if (!match) {
        return false;
    }

    // MANUAL and QR transactions can be undone; AUTO (walkover/bye) cannot
    const manualTransaction = history.find(t => t.matchId === matchId && (t.completionType === 'MANUAL' || t.completionType === 'QR'));
    if (!manualTransaction) {
        return false; // No undoable transaction found for this match
    }

    // Safe to undo when nothing downstream is live or manually/QR completed
    return getUndoBlockingMatches(matchId, history).length === 0;
}

/**
 * True for a group match of a groups and cups tournament whose cups have been drawn: the cup
 * draw was made from the group tables, so their results are locked (Docs/GROUPS-AND-CUPS.md).
 * @param {string} matchId
 * @returns {boolean}
 */
function isGroupMatchLocked(matchId) {
    if (!tournament || tournament.format !== 'GROUPS' || !tournament.cups) return false;
    const match = matches.find(m => m.id === matchId);
    return !!match && match.side === 'group';
}

/**
 * Whether the cup draw of a groups and cups tournament can be undone: the cups are drawn, the
 * tournament isn't read-only, no cup match is live, and none has a result entered by hand or by the
 * Chalker (round-1 walkovers don't count; they go with the draw).
 * @returns {boolean}
 */
function canUndoCupDraw() {
    if (!tournament || tournament.format !== 'GROUPS' || !tournament.cups || tournament.readOnly) return false;
    const history = getTournamentHistory();
    const cupIds = new Set(matches.filter(m => m.side === 'cup').map(m => m.id));
    if (matches.some(m => cupIds.has(m.id) && m.active)) return false;
    return !history.some(t => t.type === 'COMPLETE_MATCH' && cupIds.has(t.matchId) &&
        (t.completionType === 'MANUAL' || t.completionType === 'QR'));
}

/**
 * Ask, then undo the cup draw (undoCupDrawConfirmed()).
 * @returns {void}
 */
function undoCupDraw() {
    if (!canUndoCupDraw()) return;
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('undoCupsName', tournament.name || '-');
    set('undoCupsA', `${tournament.cups.A.seeds.length} players`);
    set('undoCupsB', tournament.cups.B ? `${tournament.cups.B.seeds.length} players` : 'Not played');
    pushDialog('undoCupDrawModal', null, true);
}

/**
 * Undo the cup draw: remove the cup matches, their transactions (lanes, referees, the round-1
 * walkovers) and the DRAW_CUPS transaction, and forget the draw (tournament.cups). The group stage
 * is open again. Nothing outside the cups changes.
 * @returns {void}
 */
function undoCupDrawConfirmed() {
    popDialog();
    if (!canUndoCupDraw()) return;
    const cupIds = new Set(matches.filter(m => m.side === 'cup').map(m => m.id));
    const history = getTournamentHistory();
    const clean = history.filter(t => t.type !== 'DRAW_CUPS' && !cupIds.has(t.matchId));
    localStorage.setItem(`tournament_${tournament.id}_history`, JSON.stringify(clean));

    // In place: the global array is the live data (saveTournamentOnly() writes it)
    for (let i = matches.length - 1; i >= 0; i--) if (cupIds.has(matches[i].id)) matches.splice(i, 1);
    delete tournament.cups;
    tournament.placements = {};
    console.log(`↩️ Cup draw undone: removed ${cupIds.size} cup matches and ${history.length - clean.length} transactions`);

    if (typeof refreshTournamentUI === 'function') refreshTournamentUI();
    _mcRefresh();
}

// Helper function to find matches that are directly affected by undoing a specific match
// Helper function to collect all matches in walkover chain (including intermediate auto-completed matches)
function collectWalkoverChain(matchId, progression) {
    const chainMatches = [];
    let currentMatchId = matchId;
    let visited = new Set(); // Prevent infinite loops

    while (currentMatchId && !visited.has(currentMatchId)) {
        visited.add(currentMatchId);

        const match = matches.find(m => m.id === currentMatchId);
        if (!match) break;

        // Always add the current match to the chain
        chainMatches.push(currentMatchId);

        // If match has real players or is not a walkover, this is the final destination
        if (!isWalkover(match.player1) && !isWalkover(match.player2)) {
            break;
        }

        // If it's a walkover match, follow the progression chain
        const matchProgression = progression[currentMatchId];
        if (!matchProgression || !matchProgression.winner) {
            break;
        }

        // Follow where the winner of this walkover match goes
        const [nextMatchId] = matchProgression.winner;
        currentMatchId = nextMatchId;
    }

    return chainMatches;
}

/**
 * Finds all matches affected by undoing a transaction.
 * Traces winner and loser paths through walkover chains.
 *
 * @param {Transaction} transaction - The transaction to analyze
 * @returns {Array<{id: string, match: Match, isFrontside: boolean}>} Affected matches sorted by side
 *
 * @description
 * Uses DE_MATCH_PROGRESSION to find:
 * - Winner's destination match and walkover chain
 * - Loser's destination match and walkover chain
 *
 * Returns matches sorted with frontside first, then backside.
 * Used to show user what will be reset before confirming undo.
 */
function getConsequentialMatches(transaction) {
    const consequentialMatches = [];
    const addedMatchIds = new Set(); // Prevent duplicates

    if (!transaction || !tournament || !tournament.bracketSize) {
        return consequentialMatches;
    }

    // Use the correct progression table for the current format (SE or DE)
    const progression = getProgressionTable();
    if (!progression || !progression[transaction.matchId]) {
        return consequentialMatches;
    }

    const matchProgression = progression[transaction.matchId];

    // Add all matches in winner destination chain
    if (matchProgression.winner) {
        const [targetMatchId] = matchProgression.winner;
        // Collect all matches in the walkover chain (including intermediate auto-completed matches)
        const chainMatches = collectWalkoverChain(targetMatchId, progression);
        chainMatches.forEach(matchId => {
            if (!addedMatchIds.has(matchId)) {
                const targetMatch = matches.find(m => m.id === matchId);
                if (targetMatch) {
                    consequentialMatches.push({
                        id: targetMatch.id,
                        match: targetMatch,
                        isFrontside: targetMatch.id.startsWith('FS-')
                    });
                    addedMatchIds.add(matchId);
                }
            }
        });
    }

    // Add all matches in loser destination chain
    if (matchProgression.loser) {
        const [targetMatchId] = matchProgression.loser;
        // Collect all matches in the walkover chain (including intermediate auto-completed matches)
        const chainMatches = collectWalkoverChain(targetMatchId, progression);
        chainMatches.forEach(matchId => {
            if (!addedMatchIds.has(matchId)) {
                const targetMatch = matches.find(m => m.id === matchId);
                if (targetMatch) {
                    consequentialMatches.push({
                        id: targetMatch.id,
                        match: targetMatch,
                        isFrontside: targetMatch.id.startsWith('FS-')
                    });
                    addedMatchIds.add(matchId);
                }
            }
        });
    }

    // Sort: frontside matches first, then backside
    return consequentialMatches.sort((a, b) => {
        if (a.isFrontside && !b.isFrontside) return -1;
        if (!a.isFrontside && b.isFrontside) return 1;
        return 0;
    });
}

/**
 * Subtract recorded achievements from player.stats.
 * Called when operator chooses "Undo match + achievements".
 * Counters are floored at zero. Array fields remove the recorded values.
 * @param {object} achievements - { [playerId]: { oneEighties, tons, highOuts, shortLegs, lollipops } }
 */

// Global debounce state for undo operations
let undoDebounceActive = false;

/**
 * Entry point for undoing a match result. Shows confirmation modal with affected matches.
 *
 * @param {string} matchId - The match ID to undo (e.g., 'FS-1-1', 'BS-2-3')
 * @returns {void}
 *
 * @description
 * 1. Validates tournament is not read-only
 * 2. Applies debounce to prevent rapid clicks
 * 3. Finds MANUAL transaction for this match
 * 4. Calculates consequential matches to show user
 * 5. Shows confirmation modal with match cards
 * 6. On confirm, calls undoManualTransaction()
 *
 * Clears debounce after 1.5s or immediately on cancel.
 */
function handleSurgicalUndo(matchId) {
    // Check if tournament is read-only (completed tournament)
    if (tournament && tournament.readOnly) {
        return; // the bracket's selection bar says "Read only"
    }

    // Debounce: Prevent rapid undo clicks
    if (undoDebounceActive) {
        console.log('⏸️ Undo operation blocked - debounce active');
        return;
    }

    // Activate debounce immediately to prevent multiple undo modals
    undoDebounceActive = true;
    console.log('🔒 Undo debounce activated');

    const history = getTournamentHistory();
    const transaction = history.find(t => t.matchId === matchId &&
        t.type === 'COMPLETE_MATCH' && t.completionType !== 'AUTO');

    if (!transaction) {
        undoDebounceActive = false;
        alert('Could not find a completion for this match in the history to undo.');
        return;
    }

    const consequentialMatches = getConsequentialMatches(transaction);

    const hasAchievements = transaction.achievements &&
        Object.values(transaction.achievements).some(a => a !== null);

    const doUndo = () => {
        undoManualTransaction(transaction.id);
        setTimeout(() => {
            undoDebounceActive = false;
            console.log('🔓 Undo debounce cleared');
        }, 1500);
    };

    const doUndoWithAchievements = () => {
        rollbackAchievements(transaction.achievements);
        undoManualTransaction(transaction.id);
        setTimeout(() => {
            undoDebounceActive = false;
            console.log('🔓 Undo debounce cleared');
        }, 1500);
    };

    showUndoConfirmationModal({
        matchId,
        consequentialMatches,
        transaction,
        onConfirm: doUndo,
        onCancel: () => {
            undoDebounceActive = false;
            console.log('❌ Undo cancelled - debounce cleared');
        },
        onConfirmWithAchievements: hasAchievements ? doUndoWithAchievements : null
    });
}

/**
 * Performs surgical undo by removing transaction and rebuilding affected matches.
 *
 * @param {string} transactionId - The transaction ID to undo (e.g., 'tx_1234567890')
 * @returns {void}
 *
 * @description
 * Surgical undo process:
 * 1. Find all transactions to remove (target + downstream consequences)
 * 2. Remove ALL transactions for affected matches (lanes, refs, starts, completions)
 * 3. Save clean history to localStorage
 * 4. Reset tournament status if undoing GRAND-FINAL
 * 5. Surgically roll back each affected match in place: use the progression
 *    table to remove the advanced winner/loser from their destination slots,
 *    then reset the match itself (completed/winner/loser/active/lane/referee)
 *    while keeping its original players
 * 6. Update all match states and refresh the UI
 * 7. Recalculate rankings, restore 3rd place if BS-FINAL is still completed,
 *    and delete rolled-back matches from NewtonDB
 *
 * Uses DE_MATCH_PROGRESSION for deterministic rollback.
 */
function undoManualTransaction(transactionId) {
    // Check if tournament is read-only (imported completed tournament)
    if (tournament && tournament.readOnly) {
        alert('Completed tournament: Read-only - Use Reset Tournament to modify');
        return;
    }

    const history = getTournamentHistory();
    const targetTransaction = history.find(t => t.id === transactionId);

    if (!targetTransaction) {
        console.error(`Transaction ${transactionId} not found in history`);
        return;
    }

    // 1. Identify transactions to remove: target + all transactions for the match being undone + downstream dependencies
    const transactionsToRemove = [transactionId];

    // Remove ALL transactions for the match being undone (gives it a completely clean slate)
    // This includes: ASSIGN_LANE, ASSIGN_REFEREE, START_MATCH, STOP_MATCH, and the COMPLETE_MATCH
    const targetMatchTransactions = history.filter(t => t.matchId === targetTransaction.matchId);
    targetMatchTransactions.forEach(t => {
        if (!transactionsToRemove.includes(t.id)) {
            transactionsToRemove.push(t.id);
        }
    });

    console.log(`🔍 Undo ${targetTransaction.matchId} - Removing ${targetMatchTransactions.length} transactions for target match`);

    // Find all downstream matches affected by this transaction
    const consequentialMatches = getConsequentialMatches(targetTransaction);

    console.log(`🔍 Undo ${targetTransaction.matchId} - Consequential matches:`, consequentialMatches.map(m => m.id));

    // Remove all transactions for affected downstream matches
    consequentialMatches.forEach(match => {
        const matchTransactions = history.filter(t => t.matchId === match.id);
        matchTransactions.forEach(t => {
            if (!transactionsToRemove.includes(t.id)) {
                transactionsToRemove.push(t.id);
            }
        });
    });

    console.log(`✅ Clean undo ${targetTransaction.matchId}: removing ${transactionsToRemove.length} total transactions`);

    // 2. Check if we're undoing the tournament's terminal match (DE: GRAND-FINAL, SE: final FS round)
    const _undoFormat = getFormat();
    const isUndoingFinal = targetTransaction.matchId === 'GRAND-FINAL' ||
        (_undoFormat === 'SE' && isSEFinalMatch(targetTransaction.matchId, tournament.bracketSize)) ||
        (_undoFormat === 'GROUPS' && tournament.status === 'completed' && /^[AB]-[FB]$/.test(targetTransaction.matchId));

    // 3. Create clean history by removing target + consequences
    const cleanHistory = history.filter(t => !transactionsToRemove.includes(t.id));

    // 4. Save clean history
    if (tournament && tournament.id) {
        const historyKey = `tournament_${tournament.id}_history`;
        localStorage.setItem(historyKey, JSON.stringify(cleanHistory));
    }

    // 5. Reset tournament status if undoing the terminal match
    if (isUndoingFinal && tournament) {
        console.log(`Undoing terminal match ${targetTransaction.matchId}: resetting tournament to active state`);
        tournament.status = 'active';
        tournament.readOnly = false;
        tournament.placements = {}; // Clear final placements
    }

    // 6. Roll back ALL affected matches and remove advancing players from downstream matches
    // Process all transactions being removed (handles auto-advancement chains)
    const progression = getProgressionTable();
    const rolledBackMatchIds = new Set([targetTransaction.matchId]);

    transactionsToRemove.forEach(transactionId => {
        const transaction = history.find(t => t.id === transactionId);
        if (!transaction || !transaction.winner || !transaction.loser) return;

        const match = matches.find(m => m.id === transaction.matchId);
        if (!match) return;

        rolledBackMatchIds.add(transaction.matchId);

        console.log(`🔄 Rolling back ${transaction.matchId} from COMPLETED to READY`);

        // Find where the winner and loser went using hardcoded progression
        if (progression && progression[transaction.matchId]) {
            const matchProgression = progression[transaction.matchId];

            // Remove winner from their destination match
            if (matchProgression.winner) {
                const [winnerDestMatchId, winnerSlot] = matchProgression.winner;
                const winnerDestMatch = matches.find(m => m.id === winnerDestMatchId);
                if (winnerDestMatch) {
                    console.log(`  ➤ Removing winner ${transaction.winner.name} from ${winnerDestMatchId} (${winnerSlot})`);
                    winnerDestMatch[winnerSlot] = { name: 'TBD', id: null };
                }
            }

            // Remove loser from their destination match
            if (matchProgression.loser) {
                const [loserDestMatchId, loserSlot] = matchProgression.loser;
                const loserDestMatch = matches.find(m => m.id === loserDestMatchId);
                if (loserDestMatch) {
                    console.log(`  ➤ Removing loser ${transaction.loser.name} from ${loserDestMatchId} (${loserSlot})`);
                    loserDestMatch[loserSlot] = { name: 'TBD', id: null };
                }
            }
        }

        // Roll back the match itself
        match.completed = false;
        match.winner = null;
        match.loser = null;
        match.active = false;
        match.state = 'READY';
        match.lane = null;
        match.referee = null;
        // Keep original players - they came from upstream completed matches
        console.log(`✅ ${transaction.matchId} rolled back: ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
    });

    // Clear lane/referee on downstream matches that were only pre-assigned (not completed).
    // Their ASSIGN_LANE/ASSIGN_REFEREE transactions were removed in step 1; keep live data in sync.
    consequentialMatches.forEach(({ match }) => {
        if (match.completed) return;
        match.lane = null;
        match.referee = null;
    });

    // 7. Update match states and UI
    updateAllMatchStates();
    if (typeof refreshTournamentUI === 'function') {
        refreshTournamentUI();
    }

    // 8. Refresh results displays after undo
    if (isUndoingFinal && typeof displayResults === 'function') {
        displayResults();
    }

    // Clear stale placements and recalculate rankings after undo
    if (tournament) {
        tournament.placements = {}; // Clear all existing placements
        console.log('🧹 Cleared stale placements before recalculating rankings');
    }
    if (typeof calculateAllRankings === 'function') {
        calculateAllRankings();
    }

    // If BS-FINAL is completed, restore 3rd place (consistent with BS-FINAL completion behavior)
    const bsFinal = matches.find(m => m.id === 'BS-FINAL');
    if (bsFinal && bsFinal.completed && bsFinal.loser && bsFinal.loser.id) {
        if (!tournament.placements) {
            tournament.placements = {};
        }
        tournament.placements[String(bsFinal.loser.id)] = 3;
        console.log(`✓ Restored 3rd place after undo: ${bsFinal.loser.name}`);
    }

    // Save tournament state with updated rankings
    if (typeof saveTournament === 'function') {
        saveTournament();
    }

    // Always refresh results table to show updated rankings after undo
    if (typeof updateResultsTable === 'function') {
        updateResultsTable();
    }

    // Remove rolled-back matches from register (fire-and-forget) — includes
    // consequential matches (e.g. QR-completed downstream results), not just the
    // target, so no orphaned records are left for Analytics to count
    if (typeof NewtonDB !== 'undefined' && tournament && tournament.id) {
        const deletions = [...rolledBackMatchIds].map(rolledBackId => // a Set: spread it first
            NewtonDB.deleteMatch(String(tournament.id), rolledBackId)
                .catch(e => console.warn('NewtonDB deleteMatch failed:', e))
        );

        // Drop Analytics' cached tournament + match lists once the deletes land, so an
        // undo in an unlocked tournament can't leave Analytics counting removed matches
        // (after, not before — invalidating first would let a read in between recache
        // the stale records). Guarded: Analytics may not be loaded.
        Promise.all(deletions).then(() => {
            if (typeof NewtonHistory !== 'undefined' && NewtonHistory.invalidateCache) {
                NewtonHistory.invalidateCache();
            }
        });
    }

    console.log(`Clean undo complete: surgically rolled back ${targetTransaction.matchId}`);
}

// Update match states based on current player composition
function updateAllMatchStates() {
    matches.forEach(match => {
        if (match.completed) {
            match.state = 'COMPLETED';
        } else if (match.player1?.name === 'TBD' || match.player2?.name === 'TBD' ||
                   isWalkover(match.player1) || isWalkover(match.player2)) {
            match.state = 'PENDING';
        } else if (match.player1 && match.player2) {
            match.state = 'READY';
        } else {
            match.state = 'PENDING';
        }
    });
}


// --- END: Surgical Undo Implementation ---

// --- START: Match Command Center Implementation ---

// Helper function to get match format description
function getMatchFormatDescription(match) {
    if (!match.legs) return 'Unknown';
    const legs = match.legs;
    return `Best of ${legs}`;
}

// Helper function to get round description
function getRoundDescription(match) {
    if (typeof getFormat === 'function' && getFormat() === 'GROUPS' && typeof Groups !== 'undefined') return Groups.roundName(match);
    if (typeof Qualifiers !== 'undefined' && Qualifiers.isQualifier(match)) return 'Qualifier';
    if (match.id === 'GRAND-FINAL') return 'Grand Final';
    if (match.id === 'BS-FINAL') return 'Backside Final';

    // SE tournaments: use getSERoundDisplayName for all FS- matches
    const format = typeof getFormat === 'function' ? getFormat() : null;
    if (format === 'SE' && match.id.startsWith('FS-') && typeof getSERoundDisplayName === 'function') {
        const roundNum = parseInt(match.id.split('-')[1]);
        return getSERoundDisplayName(roundNum, tournament?.bracketSize);
    }

    // DE: Check for semifinals
    if (typeof isFrontsideSemifinal === 'function' && isFrontsideSemifinal(match.id, tournament?.bracketSize)) {
        return 'Frontside Semifinal';
    }
    if (typeof isBacksideSemifinal === 'function' && isBacksideSemifinal(match.id, tournament?.bracketSize)) {
        return 'Backside Semifinal';
    }

    // DE: Default round naming
    if (match.id.startsWith('FS-')) {
        const parts = match.id.split('-');
        return `Frontside Round ${parts[1]}`;
    }
    if (match.id.startsWith('BS-')) {
        const parts = match.id.split('-');
        return `Backside Round ${parts[1]}`;
    }

    return 'Match';
}

// --- Match Controls: the lanes board, the ready queue and referees (css/match-controls.css) ---
//
// Drawing only: every action calls the same functions as before (updateMatchLane,
// updateMatchReferee, the Start handler, toggleActive, completeMatchFromCommandCenter, the
// QR and network handover), with the same rules. Each live tile and queue row keeps the id
// `cc-match-card-<id>`, where refreshAllLaneDropdowns()/refreshAllRefereeDropdowns() find
// their dropdowns.

/** Redraw Match Controls if it is open (after an action). */
function _mcRefresh(delay) {
    setTimeout(() => {
        const modal = document.getElementById('matchCommandCenterModal');
        if (modal && (modal.style.display === 'flex' || modal.style.display === 'block')) showMatchCommandCenter();
    }, delay || 100);
}

/** A match number as a side tag (matchIdTag in main.js). */
function _mcTag(id) {
    return typeof matchIdTag === 'function' ? matchIdTag(id) : escapeHtml(id);
}

/**
 * When a live match was started: the latest START_MATCH in the history.
 * @param {string} matchId
 * @returns {number|null} ms
 */
let _mcStarts = null; // matchId → ms of its latest Start, built once per redraw
function _mcStartedAt(matchId) {
    if (!_mcStarts) {
        _mcStarts = {};
        const history = typeof getTournamentHistory === 'function' ? getTournamentHistory() : []; // newest first
        history.forEach(tx => {
            if (tx && tx.type === 'START_MATCH' && !(tx.matchId in _mcStarts)) {
                const t = Date.parse(tx.timestamp);
                if (!isNaN(t)) _mcStarts[tx.matchId] = t;
            }
        });
    }
    return _mcStarts[matchId] || null;
}

/** "14 min" since a start time. */
function _mcSince(ms) {
    if (!ms) return '';
    const min = Math.max(0, Math.floor((Date.now() - ms) / 60000));
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

/** Lanes in use for this tournament: 1..maxLanes, and those excluded in Global Settings. */
function _mcLanes() {
    const max = (config && config.lanes && config.lanes.maxLanes) || 0;
    const excluded = ((config && config.lanes && config.lanes.excludedLanes) || []).map(Number);
    const all = [];
    for (let l = 1; l <= max; l++) all.push(l);
    return { all, excluded, usable: all.filter(l => !excluded.includes(l)) };
}

/** The handover button for a live match: Result ✓ when a Chalker sent one, else QR or Transfer. */
function _mcHandover(match) {
    const handover = typeof getChalkerHandover === 'function' ? getChalkerHandover() : 'qr';
    const waiting = typeof NetworkClient !== 'undefined' && typeof NetworkClient.hasPendingResult === 'function' && NetworkClient.hasPendingResult(match.id);
    if (waiting) return `<button type="button" class="mc-btn mc-sm mc-result" onclick="NetworkClient.reviewResult('${match.id}')" title="A result has arrived from the Chalker: review and accept it">Result ✓</button>`;
    if (handover === 'qr') return `<button type="button" class="mc-btn mc-sm" onclick="openMatchQR('${match.id}')" title="Show the Chalker QR code">QR</button>`;
    if (handover === 'network') {
        return match.lane
            ? `<button type="button" class="mc-btn mc-sm" onclick="transferMatchToDevice('${match.id}')" title="Send this match to the Chalker on Lane ${escapeHtml(String(match.lane))}">Transfer</button>`
            : `<button type="button" class="mc-btn mc-sm" disabled title="Assign a lane to transfer this match">Transfer</button>`;
    }
    return '';
}

/** A player's name with a warning when they are refereeing another match. */
function _mcName(match, n, conflict) {
    const p = match['player' + n];
    const name = escapeHtml(p && p.name ? p.name : 'TBD');
    return conflict[`player${n}IsReferee`] ? `<span class="mc-warnname" title="${name} is refereeing another match">⚠ ${name}</span>` : name;
}

/**
 * A live match as a lane tile: the players as winner buttons, time on the board, lane and
 * referee, the handover, Stop.
 * @param {object} match
 * @returns {string}
 */
function _mcLiveTile(match) {
    const conflict = checkRefereeConflict(match.id);
    const started = _mcStartedAt(match.id);
    const lane = match.lane ? `Lane ${escapeHtml(String(match.lane))}` : 'No lane';
    const win = n => `<button type="button" class="mc-wins" onclick="completeMatchFromCommandCenter('${match.id}', ${n})" title="${escapeHtml((match['player' + n] || {}).name || '')} wins ${match.id}"><b>${_mcName(match, n, conflict)}</b><span>Wins</span></button>`;
    return `<div id="cc-match-card-${match.id}" class="mc-lane mc-on${match.lane ? '' : ' mc-nolane'}">
        <div class="mc-lane-top"><span class="mc-lane-no">${lane}</span>
            <span class="mc-lane-meta">${_mcTag(match.id)}<span>Bo${escapeHtml(String(match.legs || ''))}</span>${started ? `<span class="mc-dotsep">·</span><span class="mc-lane-time" data-mc-started="${started}">${_mcSince(started)}</span>` : ''}</span></div>
        <div class="mc-lane-play">${win(1)}${win(2)}</div>
        <div class="mc-lane-ctl">
            <select class="mc-sel" aria-label="Lane for ${match.id}" onchange="updateMatchLane('${match.id}', this.value);">${generateLaneOptions(match.id, match.lane)}</select>
            <select class="mc-sel" aria-label="Referee for ${match.id}" onchange="updateMatchReferee('${match.id}', this.value);">${generateRefereeOptionsWithConflicts(match.id, match.referee)}</select>
        </div>
        <div class="mc-lane-foot"><span class="mc-round">${escapeHtml(getRoundDescription(match))}</span>
            <span class="mc-acts">${_mcHandover(match)}<button type="button" class="mc-btn mc-sm" onclick="toggleActive('${match.id}'); _mcRefresh();">Stop</button></span></div>
    </div>`;
}

/**
 * A ready match as a queue row: who plays, lane, referee, Start. A referee conflict is said
 * on the row and blocks Start, as before.
 * @param {object} match
 * @returns {string}
 */
function _mcQueueRow(match) {
    const conflict = checkRefereeConflict(match.id);
    const handler = getButtonClickHandler('ready', match.id);
    const who = [1, 2].filter(n => conflict[`player${n}IsReferee`]).map(n => (match['player' + n] || {}).name).filter(Boolean);
    const note = conflict.hasConflict
        ? `<small class="mc-warn">⚠ ${escapeHtml(who.join(' and '))} ${who.length > 1 ? 'are' : 'is'} refereeing another match</small>`
        : `<small>Best of ${escapeHtml(String(match.legs || ''))}</small>`;
    return `<div id="cc-match-card-${match.id}" class="mc-qrow">
        ${_mcTag(match.id)}
        <div class="mc-who"><span><b>${_mcName(match, 1, conflict)}</b><span class="mc-vs">v</span><b>${_mcName(match, 2, conflict)}</b></span>${note}</div>
        <select class="mc-sel" aria-label="Lane for ${match.id}" onchange="updateMatchLane('${match.id}', this.value);">${generateLaneOptions(match.id, match.lane)}</select>
        <select class="mc-sel" aria-label="Referee for ${match.id}" onchange="updateMatchReferee('${match.id}', this.value);">${generateRefereeOptionsWithConflicts(match.id, match.referee)}</select>
        <button type="button" class="mc-btn mc-sm mc-primary" onclick="${handler}; _mcRefresh();"${conflict.hasConflict ? ' disabled' : ''}>Start</button>
    </div>`;
}

/**
 * Put a ready match on a free lane and start it (the free-lane buttons).
 * @param {string} matchId
 * @param {number} lane
 */
function startMatchOnLane(matchId, lane) {
    const match = matches.find(m => m.id === matchId);
    if (!match || getMatchState(match) !== 'ready') return;
    if (String(match.lane || '') !== String(lane)) updateMatchLane(matchId, String(lane));
    const fn = typeof toggleActiveWithValidation === 'function' ? toggleActiveWithValidation : toggleActive;
    fn(matchId);
    _mcRefresh();
}

/** The round heading for a group of ready matches. */
function _mcRoundTitle(key) {
    if (key === 'QUAL') return 'Qualifiers';
    if (key === 'GRAND-FINAL') return 'Grand Final';
    if (key === 'BS-FINAL') return 'Backside Final';
    if (getFormat && getFormat() === 'SE' && key.startsWith('FS-R') && typeof getSERoundDisplayName === 'function') {
        return getSERoundDisplayName(parseInt(key.replace('FS-R', '')), tournament && tournament.bracketSize);
    }
    if (key.startsWith('FS-R')) return `Frontside · Round ${key.replace('FS-R', '')}`;
    if (key.startsWith('BS-R')) return `Backside · Round ${key.replace('BS-R', '')}`;
    return key;
}

/**
 * The running tournament: lanes board (live matches; free lanes on one line), the ready
 * queue by round, and the referees.
 * @param {{live: object[], rounds: Object<string, object[]>}} matchData
 * @returns {string}
 */
function _mcActiveHTML(matchData) {
    if (typeof getFormat === 'function' && getFormat() === 'GROUPS') return _mcGroupsHTML(matchData);
    const isSE = typeof getFormat === 'function' && getFormat() === 'SE';
    const live = matchData.live || [];
    const lanes = _mcLanes();
    const used = new Set(matches.filter(m => !m.completed && m.lane).map(m => String(m.lane)));
    const free = lanes.usable.filter(l => !used.has(String(l)));

    // the order matches are queued in: frontside rounds, then the finals; backside beside
    const order = k => k === 'QUAL' ? 0 : k === 'GRAND-FINAL' ? 90 : k === 'BS-FINAL' ? 91 : parseInt(k.replace(/\D/g, '')) || 50;
    const keys = Object.keys(matchData.rounds || {});
    const front = keys.filter(k => k.startsWith('FS-') || k === 'GRAND-FINAL' || k === 'OTHER' || k === 'QUAL').sort((a, b) => order(a) - order(b));
    const back = keys.filter(k => k.startsWith('BS-') || k === 'BS-FINAL').sort((a, b) => order(a) - order(b));
    const queued = front.concat(back).flatMap(k => matchData.rounds[k]);
    const next = queued.find(m => !checkRefereeConflict(m.id).hasConflict);

    // QR handover: results come back by scanning the Chalker's result code
    const qrMode = typeof getChalkerHandover !== 'function' || getChalkerHandover() === 'qr';
    const scanQR = qrMode && live.length ? ` <button type="button" class="mc-btn mc-sm mc-scan" onclick="openResultQRScanner(null)">Scan QR results</button>` : '';
    const tiles = live.filter(m => m.lane).concat(live.filter(m => !m.lane)).map(_mcLiveTile).join('');
    const freeLine = `<div class="mc-free"><span class="mc-k">Free</span>` +
        (free.length
            ? free.map(l => next
                ? `<button type="button" class="mc-lanechip" onclick="startMatchOnLane('${next.id}', ${l})" title="Start ${next.id} on Lane ${l}">${l}</button>`
                : `<span class="mc-lanechip mc-idle">${l}</span>`).join('')
            : `<span class="mc-none">${lanes.usable.length ? 'No free lanes' : 'No lanes set up'}</span>`) +
        (next && free.length ? `<span class="mc-next">Next up: ${_mcTag(next.id)} ${escapeHtml(next.player1.name)} v ${escapeHtml(next.player2.name)}<em>click a free lane to start it there</em></span>` : '') +
        (lanes.excluded.length ? `<span class="mc-off">Not in use: ${lanes.excluded.join(', ')}</span>` : '') +
        `</div>`;

    const group = k => `<div class="mc-qround"><span>${escapeHtml(_mcRoundTitle(k))}</span><span>${matchData.rounds[k].length} ready</span></div>` +
        matchData.rounds[k].slice().sort((a, b) => (a.side === 'qualifier' ? a.positionInRound : parseInt(a.id.split('-')[2]) || 0) - (b.side === 'qualifier' ? b.positionInRound : parseInt(b.id.split('-')[2]) || 0)).map(_mcQueueRow).join('');
    const column = (ks, empty) => ks.length ? ks.map(group).join('') : `<div class="mc-qempty">${empty}</div>`;
    const queue = isSE
        ? `<div class="mc-qcols mc-one"><div class="mc-qcol">${column(front, 'Nothing ready to start.')}</div></div>`
        : `<div class="mc-qcols"><div class="mc-qcol">${column(front, 'Nothing ready on the frontside.')}</div><div class="mc-qcol">${column(back, 'Nothing ready on the backside.')}</div></div>`;

    return `<div class="mc-col">
        <section class="mc-panel"><div class="mc-ph"><h3>Lanes<small>${live.length} live · ${free.length} free</small></h3><span class="mc-hint">Click the winner to finish a match${scanQR}</span></div>
            ${freeLine}${tiles ? `<div class="mc-lanes">${tiles}</div>` : '<div class="mc-qempty">No matches being played.</div>'}</section>
        <section class="mc-panel"><div class="mc-ph"><h3>Ready to start<small>${queued.length}</small></h3><span class="mc-hint">Lane and referee are optional</span></div>${queue}</section>
    </div>
    <div class="mc-col">${_mcRefereesHTML(live)}</div>`;
}

// --- Match Controls: groups and cups (Docs/GROUPS-AND-CUPS.md) ---
//
// The same lanes board, queue rows, referee controls and Start as the brackets, by stage: the
// group stage (the queue by group, planned referees, the group tables), the Draw the cups step once
// every group match is played, and the cups (A and B side by side, as frontside and backside).

/** Play the B cup: the Draw the cups switch, kept for the tournament while Match Controls redraws. */
let _mcPlayB = { tid: null, on: true };

/**
 * The names of a match's players who are playing another match right now (a group stage only).
 * @param {object} match
 * @returns {string[]}
 */
function _mcBusyPlayers(match) {
    const playing = getPlayersInLiveMatches(match.id);
    return [match.player1, match.player2].filter(p => p && playing.includes(parseInt(p.id))).map(p => p.name);
}

/**
 * Can this match start now: both players free and no referee conflict.
 * @param {object} match
 * @returns {boolean}
 */
const _mcCanStart = match => !_mcBusyPlayers(match).length && !checkRefereeConflict(match.id).hasConflict && !Groups.holdFor(match) && !_mcRefereeBusy(match);

/**
 * The referee chosen for a match who can't take it now (playing, or refereeing a live match), or null.
 * @param {object} match
 * @returns {object|null} the player
 */
function _mcRefereeBusy(match) {
    if (!match.referee || isPlayerAvailableAsReferee(match.referee, match.id)) return null;
    return players.find(p => String(p.id) === String(match.referee)) || null;
}

/**
 * A queue row for a groups and cups match: as _mcQueueRow(), with the planned referee chosen in
 * the referee control (filled in at Start when free), and Start held back while a player is on
 * another board.
 * @param {object} match
 * @returns {string}
 */
function _mcPlanRow(match) {
    const conflict = checkRefereeConflict(match.id);
    const busy = _mcBusyPlayers(match);
    const planned = match.referee ? null : Groups.plannedRefereeFor(match);
    const shownRef = match.referee || (planned ? planned.id : null);
    const refBusy = planned && !isPlayerAvailableAsReferee(planned.id, match.id);
    const confl = [1, 2].filter(n => conflict[`player${n}IsReferee`]).map(n => (match['player' + n] || {}).name).filter(Boolean);
    const plan = !match.referee && !planned ? Groups.plannedRefereeText(match) : '';
    const hold = Groups.holdFor(match);
    const chosenBusy = _mcRefereeBusy(match);
    let note = `<small>Best of ${escapeHtml(String(match.legs || ''))}${plan ? ` · ref: ${escapeHtml(plan)}` : ''}</small>`;
    if (busy.length) note = `<small class="mc-warn">${escapeHtml(busy.join(' and '))} ${busy.length > 1 ? 'are' : 'is'} playing: wait</small>`;
    else if (conflict.hasConflict) note = `<small class="mc-warn">⚠ ${escapeHtml(confl.join(' and '))} ${confl.length > 1 ? 'are' : 'is'} refereeing a live match</small>`;
    else if (hold) note = `<small class="mc-wait">Waits: ${escapeHtml(hold)}, or choose another referee</small>`;
    else if (chosenBusy) note = `<small class="mc-warn">Referee ${escapeHtml(chosenBusy.name)} is busy: change, or wait</small>`;
    else if (refBusy) note = `<small class="mc-warn">Referee ${escapeHtml(planned.name)} is busy: change, or wait</small>`;
    const handler = getButtonClickHandler('ready', match.id);
    return `<div id="cc-match-card-${match.id}" class="mc-qrow">
        ${_mcTag(match.id)}
        <div class="mc-who"><span><b>${_mcName(match, 1, conflict)}</b><span class="mc-vs">v</span><b>${_mcName(match, 2, conflict)}</b></span>${note}</div>
        <select class="mc-sel" aria-label="Lane for ${match.id}" onchange="updateMatchLane('${match.id}', this.value);">${generateLaneOptions(match.id, match.lane)}</select>
        <select class="mc-sel" aria-label="Referee for ${match.id}" onchange="updateMatchReferee('${match.id}', this.value);">${generateRefereeOptionsWithConflicts(match.id, shownRef)}</select>
        <button type="button" class="mc-btn mc-sm mc-primary" onclick="${handler}; _mcRefresh();"${busy.length || conflict.hasConflict || hold || chosenBusy ? ' disabled' : ''}>Start</button>
    </div>`;
}

/**
 * The group tables, compact, for Match Controls' right column: place, name, won–lost and leg
 * difference, the top two marked for the A cup. Before the cups are drawn, a player level with the
 * one above on everything gets ▲ (the operator decides the tie, Groups.moveUp()).
 * @returns {string}
 */
function _mcGroupTablesHTML() {
    const canMove = !tournament.cups && !tournament.readOnly;
    const single = Groups.isSingle();
    const half = Groups.settings().cupEntry === 'half';
    const sign = n => n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0';
    const body = Groups.groupList().map(g => {
        const rows = Groups.standings(g.name);
        return `<div class="mc-gt"><h4>${single ? 'Played' : `Group ${escapeHtml(g.name)}`}<small>${Groups.groupMatches(g.name).filter(m => m.completed).length} of ${Groups.groupMatches(g.name).length}</small></h4>
            <ol>${rows.map((r, i) => {
                const up = canMove && i > 0 && r.level && rows[i - 1].level && r.played
                    ? `<button type="button" class="mc-gup" onclick="Groups.moveUp('${escapeHtml(g.name)}', ${JSON.stringify(r.id).replace(/"/g, '&quot;')}); renderBracket(); _mcRefresh(0);" title="Level on everything: put ${escapeHtml(r.player.name)} above ${escapeHtml(rows[i - 1].player.name)}">▲</button>` : '';
                return `<li class="${r.pos <= 2 && !single && !half ? 'mc-toa' : ''}"><b>${escapeHtml(r.player.name)}</b>${r.level && r.played ? '<i title="Level on wins, legs and head-to-head">level</i>' : ''}${up}<span>${r.won}–${r.lost} · ${sign(r.diff)}</span></li>`;
            }).join('')}</ol></div>`;
    }).join('');
    return `<section class="mc-panel"><div class="mc-ph"><h3>${single ? 'Table' : 'Groups'}<small>${single ? 'the table decides the placings' : half ? 'the top half goes to the A cup' : 'top two to the A cup'}</small></h3><button type="button" class="mc-link" onclick="showBracketView('bracket'); BracketView.setGroupsView('groups')">${single ? 'Full table' : 'Group tables'}</button></div>
        <div class="mc-gts">${body}</div></section>`;
}

/**
 * The Draw the cups step, once every group match is played: both seeded fields, the B cup switch,
 * and the button. Nothing is drawn until the operator says so.
 * @returns {string}
 */
function _mcDrawCupsHTML() {
    if (_mcPlayB.tid !== tournament.id) _mcPlayB = { tid: tournament.id, on: Groups.configSettings().bCup };
    const full = Groups.cupFields(true);
    const g = Groups.groupList().length;
    const place = r => r.pos === 1 ? 'winner' : r.pos === 2 ? 'runner-up' : r.pos === 3 ? '3rd' : `${r.pos}th`;
    const field = (rows, title, off) => `<div class="mc-field${off ? ' mc-off-field' : ''}"><h4>${title}<small>${rows.length} players${off ? ' · not played' : ''}</small></h4>
        <ol>${rows.map(r => `<li><b>${escapeHtml(r.player.name)}</b><span>Group ${escapeHtml(r.group)} ${place(r)} · ${r.won}–${r.lost}</span></li>`).join('')}</ol></div>`;
    const canB = full.B.length >= 2;
    const playB = _mcPlayB.on && canB;
    // without a B cup the A cup takes the top two of each group, whatever To the A cup says (cupFields())
    const f = playB ? full : Groups.cupFields(false);
    const level = Groups.groupList().some(gr => Groups.standings(gr.name).some(r => r.level));
    return `<section class="mc-panel mc-drawcups"><div class="mc-ph"><h3>Draw the cups<small>every group match is played</small></h3></div>
        <p class="mc-note">${!playB
            ? `Without a B cup, the top two of each group play the A cup, group winners as seeds 1–${g}, runners-up ${g + 1}–${2 * g}, ranked across the groups per match (win rate, then leg difference). The rest play no cup and are placed after it by their group results.`
            : Groups.settings().cupEntry === 'half'
            ? `Everyone is ranked across the groups: group winners first, then runners-up, and so on, each place by results per match (win rate, then leg difference). The top half plays the A cup, the rest the B cup, seeded in that order.`
            : `Group winners are seeds 1–${g}, runners-up ${g + 1}–${2 * g}, ranked across the groups per match (win rate, then leg difference). The B cup takes the rest the same way.`}</p>
        <div class="mc-fields">${field(f.rows.A, 'A cup', false)}${field(f.rows.B, 'B cup', !playB)}</div>
        ${Groups.settings().rematches === 'avoid' ? '<p class="mc-note">Group rematches in round 1 are avoided where possible, so a seed may meet the next opponent down instead of the mirror one.</p>' : ''}
        ${level ? '<p class="mc-note mc-warn">Some players are level on wins, legs and head-to-head: the group seed decides, unless you change it with ▲ in the group tables.</p>' : ''}
        <div class="mc-drawbar">
            <p>All ${Groups.groupList().reduce((n, gr) => n + Groups.groupMatches(gr.name).length, 0)} group matches are played. Top seed meets bottom seed; the best seeds get any byes.</p>
            <label class="mc-switchrow"><span class="mc-switch"><input type="checkbox"${playB ? ' checked' : ''}${canB ? '' : ' disabled'} onchange="_mcPlayB.on = this.checked; _mcRefresh(0);"><span></span></span> Play the B cup${canB ? '' : ' <small>(needs two players)</small>'}</label>
            <button type="button" class="mc-btn mc-primary mc-big" onclick="drawCupsFromControls()">Draw the cups →</button>
        </div></section>`;
}

/**
 * Draw the cups from Match Controls (drawCups()), then show them.
 * @returns {void}
 */
function drawCupsFromControls() {
    const playB = _mcPlayB.tid === tournament.id ? _mcPlayB.on : Groups.configSettings().bCup;
    if (drawCups(playB)) _mcRefresh(0);
}

/**
 * A running groups and cups tournament: the lanes board and free lanes (Next up prefers a match
 * whose players and planned referee are free), then by stage: the group queue and the group tables;
 * the Draw the cups step; or the two cups' queues side by side, with Undo the cup draw while allowed.
 * @param {{live: object[]}} matchData
 * @returns {string}
 */
function _mcGroupsHTML(matchData) {
    const live = matchData.live || [];
    const lanes = _mcLanes();
    const used = new Set(matches.filter(m => !m.completed && m.lane).map(m => String(m.lane)));
    const free = lanes.usable.filter(l => !used.has(String(l)));
    const cups = !!tournament.cups;
    const single = Groups.isSingle();
    const drawStep = !cups && !single && Groups.allGroupsDone();

    // the queue: the group stage's next matches by group (two each, in their fixed order), or the cups' ready matches
    let queued = [], queue = '';
    if (!cups) {
        const list = Groups.groupList();
        const upcoming = list.map(g => ({ g, ms: Groups.groupMatches(g.name).filter(m => !m.completed && !m.active) }));
        // across the groups, in turn: each group's next match, then each group's one after
        for (let i = 0; i < 6; i++) upcoming.forEach(u => { if (u.ms[i]) queued.push(u.ms[i]); });
        // every group keeps its heading, so the groups stay in place all night; a finished one
        // (or one whose last matches are live) has nothing under it, and only a finished one is greyed
        const block = u => {
            const all = Groups.groupMatches(u.g.name), played = all.filter(m => m.completed).length;
            const live = all.filter(m => !m.completed && m.active).length;
            const done = played === all.length;
            return `<div class="mc-qround${done ? ' mc-qdone' : u.ms.length ? '' : ' mc-qempty-live'}"><span>${single ? 'The group' : `Group ${escapeHtml(u.g.name)}`}</span><span>${done ? `All ${all.length} played` : `${played} of ${all.length} played${live ? ` · ${live} live` : ''}`}</span></div>${u.ms.slice(0, single ? 6 : 2).map(_mcPlanRow).join('')}`;
        };
        const half = Math.ceil(upcoming.length / 2);
        const col = us => us.map(block).join('');
        queue = single
            ? `<div class="mc-qcols mc-one"><div class="mc-qcol">${col(upcoming)}</div></div>`
            : `<div class="mc-qcols"><div class="mc-qcol">${col(upcoming.slice(0, half))}</div><div class="mc-qcol">${col(upcoming.slice(half))}</div></div>`;
    } else {
        const ready = cup => matches.filter(m => m.side === 'cup' && m.cup === cup && getMatchState(m) === 'ready')
            .sort((a, b) => a.round - b.round || a.positionInRound - b.positionInRound);
        const col = cup => {
            const rs = ready(cup);
            if (!tournament.cups[cup]) return '<div class="mc-qempty">No B cup tonight.</div>';
            if (!rs.length) return `<div class="mc-qempty">Nothing ready in the ${cup} cup.</div>`;
            let last = null;
            return rs.map(m => {
                const title = Groups.roundName(m);
                const head = title !== last ? `<div class="mc-qround"><span>${escapeHtml(title)}</span></div>` : '';
                last = title;
                return head + _mcPlanRow(m);
            }).join('');
        };
        queued = ready('A').concat(ready('B')).sort((a, b) => a.round - b.round);
        queue = `<div class="mc-qcols"><div class="mc-qcol">${col('A')}</div><div class="mc-qcol">${col('B')}</div></div>`;
    }

    const startable = queued.filter(_mcCanStart);
    // a planned referee who is known and free (or no plan); "loser of A-QF1" before that match is played isn't
    const refFree = m => {
        if (m.referee || !m.plannedReferee) return true;
        const p = Groups.plannedRefereeFor(m);
        return !!p && isPlayerAvailableAsReferee(p.id, m.id);
    };
    const next = startable.find(refFree) || startable[0];
    const nextRef = next && !next.referee && Groups.plannedRefereeFor(next);
    const nextNote = !next || next.referee ? ''
        : nextRef ? `, referee ${escapeHtml(nextRef.name)}${refFree(next) ? '' : ' (busy)'}`
        : next.plannedReferee ? `, referee: ${escapeHtml(Groups.plannedRefereeText(next))} (not played yet)` : '';

    const qrMode = typeof getChalkerHandover !== 'function' || getChalkerHandover() === 'qr';
    const scanQR = qrMode && live.length ? ` <button type="button" class="mc-btn mc-sm mc-scan" onclick="openResultQRScanner(null)">Scan QR results</button>` : '';
    const tiles = live.filter(m => m.lane).concat(live.filter(m => !m.lane)).map(_mcLiveTile).join('');
    const freeLine = `<div class="mc-free"><span class="mc-k">Free</span>` +
        (free.length
            ? free.map(l => next
                ? `<button type="button" class="mc-lanechip" onclick="startMatchOnLane('${next.id}', ${l})" title="Start ${next.id} on Lane ${l}">${l}</button>`
                : `<span class="mc-lanechip mc-idle">${l}</span>`).join('')
            : `<span class="mc-none">${lanes.usable.length ? 'No free lanes' : 'No lanes set up'}</span>`) +
        (next && free.length ? `<span class="mc-next">Next up: ${_mcTag(next.id)} ${escapeHtml(next.player1.name)} v ${escapeHtml(next.player2.name)}${nextNote}<em>click a free lane to start it there</em></span>` : '') +
        (lanes.excluded.length ? `<span class="mc-off">Not in use: ${lanes.excluded.join(', ')}</span>` : '') +
        `</div>`;

    const lanesPanel = `<section class="mc-panel"><div class="mc-ph"><h3>Lanes<small>${live.length} live · ${free.length} free</small></h3><span class="mc-hint">Click the winner to finish a match${scanQR}</span></div>
        ${freeLine}${tiles ? `<div class="mc-lanes">${tiles}</div>` : '<div class="mc-qempty">No matches being played.</div>'}</section>`;
    const queuePanel = drawStep ? _mcDrawCupsHTML()
        : `<section class="mc-panel"><div class="mc-ph"><h3>${cups ? 'Ready to start' : 'Up next'}<small>${cups ? `${queued.length}` : single ? 'in the fixed order' : 'by group, in their fixed order'}</small></h3><span class="mc-hint">Referees are planned; change them here</span></div>${queue}</section>`;
    const cupDraw = cups ? `<section class="mc-panel"><div class="mc-ph"><h3>Cup draw</h3></div>
        <p class="mc-note">A cup: ${tournament.cups.A.seeds.length} players${tournament.cups.B ? ` · B cup: ${tournament.cups.B.seeds.length} players` : ' · no B cup'}.</p>
        ${canUndoCupDraw() ? '<p class="mc-note"><button type="button" class="mc-btn mc-sm" onclick="undoCupDraw()">Undo the cup draw…</button></p>'
            : '<p class="mc-note">Group results are locked; the draw can no longer be undone once a cup match has been started or played.</p>'}</section>` : '';
    return `<div class="mc-col">${lanesPanel}${queuePanel}</div>
    <div class="mc-col">${cups ? cupDraw + _mcRefereesHTML(live) : _mcGroupTablesHTML() + _mcRefereesHTML(live)}</div>`;
}

/**
 * Referee suggestions (getRefereeSuggestions), with the live matches that have no
 * referee first.
 * @param {object[]} live
 * @returns {string}
 */
function _mcRefereesHTML(live) {
    const s = getRefereeSuggestions();
    const item = x => `<li class="${x.round && x.round.startsWith('BS-') ? 'mc-bs' : ''}"><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.round || '')}${x.lane ? ` · Lane ${escapeHtml(String(x.lane))}` : ''}</span></li>`;
    const list = (title, xs) => xs.length ? `<div><h4>${title}</h4><ul>${xs.map(item).join('')}</ul></div>` : '';
    const noRef = live.filter(m => !m.referee);
    const body = (noRef.length ? `<div><h4>Live without a referee</h4><ul>${noRef.map(m => `<li><b>${_mcTag(m.id)}${m.lane ? ` Lane ${escapeHtml(String(m.lane))}` : ''}</b><span>${escapeHtml(m.player1.name)} v ${escapeHtml(m.player2.name)}</span></li>`).join('')}</ul></div>` : '') +
        list('Recent losers', s.losers) + list('Recent winners', s.winners) + list('Recently refereed', s.recentReferees);
    return `<section class="mc-panel"><div class="mc-ph"><h3>Referees</h3></div>
        <div class="mc-refs">${body || '<p class="mc-note">Suggestions appear as matches finish.</p>'}</div>
        <p class="mc-note">Players in live matches aren't suggested.</p></section>`;
}

/**
 * Before the draw: the players to mark paid, add a player, the settings, Shuffle & Draw.
 * @returns {string}
 */
function _mcSetupHTML() {
    const paid = players.filter(p => p.paid).length;
    const unpaid = players.length - paid;
    // A chip toggles paid. An unpaid one also has a × to remove the player, as on Player
    // Registration (removePlayer()); a paid player is marked unpaid first, so one stray click
    // can't remove someone who has paid.
    const chips = players.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => {
        const name = escapeHtml(p.name);
        if (p.paid) return `<button type="button" class="mc-chip mc-paid" onclick="togglePaid(${p.id}); _mcRefresh();" title="Mark ${name} unpaid">${name}</button>`;
        return `<span class="mc-chip mc-unpaid mc-chip-split"><button type="button" onclick="togglePaid(${p.id}); _mcRefresh();" title="Mark ${name} paid">${name}</button><button type="button" class="mc-chip-x" onclick="removePlayer(${p.id}); _mcRefresh();" title="Remove ${name}" aria-label="Remove ${name}">&times;</button></span>`;
    }).join('');
    // Never a draw with an unpaid player in the list: a player who is there but not marked paid
    // would be left out of the bracket. The buttons say so; generateCleanBracket() still refuses.
    const formats = (typeof getVisibleFormats === 'function' ? getVisibleFormats() : [{ id: 'DE', name: 'Double Elimination Cup', blurb: '', minPlayers: 4, maxPlayers: 32 }]).map(fmt => {
        const size = calculateBracketSize(paid, fmt.id);
        // Round Robin follows its structure in Global Settings (one group, or groups and cups)
        const rr = fmt.id === 'GROUPS' && typeof Groups !== 'undefined';
        const single = rr && Groups.configSettings().structure === 'single';
        const lim = rr ? Groups.limits() : fmt;
        let label = !rr ? (paid > 32 ? `Draw 32 + ${paid - 32} qualifier${paid - 32 === 1 ? '' : 's'}` : `Draw ${size === 8 ? 'an' : 'a'} ${size}-player bracket`)
            : single ? `Draw one group of ${paid}` : `Draw ${Groups.groupCount(Math.max(paid, lim.minPlayers))} groups`, ok = true;
        if (unpaid > 0) { label = `${unpaid} player${unpaid === 1 ? '' : 's'} unpaid`; ok = false; }
        else if (paid < lim.minPlayers) { label = `Needs ${lim.minPlayers}+ paid players`; ok = false; }
        else if (paid > lim.maxPlayers) { label = `At most ${lim.maxPlayers} players${single ? ' in one group' : ''}`; ok = false; }
        const blurb = !rr ? fmt.blurb : single ? 'Everybody plays everybody in one group; the table decides the placings'
            : `Everybody plays everybody in groups, then an A cup and a B cup${Groups.configSettings().cupEntry === 'half' ? ' of the same size' : ''}`;
        return `<div class="mc-fmt"><b>${escapeHtml(fmt.name)}</b><p>${escapeHtml(blurb || '')}</p><button type="button" class="mc-btn mc-primary" onclick="generateBracket('${escapeHtml(fmt.id)}')"${ok ? '' : ' disabled'}>${label}</button></div>`;
    }).join('');
    const p = config.points, l = config.legs, lanes = _mcLanes();
    const dl = rows => `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    const isSE = typeof getVisibleFormats === 'function' && getVisibleFormats().length === 1 && getVisibleFormats()[0].id === 'SE';
    const legs = isSE
        ? [['Regular rounds', `Bo${l.seRegularRounds || 3}`], ['Semifinal', `Bo${l.seSemifinal || 3}`], ['Bronze', `Bo${l.seBronze || 5}`], ['Final', `Bo${l.seFinal || 5}`]]
        : [['Regular rounds', `Bo${l.regularRounds}`], ['Frontside semifinal', `Bo${l.frontsideSemifinal}`], ['Backside final', `Bo${l.backsideFinal}`], ['Grand Final', `Bo${l.grandFinal}`]];
    return `<div class="mc-col">
        <section class="mc-panel"><div class="mc-ph"><h3>Players<small>click a name to mark paid or unpaid</small></h3><button type="button" class="mc-link" onclick="showPage('registration')">Player Registration</button></div>
            ${players.length < (typeof Qualifiers !== 'undefined' ? Qualifiers.MAX_PLAYERS : 32) ? `<div class="mc-addrow"><input type="text" id="ccPlayerName" class="mc-text" placeholder="Add a player (found in the database, or created)" autocomplete="off" onkeydown="if (event.key === 'Enter') addPlayerFromCC()"><button type="button" class="mc-btn mc-primary" onclick="addPlayerFromCC()">Add</button></div>` : ''}
            <div class="mc-chips">${chips || '<span class="mc-note">No players yet.</span>'}</div></section>
        <section class="mc-panel"><div class="mc-ph"><h3>Settings for this tournament<small>change them in Global Settings</small></h3><button type="button" class="mc-link" onclick="showPage('config')">Global Settings</button></div>
            <div class="mc-settings">
                <div><h4>Points</h4>${dl([['Taking part', p.participation], ['1st · 2nd · 3rd · 4th', `${p.first} · ${p.second} · ${p.third} · ${p.fourth}`], ['5–6th · 7–8th', `${p.fifthSixth} · ${p.seventhEighth}`], ['180 · High out · Short leg · Ton', `${p.oneEighty} · ${p.highOut} · ${p.shortLeg} · ${p.ton}`]])}</div>
                <div><h4>Match length</h4>${dl(legs)}</div>
                <div><h4>Lanes</h4>${dl([['In use', lanes.usable.length ? lanes.usable.join(', ') : 'None'], ['Not in use', lanes.excluded.length ? lanes.excluded.join(', ') : 'None']])}</div>
            </div></section>
    </div>
    <div class="mc-col">
        <section class="mc-panel"><div class="mc-ph"><h3>Shuffle &amp; Draw</h3></div><div class="mc-formats">${formats}</div>
            <p class="mc-note${unpaid ? ' mc-warn' : ''}">${unpaid
                ? `Everyone must be paid before the draw: ${unpaid} still unpaid. Click a name to mark it paid, or &times; to remove a player who isn't playing.`
                : (players.length ? `All ${players.length} players are paid and go into the bracket.` : 'Add the players first.')}</p></section>
        ${typeof Seeding !== 'undefined' ? Seeding.html() : ''}
    </div>`;
}

/**
 * Show Match Controls: the header (name, counts, clock), the view for the tournament's
 * status (setup, running, completed), and shows it in the bracket page's frame.
 * @param {{live: object[], rounds: Object<string, object[]>}|object[]} matchData
 */
function showCommandCenterModal(matchData) {
    const modal = document.getElementById('matchCommandCenterModal');
    const body = document.getElementById('mcBody');
    if (!modal || !body) return;
    const scrollTop = modal.scrollTop; // the view scrolls, not its body
    const status = tournament && tournament.status;
    _mcStarts = null;

    updateMatchControlsClock();
    // the page header's counts (players, live, ready) change with what's done here
    if (typeof BracketView !== 'undefined') BracketView.updateHeader();

    // the view
    body.classList.toggle('mc-one', status === 'completed' || !status);
    if (!tournament || !status) body.innerHTML = '<div class="mc-panel mc-empty"><b>No tournament loaded</b>Create or load one on the Setup page.</div>';
    else if (status === 'setup') body.innerHTML = _mcSetupHTML();
    else if (status === 'completed') body.innerHTML = _mcCompletedHTML();
    else body.innerHTML = _mcActiveHTML(matchData && !Array.isArray(matchData) ? matchData : { live: [], rounds: {} });
    if (status === 'completed') _mcFillAverage();

    _bvSetView('controls');
    modal.scrollTop = scrollTop;
}

/**
 * Opens the Match Command Center modal with live and ready matches.
 * Main UI hub for managing active tournament matches.
 *
 * @returns {void}
 *
 * @description
 * Displays a modal with two sections:
 * - Live matches: Currently active (sorted by lane, then match ID)
 * - Ready matches: Both players assigned, grouped by round
 *
 * Shows empty state if no matches exist. Updates UI elements:
 * - liveMatchesContainer, frontMatchesContainer, backMatchesContainer
 * - Referee suggestions panel
 */
function showMatchCommandCenter() {
    if (!matches || matches.length === 0) {
        showCommandCenterModal([]); // Show empty state
        return;
    }

    const liveMatches = matches.filter(m => getMatchState(m) === 'live');
    const readyMatches = matches.filter(m => getMatchState(m) === 'ready');

    // Group ready matches by round for chronological organization
    const roundGroups = {};

    readyMatches.forEach(match => {
        // Determine round identifier for grouping
        let roundKey;

        if (match.side === 'qualifier') {
            roundKey = 'QUAL'; // qualifiers (33-48 players): first, each one unblocks a round 1 match
        } else if (match.id === 'GRAND-FINAL') {
            roundKey = 'GRAND-FINAL';
        } else if (match.id === 'BS-FINAL') {
            roundKey = 'BS-FINAL';
        } else if (match.id.startsWith('FS-')) {
            const roundNum = parseInt(match.id.split('-')[1]);
            roundKey = `FS-R${roundNum}`;
        } else if (match.id.startsWith('BS-')) {
            const roundNum = parseInt(match.id.split('-')[1]);
            roundKey = `BS-R${roundNum}`;
        } else {
            roundKey = 'OTHER';
        }

        if (!roundGroups[roundKey]) {
            roundGroups[roundKey] = [];
        }
        roundGroups[roundKey].push(match);
    });

    // Sort matches within each round group by match ID (numerically)
    Object.keys(roundGroups).forEach(roundKey => {
        roundGroups[roundKey].sort((a, b) => {
            // Extract match numbers from IDs like "FS-1-11" -> 11
            const num = m => m.side === 'qualifier' ? m.positionInRound : (parseInt(m.id.split('-')[2]) || 0);
            return num(a) - num(b);
        });
    });

    // Sort live matches by lane (ascending), then by match ID
    liveMatches.sort((a, b) => {
        // Matches with lanes come before matches without lanes
        const aHasLane = a.lane && a.lane !== '';
        const bHasLane = b.lane && b.lane !== '';

        if (aHasLane && !bHasLane) return -1;
        if (!aHasLane && bHasLane) return 1;

        // Both have lanes or both don't have lanes
        if (aHasLane && bHasLane) {
            // Sort by lane number (numerically)
            const laneA = parseInt(a.lane) || 0;
            const laneB = parseInt(b.lane) || 0;
            if (laneA !== laneB) {
                return laneA - laneB;
            }
        }

        // If lanes are equal (or both missing), sort by match ID (numerically)
        const matchNumA = parseInt(a.id.split('-')[2]) || 0;
        const matchNumB = parseInt(b.id.split('-')[2]) || 0;
        return matchNumA - matchNumB;
    });

    const matchData = {
        live: liveMatches,
        rounds: roundGroups
    };

    showCommandCenterModal(matchData);
}


// Function to get referee suggestions
function getRefereeSuggestions() {
    console.log('🔍 getRefereeSuggestions called - tournament status:', tournament?.status);

    // Maximum number of suggestions to show in each category (configurable)
    const MAX_SUGGESTIONS = config.ui.refereeSuggestionsLimit || 10;

    if (!matches || !players) {
        console.log('❌ No matches or players data available');
        return { losers: [], winners: [], recentReferees: [] };
    }

    // Get completed matches sorted by most recent first
    const completedMatches = matches
        .filter(m => m.completed && m.winner && m.loser)
        .sort((a, b) => {
            const aTime = a.completedAt || 0;
            const bTime = b.completedAt || 0;
            return bTime - aTime; // Most recent first
        });

    console.log(`📊 Found ${completedMatches.length} completed matches for referee suggestions`);

    // Get players currently in LIVE matches (these are ineligible)
    const playersInLiveMatches = new Set();
    matches.forEach(match => {
        if (match.active) {
            if (match.player1?.id) playersInLiveMatches.add(match.player1.id);
            if (match.player2?.id) playersInLiveMatches.add(match.player2.id);
        }
    });

    // Helper function to check if a player is eligible for referee suggestions
    const isEligible = (playerId, playerName) => {
        if (!playerId) return false;

        // Check if player is currently in a LIVE match
        if (playersInLiveMatches.has(playerId)) {
            return false;
        }

        // Check if player is a walkover by name or ID
        if (playerName === 'Walkover' || playerId.toString().startsWith('walkover-')) {
            return false;
        }

        // Additional check using player object if available
        const player = players.find(p => p.id === playerId);
        if (player && window.isWalkover && window.isWalkover(player)) {
            return false;
        }

        return true;
    };

    // Helper function to get round description
    const getRoundDescription = (matchId) => {
        if (matchId.startsWith('FS-')) {
            const parts = matchId.split('-');
            if (parts.length >= 2) {
                return `FS-R${parts[1]}`;
            }
        } else if (matchId.startsWith('BS-')) {
            const parts = matchId.split('-');
            if (parts.length >= 2) {
                return `BS-R${parts[1]}`;
            }
        }
        return matchId; // Fallback
    };

    // Get transaction history for referee assignments
    const history = getTournamentHistory();

    // Build a map of most recent referee assignment timestamp for each player
    const playerRefereeAssignments = new Map(); // playerId -> {timestamp, matchId}
    history.forEach(tx => {
        if (tx.type === 'ASSIGN_REFEREE' && tx.afterState?.referee) {
            const refereeId = tx.afterState.referee;
            const txTimestamp = new Date(tx.timestamp).getTime();

            // Keep only the most recent assignment for each player
            if (!playerRefereeAssignments.has(refereeId) ||
                txTimestamp > playerRefereeAssignments.get(refereeId).timestamp) {
                playerRefereeAssignments.set(refereeId, {
                    timestamp: txTimestamp,
                    matchId: tx.matchId,
                    timestampStr: tx.timestamp
                });
            }
        }
    });

    // Build a map of most recent match completion timestamp for each player (winner or loser)
    const playerMatchCompletions = new Map(); // playerId -> timestamp
    completedMatches.forEach(match => {
        const completedAt = match.completedAt || 0;

        // Track winner's most recent completion
        if (match.winner?.id) {
            if (!playerMatchCompletions.has(match.winner.id) ||
                completedAt > playerMatchCompletions.get(match.winner.id)) {
                playerMatchCompletions.set(match.winner.id, completedAt);
            }
        }

        // Track loser's most recent completion
        if (match.loser?.id) {
            if (!playerMatchCompletions.has(match.loser.id) ||
                completedAt > playerMatchCompletions.get(match.loser.id)) {
                playerMatchCompletions.set(match.loser.id, completedAt);
            }
        }
    });

    // Collect recent losers (up to MAX_SUGGESTIONS)
    // Players can appear multiple times if they lost multiple matches
    const recentLosers = [];

    for (const match of completedMatches) {
        if (recentLosers.length >= MAX_SUGGESTIONS) break;

        const loserId = match.loser?.id;
        const loserName = match.loser?.name;

        // Skip if not eligible (walkovers or players in LIVE matches)
        if (!loserId || !isEligible(loserId, loserName)) {
            continue;
        }

        recentLosers.push({
            id: loserId,
            name: loserName,
            round: getRoundDescription(match.id),
            lane: match.lane || null,
            completedAt: match.completedAt || 0
        });
    }

    // Collect recent winners (up to MAX_SUGGESTIONS)
    // Players can appear multiple times if they won multiple matches
    const recentWinners = [];

    for (const match of completedMatches) {
        if (recentWinners.length >= MAX_SUGGESTIONS) break;

        const winnerId = match.winner?.id;
        const winnerName = match.winner?.name;

        // Skip if not eligible (walkovers or players in LIVE matches)
        if (!winnerId || !isEligible(winnerId, winnerName)) {
            continue;
        }

        recentWinners.push({
            id: winnerId,
            name: winnerName,
            round: getRoundDescription(match.id),
            lane: match.lane || null,
            completedAt: match.completedAt || 0
        });
    }

    // Get recent referee assignments from transaction history (last MAX_SUGGESTIONS)
    // Players can appear multiple times if they were assigned as referee multiple times
    const refereeTransactions = history
        .filter(tx => tx.type === 'ASSIGN_REFEREE' && tx.afterState?.referee)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
        .slice(0, MAX_SUGGESTIONS);

    const recentRefereeAssignments = [];
    const processedMatches = new Set(); // Track matches we've already added to prevent duplicates

    for (const tx of refereeTransactions) {
        const refereeId = tx.afterState.referee;
        const matchId = tx.matchId;

        if (refereeId) {
            // Skip if we've already added an assignment for this match
            // (we want only the most recent assignment per match)
            if (processedMatches.has(matchId)) {
                continue;
            }

            // Find the match this assignment was for
            const match = matches.find(m => m.id === matchId);

            // Only include if match exists AND referee is still assigned to this match
            // This filters out replaced referees (e.g., Ben replaced by Bob in a LIVE match)
            // Since referees can't be changed after match completion, this only affects LIVE matches
            if (match && match.referee === refereeId) {
                // Find referee name from players
                const referee = players.find(p => p.id === refereeId);
                if (referee) {
                    recentRefereeAssignments.push({
                        id: refereeId,
                        name: referee.name,
                        round: getRoundDescription(matchId),
                        lane: match.lane || null,
                        timestamp: new Date(tx.timestamp).getTime(),
                        timestampStr: tx.timestamp
                    });
                    processedMatches.add(matchId); // Mark this match as processed
                }
            }
        }
    }

    // CRITICAL LOGIC: Remove match results that are OLDER than a player's most recent referee assignment
    // Logic: If a player was assigned as referee AFTER a specific match completion,
    // that match result should not appear in Winners/Losers
    // BUT if they play another match AFTER being assigned as referee, that NEW result SHOULD appear

    const finalLosers = recentLosers.filter(loser => {
        const matchCompletion = loser.completedAt || 0;
        const lastRefereeAssignment = playerRefereeAssignments.get(loser.id);

        if (lastRefereeAssignment && lastRefereeAssignment.timestamp > matchCompletion) {
            // Check if this referee assignment is STILL ACTIVE
            // (player is still assigned to that match, not unassigned)
            const assignedMatch = matches.find(m => m.id === lastRefereeAssignment.matchId);
            if (assignedMatch && assignedMatch.referee === loser.id) {
                // This match was completed BEFORE the player's most recent ACTIVE referee assignment
                // Remove this specific match result from the list
                console.log(`🔄 Removing ${loser.name} (${loser.round}) from Recent Losers (active referee assignment at ${new Date(lastRefereeAssignment.timestamp).toISOString()} is more recent than match at ${new Date(matchCompletion).toISOString()})`);
                return false;
            }
        }
        return true;
    });

    const finalWinners = recentWinners.filter(winner => {
        const matchCompletion = winner.completedAt || 0;
        const lastRefereeAssignment = playerRefereeAssignments.get(winner.id);

        if (lastRefereeAssignment && lastRefereeAssignment.timestamp > matchCompletion) {
            // Check if this referee assignment is STILL ACTIVE
            // (player is still assigned to that match, not unassigned)
            const assignedMatch = matches.find(m => m.id === lastRefereeAssignment.matchId);
            if (assignedMatch && assignedMatch.referee === winner.id) {
                // This match was completed BEFORE the player's most recent ACTIVE referee assignment
                // Remove this specific match result from the list
                console.log(`🔄 Removing ${winner.name} (${winner.round}) from Recent Winners (active referee assignment at ${new Date(lastRefereeAssignment.timestamp).toISOString()} is more recent than match at ${new Date(matchCompletion).toISOString()})`);
                return false;
            }
        }
        return true;
    });

    console.log('📋 Referee suggestions summary:', {
        losersCount: finalLosers.length,
        winnersCount: finalWinners.length,
        recentRefereesCount: recentRefereeAssignments.length,
        losers: finalLosers.map(l => l.name),
        winners: finalWinners.map(w => w.name),
        recentReferees: recentRefereeAssignments.map(r => r.name)
    });

    return {
        losers: finalLosers,
        winners: finalWinners,
        recentReferees: recentRefereeAssignments
    };
}

/**
 * Populates the referee suggestions panel in the Match Command Center.
 * Shows available players categorized by priority.
 *
 * @returns {void}
 *
 * @description
 * Updates three referee suggestion sections:
 * - Losers: Recently eliminated players (highest priority)
 * - Winners: Players waiting for next match
 * - Recent assignments: Previously assigned referees
 *
 * Excludes players currently in live matches.
 * Shows empty state if no suggestions available.
 * Respects config.ui.refereeSuggestionsLimit setting.
 */
// Wrapper function to add player from Command Center
function addPlayerFromCC() {
    const ccInput = document.getElementById('ccPlayerName');
    const mainInput = document.getElementById('playerName');

    if (!ccInput || !mainInput) {
        console.error('Required input elements not found');
        return;
    }

    const playerName = ccInput.value.trim();
    if (!playerName) {
        alert('Please enter a player name');
        return;
    }

    // Temporarily set the main input value so addPlayer() can read it
    const originalValue = mainInput.value;
    mainInput.value = playerName;

    // Call the existing addPlayer function
    addPlayer();

    // Restore original value and clear our input
    mainInput.value = originalValue;
    ccInput.value = '';

    // Refresh the Command Center to show the new player and restore focus
    setTimeout(() => {
        showMatchCommandCenter();
        // Restore focus to the input field after refresh
        setTimeout(() => {
            const ccInput = document.getElementById('ccPlayerName');
            if (ccInput) {
                ccInput.focus();
            }
        }, 50);
    }, 100);
}

// Function to show Statistics modal with results table
function showStatisticsModal() {
    // Update the statistics table with current data
    updateStatisticsTable();

    // Use dialog stack to show modal with automatic parent hiding/restoration
    pushDialog('statisticsModal', () => showStatisticsModal(), true);
}

// Function to update the statistics table with current results data
function updateStatisticsTable() {
    // Use the enhanced original updateResultsTable function
    if (typeof updateResultsTable === 'function') {
        updateResultsTable('statisticsTableBody');
    }
}

// Helper functions for match command center actions

function completeMatchFromCommandCenter(matchId, playerNumber) {
    // Find the match
    const match = matches.find(m => m.id === matchId);
    if (!match) {
        return;
    }

    // Complete match with selected winner - this will open Match Completion dialog via dialog stack
    if (typeof selectWinner === 'function') {
        selectWinner(matchId, playerNumber);
    }
}


// Export Command Center functions
if (typeof window !== 'undefined') {
    window.showMatchCommandCenter = showMatchCommandCenter;
    window.showBracketView = showBracketView;
    window.completeMatchFromCommandCenter = completeMatchFromCommandCenter;
    window.startMatchOnLane = startMatchOnLane;
    window.getMatchFormatDescription = getMatchFormatDescription;
    window.getRoundDescription = getRoundDescription;
}

// --- END: Match Command Center Implementation ---

// --- Match Controls: the finished tournament (podium, highlights, the night in numbers) ---

/** Matches actually played: completed, not walkovers. */
function _mcPlayedMatches() {
    return (matches || []).filter(m => m.completed && !m.autoAdvanced && !isWalkover(m.player1) && !isWalkover(m.player2));
}

/** The paid player with a placement, by id. */
function _mcPlayer(id) {
    return players.find(p => String(p.id) === String(id)) || null;
}

/**
 * Highlights of the night, from the tournament itself: player statistics, match scores,
 * placements, and the Start and finish times in the history. A highlight with no data
 * is left out.
 * @returns {{head: object[], list: object[], facts: object[]}}
 */
function _mcHighlights() {
    const paid = players.filter(p => p.paid && p.stats);
    const played = _mcPlayedMatches();
    const best = (pick, better) => {
        let top = null;
        paid.forEach(p => { const v = pick(p); if (v != null && (top === null || better(v, top.v))) top = { p, v }; });
        return top;
    };
    const len = a => Array.isArray(a) ? a.length : 0;
    const head = [], list = [];
    const add = (arr, label, value, who) => arr.push({ label, value, who });

    // Under the podium, always: the best of the night and everyone who shares it, or "None tonight"
    const shared = (pick, better) => {
        const top = best(pick, better);
        if (!top) return null;
        return { v: top.v, who: paid.filter(p => pick(p) === top.v).map(p => p.name).join(', ') };
    };
    const headline = (label, top, fmt) => add(head, label, top ? fmt(top.v) : '–', top ? top.who : 'None tonight');
    const o180 = shared(p => p.stats.oneEighties || null, (a, b) => a > b);
    headline('Most 180s', o180, v => v);
    const leg = shared(p => len(p.stats.shortLegs) ? Math.min(...p.stats.shortLegs) : null, (a, b) => a < b);
    headline('Shortest leg', leg, v => `${v} darts`);
    const out = shared(p => len(p.stats.highOuts) ? Math.max(...p.stats.highOuts) : null, (a, b) => a > b);
    headline('Highest out', out, v => v);

    // First the places after the podium that still score placement points, then the awards,
    // one per row (shown when there is data). Best average is filled in once the Analytics
    // register has been read (_mcFillAverage).
    [4, 5, 7].forEach(rank => {
        const names = paid.filter(p => tournament.placements && tournament.placements[String(p.id)] === rank).map(p => p.name);
        if (names.length) list.push({ label: typeof formatRanking === 'function' ? formatRanking(rank).replace('-', '–') : String(rank), value: names.join(', '), who: '', place: true });
    });
    const later = id => list.push({ label: 'Best average', value: '', who: '', id, hidden: true });
    const points = p => typeof calculatePlayerPoints === 'function' ? calculatePlayerPoints(p) : 0;
    const pts = best(p => points(p), (a, b) => a > b);
    if (pts) add(list, 'Most points', pts.p.name, `${pts.v} points`);
    const wins = {}, total = {};
    played.forEach(m => {
        if (m.winner && m.winner.id != null) wins[m.winner.id] = (wins[m.winner.id] || 0) + 1;
        [m.player1, m.player2].forEach(x => { if (x && x.id != null) total[x.id] = (total[x.id] || 0) + 1; });
    });
    const topWins = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
    if (topWins && _mcPlayer(topWins[0])) add(list, 'Most matches won', _mcPlayer(topWins[0]).name, `${topWins[1]} of ${total[topWins[0]]}`);
    // the backside run: the most wins on the backside (double elimination)
    if (typeof getFormat !== 'function' || getFormat() !== 'SE') {
        const bs = {};
        played.forEach(m => { if (m.id.startsWith('BS-') && m.winner && m.winner.id != null) bs[m.winner.id] = (bs[m.winner.id] || 0) + 1; });
        const run = Object.entries(bs).sort((a, b) => b[1] - a[1])[0];
        if (run && run[1] >= 2 && _mcPlayer(run[0])) {
            const place = tournament.placements && tournament.placements[String(run[0])];
            add(list, 'Backside run', _mcPlayer(run[0]).name, `${run[1]} wins on the backside${place && typeof formatRanking === 'function' ? `, to ${formatRanking(place)}` : ''}`);
        }
    }
    later('mcBestAverage');
    const tons = best(p => p.stats.tons || 0, (a, b) => a > b);
    if (tons && tons.v > 0) add(list, 'Most tons', tons.p.name, String(tons.v));
    const lolly = best(p => p.stats.lollipops || 0, (a, b) => a > b);
    if (lolly && lolly.v > 0) {
        const others = paid.filter(p => (p.stats.lollipops || 0) > 0).length - 1;
        add(list, 'Lollipops', lolly.p.name, `${lolly.v}${others > 0 ? ` · and ${others} more player${others === 1 ? '' : 's'}` : ''}`);
    }
    const lanes = {};
    played.forEach(m => { if (m.lane) lanes[m.lane] = (lanes[m.lane] || 0) + 1; });
    const lane = Object.entries(lanes).sort((a, b) => b[1] - a[1])[0];
    if (lane) add(list, 'Busiest lane', `Lane ${lane[0]}`, `${lane[1]} match${lane[1] === 1 ? '' : 'es'}`);

    // The night in numbers: always the same six
    const sum = f => paid.reduce((s, p) => s + f(p), 0);
    const fmtId = typeof getFormat === 'function' ? getFormat() : 'DE';
    const format = fmtId === 'GROUPS' ? Groups.formatName() : fmtId === 'SE' ? 'Single elimination' : 'Double elimination';
    const facts = [
        [fmtId === 'GROUPS' ? 'Format' : 'Bracket', `${format} · ${tournament.bracketSize || players.length}`],
        ['Total points', sum(points)],
        ['Matches played', played.length],
        ['Short legs', sum(p => len(p.stats.shortLegs))],
        ['180s', sum(p => p.stats.oneEighties || 0)],
        ['High outs', sum(p => len(p.stats.highOuts))]
    ];
    return { head, list, facts };
}

/**
 * The finished tournament: the podium and three headline highlights, then more highlights,
 * the night in numbers, and Tournament Analytics / Export / Leaderboard.
 * @returns {string}
 */
function _mcCompletedHTML() {
    const top = rank => { const id = tournament.placements && Object.keys(tournament.placements).find(k => tournament.placements[k] === rank); const p = id && _mcPlayer(id); return p ? escapeHtml(p.name) : '–'; };
    const pod = (cls, rank, label) => `<div class="mc-pod ${cls}"><div class="mc-podcard"><div class="mc-medal">${rank}</div><span class="mc-podrank">${label}</span><span class="mc-podname">${top(rank)}</span></div><div class="mc-podblock">${rank}</div></div>`;
    const h = _mcHighlights();
    const hl = x => `<div class="mc-aw${x.place ? ' mc-place' : ''}"${x.id ? ` id="${x.id}"` : ''}${x.hidden ? ' hidden' : ''}><span>${escapeHtml(x.label)}</span><b>${escapeHtml(String(x.value))}</b><small>${escapeHtml(x.who)}</small></div>`;
    const club = escapeHtml((config && config.clubName) || 'NewTon DC');
    return `<div class="mc-done">
        <section class="mc-panel mc-podpanel"><div class="mc-ph"><h3>Tournament complete</h3></div>
            <div class="mc-podium">${pod('mc-s', 2, 'Final')}${pod('mc-g', 1, 'Champion')}${pod('mc-b', 3, 'Third')}</div>
            <div class="mc-heads">${h.head.map(x => `<div class="mc-head-hl"><span>${escapeHtml(x.label)}</span><b>${escapeHtml(String(x.value))}</b><small>${escapeHtml(x.who)}</small></div>`).join('')}</div>
            <div class="mc-plaque"><span class="mc-plaque-club">${club}</span><b>${escapeHtml(tournament.name || '')}</b>${tournament.date ? `<time>${escapeHtml(tournament.date)}</time>` : ''}</div>
        </section>
        <section class="mc-panel mc-hlpanel"><div class="mc-ph"><h3>Highlights</h3><span class="mc-hint">From tonight's matches</span></div>
            <div class="mc-aws">${h.list.map(hl).join('')}</div>
            <p class="mc-factshead">The night in numbers</p>
            <dl class="mc-facts">${h.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join('')}</dl>
            <div class="mc-doneacts">
                <button type="button" class="mc-btn mc-primary" onclick="if (tournament && tournament.id) openAnalyticsForTournament(tournament.id)">Tournament Analytics</button>
                <button type="button" class="mc-btn" onclick="exportTournamentJSON()">Export tournament</button>
                <button type="button" class="mc-btn" onclick="showStatisticsModal()">Leaderboard</button>
            </div></section>
    </div>`;
}

/** Fill in an award row that waits for the Analytics register, and show it. */
function _mcFillRow(id, name, detail) {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelector('b').textContent = name;
    el.querySelector('small').textContent = detail;
    el.hidden = false;
}

/**
 * Best three-dart average of the night, from the Chalker matches in the Analytics register
 * (they carry every visit). Fills in the award when there is one; it stays hidden when
 * no match was scored on the Chalker.
 */
async function _mcFillAverage() {
    if (typeof NewtonDB === 'undefined' || !tournament || typeof NewtonStats === 'undefined') return;
    let records;
    try { records = await NewtonDB.getMatchesByTournament(String(tournament.id)); } catch (e) { return; }
    const acc = {};
    (records || []).forEach(m => {
        if (m.matchType !== 'CHALKER' || !Array.isArray(m.legs)) return;
        const start = (m.format && m.format.sc) || 501;
        m.legs.forEach(leg => {
            if (leg.cd === 0) return;
            [[1, m.player1Id, m.player1Name], [2, m.player2Id, m.player2Name]].forEach(([n, id, name]) => {
                const v = NewtonStats.decodeVisits(leg.s, n - 1);
                if (!v.length) return;
                const a = acc[id] = acc[id] || { name, scored: 0, darts: 0 };
                if (leg.w === n) { a.scored += start; a.darts += (v.length - 1) * 3 + (leg.cd || 3); }
                else { a.scored += v.reduce((x, y) => x + y, 0); a.darts += v.length * 3; }
            });
        });
    });
    const best = Object.values(acc).filter(a => a.darts >= 30).sort((a, b) => b.scored / b.darts - a.scored / a.darts)[0];
    if (best) _mcFillRow('mcBestAverage', best.name, `${(best.scored / best.darts * 3).toFixed(1)} · Chalker matches`);
}

// Tournament export function for celebration button
function exportTournamentJSON() {
    // Use the existing exportResultsJSON function from results-config.js
    if (typeof exportResultsJSON === 'function') {
        exportResultsJSON();
    } else {
        alert('Export function not available. Please use the Results page to export tournament data.');
    }
}

// Expose functions to global scope
if (typeof window !== 'undefined') {
    window.exportTournamentJSON = exportTournamentJSON;
}

// --- END: Tournament Celebration Functions ---

// --- STATUS CENTER FUNCTIONS - Dynamic Tournament Page Status Bar ---

// Get detailed match state information including undo status
function getDetailedMatchState(matchId) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return null;

    const basicState = getMatchState(match);

    // For non-completed matches, return basic state
    if (basicState !== 'completed') {
        let stateText;
        switch (basicState) {
            case 'pending': stateText = 'Pending'; break;
            case 'ready':
                // Check for referee conflicts
                const conflictInfo = checkRefereeConflict(matchId);
                if (conflictInfo.hasConflict) {
                    const playerNames = conflictInfo.conflictedPlayers.join(' and ');
                    stateText = `Blocked: ${playerNames} refereeing`;
                } else {
                    stateText = 'Ready to Start';
                }
                break;
            case 'live': stateText = 'Started'; break;
            default: stateText = 'Unknown'; break;
        }
        return { state: basicState, text: stateText };
    }

    // For completed matches, check if tournament is read-only first
    if (tournament && tournament.readOnly) {
        return { state: 'completed', text: 'Completed tournament: Read-only' };
    }

    // For completed matches, check if it's a walkover/bye match
    if (match.player1?.isBye || match.player2?.isBye ||
        match.player1?.name?.includes('Walkover') || match.player2?.name?.includes('Walkover')) {
        return { state: 'completed', text: 'Cannot Undo, Walkover' };
    }

    if (isGroupMatchLocked(matchId)) {
        return { state: 'completed', text: 'Cannot Undo, the cups are drawn' };
    }

    // Check undo status for regular completed matches
    const history = getTournamentHistory();
    if (history.length === 0) {
        return { state: 'completed', text: 'Cannot Undo' };
    }

    // MANUAL and QR transactions can be undone; AUTO (walkover/bye) cannot
    const manualTransaction = history.find(t => t.matchId === matchId && (t.completionType === 'MANUAL' || t.completionType === 'QR'));
    if (!manualTransaction) {
        return { state: 'completed', text: 'Cannot Undo' };
    }

    // Describe any blocking downstream matches (same scan isMatchUndoable() uses)
    const blockingMatches = getUndoBlockingMatches(matchId, history)
        .map(blocker => blocker.live ? `${blocker.matchId} (live)` : blocker.matchId);

    if (blockingMatches.length === 0) {
        return { state: 'completed', text: 'Can Undo' };
    } else if (blockingMatches.length === 1) {
        return { state: 'completed', text: `Cannot Undo, blocked by ${blockingMatches[0]}` };
    } else {
        return { state: 'completed', text: `Cannot Undo, blocked by ${blockingMatches[0]} and ${blockingMatches[1]}` };
    }
}

// --- The bracket page's views: Bracket | Match Controls | Console, in the same frame ---
//
// Match Controls and the Developer Console are layers over the bracket, shown with
// style.display 'block', so the bracket keeps its size and camera underneath. Code that
// redraws Match Controls after an action checks that display, as it did for the dialog.

const _BV_LAYERS = { controls: 'matchCommandCenterModal', console: 'devConsoleView' };

/** Show one view without drawing anything: the layers, the tabs, the header tools. */
function _bvSetView(view) {
    const dc = document.getElementById(_BV_LAYERS.console);
    // leaving the Console stops its capture and refresh (js/analytics.js)
    if (view !== 'console' && dc && dc.style.display === 'block' && typeof stopDeveloperConsole === 'function') stopDeveloperConsole();
    Object.entries(_BV_LAYERS).forEach(([v, id]) => {
        const layer = document.getElementById(id);
        if (layer) layer.style.display = v === view ? 'block' : 'none';
    });
    const frame = document.querySelector('#tournament .bracket-container');
    if (frame) frame.classList.toggle('bv-on-layer', view !== 'bracket');
    document.querySelectorAll('#bvViews [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}

/**
 * Switch the bracket page between its views (the tabs in its header).
 * @param {'bracket'|'controls'|'console'} view
 * @param {string} [matchId] - on Match Controls, bring this match into view and flash it
 */
function showBracketView(view, matchId) {
    if (view === 'console') {
        _bvSetView('console');
        if (typeof startDeveloperConsole === 'function') startDeveloperConsole();
        return;
    }
    if (view !== 'controls') {
        _bvSetView('bracket');
        // Always draw the current tournament when the bracket shows: creating, resetting, loading
        // or importing a tournament without a draw doesn't redraw it, and the old tournament's
        // picture (the group cards above all, which clearBracket() doesn't reach) would stay.
        // The same tournament redrawn keeps its zoom, selection and Follow.
        renderBracket();
        return;
    }
    showMatchCommandCenter();
    if (!matchId) return;
    const el = document.getElementById(`cc-match-card-${matchId}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('mc-flash');
    void el.offsetWidth; // restart the animation
    el.classList.add('mc-flash');
}

// Left / right arrow: switch between Bracket and Match Controls (not the Console; nothing
// while it shows). Not while typing, choosing in a list or a dialog is open, and only when
// the tabs show (not in analytics-only mode).
document.addEventListener('keydown', e => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const page = document.getElementById('tournament');
    if (!page || !page.classList.contains('active')) return;
    if (window.dialogStack && window.dialogStack.length) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
    const views = document.getElementById('bvViews');
    if (!views || !views.offsetParent) return;
    const tabs = [...views.querySelectorAll('[data-view="bracket"], [data-view="controls"]')];
    const at = tabs.findIndex(b => b.getAttribute('aria-pressed') === 'true');
    if (tabs.length < 2 || at < 0) return;
    e.preventDefault();
    const next = tabs[(at + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    showBracketView(next.dataset.view);
});

// Each live match's time on the board
function updateMatchControlsClock() {
    document.querySelectorAll('#matchCommandCenterModal [data-mc-started]').forEach(el => {
        el.textContent = _mcSince(+el.getAttribute('data-mc-started'));
    });
}

// Start clock update interval (every 10 seconds to catch minute changes)
setInterval(updateMatchControlsClock, 10000);

// UNDO SYSTEM FUNCTIONS - Refactored for Transactional History



