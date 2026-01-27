function resetGameProgress() {
    if(confirm(TRANSLATIONS[currentLanguage].confirmReset)) {
        localStorage.clear();
        location.reload();
    }
}

function initGame() {
    snake = [{ x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) }];
    particles = [];
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
    const foodCount = 3 + upgrades.foodCount;
    for(let i=0; i<foodCount; i++) {
        placeFood();
    }
    updateScore();
    updateProgress();
    updateXpBar();
    updateKillCounter();
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
    renderLoopId = requestAnimationFrame(runGameLoop);
}

function gameOver() {
    cancelAnimationFrame(renderLoopId);
    renderLoopId = null; // منع استئناف اللعبة
    isGameOver = true;
    playSound('over');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.innerText = formatNumber(highScore);
    }
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

function updateSnake() {
    velocity = { ...nextVelocity };
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };
    if (head.x < 0) head.x = TILE_COUNT_X - 1;
    if (head.x >= TILE_COUNT_X) head.x = 0;
    if (head.y < 0) head.y = TILE_COUNT_Y - 1;
    if (head.y >= TILE_COUNT_Y) head.y = 0;
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

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
    // نحسب فقط الأعداء العاديين (ليس الزعماء)
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

        // 1. هل اصطدم رأس اللاعب بجسم العدو؟
        for (let part of ai.body) {
            if (head.x === part.x && head.y === part.y) {
                gameOver();
                return;
            }
        }

        // 2. هل اصطدم رأس العدو بجسم اللاعب؟ (يموت العدو)
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
                         updateKillCounter();
                         
                         // مكافآت القتل
                         let rewardMult = ai.isBoss ? 25 : 1; // الزعيم يعطي مكافأة قتل ضخمة
                         score += 500 * rewardMult;
                         coins += 100 * rewardMult;
                         currentXp += 50 * rewardMult;
                         
                         if (ai.isBoss) bossesDiedThisFrame = true;
                     } else {
                         // العدو تضرر فقط (الزعيم)
                         let rewardMult = 5; // مكافأة ضربة
                         score += 500 * rewardMult;
                         coins += 100 * rewardMult;
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
        // هل المقذوف لمس رأس اللاعب؟
        if (Math.floor(p.x) === head.x && Math.floor(p.y) === head.y) {
            gameOver();
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
    // ---------------------

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
        let shopMult = (1 + Math.min(upgrades.doublePoints, 300) * 0.01);
        let levelMult = Math.pow(2, playerLevel - 1);
        let xpUpgradeMult = (1 + Math.min(upgrades.xpMult, 300) * 0.01);
        let permScoreMult = (1 + (prestigeUpgrades.permScore || 0) * 0.1);
        let permXpMult = (1 + (prestigeUpgrades.permXp || 0) * 0.1);
        let scoreUpgrade = (1 + Math.min(upgrades.scoreMult, 300) * 0.01);
        let points = (fruit.points * scoreUpgrade) * shopMult * prestigeMult * levelMult * permScoreMult;
        let gold = (fruit.gold * scoreUpgrade) * shopMult * prestigeMult * levelMult * permScoreMult;
        let xpGain = fruit.xp * prestigeMult * xpUpgradeMult * permXpMult;
        score += Math.floor(points);
        coins += Math.floor(gold);
        let currentCap = getCurrentLevelCap();
        if (playerLevel < currentCap) {
            currentXp += Math.floor(xpGain);
            let xpNeeded = Math.floor(100 * Math.pow(1.2, playerLevel - 1));
            if (currentXp >= xpNeeded) {
                currentXp -= xpNeeded;
                playerLevel++;
                TILE_COUNT_X = 20 + (playerLevel * 2);
                TILE_COUNT_Y = 20 + (playerLevel * 2);
                playSound('eat');
            }
        }
        localStorage.setItem('snakePlayerLevel', playerLevel);
        localStorage.setItem('snakeXp', currentXp);
        localStorage.setItem('snakeCoins', coins);
        updateScore();
        updateXpBar();
        updateProgress();
        growthBuffer += (fruit.growth + upgrades.growthBoost - 1);
        playSound('eat');
        createParticles(foods[eatenIndex].x * GRID_SIZE + GRID_SIZE/2, foods[eatenIndex].y * GRID_SIZE + GRID_SIZE/2, fruit.color);
        foods.splice(eatenIndex, 1);
        placeFood();
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

        if (timeSinceLastUpdate > speed) {
            updateSnake();
            timeSinceLastUpdate = 0;
        }
    } else {
        lastUpdateTime = timestamp; // منع القفزة الزمنية بعد استئناف اللعبة
    }

    // --- الرسم وتحديث الواجهة (يعمل دائماً) ---
    updateParticles();
    draw(); // الرسم الرئيسي
    drawMinimap(); // رسم الخريطة

    // حساب FPS
    frameCount++;
    if (timestamp - lastFpsTime >= 1000) {
        document.getElementById('fpsCounter').innerText = `FPS: ${frameCount}`;
        frameCount = 0;
        lastFpsTime = timestamp;
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateCamera() {
    if (snake.length === 0) return;
    const head = snake[0];
    const targetX = head.x * GRID_SIZE - canvas.width / 2 + GRID_SIZE / 2;
    const targetY = head.y * GRID_SIZE - canvas.height / 2 + GRID_SIZE / 2;
    camera.x = targetX;
    camera.y = targetY;
}

function draw() {
    // حماية ضد الشاشة السوداء: التأكد من وجود سياق الرسم
    if (!ctx || !canvas) return;

    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightnessLevel})`;
    updateCamera();
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const startX = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endX = startX + canvas.width + GRID_SIZE * 2;
    const startY = Math.floor(camera.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endY = startY + canvas.height + GRID_SIZE * 2;
    for (let x = startX; x <= endX; x += GRID_SIZE) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += GRID_SIZE) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    if (showEatRange && upgrades.eatRange > 0 && snake.length > 0) {
        const head = snake[0];
        const range = upgrades.eatRange;
        let rx, ry, rw, rh;
        if (velocity.x === 1) { rx = (head.x + 1) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE; rw = range * GRID_SIZE; rh = (range * 2 + 1) * GRID_SIZE; }
        else if (velocity.x === -1) { rx = (head.x - range) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE; rw = range * GRID_SIZE; rh = (range * 2 + 1) * GRID_SIZE; }
        else if (velocity.y === 1) { rx = (head.x - range) * GRID_SIZE; ry = (head.y + 1) * GRID_SIZE; rw = (range * 2 + 1) * GRID_SIZE; rh = range * GRID_SIZE; }
        else if (velocity.y === -1) { rx = (head.x - range) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE; rw = (range * 2 + 1) * GRID_SIZE; rh = range * GRID_SIZE; }
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
    }
    foods.forEach(f => {
        const type = FRUIT_TYPES[f.type];
        ctx.fillStyle = type.color;
        ctx.shadowColor = glowEnabled ? type.glow : 'transparent';
        ctx.shadowBlur = glowEnabled ? 15 : 0;
        ctx.beginPath();
        ctx.arc(f.x * GRID_SIZE + GRID_SIZE/2, f.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    // رسم المقذوفات
    projectiles.forEach(p => {
        p.draw(ctx);
    });
    ctx.globalAlpha = 1.0;
    const unlockedColors = PRESTIGE_COLORS.filter(c => playerLevel >= c.reqLevel);
    // تثبيت اللون عند الوصول لآخر تطور بدلاً من التكرار
    let colorIndex = prestigeLevel;
    if (colorIndex >= unlockedColors.length) {
        colorIndex = unlockedColors.length - 1;
    }
    const currentColors = unlockedColors[colorIndex];
    snake.forEach((part, index) => {
        const x = part.x * GRID_SIZE;
        const y = part.y * GRID_SIZE;
        if (index === 0) {
            ctx.fillStyle = currentColors.head;
            ctx.shadowColor = glowEnabled ? currentColors.head : 'transparent';
            ctx.shadowBlur = glowEnabled ? 10 : 0;
            ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'black';
            const eyeSize = 4;
            if (velocity.x === 1) { ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize); ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize); }
            else if (velocity.x === -1) { ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize); ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize); }
            else if (velocity.y === -1) { ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize); ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize); }
            else { ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize); ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize); }
        } else {
            ctx.fillStyle = currentColors.body;
            ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    });

    // رسم الأعداء (AI Snakes)
    aiSnakes.forEach(ai => {
        ai.draw(ctx);
    });

    ctx.restore();
    ctx.filter = 'none';
    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(TRANSLATIONS[currentLanguage].paused, canvas.width / 2, canvas.height / 2);
    }
}

function drawMinimap() {
    if (!minimapCtx || !minimapCanvas) return;
    
    // مسح الخريطة القديمة
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // حساب نسبة التصغير بناءً على حجم الخريطة الحالي
    const scaleX = minimapCanvas.width / TILE_COUNT_X;
    const scaleY = minimapCanvas.height / TILE_COUNT_Y;

    // رسم الطعام (نقاط ملونة)
    foods.forEach(f => {
        const type = FRUIT_TYPES[f.type];
        minimapCtx.fillStyle = type.color;
        // رسم نقطة بحجم لا يقل عن 2 بكسل لتكون واضحة
        minimapCtx.fillRect(f.x * scaleX, f.y * scaleY, Math.max(scaleX, 3), Math.max(scaleY, 3));
    });

    // رسم الثعبان
    minimapCtx.fillStyle = '#00ff88'; // لون موحد للثعبان في الخريطة للوضوح
    snake.forEach(p => {
        minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(scaleX, 2), Math.max(scaleY, 2));
    });

    // رسم الأعداء في الخريطة المصغرة (باللون الأحمر)
    minimapCtx.fillStyle = '#ff3333';
    aiSnakes.forEach(ai => {
        ai.body.forEach(p => {
            minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(scaleX, 2), Math.max(scaleY, 2));
        });
    });

    // رسم المقذوفات في الخريطة
    minimapCtx.fillStyle = '#ab47bc';
    projectiles.forEach(p => {
        minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, 2, 2);
    });

    // رسم سهم الاتجاه عند الرأس
    if (snake.length > 0) {
        const head = snake[0];
        // حساب مركز الرأس في الخريطة المصغرة
        const cx = head.x * scaleX + (Math.max(scaleX, 2) / 2);
        const cy = head.y * scaleY + (Math.max(scaleY, 2) / 2);
        const size = 4; // حجم السهم

        minimapCtx.fillStyle = '#ffffff';
        minimapCtx.beginPath();
        if (velocity.x === 1) { // يمين
            minimapCtx.moveTo(cx - size, cy - size);
            minimapCtx.lineTo(cx + size, cy);
            minimapCtx.lineTo(cx - size, cy + size);
        } else if (velocity.x === -1) { // يسار
            minimapCtx.moveTo(cx + size, cy - size);
            minimapCtx.lineTo(cx - size, cy);
            minimapCtx.lineTo(cx + size, cy + size);
        } else if (velocity.y === 1) { // تحت
            minimapCtx.moveTo(cx - size, cy - size);
            minimapCtx.lineTo(cx, cy + size);
            minimapCtx.lineTo(cx + size, cy - size);
        } else if (velocity.y === -1) { // فوق
            minimapCtx.moveTo(cx - size, cy + size);
            minimapCtx.lineTo(cx, cy - size);
            minimapCtx.lineTo(cx + size, cy + size);
        }
        minimapCtx.fill();
    }

}

function handleKeyPress(e) {
    if (e.repeat) return;
    switch(e.code) {
        case 'ArrowUp': case 'KeyW': if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 'KeyS': if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'KeyA': if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'KeyD': if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 }; break;
        case 'Space': if (!isGameOver) isPaused = !isPaused; break;
    }
}

function handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
        else if (diffX < 0 && velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
    } else {
        if (diffY > 0 && velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
        else if (diffY < 0 && velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
    }
}
