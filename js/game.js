let autoSaveInterval;
let timeSinceWorldUpdate = 0;
let fpsInterval = 1000 / 144;
let lastFrameTime = 0;
let frameCount = 0; // Global frame counter for throttling logic
const CHUNK_RADIUS = 65; // Expanded Active Zone (~1300px)
const MAX_ACTIVE_FRUITS = 150; // Hard limit for performance
const SPAWN_BATCH_SIZE = 5; // Max fruits to spawn per frame
const AI_CHUNK_SIZE = 40; // Grid size for AI chunks (5-Chunk System)
let activeChunkKeys = new Set();

// Cache for fruit weights to avoid recalculating every spawn
let cachedFruitWeights = null;
let lastWeightUpdateLevel = -1;

/**
 * Resets all game progress and reloads the game state.
 * Triggered by the Reset button in settings.
 */
const resetGameProgress = () => {
    if (!confirm(TRANSLATIONS[currentLanguage].confirmReset)) return;

    localStorage.clear();
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    if (autoSaveInterval) clearInterval(autoSaveInterval);

    // Reset Globals
    coins = 0; souls = 0; rebirthPoints = 0; rebirthCount = 0;
    playerLevel = 1; currentXp = 0; highScore = 0; score = 0;
    enemiesKilled = 0; killStreak = 0; prestigeLevel = 0; growthBuffer = 0;

    // Reset Upgrades
    upgrades = { foodCount: 0, scoreMult: 0, doublePoints: 0, xpMult: 0, growthBoost: 0, eatRange: 0, luckBoost: 0, soulsMult: 0, soulsExp: 0 };
    prestigeUpgrades = { permGold1: 0, permGold2: 0, permSouls1: 0, permSouls2: 0, permRP1: 0, permRP2: 0, permXp: 0 };
    slayerUpgrades = { maxHearts: 0, maxStamina: 0, staminaRegen: 0, gold1: 0, gold2: 0, rp1: 0, rp2: 0, souls1: 0, souls2: 0, infiniteStamina: 0 };

    // Reset World Size
    TILE_COUNT_X = 20 + playerLevel;
    TILE_COUNT_Y = 20 + playerLevel;

    if (highScoreElement) highScoreElement.innerText = formatNumber(highScore);
    
    startGame();
    if (typeof closeSettings === 'function') closeSettings();
};

/**
 * Initializes game state, entities, and UI elements.
 */
const initGame = () => {
    snake = [{ x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) }];
    particles = []; floatingTexts = []; foods = []; projectiles = []; aiSnakes = []; petInstances = [];

    velocity = { x: 1, y: 0 }; nextVelocity = { x: 1, y: 0 };
    score = 0; enemiesKilled = 0; killStreak = 0; auraTimer = 0;
    bossSpawnTimestamp = Date.now(); growthBuffer = 0; prestigeLevel = 0;
    speed = 110; isPaused = false; isGameOver = false;
    
    currentHearts = 1 + slayerUpgrades.maxHearts;
    currentStamina = 100 + (slayerUpgrades.maxStamina * 20);
    isSprinting = false; isExhausted = false; staminaRegenTimestamp = 0;
    isPlayerInvulnerable = false; playerInvulnerabilityTime = 0;

    if (activePetIds && Array.isArray(activePetIds)) {
        activePetIds.forEach(id => petInstances.push(new Pet(id)));
    }

    manageChunks(); // Initial spawn in active zone
    updateActiveChunks(); // Initialize AI active zones
    updateScore(); updateProgress(); updateXpBar(); updateKillCounter(); updateHearts(); updateStaminaBar();
};

const getWrappedDistance = (p1, p2) => {
    let dx = Math.abs(p1.x - p2.x);
    let dy = Math.abs(p1.y - p2.y);
    if (dx > TILE_COUNT_X / 2) dx = TILE_COUNT_X - dx;
    if (dy > TILE_COUNT_Y / 2) dy = TILE_COUNT_Y - dy;
    return Math.sqrt(dx*dx + dy*dy);
};

const getWrappedDistanceSq = (p1, p2) => {
    let dx = Math.abs(p1.x - p2.x);
    let dy = Math.abs(p1.y - p2.y);
    if (dx > TILE_COUNT_X / 2) dx = TILE_COUNT_X - dx;
    if (dy > TILE_COUNT_Y / 2) dy = TILE_COUNT_Y - dy;
    return dx*dx + dy*dy;
};

/**
 * Manages food spawning and culling based on player position.
 */
const manageChunks = () => {
    if (snake.length === 0) return;
    const head = snake[0];
    
    // 1. Culling: Remove fruits outside active chunk
    const radiusSq = CHUNK_RADIUS * CHUNK_RADIUS;
    for (let i = foods.length - 1; i >= 0; i--) {
        if (getWrappedDistanceSq(head, foods[i]) > radiusSq) {
            foods.splice(i, 1);
        }
    }

    // 2. Density Control: Calculate target density
    const targetDensity = Math.min(3 + upgrades.foodCount, MAX_ACTIVE_FRUITS);
    
    // 3. Spawning: Refill active chunk
    let spawned = 0;
    while (foods.length < targetDensity && spawned < SPAWN_BATCH_SIZE) {
        spawnFoodInChunk();
        spawned++;
    }
};

const updateActiveChunks = () => {
    if (snake.length === 0) return;
    const head = snake[0];
    const cx = Math.floor(head.x / AI_CHUNK_SIZE);
    const cy = Math.floor(head.y / AI_CHUNK_SIZE);

    activeChunkKeys.clear();
    // 5-Chunk System: Center + 4 Adjacent
    activeChunkKeys.add(`${cx},${cy}`);
    activeChunkKeys.add(`${cx+1},${cy}`);
    activeChunkKeys.add(`${cx-1},${cy}`);
    activeChunkKeys.add(`${cx},${cy+1}`);
    activeChunkKeys.add(`${cx},${cy-1}`);
};

/**
 * Spawns a single food item within the active chunk.
 * Uses cached weights for performance.
 */
const spawnFoodInChunk = () => {
    const head = snake[0];
    
    // Determine spawn angle (Biased towards movement direction)
    let angle = (velocity.x === 0 && velocity.y === 0) 
        ? Math.random() * Math.PI * 2 
        : Math.atan2(velocity.y, velocity.x) + (Math.random() - 0.5) * (Math.PI * 1.2);

    // Smart Distribution: Spawn in the outer ring of the chunk
    const minSpawnDist = 40; // Outside typical viewport radius
    const dist = minSpawnDist + Math.random() * (CHUNK_RADIUS - minSpawnDist);
    
    let fx = Math.round(head.x + Math.cos(angle) * dist);
    let fy = Math.round(head.y + Math.sin(angle) * dist);

    // Wrap coordinates
    while (fx < 0) fx += TILE_COUNT_X;
    while (fx >= TILE_COUNT_X) fx -= TILE_COUNT_X;
    while (fy < 0) fy += TILE_COUNT_Y;
    while (fy >= TILE_COUNT_Y) fy -= TILE_COUNT_Y;

    // Collision check (Snake & Existing Food)
    if (snake.some(p => p.x === fx && p.y === fy)) return;
    if (foods.some(f => f.x === fx && f.y === fy)) return;

    // Weight Calculation (Cached)
    if (!cachedFruitWeights || lastWeightUpdateLevel !== playerLevel) {
        const unlockedIndices = FRUIT_TYPES.map((f, i) => playerLevel >= f.reqLevel ? i : -1).filter(i => i !== -1);
        let totalWeight = 0;
        let decay = Math.max(1.01, 1.2 - (upgrades.luckBoost * 0.02) + (playerLevel * 0.005));
        
        cachedFruitWeights = unlockedIndices.map(i => {
            const w = 100 / Math.pow(decay, i);
            totalWeight += w;
            return { i, w };
        });
        cachedFruitWeights.total = totalWeight;
        lastWeightUpdateLevel = playerLevel;
    }

    let randomVal = Math.random() * cachedFruitWeights.total;
    let type = cachedFruitWeights[0].i;
    
    for (let item of cachedFruitWeights) {
        randomVal -= item.w;
        if (randomVal <= 0) { type = item.i; break; }
    }

    foods.push({ x: fx, y: fy, type: type });
};

const startGame = () => {
    menuOverlay.classList.add('hidden');
    
    // Mobile Performance Check & UI Setup
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;
    
    // Performance Mode: Lock FPS (60 on Mobile, 144 on PC)
    const targetFPS = isMobile ? 60 : 144;
    fpsInterval = 1000 / targetFPS;
    lastFrameTime = performance.now();

    // Initialize UI for both PC (Sidebar) and Mobile (Controls)
    if (typeof setupResponsiveUI === 'function') setupResponsiveUI();

    if (isMobile) {
        lowQualityMode = true;
        particlesEnabled = false;
        glowEnabled = false;
        if (typeof updateSettingsButtons === 'function') updateSettingsButtons();
    }

    initGame();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    lastUpdateTime = 0;
    timeSinceLastUpdate = 0;
    
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 30000);
    
    renderLoopId = requestAnimationFrame(runGameLoop);
};

const gameOver = () => {
    cancelAnimationFrame(renderLoopId);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    renderLoopId = null;
    isGameOver = true;
    playSound('over');
    if (score > highScore) {
        highScore = score;
        highScoreElement.innerText = formatNumber(highScore);
    }
    saveGame();
    const t = TRANSLATIONS[currentLanguage];
    menuOverlay.innerHTML = `
        <h1 style="color: #ff3366">${t.gameOver}</h1>
        <p>${t.finalScore} ${formatNumber(score)}</p>
        <p style="color: #ffd700">${t.goldEarned} ${formatNumber(coins)}</p>
        <button onclick="startGame()">${t.playAgain}</button>
        <button onclick="location.reload()">${t.mainMenu}</button>
    `;
    menuOverlay.classList.remove('hidden');
};

/**
 * Main logic handler. Splits player and world updates.
 */
const updateSnake = (movePlayer, moveWorld) => {
    if (movePlayer) {
        processPlayerMovement();
    }
    if (moveWorld) {
        processWorldUpdates();
    }
};

const processPlayerMovement = () => {
    velocity = { ...nextVelocity };
    let head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Wrap
    if (head.x < 0) head.x = TILE_COUNT_X - 1;
    if (head.x >= TILE_COUNT_X) head.x = 0;
    if (head.y < 0) head.y = TILE_COUNT_Y - 1;
    if (head.y >= TILE_COUNT_Y) head.y = 0;

    // Self Collision
    if (snake.some(part => head.x === part.x && head.y === part.y)) {
        takeDamage();
        return;
    }

    manageChunks();
    updateActiveChunks();
    
    // AI Collision (Player hits AI)
    if (aiSnakes.some(ai => !ai.isDead && ai.body.some(p => head.x === p.x && head.y === p.y))) {
        takeDamage();
        return;
    }

    snake.unshift(head);
    checkFoodCollision(head);
    checkPrestige();
};

const checkFoodCollision = (head) => {
    let eatenIndex = -1;
    const range = upgrades.eatRange;
    const rangeSq = range * range; // Squared range for faster distance check
    
    // Throttle Magnet: Only check magnet attraction every 3 frames
    // Direct collision (eating) is always checked to ensure responsiveness
    const checkMagnet = (frameCount % 3 === 0);
    
    // Optimized Range Check
    for (let i = 0; i < foods.length; i++) {
        const f = foods[i];
        const dx = f.x - head.x;
        const dy = f.y - head.y;
        
        // 1. Direct Hit (Fastest check)
        if (dx === 0 && dy === 0) { eatenIndex = i; break; }
        
        // 2. Magnet Logic (Circle-based & Throttled)
        // Spatial Partitioning: Only check if within squared radius
        if (range > 0 && checkMagnet) {
            if (dx*dx + dy*dy <= rangeSq) { eatenIndex = i; break; }
        }
    }

    if (eatenIndex !== -1) {
        givePlayerRewards(foods[eatenIndex].type, foods[eatenIndex].x, foods[eatenIndex].y);
        foods.splice(eatenIndex, 1);
        if (score % 50 === 0 && speed > 30) speed -= 2;
    } else {
        if (growthBuffer > 0) growthBuffer--;
        else snake.pop();
    }
};

const checkPrestige = () => {
    const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
    if (prestigeLevel < thresholds.length && snake.length >= thresholds[prestigeLevel]) {
        prestigeLevel++;
        snake = [snake[0]];
        playSound('eat');
        updateProgress();
    }
};

const processWorldUpdates = () => {
    // Boss Logic
    const now = Date.now();
    const activeBosses = aiSnakes.filter(ai => ai.isBoss && !ai.isDead);
    const bossTimerEl = document.getElementById('bossTimerDisplay');
    
    if (activeBosses.length > 0) {
        bossTimerEl.innerText = "👹 BOSS FIGHT!";
        bossTimerEl.style.color = "#ff0000";
    } else {
        let timeLeft = Math.max(0, bossSpawnTimestamp - now);
        let mins = Math.floor(timeLeft / 60000).toString().padStart(2, '0');
        let secs = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
        bossTimerEl.innerText = `👹 Boss: ${mins}:${secs}`;
        bossTimerEl.style.color = "#e040fb";

        if (timeLeft <= 0) {
            aiSnakes.push(new AiSnake(true));
            playSound('over');
            bossSpawnTimestamp = now + 999999999;
        }
    }

    // AI Spawning
    const targetAiCount = [15, 25, 40, 60, 80, 100, 125, 150].filter(l => playerLevel >= l).length;
    if (aiSnakes.filter(ai => !ai.isBoss).length < targetAiCount) aiSnakes.push(new AiSnake());

    // AI Updates & Collision
    let bossesDied = false;
    aiSnakes.forEach(ai => {
        ai.update();
        if (ai.isDead || ai.body.length === 0 || ai.isInvulnerable) return;

        const aiHead = ai.body[0];
        // Check if AI hit Player Body
        if (snake.some(p => aiHead.x === p.x && aiHead.y === p.y)) {
            ai.health--;
            const slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
            
            if (!ai.isBoss || ai.health <= 0) {
                grantKillRewards(ai, slayerGoldMult);
                if (ai.isBoss) bossesDied = true;
            } else {
                // Boss Hit (Non-fatal)
                score += 2500; coins += Math.floor(500 * slayerGoldMult); currentXp += 250;
                ai.isInvulnerable = true; ai.invulnerabilityTime = Date.now();
            }
            playSound('over');
            createParticles(aiHead.x * GRID_SIZE, aiHead.y * GRID_SIZE, ai.headColor);
        }
    });

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        if (getWrappedDistance(p, snake[0]) < 0.8) { takeDamage(); return; }
        if (p.life <= 0) projectiles.splice(i, 1);
    }

    if (bossesDied && aiSnakes.filter(ai => ai.isBoss && !ai.isDead).length === 0) {
        bossSpawnTimestamp = Date.now() + BOSS_SPAWN_COOLDOWN;
        aiSnakes = aiSnakes.filter(ai => !ai.isBoss || !ai.isDead);
    }
};

const grantKillRewards = (ai, slayerGoldMult) => {
    ai.die();
    enemiesKilled++;
    killStreak++; // Increment Aura Streak
    
    const aiHead = ai.body.length > 0 ? ai.body[0] : {x:0, y:0};
    createShockwave(aiHead.x * GRID_SIZE + GRID_SIZE/2, aiHead.y * GRID_SIZE + GRID_SIZE/2, ai.headColor);
    
    let soulsGain = ai.isBoss ? 50 : 1; // Normal enemies give 1 Soul
    
    let sMult = 1 + Math.log10(1 + upgrades.soulsMult) * 0.5;
    let lvl = upgrades.soulsExp;
    let sFlat = lvl * Math.pow(2, Math.floor(lvl / 10));
    let prestigeSoulsMult = (1 + (prestigeUpgrades.permSouls1 || 0) * 0.5) * (1 + (prestigeUpgrades.permSouls2 || 0) * 4.0);
    let slayerSoulsMult = (1 + (slayerUpgrades.souls1 || 0) * 0.05) * (1 + (slayerUpgrades.souls2 || 0) * 0.10);
    
    soulsGain = Math.floor(soulsGain * sMult * prestigeSoulsMult * slayerSoulsMult) + sFlat;
    souls += soulsGain;
    localStorage.setItem('snakeSouls', souls);
    
    updateKillCounter();
    
    let rewardMult = ai.isBoss ? 25 : 1;
    score += 500 * rewardMult;
    let goldGained = Math.floor(100 * rewardMult * slayerGoldMult);
    coins += goldGained;
    createFloatingText(aiHead.x * GRID_SIZE, aiHead.y * GRID_SIZE, `+${formatNumber(goldGained)} Gold`, '#ffd700');
    createFloatingText(aiHead.x * GRID_SIZE, aiHead.y * GRID_SIZE - 20, `+${formatNumber(50 * rewardMult)} XP`, '#00ffff');
    currentXp += 50 * rewardMult;
    updateScore();
};

const takeDamage = () => {
    if (typeof isPlayerInvulnerable !== 'undefined' && isPlayerInvulnerable) return;

    // Purple Slayer Aura (Tier 7) Protection:
    // If the aura pulse is active (first 5s of 20s cycle), player is protected from collision damage.
    if (killStreak >= 35 && auraTimer < 5000) return;

    currentHearts--;
    updateHearts();
    playSound('over');
    
    if (currentHearts <= 0) {
        gameOver();
    } else {
        isPlayerInvulnerable = true;
        playerInvulnerabilityTime = Date.now();
        shakeEndTime = Date.now() + 500;
    }
};

const updateKillCounter = () => {
    const el = document.getElementById('killCounterDisplay');
    if (el) el.innerText = `💀 Kills: ${enemiesKilled}`;
};

let lastUpdateTime = 0;
let timeSinceLastUpdate = 0;
let lastFpsTime = 0;

const runGameLoop = (timestamp) => {
    if (isGameOver || !renderLoopId) return;
    renderLoopId = requestAnimationFrame(runGameLoop);

    // FPS Throttling
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < fpsInterval) return;
    lastFrameTime = timestamp - (elapsed % fpsInterval);

    if (!isPaused) {
        if (!lastUpdateTime) lastUpdateTime = timestamp;
        const deltaTime = timestamp - lastUpdateTime;
        lastUpdateTime = timestamp;
        timeSinceLastUpdate += deltaTime;
        timeSinceWorldUpdate += deltaTime;

        // Throttled Aura Logic (Every 5 frames)
        if (killStreak >= 35 && frameCount % 5 === 0) {
            auraTimer += (deltaTime * 5); // Approximate timer
            if (auraTimer >= 20000) auraTimer = 0;
            
            if (auraTimer < 5000 && snake.length > 0) {
                const head = snake[0];
                const slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
                
                aiSnakes.forEach(ai => {
                    if (!ai.isDead && ai.body.length > 0 && getWrappedDistanceSq(head, ai.body[0]) <= 64) { // 8^2
                        grantKillRewards(ai, slayerGoldMult);
                    }
                });
            }
        } else {
            auraTimer = 0;
        }

        if (typeof isPlayerInvulnerable !== 'undefined' && isPlayerInvulnerable) {
            if (Date.now() - playerInvulnerabilityTime > 2000) {
                isPlayerInvulnerable = false;
            }
        }

        const maxStamina = 100 + (slayerUpgrades.maxStamina * 20);
        const regenRate = 0.2 + (slayerUpgrades.staminaRegen * 0.05);
        
        if (slayerUpgrades.infiniteStamina > 0) {
            currentStamina = maxStamina;
            isExhausted = false;
        } else {
            if (isSprinting && !isExhausted && currentStamina > 0) {
                currentStamina -= 1;
                staminaRegenTimestamp = Date.now() + 1000;
                
                if (currentStamina <= 0) {
                    currentStamina = 0;
                    isExhausted = true;
                }
            } else {
                if (Date.now() > staminaRegenTimestamp && currentStamina < maxStamina) {
                    currentStamina += regenRate;
                    if (currentStamina > maxStamina) currentStamina = maxStamina;
                }
                
                if (isExhausted && currentStamina > (maxStamina * 0.25)) {
                    isExhausted = false;
                }
            }
        }
        updateStaminaBar();

        let currentSpeed = speed;
        if (isSprinting && !isExhausted && currentStamina > 0) currentSpeed = speed / 2.5;
        
        let worldSpeed = speed;

        let movePlayer = false;
        let moveWorld = false;

        if (timeSinceLastUpdate > currentSpeed) {
            movePlayer = true;
            timeSinceLastUpdate -= currentSpeed;
            if (timeSinceLastUpdate > currentSpeed * 2) timeSinceLastUpdate = 0;
        }
        if (timeSinceWorldUpdate > worldSpeed) {
            moveWorld = true;
            timeSinceWorldUpdate -= worldSpeed;
            if (timeSinceWorldUpdate > worldSpeed * 2) timeSinceWorldUpdate = 0;
        }

        if (movePlayer || moveWorld) {
            updateSnake(movePlayer, moveWorld);
        }

        if (petInstances) {
            petInstances.forEach(p => p.update());
        }
    } else {
        lastUpdateTime = timestamp;
    }

    updateParticles();
    updateFloatingTexts();
    draw();
    if (frameCount % 3 === 0) drawMinimap();

    frameCount++;
    if (timestamp - lastFpsTime >= 1000) {
        document.getElementById('fpsCounter').innerText = `FPS: ${frameCount}`;
        frameCount = 0;
        lastFpsTime = timestamp;
    }
};

const saveGame = () => {
    if (isGameOver && score === 0 && coins === 0) return;

    try {
        localStorage.setItem('snakeCoins', coins);
        localStorage.setItem('snakePlayerLevel', playerLevel);
        localStorage.setItem('snakeXp', currentXp);
        localStorage.setItem('snakeHighScore', highScore);
        localStorage.setItem('snakeRP', rebirthPoints);
        localStorage.setItem('snakeEnemiesKilled', enemiesKilled);
        localStorage.setItem('snakeRebirthCount', rebirthCount);
        localStorage.setItem('snakeSouls', souls);
        localStorage.setItem('snakeOwnedPets', JSON.stringify(ownedPets));
        localStorage.setItem('snakeActivePets', JSON.stringify(activePetIds));
        
        localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
        localStorage.setItem('snakePrestigeUpgrades', JSON.stringify(prestigeUpgrades));
        localStorage.setItem('snakeSlayerUpgrades', JSON.stringify(slayerUpgrades));
        
        localStorage.setItem('snakeSound', soundEnabled);
        localStorage.setItem('snakeParticles', particlesEnabled);
        localStorage.setItem('snakeShowRange', showEatRange);
        localStorage.setItem('snakeGlow', glowEnabled);
        localStorage.setItem('snakeBrightness', brightnessLevel);
        localStorage.setItem('snakeLanguage', currentLanguage);

        if (typeof showSaveIndicator === 'function') showSaveIndicator();
    } catch (e) {
        console.error("Save Failed:", e);
    }
};

const refreshPets = () => {
    petInstances = [];
    if (activePetIds && Array.isArray(activePetIds)) {
        activePetIds.forEach(id => petInstances.push(new Pet(id)));
    }
};

window.addEventListener('beforeunload', () => {
    saveGame();
});

window.resetGameProgress = resetGameProgress;
window.startGame = startGame;
window.saveGame = saveGame;
window.refreshPets = refreshPets;

window.isPositionActive = (x, y) => {
    const cx = Math.floor(x / AI_CHUNK_SIZE);
    const cy = Math.floor(y / AI_CHUNK_SIZE);
    return activeChunkKeys.has(`${cx},${cy}`);
};
