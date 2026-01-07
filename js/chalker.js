/**
 * NewTon DC - Chalker App
 * x01 scoring application for tablet use at dartboards
 */

(function() {
  'use strict';

  // ================
  // State Management
  // ================

  /**
   * @typedef {Object} Visit
   * @property {1|2} player - Player number
   * @property {number} score - Points scored this visit
   * @property {number} dartsUsed - Darts thrown (3, or 1-3 for checkout)
   * @property {boolean} isCheckout - Whether this visit completed a leg
   * @property {number} remainingBefore - Score before this visit
   */

  /**
   * @typedef {Object} Leg
   * @property {number} startingScore - Starting score for the leg
   * @property {Visit[]} visits - All visits in this leg
   * @property {1|2|null} winner - Winner of the leg (null if in progress)
   */

  /**
   * @typedef {Object} MatchConfig
   * @property {string} laneName - Lane identifier
   * @property {string} player1Name - Player 1 display name
   * @property {string} player2Name - Player 2 display name
   * @property {number} startingScore - Starting score (101-1001)
   * @property {number} bestOf - Number of legs to play (1-11)
   * @property {boolean} doubleIn - Whether double-in is required
   */

  /**
   * @typedef {Object} MatchState
   * @property {MatchConfig} config - Match configuration
   * @property {Leg[]} legs - All legs in the match
   * @property {number} player1Legs - Legs won by player 1
   * @property {number} player2Legs - Legs won by player 2
   * @property {1|2} currentPlayer - Current player's turn
   * @property {number} player1Score - Player 1's current remaining score
   * @property {number} player2Score - Player 2's current remaining score
   * @property {boolean} matchComplete - Whether match is finished
   * @property {1|2|null} matchWinner - Winner of the match
   */

  /** @type {MatchState|null} */
  let state = null;

  /** @type {string} */
  let inputBuffer = '';

  /** @type {number|null} - Index of visit being edited (null = new entry mode) */
  let editingVisitIndex = null;

  // ============
  // DOM Elements
  // ============

  const elements = {
    // Screens
    configScreen: document.getElementById('config-screen'),
    scoringScreen: document.getElementById('scoring-screen'),
    endScreen: document.getElementById('end-screen'),

    // Config inputs
    laneName: document.getElementById('lane-name'),
    player1Name: document.getElementById('player1-name'),
    player2Name: document.getElementById('player2-name'),
    startingScore: document.getElementById('starting-score'),
    bestOf: document.getElementById('best-of'),
    maxRounds: document.getElementById('max-rounds'),
    doubleIn: document.getElementById('double-in'),
    startMatchBtn: document.getElementById('start-match-btn'),

    // Scoring display
    player1Header: document.getElementById('player1-header'),
    player2Header: document.getElementById('player2-header'),
    legDisplay: document.getElementById('leg-display'),
    player1Anchor: document.getElementById('player1-anchor'),
    player2Anchor: document.getElementById('player2-anchor'),
    player1Score: document.getElementById('player1-score'),
    player2Score: document.getElementById('player2-score'),
    chalkboardBody: document.getElementById('chalkboard-body'),

    // Buttons
    menuBtn: document.getElementById('menu-btn'),

    // Modals
    checkoutModal: document.getElementById('checkout-modal'),
    menuModal: document.getElementById('menu-modal'),
    rematchBtn: document.getElementById('rematch-btn'),
    newMatchBtn: document.getElementById('new-match-btn'),
    cancelMenuBtn: document.getElementById('cancel-menu-btn'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmYesBtn: document.getElementById('confirm-yes-btn'),
    confirmNoBtn: document.getElementById('confirm-no-btn'),

    // End screen
    winnerName: document.getElementById('winner-name'),
    finalScore: document.getElementById('final-score'),
    loserName: document.getElementById('loser-name'),
    statsPlayer1: document.getElementById('stats-player1'),
    statsPlayer2: document.getElementById('stats-player2'),
    p1Tons: document.getElementById('p1-tons'),
    p2Tons: document.getElementById('p2-tons'),
    p1180s: document.getElementById('p1-180s'),
    p2180s: document.getElementById('p2-180s'),
    p1ShortLegs: document.getElementById('p1-short-legs'),
    p2ShortLegs: document.getElementById('p2-short-legs'),
    p1HighOuts: document.getElementById('p1-high-outs'),
    p2HighOuts: document.getElementById('p2-high-outs'),
    p1First9: document.getElementById('p1-first9'),
    p2First9: document.getElementById('p2-first9'),
    p1MatchAvg: document.getElementById('p1-match-avg'),
    p2MatchAvg: document.getElementById('p2-match-avg'),
    legAveragesContainer: document.getElementById('leg-averages-container'),
    endRematchBtn: document.getElementById('end-rematch-btn'),
    endNewMatchBtn: document.getElementById('end-new-match-btn')
  };

  // ===========
  // Screen Flow
  // ===========

  /**
   * Show a specific screen
   * @param {'config'|'scoring'|'end'} screenName
   */
  function showScreen(screenName) {
    elements.configScreen.classList.remove('active');
    elements.scoringScreen.classList.remove('active');
    elements.endScreen.classList.remove('active');

    switch (screenName) {
      case 'config':
        elements.configScreen.classList.add('active');
        break;
      case 'scoring':
        elements.scoringScreen.classList.add('active');
        break;
      case 'end':
        elements.endScreen.classList.add('active');
        break;
    }
  }

  /**
   * Show a modal
   * @param {HTMLElement} modal
   */
  function showModal(modal) {
    modal.classList.add('active');
  }

  /**
   * Hide a modal
   * @param {HTMLElement} modal
   */
  function hideModal(modal) {
    modal.classList.remove('active');
  }

  // ==========
  // Game Logic
  // ==========

  /**
   * Start a new match with current config
   */
  function startMatch() {
    const config = {
      laneName: elements.laneName.value.trim() || 'Lane',
      player1Name: elements.player1Name.value.trim() || 'Player 1',
      player2Name: elements.player2Name.value.trim() || 'Player 2',
      startingScore: parseInt(elements.startingScore.value, 10),
      bestOf: parseInt(elements.bestOf.value, 10),
      maxRounds: parseInt(elements.maxRounds.value, 10),
      doubleIn: elements.doubleIn.checked
    };

    state = {
      config: config,
      legs: [],
      player1Legs: 0,
      player2Legs: 0,
      currentPlayer: 1,
      player1Score: config.startingScore,
      player2Score: config.startingScore,
      matchComplete: false,
      matchWinner: null
    };

    // Start first leg
    startNewLeg();

    // Update UI
    elements.player1Header.textContent = config.player1Name;
    elements.player2Header.textContent = config.player2Name;

    updateDisplay();
    showScreen('scoring');
  }

  /**
   * Start a new leg
   */
  function startNewLeg() {
    state.legs.push({
      startingScore: state.config.startingScore,
      visits: [],
      winner: null
    });

    state.player1Score = state.config.startingScore;
    state.player2Score = state.config.startingScore;

    // Alternate who starts based on leg number (odd legs: P1 starts, even legs: P2 starts)
    state.currentPlayer = state.legs.length % 2 === 1 ? 1 : 2;
  }

  /**
   * Record a visit (score entry)
   * @param {number} score - Points scored
   * @param {number} dartsUsed - Darts used (default 3)
   * @param {boolean} isCheckout - Whether this is a checkout
   */
  function recordVisit(score, dartsUsed = 3, isCheckout = false) {
    const currentLeg = state.legs[state.legs.length - 1];
    const remainingBefore = state.currentPlayer === 1 ? state.player1Score : state.player2Score;

    const visit = {
      player: state.currentPlayer,
      score: score,
      dartsUsed: dartsUsed,
      isCheckout: isCheckout,
      remainingBefore: remainingBefore
    };

    currentLeg.visits.push(visit);

    // Update score
    if (state.currentPlayer === 1) {
      state.player1Score -= score;
    } else {
      state.player2Score -= score;
    }

    if (isCheckout) {
      completeLeg();
    } else {
      // Switch player
      state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    }

    updateDisplay();
  }

  /**
   * Complete the current leg
   */
  function completeLeg() {
    const currentLeg = state.legs[state.legs.length - 1];
    currentLeg.winner = state.currentPlayer;

    if (state.currentPlayer === 1) {
      state.player1Legs++;
    } else {
      state.player2Legs++;
    }

    // Check for match win
    const legsToWin = Math.ceil(state.config.bestOf / 2);
    if (state.player1Legs >= legsToWin) {
      state.matchComplete = true;
      state.matchWinner = 1;
      showEndScreen();
    } else if (state.player2Legs >= legsToWin) {
      state.matchComplete = true;
      state.matchWinner = 2;
      showEndScreen();
    } else {
      // Start next leg
      startNewLeg();
    }
  }

  /**
   * Handle score submission
   * @param {number} score
   */
  function submitScore(score) {
    const currentScore = state.currentPlayer === 1 ? state.player1Score : state.player2Score;
    const newScore = currentScore - score;

    // Validate score
    if (score < 0 || score > 180) {
      // Invalid score range
      return;
    }

    // Check for checkout
    if (newScore === 0) {
      // Checkout! Ask for darts used
      showCheckoutModal(score);
    } else if (newScore < 0 || newScore === 1) {
      // Bust - referee should enter 0, but we'll accept if they enter the actual score
      // Just record as normal (referee handles bust by entering 0)
      recordVisit(score);
    } else {
      // Normal score
      recordVisit(score);
    }

    clearInput();
  }

  /**
   * Show checkout modal to ask for darts used
   * @param {number} checkoutScore
   */
  function showCheckoutModal(checkoutScore) {
    // Store the checkout score for when we get the darts count
    elements.checkoutModal.dataset.checkoutScore = checkoutScore;
    showModal(elements.checkoutModal);
  }

  /**
   * Complete checkout with dart count
   * @param {number} dartsUsed
   */
  function completeCheckout(dartsUsed) {
    const checkoutScore = parseInt(elements.checkoutModal.dataset.checkoutScore, 10);
    const editVisitIdx = elements.checkoutModal.dataset.editVisitIndex;
    hideModal(elements.checkoutModal);

    // Clear the edit visit index from modal data
    delete elements.checkoutModal.dataset.editVisitIndex;

    if (editVisitIdx !== undefined && editVisitIdx !== '') {
      // This is an edit that resulted in checkout
      completeEditCheckout(checkoutScore, parseInt(editVisitIdx, 10), dartsUsed);
    } else {
      // Normal new checkout
      recordVisit(checkoutScore, dartsUsed, true);
    }
  }

  /**
   * Complete an edit that results in a checkout
   * @param {number} checkoutScore
   * @param {number} visitIdx
   * @param {number} dartsUsed
   */
  function completeEditCheckout(checkoutScore, visitIdx, dartsUsed) {
    const currentLeg = state.legs[state.legs.length - 1];
    if (!currentLeg || visitIdx < 0 || visitIdx >= currentLeg.visits.length) return;

    const visit = currentLeg.visits[visitIdx];

    // Update the visit to be a checkout
    visit.score = checkoutScore;
    visit.dartsUsed = dartsUsed;
    visit.isCheckout = true;

    // Set the leg winner
    currentLeg.winner = visit.player;
    if (visit.player === 1) {
      state.player1Legs++;
    } else {
      state.player2Legs++;
    }

    // Check for match win
    const legsToWin = Math.ceil(state.config.bestOf / 2);
    if (state.player1Legs >= legsToWin || state.player2Legs >= legsToWin) {
      state.matchComplete = true;
      state.matchWinner = state.player1Legs >= legsToWin ? 1 : 2;
    }

    // Recalculate scores
    recalculateScores();

    // Exit edit mode
    editingVisitIndex = null;
    inputBuffer = '';

    // Update display or show end screen
    if (state.matchComplete) {
      showEndScreen();
    } else {
      updateDisplay();
    }
  }

  /**
   * Undo the last visit
   */
  function undoLastVisit() {
    if (!state || state.legs.length === 0) return;

    let currentLeg = state.legs[state.legs.length - 1];

    // If current leg is empty and there are previous legs, go back
    if (currentLeg.visits.length === 0 && state.legs.length > 1) {
      // Remove current leg and restore previous leg
      state.legs.pop();
      currentLeg = state.legs[state.legs.length - 1];

      // Undo the leg completion
      if (currentLeg.winner === 1) {
        state.player1Legs--;
      } else if (currentLeg.winner === 2) {
        state.player2Legs--;
      }
      currentLeg.winner = null;

      // The last visit was a checkout, undo it
      if (currentLeg.visits.length > 0) {
        const lastVisit = currentLeg.visits.pop();
        restoreFromVisit(lastVisit);
      }
    } else if (currentLeg.visits.length > 0) {
      // Normal undo within current leg
      const lastVisit = currentLeg.visits.pop();
      restoreFromVisit(lastVisit);
    }

    state.matchComplete = false;
    state.matchWinner = null;

    updateDisplay();
    showScreen('scoring');
  }

  /**
   * Restore state from undone visit
   * @param {Visit} visit
   */
  function restoreFromVisit(visit) {
    if (visit.player === 1) {
      state.player1Score = visit.remainingBefore;
    } else {
      state.player2Score = visit.remainingBefore;
    }
    state.currentPlayer = visit.player;
  }

  /** @type {Function|null} */
  let pendingConfirmAction = null;

  /**
   * Show confirmation modal
   * @param {string} title
   * @param {string} message
   * @param {Function} onConfirm
   */
  function showConfirm(title, message, onConfirm) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    pendingConfirmAction = onConfirm;
    hideModal(elements.menuModal);
    showModal(elements.confirmModal);
  }

  /**
   * Handle confirm yes
   */
  function handleConfirmYes() {
    hideModal(elements.confirmModal);
    if (pendingConfirmAction) {
      pendingConfirmAction();
      pendingConfirmAction = null;
    }
  }

  /**
   * Handle confirm no
   */
  function handleConfirmNo() {
    hideModal(elements.confirmModal);
    pendingConfirmAction = null;
  }

  /**
   * Request rematch with confirmation
   */
  function requestRematch() {
    showConfirm(
      'Start Rematch?',
      'Current match will be lost.',
      rematch
    );
  }

  /**
   * Request new match with confirmation
   */
  function requestNewMatch() {
    showConfirm(
      'Start New Match?',
      'Current match will be lost.',
      newMatch
    );
  }

  /**
   * Start a rematch (same config)
   */
  function rematch() {
    startMatch();
  }

  /**
   * Start a new match (back to config)
   */
  function newMatch() {
    state = null;
    showScreen('config');
  }

  // =======
  // Display
  // =======

  /**
   * Update all display elements
   */
  function updateDisplay() {
    if (!state) return;

    // Update anchor scores
    elements.player1Score.textContent = state.player1Score;
    elements.player2Score.textContent = state.player2Score;

    // Update leg display
    elements.legDisplay.textContent = `${state.player1Legs} - ${state.player2Legs}`;

    // Update active player indicator
    elements.player1Anchor.classList.toggle('active', state.currentPlayer === 1);
    elements.player2Anchor.classList.toggle('active', state.currentPlayer === 2);

    // Render chalkboard
    renderChalkboard();
  }

  /**
   * Render the chalkboard ledger for current leg
   * Pre-renders all rows based on maxRounds, fills in scores as available
   * Shows current input in the active cell (either new entry or editing)
   */
  function renderChalkboard() {
    const currentLeg = state.legs[state.legs.length - 1];
    if (!currentLeg) return;

    const maxRounds = state.config.maxRounds;
    const legStarter = state.legs.length % 2 === 1 ? 1 : 2;

    // Build data from visits, tracking visit indices for each cell
    const roundData = [];
    let p1Score = state.config.startingScore;
    let p2Score = state.config.startingScore;

    // Process visits into rounds
    const visits = currentLeg.visits;
    let visitIndex = 0;

    for (let roundNum = 0; roundNum < maxRounds; roundNum++) {
      const round = {
        p1Scored: '',
        p1ToGo: '',
        p1VisitIndex: -1,
        p2Scored: '',
        p2ToGo: '',
        p2VisitIndex: -1
      };

      // Determine who throws first this round based on leg starter
      const firstThisRound = legStarter;
      const secondThisRound = legStarter === 1 ? 2 : 1;

      // Check for first thrower's visit
      const firstVisit = visits[visitIndex];
      if (firstVisit && firstVisit.player === firstThisRound) {
        if (firstThisRound === 1) {
          p1Score -= firstVisit.score;
          round.p1Scored = firstVisit.score;
          round.p1ToGo = p1Score;
          round.p1VisitIndex = visitIndex;
        } else {
          p2Score -= firstVisit.score;
          round.p2Scored = firstVisit.score;
          round.p2ToGo = p2Score;
          round.p2VisitIndex = visitIndex;
        }
        visitIndex++;

        // Check for second thrower's visit in same round
        const secondVisit = visits[visitIndex];
        if (secondVisit && secondVisit.player === secondThisRound) {
          if (secondThisRound === 1) {
            p1Score -= secondVisit.score;
            round.p1Scored = secondVisit.score;
            round.p1ToGo = p1Score;
            round.p1VisitIndex = visitIndex;
          } else {
            p2Score -= secondVisit.score;
            round.p2Scored = secondVisit.score;
            round.p2ToGo = p2Score;
            round.p2VisitIndex = visitIndex;
          }
          visitIndex++;
        }
      }

      roundData.push(round);
    }

    // Determine which cell is the active input cell
    const totalVisits = visits.length;
    const activeRound = Math.floor(totalVisits / 2);
    const activePlayer = state.currentPlayer;

    // Build all rows (starting score + maxRounds)
    let html = '';

    // Row 0: Starting scores (no dart count shown)
    html += `
      <tr>
        <td class="col-scored"></td>
        <td class="col-togo">${state.config.startingScore}</td>
        <td class="col-darts"></td>
        <td class="col-togo">${state.config.startingScore}</td>
        <td class="col-scored"></td>
      </tr>
    `;

    // Rows 1-maxRounds: Pre-rendered with dart counts
    for (let r = 0; r < maxRounds; r++) {
      const dartCount = (r + 1) * 3;
      const data = roundData[r];
      const isActiveRow = r === activeRound && !currentLeg.winner && editingVisitIndex === null;

      // Determine if P1 or P2 cell is active (new entry mode)
      const p1IsNewEntry = isActiveRow && activePlayer === 1 && data.p1Scored === '';
      const p2IsNewEntry = isActiveRow && activePlayer === 2 && data.p2Scored === '';

      // Determine if cell is being edited
      const p1IsEditing = editingVisitIndex !== null && data.p1VisitIndex === editingVisitIndex;
      const p2IsEditing = editingVisitIndex !== null && data.p2VisitIndex === editingVisitIndex;

      // Content for cells
      let p1Content, p2Content;
      if (p1IsNewEntry || p1IsEditing) {
        p1Content = inputBuffer || '';
      } else {
        p1Content = data.p1Scored;
      }
      if (p2IsNewEntry || p2IsEditing) {
        p2Content = inputBuffer || '';
      } else {
        p2Content = data.p2Scored;
      }

      // Classes for cells
      const p1IsActive = p1IsNewEntry || p1IsEditing;
      const p2IsActive = p2IsNewEntry || p2IsEditing;
      const p1Class = p1IsActive ? 'input-active' : getScoreClass(data.p1Scored);
      const p2Class = p2IsActive ? 'input-active' : getScoreClass(data.p2Scored);

      // Row is empty if no scores and not the active row
      const hasData = data.p1Scored !== '' || data.p2Scored !== '' || p1IsActive || p2IsActive;
      const rowClass = hasData ? '' : 'chalk-row-empty';

      // Show To Go values only if there's data in that column
      const p1ToGo = data.p1ToGo !== '' ? data.p1ToGo : '';
      const p2ToGo = data.p2ToGo !== '' ? data.p2ToGo : '';

      // Add data-visit attribute for tap-to-edit on recorded scores
      const p1DataAttr = data.p1VisitIndex >= 0 && !p1IsActive ? `data-visit="${data.p1VisitIndex}"` : '';
      const p2DataAttr = data.p2VisitIndex >= 0 && !p2IsActive ? `data-visit="${data.p2VisitIndex}"` : '';

      html += `
        <tr class="${rowClass}">
          <td class="col-scored ${p1Class}" ${p1DataAttr}>${p1Content}</td>
          <td class="col-togo">${p1ToGo}</td>
          <td class="col-darts">${dartCount}</td>
          <td class="col-togo">${p2ToGo}</td>
          <td class="col-scored ${p2Class}" ${p2DataAttr}>${p2Content}</td>
        </tr>
      `;
    }

    document.getElementById('chalk-tbody').innerHTML = html;

    // Add click handlers for tap-to-edit
    elements.chalkboardBody.querySelectorAll('[data-visit]').forEach(cell => {
      cell.addEventListener('click', () => {
        const visitIdx = parseInt(cell.dataset.visit, 10);
        startEditingVisit(visitIdx);
      });
    });

    // Auto-scroll to keep active input cell visible
    const activeCell = elements.chalkboardBody.querySelector('.input-active');
    if (activeCell) {
      activeCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Start editing a specific visit
   * @param {number} visitIdx - Index of visit to edit
   */
  function startEditingVisit(visitIdx) {
    const currentLeg = state.legs[state.legs.length - 1];
    if (!currentLeg || visitIdx < 0 || visitIdx >= currentLeg.visits.length) return;

    editingVisitIndex = visitIdx;
    // Pre-populate input buffer with existing score (like Excel)
    inputBuffer = String(currentLeg.visits[visitIdx].score);
    renderChalkboard();
  }

  /**
   * Cancel editing and return to normal mode
   */
  function cancelEditing() {
    editingVisitIndex = null;
    inputBuffer = '';
    renderChalkboard();
  }

  /**
   * Get CSS class for score highlighting
   * @param {number|string} score
   * @returns {string}
   */
  function getScoreClass(score) {
    if (score === '' || score === undefined) return '';
    const num = parseInt(score, 10);
    if (num === 180) return 'ton80';
    if (num >= 100) return 'ton';
    return '';
  }

  /**
   * Clear the input buffer
   */
  function clearInput() {
    inputBuffer = '';
    renderChalkboard();
  }

  /**
   * Update input display (re-renders chalkboard to show input in active cell)
   */
  function updateInputDisplay() {
    renderChalkboard();
  }

  // ==========
  // Statistics
  // ==========

  /**
   * Calculate all match statistics
   * @returns {Object} Statistics object
   */
  function calculateStats() {
    const stats = {
      player1: {
        tons: 0,
        ton80s: 0,
        shortLegs: 0,
        highOuts: 0,
        first9Scores: [],
        legAverages: [],
        totalScore: 0,
        totalDarts: 0
      },
      player2: {
        tons: 0,
        ton80s: 0,
        shortLegs: 0,
        highOuts: 0,
        first9Scores: [],
        legAverages: [],
        totalScore: 0,
        totalDarts: 0
      }
    };

    state.legs.forEach((leg, legIndex) => {
      const legStats = {
        player1: { score: 0, darts: 0, visits: 0 },
        player2: { score: 0, darts: 0, visits: 0 }
      };

      leg.visits.forEach((visit) => {
        const playerStats = visit.player === 1 ? stats.player1 : stats.player2;
        const playerLegStats = visit.player === 1 ? legStats.player1 : legStats.player2;

        // Count tons (100+)
        if (visit.score >= 100) {
          playerStats.tons++;
        }

        // Count 180s
        if (visit.score === 180) {
          playerStats.ton80s++;
        }

        // High outs (101+)
        if (visit.isCheckout && visit.score >= 101) {
          playerStats.highOuts++;
        }

        // First 9 (first 3 visits per player per leg)
        if (playerLegStats.visits < 3) {
          playerStats.first9Scores.push(visit.score);
        }

        // Accumulate for averages
        playerLegStats.score += visit.score;
        playerLegStats.darts += visit.dartsUsed;
        playerLegStats.visits++;

        playerStats.totalScore += visit.score;
        playerStats.totalDarts += visit.dartsUsed;
      });

      // Calculate leg averages
      if (legStats.player1.darts > 0) {
        stats.player1.legAverages.push({
          leg: legIndex + 1,
          avg: (legStats.player1.score / legStats.player1.darts) * 3
        });
      }
      if (legStats.player2.darts > 0) {
        stats.player2.legAverages.push({
          leg: legIndex + 1,
          avg: (legStats.player2.score / legStats.player2.darts) * 3
        });
      }

      // Short legs (<=21 darts to checkout)
      if (leg.winner) {
        const winnerLegStats = leg.winner === 1 ? legStats.player1 : legStats.player2;
        const winnerStats = leg.winner === 1 ? stats.player1 : stats.player2;
        if (winnerLegStats.darts <= 21) {
          winnerStats.shortLegs++;
        }
      }
    });

    // Calculate first 9 averages (average of first 9 darts = first 3 visits)
    stats.player1.first9Avg = stats.player1.first9Scores.length > 0
      ? (stats.player1.first9Scores.reduce((a, b) => a + b, 0) / stats.player1.first9Scores.length) * 3 / 3
      : 0;
    stats.player2.first9Avg = stats.player2.first9Scores.length > 0
      ? (stats.player2.first9Scores.reduce((a, b) => a + b, 0) / stats.player2.first9Scores.length) * 3 / 3
      : 0;

    // Wait, first 9 avg should be: total of first 9 darts / 9 * 3 (per 3 darts)
    // Since we store per-visit scores (3 darts each), first 3 visits = 9 darts
    // Avg per 3 darts = sum of first 3 visits / 3
    stats.player1.first9Avg = stats.player1.first9Scores.slice(0, 3).length > 0
      ? stats.player1.first9Scores.slice(0, 3).reduce((a, b) => a + b, 0) / stats.player1.first9Scores.slice(0, 3).length
      : 0;
    stats.player2.first9Avg = stats.player2.first9Scores.slice(0, 3).length > 0
      ? stats.player2.first9Scores.slice(0, 3).reduce((a, b) => a + b, 0) / stats.player2.first9Scores.slice(0, 3).length
      : 0;

    // Match averages (per 3 darts)
    stats.player1.matchAvg = stats.player1.totalDarts > 0
      ? (stats.player1.totalScore / stats.player1.totalDarts) * 3
      : 0;
    stats.player2.matchAvg = stats.player2.totalDarts > 0
      ? (stats.player2.totalScore / stats.player2.totalDarts) * 3
      : 0;

    return stats;
  }

  /**
   * Show end screen with statistics
   */
  function showEndScreen() {
    const stats = calculateStats();

    // Winner/Loser display
    const winner = state.matchWinner;
    const winnerName = winner === 1 ? state.config.player1Name : state.config.player2Name;
    const loserName = winner === 1 ? state.config.player2Name : state.config.player1Name;
    const winnerLegs = winner === 1 ? state.player1Legs : state.player2Legs;
    const loserLegs = winner === 1 ? state.player2Legs : state.player1Legs;

    elements.winnerName.textContent = winnerName;
    elements.loserName.textContent = loserName;
    elements.finalScore.textContent = `${winnerLegs} - ${loserLegs}`;

    // Stats table headers
    elements.statsPlayer1.textContent = state.config.player1Name;
    elements.statsPlayer2.textContent = state.config.player2Name;

    // Populate stats
    elements.p1Tons.textContent = stats.player1.tons;
    elements.p2Tons.textContent = stats.player2.tons;
    elements.p1180s.textContent = stats.player1.ton80s;
    elements.p2180s.textContent = stats.player2.ton80s;
    elements.p1ShortLegs.textContent = stats.player1.shortLegs;
    elements.p2ShortLegs.textContent = stats.player2.shortLegs;
    elements.p1HighOuts.textContent = stats.player1.highOuts;
    elements.p2HighOuts.textContent = stats.player2.highOuts;
    elements.p1First9.textContent = stats.player1.first9Avg > 0 ? stats.player1.first9Avg.toFixed(1) : '-';
    elements.p2First9.textContent = stats.player2.first9Avg > 0 ? stats.player2.first9Avg.toFixed(1) : '-';
    elements.p1MatchAvg.textContent = stats.player1.matchAvg > 0 ? stats.player1.matchAvg.toFixed(1) : '-';
    elements.p2MatchAvg.textContent = stats.player2.matchAvg > 0 ? stats.player2.matchAvg.toFixed(1) : '-';

    // Leg averages
    elements.legAveragesContainer.innerHTML = '';
    const maxLegs = Math.max(stats.player1.legAverages.length, stats.player2.legAverages.length);
    for (let i = 0; i < maxLegs; i++) {
      const p1Avg = stats.player1.legAverages[i]?.avg;
      const p2Avg = stats.player2.legAverages[i]?.avg;

      const row = document.createElement('div');
      row.className = 'leg-avg-row';
      row.innerHTML = `
        <span>${p1Avg ? p1Avg.toFixed(1) : '-'}</span>
        <span class="leg-label">Leg ${i + 1}</span>
        <span>${p2Avg ? p2Avg.toFixed(1) : '-'}</span>
      `;
      elements.legAveragesContainer.appendChild(row);
    }

    showScreen('end');
  }

  // ==============
  // Event Handlers
  // ==============

  /**
   * Handle keypad button press
   * @param {string} value
   */
  function handleKeyPress(value) {
    if (inputBuffer.length < 3) {
      inputBuffer += value;
      updateInputDisplay();
    }
  }

  /**
   * Handle delete button
   */
  function handleDelete() {
    inputBuffer = inputBuffer.slice(0, -1);
    updateInputDisplay();
  }

  /**
   * Handle enter button
   */
  function handleEnter() {
    if (inputBuffer === '') return;

    const score = parseInt(inputBuffer, 10);

    // Check if we're in edit mode
    if (editingVisitIndex !== null) {
      submitEditedScore(score);
    } else {
      submitScore(score);
    }
  }

  /**
   * Submit an edited score for an existing visit
   * @param {number} newScore
   */
  function submitEditedScore(newScore) {
    const currentLeg = state.legs[state.legs.length - 1];
    if (!currentLeg || editingVisitIndex === null) return;

    const visit = currentLeg.visits[editingVisitIndex];
    if (!visit) return;

    // Validate score
    if (newScore < 0 || newScore > 180) {
      return;
    }

    // Calculate what the player's score would be before this visit
    // by replaying all visits up to (but not including) this one
    let scoreBeforeVisit = state.config.startingScore;
    for (let i = 0; i < editingVisitIndex; i++) {
      if (currentLeg.visits[i].player === visit.player) {
        scoreBeforeVisit -= currentLeg.visits[i].score;
      }
    }

    const newRemaining = scoreBeforeVisit - newScore;

    // Check if this would be a checkout (exactly 0)
    if (newRemaining === 0) {
      // This edit results in a checkout - show checkout modal
      showEditCheckoutModal(newScore, editingVisitIndex);
      return;
    }

    // Update the visit
    const oldScore = visit.score;
    const wasCheckout = visit.isCheckout;

    visit.score = newScore;
    visit.isCheckout = false;
    visit.dartsUsed = 3;

    // If this was the winning checkout, undo the leg win
    if (wasCheckout && currentLeg.winner === visit.player) {
      currentLeg.winner = null;
      if (visit.player === 1) {
        state.player1Legs--;
      } else {
        state.player2Legs--;
      }
      // Also check if match was complete
      if (state.matchComplete) {
        state.matchComplete = false;
        state.matchWinner = null;
      }
    }

    // Recalculate current scores from all visits
    recalculateScores();

    // Exit edit mode
    editingVisitIndex = null;
    inputBuffer = '';
    updateDisplay();
  }

  /**
   * Show checkout modal for an edit that results in checkout
   * @param {number} checkoutScore
   * @param {number} visitIdx
   */
  function showEditCheckoutModal(checkoutScore, visitIdx) {
    elements.checkoutModal.dataset.checkoutScore = checkoutScore;
    elements.checkoutModal.dataset.editVisitIndex = visitIdx;
    showModal(elements.checkoutModal);
  }

  /**
   * Recalculate player scores based on all visits in current leg
   */
  function recalculateScores() {
    const currentLeg = state.legs[state.legs.length - 1];
    if (!currentLeg) return;

    let p1Score = state.config.startingScore;
    let p2Score = state.config.startingScore;

    for (const visit of currentLeg.visits) {
      if (visit.player === 1) {
        p1Score -= visit.score;
      } else {
        p2Score -= visit.score;
      }
    }

    state.player1Score = p1Score;
    state.player2Score = p2Score;
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Start match
    elements.startMatchBtn.addEventListener('click', startMatch);

    // Keypad
    document.querySelectorAll('.key[data-value]').forEach(key => {
      key.addEventListener('click', () => handleKeyPress(key.dataset.value));
    });

    document.querySelector('.key[data-action="delete"]').addEventListener('click', handleDelete);
    document.querySelector('.key[data-action="enter"]').addEventListener('click', handleEnter);

    // Menu
    elements.menuBtn.addEventListener('click', () => showModal(elements.menuModal));
    elements.cancelMenuBtn.addEventListener('click', () => hideModal(elements.menuModal));
    elements.rematchBtn.addEventListener('click', requestRematch);
    elements.newMatchBtn.addEventListener('click', requestNewMatch);

    // Confirm modal
    elements.confirmYesBtn.addEventListener('click', handleConfirmYes);
    elements.confirmNoBtn.addEventListener('click', handleConfirmNo);

    // Checkout modal
    document.querySelectorAll('.btn-dart').forEach(btn => {
      btn.addEventListener('click', () => completeCheckout(parseInt(btn.dataset.darts, 10)));
    });

    // End screen buttons (no confirmation needed - match is already over)
    elements.endRematchBtn.addEventListener('click', rematch);
    elements.endNewMatchBtn.addEventListener('click', newMatch);

    // Keyboard support (for testing on desktop)
    document.addEventListener('keydown', (e) => {
      if (elements.scoringScreen.classList.contains('active') && !elements.checkoutModal.classList.contains('active')) {
        if (e.key >= '0' && e.key <= '9') {
          handleKeyPress(e.key);
        } else if (e.key === 'Backspace') {
          handleDelete();
        } else if (e.key === 'Enter') {
          handleEnter();
        }
      }
    });
  }

  // ==========
  // Initialize
  // ==========

  function init() {
    initEventListeners();
    showScreen('config');
  }

  // Start the app
  init();

})();
