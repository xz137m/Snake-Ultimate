function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 1000) return Math.floor(num).toString();
    
    const suffixes = [
        "", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De", 
        "UnD", "DoD", "TrD", "QaD", "QiD", "SxD", "SpD", "OcD", "NoD", 
        "Vg", "UnVg", "DoVg", "TrVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
        "Tg"
    ];
    
    const tier = Math.floor(Math.log10(num) / 3);
    
    if (tier <= 0) return Math.floor(num).toString();
    if (tier >= suffixes.length) return num.toExponential(2);
    
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    
    return scaled.toFixed(2) + (suffix ? " " + suffix : "");
}

function getCurrentLevelCap() {
    if (typeof LEVEL_CAPS === 'undefined') return 15;
    let cap = 15;
    
    for (let i = 0; i < LEVEL_CAPS.length; i++) {
        let tier = LEVEL_CAPS[i];
        let met = false;
        
        if (tier.type === 'none') met = true;
        else if (tier.type === 'score') met = (window.highScore || 0) >= tier.req;
        else if (tier.type === 'bossKills') met = (window.enemiesKilled || 0) >= tier.req;
        else if (tier.type === 'souls') met = (window.souls || 0) >= tier.req;
        else if (tier.type === 'rebirths') met = (window.rebirthCount || 0) >= tier.req;
        
        if (met) {
            cap = tier.limit;
        } else {
            break;
        }
    }
    return cap;
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === 'eat') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'over') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'gacha') {
            // Magical Reveal Sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);
            osc.frequency.linearRampToValueAtTime(1000, now + 0.4);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) {
        console.error("Audio Error:", e);
    }
}

function createParticles(x, y, color) {
    if (typeof particles === 'undefined') return;
    if (!particlesEnabled) return;
    
    // Optimization: Limit total particles to 40
    if (particles.length > 40) {
        particles.splice(0, particles.length - 40 + 5);
    }

    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color
        });
    }
}

function getUpgradeCost(baseCost, currentLevel, id) {
    if (typeof STATIC_COSTS === 'undefined') return baseCost;
    if (STATIC_COSTS[id]) {
        return STATIC_COSTS[id][currentLevel] || Infinity;
    }
    return Math.floor(baseCost * Math.pow(1.3, currentLevel));
}

function getEvolutionStage(length) {
    const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
    for (let i = 0; i < thresholds.length; i++) {
        if (length < thresholds[i]) {
            return i;
        }
    }
    return thresholds.length; // يرجع أقصى مرحلة ولا يعود للصفر
}

// --- دالة عامة لإخفاء اللوحات ---
function hidePanel(id) {
    const panel = document.getElementById(id);
    const menu = document.getElementById('menu-overlay');
    if (panel) panel.classList.add('hidden');
    if (menu) menu.classList.remove('hidden');
}

// --- تصدير الدوال للنطاق العام (Global Scope) ---
window.formatNumber = formatNumber;
window.getCurrentLevelCap = getCurrentLevelCap;
window.playSound = playSound;
window.createParticles = createParticles;
window.getUpgradeCost = getUpgradeCost;
window.getEvolutionStage = getEvolutionStage;
window.hidePanel = hidePanel;

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
window.getSafeSpawnPoint = getSafeSpawnPoint;

// Cache for reward multipliers to avoid heavy math every frame
let rewardCache = {
    key: '',
    mults: null
};

function givePlayerRewards(fruitTypeIndex, x, y) {
    let fruit = FRUIT_TYPES[fruitTypeIndex];
    
    // Generate cache key based on stats that affect multipliers
    const cacheKey = `${playerLevel}-${prestigeLevel}-${upgrades.scoreMult}-${upgrades.doublePoints}-${upgrades.xpMult}-${prestigeUpgrades.permGold1}-${prestigeUpgrades.permGold2}-${slayerUpgrades.gold1}`;
    
    if (rewardCache.key !== cacheKey || !rewardCache.mults) {
        let prestigeMult = Math.pow(2, prestigeLevel);
        let dpLvl = upgrades.doublePoints;
        let shopMult = (dpLvl === 0) ? 1 : dpLvl * Math.pow(2, Math.floor(dpLvl / 10));
        let levelMult = Math.pow(1.5, playerLevel - 1);
        let xpUpgradeMult = 1 + Math.log10(1 + upgrades.xpMult) * 0.5;
        let permGoldMult = (1 + (prestigeUpgrades.permGold1 || 0) * 0.5) * (1 + (prestigeUpgrades.permGold2 || 0) * 4.0);
        let permXpMult = (1 + (prestigeUpgrades.permXp || 0) * 0.1);
        let scoreUpgrade = 1 + Math.log10(1 + upgrades.scoreMult) * 0.5;
        let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
        
        rewardCache.mults = {
            goldScore: scoreUpgrade * shopMult * prestigeMult * levelMult * permGoldMult * slayerGoldMult,
            xp: prestigeMult * xpUpgradeMult * permXpMult
        };
        rewardCache.key = cacheKey;
    }
    
    let points = fruit.points * rewardCache.mults.goldScore;
    let gold = fruit.gold * rewardCache.mults.goldScore;
    
    // Diminishing XP & Time Scaling
    let levelDiff = Math.max(0, playerLevel - fruit.reqLevel);
    let dimFactor = 1 / (1 + levelDiff * 0.15);
    let sessionMinutes = (Date.now() - sessionStartTime) / 60000;
    let timeFactor = Math.max(0.1, 1 - (sessionMinutes * 0.002));

    let xpGain = fruit.xp * rewardCache.mults.xp * dimFactor * timeFactor;

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
window.givePlayerRewards = givePlayerRewards;

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
window.togglePause = togglePause;
