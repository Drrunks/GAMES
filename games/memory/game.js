// Game State
let gameState = {
    level: '',
    gridSize: 0,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    canFlip: true
};

// Card emojis
const cardEmojis = [
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
    '🥝', '🍑', '🥭', '🍍', '🥥', '🥑', '🍆', '🥕',
    '🌽', '🥦', '🥒', '🌶️', '🥬', '🍅', '🥔', '🍠',
    '🧄', '🧅', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨'
];

// Level configurations
const levelConfig = {
    easy: { grid: 2, pairs: 2 },
    medium: { grid: 4, pairs: 8 },
    hard: { grid: 6, pairs: 18 }
};

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const winScreen = document.getElementById('winScreen');
const gameBoard = document.getElementById('gameBoard');
const levelBtns = document.querySelectorAll('.level-btn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const changeLevelBtn = document.getElementById('changeLevelBtn');
const levelDisplay = document.getElementById('levelDisplay');
const movesCount = document.getElementById('movesCount');
const pairsFound = document.getElementById('pairsFound');
const totalPairs = document.getElementById('totalPairs');
const finalMoves = document.getElementById('finalMoves');
const performance = document.getElementById('performance');

// Event Listeners
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const level = btn.getAttribute('data-level');
        startGame(level);
    });
});

resetBtn.addEventListener('click', () => resetGame());
backBtn.addEventListener('click', backToMenu);
playAgainBtn.addEventListener('click', () => resetGame());
changeLevelBtn.addEventListener('click', backToMenu);

// Start Game
function startGame(level) {
    gameState.level = level;
    const config = levelConfig[level];
    gameState.gridSize = config.grid;
    gameState.totalPairs = config.pairs;
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.flippedCards = [];
    gameState.canFlip = true;
    
    // Update UI
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    const levelNames = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
    levelDisplay.textContent = levelNames[level];
    totalPairs.textContent = config.pairs;
    movesCount.textContent = '0';
    pairsFound.textContent = '0';
    
    // Create board
    createBoard();
}

// Create Board
function createBoard() {
    gameBoard.innerHTML = '';
    gameBoard.className = `memory-grid grid-${gameState.level}`;
    
    // Generate cards
    const selectedEmojis = cardEmojis.slice(0, gameState.totalPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    gameState.cards = shuffleArray(cardPairs);
    
    // Create card elements
    gameState.cards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameBoard.appendChild(card);
    });
}

// Create Card Element
function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.index = index;
    card.dataset.emoji = emoji;
    card.style.setProperty('--i', index);
    
    card.innerHTML = `
        <div class="card-face card-front">?</div>
        <div class="card-face card-back">${emoji}</div>
    `;
    
    card.addEventListener('click', () => handleCardClick(card));
    
    return card;
}

// Handle Card Click
function handleCardClick(card) {
    if (!gameState.canFlip || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched')) {
        return;
    }
    
    // Flip card
    card.classList.add('flipped');
    gameState.flippedCards.push(card);
    
    if (gameState.flippedCards.length === 2) {
        gameState.canFlip = false;
        gameState.moves++;
        updateMoves();
        
        setTimeout(() => {
            checkMatch();
        }, 600);
    }
}

// Check Match
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    const emoji1 = card1.dataset.emoji;
    const emoji2 = card2.dataset.emoji;
    
    if (emoji1 === emoji2) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        gameState.matchedPairs++;
        updatePairs();
        
        if (gameState.matchedPairs === gameState.totalPairs) {
            setTimeout(() => {
                showWinScreen();
            }, 400);
        }
    } else {
        // No match
        card1.classList.add('wrong');
        card2.classList.add('wrong');
        
        setTimeout(() => {
            card1.classList.remove('flipped', 'wrong');
            card2.classList.remove('flipped', 'wrong');
        }, 500);
    }
    
    gameState.flippedCards = [];
    gameState.canFlip = true;
}

// Update Moves
function updateMoves() {
    movesCount.textContent = gameState.moves;
    movesCount.classList.add('counter-update');
    setTimeout(() => {
        movesCount.classList.remove('counter-update');
    }, 250);
}

// Update Pairs
function updatePairs() {
    pairsFound.textContent = gameState.matchedPairs;
    pairsFound.classList.add('counter-update');
    setTimeout(() => {
        pairsFound.classList.remove('counter-update');
    }, 250);
}

// Show Win Screen
function showWinScreen() {
    gameScreen.classList.add('hidden');
    winScreen.classList.remove('hidden');
    
    finalMoves.textContent = gameState.moves;
    
    // Calculate performance
    const perfectMoves = gameState.totalPairs;
    const performanceRating = getPerformance(gameState.moves, perfectMoves);
    performance.textContent = performanceRating;
}

// Get Performance Rating
function getPerformance(moves, perfectMoves) {
    const ratio = moves / perfectMoves;
    
    if (ratio <= 1.2) {
        return '⭐⭐⭐';
    } else if (ratio <= 1.5) {
        return '⭐⭐';
    } else {
        return '⭐';
    }
}

// Reset Game
function resetGame() {
    winScreen.classList.add('hidden');
    startGame(gameState.level);
}

// Back to Menu
function backToMenu() {
    gameScreen.classList.add('hidden');
    winScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// Shuffle Array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}