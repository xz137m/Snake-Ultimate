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
    container.appendChild(createMenuBtn("🐍 " + t.tabEvo, 'linear-gradient(45deg, #00ff88, #00b8d4)', renderGuideEvolutions));
    container.appendChild(createMenuBtn("💀 " + t.tabAuras, 'linear-gradient(45deg, #6200ea, #d500f9)', renderGuideAuras));
}

function setupGuidePage(grid = false) {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    container.style.display = grid ? 'grid' : 'block';
    if (grid) {
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        container.style.gap = '15px';
    }
    const t = TRANSLATIONS[currentLanguage];
    const backBtn = document.createElement('button');
    backBtn.innerText = t.back;
    backBtn.style.background = '#444';
    backBtn.style.width = grid ? 'auto' : '100%';
    if (grid) backBtn.style.gridColumn = '1 / -1';
    backBtn.style.padding = '15px';
    backBtn.onclick = renderGuideItems;
    container.appendChild(backBtn);
    return container;
}

function renderGuideProgression() {
    const container = setupGuidePage(false);
    const t = TRANSLATIONS[currentLanguage];
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
        <p>${t.currentLevel} <span style="color: #fff; font-weight: bold;"></span></p>
        <p>${t.currentMult} <span style="color: #ffd700; font-weight: bold;">x${formatNumber(levelMult * permGoldMult)}</span> (Gold/Score)</p>
        <p>${t.xpMultiplier} <span style="color: #00ff88; font-weight: bold;">x${formatNumber(prestigeMult * xpUpgradeMult)}</span></p>
    `;
    container.appendChild(div);
}

function renderGuideCaps() {
    const container = setupGuidePage(true);
    const t = TRANSLATIONS[currentLanguage];

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
    const container = setupGuidePage(true);
    const t = TRANSLATIONS[currentLanguage];

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
            <h3 style="color: ${fruit.color}"> ${!isUnlocked ? t.locked : ''}</h3>
            <div style="width: 20px; height: 20px; background: ${fruit.color}; border-radius: 50%; margin: 10px auto; box-shadow: 0 0 10px ${fruit.glow}"></div>
            <p style="color: ; font-weight: bold; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">${t.spawnChance} <span style="color: ${chanceColor}">${chanceText}</span></p>
            <p>${t.baseScore} ${formatNumber(fruit.points)}</p>
            <p>${t.baseGold} ${formatNumber(fruit.gold)}</p>
        `;
        container.appendChild(div);
    });
}

function renderGuideEvolutions() {
    const container = setupGuidePage(true);
    const t = TRANSLATIONS[currentLanguage];

    PRESTIGE_COLORS.forEach((snakeType, index) => {
        let isUnlocked = playerLevel >= snakeType.reqLevel;
        const mult = Math.pow(2, index);
        const snakeName = currentLanguage === 'ar' ? snakeType.nameAr : snakeType.name;
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = isUnlocked ? snakeType.head : '#555';
        div.style.opacity = isUnlocked ? '1' : '0.5';
        div.innerHTML = `
            <h3 style="color: ${snakeType.head}"> ${!isUnlocked ? t.locked : ''}</h3>
            ${!isUnlocked ? `<p style="color: #ff3366">${t.levelReq} ${snakeType.reqLevel}</p>` : ''}
            <div style="width: 40px; height: 40px; background: ${snakeType.body}; border: 4px solid ${snakeType.head}; margin: 10px auto;"></div>
            <p>${t.multiplier} x${formatNumber(mult)}</p>
        `;
        container.appendChild(div);
    });
}

function renderGuideAuras() {
    const container = setupGuidePage(true);
    const t = TRANSLATIONS[currentLanguage];

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
    const container = setupGuidePage(true);
    const t = TRANSLATIONS[currentLanguage];

    PET_TYPES.forEach(pet => {
        const name = currentLanguage === 'ar' ? pet.nameAr : pet.name;
        const rarity = currentLanguage === 'ar' ? pet.rarityAr : pet.rarity;
        const desc = currentLanguage === 'ar' ? pet.descAr : pet.desc;

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = pet.color;
        div.innerHTML = `
            <h3 style="color: ${pet.color}">${name}</h3>
            <p style="color: #ccc">${rarity}</p>
            <p>${desc}</p>
            <p>${t.speed} ${pet.speed} | ${t.intel} ${pet.intel}</p>
        `;
        container.appendChild(div);
    });
}

window.openGuide = openGuide;
window.closeGuide = closeGuide;
