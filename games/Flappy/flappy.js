// ===========================
// DOM ELEMENTS
// ===========================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const pauseBtnText = document.getElementById('pauseBtnText');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');

// ===========================
// GAME STATE
// ===========================
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let animationFrameId;

// Game Physics
const gravity = 0.5;
const jumpStrength = -9;
const obstacleSpeed = 3;

// Initialize high score display
highScoreElement.textContent = highScore;

// ===========================
// BIRD CONFIGURATION
// ===========================
const bird = {
    x: 80,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    
    draw() {
        // Bird body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 35, this.y);
        ctx.lineTo(this.x + 20, this.y + 8);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y + 5, 15, 10, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
    },
    
    update() {
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Limit bird position
        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }
        
        if (this.y + this.height/2 >= canvas.height - 25) {
            this.y = canvas.height - 25 - this.height/2;
            this.velocity = 0;
        }
    },
    
    jump() {
        this.velocity = jumpStrength;
    },
    
    reset() {
        this.y = canvas.height / 2;
        this.velocity = 0;
    }
};

// ===========================
// OBSTACLES CONFIGURATION
// ===========================
const obstacles = [];
const obstacleWidth = 60;
const gapHeight = 180;
const obstacleSpacing = 250;
let obstacleTimer = 0;

function createObstacle() {
    const minHeight = 50;
    const maxHeight = canvas.height - gapHeight - minHeight - 25; // Account for ground
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        passed: false,
        color: '#2ecc71'
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Top obstacle
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
        
        // Bottom obstacle
        const bottomY = obstacle.topHeight + gapHeight;
        const bottomHeight = canvas.height - bottomY - 25; // Account for ground
        ctx.fillRect(obstacle.x, bottomY, obstacleWidth, bottomHeight);
        
        // Borders
        ctx.strokeStyle = '#1A5F23';
        ctx.lineWidth = 3;
        ctx.strokeRect(obstacle.x, 0, obstacleWidth, obstacle.topHeight);
        ctx.strokeRect(obstacle.x, bottomY, obstacleWidth, bottomHeight);
    });
}

function updateObstacles() {
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed;
        
        // Check if bird passed obstacle
        if (!obstacles[i].passed && obstacles[i].x + obstacleWidth < bird.x) {
            obstacles[i].passed = true;
            score++;
            scoreElement.textContent = score;
            scoreElement.classList.add('counter-update');
            setTimeout(() => {
                scoreElement.classList.remove('counter-update');
            }, 250);
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacleWidth < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // Create new obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleSpacing / obstacleSpeed) {
        createObstacle();
        obstacleTimer = 0;
    }
}

// ===========================
// COLLISION DETECTION
// ===========================
function checkCollisions() {
    // Check collision with ground or ceiling
    if (bird.y - bird.height/2 <= 0 || bird.y + bird.height/2 >= canvas.height - 25) {
        return true;
    }
    
    // Check collision with obstacles
    for (const obstacle of obstacles) {
        const birdLeft = bird.x - bird.width/2;
        const birdRight = bird.x + bird.width/2;
        const birdTop = bird.y - bird.height/2;
        const birdBottom = bird.y + bird.height/2;
        
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacleWidth;
        
        if (birdRight > obstacleLeft && birdLeft < obstacleRight) {
            if (birdTop < obstacle.topHeight || birdBottom > obstacle.topHeight + gapHeight) {
                return true;
            }
        }
    }
    
    return false;
}

// ===========================
// BACKGROUND RENDERING
// ===========================
const clouds = [
    {x: 50, y: 80, size: 30},
    {x: 200, y: 120, size: 40},
    {x: 350, y: 60, size: 35}
];

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8E8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
    clouds.forEach(cloud => {
        cloud.x -= 0.3;
        if (cloud.x < -100) {
            cloud.x = canvas.width + 50;
            cloud.y = 50 + Math.random() * 100;
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.3, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.5, cloud.y, cloud.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 25, canvas.width, 25);
    
    // Grass
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, canvas.height - 25, canvas.width, 8);
}

// ===========================
// GAME LOOP
// ===========================
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawObstacles();
    bird.draw();
    
    // Score display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 100, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px "DM Sans"';
    ctx.fillText(`${score}`, 60, 37);
}

function updateGame() {
    if (gamePaused || !gameRunning) return;
    
    bird.update();
    updateObstacles();
    
    if (checkCollisions()) {
        endGame();
        return;
    }
    
    drawGame();
    animationFrameId = requestAnimationFrame(updateGame);
}

// ===========================
// GAME CONTROLS
// ===========================
function startGame() {
    // Reset game state
    score = 0;
    obstacles.length = 0;
    obstacleTimer = 0;
    
    // Update display
    scoreElement.textContent = score;
    
    // Reset bird
    bird.reset();
    
    // Hide screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Start game
    gameRunning = true;
    gamePaused = false;
    
    updateGame();
}

function endGame() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    
    cancelAnimationFrame(animationFrameId);
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        pauseBtnText.textContent = 'Reprendre';
        pauseBtn.querySelector('svg').innerHTML = `
            <polygon points="5 3 19 12 5 21 5 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        
        // Draw pause overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px "DM Sans"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '18px "DM Sans"';
        ctx.fillText('Cliquez sur Reprendre pour continuer', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    } else {
        pauseBtnText.textContent = 'Pause';
        pauseBtn.querySelector('svg').innerHTML = `
            <rect x="6" y="4" width="4" height="16" fill="none" stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="4" width="4" height="16" fill="none" stroke="currentColor" stroke-width="2"/>
        `;
        
        updateGame();
    }
}

// ===========================
// EVENT LISTENERS
// ===========================
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// Jump on click
canvas.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        bird.jump();
    }
});

// Jump on space or arrow up
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning && !gamePaused) {
        bird.jump();
        e.preventDefault();
    }
    
    // Pause with P key
    if (e.code === 'KeyP' && gameRunning) {
        togglePause();
    }
});

// ===========================
// INITIALIZATION
// ===========================
drawGame();