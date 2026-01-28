let autoSaveInterval;
let timeSinceWorldUpdate = 0; // مؤقت لتحديث العالم (الأعداء)

function resetGameProgress() {
    showConfirmation(TRANSLATIONS[currentLanguage].confirmReset, () => {
        localStorage.clear();
        location.reload();
    });
}

function initGame() {
    snake = [{ x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) }];
    particles = [];
    floatingTexts = [];
    foods = [];
    projectiles = [];
    aiSnakes = []; // تهيئة مصفوفة الأعداء
    velocity = { x: 1, y: 0 };
    nextVelocity = { x: 1, y: 0 };
    score = 0;
    enemiesKilled = 0;
    bossSpawnTimestamp = Date.now(); // يرسبن فوراً عند بدء اللعبة
    growthBuffer = 0;
    prestigeLevel = 0;
    speed = 110;
    isPaused = false;
    isGameOver = false;
    
    // Reset Combat Stats
    currentHearts = 1 + slayerUpgrades.maxHearts;
    currentStamina = 100 + (slayerUpgrades.maxStamina * 20);
    isSprinting = false;
    isExhausted = false;
    staminaRegenTimestamp = 0;
    isPlayerInvulnerable = false;
    playerInvulnerabilityTime = 0;

    const foodCount = 3 + upgrades.foodCount;
    for(let i=0; i<foodCount; i++) {
        placeFood();
    }
    updateScore();
    updateProgress();
    updateXpBar();
    updateKillCounter();
    updateHearts();
    updateStaminaBar();
}

function placeFood() {
    const unlockedIndices = [];
    for(let i=0; i<FRUIT_TYPES.length; i++) {
        if(playerLevel >= FRUIT_TYPES[i].reqLevel) {
            unlockedIndices.push(i);
        }
    }
    let totalWeight = 0;
    let decay = 1.0 + (0.2 / (1 + upgrades.luckBoost * 0.005));
    const weights = unlockedIndices.map(i => {
        const w = 100 / Math.pow(decay, i); 
        totalWeight += w;
        return w;
    });
    let randomVal = Math.random() * totalWeight;
    let type = unlockedIndices[0];
    for(let i=0; i<weights.length; i++) {
        randomVal -= weights[i];
        if(randomVal <= 0) {
            type = unlockedIndices[i];
            break;
        }
    }
    let newFood = {
        x: Math.floor(Math.random() * TILE_COUNT_X),
        y: Math.floor(Math.random() * TILE_COUNT_Y),
        type: type
    };
    for (let part of snake) {
        if (part.x === newFood.x && part.y === newFood.y) {
            return placeFood();
        }
    }
    foods.push(newFood);
}

function startGame() {
    menuOverlay.classList.add('hidden');
    initGame();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // إيقاف الحلقات القديمة إذا كانت موجودة
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    // بدء حلقة اللعبة الجديدة
    lastUpdateTime = 0;
    timeSinceLastUpdate = 0;
    
    // بدء الحفظ التلقائي كل 30 ثانية
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(saveGame, 30000);
    
    renderLoopId = requestAnimationFrame(runGameLoop);
}

function gameOver() {
    cancelAnimationFrame(renderLoopId);
    if (autoSaveInterval) clearInterval(autoSaveInterval); // إيقاف الحفظ التلقائي عند الخسارة
    renderLoopId = null; // منع استئناف اللعبة
    isGameOver = true;
    playSound('over');
    if (score > highScore) {
        highScore = score;
        highScoreElement.innerText = formatNumber(highScore);
    }
    saveGame(); // حفظ نهائي عند الخسارة
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
    let head = snake[0]; // الرأس الحالي

    // 1. حركة اللاعب (فقط إذا كان دوره)
    if (movePlayer) {
        velocity = { ...nextVelocity };
        head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };
        
        // التفاف حول الجدران
        if (head.x < 0) head.x = TILE_COUNT_X - 1;
        if (head.x >= TILE_COUNT_X) head.x = 0;
        if (head.y < 0) head.y = TILE_COUNT_Y - 1;
        if (head.y >= TILE_COUNT_Y) head.y = 0;
        
        // التحقق من التصادم مع الذات
        for (let part of snake) {
            if (head.x === part.x && head.y === part.y) {
                gameOver();
                return;
            }
        }
    }

    // 2. تحديث العالم (الأعداء والمقذوفات) - مستقل عن سرعة اللاعب
    if (moveWorld) {
        // --- تحديث مؤقت الزعيم ---
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

            // ترسيب الزعيم (3 رؤوس) عند انتهاء الوقت
            if (timeLeft <= 0) {
                // إضافة زعيم واحد
                aiSnakes.push(new AiSnake(true));
                playSound('over'); // صوت تحذيري
                // سيتم إعادة تعيين الوقت فقط عندما يموتون جميعاً
                bossSpawnTimestamp = now + 999999999; // إيقاف المؤقت مؤقتاً
            }
        }

        // --- منطق AI SNAKE ---
        // مستويات ظهور الأعداء (15, 25, 40, 60, 80...)
        const aiSpawnLevels = [15, 25, 40, 60, 80, 100, 125, 150];
        let targetAiCount = 0;
        for (let lvl of aiSpawnLevels) {
            if (playerLevel >= lvl) targetAiCount++;
        }
        
        // إضافة أعداء جدد إذا لزم الأمر
        const normalSnakes = aiSnakes.filter(ai => !ai.isBoss).length;
        while (normalSnakes < targetAiCount && aiSnakes.length < targetAiCount + 1) { // +1 للزعيم
            aiSnakes.push(new AiSnake());
            break; // إضافة واحد في كل إطار لتجنب التعليق
        }

        // تحديث حركة الأعداء والتحقق من التصادم
        let bossesDiedThisFrame = false;
        for (let ai of aiSnakes) {
            ai.update();
            
            if (ai.isDead) continue;

            // هل اصطدم رأس العدو بجسم اللاعب؟ (يموت العدو)
            if (ai.body.length > 0) {
                // إذا كان في وضع الحماية، لا يتضرر
                if (ai.isInvulnerable) continue;

                const aiHead = ai.body[0];
                for (let part of snake) {
                    if (aiHead.x === part.x && aiHead.y === part.y) {
                        ai.health--; // إنقاص صحة العدو
                        if (ai.health <= 0) {
                            // العدو مات
                            ai.die();
                            enemiesKilled++;
                            
                            // تفعيل موجة صدمة عند موقع موت العدو
                            createShockwave(aiHead.x * GRID_SIZE + GRID_SIZE/2, aiHead.y * GRID_SIZE + GRID_SIZE/2, ai.headColor);
                            
                            // Gain Souls
                            let soulsGain = ai.isBoss ? 50 : 5;
                            
                            // تطبيق تطويرات الأرواح
                            let sMult = 1 + (upgrades.soulsMult * 0.05); // زيادة 5% لكل مستوى
                            let lvl = upgrades.soulsExp;
                            let sFlat = lvl * Math.pow(2, Math.floor(lvl / 10)); // الحسبة الجديدة: المستوى * المضاعف
                            let prestigeSoulsMult = (1 + (prestigeUpgrades.permSouls1 || 0) * 0.05) * (1 + (prestigeUpgrades.permSouls2 || 0) * 0.10);
                            let slayerSoulsMult = (1 + (slayerUpgrades.souls1 || 0) * 0.05) * (1 + (slayerUpgrades.souls2 || 0) * 0.10);
                            
                            soulsGain = Math.floor(soulsGain * sMult * prestigeSoulsMult * slayerSoulsMult) + sFlat;

                            souls += soulsGain;
                            localStorage.setItem('snakeSouls', souls);
                            
                            updateKillCounter();
                            
                            // مكافآت القتل
                            let rewardMult = ai.isBoss ? 25 : 1; // الزعيم يعطي مكافأة قتل ضخمة
                            let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
                            score += 500 * rewardMult;
                            let goldGained = Math.floor(100 * rewardMult * slayerGoldMult);
                            coins += goldGained;
                            createFloatingText(aiHead.x * GRID_SIZE, aiHead.y * GRID_SIZE, `+${formatNumber(goldGained)} Gold`, '#ffd700');
                            createFloatingText(aiHead.x * GRID_SIZE, aiHead.y * GRID_SIZE - 20, `+${formatNumber(50 * rewardMult)} XP`, '#00ffff');
                            currentXp += 50 * rewardMult;
                            updateScore(); // تحديث الواجهة فوراً
                            
                            if (ai.isBoss) bossesDiedThisFrame = true;
                        } else {
                            // العدو تضرر فقط (الزعيم)
                            let rewardMult = 5; // مكافأة ضربة
                            score += 500 * rewardMult;
                            let goldGained = Math.floor(100 * rewardMult * slayerGoldMult);
                            coins += goldGained;
                            currentXp += 50 * rewardMult;
                            
                            // تفعيل الحماية والمؤقت
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

        // --- تحديث المقذوفات والتحقق من التصادم ---
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.update();
            // هل المقذوف لمس رأس اللاعب؟ (نستخدم الرأس الحالي)
            const currentHead = snake[0];
            // استخدام المسافة للتصادم بدلاً من التطابق التام، لأن القذيفة سريعة وقد تتجاوز المربع
            const dist = Math.sqrt(Math.pow(p.x - currentHead.x, 2) + Math.pow(p.y - currentHead.y, 2));
            if (dist < 0.8) {
                takeDamage();
                return;
            }
            if (p.life <= 0) projectiles.splice(i, 1);
        }

        // التحقق مما إذا ماتت كل الزعماء لتجديد المؤقت
        if (bossesDiedThisFrame) {
            const remainingBosses = aiSnakes.filter(ai => ai.isBoss && !ai.isDead);
            if (remainingBosses.length === 0) {
                // ماتت كل الرؤوس، إعادة تعيين المؤقت
                bossSpawnTimestamp = Date.now() + 180000; // 3 دقائق
                // إزالة الزعماء الميتين من المصفوفة لتنظيف الذاكرة
                aiSnakes = aiSnakes.filter(ai => !ai.isBoss || !ai.isDead);
            }
        }
    }

    // 3. التحقق من تصادم اللاعب مع الأعداء (اللاعب يصدم العدو)
    // يتم التحقق فقط إذا تحرك اللاعب
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

    // 4. تنفيذ حركة اللاعب وأكل الطعام
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
            let levelMult = Math.pow(2, playerLevel - 1);
            let xpUpgradeMult = (1 + Math.min(upgrades.xpMult, 250) * 0.01);
            let permScoreMult = (1 + (prestigeUpgrades.permScore || 0) * 0.1);
            let permXpMult = (1 + (prestigeUpgrades.permXp || 0) * 0.1);
            let scoreUpgrade = (1 + Math.min(upgrades.scoreMult, 250) * 0.01);
            let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
            let points = (fruit.points * scoreUpgrade) * shopMult * prestigeMult * levelMult * permScoreMult * slayerGoldMult;
            let gold = (fruit.gold * scoreUpgrade) * shopMult * prestigeMult * levelMult * permScoreMult * slayerGoldMult;
            let xpGain = fruit.xp * prestigeMult * xpUpgradeMult * permXpMult;
            score += Math.floor(points);
            let goldGained = Math.floor(gold);
            coins += goldGained;
            if (goldGained > 0) createFloatingText(foods[eatenIndex].x * GRID_SIZE, foods[eatenIndex].y * GRID_SIZE, `+${formatNumber(goldGained)} Gold`, '#ffd700');
            let currentCap = getCurrentLevelCap();
            if (playerLevel < currentCap) {
                let xpGained = Math.floor(xpGain);
                currentXp += xpGained;
                if (xpGained > 0) createFloatingText(foods[eatenIndex].x * GRID_SIZE, foods[eatenIndex].y * GRID_SIZE - 20, `+${formatNumber(xpGained)} XP`, '#00ffff');
                let xpNeeded = Math.floor(100 * Math.pow(1.2, playerLevel - 1));
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
            placeFood();
            
            // زيادة السرعة (للأعداء واللاعب معاً)
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
        
        // منطق التطور الجديد: إعادة تعيين الطول عند الوصول للهدف
        const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
        if (prestigeLevel < thresholds.length) {
            if (snake.length >= thresholds[prestigeLevel]) {
                prestigeLevel++;
                snake = [snake[0]]; // إعادة الثعبان للرأس فقط (Reset)
                playSound('eat');
                updateProgress();
            }
        }
    }
}

function takeDamage() {
    // إذا كان اللاعب في وضع الحماية، لا يتضرر
    if (typeof isPlayerInvulnerable !== 'undefined' && isPlayerInvulnerable) return;

    currentHearts--;
    updateHearts();
    playSound('over'); // Pain sound
    
    if (currentHearts <= 0) {
        gameOver();
    } else {
        // تفعيل الحماية المؤقتة (2 ثانية)
        isPlayerInvulnerable = true;
        playerInvulnerabilityTime = Date.now();
        shakeEndTime = Date.now() + 500; // اهتزاز لمدة نصف ثانية
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
    if (isGameOver || !renderLoopId) return; // إيقاف الحلقة عند الخسارة
    renderLoopId = requestAnimationFrame(runGameLoop);

    // --- تحديث منطق اللعبة بناءً على السرعة ---
    if (!isPaused) {
        if (!lastUpdateTime) lastUpdateTime = timestamp;
        const deltaTime = timestamp - lastUpdateTime;
        lastUpdateTime = timestamp;
        timeSinceLastUpdate += deltaTime;
        timeSinceWorldUpdate += deltaTime;

        // --- إدارة حماية اللاعب ---
        if (typeof isPlayerInvulnerable !== 'undefined' && isPlayerInvulnerable) {
            if (Date.now() - playerInvulnerabilityTime > 2000) { // حماية لمدة 2 ثانية
                isPlayerInvulnerable = false;
            }
        }

        // --- Stamina Logic ---
        const maxStamina = 100 + (slayerUpgrades.maxStamina * 20);
        const regenRate = 0.2 + (slayerUpgrades.staminaRegen * 0.05); // Base 0.2 per frame
        
        // التحقق من تطويرة الطاقة اللانهائية
        if (slayerUpgrades.infiniteStamina > 0) {
            currentStamina = maxStamina;
            isExhausted = false;
            // الجري مسموح دائماً ولا يستهلك طاقة
        } else {
            // الجري يستهلك طاقة ويؤخر الشحن
            if (isSprinting && !isExhausted && currentStamina > 0) {
                currentStamina -= 1; // Drain
                staminaRegenTimestamp = Date.now() + 1000; // كول داون: انتظر ثانية قبل بدء الشحن
                
                if (currentStamina <= 0) {
                    currentStamina = 0;
                    isExhausted = true; // عقوبة: اللاعب مرهق
                }
            } else {
                // الشحن يبدأ فقط بعد انتهاء الكول داون
                if (Date.now() > staminaRegenTimestamp && currentStamina < maxStamina) {
                    currentStamina += regenRate;
                    if (currentStamina > maxStamina) currentStamina = maxStamina;
                }
                
                // إزالة الإرهاق إذا شحن اللاعب 25% من طاقته
                if (isExhausted && currentStamina > (maxStamina * 0.25)) {
                    isExhausted = false;
                }
            }
        }
        updateStaminaBar();

        // --- Speed Logic ---
        let currentSpeed = speed;
        if (isSprinting && !isExhausted && currentStamina > 0) currentSpeed = speed / 2.5; // سرعة مضاعفة بشكل ملحوظ (2.5x)
        
        // سرعة العالم (الأعداء) تبقى ثابتة ولا تتأثر بالجري
        let worldSpeed = speed;

        let movePlayer = false;
        let moveWorld = false;

        if (timeSinceLastUpdate > currentSpeed) {
            movePlayer = true;
            timeSinceLastUpdate -= currentSpeed;
            // منع تراكم الوقت الزائد للاعب
            if (timeSinceLastUpdate > currentSpeed * 2) timeSinceLastUpdate = 0;
        }
        if (timeSinceWorldUpdate > worldSpeed) {
            moveWorld = true;
            timeSinceWorldUpdate -= worldSpeed;
            // منع تراكم الوقت الزائد للأعداء (يمنع القفزات المفاجئة)
            if (timeSinceWorldUpdate > worldSpeed * 2) timeSinceWorldUpdate = 0;
        }

        if (movePlayer || moveWorld) {
            updateSnake(movePlayer, moveWorld);
        }
    } else {
        lastUpdateTime = timestamp; // منع القفزة الزمنية بعد استئناف اللعبة
    }

    // --- الرسم وتحديث الواجهة (يعمل دائماً) ---
    updateParticles();
    updateFloatingTexts();
    draw(); // الرسم الرئيسي
    // تحسين الأداء: تحديث الخريطة المصغرة مرة كل 3 إطارات (20 FPS) بدلاً من 60
    if (frameCount % 3 === 0) drawMinimap();

    // حساب FPS
    frameCount++;
    if (timestamp - lastFpsTime >= 1000) {
        document.getElementById('fpsCounter').innerText = `FPS: ${frameCount}`;
        frameCount = 0;
        lastFpsTime = timestamp;
    }
}

// --- نظام الحفظ القوي ---
function saveGame() {
    // لا تحفظ إذا كانت اللعبة قد انتهت وتم تصفير البيانات مؤقتاً
    if (isGameOver && score === 0 && coins === 0) return;

    try {
        localStorage.setItem('snakeCoins', coins);
        localStorage.setItem('snakePlayerLevel', playerLevel);
        localStorage.setItem('snakeXp', currentXp);
        localStorage.setItem('snakeHighScore', highScore);
        localStorage.setItem('snakeRP', rebirthPoints);
        localStorage.setItem('snakeSouls', souls);
        
        // حفظ الكائنات المعقدة
        localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
        localStorage.setItem('snakePrestigeUpgrades', JSON.stringify(prestigeUpgrades));
        localStorage.setItem('snakeSlayerUpgrades', JSON.stringify(slayerUpgrades));
        
        // حفظ الإعدادات
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

// حفظ البيانات عند إغلاق المتصفح أو تحديث الصفحة
window.addEventListener('beforeunload', () => {
    saveGame();
});

// --- تصدير الدوال للنطاق العام ---
window.resetGameProgress = resetGameProgress;
window.startGame = startGame;
window.saveGame = saveGame;
