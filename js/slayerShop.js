const SLAYER_DATA = {
    maxHearts: { base: 100, scale: 1.5, max: 5 },
    maxStamina: { base: 50, scale: 1.5, max: 10 },
    staminaRegen: { base: 75, scale: 1.5, max: 10 },
    gold1: { base: 200, scale: 1.5, max: 50 },
    gold2: { base: 1000, scale: 1.5, max: 50 },
    rp1: { base: 500, scale: 1.5, max: 50 },
    rp2: { base: 2500, scale: 1.5, max: 50 },
    souls1: { base: 300, scale: 1.5, max: 50 },
    souls2: { base: 1500, scale: 1.5, max: 50 },
    infiniteStamina: { base: 50000, scale: 1, max: 1 }
};

const getSlayerCost = (id, lvl) => Math.floor(SLAYER_DATA[id].base * Math.pow(SLAYER_DATA[id].scale, lvl));

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

    const items = Object.keys(SLAYER_DATA).map(key => ({
        id: key,
        name: t[key === 'maxHearts' ? 'heartUpgrade' : key === 'maxStamina' ? 'staminaUpgrade' : key === 'staminaRegen' ? 'regenUpgrade' : key === 'infiniteStamina' ? 'infiniteStamina' : 'slayer' + key.charAt(0).toUpperCase() + key.slice(1)],
        desc: t[key === 'maxHearts' ? 'heartUpgradeDesc' : key === 'maxStamina' ? 'staminaUpgradeDesc' : key === 'staminaRegen' ? 'regenUpgradeDesc' : key === 'infiniteStamina' ? 'infiniteStaminaDesc' : 'slayer' + key.charAt(0).toUpperCase() + key.slice(1) + 'Desc'],
        level: slayerUpgrades[key] || 0,
        maxLevel: SLAYER_DATA[key].max,
        cost: getSlayerCost(key, slayerUpgrades[key] || 0)
    }));

    items.forEach(item => {
        const getBonus = (id, lvl) => {
            if (id === 'maxHearts') return `+${lvl} ❤️`;
            if (id === 'maxStamina') return `+${lvl * 20} ⚡`;
            if (id === 'staminaRegen') return `+${lvl * 5}%`;
            if (id === 'gold1') return `+${lvl * 5}%`;
            if (id === 'gold2') return `+${lvl * 10}%`;
            if (id === 'rp1') return `+${lvl * 5}%`;
            if (id === 'rp2') return `+${lvl * 10}%`;
            if (id === 'souls1') return `+${lvl * 5}%`;
            if (id === 'souls2') return `+${lvl * 10}%`;
            if (id === 'infiniteStamina') return lvl > 0 ? t.active : t.inactive;
            return '';
        };

        let currentBonus = getBonus(item.id, item.level);
        let nextBonus = item.level < item.maxLevel ? getBonus(item.id, item.level + 1) : "MAX";

        let dynamicInfo = `<br><span style="color: #00ff00; font-weight: bold; font-size: 0.9em;">Current: ${currentBonus}</span>`;
        if (item.level < item.maxLevel) {
            dynamicInfo += `<br><span style="color: #00ffff; font-weight: bold; font-size: 0.9em;">Next: ${nextBonus}</span>`;
        }

        const div = document.createElement('div');
        div.className = 'shop-item';
        
        // التحقق من شرط الفتح (Max Stamina Level 10)
        let isLocked = false;
        let lockMsg = "";
        if (item.id === 'infiniteStamina' && slayerUpgrades.maxStamina < 10) {
            isLocked = true;
            lockMsg = ` (${t.req} ${t.maxStaminaReq})`;
        }

        div.style.borderColor = '#ff3333'; // Red theme for slayer
        div.innerHTML = `
            <h3 style="color: #ff3333">${item.name}</h3>
            <p>${item.desc}${dynamicInfo}</p>
            <p>Lvl: ${item.level} / ${item.maxLevel}</p>
            <div class="shop-buttons">
                <button onclick="window.buySlayerUpgrade('${item.id}', ${item.cost})" ${isLocked || souls < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''} style="background: linear-gradient(45deg, #b71c1c, #ff5252);">
                    ${item.level >= item.maxLevel ? t.max : (isLocked ? lockMsg : `${t.buy} (${window.formatNumber(item.cost)} Souls)`)}
                </button>
                <button class="btn-max" onclick="window.buyMaxSlayerUpgrade('${item.id}')" ${isLocked || souls < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''} style="background: linear-gradient(45deg, #b71c1c, #ff5252);">
                    MAX
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

const SLAYER_LIMITS = Object.fromEntries(Object.entries(SLAYER_DATA).map(([k, v]) => [k, v.max]));

window.buySlayerUpgrade = function(id, cost) {
    let maxLvl = SLAYER_LIMITS[id] || 50;
    
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
        showNotification(TRANSLATIONS[currentLanguage].slayerUnlocked, 'success');
    }
};

window.buyMaxSlayerUpgrade = function(id) {
    let maxLvl = SLAYER_LIMITS[id] || 50;
    let bought = 0;
    
    while (slayerUpgrades[id] < maxLvl) {
        let cost = getSlayerCost(id, slayerUpgrades[id]);
        
        if (window.souls >= cost) {
            window.souls -= cost;
            slayerUpgrades[id]++;
            bought++;
        } else {
            break;
        }
    }

    if (bought > 0) {
        localStorage.setItem('snakeSouls', window.souls);
        localStorage.setItem('snakeSlayerUpgrades', JSON.stringify(slayerUpgrades));
        
        if (id === 'maxHearts') {
            // Logic handled elsewhere
        }
        
        updateScore();
        renderSlayerShopItems();
        playSound('eat');
        showNotification(TRANSLATIONS[currentLanguage].purchasedUpgrades.replace('{0}', bought), 'success');
    }
};

// Export functions to window to work with HTML onclick attributes and other modules
window.openSlayerShop = openSlayerShop;
