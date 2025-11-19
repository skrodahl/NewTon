/**
 * @file Type definitions for NewTon DC Tournament Manager
 * @description JSDoc typedefs for core data structures.
 * This file contains no executable code - only type annotations for IDE support.
 *
 * Benefits:
 * - IDE autocomplete for all properties
 * - Hover documentation
 * - Type checking and error detection
 * - Self-documenting codebase
 *
 * TODO: Function Annotations (add incrementally as you touch these files)
 *
 * Priority 1 - Core progression functions (clean-match-progression.js):
 * - advancePlayer(matchId, winner, loser) → boolean
 * - completeMatch(matchId, winnerNumber, score1, score2, type) → boolean
 * - calculateAllRankings() → void
 * - generateCleanBracket() → boolean
 * - processAutoAdvancements() → void
 *
 * Priority 2 - Tournament management (tournament-management.js):
 * - createTournament() → void
 * - saveTournament() → void
 * - saveTournamentOnly(shouldLog) → void
 * - loadSpecificTournament(id) → void (shows confirmation modal)
 * - continueLoadProcess(selectedTournament) → void (actual loading)
 * - exportTournament() → void
 * - importTournament(event) → void
 *
 * Priority 3 - Player management (player-management.js):
 * - addPlayer(name) → Player
 * - removePlayer(id) → void
 * - togglePaid(id) → void
 * - updatePlayerStats(id, stats) → void
 *
 * Priority 4 - Match state functions (bracket-rendering.js):
 * - getMatchState(match) → MatchState
 * - showMatchCommandCenter() → void
 * - populateRefereeSuggestions() → void
 *
 * Priority 5 - History/Undo system (bracket-rendering.js):
 * - addToHistory(transaction) → void
 * - undoLastAction() → boolean
 * - rebuildFromHistory() → void
 */

// ============================================================================
// PLAYER TYPES
// ============================================================================

/**
 * @typedef {Object} Player
 * @property {number} id - Unique identifier (timestamp-based, e.g., Date.now())
 * @property {string} name - Player's display name
 * @property {boolean} paid - Whether player has paid entry fee
 * @property {PlayerStats} stats - Player statistics object
 * @property {number|null} placement - Final tournament placement (1, 2, 3, 4, 5, 7, 9, 13, 17, 25), null if not yet determined
 * @property {boolean} eliminated - Whether player has been eliminated from tournament
 * @property {boolean} [isBye] - Optional: true if this is a bye/walkover placeholder
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number[]|number} shortLegs - Array of dart counts for short legs (9-21 darts), or legacy number count
 * @property {number[]} highOuts - Array of high checkout scores (101-170)
 * @property {number} tons - Count of ton scores (100+)
 * @property {number} oneEighties - Count of 180 scores
 */

// ============================================================================
// MATCH TYPES
// ============================================================================

/**
 * @typedef {Object} Match
 * @property {string} id - Match identifier (e.g., 'FS-1-1', 'BS-2-3', 'BS-FINAL', 'GRAND-FINAL')
 * @property {number} numericId - Numeric match ID for sequencing
 * @property {number} round - Round number within the side
 * @property {string} side - 'frontside', 'backside', or 'grand-final'
 * @property {Player|null} player1 - First player slot
 * @property {Player|null} player2 - Second player slot
 * @property {Player|null} winner - Winner of the match, null if not completed
 * @property {Player|null} loser - Loser of the match, null if not completed
 * @property {number|null} lane - Assigned lane number (1-20), null if not assigned
 * @property {number} legs - Best-of legs for this match (from config)
 * @property {number|null} referee - Player ID of assigned referee, null if not assigned
 * @property {boolean} active - Whether match is currently in progress (live)
 * @property {boolean} completed - Whether match has been completed
 * @property {number} [positionInRound] - Position within the round (for ordering)
 * @property {boolean} [autoAdvanced] - Optional: true if match was auto-completed (walkover)
 * @property {number} [completedAt] - Optional: timestamp when match was completed (Date.now())
 * @property {MatchFinalScore} [finalScore] - Optional: leg score details
 */

/**
 * @typedef {Object} MatchFinalScore
 * @property {number} winnerLegs - Number of legs won by the winner
 * @property {number} loserLegs - Number of legs won by the loser
 * @property {number} winnerId - Player ID of the winner
 * @property {number} loserId - Player ID of the loser
 */

/**
 * @typedef {'pending' | 'ready' | 'live' | 'completed'} MatchState
 * Match state determined by getMatchState() function
 * - pending: waiting for players (TBD)
 * - ready: both players assigned, can start
 * - live: match in progress (active = true)
 * - completed: match finished
 */

/**
 * @typedef {'frontside' | 'backside' | 'grand-final'} MatchSide
 * Which side of the bracket the match belongs to
 */

// ============================================================================
// TOURNAMENT TYPES
// ============================================================================

/**
 * @typedef {Object} Tournament
 * @property {number} id - Unique identifier (timestamp-based)
 * @property {string} name - Tournament name
 * @property {string} date - Tournament date in YYYY-MM-DD format
 * @property {string} created - ISO timestamp when tournament was created
 * @property {TournamentStatus} status - Tournament status: 'setup', 'active', or 'completed'
 * @property {Player[]} players - Array of registered players
 * @property {Match[]} matches - Array of all tournament matches
 * @property {Player[]} bracket - Array of players in bracket positions
 * @property {8|16|32} [bracketSize] - Bracket size
 * @property {Object.<string, number>} placements - Map of player ID (string) to placement rank
 * @property {boolean} [readOnly] - Optional: true for completed tournaments to prevent modifications
 * @property {string} [lastSaved] - Optional: ISO timestamp of last save
 */

/**
 * @typedef {'setup' | 'active' | 'completed'} TournamentStatus
 * Tournament lifecycle status
 */

/**
 * @typedef {Object} ExportedTournament
 * @property {string} exportVersion - Export format version (e.g., "4.0")
 * @property {number} id - Tournament ID
 * @property {string} name - Tournament name
 * @property {string} date - Tournament date
 * @property {string} created - Creation timestamp
 * @property {string} status - Tournament status
 * @property {number} [bracketSize] - Bracket size
 * @property {boolean} readOnly - Read-only flag
 * @property {Player[]} players - Player array
 * @property {Match[]} matches - Match array
 * @property {Player[]} bracket - Bracket array
 * @property {Object.<string, number>} placements - Placements map
 * @property {Transaction[]} history - Transaction history array
 * @property {string[]} playerList - Saved players list (snapshot)
 * @property {string} exportedAt - ISO timestamp of export
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * @typedef {Object} Config
 * @property {PointsConfig} points - Point value configuration
 * @property {LegsConfig} legs - Match legs configuration
 * @property {string} clubName - Club/organization name for branding
 * @property {LanesConfig} lanes - Lane assignment configuration
 * @property {UIConfig} ui - User interface settings
 * @property {ServerConfig} server - Server/API settings
 */

/**
 * @typedef {Object} PointsConfig
 * @property {number} participation - Points for participation (default: 5)
 * @property {number} first - Points for 1st place (default: 15)
 * @property {number} second - Points for 2nd place (default: 13)
 * @property {number} third - Points for 3rd place (default: 10)
 * @property {number} fourth - Points for 4th place (default: 9)
 * @property {number} fifthSixth - Points for 5th-6th place (default: 8)
 * @property {number} seventhEighth - Points for 7th-8th place (default: 7)
 * @property {number} highOut - Points per high out (default: 1)
 * @property {number} ton - Points per ton (default: 0)
 * @property {number} oneEighty - Points per 180 (default: 1)
 * @property {number} shortLeg - Points per short leg (default: 1)
 */

/**
 * @typedef {Object} LegsConfig
 * @property {number} regularRounds - Legs for regular round matches (default: 3)
 * @property {number} frontsideSemifinal - Legs for frontside semifinal (default: 3)
 * @property {number} backsideSemifinal - Legs for backside semifinal (default: 3)
 * @property {number} backsideFinal - Legs for backside final (default: 5)
 * @property {number} grandFinal - Legs for grand final (default: 5)
 */

/**
 * @typedef {Object} LanesConfig
 * @property {number} maxLanes - Maximum number of lanes available (default: 4)
 * @property {number[]} excludedLanes - Array of lane numbers to exclude
 * @property {boolean} requireLaneForStart - Whether lane assignment is required to start match (default: false)
 */

/**
 * @typedef {Object} UIConfig
 * @property {boolean} confirmWinnerSelection - Show confirmation dialog when selecting winner (default: true)
 * @property {boolean} autoOpenMatchControls - Auto-open Match Controls when navigating to tournament (default: true)
 * @property {boolean} developerMode - Enable developer features (default: false)
 * @property {number} refereeSuggestionsLimit - Max number of referee suggestions to show (default: 10)
 */

/**
 * @typedef {Object} ServerConfig
 * @property {boolean} allowSharedTournamentDelete - Allow deleting shared tournaments from server (default: false)
 */

// ============================================================================
// TRANSACTION TYPES (Undo/History System)
// ============================================================================

/**
 * @typedef {Object} Transaction
 * @property {string} id - Unique transaction ID (e.g., 'tx_1234567890')
 * @property {TransactionType} type - Transaction type
 * @property {string} description - Human-readable description of the transaction
 * @property {string} timestamp - ISO timestamp when transaction occurred
 * @property {string} matchId - ID of the affected match
 * @property {Player} [winner] - Optional: Winner player (for COMPLETE_MATCH)
 * @property {Player} [loser] - Optional: Loser player (for COMPLETE_MATCH)
 * @property {CompletionType} [completionType] - Optional: 'MANUAL' or 'AUTO' (for COMPLETE_MATCH)
 * @property {TransactionState} [beforeState] - Optional: State before transaction
 * @property {TransactionState} [afterState] - Optional: State after transaction
 */

/**
 * @typedef {'COMPLETE_MATCH' | 'START_MATCH' | 'STOP_MATCH' | 'ASSIGN_LANE' | 'ASSIGN_REFEREE'} TransactionType
 * Types of transactions that can be recorded
 * - COMPLETE_MATCH: Match result recorded
 * - START_MATCH: Match started (active = true)
 * - STOP_MATCH: Match stopped (active = false)
 * - ASSIGN_LANE: Lane assigned or cleared
 * - ASSIGN_REFEREE: Referee assigned or cleared
 */

/**
 * @typedef {'MANUAL' | 'AUTO'} CompletionType
 * How the match was completed
 * - MANUAL: User selected winner
 * - AUTO: Auto-advanced due to walkover/bye
 */

/**
 * @typedef {Object} TransactionState
 * @property {boolean} [active] - Match active state (for START_MATCH/STOP_MATCH)
 * @property {number|null} [lane] - Lane assignment (for ASSIGN_LANE)
 * @property {number|null} [referee] - Referee ID (for ASSIGN_REFEREE)
 */

// ============================================================================
// MATCH PROGRESSION TYPES (Single Source of Truth)
// ============================================================================

/**
 * @typedef {Object} MatchProgressionRule
 * @property {[string, string]} [winner] - [targetMatchId, slot] where winner advances
 * @property {[string, string]} [loser] - [targetMatchId, slot] where loser advances
 * @example
 * // FS-1-1: Winner to FS-2-1 player1 slot, Loser to BS-1-1 player1 slot
 * {
 *   winner: ['FS-2-1', 'player1'],
 *   loser: ['BS-1-1', 'player1']
 * }
 */

/**
 * @typedef {Object.<string, MatchProgressionRule>} BracketProgressionRules
 * Match ID to progression rule mapping for a specific bracket size
 */

/**
 * @typedef {Object} MatchProgression
 * @property {BracketProgressionRules} 8 - 8-player bracket progression rules
 * @property {BracketProgressionRules} 16 - 16-player bracket progression rules
 * @property {BracketProgressionRules} 32 - 32-player bracket progression rules
 */

// ============================================================================
// GLOBAL VARIABLES & CONSTANTS
// ============================================================================

/**
 * Current active tournament
 * @global
 * @type {Tournament|null}
 */

/**
 * Array of all players in current tournament
 * @global
 * @type {Player[]}
 */

/**
 * Array of all matches in current tournament
 * @global
 * @type {Match[]}
 */

/**
 * Global application configuration
 * @global
 * @type {Config}
 */

/**
 * Single source of truth for match progression rules.
 * Hardcoded lookup tables defining winner/loser destinations for all matches.
 * @global
 * @constant
 * @type {MatchProgression}
 * @example
 * // Get progression rule for a match
 * const rule = MATCH_PROGRESSION[tournament.bracketSize]['FS-1-1'];
 * // rule.winner = ['FS-2-1', 'player1']
 * // rule.loser = ['BS-1-1', 'player1']
 */
