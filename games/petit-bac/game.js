// Game State
let gameState = {
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

// Available letters
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

// Categories mapping
const categories = {
    prenom: { name: 'Prénom', icon: '👤', api: 'wikidata' },
    pays: { name: 'Pays', icon: '🌍', api: 'restcountries' },
    ville: { name: 'Ville', icon: '🏙️', api: 'wikidata' },
    animal: { name: 'Animal', icon: '🐾', api: 'wikidata' },
    fruit: { name: 'Fruit', icon: '🍎', api: 'openfoodfacts' },
    metier: { name: 'Métier', icon: '💼', api: 'wikidata' },
    nourriture: { name: 'Nourriture', icon: '🍕', api: 'themealdb' },
    film: { name: 'Film/Série', icon: '🎬', api: 'wikidata' }
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
    
    // Focus automatique sur le premier input
    setTimeout(() => {
        document.querySelector('.category-input')?.focus();
    }, 100);
    
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

// Get Random Letter (évite les lettres déjà utilisées)
function getRandomLetter() {
    const usedLetters = gameState.allAnswers.map(a => a.letter);
    const availableLetters = letters.filter(l => !usedLetters.includes(l));
    
    if (availableLetters.length === 0) {
        return letters[Math.floor(Math.random() * letters.length)];
    }
    
    const randomIndex = Math.floor(Math.random() * availableLetters.length);
    return availableLetters[randomIndex];
}

// Start Timer
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    timerEl.classList.remove('timer-warning', 'timer-danger');
    
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
    
    timerEl.classList.remove('timer-warning', 'timer-danger');
    
    if (gameState.timeLeft <= 10) {
        timerEl.classList.add('timer-danger');
    } else if (gameState.timeLeft <= 30) {
        timerEl.classList.add('timer-warning');
    }
}

// Update UI
function updateUI() {
    currentRoundEl.textContent = gameState.currentRound;
    currentLetterEl.textContent = gameState.currentLetter;
    timerEl.textContent = gameState.timeLeft;
}

// Clear Form
function clearForm() {
    categoriesForm.reset();
}

// Handle Form Submit
function handleSubmit(e) {
    e.preventDefault();
    
    clearInterval(gameState.timerInterval);
    submitBtn.disabled = true;
    submitBtnText.textContent = "CHARGEMENT...";
    
    const formData = new FormData(categoriesForm);
    const answers = {};
    
    for (let [key, value] of formData.entries()) {
        answers[key] = value.trim();
    }
    
    gameState.allAnswers.push({
        round: gameState.currentRound,
        letter: gameState.currentLetter,
        answers: answers
    });
    
    submitBtn.disabled = false;
    submitBtnText.textContent = "VALIDER LA MANCHE";
    
    if (gameState.currentRound < gameState.totalRounds) {
        gameState.currentRound++;
        setTimeout(() => {
            startRound();
        }, 600);
    } else {
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

// ========== SYSTÈME DE VALIDATION PAR API ==========

// Start Validation
async function startValidation() {
    gameScreen.classList.add('hidden');
    validationScreen.classList.remove('hidden');
    
    const totalAnswers = gameState.allAnswers.length * Object.keys(categories).length;
    let validatedCount = 0;
    
    progressFill.style.width = '0%';
    progressText.textContent = `Vérification : 0/${totalAnswers}`;
    
    // Valider toutes les réponses
    for (let roundData of gameState.allAnswers) {
        const validationResults = {};
        
        for (let [category, value] of Object.entries(roundData.answers)) {
            // Mise à jour du progrès
            validatedCount++;
            updateProgress(validatedCount, totalAnswers);
            
            // Vérification basique : réponse vide
            if (value === '') {
                validationResults[category] = { 
                    isValid: false, 
                    reason: 'Vide', 
                    answer: value 
                };
                continue;
            }
            
            // Vérification de la première lettre
            const firstLetter = value.charAt(0).toUpperCase();
            if (firstLetter !== roundData.letter) {
                validationResults[category] = { 
                    isValid: false, 
                    reason: `Ne commence pas par ${roundData.letter}`,
                    answer: value 
                };
                continue;
            }
            
            // Validation par API selon la catégorie
            try {
                const apiType = categories[category].api;
                let isValid = false;
                let reason = '';
                
                switch(apiType) {
                    case 'restcountries':
                        ({ isValid, reason } = await validateWithRestCountries(value, roundData.letter));
                        break;
                    case 'themealdb':
                        ({ isValid, reason } = await validateWithTheMealDB(value, roundData.letter));
                        break;
                    case 'openfoodfacts':
                        ({ isValid, reason } = await validateWithOpenFoodFacts(value, roundData.letter));
                        break;
                    case 'wikidata':
                    default:
                        ({ isValid, reason } = await validateWithWikidata(value, category, roundData.letter));
                }
                
                validationResults[category] = {
                    isValid: isValid,
                    reason: reason,
                    answer: value
                };
                
            } catch (error) {
                console.error(`Erreur validation ${category}:`, error);
                // En cas d'erreur API, on accepte la réponse si elle commence par la bonne lettre
                validationResults[category] = {
                    isValid: true,
                    reason: 'Accepté (API indisponible)',
                    answer: value
                };
            }
            
            // Petite pause pour éviter de surcharger les APIs
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        roundData.validations = validationResults;
        
        // Calcul du score
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

// ========== VALIDATEURS API ==========

// 1. REST Countries API - Pour les pays
async function validateWithRestCountries(value, letter) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(value)}?fullText=true`);
        
        if (response.status === 404) {
            return { isValid: false, reason: 'Pays non trouvé' };
        }
        
        const data = await response.json();
        const countryName = data[0]?.name?.common?.toUpperCase();
        
        if (countryName && countryName.startsWith(letter)) {
            return { isValid: true, reason: 'Pays valide' };
        } else {
            return { isValid: false, reason: 'Pays non trouvé' };
        }
    } catch (error) {
        console.error('REST Countries error:', error);
        throw error;
    }
}

// 2. TheMealDB API - Pour la nourriture
async function validateWithTheMealDB(value, letter) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(value)}`);
        const data = await response.json();
        
        if (data.meals) {
            const mealName = data.meals[0]?.strMeal?.toUpperCase();
            if (mealName && mealName.startsWith(letter)) {
                return { isValid: true, reason: 'Plat valide' };
            }
        }
        
        // Chercher aussi dans les catégories
        const catResponse = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
        const catData = await catResponse.json();
        
        const category = catData.categories?.find(c => 
            c.strCategory?.toUpperCase() === value.toUpperCase()
        );
        
        if (category && category.strCategory?.toUpperCase().startsWith(letter)) {
            return { isValid: true, reason: 'Catégorie valide' };
        }
        
        return { isValid: false, reason: 'Aliment non trouvé' };
    } catch (error) {
        console.error('TheMealDB error:', error);
        throw error;
    }
}

// 3. OpenFoodFacts API - Pour les fruits/aliments
async function validateWithOpenFoodFacts(value, letter) {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(value)}&search_simple=1&action=process&json=1&page_size=1`);
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            const productName = data.products[0]?.product_name?.toUpperCase();
            if (productName && productName.startsWith(letter)) {
                return { isValid: true, reason: 'Aliment valide' };
            }
        }
        
        return { isValid: false, reason: 'Aliment non trouvé' };
    } catch (error) {
        console.error('OpenFoodFacts error:', error);
        throw error;
    }
}

// 4. Wikidata API - Pour tout le reste (prénoms, villes, animaux, métiers, films)
async function validateWithWikidata(value, category, letter) {
    // Mapping des catégories vers des entités Wikidata
    const wikidataMapping = {
        prenom: 'Q11879590',    // Prénom (given name)
        ville: 'Q515',           // Ville (city)
        animal: 'Q729',          // Animal
        metier: 'Q28640',        // Métier (profession)
        film: 'Q11424'           // Film
    };
    
    const entityType = wikidataMapping[category];
    if (!entityType) {
        return { isValid: true, reason: 'Catégorie non vérifiable' };
    }
    
    try {
        // Requête SPARQL simplifiée pour Wikidata
        const query = `
        SELECT ?item WHERE {
            ?item rdfs:label "${value}"@fr.
            ?item wdt:P31/wdt:P279* wd:${entityType}.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
        }
        LIMIT 1
        `;
        
        const response = await fetch('https://query.wikidata.org/sparql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'PetitBacGame/1.0'
            },
            body: `query=${encodeURIComponent(query)}`
        });
        
        const text = await response.text();
        
        // Si on trouve un résultat, c'est valide
        if (text.includes('item')) {
            return { isValid: true, reason: 'Valide (Wikidata)' };
        }
        
        // Deuxième chance : recherche plus large
        const searchResponse = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(value)}&language=fr&format=json&origin=*`
        );
        
        const searchData = await searchResponse.json();
        
        if (searchData.search && searchData.search.length > 0) {
            return { isValid: true, reason: 'Valide' };
        }
        
        return { isValid: false, reason: 'Non trouvé' };
        
    } catch (error) {
        console.error('Wikidata error:', error);
        throw error;
    }
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
    
    finalScoreEl.textContent = gameState.totalScore;
    validAnswersEl.textContent = gameState.validAnswers;
    invalidAnswersEl.textContent = gameState.invalidAnswers;
    
    displayRoundsDetails();
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
                    <div class="answer-status">
                        ${status}
                        <small class="answer-reason">${validation.reason || ''}</small>
                    </div>
                </div>
            `;
        }
        
        roundDiv.innerHTML = `
            <div class="round-header">
                <div class="round-info">
                    <span class="round-number">Manche ${roundData.round}</span>
                    <span class="round-letter">${roundData.letter}</span>
                </div>
                <div class="round-score ${roundData.score >= 50 ? 'score-high' : ''}">
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