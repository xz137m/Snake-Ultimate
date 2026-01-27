function openShop() {
    menuOverlay.classList.add('hidden');
    shopOverlay.classList.remove('hidden');
    renderShopItems();
}

function closeShop() {
    shopOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
}

function renderShopItems() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    const t = TRANSLATIONS[currentLanguage];
    document.getElementById('shopCoins').innerText = formatNumber(coins);
    const items = [
        { id: 'foodCount', baseCost: 10, name: t.moreFood, desc: t.moreFoodDesc, level: upgrades.foodCount, maxLevel: UPGRADE_LIMITS.foodCount, cost: getUpgradeCost(10, upgrades.foodCount, 'foodCount') },
        { id: 'scoreMult', baseCost: 25, name: t.scoreBonus, desc: t.scoreBonusDesc, level: upgrades.scoreMult, maxLevel: UPGRADE_LIMITS.scoreMult, cost: getUpgradeCost(25, upgrades.scoreMult, 'scoreMult') },
        { id: 'doublePoints', baseCost: 100, name: t.globalMult, desc: t.globalMultDesc, level: upgrades.doublePoints, maxLevel: UPGRADE_LIMITS.doublePoints, cost: getUpgradeCost(100, upgrades.doublePoints, 'doublePoints') },
        { id: 'xpMult', baseCost: 50, name: t.xpBonus, desc: t.xpBonusDesc, level: upgrades.xpMult, maxLevel: UPGRADE_LIMITS.xpMult, cost: getUpgradeCost(50, upgrades.xpMult, 'xpMult') },
        { id: 'growthBoost', baseCost: 100000000, name: t.growthSurge, desc: t.growthSurgeDesc, level: upgrades.growthBoost, maxLevel: UPGRADE_LIMITS.growthBoost, cost: getUpgradeCost(0, upgrades.growthBoost, 'growthBoost') },
        { id: 'eatRange', baseCost: 1000000000, name: t.magnetRange, desc: t.magnetRangeDesc, level: upgrades.eatRange, maxLevel: UPGRADE_LIMITS.eatRange, cost: getUpgradeCost(0, upgrades.eatRange, 'eatRange') },
        { id: 'luckBoost', baseCost: 1000000, name: t.luckyCharm, desc: t.luckyCharmDesc, level: upgrades.luckBoost, maxLevel: UPGRADE_LIMITS.luckBoost, cost: getUpgradeCost(1000000, upgrades.luckBoost, 'luckBoost') }
    ];
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
            <p>Level: ${item.level} / ${item.maxLevel}</p>
            <div class="shop-buttons">
                <button onclick="buyUpgrade('${item.id}', ${item.cost})" ${coins < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''}>
                    ${item.level >= item.maxLevel ? t.max : `${t.buy} (${formatNumber(item.cost)})`}
                </button>
                <button class="btn-max" onclick="buyMaxUpgrade('${item.id}', ${item.baseCost})" ${coins < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''}>
                    Max
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function buyMaxUpgrade(id, baseCost) {
    let currentLevel = upgrades[id];
    let maxLevel = UPGRADE_LIMITS[id];
    if (currentLevel >= maxLevel) return;
    if (STATIC_COSTS[id]) {
        let cost = STATIC_COSTS[id][currentLevel];
        if (coins >= cost) buyUpgrade(id, cost);
        return;
    }
    if (id === 'luckBoost') {
        let n = 0;
        let totalCost = 0;
        let tempLevel = currentLevel;
        while (tempLevel < maxLevel) {
            let cost = getUpgradeCost(baseCost, tempLevel, id);
            if (coins >= totalCost + cost) {
                totalCost += cost;
                n++;
                tempLevel++;
            } else {
                break;
            }
        }
        if (n > 0) {
            coins -= totalCost;
            upgrades[id] += n;
            localStorage.setItem('snakeCoins', coins);
            localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
            updateScore();
            renderShopItems();
            playSound('eat');
        }
        return;
    }
    
    let n = 0;
    let totalCost = 0;
    let tempLevel = currentLevel;
    while (tempLevel < maxLevel) {
        let cost = getUpgradeCost(baseCost, tempLevel, id);
        if (coins >= totalCost + cost) {
            totalCost += cost;
            n++;
            tempLevel++;
        } else {
            break;
        }
    }
    if (n > 0) {
        coins -= totalCost;
        upgrades[id] += n;
        localStorage.setItem('snakeCoins', coins);
        localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
        updateScore();
        renderShopItems();
        playSound('eat');
    }
}

function buyUpgrade(id, cost) {
    if (upgrades[id] >= UPGRADE_LIMITS[id]) return;
    if (coins >= cost) {
        coins -= cost;
        upgrades[id]++;
        localStorage.setItem('snakeCoins', coins);
        localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
        updateScore();
        renderShopItems();
        playSound('eat');
    }
}
