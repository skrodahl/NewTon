// history-management.js - Undo/Redo Functionality

const undoStack = [];
const redoStack = [];
const MAX_HISTORY_SIZE = 50; // Limit the history size to prevent memory issues

function saveState() {
    // Clear the redo stack whenever a new action is taken
    redoStack.length = 0;

    // Deep clone the current state
    const state = {
        tournament: JSON.parse(JSON.stringify(tournament)),
        players: JSON.parse(JSON.stringify(players)),
        matches: JSON.parse(JSON.stringify(matches))
    };

    undoStack.push(state);

    // Maintain a maximum history size
    if (undoStack.length > MAX_HISTORY_SIZE) {
        undoStack.shift();
    }

    updateUndoRedoButtons();
}

function undo() {
    // Check if tournament is read-only (imported completed tournament)
    if (tournament && tournament.readOnly) {
        alert('Completed tournament: Read-only - Use Reset Tournament to modify');
        return;
    }

    if (undoStack.length === 0) {
        console.warn("Nothing to undo.");
        return;
    }

    const currentState = {
        tournament: JSON.parse(JSON.stringify(tournament)),
        players: JSON.parse(JSON.stringify(players)),
        matches: JSON.parse(JSON.stringify(matches))
    };
    redoStack.push(currentState);

    const previousState = undoStack.pop();
    restoreState(previousState);

    updateUndoRedoButtons();
}

function redo() {
    if (redoStack.length === 0) {
        console.warn("Nothing to redo.");
        return;
    }

    const currentState = {
        tournament: JSON.parse(JSON.stringify(tournament)),
        players: JSON.parse(JSON.stringify(players)),
        matches: JSON.parse(JSON.stringify(matches))
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    restoreState(nextState);

    updateUndoRedoButtons();
}

function restoreState(state) {
    tournament = state.tournament;
    players = state.players;
    matches = state.matches;

    // After restoring the state, we need to re-render the UI
    // to reflect the changes.
    if (typeof updatePlayersDisplay === 'function') {
        updatePlayersDisplay();
        updatePlayerCount();
    }
    if (typeof renderBracket === 'function') {
        renderBracket();
    }
    if (typeof displayResults === 'function') {
        displayResults();
    }
    if (typeof updateTournamentStatus === 'function') {
        updateTournamentStatus();
    }
    // We also need to save the restored state to localStorage
    if (typeof saveCurrentTournament === 'function') {
        saveCurrentTournament();
    }
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
        undoBtn.disabled = undoStack.length === 0;
    }
    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.saveState = saveState;
    window.undo = undo;
    window.redo = redo;
}
