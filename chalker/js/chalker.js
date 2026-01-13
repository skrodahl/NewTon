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
   * @property {number} maxRounds - Maximum rounds before tiebreak
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

  /** @type {'tiebreak'|'starting'|null} - Current mode of the selection modal */
  let selectionModalMode = null;

  // ============
  // DOM Elements
  // ============

  const elements = {
    // Screens
    scoringScreen: document.getElementById('scoring-screen'),
    endScreen: document.getElementById('end-screen'),

    // Config inputs (now in modal)
    laneName: document.getElementById('lane-name'),
    player1Name: document.getElementById('player1-name'),
    player2Name: document.getElementById('player2-name'),
    startingScore: document.getElementById('starting-score'),
    bestOf: document.getElementById('best-of'),
    maxRounds: document.getElementById('max-rounds'),
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
    matchInfoBar: document.getElementById('match-info-bar'),

    // Modals
    configModal: document.getElementById('config-modal'),
    configCancelBtn: document.getElementById('config-cancel-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsCancelBtn: document.getElementById('settings-cancel-btn'),
    newMatchBtn: document.getElementById('new-match-btn'),
    checkoutModal: document.getElementById('checkout-modal'),
    checkoutCancelBtn: document.getElementById('checkout-cancel-btn'),
    tiebreakModal: document.getElementById('tiebreak-modal'),
    tiebreakTitle: document.getElementById('tiebreak-title'),
    tiebreakMessage: document.getElementById('tiebreak-message'),
    tiebreakP1Btn: document.getElementById('tiebreak-p1'),
    tiebreakP2Btn: document.getElementById('tiebreak-p2'),
    tiebreakRandomBtn: document.getElementById('tiebreak-random'),
    tiebreakCancelBtn: document.getElementById('tiebreak-cancel-btn'),
    rematchBtn: document.getElementById('rematch-btn'),
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
    p1140s: document.getElementById('p1-140s'),
    p2140s: document.getElementById('p2-140s'),
    p1180s: document.getElementById('p1-180s'),
    p2180s: document.getElementById('p2-180s'),
    p1ShortLegs: document.getElementById('p1-short-legs'),
    p2ShortLegs: document.getElementById('p2-short-legs'),
    shortLegsLabel: document.getElementById('short-legs-label'),
    p1HighOuts: document.getElementById('p1-high-outs'),
    p2HighOuts: document.getElementById('p2-high-outs'),
    p1First9: document.getElementById('p1-first9'),
    p2First9: document.getElementById('p2-first9'),
    p1MatchAvg: document.getElementById('p1-match-avg'),
    p2MatchAvg: document.getElementById('p2-match-avg'),
    p1LegAvgs: document.getElementById('p1-leg-avgs'),
    p2LegAvgs: document.getElementById('p2-leg-avgs'),
    endMatchInfo: document.getElementById('end-match-info'),
    endLegsContainer: document.getElementById('end-legs-container'),
    endRematchBtn: document.getElementById('end-rematch-btn'),
    endNewMatchBtn: document.getElementById('end-new-match-btn'),
    endHistoryBtn: document.getElementById('end-history-btn'),

    // History
    historyScreen: document.getElementById('history-screen'),
    historyList: document.getElementById('history-list'),
    historyBackBtn: document.getElementById('history-back-btn'),

    // History Detail
    historyDetailScreen: document.getElementById('history-detail-screen'),
    historyDetailBackBtn: document.getElementById('history-detail-back-btn'),
    detailPlayer1: document.getElementById('detail-player1'),
    detailPlayer2: document.getElementById('detail-player2'),
    detailScore: document.getElementById('detail-score'),
    detailDate: document.getElementById('detail-date'),
    detailStatsP1: document.getElementById('detail-stats-p1'),
    detailStatsP2: document.getElementById('detail-stats-p2'),
    detailP1Tons: document.getElementById('detail-p1-tons'),
    detailP2Tons: document.getElementById('detail-p2-tons'),
    detailP1140s: document.getElementById('detail-p1-140s'),
    detailP2140s: document.getElementById('detail-p2-140s'),
    detailP1180s: document.getElementById('detail-p1-180s'),
    detailP2180s: document.getElementById('detail-p2-180s'),
    detailP1ShortLegs: document.getElementById('detail-p1-short-legs'),
    detailP2ShortLegs: document.getElementById('detail-p2-short-legs'),
    detailShortLegsLabel: document.getElementById('detail-short-legs-label'),
    detailP1HighOuts: document.getElementById('detail-p1-high-outs'),
    detailP2HighOuts: document.getElementById('detail-p2-high-outs'),
    detailP1First9: document.getElementById('detail-p1-first9'),
    detailP2First9: document.getElementById('detail-p2-first9'),
    detailP1Avg: document.getElementById('detail-p1-avg'),
    detailP2Avg: document.getElementById('detail-p2-avg'),
    detailP1LegAvgs: document.getElementById('detail-p1-leg-avgs'),
    detailP2LegAvgs: document.getElementById('detail-p2-leg-avgs'),
    detailLegsContainer: document.getElementById('detail-legs-container'),

    // Keypad action buttons
    keyNew: document.getElementById('key-new'),
    keyHistory: document.getElementById('key-history'),
    keyStats: document.getElementById('key-stats'),

    // Live Stats screen
    statsScreen: document.getElementById('stats-screen'),
    statsBackBtn: document.getElementById('stats-back-btn'),
    statsPlayer1Name: document.getElementById('stats-player1-name'),
    statsPlayer2Name: document.getElementById('stats-player2-name'),
    statsLiveScore: document.getElementById('stats-live-score'),
    statsMatchInfo: document.getElementById('stats-match-info'),
    statsHeaderP1: document.getElementById('stats-header-p1'),
    statsHeaderP2: document.getElementById('stats-header-p2'),
    statsP1Tons: document.getElementById('stats-p1-tons'),
    statsP2Tons: document.getElementById('stats-p2-tons'),
    statsP1140s: document.getElementById('stats-p1-140s'),
    statsP2140s: document.getElementById('stats-p2-140s'),
    statsP1180s: document.getElementById('stats-p1-180s'),
    statsP2180s: document.getElementById('stats-p2-180s'),
    statsP1ShortLegs: document.getElementById('stats-p1-short-legs'),
    statsP2ShortLegs: document.getElementById('stats-p2-short-legs'),
    statsShortLegsLabel: document.getElementById('stats-short-legs-label'),
    statsP1HighOuts: document.getElementById('stats-p1-high-outs'),
    statsP2HighOuts: document.getElementById('stats-p2-high-outs'),
    statsP1First9: document.getElementById('stats-p1-first9'),
    statsP2First9: document.getElementById('stats-p2-first9'),
    statsP1MatchAvg: document.getElementById('stats-p1-match-avg'),
    statsP2MatchAvg: document.getElementById('stats-p2-match-avg'),
    statsP1LegAvgs: document.getElementById('stats-p1-leg-avgs'),
    statsP2LegAvgs: document.getElementById('stats-p2-leg-avgs'),
    statsLegsContainer: document.getElementById('stats-legs-container')
  };

  // ===========
  // Screen Flow
  // ===========

  /**
   * Show a specific screen
   * @param {'scoring'|'end'|'history'|'history-detail'|'stats'} screenName
   */
  function showScreen(screenName) {
    elements.scoringScreen.classList.remove('active');
    elements.endScreen.classList.remove('active');
    elements.historyScreen.classList.remove('active');
    elements.historyDetailScreen.classList.remove('active');
    elements.statsScreen.classList.remove('active');

    switch (screenName) {
      case 'scoring':
        elements.scoringScreen.classList.add('active');
        break;
      case 'end':
        elements.endScreen.classList.add('active');
        break;
      case 'history':
        elements.historyScreen.classList.add('active');
        break;
      case 'history-detail':
        elements.historyDetailScreen.classList.add('active');
        break;
      case 'stats':
        elements.statsScreen.classList.add('active');
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
  async function startMatch() {
    const config = {
      laneName: elements.laneName.value ? `Lane ${elements.laneName.value}` : '',
      player1Name: elements.player1Name.value.trim() || 'Player 1',
      player2Name: elements.player2Name.value.trim() || 'Player 2',
      startingScore: parseInt(elements.startingScore.value, 10),
      bestOf: parseInt(elements.bestOf.value, 10),
      maxRounds: parseInt(elements.maxRounds.value, 10)
    };

    // Save settings for next time
    saveSettings(config);

    // Close config modal
    hideModal(elements.configModal);

    state = {
      config: config,
      legs: [],
      player1Legs: 0,
      player2Legs: 0,
      currentPlayer: 1,
      player1Score: config.startingScore,
      player2Score: config.startingScore,
      matchComplete: false,
      matchWinner: null,
      firstLegStarter: 1 // Will be set by selection modal
    };

    // Update UI
    elements.player1Header.textContent = config.player1Name;
    elements.player2Header.textContent = config.player2Name;

    // Show starting player selection
    showStartingPlayerModal();
  }

  /**
   * Complete match start after starting player selection
   * @param {number} starter - 1 or 2
   */
  function completeMatchStart(starter) {
    state.firstLegStarter = starter;

    // Start first leg
    startNewLeg();

    updateDisplay();
    showScreen('scoring');
    saveCurrentMatch();
  }

  /**
   * Get which player starts the current leg
   * Alternates based on firstLegStarter and leg number
   * @returns {number} 1 or 2
   */
  function getLegStarter() {
    const legIndex = state.legs.length - 1; // 0-indexed
    // First leg: firstLegStarter, then alternate
    if (legIndex % 2 === 0) {
      return state.firstLegStarter;
    } else {
      return state.firstLegStarter === 1 ? 2 : 1;
    }
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

    // Set current player based on leg starter
    state.currentPlayer = getLegStarter();
  }

  /**
   * Record a visit (score entry)
   * @param {number} score - Points scored
   * @param {number} dartsUsed - Darts used (default 3)
   * @param {boolean} isCheckout - Whether this is a checkout
   */
  function recordVisit(score, dartsUsed = 3, isCheckout = false) {
    // Clear input buffer before saving (prevents old input appearing after resume)
    inputBuffer = '';

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

      // Check for tie-break: max rounds reached by both players, no checkout
      const maxRounds = state.config.maxRounds;
      const p1Visits = currentLeg.visits.filter(v => v.player === 1).length;
      const p2Visits = currentLeg.visits.filter(v => v.player === 2).length;

      if (p1Visits >= maxRounds && p2Visits >= maxRounds && !currentLeg.winner) {
        updateDisplay();
        showTiebreakModal();
        return;
      }
    }

    updateDisplay();
    saveCurrentMatch();
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
  // Scores impossible to achieve with 3 darts
  const ILLEGAL_SCORES = [163, 166, 169, 172, 173, 175, 176, 178, 179];

  // Checkouts impossible to finish on a double
  const ILLEGAL_CHECKOUTS = [159, 162, 163, 165, 166, 168, 169];

  // Short leg thresholds by starting score format
  const SHORT_LEG_THRESHOLDS = {
    101: 4,
    201: 8,
    301: 13,
    401: 17,
    501: 21,
    601: 25,
    701: 29,
    801: 34,
    901: 38,
    1001: 42
  };

  /**
   * Check if a score is valid (achievable with 3 darts)
   * @param {number} score
   * @returns {boolean}
   */
  function isValidScore(score) {
    if (score < 0 || score > 180) return false;
    if (ILLEGAL_SCORES.includes(score)) return false;
    return true;
  }

  /**
   * Check if a checkout score is valid (can be finished on a double)
   * @param {number} score
   * @returns {boolean}
   */
  function isValidCheckout(score) {
    if (score > 170) return false;
    if (ILLEGAL_CHECKOUTS.includes(score)) return false;
    return true;
  }

  /**
   * Handle score submission
   * @param {number} score
   */
  function submitScore(score) {
    const currentScore = state.currentPlayer === 1 ? state.player1Score : state.player2Score;
    const newScore = currentScore - score;

    // Validate score
    if (!isValidScore(score)) {
      // Invalid/impossible score
      return;
    }

    // Check for checkout
    if (newScore === 0) {
      // Validate checkout is possible (remaining score must be checkable)
      if (!isValidCheckout(currentScore)) {
        return;
      }
      // Checkout! Ask for darts used
      showCheckoutModal(score);
    } else if (newScore < 0 || newScore === 1) {
      // Bust (score exceeds remaining or leaves 1) - reject, user must enter 0 explicitly
      return;
    } else {
      // Normal score
      recordVisit(score);
    }

    clearInput();
  }

  /**
   * Get minimum darts needed for a checkout
   * @param {number} score - Remaining score before checkout
   * @returns {number} 1, 2, or 3
   */
  function getMinDartsForCheckout(score) {
    // 1-dart: doubles (2-40) and bull (50)
    if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50) {
      return 1;
    }
    // 2-dart checkouts: 41-98, 100, 101, 104, 107, 110
    const twoDartCheckouts = [100, 101, 104, 107, 110];
    if ((score >= 41 && score <= 98) || twoDartCheckouts.includes(score)) {
      return 2;
    }
    // Everything else requires 3 darts
    return 3;
  }

  /**
   * Show checkout modal to ask for darts used
   * @param {number} checkoutScore
   */
  function showCheckoutModal(checkoutScore) {
    const currentScore = state.currentPlayer === 1 ? state.player1Score : state.player2Score;
    const minDarts = getMinDartsForCheckout(currentScore);

    // Store the checkout score for when we get the darts count
    elements.checkoutModal.dataset.checkoutScore = checkoutScore;

    // Show/hide dart buttons based on minimum darts needed
    const dartButtons = elements.checkoutModal.querySelectorAll('.btn-dart');
    dartButtons.forEach(btn => {
      const darts = parseInt(btn.dataset.darts, 10);
      btn.style.display = darts >= minDarts ? 'block' : 'none';
    });

    showModal(elements.checkoutModal);
  }

  /**
   * Show starting player selection modal
   */
  function showStartingPlayerModal() {
    selectionModalMode = 'starting';
    const p1Name = state.config.player1Name;
    const p2Name = state.config.player2Name;

    // Set modal content for starting player selection
    elements.tiebreakTitle.textContent = 'Starting Player';
    elements.tiebreakMessage.textContent = 'Select who throws first:';

    // Player 1 shown first (as registered)
    elements.tiebreakP1Btn.textContent = p1Name;
    elements.tiebreakP2Btn.textContent = p2Name;
    elements.tiebreakP1Btn.dataset.player = '1';
    elements.tiebreakP2Btn.dataset.player = '2';

    // Show random button, hide cancel button
    elements.tiebreakRandomBtn.style.display = 'block';
    elements.tiebreakCancelBtn.style.display = 'none';

    showModal(elements.tiebreakModal);
  }

  /**
   * Show tie-break modal when max rounds reached without checkout
   */
  function showTiebreakModal() {
    selectionModalMode = 'tiebreak';
    const legStarter = getLegStarter();
    const p1Name = state.config.player1Name;
    const p2Name = state.config.player2Name;

    // Set modal content for tie-break
    elements.tiebreakTitle.textContent = 'Tie-Break';
    elements.tiebreakMessage.textContent = 'Max rounds reached. Each player throws 3 darts - highest score wins.';

    // Show leg starter first
    if (legStarter === 1) {
      elements.tiebreakP1Btn.textContent = p1Name;
      elements.tiebreakP2Btn.textContent = p2Name;
      elements.tiebreakP1Btn.dataset.player = '1';
      elements.tiebreakP2Btn.dataset.player = '2';
    } else {
      elements.tiebreakP1Btn.textContent = p2Name;
      elements.tiebreakP2Btn.textContent = p1Name;
      elements.tiebreakP1Btn.dataset.player = '2';
      elements.tiebreakP2Btn.dataset.player = '1';
    }

    // Hide random button, show cancel button
    elements.tiebreakRandomBtn.style.display = 'none';
    elements.tiebreakCancelBtn.style.display = 'block';

    showModal(elements.tiebreakModal);
  }

  /**
   * Handle player selection from modal
   * @param {number} buttonIndex - 1, 2, or 'random'
   */
  function handleSelectionModalChoice(buttonIndex) {
    let player;

    if (buttonIndex === 'random') {
      player = Math.random() < 0.5 ? 1 : 2;
    } else {
      player = parseInt(elements[`tiebreakP${buttonIndex}Btn`].dataset.player, 10);
    }

    hideModal(elements.tiebreakModal);

    if (selectionModalMode === 'starting') {
      completeMatchStart(player);
    } else if (selectionModalMode === 'tiebreak') {
      completeTiebreak(player);
    }

    selectionModalMode = null;
  }

  /**
   * Complete tie-break with winner
   * @param {number} player - 1 or 2
   */
  function completeTiebreak(player) {
    const currentLeg = state.legs[state.legs.length - 1];
    currentLeg.winner = player;
    currentLeg.tiebreak = true; // Mark as tie-break win

    // Update leg scores
    if (player === 1) {
      state.player1Legs++;
    } else {
      state.player2Legs++;
    }

    // Check for match end or start new leg
    const legsToWin = Math.ceil(state.config.bestOf / 2);
    if (state.player1Legs >= legsToWin || state.player2Legs >= legsToWin) {
      state.matchComplete = true;
      state.matchWinner = state.player1Legs >= legsToWin ? 1 : 2;
      showEndScreen();
    } else {
      startNewLeg();
      updateDisplay();
    }
    saveCurrentMatch();
  }

  /**
   * Cancel tie-break modal and return to chalkboard
   * Allows referee to correct a score before declaring tie-break winner
   */
  function cancelTiebreak() {
    hideModal(elements.tiebreakModal);
    selectionModalMode = null;
    // Stay on current leg - referee can tap a score to edit it
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
   * Cancel checkout and return to scoring
   */
  function cancelCheckout() {
    hideModal(elements.checkoutModal);
    // Clear any stored data
    delete elements.checkoutModal.dataset.checkoutScore;
    delete elements.checkoutModal.dataset.editVisitIndex;
    // Clear input and re-render
    inputBuffer = '';
    editingVisitIndex = null;
    renderChalkboard();
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

    // Remove all visits that came after this checkout
    // (opponent may have entered scores before the edit was made)
    if (visitIdx < currentLeg.visits.length - 1) {
      currentLeg.visits.splice(visitIdx + 1);
    }

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

    // Show end screen or start next leg
    if (state.matchComplete) {
      showEndScreen();
    } else {
      startNewLeg();
      updateDisplay();
    }
    saveCurrentMatch();
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
    saveCurrentMatch();
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
   * Handle Rematch button from New Match modal
   * Starts new match with same config (no additional confirmation needed)
   */
  function handleRematchFromModal() {
    hideModal(elements.settingsModal);
    startMatch();
  }

  /**
   * Handle New Match button from New Match modal
   * Opens config modal to change settings
   */
  function handleNewMatchFromModal() {
    hideModal(elements.settingsModal);
    showModal(elements.configModal);
  }

  /**
   * Start a rematch (same config) - used from end screen
   */
  function rematch() {
    startMatch();
  }

  /**
   * Show config modal for new match
   */
  function showConfigModal() {
    showModal(elements.configModal);
  }

  /**
   * Show new match modal (Rematch / New Match options)
   */
  function showSettingsModal() {
    showModal(elements.settingsModal);
  }

  // =======
  // Display
  // =======

  /**
   * Update display for idle state (no match)
   */
  function updateIdleDisplay() {
    // Show idle scores
    elements.player1Score.textContent = '---';
    elements.player2Score.textContent = '---';
    elements.player1Score.classList.add('idle');
    elements.player2Score.classList.add('idle');

    // Reset leg display
    elements.legDisplay.textContent = '0 - 0';

    // Reset player names to default or last used
    elements.player1Header.textContent = elements.player1Name.value || 'Player 1';
    elements.player2Header.textContent = elements.player2Name.value || 'Player 2';

    // Remove active state from anchors
    elements.player1Anchor.classList.remove('active');
    elements.player2Anchor.classList.remove('active');

    // Clear chalkboard
    document.getElementById('chalk-tbody').innerHTML = '';

    // Clear match info bar
    elements.matchInfoBar.textContent = '';

    // Disable numpad keys
    updateKeypadState();
  }

  /**
   * Update keypad enabled/disabled state
   */
  function updateKeypadState() {
    const isIdle = !state || state.matchComplete;

    // Disable numpad keys when idle, but keep action buttons enabled
    document.querySelectorAll('.keypad .key').forEach(key => {
      key.disabled = isIdle;
    });

    // Action buttons are always enabled
    document.querySelectorAll('.keypad-actions .key').forEach(key => {
      key.disabled = false;
    });
  }

  /**
   * Update all display elements
   */
  function updateDisplay() {
    if (!state) {
      updateIdleDisplay();
      return;
    }

    // Remove idle state
    elements.player1Score.classList.remove('idle');
    elements.player2Score.classList.remove('idle');

    // Update anchor scores
    elements.player1Score.textContent = state.player1Score;
    elements.player2Score.textContent = state.player2Score;

    // Update leg display
    elements.legDisplay.textContent = `${state.player1Legs} - ${state.player2Legs}`;

    // Update match info bar
    const infoParts = [];
    if (state.config.laneName) infoParts.push(state.config.laneName);
    infoParts.push(state.config.startingScore);
    infoParts.push(`Leg ${state.legs.length} of ${state.config.bestOf}`);
    elements.matchInfoBar.textContent = infoParts.join(' • ');

    // Update active player indicator
    elements.player1Anchor.classList.toggle('active', state.currentPlayer === 1);
    elements.player2Anchor.classList.toggle('active', state.currentPlayer === 2);

    // Enable keypad
    updateKeypadState();

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
    const legStarter = getLegStarter();

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

    // Build all rows
    let html = '';

    // Rows for each round (no starting score row - info bar shows variant)
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

      // Content for cells - wrap tons in span for ring styling
      let p1Content, p2Content;
      if (p1IsNewEntry || p1IsEditing) {
        p1Content = inputBuffer || '';
      } else {
        const p1Num = parseInt(data.p1Scored, 10);
        p1Content = p1Num >= 100 ? `<span>${data.p1Scored}</span>` : data.p1Scored;
      }
      if (p2IsNewEntry || p2IsEditing) {
        p2Content = inputBuffer || '';
      } else {
        const p2Num = parseInt(data.p2Scored, 10);
        p2Content = p2Num >= 100 ? `<span>${data.p2Scored}</span>` : data.p2Scored;
      }

      // Classes for cells
      const p1IsActive = p1IsNewEntry || p1IsEditing;
      const p2IsActive = p2IsNewEntry || p2IsEditing;
      const p1Class = p1IsActive ? 'input-active' : getScoreClass(data.p1Scored);
      const p2Class = p2IsActive ? 'input-active' : getScoreClass(data.p2Scored);

      // Row is empty if no scores and not the active row
      const hasData = data.p1Scored !== '' || data.p2Scored !== '' || p1IsActive || p2IsActive;
      let rowClass = hasData ? '' : 'chalk-row-empty';

      // Tiebreak warning gradient for last 3 rows
      const roundsFromEnd = maxRounds - r;
      if (roundsFromEnd <= 3) {
        rowClass += ` tiebreak-warning-${roundsFromEnd}`;
      }

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
          <td class="col-scored ${p2Class}" ${p2DataAttr}>${p2Content}</td>
          <td class="col-togo">${p2ToGo}</td>
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

    // Mark leg starter in header
    elements.player1Header.classList.toggle('leg-starter', legStarter === 1);
    elements.player2Header.classList.toggle('leg-starter', legStarter === 2);
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
    const shortLegThreshold = SHORT_LEG_THRESHOLDS[state.config.startingScore] || 21;

    const stats = {
      player1: {
        tons: 0,
        ton40s: 0,
        ton80s: 0,
        shortLegs: [],      // Array of dart counts for short legs
        highOuts: [],       // Array of checkout scores >= 101
        first9Scores: [],
        totalScore: 0,
        totalDarts: 0
      },
      player2: {
        tons: 0,
        ton40s: 0,
        ton80s: 0,
        shortLegs: [],
        highOuts: [],
        first9Scores: [],
        totalScore: 0,
        totalDarts: 0
      },
      legs: []              // Per-leg stats for display
    };

    state.legs.forEach((leg, legIndex) => {
      const legStats = {
        player1: { score: 0, darts: 0, visits: 0, checkoutScore: null, tons: 0, ton80s: 0 },
        player2: { score: 0, darts: 0, visits: 0, checkoutScore: null, tons: 0, ton80s: 0 }
      };

      leg.visits.forEach((visit) => {
        const playerStats = visit.player === 1 ? stats.player1 : stats.player2;
        const playerLegStats = visit.player === 1 ? legStats.player1 : legStats.player2;

        // Count tons (100+)
        if (visit.score >= 100) {
          playerStats.tons++;
          playerLegStats.tons++;
        }

        // Count 140+ (includes 180s)
        if (visit.score >= 140) {
          playerStats.ton40s++;
        }

        // Count 180s
        if (visit.score === 180) {
          playerStats.ton80s++;
          playerLegStats.ton80s++;
        }

        // Track checkout score
        if (visit.isCheckout) {
          playerLegStats.checkoutScore = visit.remainingBefore;
          // High outs (101+)
          if (visit.remainingBefore >= 101) {
            playerStats.highOuts.push(visit.remainingBefore);
          }
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
      const p1Avg = legStats.player1.darts > 0
        ? (legStats.player1.score / legStats.player1.darts) * 3
        : null;
      const p2Avg = legStats.player2.darts > 0
        ? (legStats.player2.score / legStats.player2.darts) * 3
        : null;

      // Track short legs (winner only)
      if (leg.winner) {
        const winnerLegStats = leg.winner === 1 ? legStats.player1 : legStats.player2;
        const winnerStats = leg.winner === 1 ? stats.player1 : stats.player2;
        if (winnerLegStats.darts <= shortLegThreshold) {
          winnerStats.shortLegs.push(winnerLegStats.darts);
        }
      }

      // Store per-leg stats for display
      stats.legs.push({
        leg: legIndex + 1,
        winner: leg.winner,
        tiebreak: leg.tiebreak || false,
        player1: {
          avg: p1Avg,
          darts: legStats.player1.darts,
          checkoutScore: legStats.player1.checkoutScore,
          tons: legStats.player1.tons,
          ton80s: legStats.player1.ton80s
        },
        player2: {
          avg: p2Avg,
          darts: legStats.player2.darts,
          checkoutScore: legStats.player2.checkoutScore,
          tons: legStats.player2.tons,
          ton80s: legStats.player2.ton80s
        }
      });
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
   * Populate match stats into DOM elements (shared by end screen and history detail)
   * @param {object} match - Match object with config, legs, stats, player1Legs, player2Legs
   * @param {object} els - Object with DOM element references for stats display
   */
  function populateMatchStats(match, els) {
    const config = match.config;
    const stats = match.stats || {};
    const p1Stats = stats.player1 || {};
    const p2Stats = stats.player2 || {};

    // Player names and score
    els.player1Name.textContent = config.player1Name;
    els.player2Name.textContent = config.player2Name;
    els.finalScore.textContent = `${match.player1Legs} - ${match.player2Legs}`;

    // Stats table headers
    els.statsP1.textContent = config.player1Name;
    els.statsP2.textContent = config.player2Name;

    // Update short legs label with format-specific threshold
    const shortLegThreshold = SHORT_LEG_THRESHOLDS[config.startingScore] || 21;
    els.shortLegsLabel.textContent = `Short Legs (≤${shortLegThreshold})`;

    // Populate stats - handle both array and number formats for shortLegs/highOuts
    els.p1Tons.textContent = p1Stats.tons || 0;
    els.p2Tons.textContent = p2Stats.tons || 0;
    els.p1140s.textContent = p1Stats.ton40s || 0;
    els.p2140s.textContent = p2Stats.ton40s || 0;
    els.p1180s.textContent = p1Stats.ton80s || 0;
    els.p2180s.textContent = p2Stats.ton80s || 0;

    // Short legs: stored as array, display count
    els.p1ShortLegs.textContent = Array.isArray(p1Stats.shortLegs) ? p1Stats.shortLegs.length : (p1Stats.shortLegs || 0);
    els.p2ShortLegs.textContent = Array.isArray(p2Stats.shortLegs) ? p2Stats.shortLegs.length : (p2Stats.shortLegs || 0);

    // High outs: stored as array, display count
    els.p1HighOuts.textContent = Array.isArray(p1Stats.highOuts) ? p1Stats.highOuts.length : (p1Stats.highOuts || 0);
    els.p2HighOuts.textContent = Array.isArray(p2Stats.highOuts) ? p2Stats.highOuts.length : (p2Stats.highOuts || 0);

    els.p1First9.textContent = p1Stats.first9Avg > 0 ? p1Stats.first9Avg.toFixed(1) : '-';
    els.p2First9.textContent = p2Stats.first9Avg > 0 ? p2Stats.first9Avg.toFixed(1) : '-';
    els.p1MatchAvg.textContent = p1Stats.matchAvg > 0 ? p1Stats.matchAvg.toFixed(1) : '-';
    els.p2MatchAvg.textContent = p2Stats.matchAvg > 0 ? p2Stats.matchAvg.toFixed(1) : '-';

    // Calculate and display leg averages
    const legs = match.legs || [];
    const p1LegAvgs = [];
    const p2LegAvgs = [];

    legs.forEach(leg => {
      const visits = leg.visits || [];
      const p1Visits = visits.filter(v => v.player === 1);
      const p2Visits = visits.filter(v => v.player === 2);

      if (p1Visits.length > 0) {
        const p1TotalScore = p1Visits.reduce((sum, v) => sum + v.score, 0);
        const p1TotalDarts = p1Visits.reduce((sum, v) => sum + (v.dartsUsed || 3), 0);
        const p1Avg = (p1TotalScore / p1TotalDarts) * 3;
        p1LegAvgs.push(p1Avg.toFixed(1));
      } else {
        p1LegAvgs.push('-');
      }

      if (p2Visits.length > 0) {
        const p2TotalScore = p2Visits.reduce((sum, v) => sum + v.score, 0);
        const p2TotalDarts = p2Visits.reduce((sum, v) => sum + (v.dartsUsed || 3), 0);
        const p2Avg = (p2TotalScore / p2TotalDarts) * 3;
        p2LegAvgs.push(p2Avg.toFixed(1));
      } else {
        p2LegAvgs.push('-');
      }
    });

    els.p1LegAvgs.textContent = p1LegAvgs.join(', ') || '-';
    els.p2LegAvgs.textContent = p2LegAvgs.join(', ') || '-';
  }

  /**
   * Show end screen with statistics (matches history detail format)
   */
  function showEndScreen() {
    // Build match object from current state (same structure as saved to history)
    const stats = calculateStats();
    const match = {
      config: state.config,
      legs: state.legs,
      player1Legs: state.player1Legs,
      player2Legs: state.player2Legs,
      matchWinner: state.matchWinner,
      stats: stats
    };

    // Match info line (end screen specific - shows format without date)
    const bestOf = match.config.bestOf || 3;
    elements.endMatchInfo.textContent = `${match.config.startingScore} • Best of ${bestOf}`;

    // Populate stats using shared function
    const endScreenEls = {
      player1Name: elements.winnerName,
      player2Name: elements.loserName,
      finalScore: elements.finalScore,
      statsP1: elements.statsPlayer1,
      statsP2: elements.statsPlayer2,
      shortLegsLabel: elements.shortLegsLabel,
      p1Tons: elements.p1Tons,
      p2Tons: elements.p2Tons,
      p1140s: elements.p1140s,
      p2140s: elements.p2140s,
      p1180s: elements.p1180s,
      p2180s: elements.p2180s,
      p1ShortLegs: elements.p1ShortLegs,
      p2ShortLegs: elements.p2ShortLegs,
      p1HighOuts: elements.p1HighOuts,
      p2HighOuts: elements.p2HighOuts,
      p1First9: elements.p1First9,
      p2First9: elements.p2First9,
      p1MatchAvg: elements.p1MatchAvg,
      p2MatchAvg: elements.p2MatchAvg,
      p1LegAvgs: elements.p1LegAvgs,
      p2LegAvgs: elements.p2LegAvgs
    };
    populateMatchStats(match, endScreenEls);

    // Render leg scoresheets using shared function
    renderLegScoresheets(match, elements.endLegsContainer);

    showScreen('end');

    // Save to history (pass pre-built match to avoid recalculating stats)
    saveMatchToHistory(match);
  }

  // ==============
  // Event Handlers
  // ==============

  /**
   * Check if any modal is currently active
   * @returns {boolean}
   */
  function isModalActive() {
    return elements.checkoutModal.classList.contains('active') ||
           elements.tiebreakModal.classList.contains('active') ||
           elements.configModal.classList.contains('active') ||
           elements.settingsModal.classList.contains('active') ||
           elements.confirmModal.classList.contains('active');
  }

  /**
   * Handle keypad button press
   * @param {string} value
   */
  function handleKeyPress(value) {
    if (isModalActive()) return;
    if (inputBuffer.length < 3) {
      inputBuffer += value;
      updateInputDisplay();
    }
  }

  /**
   * Handle delete button
   */
  function handleDelete() {
    if (isModalActive()) return;
    inputBuffer = inputBuffer.slice(0, -1);
    updateInputDisplay();
  }

  /**
   * Handle enter button
   */
  function handleEnter() {
    if (isModalActive()) return;
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

    // Handle empty input as delete request
    if (inputBuffer === '') {
      // Only allow deleting the very last visit
      if (editingVisitIndex === currentLeg.visits.length - 1) {
        const deletedVisit = currentLeg.visits.pop();
        state.currentPlayer = deletedVisit.player;
        recalculateScores();
        editingVisitIndex = null;
        updateDisplay();
        saveCurrentMatch();
      }
      return;
    }

    // Validate score
    if (!isValidScore(newScore)) {
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

    // Check if edit would make subsequent visits invalid
    // Replay this player's remaining visits with the new score
    let simulatedRemaining = newRemaining;
    for (let i = editingVisitIndex + 1; i < currentLeg.visits.length; i++) {
      if (currentLeg.visits[i].player === visit.player) {
        simulatedRemaining -= currentLeg.visits[i].score;
        // Invalid if any subsequent visit would cause bust or checkout
        // (checkout at 0 requires editing that visit directly)
        if (simulatedRemaining <= 1) {
          return; // Reject edit silently
        }
      }
    }

    // Check if this would be a checkout (exactly 0)
    if (newRemaining === 0) {
      // Validate checkout is possible
      if (!isValidCheckout(scoreBeforeVisit)) {
        return;
      }
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
    saveCurrentMatch();
  }

  /**
   * Show checkout modal for an edit that results in checkout
   * @param {number} checkoutScore
   * @param {number} visitIdx
   */
  function showEditCheckoutModal(checkoutScore, visitIdx) {
    // Calculate score before the visit being edited
    const currentLeg = state.legs[state.legs.length - 1];
    const visit = currentLeg.visits[visitIdx];
    let scoreBeforeVisit = state.config.startingScore;
    for (let i = 0; i < visitIdx; i++) {
      if (currentLeg.visits[i].player === visit.player) {
        scoreBeforeVisit -= currentLeg.visits[i].score;
      }
    }

    const minDarts = getMinDartsForCheckout(scoreBeforeVisit);

    elements.checkoutModal.dataset.checkoutScore = checkoutScore;
    elements.checkoutModal.dataset.editVisitIndex = visitIdx;

    // Show/hide dart buttons based on minimum darts needed
    const dartButtons = elements.checkoutModal.querySelectorAll('.btn-dart');
    dartButtons.forEach(btn => {
      const darts = parseInt(btn.dataset.darts, 10);
      btn.style.display = darts >= minDarts ? 'block' : 'none';
    });

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
   * Handle NEW button - shows settings modal during match, config modal when idle
   */
  function handleNewButton() {
    if (state && !state.matchComplete) {
      // During match: show Rematch/Abandon options
      showSettingsModal();
    } else {
      // Idle: show config modal to start new match
      showConfigModal();
    }
  }

  /**
   * Show live stats for the current match
   */
  function showLiveStats() {
    if (!state) return;

    // Build match object from current state
    const stats = calculateStats();
    const match = {
      config: state.config,
      legs: state.legs,
      player1Legs: state.player1Legs,
      player2Legs: state.player2Legs,
      stats: stats
    };

    // Match info line
    const bestOf = match.config.bestOf || 3;
    elements.statsMatchInfo.textContent = `${match.config.startingScore} • Best of ${bestOf}`;

    // Populate stats using shared function
    const statsEls = {
      player1Name: elements.statsPlayer1Name,
      player2Name: elements.statsPlayer2Name,
      finalScore: elements.statsLiveScore,
      statsP1: elements.statsHeaderP1,
      statsP2: elements.statsHeaderP2,
      shortLegsLabel: elements.statsShortLegsLabel,
      p1Tons: elements.statsP1Tons,
      p2Tons: elements.statsP2Tons,
      p1140s: elements.statsP1140s,
      p2140s: elements.statsP2140s,
      p1180s: elements.statsP1180s,
      p2180s: elements.statsP2180s,
      p1ShortLegs: elements.statsP1ShortLegs,
      p2ShortLegs: elements.statsP2ShortLegs,
      p1HighOuts: elements.statsP1HighOuts,
      p2HighOuts: elements.statsP2HighOuts,
      p1First9: elements.statsP1First9,
      p2First9: elements.statsP2First9,
      p1MatchAvg: elements.statsP1MatchAvg,
      p2MatchAvg: elements.statsP2MatchAvg,
      p1LegAvgs: elements.statsP1LegAvgs,
      p2LegAvgs: elements.statsP2LegAvgs
    };
    populateMatchStats(match, statsEls);

    // Render leg scoresheets (includes current leg in progress)
    renderLiveStatsScoresheets(match);

    showScreen('stats');
  }

  /**
   * Render leg scoresheets for live stats (includes current leg in progress)
   * @param {object} match - Match object with config, legs
   */
  function renderLiveStatsScoresheets(match) {
    const config = match.config;
    const legs = match.legs || [];

    if (legs.length === 0) {
      elements.statsLegsContainer.innerHTML = '<p>No leg data yet</p>';
      return;
    }

    let html = '<h3>Leg Scoresheets</h3>';

    // Track running score after each leg
    let p1LegsWon = 0;
    let p2LegsWon = 0;

    legs.forEach((leg, legIndex) => {
      const isInProgress = !leg.winner;
      const winnerName = leg.winner
        ? (leg.winner === 1 ? config.player1Name : config.player2Name)
        : null;

      // Update running score after this leg (only for completed legs)
      if (leg.winner === 1) {
        p1LegsWon++;
      } else if (leg.winner === 2) {
        p2LegsWon++;
      }

      const runningScore = `${p1LegsWon} - ${p2LegsWon}`;

      // Calculate total darts for this leg to determine if short leg
      const visits = leg.visits || [];
      const winnerVisits = leg.winner ? visits.filter(v => v.player === leg.winner) : [];
      const totalDarts = winnerVisits.reduce((sum, v) => sum + (v.dartsUsed || 3), 0);
      const shortLegThreshold = SHORT_LEG_THRESHOLDS[config.startingScore] || 21;
      const isShortLeg = leg.winner && totalDarts <= shortLegThreshold;
      const shortLegBadge = isShortLeg ? '<span class="short-leg-badge">Short Leg</span>' : '';

      // Status text
      let statusText;
      if (isInProgress) {
        statusText = '<span class="in-progress-badge">In Progress</span>';
      } else {
        statusText = `${winnerName} wins ${shortLegBadge}`;
      }

      html += `
        <div class="leg-scoresheet${isInProgress ? ' leg-in-progress' : ''}">
          <div class="leg-scoresheet-header">
            <span class="leg-scoresheet-title">Leg ${legIndex + 1}</span>
            <span class="leg-scoresheet-score">${isInProgress ? '' : runningScore}</span>
            <span class="leg-scoresheet-winner">${statusText}</span>
          </div>
          <table class="leg-scoresheet-table">
            <thead>
              <tr>
                <th class="col-darts">Darts</th>
                <th class="col-scored">${config.player1Name.substring(0, 8)}</th>
                <th class="col-remaining">Left</th>
                <th class="col-scored">${config.player2Name.substring(0, 8)}</th>
                <th class="col-remaining">Left</th>
                <th class="col-darts">Darts</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Build visit data by round
      const startingScore = leg.startingScore || config.startingScore;

      // Group visits by round
      const p1Visits = visits.filter(v => v.player === 1);
      const p2Visits = visits.filter(v => v.player === 2);
      const maxRounds = Math.max(p1Visits.length, p2Visits.length, 1);

      let p1Remaining = startingScore;
      let p2Remaining = startingScore;
      let p1Darts = 0;
      let p2Darts = 0;

      for (let round = 0; round < maxRounds; round++) {
        const p1Visit = p1Visits[round];
        const p2Visit = p2Visits[round];

        let p1Scored = '';
        let p1Left = '';
        let p2Scored = '';
        let p2Left = '';
        let p1DartDisplay = '';
        let p2DartDisplay = '';

        if (p1Visit) {
          p1Darts += p1Visit.dartsUsed || 3;
          p1DartDisplay = p1Darts;
          p1Remaining -= p1Visit.score;
          p1Scored = p1Visit.score;
          p1Left = p1Remaining;

          if (p1Visit.isCheckout) {
            const isHighOut = p1Visit.score >= 101;
            const cssClass = isHighOut ? 'high-out-score' : 'checkout-score';
            p1Scored = `<span class="${cssClass}">${p1Visit.score}</span>`;
            p1Left = `<span class="checkout-score">0</span>`;
            p1DartDisplay = `<span class="checkout-score">${p1Darts}</span>`;
          } else if (p1Visit.score === 180) {
            p1Scored = `<span class="ton-180-score">${p1Visit.score}</span>`;
          } else if (p1Visit.score >= 100) {
            p1Scored = `<span class="ton-score">${p1Visit.score}</span>`;
          }
        }

        if (p2Visit) {
          p2Darts += p2Visit.dartsUsed || 3;
          p2DartDisplay = p2Darts;
          p2Remaining -= p2Visit.score;
          p2Scored = p2Visit.score;
          p2Left = p2Remaining;

          if (p2Visit.isCheckout) {
            const isHighOut = p2Visit.score >= 101;
            const cssClass = isHighOut ? 'high-out-score' : 'checkout-score';
            p2Scored = `<span class="${cssClass}">${p2Visit.score}</span>`;
            p2Left = `<span class="checkout-score">0</span>`;
            p2DartDisplay = `<span class="checkout-score">${p2Darts}</span>`;
          } else if (p2Visit.score === 180) {
            p2Scored = `<span class="ton-180-score">${p2Visit.score}</span>`;
          } else if (p2Visit.score >= 100) {
            p2Scored = `<span class="ton-score">${p2Visit.score}</span>`;
          }
        }

        html += `
          <tr>
            <td class="col-darts">${p1DartDisplay}</td>
            <td class="col-scored">${p1Scored}</td>
            <td class="col-remaining">${p1Left}</td>
            <td class="col-scored">${p2Scored}</td>
            <td class="col-remaining">${p2Left}</td>
            <td class="col-darts">${p2DartDisplay}</td>
          </tr>
        `;
      }

      // Show remaining scores for in-progress leg
      if (isInProgress && (p1Remaining !== startingScore || p2Remaining !== startingScore)) {
        html += `
          <tr class="current-remaining-row">
            <td class="col-darts"></td>
            <td class="col-scored"></td>
            <td class="col-remaining current-remaining">${p1Remaining}</td>
            <td class="col-scored"></td>
            <td class="col-remaining current-remaining">${p2Remaining}</td>
            <td class="col-darts"></td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    elements.statsLegsContainer.innerHTML = html;
  }

  /**
   * Go back from stats to scoring screen
   */
  function statsBack() {
    showScreen('scoring');
  }

  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Start match (from config modal)
    elements.startMatchBtn.addEventListener('click', startMatch);
    elements.configCancelBtn.addEventListener('click', () => hideModal(elements.configModal));

    // New Match modal (Rematch / New Match)
    elements.settingsCancelBtn.addEventListener('click', () => hideModal(elements.settingsModal));
    elements.rematchBtn.addEventListener('click', handleRematchFromModal);
    elements.newMatchBtn.addEventListener('click', handleNewMatchFromModal);

    // Keypad number keys
    document.querySelectorAll('.keypad .key[data-value]').forEach(key => {
      key.addEventListener('click', () => handleKeyPress(key.dataset.value));
    });

    document.querySelector('.key[data-action="delete"]').addEventListener('click', handleDelete);
    document.querySelector('.key[data-action="enter"]').addEventListener('click', handleEnter);

    // Keypad action buttons
    elements.keyNew.addEventListener('click', handleNewButton);
    elements.keyHistory.addEventListener('click', showHistoryScreen);
    elements.keyStats.addEventListener('click', showLiveStats);

    // Stats back button
    elements.statsBackBtn.addEventListener('click', statsBack);

    // Confirm modal
    elements.confirmYesBtn.addEventListener('click', handleConfirmYes);
    elements.confirmNoBtn.addEventListener('click', handleConfirmNo);

    // Checkout modal
    document.querySelectorAll('.btn-dart').forEach(btn => {
      btn.addEventListener('click', () => completeCheckout(parseInt(btn.dataset.darts, 10)));
    });
    elements.checkoutCancelBtn.addEventListener('click', cancelCheckout);

    // Selection modal (starting player / tie-break)
    elements.tiebreakP1Btn.addEventListener('click', () => handleSelectionModalChoice(1));
    elements.tiebreakP2Btn.addEventListener('click', () => handleSelectionModalChoice(2));
    elements.tiebreakRandomBtn.addEventListener('click', () => handleSelectionModalChoice('random'));
    elements.tiebreakCancelBtn.addEventListener('click', cancelTiebreak);

    // End screen buttons (no confirmation needed - match is already over)
    elements.endRematchBtn.addEventListener('click', rematch);
    elements.endNewMatchBtn.addEventListener('click', showConfigModal);
    elements.endHistoryBtn.addEventListener('click', showHistoryScreen);

    // History
    elements.historyBackBtn.addEventListener('click', historyBack);
    elements.historyDetailBackBtn.addEventListener('click', historyDetailBack);

    // Keyboard support (for testing on desktop)
    document.addEventListener('keydown', (e) => {
      if (elements.scoringScreen.classList.contains('active') && !isModalActive()) {
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

  /**
   * Load saved settings and pre-fill config form
   */
  async function loadSettings() {
    try {
      const saved = await dbGet('settings', 'default');
      if (saved) {
        // Extract lane number from "Lane X" format, or empty for no lane
        const laneMatch = saved.laneName?.match(/Lane (\d+)/);
        elements.laneName.value = laneMatch ? laneMatch[1] : '';
        elements.player1Name.value = saved.player1Name || '';
        elements.player2Name.value = saved.player2Name || '';
        elements.startingScore.value = saved.startingScore || 501;
        elements.bestOf.value = saved.bestOf || 3;
        elements.maxRounds.value = saved.maxRounds || 20;
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  /**
   * Save current settings to IndexedDB
   * @param {object} config - Match configuration
   */
  async function saveSettings(config) {
    try {
      await dbPut('settings', { id: 'default', ...config });
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  /**
   * Save current match state to IndexedDB
   */
  async function saveCurrentMatch() {
    if (!state) return;
    try {
      await dbPut('current_match', {
        id: 'active',
        state: state,
        inputBuffer: inputBuffer,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('Failed to save match:', e);
    }
  }

  /**
   * Clear saved match from IndexedDB
   */
  async function clearCurrentMatch() {
    try {
      await dbDelete('current_match', 'active');
    } catch (e) {
      console.warn('Failed to clear match:', e);
    }
  }

  /**
   * Save completed match to history
   * @param {object} [matchData] - Optional pre-built match object (avoids recalculating stats)
   */
  async function saveMatchToHistory(matchData) {
    if (!state || !state.matchComplete) return;
    try {
      // Use provided match data or build from state
      const match = matchData ? {
        timestamp: Date.now(),
        config: matchData.config,
        legs: matchData.legs,
        player1Legs: matchData.player1Legs,
        player2Legs: matchData.player2Legs,
        matchWinner: matchData.matchWinner,
        stats: matchData.stats
      } : {
        timestamp: Date.now(),
        config: state.config,
        legs: state.legs,
        player1Legs: state.player1Legs,
        player2Legs: state.player2Legs,
        matchWinner: state.matchWinner,
        stats: calculateStats()
      };
      await dbPut('match_history', match);
      await clearCurrentMatch();
      await trimHistory();
    } catch (e) {
      console.warn('Failed to save match to history:', e);
    }
  }

  /**
   * Trim history to MAX_HISTORY matches
   */
  async function trimHistory() {
    try {
      const count = await dbCount('match_history');
      if (count > MAX_HISTORY) {
        const all = await dbGetAllByIndex('match_history', 'timestamp', 'next'); // oldest first
        const toDelete = all.slice(0, count - MAX_HISTORY);
        for (const match of toDelete) {
          await dbDelete('match_history', match.id);
        }
      }
    } catch (e) {
      console.warn('Failed to trim history:', e);
    }
  }

  /**
   * Show match history screen
   */
  async function showHistoryScreen() {
    try {
      const matches = await dbGetAllByIndex('match_history', 'timestamp', 'prev');
      renderHistoryList(matches);
    } catch (e) {
      console.warn('Failed to load history:', e);
      renderHistoryList([]);
    }
    showScreen('history');
  }

  /** @type {Array} Cached history matches for detail view */
  let historyMatches = [];

  /**
   * Format date as YYYY-MM-DD
   * @param {Date} date
   * @returns {string}
   */
  function formatDateYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Render history list
   * @param {array} matches
   */
  function renderHistoryList(matches) {
    historyMatches = matches; // Cache for detail view

    if (matches.length === 0) {
      elements.historyList.innerHTML = '<div class="history-empty">No match history yet</div>';
      return;
    }

    elements.historyList.innerHTML = matches.map((m, index) => {
      const date = new Date(m.timestamp);
      const dateStr = formatDateYMD(date);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const winnerName = m.matchWinner === 1 ? m.config.player1Name : m.config.player2Name;
      const bestOf = m.config.bestOf || 3;
      return `
        <div class="history-item" data-index="${index}">
          <div class="history-players">${m.config.player1Name} vs ${m.config.player2Name}</div>
          <div class="history-score">${m.player1Legs} - ${m.player2Legs}</div>
          <div class="history-date">${dateStr} ${timeStr} • ${m.config.startingScore} • Best of ${bestOf} • ${winnerName} wins</div>
        </div>
      `;
    }).join('');

    // Add click handlers for each item
    elements.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index, 10);
        showHistoryDetail(historyMatches[index]);
      });
    });
  }

  /**
   * Show history detail for a match
   * @param {object} match
   */
  function showHistoryDetail(match) {
    const config = match.config;

    // Date line (history specific - includes timestamp)
    const date = new Date(match.timestamp);
    const bestOf = config.bestOf || 3;
    elements.detailDate.textContent = formatDateYMD(date) + ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ` • ${config.startingScore} • Best of ${bestOf}`;

    // Populate stats using shared function
    const historyDetailEls = {
      player1Name: elements.detailPlayer1,
      player2Name: elements.detailPlayer2,
      finalScore: elements.detailScore,
      statsP1: elements.detailStatsP1,
      statsP2: elements.detailStatsP2,
      shortLegsLabel: elements.detailShortLegsLabel,
      p1Tons: elements.detailP1Tons,
      p2Tons: elements.detailP2Tons,
      p1140s: elements.detailP1140s,
      p2140s: elements.detailP2140s,
      p1180s: elements.detailP1180s,
      p2180s: elements.detailP2180s,
      p1ShortLegs: elements.detailP1ShortLegs,
      p2ShortLegs: elements.detailP2ShortLegs,
      p1HighOuts: elements.detailP1HighOuts,
      p2HighOuts: elements.detailP2HighOuts,
      p1First9: elements.detailP1First9,
      p2First9: elements.detailP2First9,
      p1MatchAvg: elements.detailP1Avg,
      p2MatchAvg: elements.detailP2Avg,
      p1LegAvgs: elements.detailP1LegAvgs,
      p2LegAvgs: elements.detailP2LegAvgs
    };
    populateMatchStats(match, historyDetailEls);

    // Render leg scoresheets using shared function
    renderLegScoresheets(match, elements.detailLegsContainer);

    showScreen('history-detail');
  }

  /**
   * Render leg scoresheets for match detail (shared by end screen and history)
   * @param {object} match - Match object with config, legs
   * @param {HTMLElement} container - Container element to render into
   */
  function renderLegScoresheets(match, container) {
    const config = match.config;
    const legs = match.legs || [];

    if (legs.length === 0) {
      container.innerHTML = '<p>No leg data available</p>';
      return;
    }

    let html = '<h3>Leg Scoresheets</h3>';

    // Track running score after each leg
    let p1LegsWon = 0;
    let p2LegsWon = 0;

    legs.forEach((leg, legIndex) => {
      const winnerName = leg.winner === 1 ? config.player1Name : config.player2Name;

      // Update running score after this leg (before rendering)
      if (leg.winner === 1) {
        p1LegsWon++;
      } else if (leg.winner === 2) {
        p2LegsWon++;
      }

      const runningScore = `${p1LegsWon} - ${p2LegsWon}`;

      // Calculate total darts for this leg to determine if short leg
      const visits = leg.visits || [];
      const winnerVisits = visits.filter(v => v.player === leg.winner);
      const totalDarts = winnerVisits.reduce((sum, v) => sum + (v.dartsUsed || 3), 0);
      const shortLegThreshold = SHORT_LEG_THRESHOLDS[config.startingScore] || 21;
      const isShortLeg = totalDarts <= shortLegThreshold;
      const shortLegBadge = isShortLeg ? '<span class="short-leg-badge">Short Leg</span>' : '';

      html += `
        <div class="leg-scoresheet">
          <div class="leg-scoresheet-header">
            <span class="leg-scoresheet-title">Leg ${legIndex + 1}</span>
            <span class="leg-scoresheet-score">${runningScore}</span>
            <span class="leg-scoresheet-winner">${winnerName} wins ${shortLegBadge}</span>
          </div>
          <table class="leg-scoresheet-table">
            <thead>
              <tr>
                <th class="col-darts">Darts</th>
                <th class="col-scored">${config.player1Name.substring(0, 8)}</th>
                <th class="col-remaining">Left</th>
                <th class="col-scored">${config.player2Name.substring(0, 8)}</th>
                <th class="col-remaining">Left</th>
                <th class="col-darts">Darts</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Build visit data by round
      const startingScore = leg.startingScore || config.startingScore;

      // Group visits by round (visits already defined above for short leg calculation)
      const p1Visits = visits.filter(v => v.player === 1);
      const p2Visits = visits.filter(v => v.player === 2);
      const maxRounds = Math.max(p1Visits.length, p2Visits.length);

      let p1Remaining = startingScore;
      let p2Remaining = startingScore;
      let p1Darts = 0;
      let p2Darts = 0;

      for (let round = 0; round < maxRounds; round++) {
        const p1Visit = p1Visits[round];
        const p2Visit = p2Visits[round];

        let p1Scored = '';
        let p1Left = '';
        let p2Scored = '';
        let p2Left = '';
        let p1DartDisplay = '';
        let p2DartDisplay = '';

        if (p1Visit) {
          // Add darts for this visit (use actual dartsUsed for checkout, otherwise 3)
          p1Darts += p1Visit.dartsUsed || 3;
          p1DartDisplay = p1Darts;
          p1Remaining -= p1Visit.score;
          p1Scored = p1Visit.score;
          p1Left = p1Remaining;

          // Color coding: checkout (green), 180 (gold), ton (blue), high out (green)
          if (p1Visit.isCheckout) {
            const isHighOut = p1Visit.score >= 101;
            const cssClass = isHighOut ? 'high-out-score' : 'checkout-score';
            p1Scored = `<span class="${cssClass}">${p1Visit.score}</span>`;
            p1Left = `<span class="checkout-score">0</span>`;
            p1DartDisplay = `<span class="checkout-score">${p1Darts}</span>`;
          } else if (p1Visit.score === 180) {
            p1Scored = `<span class="ton-180-score">${p1Visit.score}</span>`;
          } else if (p1Visit.score >= 100) {
            p1Scored = `<span class="ton-score">${p1Visit.score}</span>`;
          }
        }

        if (p2Visit) {
          // Add darts for this visit (use actual dartsUsed for checkout, otherwise 3)
          p2Darts += p2Visit.dartsUsed || 3;
          p2DartDisplay = p2Darts;
          p2Remaining -= p2Visit.score;
          p2Scored = p2Visit.score;
          p2Left = p2Remaining;

          // Color coding: checkout (green), 180 (gold), ton (blue), high out (green)
          if (p2Visit.isCheckout) {
            const isHighOut = p2Visit.score >= 101;
            const cssClass = isHighOut ? 'high-out-score' : 'checkout-score';
            p2Scored = `<span class="${cssClass}">${p2Visit.score}</span>`;
            p2Left = `<span class="checkout-score">0</span>`;
            p2DartDisplay = `<span class="checkout-score">${p2Darts}</span>`;
          } else if (p2Visit.score === 180) {
            p2Scored = `<span class="ton-180-score">${p2Visit.score}</span>`;
          } else if (p2Visit.score >= 100) {
            p2Scored = `<span class="ton-score">${p2Visit.score}</span>`;
          }
        }

        html += `
          <tr>
            <td class="col-darts">${p1DartDisplay}</td>
            <td class="col-scored">${p1Scored}</td>
            <td class="col-remaining">${p1Left}</td>
            <td class="col-scored">${p2Scored}</td>
            <td class="col-remaining">${p2Left}</td>
            <td class="col-darts">${p2DartDisplay}</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Go back from history detail to history list
   */
  function historyDetailBack() {
    showScreen('history');
  }

  /**
   * Go back from history to scoring screen
   */
  function historyBack() {
    showScreen('scoring');
    if (!state || state.matchComplete) {
      updateIdleDisplay();
    }
  }

  /**
   * Check for active match on load and offer to resume
   */
  async function checkForActiveMatch() {
    try {
      const saved = await dbGet('current_match', 'active');
      if (saved && saved.state && !saved.state.matchComplete) {
        // Resume the match
        state = saved.state;
        inputBuffer = saved.inputBuffer || '';

        // Update UI with match info
        elements.player1Header.textContent = state.config.player1Name;
        elements.player2Header.textContent = state.config.player2Name;

        updateDisplay();
        showScreen('scoring');
        return true;
      }
    } catch (e) {
      console.warn('Failed to check for active match:', e);
    }
    return false;
  }

  async function init() {
    await openDB();
    initEventListeners();
    await loadSettings();

    // Check for active match to resume
    const resumed = await checkForActiveMatch();
    if (!resumed) {
      // Show scoring screen in idle state
      showScreen('scoring');
      updateIdleDisplay();
    }
  }

  // Start the app
  init();

})();
