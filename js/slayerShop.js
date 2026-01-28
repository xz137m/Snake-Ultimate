function openSlayerShop() {
    // تحديث البيانات أولاً لتجنب ظهور Undefined
    renderSlayerShopItems();
    const mOverlay = document.getElementById('menu-overlay');
    const sOverlay = document.getElementById('slayer-shop-overlay');
    if (mOverlay) mOverlay.classList.add('hidden');
    if (sOverlay) sOverlay.classList.remove('hidden');
}

function renderSlayerShopItems() {
    const container = document.getElementById('slayer-shop-items');
    container.innerHTML = '';
    const t = TRANSLATIONS[currentLanguage];
    
    document.getElementById('slayerSoulsDisplay').innerText = window.formatNumber(window.souls || 0);

    const items = [
        { 
            id: 'maxHearts', 
            name: t.heartUpgrade, 
            desc: t.heartUpgradeDesc, 
            level: slayerUpgrades.maxHearts, 
            maxLevel: 5, 
            cost: Math.floor(100 * Math.pow(2.5, slayerUpgrades.maxHearts)) 
        },
        { 
            id: 'maxStamina', 
            name: t.staminaUpgrade, 
            desc: t.staminaUpgradeDesc, 
            level: slayerUpgrades.maxStamina, 
            maxLevel: 10, 
            cost: Math.floor(50 * Math.pow(1.5, slayerUpgrades.maxStamina)) 
        },
        { 
            id: 'staminaRegen', 
            name: t.regenUpgrade, 
            desc: t.regenUpgradeDesc, 
            level: slayerUpgrades.staminaRegen, 
            maxLevel: 10, 
            cost: Math.floor(75 * Math.pow(1.6, slayerUpgrades.staminaRegen)) 
        }
    ];

    items.forEach(item => {
        let dynamicInfo = '';
        let bonusVal = '';
        if (item.id === 'maxHearts') bonusVal = `+${item.level} ❤️`;
        else if (item.id === 'maxStamina') bonusVal = `+${item.level * 20} ⚡`;
        else if (item.id === 'staminaRegen') bonusVal = `+${item.level * 5}%`;

        if (bonusVal) {
             dynamicInfo = `<br><span style="color: #00ff00; font-weight: bold; font-size: 0.9em;">${t.currentBonus} ${bonusVal}</span>`;
        }

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = '#ff3333'; // Red theme for slayer
        div.innerHTML = `
            <h3 style="color: #ff3333">${item.name}</h3>
            <p>${item.desc}${dynamicInfo}</p>
            <p>Lvl: ${item.level} / ${item.maxLevel}</p>
            <button onclick="window.buySlayerUpgrade('${item.id}', ${item.cost})" ${souls < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''} style="background: linear-gradient(45deg, #b71c1c, #ff5252);">
                ${item.level >= item.maxLevel ? t.max : `${t.buy} (${window.formatNumber(item.cost)} Souls)`}
            </button>
        `;
        container.appendChild(div);
    });
}

window.buySlayerUpgrade = function(id, cost) {
    // تحديد الحدود القصوى لكل تطوير بدقة
    const limits = {
        maxHearts: 5,
        maxStamina: 10,
        staminaRegen: 10
    };
    let maxLvl = limits[id] || 10;
    
    if (slayerUpgrades[id] >= maxLvl) return;
    
    if (window.souls >= cost) {
        window.souls -= cost;
        slayerUpgrades[id]++;
        localStorage.setItem('snakeSouls', window.souls);
        localStorage.setItem('snakeSlayerUpgrades', JSON.stringify(slayerUpgrades));
        
        // Update current stats immediately if needed
        if (id === 'maxHearts') {
            // Don't heal, just increase cap logic handled in initGame/respawn
        }
        
        updateScore(); // Update UI
        renderSlayerShopItems();
        playSound('eat');
    }
};

// Export functions to window to work with HTML onclick attributes and other modules
window.openSlayerShop = openSlayerShop;
