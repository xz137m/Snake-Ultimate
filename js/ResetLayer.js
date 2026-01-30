function openRebirth() {
    menuOverlay.classList.add('hidden');
    rebirthOverlay.classList.remove('hidden');
    renderRebirthShop();
}

function calculateRebirthPoints() {
    if (coins < 1e15) return 0;
    // Formula: sqrt(Gold / 1e15)
    let base = Math.floor(Math.sqrt(coins / 1e15));
    let slayerRPMult = (1 + (slayerUpgrades.rp1 || 0) * 0.05) * (1 + (slayerUpgrades.rp2 || 0) * 0.10);
    let mult = (1 + (prestigeUpgrades.permRP1 || 0) * 0.5) * (1 + (prestigeUpgrades.permRP2 || 0) * 4.0) * slayerRPMult;
    return Math.floor(base * mult);
}

function performRebirth() {
    const t = TRANSLATIONS[currentLanguage];
    const requiredLevel = 25;
    const requiredGold = 1e9 * Math.pow(10, rebirthCount);

    if (playerLevel < requiredLevel) {
        showNotification(t.rebirthLevelReq.replace('{0}', requiredLevel), 'error');
        return;
    }

    if (coins < requiredGold) {
        showNotification(t.rebirthGoldReq.replace('{0}', formatNumber(requiredGold)), 'error');
        return;
    }

    let earnedRP = calculateRebirthPoints();
    if (earnedRP <= 0) {
        showNotification(`You need at least ${formatNumber(1e15)} Gold to gain Rebirth Points!`, 'warning');
        return;
    }

    showConfirmation(TRANSLATIONS[currentLanguage].confirmRebirth, () => {
        try {
            rebirthPoints += earnedRP;
            rebirthCount++;
            coins = 0;
            score = 0;
            playerLevel = 1;
            currentXp = 0;
            prestigeLevel = 0;
            upgrades = { foodCount: 0, scoreMult: 0, doublePoints: 0, xpMult: 0, growthBoost: 0, eatRange: 0, luckBoost: 0, soulsMult: 0, soulsExp: 0 };
            
            // Reset world size
            TILE_COUNT_X = 20 + playerLevel;
            TILE_COUNT_Y = 20 + playerLevel;

            localStorage.setItem('snakeCoins', coins);
            localStorage.setItem('snakePlayerLevel', playerLevel);
            localStorage.setItem('snakeXp', currentXp);
            localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
            localStorage.setItem('snakeRP', rebirthPoints);
            localStorage.setItem('snakeRebirthCount', rebirthCount);
            
            if (typeof updateScore === 'function') updateScore();
            renderRebirthShop();
            if (typeof playSound === 'function') playSound('over');
        } catch (e) {
            console.error("Rebirth Error:", e);
        } finally {
            window.hidePanel('rebirth-overlay');
        }
    });
}

function buyPrestigeUpgrade(id) {
    let baseCost = 10;
    let scale = 1.2;
    
    // Power Upgrades (Type 2) have higher cost and scaling
    if (id.endsWith('2')) {
        baseCost = 1000;
        scale = 1.8;
    }

    let cost = Math.floor(baseCost * Math.pow(scale, prestigeUpgrades[id]));
    if (rebirthPoints >= cost) {
        rebirthPoints -= cost;
        prestigeUpgrades[id]++;
        localStorage.setItem('snakeRP', rebirthPoints);
        localStorage.setItem('snakePrestigeUpgrades', JSON.stringify(prestigeUpgrades));
        updateScore();
        renderRebirthShop();
        playSound('eat');
        showNotification(`🌀 Prestige Upgrade Acquired!`, 'success');
    }
}

function buyMaxPrestigeUpgrade(id) {
    let bought = 0;
    while(true) {
        let baseCost = 10;
        let scale = 1.2;
        
        // Power Upgrades (Type 2) have higher cost and scaling
        if (id.endsWith('2')) {
            baseCost = 1000;
            scale = 1.8;
        }

        let cost = Math.floor(baseCost * Math.pow(scale, prestigeUpgrades[id]));
        if (rebirthPoints >= cost) {
            rebirthPoints -= cost;
            prestigeUpgrades[id]++;
            bought++;
        } else {
            break;
        }
    }
    if (bought > 0) {
        localStorage.setItem('snakeRP', rebirthPoints);
        localStorage.setItem('snakePrestigeUpgrades', JSON.stringify(prestigeUpgrades));
        updateScore();
        renderRebirthShop();
        playSound('eat');
        showNotification(`🌀 Max Upgrades Purchased!`, 'success');
    }
}

function renderRebirthShop() {
    const container = document.getElementById('rebirth-items');
    container.innerHTML = '';
    const t = TRANSLATIONS[currentLanguage];
    let potentialRP = calculateRebirthPoints();
    const rebirthBtn = document.getElementById('doRebirthBtn');
    rebirthBtn.innerText = t.rebirthBtn.replace('{0}', window.formatNumber(potentialRP));
    document.getElementById('rpShopDisplay').innerText = window.formatNumber(rebirthPoints);

    const oldReq = document.getElementById('rebirth-req-text');
    if (oldReq) oldReq.remove();

    const requiredLevel = 25;
    const requiredGold = 1e9 * Math.pow(10, rebirthCount);
    const reqText = document.createElement('p');
    reqText.id = 'rebirth-req-text';
    reqText.style.color = '#ccc';
    reqText.style.marginTop = '10px';
    reqText.innerHTML = `Requires: Level ${requiredLevel} & <span style="color: #ffd700;">${formatNumber(requiredGold)} Gold</span>`;
    rebirthBtn.after(reqText);

    const items = [
        { id: 'permGold1', name: t.permGold1, desc: t.permGold1Desc, level: prestigeUpgrades.permGold1 },
        { id: 'permGold2', name: t.permGold2, desc: t.permGold2Desc, level: prestigeUpgrades.permGold2 },
        { id: 'permRP1', name: t.permRP1, desc: t.permRP1Desc, level: prestigeUpgrades.permRP1 },
        { id: 'permRP2', name: t.permRP2, desc: t.permRP2Desc, level: prestigeUpgrades.permRP2 },
        { id: 'permSouls1', name: t.permSouls1, desc: t.permSouls1Desc, level: prestigeUpgrades.permSouls1 },
        { id: 'permSouls2', name: t.permSouls2, desc: t.permSouls2Desc, level: prestigeUpgrades.permSouls2 },
        { id: 'permXp', name: t.permXp, desc: t.permXpDesc, level: prestigeUpgrades.permXp }
    ];
    items.forEach(item => {
        const getBonus = (id, lvl) => {
            if (id === 'permGold1') return `x${window.formatNumber(1 + lvl * 0.5)}`;
            if (id === 'permGold2') return `x${window.formatNumber(1 + lvl * 4.0)}`;
            if (id === 'permRP1') return `x${window.formatNumber(1 + lvl * 0.5)}`;
            if (id === 'permRP2') return `x${window.formatNumber(1 + lvl * 4.0)}`;
            if (id === 'permSouls1') return `x${window.formatNumber(1 + lvl * 0.5)}`;
            if (id === 'permSouls2') return `x${window.formatNumber(1 + lvl * 4.0)}`;
            if (id === 'permXp') return `+${lvl * 10}%`;
            return '';
        };

        let currentBonus = getBonus(item.id, item.level);
        let nextBonus = getBonus(item.id, item.level + 1);

        let dynamicInfo = `<br><span style="color: #00ff00; font-weight: bold; font-size: 0.9em;">Current: ${currentBonus}</span>`;
        dynamicInfo += `<br><span style="color: #00ffff; font-weight: bold; font-size: 0.9em;">Next: ${nextBonus}</span>`;

        let baseCost = 10;
        let scale = 1.2;
        if (item.id.endsWith('2')) {
            baseCost = 1000;
            scale = 1.8;
        }

        let cost = Math.floor(baseCost * Math.pow(scale, item.level));
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = '#e040fb';
        div.innerHTML = `
            <h3 style="color: #e040fb">${item.name}</h3>
            <p>${item.desc}${dynamicInfo}</p>
            <p>Lvl: ${item.level}</p>
            <div class="shop-buttons">
                <button onclick="window.buyPrestigeUpgrade('${item.id}')" ${rebirthPoints < cost ? 'disabled style="opacity:0.5"' : ''}>
                    ${t.buy} (${window.formatNumber(cost)} RP)
                </button>
                <button class="btn-max" onclick="window.buyMaxPrestigeUpgrade('${item.id}')" ${rebirthPoints < cost ? 'disabled style="opacity:0.5"' : ''}>
                    MAX
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// تصدير الدوال للنطاق العام
window.openRebirth = openRebirth;
window.performRebirth = performRebirth;
window.buyPrestigeUpgrade = buyPrestigeUpgrade;
window.buyMaxPrestigeUpgrade = buyMaxPrestigeUpgrade;
