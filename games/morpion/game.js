// Game State
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameMode: '', // 'player' or 'ai'
    gameActive: true,
    scores: { X: 0, O: 0 }
};

// Winning combinations
const winningCombinations = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diagonal 1
    [2, 4, 6]  // Diagonal 2
];

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const vsPlayerBtn = document.getElementById('vsPlayerBtn');
const vsAIBtn = document.getElementById('vsAIBtn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const cells = document.querySelectorAll('.cell');
const currentPlayerEl = document.getElementById('currentPlayer');
const gameModeEl = document.getElementById('gameMode');
const gameMessageEl = document.getElementById('gameMessage');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const gameBoard = document.getElementById('gameBoard');

// Event Listeners
vsPlayerBtn.addEventListener('click', () => startGame('player'));
vsAIBtn.addEventListener('click', () => startGame('ai'));
resetBtn.addEventListener('click', resetBoard);
backBtn.addEventListener('click', backToMenu);

cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

// Start Game
function startGame(mode) {
    gameState.gameMode = mode;
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    if (mode === 'player') {
        gameModeEl.textContent = '2 Joueurs';
    } else {
        gameModeEl.textContent = 'vs IA';
    }
    
    resetBoard();
}

// Handle Cell Click
function handleCellClick(e) {
    const cell = e.target;
    const cellIndex = parseInt(cell.getAttribute('data-cell'));
    
    if (gameState.board[cellIndex] !== '' || !gameState.gameActive) {
        return;
    }
    
    makeMove(cellIndex, gameState.currentPlayer);
    
    if (gameState.gameActive && gameState.gameMode === 'ai' && gameState.currentPlayer === 'O') {
        gameBoard.classList.add('board-disabled');
        setTimeout(() => {
            aiMove();
            gameBoard.classList.remove('board-disabled');
        }, 500);
    }
}

// Make Move
function makeMove(index, player) {
    gameState.board[index] = player;
    const cell = cells[index];
    
    if (player === 'X') {
        // Draw X using SVG
        cell.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 80 80" style="display: block;">
                <path d="M20 20L60 60M60 20L20 60" stroke="#8b5cf6" stroke-width="8" stroke-linecap="round"/>
            </svg>
        `;
        cell.classList.add('cell-x');
    } else {
        // Draw O using SVG
        cell.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 80 80" style="display: block;">
                <circle cx="40" cy="40" r="24" stroke="#ec4899" stroke-width="8" fill="none"/>
            </svg>
        `;
        cell.classList.add('cell-o');
    }
    
    cell.classList.add('cell-filled');
    
    if (checkWinner()) {
        handleWin(player);
    } else if (isDraw()) {
        handleDraw();
    } else {
        switchPlayer();
    }
}

// Switch Player
function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    currentPlayerEl.textContent = gameState.currentPlayer;
    updateMessage(`Tour de ${gameState.currentPlayer}`, 'message-info');
}

// Check Winner
function checkWinner() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            highlightWinningCells(combination);
            return true;
        }
        return false;
    });
}

// Highlight Winning Cells
function highlightWinningCells(combination) {
    combination.forEach(index => {
        cells[index].classList.add('cell-winner');
    });
}

// Check Draw
function isDraw() {
    return gameState.board.every(cell => cell !== '');
}

// Handle Win
function handleWin(player) {
    gameState.gameActive = false;
    gameState.scores[player]++;
    updateScores();
    
    updateMessage(`${player} a gagné !`, 'message-success');
    
    setTimeout(() => {
        resetBoard();
    }, 2500);
}

// Handle Draw
function handleDraw() {
    gameState.gameActive = false;
    updateMessage('Match nul', 'message-warning');
    cells.forEach(cell => cell.classList.add('shake-animation'));
    
    setTimeout(() => {
        resetBoard();
    }, 2500);
}

// Update Scores
function updateScores() {
    scoreXEl.textContent = gameState.scores.X;
    scoreOEl.textContent = gameState.scores.O;
    scoreXEl.classList.add('score-update');
    scoreOEl.classList.add('score-update');
    
    setTimeout(() => {
        scoreXEl.classList.remove('score-update');
        scoreOEl.classList.remove('score-update');
    }, 300);
}

// Update Message
function updateMessage(message, className = 'message-info') {
    const p = gameMessageEl.querySelector('p');
    p.textContent = message;
    p.className = className;
}

// AI Move
function aiMove() {
    const bestMove = findBestMove();
    if (bestMove !== -1) {
        makeMove(bestMove, 'O');
    }
}

// Find Best Move (AI Logic)
function findBestMove() {
    // 1. Check if AI can win
    const winMove = findWinningMove('O');
    if (winMove !== -1) return winMove;
    
    // 2. Block player from winning
    const blockMove = findWinningMove('X');
    if (blockMove !== -1) return blockMove;
    
    // 3. Take center if available
    if (gameState.board[4] === '') return 4;
    
    // 4. Take a corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameState.board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // 5. Take any available cell
    const availableCells = gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    
    if (availableCells.length > 0) {
        return availableCells[Math.floor(Math.random() * availableCells.length)];
    }
    
    return -1;
}

// Find Winning Move
function findWinningMove(player) {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];
        
        // Check if two cells are filled with player's symbol and one is empty
        const playerCells = cells.filter(cell => cell === player).length;
        const emptyCells = cells.filter(cell => cell === '').length;
        
        if (playerCells === 2 && emptyCells === 1) {
            // Find the empty cell
            if (gameState.board[a] === '') return a;
            if (gameState.board[b] === '') return b;
            if (gameState.board[c] === '') return c;
        }
    }
    return -1;
}

// Reset Board
function resetBoard() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('cell-filled', 'cell-winner', 'shake-animation', 'cell-x', 'cell-o');
    });
    
    currentPlayerEl.textContent = 'X';
    updateMessage('C\'est parti !', 'message-info');
}

// Back to Menu
function backToMenu() {
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    gameState.scores = { X: 0, O: 0 };
    updateScores();
}