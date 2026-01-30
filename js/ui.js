
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('snakeLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    updateTexts();
}

function updateTexts() {
    const t = TRANSLATIONS[currentLanguage];
    document.getElementById('lblScore').innerText = t.score;
    document.getElementById('lblLevel').innerText = t.level;
    document.getElementById('lblGold').innerText = t.gold;
    document.getElementById('lblRP').innerText = t.rp;
    document.getElementById('lblSouls').innerText = t.souls;
    document.getElementById('lblHighScore').innerText = t.highScore;
    document.getElementById('startBtn').innerText = t.play;
    document.getElementById('shopBtn').innerText = t.shop;
    document.getElementById('guideBtn').innerText = t.guide;
    document.getElementById('settingsBtn').innerText = t.settings;
    document.getElementById('resetBtn').innerText = t.reset;
    document.getElementById('rebirthMenuBtn').innerText = t.rebirth;
    document.getElementById('menuInstructions').innerHTML = t.instructions;
    document.getElementById('shopTitle').innerText = t.shopTitle;
    document.getElementById('lblBalance').innerText = t.balance;
    document.getElementById('closeShopBtn').innerText = t.close;
    document.getElementById('rebirthTitle').innerText = t.rebirthTitle;
    document.getElementById('closeRebirthBtn').innerText = t.close;
    document.getElementById('guideTitle').innerText = t.guideTitle;
    document.getElementById('closeGuideBtn').innerText = t.close;
    document.getElementById('settingsTitle').innerText = t.settingsTitle;
    document.getElementById('closeSettingsBtn').innerText = t.close;
    document.getElementById('lblAudioGame').innerText = t.audioGame;
    document.getElementById('lblGraphics').innerText = t.graphics;
    document.getElementById('lblProgress').innerText = t.nextEvo;
    
    const btnCloseSlayer = document.getElementById('closeSlayerShopBtn');
    if (btnCloseSlayer) {
        btnCloseSlayer.innerText = t.close;
    }
    
    updateSettingsButtons();
    updateScore();
    updateProgress();
}

function updateScore() {
    if(document.getElementById('score')) document.getElementById('score').innerText = formatNumber(score);
    if(highScoreElement) highScoreElement.innerText = formatNumber(highScore);
    if(document.getElementById('coinsDisplay')) document.getElementById('coinsDisplay').innerText = formatNumber(coins);
    if(document.getElementById('rpDisplay')) document.getElementById('rpDisplay').innerText = formatNumber(rebirthPoints);
    if(document.getElementById('soulsDisplay')) document.getElementById('soulsDisplay').innerText = formatNumber(souls);
    if(document.getElementById('levelDisplay')) document.getElementById('levelDisplay').innerText = playerLevel;
    updateHearts();
    updateStaminaBar();
    updateProgress();
}

function updateXpBar() {
    let currentCap = getCurrentLevelCap();
    if (playerLevel >= currentCap) {
        const fill = document.getElementById('xpFill');
        if(fill) fill.style.width = `100%`;
        let nextTier = LEVEL_CAPS.find(t => t.limit > currentCap);
        let msg = nextTier ? `CAP REACHED! Need ${formatNumber(nextTier.req)} Score` : `MAX LEVEL REACHED`;
        if(document.getElementById('xpText')) document.getElementById('xpText').innerText = msg;
    } else {
        let xpNeeded = Math.floor(1000 * Math.pow(playerLevel, 2.5));
        let percent = Math.min((currentXp / xpNeeded) * 100, 100);
        const fill = document.getElementById('xpFill');
        if(fill) fill.style.width = `${percent}%`;
        if(document.getElementById('xpText')) document.getElementById('xpText').innerText = `${formatNumber(Math.floor(currentXp))} / ${formatNumber(xpNeeded)}`;
    }
}

function updateProgress() {
    const current = snake.length;
    const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
    
    let max = 0;
    let isMax = false;

    if (prestigeLevel >= thresholds.length) {
        isMax = true;
    } else {
        max = thresholds[prestigeLevel];
    }

    if (isMax) {
        document.getElementById('progressFill').style.width = `100%`;
        document.getElementById('progressText').innerText = `MAX EVOLUTION`;
        document.getElementById('lblProgress').innerText = "Ultimate Snake";
    } else {
        const percent = Math.min((current / max) * 100, 100);
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressText').innerText = `${current} / ${max}`;
    }
}

function updateHearts() {
    const container = document.getElementById('heartsContainer');
    if (!container) return;
    container.innerHTML = '';
    const totalHearts = 1 + slayerUpgrades.maxHearts;
    
    for (let i = 0; i < totalHearts; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart-block';
        const isActive = i < currentHearts;
        heart.style.background = isActive ? 'linear-gradient(135deg, #ff3333, #ff1111)' : 'rgba(30, 30, 30, 0.6)';
        heart.style.boxShadow = isActive ? '0 0 8px #ff3333' : 'none';
        heart.style.borderColor = isActive ? '#ffaaaa' : '#444';
        
        container.appendChild(heart);
    }
}

function updateStaminaBar() {
    const fill = document.getElementById('staminaFill');
    if (fill) {
        const max = 100 + (slayerUpgrades.maxStamina * 20);
        const pct = Math.max(0, Math.min(100, (currentStamina / max) * 100));
        fill.style.width = `${pct}%`;
        
        if (typeof isExhausted !== 'undefined' && isExhausted) fill.style.background = '#777';
        else if (currentStamina < (max * 0.2)) fill.style.background = '#ff0000';
        else fill.style.background = 'linear-gradient(90deg, #ffff00, #ff9800)';
    }
}

function openSettings() {
    menuOverlay.classList.add('hidden');
    settingsOverlay.classList.remove('hidden');
    updateSettingsButtons();
}

function closeSettings() {
    window.hidePanel('settings-overlay');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('snakeSound', soundEnabled);
    updateSettingsButtons();
}

function toggleParticles() {
    particlesEnabled = !particlesEnabled;
    localStorage.setItem('snakeParticles', particlesEnabled);
    updateSettingsButtons();
}

function toggleRange() {
    showEatRange = !showEatRange;
    localStorage.setItem('snakeShowRange', showEatRange);
    updateSettingsButtons();
}

function toggleGlow() {
    glowEnabled = !glowEnabled;
    localStorage.setItem('snakeGlow', glowEnabled);
    updateSettingsButtons();
}

function toggleQuality() {
    lowQualityMode = !lowQualityMode;
    localStorage.setItem('snakeLowQuality', lowQualityMode);
    updateSettingsButtons();
}

function cycleBrightness() {
    brightnessLevel += 0.25;
    if (brightnessLevel > 1.5) brightnessLevel = 0.5;
    brightnessLevel = Math.round(brightnessLevel * 100) / 100;
    localStorage.setItem('snakeBrightness', brightnessLevel);
    updateSettingsButtons();
}

function updateSettingsButtons() {
    const t = TRANSLATIONS[currentLanguage];
    toggleSoundBtn.innerText = soundEnabled ? t.soundOn : t.soundOff;
    toggleParticlesBtn.innerText = particlesEnabled ? t.particlesOn : t.particlesOff;
    if(toggleRangeBtn) toggleRangeBtn.innerText = showEatRange ? t.rangeOn : t.rangeOff;
    if(toggleGlowBtn) toggleGlowBtn.innerText = glowEnabled ? t.glowOn : t.glowOff;
    if(toggleQualityBtn) toggleQualityBtn.innerText = lowQualityMode ? t.qualityLow : t.qualityHigh;
    if(toggleBrightnessBtn) toggleBrightnessBtn.innerText = `${t.brightness} ${Math.round(brightnessLevel * 100)}%`;
}

function openGuide() {
    menuOverlay.classList.add('hidden');
    guideOverlay.classList.remove('hidden');
    renderGuideItems();
}

function closeGuide() {
    window.hidePanel('guide-overlay');
}

function renderGuideItems() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    // Reset styles for Main Menu
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflowY = 'auto';
    
    const t = TRANSLATIONS[currentLanguage];

    const createMenuBtn = (text, color, onClick) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.style.background = color;
        btn.style.width = '100%';
        btn.style.padding = '20px';
        btn.style.fontSize = '20px';
        btn.style.fontWeight = 'bold';
        btn.style.marginBottom = '15px';
        btn.style.borderRadius = '12px';
        btn.style.border = '2px solid rgba(255,255,255,0.2)';
        btn.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'transform 0.2s';
        btn.onmousedown = () => btn.style.transform = 'scale(0.98)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';
        btn.onclick = onClick;
        return btn;
    };

    container.appendChild(createMenuBtn("📈 " + t.tabProgression, 'linear-gradient(45deg, #2196f3, #21cbf3)', renderGuideProgression));
    container.appendChild(createMenuBtn("🔒 " + t.tabCaps, 'linear-gradient(45deg, #ff9800, #ffc107)', renderGuideCaps));
    container.appendChild(createMenuBtn("🍎 " + t.tabFruits, 'linear-gradient(45deg, #ff3366, #ff5252)', renderGuideFruits));
    container.appendChild(createMenuBtn("🐾 " + t.tabPets, 'linear-gradient(45deg, #ff8000, #ffb74d)', renderGuidePets));
    container.appendChild(createMenuBtn("� " + t.tabEvo, 'linear-gradient(45deg, #00ff88, #00b8d4)', renderGuideEvolutions));
    container.appendChild(createMenuBtn("💀 " + t.tabAuras, 'linear-gradient(45deg, #6200ea, #d500f9)', renderGuideAuras));
}

function renderGuideProgression() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = 'block';
    const t = TRANSLATIONS[currentLanguage];
    
    // Back Button
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.width = '100%';
    backBtn.style.padding = '15px';
    backBtn.style.marginBottom = '20px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);

    let prestigeMult = Math.pow(2, prestigeLevel);
    let levelMult = Math.pow(1.5, playerLevel - 1);
    let permGoldMult = (1 + (prestigeUpgrades.permGold1 || 0) * 0.5) * (1 + (prestigeUpgrades.permGold2 || 0) * 4.0);
    let xpUpgradeMult = (1 + Math.min(upgrades.xpMult, 300) * 0.01);

    const div = document.createElement('div');
    div.className = 'shop-item';
    div.style.borderColor = '#00ffff';
    div.style.width = '100%';
    div.style.textAlign = 'left';
    div.style.marginBottom = '15px';
    div.innerHTML = `
        <h3 style="color: #00ffff">${t.playerLevelSection}</h3>
        <p>${t.levelEffect}</p>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;">
        <p>${t.currentLevel} <span style="color: #fff; font-weight: bold;">${playerLevel}</span></p>
        <p>${t.currentMult} <span style="color: #ffd700; font-weight: bold;">x${formatNumber(levelMult * permGoldMult)}</span> (Gold/Score)</p>
        <p>${t.xpMultiplier} <span style="color: #00ff88; font-weight: bold;">x${formatNumber(prestigeMult * xpUpgradeMult)}</span></p>
    `;
    container.appendChild(div);
}

function renderGuideCaps() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    container.style.gap = '15px';

    const t = TRANSLATIONS[currentLanguage];
    
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.gridColumn = '1 / -1';
    backBtn.style.padding = '15px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);

    LEVEL_CAPS.forEach(tier => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        let isUnlocked = false;
        if (tier.type === 'none') isUnlocked = true;
        else if (tier.type === 'score') isUnlocked = (window.highScore || 0) >= tier.req;
        else if (tier.type === 'bossKills') isUnlocked = (window.enemiesKilled || 0) >= tier.req;
        else if (tier.type === 'souls') isUnlocked = (window.souls || 0) >= tier.req;
        else if (tier.type === 'rebirths') isUnlocked = (window.rebirthCount || 0) >= tier.req;

        div.style.borderColor = isUnlocked ? '#00ff00' : '#ff3366';
        div.innerHTML = `
            <h3 style="color: ${isUnlocked ? '#00ff00' : '#ff3366'}">${t.maxLevel} ${tier.limit}</h3>
            <p style="color: #ccc">${t.req}</p>
            <p style="color: #ffd700; font-weight: bold; font-size: 1.1em;">${tier.desc || (formatNumber(tier.req) + ' Score')}</p>
            <p>${isUnlocked ? t.unlocked : t.locked}</p>
        `;
        container.appendChild(div);
    });
}

function renderGuideFruits() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    container.style.gap = '15px';

    const t = TRANSLATIONS[currentLanguage];
    
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.gridColumn = '1 / -1';
    backBtn.style.padding = '15px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);

    const unlockedIndices = [];
    for(let i=0; i<FRUIT_TYPES.length; i++) {
        if(playerLevel >= FRUIT_TYPES[i].reqLevel) {
            unlockedIndices.push(i);
        }
    }
    let totalWeight = 0;
    let levelPenalty = playerLevel * 0.005;
    let decay = Math.max(1.01, 1.2 - (upgrades.luckBoost * 0.02) + levelPenalty);
    const fruitWeights = {};
    unlockedIndices.forEach(i => {
        const w = 100 / Math.pow(decay, i);
        totalWeight += w;
        fruitWeights[i] = w;
    });

    FRUIT_TYPES.forEach((fruit, index) => {
        let isUnlocked = playerLevel >= fruit.reqLevel;
        const name = currentLanguage === 'ar' ? fruit.nameAr : fruit.name;
        let chanceText = "???";
        let chanceColor = "#888";
        
        if (isUnlocked && fruitWeights[index] !== undefined) {
            let p = (fruitWeights[index] / totalWeight) * 100;
            if (p < 0.001) chanceText = p.toExponential(2) + "%";
            else if (p < 1) chanceText = p.toFixed(3) + "%";
            else chanceText = p.toFixed(1) + "%";
            
            if (p >= 20) chanceColor = "#00ff88";
            else if (p >= 5) chanceColor = "#00ffff";
            else if (p >= 1) chanceColor = "#e040fb";
            else chanceColor = "#ffd700";
        }

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = isUnlocked ? fruit.color : '#555';
        div.style.opacity = isUnlocked ? '1' : '0.5';
        div.innerHTML = `
            <h3 style="color: ${fruit.color}">${name} ${!isUnlocked ? t.locked : ''}</h3>
            <div style="width: 20px; height: 20px; background: ${fruit.color}; border-radius: 50%; margin: 10px auto; box-shadow: 0 0 10px ${fruit.glow}"></div>
            <p style="color: ${chanceColor}; font-weight: bold; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">Spawn: ${chanceText}</p>
            <p>Base Score: ${formatNumber(fruit.points)}</p>
            <p>Base Gold: ${formatNumber(fruit.gold)}</p>
        `;
        container.appendChild(div);
    });
}

function renderGuideEvolutions() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    container.style.gap = '15px';

    const t = TRANSLATIONS[currentLanguage];
    
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.gridColumn = '1 / -1';
    backBtn.style.padding = '15px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);

    PRESTIGE_COLORS.forEach((snakeType, index) => {
        let isUnlocked = playerLevel >= snakeType.reqLevel;
        const mult = Math.pow(2, index);
        const snakeName = currentLanguage === 'ar' ? snakeType.nameAr : snakeType.name;
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = isUnlocked ? snakeType.head : '#555';
        div.style.opacity = isUnlocked ? '1' : '0.5';
        div.innerHTML = `
            <h3 style="color: ${snakeType.head}">${snakeName} ${!isUnlocked ? t.locked : ''}</h3>
            ${!isUnlocked ? `<p style="color: #ff3366">${t.levelReq} ${snakeType.reqLevel}</p>` : ''}
            <div style="width: 40px; height: 40px; background: ${snakeType.body}; border: 4px solid ${snakeType.head}; margin: 10px auto;"></div>
            <p>${t.multiplier} x${formatNumber(mult)}</p>
        `;
        container.appendChild(div);
    });
}

function renderGuideAuras() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    container.style.gap = '15px';

    const t = TRANSLATIONS[currentLanguage];
    
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.gridColumn = '1 / -1';
    backBtn.style.padding = '15px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);

    const auras = [
        { kills: 5, color: '#ffffff', name: 'Faint Aura' },
        { kills: 10, color: '#00bfff', name: 'Soft Blue' },
        { kills: 15, color: '#00ff00', name: 'Bright Green' },
        { kills: 20, color: '#ffff00', name: 'Radiant Yellow' },
        { kills: 25, color: '#ff8000', name: 'Blazing Orange' },
        { kills: 30, color: '#ff0000', name: 'Infernal Red' },
        { kills: 35, color: '#9400d3', name: 'Ultimate Purple', ability: t.autoKill }
    ];

    auras.forEach(aura => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = aura.color;
        div.innerHTML = `
            <h3 style="color: ${aura.color}">${aura.name}</h3>
            <p>${t.auraReq} <span style="color: #fff; font-weight: bold;">${aura.kills}</span></p>
            ${aura.ability ? `<p style="color: #e040fb; font-weight: bold; border-top: 1px solid #555; padding-top: 5px;">${t.auraAbility} ${aura.ability}</p>` : ''}
            <div style="width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle, ${aura.color} 0%, transparent 70%); margin: 10px auto; border: 1px solid ${aura.color};"></div>
        `;
        container.appendChild(div);
    });
}

function renderGuidePets() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    container.style.gap = '15px';

    const t = TRANSLATIONS[currentLanguage];
    
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.gridColumn = '1 / -1';
    backBtn.style.padding = '15px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);

    PET_TYPES.forEach(pet => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = pet.color;
        div.innerHTML = `
            <h3 style="color: ${pet.color}">${pet.name}</h3>
            <p style="color: #ccc">${pet.rarity}</p>
            <p>${pet.desc}</p>
            <p>Speed: ${pet.speed} | Intel: ${pet.intel}</p>
        `;
        container.appendChild(div);
    });
}

function openPetMenu() {
    const overlay = document.getElementById('pet-overlay');
    if (overlay) overlay.classList.remove('hidden');
    if (overlay) overlay.style.display = 'flex';
    document.getElementById('menu-overlay').classList.add('hidden');
    updatePetInventoryUI();
}

function closePetMenu() {
    const overlay = document.getElementById('pet-overlay');
    if (overlay) overlay.classList.add('hidden');
    if (overlay) overlay.style.display = 'none';
    document.getElementById('menu-overlay').classList.remove('hidden');
}

function updatePetInventoryUI() {
    const container = document.getElementById('pet-items');
    if (!container) return;
    container.innerHTML = '';
    
    // Grid Layout Configuration
    Object.assign(container.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        padding: '15px',
        width: '100%',
        maxWidth: '500px',
        boxSizing: 'border-box'
    });
    
    const t = TRANSLATIONS[currentLanguage];
    
    const soulsDisplay = document.getElementById('petSoulsDisplay');
    if (soulsDisplay) soulsDisplay.innerText = formatNumber(souls);

    // Gacha Button
    const gachaBtn = document.getElementById('btnPullGacha');
    if (gachaBtn) {
        gachaBtn.innerText = `Summon Pet (1 Soul)`;
    }

    // Prepare Lists: Equipped (Active) vs Inventory
    const equippedPets = activePetIds.map(id => PET_TYPES.find(p => p.id === id)).filter(p => p);
    const inventoryPets = ownedPets
        .filter(id => !activePetIds.includes(id))
        .map(id => PET_TYPES.find(p => p.id === id))
        .filter(p => p);

    const totalSlots = 10; // 2 rows of 5

    for (let i = 0; i < totalSlots; i++) {
        const div = document.createElement('div');
        div.className = 'pet-slot';
        
        // Base Slot Styles
        Object.assign(div.style, {
            aspectRatio: '1',
            borderRadius: '12px',
            border: '2px solid #444',
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s',
            cursor: 'default'
        });

        let pet = null;
        let isEquippedSlot = (i < 2); // First 2 slots are Active Slots

        if (isEquippedSlot) {
            div.style.borderColor = '#00ff88';
            div.style.background = 'rgba(0, 255, 136, 0.1)';
            div.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.1)';
            
            if (i < equippedPets.length) {
                pet = equippedPets[i];
            } else {
                div.innerHTML = `<span style="color: rgba(0,255,136,0.5); font-size: 10px;">Active</span>`;
            }
        } else {
            const invIndex = i - 2;
            if (invIndex < inventoryPets.length) {
                pet = inventoryPets[invIndex];
            }
        }

        if (pet) {
            div.style.cursor = 'pointer';
            div.onclick = () => window.togglePetEquip(pet.id);
            
            // Pet Icon
            const icon = document.createElement('div');
            Object.assign(icon.style, {
                width: '50%',
                height: '50%',
                borderRadius: '8px', // Square shape to match in-game look
                background: `linear-gradient(135deg, ${pet.color}, #111)`, // Gradient fill
                boxShadow: `0 0 15px ${pet.color}`, // Stronger glow
                border: '2px solid #fff',
                marginBottom: '5px'
            });
            div.appendChild(icon);

            // Pet Name
            const name = document.createElement('div');
            name.innerText = pet.name;
            Object.assign(name.style, {
                color: '#fff',
                fontSize: '9px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '90%'
            });
            div.appendChild(name);

            // Checkmark
            if (activePetIds.includes(pet.id)) {
                const check = document.createElement('div');
                check.innerHTML = '✅';
                Object.assign(check.style, {
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    fontSize: '16px',
                    background: '#000',
                    borderRadius: '50%',
                    padding: '2px'
                });
                div.appendChild(check);
            }
        } else if (!isEquippedSlot) {
             div.style.opacity = '0.3';
        }
        
        container.appendChild(div);
    }
}

function pullPetGacha() {
    // Big Number Fix: Check global souls variable directly
    // TESTING: Cost 1 Soul
    if (souls < 1) {
        showNotification(`Not enough souls! Need ${window.formatNumber(1)}`, "error");
        return;
    }
    souls -= 1;
    localStorage.setItem('snakeSouls', souls);
    updateScore(); // Update UI immediately
    
    let rand = Math.random() * 100;
    let cumulative = 0;
    let selected = PET_TYPES[0];
    
    for (let p of PET_TYPES) {
        cumulative += p.chance;
        if (rand <= cumulative) {
            selected = p;
            break;
        }
    }
    
    playGachaAnimation(selected);
}

function playGachaAnimation(winningPet) {
    // 1. Create Overlay
    let overlay = document.getElementById('gacha-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gacha-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.95)', zIndex: '10000', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        });
        document.body.appendChild(overlay);
        
        // Inject Animation Styles
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes gacha-pulse { 0% { transform: scale(1.2); box-shadow: 0 0 20px ${winningPet.color}; } 100% { transform: scale(1.3); box-shadow: 0 0 50px ${winningPet.color}; } }
        `;
        document.head.appendChild(style);
    }
    overlay.innerHTML = '';
    overlay.style.display = 'flex';

    // 2. Track Container
    const trackContainer = document.createElement('div');
    Object.assign(trackContainer.style, {
        width: '100%', height: '220px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(20,20,20,0.8), rgba(0,0,0,0))',
        display: 'flex', alignItems: 'center', borderTop: '1px solid #333', borderBottom: '1px solid #333'
    });

    // 3. Center Marker
    const centerLine = document.createElement('div');
    Object.assign(centerLine.style, {
        position: 'absolute', left: '50%', top: '0', bottom: '0', width: '4px',
        background: 'linear-gradient(to bottom, transparent, #ffd700, transparent)',
        zIndex: '10', transform: 'translateX(-50%)', boxShadow: '0 0 15px #ffd700'
    });

    // 4. Generate Cards
    const cardWidth = 140;
    const gap = 20;
    const totalCards = 40; 
    const winnerIndex = 30; // Winner position
    
    const track = document.createElement('div');
    Object.assign(track.style, {
        display: 'flex', gap: `${gap}px`, paddingLeft: '50vw', // Start from center
        transition: 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)', // Ease out effect
        willChange: 'transform'
    });

    for (let i = 0; i < totalCards; i++) {
        let pet = (i === winnerIndex) ? winningPet : PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
        
        const card = document.createElement('div');
        let borderColor = '#888';
        if (pet.rarity.includes('Rare')) borderColor = '#00bfff';
        if (pet.rarity.includes('Epic')) borderColor = '#ffaa00';
        if (pet.rarity.includes('Legendary')) borderColor = '#9400d3';

        Object.assign(card.style, {
            minWidth: `${cardWidth}px`, height: '180px',
            border: `3px solid ${borderColor}`, borderRadius: '12px',
            background: '#151515', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${borderColor}`, position: 'relative',
            flexShrink: '0'
        });

        card.innerHTML = `
            <div style="width: 80px; height: 80px; border-radius: 50%; background: ${pet.color}; margin-bottom: 15px; box-shadow: 0 0 20px ${pet.color}; border: 2px solid #fff;"></div>
            <div style="color: #fff; font-weight: bold; font-size: 14px; text-align: center;">${pet.name}</div>
            <div style="color: ${borderColor}; font-size: 12px; margin-top: 5px;">${pet.rarity}</div>
        `;
        track.appendChild(card);
    }

    trackContainer.appendChild(centerLine);
    trackContainer.appendChild(track);
    overlay.appendChild(trackContainer);

    // 5. Animation Logic
    // Calculate translate to center the winner
    // Formula: -(winnerIndex * (width + gap)) - (width / 2)
    const itemFullWidth = cardWidth + gap;
    const targetTranslate = -(winnerIndex * itemFullWidth) - (cardWidth / 2);

    // Force Reflow
    void track.offsetWidth;
    
    setTimeout(() => {
        track.style.transform = `translateX(${targetTranslate}px)`;
    }, 50);

    // 6. Reveal & Close
    setTimeout(() => {
        const winningCard = track.children[winnerIndex];
        winningCard.style.animation = 'gacha-pulse 1s infinite alternate';
        winningCard.style.zIndex = '20';
        winningCard.style.background = '#252525';
        
        if (typeof playSound === 'function') playSound('gacha');
        createParticles(window.innerWidth / 2, window.innerHeight / 2, winningPet.color);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Collect & Close";
        Object.assign(closeBtn.style, {
            marginTop: '40px', padding: '12px 30px', fontSize: '20px',
            background: 'linear-gradient(45deg, #00c853, #64dd17)', border: 'none', borderRadius: '8px',
            color: 'white', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(0, 200, 83, 0.5)'
        });
        
        closeBtn.onclick = () => {
            overlay.style.display = 'none';
            if (!ownedPets.includes(winningPet.id)) {
                ownedPets.push(winningPet.id);
                localStorage.setItem('snakeOwnedPets', JSON.stringify(ownedPets));
                showNotification(`🎉 UNLOCKED: ${winningPet.name}!`, "success");
            } else {
                // Duplicate reward
                souls += 200000;
                localStorage.setItem('snakeSouls', souls);
                showNotification(`Duplicate ${winningPet.name}. Refunded 200k Souls.`, "warning");
            }
            updateScore();
            updatePetInventoryUI();
        };
        overlay.appendChild(closeBtn);

    }, 4000); // 4s matches CSS transition time
}


function togglePetEquip(id) {
    const index = activePetIds.indexOf(id);
    if (index > -1) {
        activePetIds.splice(index, 1);
    } else {
        if (activePetIds.length >= 2) {
            activePetIds.shift(); // Remove oldest to make room
        }
        activePetIds.push(id);
    }
    localStorage.setItem('snakeActivePets', JSON.stringify(activePetIds));
    if (window.refreshPets) window.refreshPets();
    updatePetInventoryUI();
}

function showNotification(text, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);
    }

    const notif = document.createElement('div');
    notif.innerHTML = text;
    
    Object.assign(notif.style, {
        padding: '12px 24px',
        borderRadius: '12px',
        color: '#fff',
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        minWidth: '250px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    });

    if (type === 'success') {
        notif.style.background = 'linear-gradient(135deg, rgba(0, 200, 83, 0.9), rgba(0, 150, 36, 0.9))';
    } else if (type === 'error') {
        notif.style.background = 'linear-gradient(135deg, rgba(213, 0, 0, 0.9), rgba(150, 0, 0, 0.9))';
    } else if (type === 'warning') {
        notif.style.background = 'linear-gradient(135deg, rgba(255, 171, 0, 0.9), rgba(255, 140, 0, 0.9))';
        notif.style.color = '#000';
    } else {
        notif.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(25, 118, 210, 0.9))';
    }

    container.appendChild(notif);

    requestAnimationFrame(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notif.parentNode) notif.parentNode.removeChild(notif);
        }, 300);
    }, 2500);
}

function showConfirmation(text, onConfirm) {
    if (document.getElementById('custom-confirm-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: '3000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(5px)',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        padding: '30px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        maxWidth: '90%',
        width: '400px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transform: 'scale(0.8)',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

    const icon = document.createElement('div');
    icon.innerText = '⚠️';
    icon.style.fontSize = '50px';
    icon.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.innerText = text;
    Object.assign(msg.style, {
        color: '#fff',
        fontSize: '18px',
        marginBottom: '30px',
        lineHeight: '1.5',
        fontFamily: "'Segoe UI', sans-serif"
    });

    const btnContainer = document.createElement('div');
    Object.assign(btnContainer.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
    });

    const createBtn = (text, bg, onClick) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '12px 30px',
            border: 'none',
            borderRadius: '12px',
            background: bg,
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'transform 0.1s',
            flex: '1'
        });
        btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';
        btn.onclick = onClick;
        return btn;
    };

    const close = () => {
        overlay.style.opacity = '0';
        box.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    };

    const yesBtn = createBtn('✅ Yes', 'linear-gradient(45deg, #00c853, #64dd17)', () => {
        close();
        if (onConfirm) onConfirm();
    });

    const noBtn = createBtn('❌ No', 'linear-gradient(45deg, #d50000, #ff1744)', () => {
        close();
    });

    btnContainer.appendChild(noBtn);
    btnContainer.appendChild(yesBtn);

    box.appendChild(icon);
    box.appendChild(msg);
    box.appendChild(btnContainer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'scale(1)';
    });
}

function showSaveIndicator() {
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        Object.assign(indicator.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '20px',
            color: '#00ff88',
            fontFamily: 'monospace',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #00ff88',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)',
            transition: 'opacity 0.5s ease'
        });
        document.body.appendChild(indicator);
    }
    indicator.innerHTML = '💾 ' + (TRANSLATIONS[currentLanguage].saving || "Saving...");
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 1500);
}

window.setLanguage = setLanguage;
window.updateTexts = updateTexts;
window.updateScore = updateScore;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.toggleSound = toggleSound;
window.toggleParticles = toggleParticles;
window.toggleRange = toggleRange;
window.toggleGlow = toggleGlow;
window.toggleQuality = toggleQuality;
window.cycleBrightness = cycleBrightness;
window.openGuide = openGuide;
window.closeGuide = closeGuide;
window.showSaveIndicator = showSaveIndicator;
window.showNotification = showNotification;
window.showConfirmation = showConfirmation;
window.openPetMenu = openPetMenu;
window.closePetMenu = closePetMenu;
window.pullPetGacha = pullPetGacha;
window.togglePetEquip = togglePetEquip;
window.updatePetInventoryUI = updatePetInventoryUI;

function debugPetUI() {
    console.group("🐾 Pet UI Debugger");
    
    // DOM Inspector
    const container = document.getElementById('pet-items');
    if (container) {
        console.log(`%c[DOM] Container #pet-items found`, "color: green");
        console.log(`%c[DOM] Child Nodes (Slots): ${container.children.length}`, "color: #00bcd4");
    } else {
        console.log(`%c[DOM] Container #pet-items NOT FOUND`, "color: red");
    }

    // Visibility Check
    const overlay = document.getElementById('pet-overlay');
    if (overlay) {
        const style = window.getComputedStyle(overlay);
        console.log(`%c[CSS] Display: ${style.display}`, "color: orange");
        console.log(`%c[CSS] Z-Index: ${style.zIndex}`, "color: orange");
        console.log(`%c[CSS] Opacity: ${style.opacity}`, "color: orange");
    } else {
        console.log(`%c[CSS] Overlay #pet-overlay NOT FOUND`, "color: red");
    }

    // Data Sync
    console.log(`%c[DATA] Owned Pets:`, "color: yellow", window.ownedPets || []);
    console.log(`%c[DATA] Equipped (Max 2):`, "color: yellow", window.activePetIds || []);

    // Big Number Verification
    const currentSouls = window.souls || 0;
    console.log(`%c[SOULS] Raw: ${currentSouls}`, "color: violet");
    console.log(`%c[SOULS] Formatted: ${window.formatNumber(currentSouls)}`, "color: violet");

    console.groupEnd();
}

function forceShowPetMenu() {
    const overlay = document.getElementById('pet-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.cssText = 'display: flex !important; z-index: 9999 !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 20, 30, 0.98); flex-direction: column; align-items: center; justify-content: center;';
        console.log("%c[FORCE] Pet Menu Forced Visible", "color: lime; font-weight: bold;");
        if (typeof window.updatePetInventoryUI === 'function') window.updatePetInventoryUI();
    }
}

window.debugPetUI = debugPetUI;
window.forceShowPetMenu = forceShowPetMenu;
