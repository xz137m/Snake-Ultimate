let autoSaveInterval;
let timeSinceWorldUpdate = 0;
let sessionStartTime = Date.now();
const CHUNK_RADIUS = 65; // Expanded Active Zone (~1300px)
const MAX_ACTIVE_FRUITS = 150; // Hard limit for performance
const SPAWN_BATCH_SIZE = 5; // Max fruits to spawn per frame

function resetGameProgress() {
    if (confirm(TRANSLATIONS[currentLanguage].confirmReset)) {
        // 1. Clear Local Storage
        localStorage.clear();
        
        // 2. Stop Animations & Loops
        if (renderLoopId) cancelAnimationFrame(renderLoopId);
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        
        // 3. Reset Variables
        coins = 0;
        souls = 0;
        rebirthPoints = 0;
        rebirthCount = 0;
        playerLevel = 1;
        currentXp = 0;
        highScore = 0;
        score = 0;
        enemiesKilled = 0;
        killStreak = 0;
        prestigeLevel = 0;
        growthBuffer = 0;
        
        // Reset Upgrades
        upgrades = { foodCount: 0, scoreMult: 0, doublePoints: 0, xpMult: 0, growthBoost: 0, eatRange: 0, luckBoost: 0, soulsMult: 0, soulsExp: 0 };
        prestigeUpgrades = { permGold1: 0, permGold2: 0, permSouls1: 0, permSouls2: 0, permRP1: 0, permRP2: 0, permXp: 0 };
        slayerUpgrades = { maxHearts: 0, maxStamina: 0, staminaRegen: 0, gold1: 0, gold2: 0, rp1: 0, rp2: 0, souls1: 0, souls2: 0, infiniteStamina: 0 };
        
        // Reset World Size
        TILE_COUNT_X = 20 + playerLevel;
        TILE_COUNT_Y = 20 + playerLevel;
        
        // 4. Update UI Immediately
        if (highScoreElement) highScoreElement.innerText = formatNumber(highScore);
        
        // 5. Restart Game (This handles UI updates and clearing arrays)
        startGame();
        
        if (typeof closeSettings === 'function') closeSettings();
    }
}

function initGame() {
    snake = [{ x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) }];
    particles = [];
    floatingTexts = [];
    foods = [];
    projectiles = [];
    aiSnakes = [];
    velocity = { x: 1, y: 0 };
    nextVelocity = { x: 1, y: 0 };
    score = 0;
    enemiesKilled = 0;
    killStreak = 0;
    auraTimer = 0;
    bossSpawnTimestamp = Date.now();
    growthBuffer = 0;
    prestigeLevel = 0;
    speed = 110;
    isPaused = false;
    isGameOver = false;
    
    currentHearts = 1 + slayerUpgrades.maxHearts;
    currentStamina = 100 + (slayerUpgrades.maxStamina * 20);
    isSprinting = false;
    isExhausted = false;
    staminaRegenTimestamp = 0;
    isPlayerInvulnerable = false;
    playerInvulnerabilityTime = 0;

    petInstances = [];
    if (activePetIds && Array.isArray(activePetIds)) {
        activePetIds.forEach(id => petInstances.push(new Pet(id)));
    }

    manageChunks(); // Initial spawn in active zone
    updateScore();
    updateProgress();
    updateXpBar();
    updateKillCounter();
    updateHearts();
    updateStaminaBar();
}

function getWrappedDistance(p1, p2) {
    let dx = Math.abs(p1.x - p2.x);
    let dy = Math.abs(p1.y - p2.y);
    if (dx > TILE_COUNT_X / 2) dx = TILE_COUNT_X - dx;
    if (dy > TILE_COUNT_Y / 2) dy = TILE_COUNT_Y - dy;
    return Math.sqrt(dx*dx + dy*dy);
}

function getWrappedDistanceSq(p1, p2) {
    let dx = Math.abs(p1.x - p2.x);
    let dy = Math.abs(p1.y - p2.y);
    if (dx > TILE_COUNT_X / 2) dx = TILE_COUNT_X - dx;
    if (dy > TILE_COUNT_Y / 2) dy = TILE_COUNT_Y - dy;
    return dx*dx + dy*dy;
}

function manageChunks() {
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
}

function spawnFoodInChunk() {
    const head = snake[0];
    
    // Determine spawn angle (Biased towards movement direction)
    let angle;
    if (velocity.x === 0 && velocity.y === 0) {
        angle = Math.random() * Math.PI * 2;
    } else {
        const moveAngle = Math.atan2(velocity.y, velocity.x);
        // Spawn in a 180 degree arc in front of player
        angle = moveAngle + (Math.random() - 0.5) * (Math.PI * 1.2); 
    }

    // Smart Distribution: Spawn in the outer ring of the chunk
    // This prevents fruits from popping in within the viewport
    const minSpawnDist = 40; // Outside typical viewport radius
    const dist = minSpawnDist + Math.random() * (CHUNK_RADIUS - minSpawnDist);
    
    let fx = head.x + Math.cos(angle) * dist;
    let fy = head.y + Math.sin(angle) * dist;

    // Wrap coordinates
    fx = Math.round(fx);
    fy = Math.round(fy);
    while (fx < 0) fx += TILE_COUNT_X;
    while (fx >= TILE_COUNT_X) fx -= TILE_COUNT_X;
    while (fy < 0) fy += TILE_COUNT_Y;
    while (fy >= TILE_COUNT_Y) fy -= TILE_COUNT_Y;

    // Collision check (Snake & Existing Food)
    for (let part of snake) if (part.x === fx && part.y === fy) return;
    for (let f of foods) if (f.x === fx && f.y === fy) return;

    // Select Fruit Type (Rarity Logic)
    const unlockedIndices = [];
    for(let i=0; i<FRUIT_TYPES.length; i++) if(playerLevel >= FRUIT_TYPES[i].reqLevel) unlockedIndices.push(i);
    
    let totalWeight = 0;
    let levelPenalty = playerLevel * 0.005;
    let decay = Math.max(1.01, 1.2 - (upgrades.luckBoost * 0.02) + levelPenalty);
    const weights = unlockedIndices.map(i => { const w = 100 / Math.pow(decay, i); totalWeight += w; return w; });
    
    let randomVal = Math.random() * totalWeight;
    let type = unlockedIndices[0];
    for(let i=0; i<weights.length; i++) { randomVal -= weights[i]; if(randomVal <= 0) { type = unlockedIndices[i]; break; } }

    foods.push({ x: fx, y: fy, type: type });
}

function startGame() {
    menuOverlay.classList.add('hidden');
    initGame();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    lastUpdateTime = 0;
    timeSinceLastUpdate = 0;
    
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 30000);
    
    renderLoopId = requestAnimationFrame(runGameLoop);
}

function gameOver() {
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
}

function updateSnake(movePlayer, moveWorld) {
    let head = snake[0];
    if (movePlayer) {
        velocity = { ...nextVelocity };
        head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };
        
        if (head.x < 0) head.x = TILE_COUNT_X - 1;
        if (head.x >= TILE_COUNT_X) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT_Y - 1;
        if (head.y >= TILE_COUNT_Y) head.y = 0;
        
        for (let part of snake) {
            if (head.x === part.x && head.y === part.y) {
                takeDamage();
                return;
            }
        }
        
        // Update chunks as player moves
        manageChunks();
    }

    if (moveWorld) {
        const bossTimerEl = document.getElementById('bossTimerDisplay');
        const now = Date.now();
        const activeBosses = aiSnakes.filter(ai => ai.isBoss && !ai.isDead);
        
        if (activeBosses.length > 0) {
            bossTimerEl.innerText = "👹 BOSS FIGHT!";
            bossTimerEl.style.color = "#ff0000";
        } else {
            let timeLeft = Math.max(0, bossSpawnTimestamp - now);
            let minutes = Math.floor(timeLeft / 60000);
            let seconds = Math.floor((timeLeft % 60000) / 1000);
            bossTimerEl.innerText = `👹 Boss: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            bossTimerEl.style.color = "#e040fb";

            if (timeLeft <= 0) {
                aiSnakes.push(new AiSnake(true));
                playSound('over');
                bossSpawnTimestamp = now + 999999999;
            }
        }

        const aiSpawnLevels = [15, 25, 40, 60, 80, 100, 125, 150];
        let targetAiCount = 0;
        for (let lvl of aiSpawnLevels) {
            if (playerLevel >= lvl) targetAiCount++;
        }
        
        const normalSnakes = aiSnakes.filter(ai => !ai.isBoss).length;
        while (normalSnakes < targetAiCount && aiSnakes.length < targetAiCount + 1) {
            aiSnakes.push(new AiSnake());
            break;
        }

        let bossesDiedThisFrame = false;
        for (let ai of aiSnakes) {
            ai.update();
            
            if (ai.isDead) continue;

            if (ai.body.length > 0) {
                if (ai.isInvulnerable) continue;

                const aiHead = ai.body[0];
                for (let part of snake) {
                    if (aiHead.x === part.x && aiHead.y === part.y) {
                        ai.health--;
                        let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
                        
                        // Normal enemies die immediately (ignore health if not boss)
                        if (!ai.isBoss || ai.health <= 0) {
                            grantKillRewards(ai, slayerGoldMult);
                            if (ai.isBoss) bossesDiedThisFrame = true;
                        } else {
                            // Only Bosses get invulnerability frames
                            let rewardMult = 5;
                            score += 500 * rewardMult;
                            let goldGained = Math.floor(100 * rewardMult * slayerGoldMult);
                            coins += goldGained;
                            currentXp += 50 * rewardMult;
                            
                            ai.isInvulnerable = true;
                            ai.invulnerabilityTime = Date.now();
                        }
                        playSound('over');
                        createParticles(aiHead.x * GRID_SIZE, aiHead.y * GRID_SIZE, ai.headColor);
                        break;
                    }
                }
            }
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.update();
            const currentHead = snake[0];
            const dist = Math.sqrt(Math.pow(p.x - currentHead.x, 2) + Math.pow(p.y - currentHead.y, 2));
            if (dist < 0.8) {
                takeDamage();
                return;
            }
            if (p.life <= 0) projectiles.splice(i, 1);
        }

        if (bossesDiedThisFrame) {
            const remainingBosses = aiSnakes.filter(ai => ai.isBoss && !ai.isDead);
            if (remainingBosses.length === 0) {
                bossSpawnTimestamp = Date.now() + BOSS_SPAWN_COOLDOWN;
                aiSnakes = aiSnakes.filter(ai => !ai.isBoss || !ai.isDead);
            }
        }
    }

    if (movePlayer) {
        for (let ai of aiSnakes) {
            if (ai.isDead) continue;
            for (let part of ai.body) {
                if (head.x === part.x && head.y === part.y) {
                    takeDamage();
                    return;
                }
            }
        }
    }

    if (movePlayer) {
        snake.unshift(head);
        let eatenIndex = -1;
        let range = upgrades.eatRange;
        for (let i = 0; i < foods.length; i++) {
            let dx = foods[i].x - head.x;
            let dy = foods[i].y - head.y;
            let isDirectHit = (head.x === foods[i].x && head.y === foods[i].y);
            let inRange = false;
            if (velocity.x === 1) inRange = (dx >= 1 && dx <= range) && (Math.abs(dy) <= range);
            else if (velocity.x === -1) inRange = (dx >= -range && dx <= -1) && (Math.abs(dy) <= range);
            else if (velocity.y === 1) inRange = (dy >= 1 && dy <= range) && (Math.abs(dx) <= range);
            else if (velocity.y === -1) inRange = (dy >= -range && dy <= -1) && (Math.abs(dx) <= range);
            if (isDirectHit || inRange) {
                eatenIndex = i;
                break;
            }
        }
        if (eatenIndex !== -1) {
            let fruit = FRUIT_TYPES[foods[eatenIndex].type];
            let prestigeMult = Math.pow(2, prestigeLevel);
            let dpLvl = upgrades.doublePoints;
            let shopMult = (dpLvl === 0) ? 1 : dpLvl * Math.pow(2, Math.floor(dpLvl / 10));
            let levelMult = Math.pow(1.5, playerLevel - 1);
            let xpUpgradeMult = 1 + Math.log10(1 + upgrades.xpMult) * 0.5;
            let permGoldMult = (1 + (prestigeUpgrades.permGold1 || 0) * 0.5) * (1 + (prestigeUpgrades.permGold2 || 0) * 4.0);
            let permXpMult = (1 + (prestigeUpgrades.permXp || 0) * 0.1);
            let scoreUpgrade = 1 + Math.log10(1 + upgrades.scoreMult) * 0.5;
            let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
            let points = (fruit.points * scoreUpgrade) * shopMult * prestigeMult * levelMult * permGoldMult * slayerGoldMult;
            let gold = (fruit.gold * scoreUpgrade) * shopMult * prestigeMult * levelMult * permGoldMult * slayerGoldMult;
            
            // Diminishing XP for low level fruits
            let levelDiff = Math.max(0, playerLevel - fruit.reqLevel);
            let dimFactor = 1 / (1 + levelDiff * 0.15);
            
            // Time Scaling (Decay over session time)
            let sessionMinutes = (Date.now() - sessionStartTime) / 60000;
            let timeFactor = Math.max(0.1, 1 - (sessionMinutes * 0.002));

            let xpGain = fruit.xp * prestigeMult * xpUpgradeMult * permXpMult * dimFactor * timeFactor;
            score += Math.floor(points);
            let goldGained = Math.floor(gold);
            coins += goldGained;
            if (goldGained > 0) createFloatingText(foods[eatenIndex].x * GRID_SIZE, foods[eatenIndex].y * GRID_SIZE, `+${formatNumber(goldGained)} Gold`, '#ffd700');
            let currentCap = getCurrentLevelCap();
            if (playerLevel < currentCap) {
                let xpGained = Math.floor(xpGain);
                currentXp += xpGained;
                if (xpGained > 0) createFloatingText(foods[eatenIndex].x * GRID_SIZE, foods[eatenIndex].y * GRID_SIZE - 20, `+${formatNumber(xpGained)} XP`, '#00ffff');
                // New Exponential XP Formula: Base * Level^2.5
                let xpNeeded = Math.floor(1000 * Math.pow(playerLevel, 2.5));
                if (currentXp >= xpNeeded) {
                    currentXp -= xpNeeded;
                    playerLevel++;
                    TILE_COUNT_X = 20 + (playerLevel * 2);
                    TILE_COUNT_Y = 20 + (playerLevel * 2);
                    playSound('eat');
                }
            }
            updateScore();
            updateXpBar();
            updateProgress();
            growthBuffer += (fruit.growth + upgrades.growthBoost - 1);
            playSound('eat');
            createParticles(foods[eatenIndex].x * GRID_SIZE + GRID_SIZE/2, foods[eatenIndex].y * GRID_SIZE + GRID_SIZE/2, fruit.color);
            foods.splice(eatenIndex, 1);
            
            if (score % 50 === 0 && speed > 30) {
                speed -= 2;
            }
        } else {
            if (growthBuffer > 0) {
                growthBuffer--;
            } else {
                snake.pop();
            }
        }
        
        const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
        if (prestigeLevel < thresholds.length) {
            if (snake.length >= thresholds[prestigeLevel]) {
                prestigeLevel++;
                snake = [snake[0]];
                playSound('eat');
                updateProgress();
            }
        }
    }
}

function grantKillRewards(ai, slayerGoldMult) {
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
}

function takeDamage() {
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
}

function updateKillCounter() {
    const el = document.getElementById('killCounterDisplay');
    if (el) el.innerText = `💀 Kills: ${enemiesKilled}`;
}

let lastUpdateTime = 0;
let timeSinceLastUpdate = 0;
let lastFpsTime = 0;
let frameCount = 0;

function runGameLoop(timestamp) {
    if (isGameOver || !renderLoopId) return;
    renderLoopId = requestAnimationFrame(runGameLoop);

    if (!isPaused) {
        if (!lastUpdateTime) lastUpdateTime = timestamp;
        const deltaTime = timestamp - lastUpdateTime;
        lastUpdateTime = timestamp;
        timeSinceLastUpdate += deltaTime;
        timeSinceWorldUpdate += deltaTime;

        // --- Tier 7 Aura Logic (Passive Kill Zone) ---
        if (killStreak >= 35) {
            auraTimer += deltaTime;
            if (auraTimer >= 20000) auraTimer = 0; // Reset every 20s
            
            // Active for first 5 seconds
            if (auraTimer < 5000 && snake.length > 0) {
                const head = snake[0];
                const auraRadius = 8; // Grid units
                
                for (let ai of aiSnakes) {
                    if (ai.isDead || ai.body.length === 0) continue;
                    const aiHead = ai.body[0];
                    const dx = Math.abs(head.x - aiHead.x);
                    const dy = Math.abs(head.y - aiHead.y);
                    // Simple distance check
                    if (Math.sqrt(dx*dx + dy*dy) <= auraRadius) {
                        let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
                        grantKillRewards(ai, slayerGoldMult);
                    }
                }
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
}

function saveGame() {
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
}

function refreshPets() {
    petInstances = [];
    if (activePetIds && Array.isArray(activePetIds)) {
        activePetIds.forEach(id => petInstances.push(new Pet(id)));
    }
}

window.addEventListener('beforeunload', () => {
    saveGame();
});

window.resetGameProgress = resetGameProgress;
window.startGame = startGame;
window.saveGame = saveGame;
window.refreshPets = refreshPets;
window.getSafeSpawnPoint = getSafeSpawnPoint;
window.givePlayerRewards = givePlayerRewards;
window.togglePause = togglePause;

function getSafeSpawnPoint() {
    let safe = false;
    let x, y;
    let attempts = 0;
    const safeDist = (typeof SAFE_SPAWN_RADIUS !== 'undefined') ? SAFE_SPAWN_RADIUS : 15;

    while (!safe && attempts < 50) {
        x = Math.floor(Math.random() * TILE_COUNT_X);
        y = Math.floor(Math.random() * TILE_COUNT_Y);
        safe = true;

        // Check Player Distance
        if (snake.length > 0) {
            const dx = x - snake[0].x;
            const dy = y - snake[0].y;
            if (Math.sqrt(dx*dx + dy*dy) < safeDist) safe = false;
        }

        // Check Pets Distance
        if (safe && typeof petInstances !== 'undefined') {
            for (let p of petInstances) {
                const dx = x - p.x;
                const dy = y - p.y;
                if (Math.sqrt(dx*dx + dy*dy) < safeDist) {
                    safe = false;
                    break;
                }
            }
        }
        attempts++;
    }
    // Fallback if no safe spot found
    if (!safe) {
        x = Math.floor(Math.random() * TILE_COUNT_X);
        y = Math.floor(Math.random() * TILE_COUNT_Y);
    }
    return { x, y };
}

function givePlayerRewards(fruitTypeIndex, x, y) {
    let fruit = FRUIT_TYPES[fruitTypeIndex];
    
    // Calculate Multipliers (Same as updateSnake)
    let prestigeMult = Math.pow(2, prestigeLevel);
    let dpLvl = upgrades.doublePoints;
    let shopMult = (dpLvl === 0) ? 1 : dpLvl * Math.pow(2, Math.floor(dpLvl / 10));
    let levelMult = Math.pow(1.5, playerLevel - 1);
    let xpUpgradeMult = 1 + Math.log10(1 + upgrades.xpMult) * 0.5;
    let permGoldMult = (1 + (prestigeUpgrades.permGold1 || 0) * 0.5) * (1 + (prestigeUpgrades.permGold2 || 0) * 4.0);
    let permXpMult = (1 + (prestigeUpgrades.permXp || 0) * 0.1);
    let scoreUpgrade = 1 + Math.log10(1 + upgrades.scoreMult) * 0.5;
    let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
    
    let points = (fruit.points * scoreUpgrade) * shopMult * prestigeMult * levelMult * permGoldMult * slayerGoldMult;
    let gold = (fruit.gold * scoreUpgrade) * shopMult * prestigeMult * levelMult * permGoldMult * slayerGoldMult;
    
    // Diminishing XP & Time Scaling
    let levelDiff = Math.max(0, playerLevel - fruit.reqLevel);
    let dimFactor = 1 / (1 + levelDiff * 0.15);
    let sessionMinutes = (Date.now() - sessionStartTime) / 60000;
    let timeFactor = Math.max(0.1, 1 - (sessionMinutes * 0.002));

    let xpGain = fruit.xp * prestigeMult * xpUpgradeMult * permXpMult * dimFactor * timeFactor;

    // Apply Rewards
    score += Math.floor(points);
    let goldGained = Math.floor(gold);
    coins += goldGained;
    
    if (goldGained > 0) createFloatingText(x * GRID_SIZE, y * GRID_SIZE, `+${formatNumber(goldGained)} Gold`, '#ffd700');
    console.log('Pet reward sent: Gold +' + goldGained); // Console Verification

    let currentCap = getCurrentLevelCap();
    if (playerLevel < currentCap) {
        let xpGained = Math.floor(xpGain);
        currentXp += xpGained;
        if (xpGained > 0) createFloatingText(x * GRID_SIZE, y * GRID_SIZE - 20, `+${formatNumber(xpGained)} XP`, '#00ffff');
        
        let xpNeeded = Math.floor(1000 * Math.pow(playerLevel, 2.5));
        if (currentXp >= xpNeeded) {
            currentXp -= xpNeeded;
            playerLevel++;
            TILE_COUNT_X = 20 + (playerLevel * 2);
            TILE_COUNT_Y = 20 + (playerLevel * 2);
            playSound('eat');
        }
    }
    
    growthBuffer += (fruit.growth + upgrades.growthBoost - 1);
    
    updateScore();
    updateXpBar();
    updateProgress();
    playSound('eat');
    createParticles(x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2, fruit.color);
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
        if (isPaused) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        } else {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
    }
}
