function openRebirth() {
    menuOverlay.classList.add('hidden');
    rebirthOverlay.classList.remove('hidden');
    renderRebirthShop();
}

function calculateRebirthPoints() {
    if (coins < 10000) return 0;
    return Math.floor(Math.sqrt(coins) / 100);
}

function performRebirth() {
    let earnedRP = calculateRebirthPoints();
    if (earnedRP <= 0) return;
    if (confirm(TRANSLATIONS[currentLanguage].confirmRebirth)) {
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
    }
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
        { id: 'permXp', name: t.permXp, desc: t.permXpDesc, level: prestigeUpgrades.permXp }
    ];
    items.forEach(item => {
        let dynamicInfo = '';
        let bonusVal = '';
        if (item.id === 'permScore') bonusVal = `+${item.level * 10}%`;
        else if (item.id === 'permXp') bonusVal = `+${item.level * 10}%`;

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
            <button onclick="window.buyPrestigeUpgrade('${item.id}')" ${rebirthPoints < cost ? 'disabled style="opacity:0.5"' : ''}>
                ${t.buy} (${window.formatNumber(cost)} RP)
            </button>
        `;
        container.appendChild(div);
    });
}

// تصدير الدوال للنطاق العام
window.openRebirth = openRebirth;
window.performRebirth = performRebirth;
window.buyPrestigeUpgrade = buyPrestigeUpgrade;
