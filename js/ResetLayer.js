function openRebirth() {
    menuOverlay.classList.add('hidden');
    rebirthOverlay.classList.remove('hidden');
    renderRebirthShop();
}

function calculateRebirthPoints() {
    if (coins < 10000) return 0;
    let base = Math.floor(Math.sqrt(coins) / 100);
    let slayerRPMult = (1 + (slayerUpgrades.rp1 || 0) * 0.05) * (1 + (slayerUpgrades.rp2 || 0) * 0.10);
    let mult = (1 + (prestigeUpgrades.permRP1 || 0) * 0.05) * (1 + (prestigeUpgrades.permRP2 || 0) * 0.10) * slayerRPMult;
    return Math.floor(base * mult);
}

function performRebirth() {
    let earnedRP = calculateRebirthPoints();
    if (earnedRP <= 0) return;
    showConfirmation(TRANSLATIONS[currentLanguage].confirmRebirth, () => {
        try {
            rebirthPoints += earnedRP;
            coins = 0;
            score = 0;
            playerLevel = 1;
            currentXp = 0;
            prestigeLevel = 0;
            upgrades = { foodCount: 0, scoreMult: 0, doublePoints: 0, xpMult: 0, growthBoost: 0, eatRange: 0, luckBoost: 0 };
            
            // Reset world size
            TILE_COUNT_X = 20 + playerLevel;
            TILE_COUNT_Y = 20 + playerLevel;

            localStorage.setItem('snakeCoins', coins);
            localStorage.setItem('snakePlayerLevel', playerLevel);
            localStorage.setItem('snakeXp', currentXp);
            localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
            localStorage.setItem('snakeRP', rebirthPoints);
            
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
    let cost = Math.floor(10 * Math.pow(1.5, prestigeUpgrades[id]));
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
        let cost = Math.floor(10 * Math.pow(1.5, prestigeUpgrades[id]));
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
    document.getElementById('doRebirthBtn').innerText = t.rebirthBtn.replace('{0}', window.formatNumber(potentialRP));
    document.getElementById('rpShopDisplay').innerText = window.formatNumber(rebirthPoints);
    const items = [
        { id: 'permScore', name: t.permScore, desc: t.permScoreDesc, level: prestigeUpgrades.permScore },
        { id: 'permXp', name: t.permXp, desc: t.permXpDesc, level: prestigeUpgrades.permXp },
        { id: 'permRP1', name: t.permRP1, desc: t.permRP1Desc, level: prestigeUpgrades.permRP1 },
        { id: 'permRP2', name: t.permRP2, desc: t.permRP2Desc, level: prestigeUpgrades.permRP2 },
        { id: 'permSouls1', name: t.permSouls1, desc: t.permSouls1Desc, level: prestigeUpgrades.permSouls1 },
        { id: 'permSouls2', name: t.permSouls2, desc: t.permSouls2Desc, level: prestigeUpgrades.permSouls2 }
    ];
    items.forEach(item => {
        let dynamicInfo = '';
        let bonusVal = '';
        if (item.id === 'permScore') bonusVal = `+${item.level * 10}%`;
        else if (item.id === 'permXp') bonusVal = `+${item.level * 10}%`;
        else if (item.id === 'permRP1') bonusVal = `+${item.level * 5}%`;
        else if (item.id === 'permRP2') bonusVal = `+${item.level * 10}%`;
        else if (item.id === 'permSouls1') bonusVal = `+${item.level * 5}%`;
        else if (item.id === 'permSouls2') bonusVal = `+${item.level * 10}%`;

        if (bonusVal) {
             dynamicInfo = `<br><span style="color: #00ff00; font-weight: bold; font-size: 0.9em;">${t.currentBonus} ${bonusVal}</span>`;
        }

        let cost = Math.floor(10 * Math.pow(1.5, item.level));
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
