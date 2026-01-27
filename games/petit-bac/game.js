// Game State
let gameState = {
    currentRound: 1,
    totalRounds: 5,
    currentLetter: '',
    timeLeft: 90,
    timerInterval: null,
    allAnswers: [], // Stocke toutes les réponses de toutes les manches
    totalScore: 0,
    validAnswers: 0,
    invalidAnswers: 0
};

// Available letters
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V'];

// Categories mapping
const categories = {
    prenom: { name: 'Prénom', icon: '👤' },
    pays: { name: 'Pays', icon: '🌍' },
    ville: { name: 'Ville', icon: '🏙️' },
    animal: { name: 'Animal', icon: '🐾' },
    fruit: { name: 'Fruit', icon: '🍎' },
    metier: { name: 'Métier', icon: '💼' },
    nourriture: { name: 'Nourriture', icon: '🍕' },
    film: { name: 'Film/Série', icon: '🎬' }
};

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const validationScreen = document.getElementById('validationScreen');
const resultsScreen = document.getElementById('resultsScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const categoriesForm = document.getElementById('categoriesForm');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const currentRoundEl = document.getElementById('currentRound');
const currentLetterEl = document.getElementById('currentLetter');
const timerEl = document.getElementById('timer');
const finalScoreEl = document.getElementById('finalScore');
const validAnswersEl = document.getElementById('validAnswers');
const invalidAnswersEl = document.getElementById('invalidAnswers');
const roundsDetailsEl = document.getElementById('roundsDetails');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);
categoriesForm.addEventListener('submit', handleSubmit);

// Start Game
function startGame() {
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    startRound();
}

// Start Round
function startRound() {
    gameState.currentLetter = getRandomLetter();
    gameState.timeLeft = 90;
    
    updateUI();
    clearForm();
    startTimer();
}

// Get Random Letter
function getRandomLetter() {
    const usedLetters = gameState.allAnswers.map(a => a.letter);
    const availableLetters = letters.filter(l => !usedLetters.includes(l));
    const randomIndex = Math.floor(Math.random() * availableLetters.length);
    return availableLetters[randomIndex] || letters[0];
}

// Start Timer
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    timerEl.classList.remove('timer-warning', 'timer-danger');
    timerEl.classList.add('timer-normal');
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            autoSubmit();
        }
    }, 1000);
}

// Update Timer Display
function updateTimer() {
    timerEl.textContent = gameState.timeLeft;
    
    timerEl.classList.remove('timer-normal', 'timer-warning', 'timer-danger');
    
    if (gameState.timeLeft <= 10) {
        timerEl.classList.add('timer-danger');
    } else if (gameState.timeLeft <= 30) {
        timerEl.classList.add('timer-warning');
    } else {
        timerEl.classList.add('timer-normal');
    }
}

// Update UI
function updateUI() {
    currentRoundEl.textContent = gameState.currentRound;
    currentLetterEl.textContent = gameState.currentLetter;
    timerEl.textContent = gameState.timeLeft;
    
    // Animate counter
    currentRoundEl.classList.add('counter-update');
    setTimeout(() => {
        currentRoundEl.classList.remove('counter-update');
    }, 250);
}

// Clear Form
function clearForm() {
    categoriesForm.reset();
}

// Handle Form Submit
function handleSubmit(e) {
    e.preventDefault();
    
    clearInterval(gameState.timerInterval);
    
    // Disable submit button
    submitBtn.disabled = true;
    
    const formData = new FormData(categoriesForm);
    const answers = {};
    
    // Collect all answers
    for (let [key, value] of formData.entries()) {
        answers[key] = value.trim();
    }
    
    // Store answers for this round
    gameState.allAnswers.push({
        round: gameState.currentRound,
        letter: gameState.currentLetter,
        answers: answers
    });
    
    // Re-enable button
    submitBtn.disabled = false;
    
    if (gameState.currentRound < gameState.totalRounds) {
        gameState.currentRound++;
        setTimeout(() => {
            startRound();
        }, 600);
    } else {
        // Partie terminée, lancer la validation
        setTimeout(() => {
            startValidation();
        }, 600);
    }
}

// Auto Submit
function autoSubmit() {
    const submitEvent = new Event('submit', { cancelable: true });
    categoriesForm.dispatchEvent(submitEvent);
}

// Start Validation
async function startValidation() {
    gameScreen.classList.add('hidden');
    validationScreen.classList.remove('hidden');
    
    // Calculer le nombre total de réponses à valider
    const totalAnswers = gameState.allAnswers.length * Object.keys(categories).length;
    let validatedCount = 0;
    
    // Valider toutes les réponses de toutes les manches
    for (let roundData of gameState.allAnswers) {
        const validationResults = {};
        
        for (let [category, value] of Object.entries(roundData.answers)) {
            // Vérifier si la réponse est vide
            if (value === '') {
                validationResults[category] = { 
                    isValid: false, 
                    reason: 'Vide', 
                    answer: value 
                };
                validatedCount++;
                updateProgress(validatedCount, totalAnswers);
                continue;
            }
            
            // Vérifier si commence par la bonne lettre
            const firstLetter = value.charAt(0).toUpperCase();
            if (firstLetter !== roundData.letter) {
                validationResults[category] = { 
                    isValid: false, 
                    reason: `Ne commence pas par ${roundData.letter}`,
                    answer: value 
                };
                validatedCount++;
                updateProgress(validatedCount, totalAnswers);
                continue;
            }
            
            // Validation IA
            try {
                const categoryName = categories[category].name;
                const letter = roundData.letter;
                
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 50,
                        messages: [{
                            role: 'user',
                            content: `Est-ce que "${value}" est un(e) ${categoryName} valide commençant par "${letter}"? Réponds UNIQUEMENT "OUI" ou "NON".`
                        }]
                    })
                });
                
                const data = await response.json();
                const aiResponse = data.content[0].text.trim().toUpperCase();
                
                validationResults[category] = {
                    isValid: aiResponse.startsWith('OUI'),
                    reason: aiResponse.startsWith('OUI') ? 'Valide' : 'Non valide',
                    answer: value
                };
            } catch (error) {
                console.error('Validation error:', error);
                validationResults[category] = { 
                    isValid: false, 
                    reason: 'Erreur de validation',
                    answer: value 
                };
            }
            
            validatedCount++;
            updateProgress(validatedCount, totalAnswers);
        }
        
        // Ajouter les résultats de validation à cette manche
        roundData.validations = validationResults;
        
        // Calculer le score de cette manche
        let roundScore = 0;
        for (let result of Object.values(validationResults)) {
            if (result.isValid) {
                roundScore += 10;
                gameState.validAnswers++;
            } else if (result.answer !== '') {
                gameState.invalidAnswers++;
            }
        }
        
        roundData.score = roundScore;
        gameState.totalScore += roundScore;
    }
    
    // Afficher les résultats
    setTimeout(() => {
        showResults();
    }, 500);
}

// Update Progress
function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Vérification : ${current}/${total}`;
}

// Show Results
function showResults() {
    validationScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    animateScore();
    displayRoundsDetails();
}

// Animate Score
function animateScore() {
    let currentScore = 0;
    const increment = gameState.totalScore / 50;
    const duration = 1500;
    const stepTime = duration / 50;
    
    const counter = setInterval(() => {
        currentScore += increment;
        if (currentScore >= gameState.totalScore) {
            currentScore = gameState.totalScore;
            clearInterval(counter);
        }
        finalScoreEl.textContent = Math.floor(currentScore);
    }, stepTime);
    
    validAnswersEl.textContent = gameState.validAnswers;
    invalidAnswersEl.textContent = gameState.invalidAnswers;
}

// Display Rounds Details
function displayRoundsDetails() {
    roundsDetailsEl.innerHTML = '';
    
    gameState.allAnswers.forEach(roundData => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round-detail';
        
        let answersHTML = '';
        for (let [category, validation] of Object.entries(roundData.validations)) {
            const status = validation.answer === '' ? 
                '⚪' : (validation.isValid ? '✅' : '❌');
            
            const statusClass = validation.answer === '' ? 
                'answer-empty' : (validation.isValid ? 'answer-valid' : 'answer-invalid');
            
            answersHTML += `
                <div class="answer-row ${statusClass}">
                    <div class="answer-info">
                        <div class="answer-category">${categories[category].icon} ${categories[category].name}</div>
                        <div class="answer-value">${validation.answer || '(vide)'}</div>
                    </div>
                    <div class="answer-status">${status}</div>
                </div>
            `;
        }
        
        const scoreClass = roundData.score >= 50 ? 'score-high' : '';
        
        roundDiv.innerHTML = `
            <div class="round-header">
                <div class="round-info">
                    <span class="round-number">Manche ${roundData.round}</span>
                    <span class="round-letter">${roundData.letter}</span>
                </div>
                <div class="round-score ${scoreClass}">
                    ${roundData.score} pts
                </div>
            </div>
            ${answersHTML}
        `;
        
        roundsDetailsEl.appendChild(roundDiv);
    });
}

// Reset Game
function resetGame() {
    gameState = {
        currentRound: 1,
        totalRounds: 5,
        currentLetter: '',
        timeLeft: 90,
        timerInterval: null,
        allAnswers: [],
        totalScore: 0,
        validAnswers: 0,
        invalidAnswers: 0
    };
    
    resultsScreen.classList.add('hidden');
    validationScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}