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
            cost: Math.floor(100 * Math.pow(1.5, slayerUpgrades.maxHearts)) 
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
            cost: Math.floor(75 * Math.pow(1.5, slayerUpgrades.staminaRegen)) 
        },
        { 
            id: 'gold1', 
            name: t.slayerGold1, 
            desc: t.slayerGold1Desc, 
            level: slayerUpgrades.gold1, 
            maxLevel: 50, 
            cost: Math.floor(200 * Math.pow(1.5, slayerUpgrades.gold1)) 
        },
        { 
            id: 'gold2', 
            name: t.slayerGold2, 
            desc: t.slayerGold2Desc, 
            level: slayerUpgrades.gold2, 
            maxLevel: 50, 
            cost: Math.floor(1000 * Math.pow(1.5, slayerUpgrades.gold2)) 
        },
        { 
            id: 'rp1', 
            name: t.slayerRP1, 
            desc: t.slayerRP1Desc, 
            level: slayerUpgrades.rp1, 
            maxLevel: 50, 
            cost: Math.floor(500 * Math.pow(1.5, slayerUpgrades.rp1)) 
        },
        { 
            id: 'rp2', 
            name: t.slayerRP2, 
            desc: t.slayerRP2Desc, 
            level: slayerUpgrades.rp2, 
            maxLevel: 50, 
            cost: Math.floor(2500 * Math.pow(1.5, slayerUpgrades.rp2)) 
        },
        { 
            id: 'souls1', 
            name: t.slayerSouls1, 
            desc: t.slayerSouls1Desc, 
            level: slayerUpgrades.souls1, 
            maxLevel: 50, 
            cost: Math.floor(300 * Math.pow(1.5, slayerUpgrades.souls1)) 
        },
        { 
            id: 'souls2', 
            name: t.slayerSouls2, 
            desc: t.slayerSouls2Desc, 
            level: slayerUpgrades.souls2, 
            maxLevel: 50, 
            cost: Math.floor(1500 * Math.pow(1.5, slayerUpgrades.souls2)) 
        },
        { 
            id: 'infiniteStamina', 
            name: t.infiniteStamina, 
            desc: t.infiniteStaminaDesc, 
            level: slayerUpgrades.infiniteStamina, 
            maxLevel: 1, 
            cost: 50000 // تكلفة عالية لأنها تطويرة قوية جداً
        }
    ];

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
            if (id === 'infiniteStamina') return lvl > 0 ? "✅ ACTIVE" : "❌ INACTIVE";
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
            lockMsg = ` (${t.req} Max Stamina Lvl 10)`;
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

const SLAYER_LIMITS = {
    maxHearts: 5,
    maxStamina: 10,
    staminaRegen: 10,
    gold1: 50, gold2: 50,
    rp1: 50, rp2: 50,
    souls1: 50, souls2: 50,
    infiniteStamina: 1
};

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
        showNotification(`⚔️ Slayer Upgrade Unlocked!`, 'success');
    }
};

window.buyMaxSlayerUpgrade = function(id) {
    let maxLvl = SLAYER_LIMITS[id] || 50;
    let bought = 0;
    
    while (slayerUpgrades[id] < maxLvl) {
        let cost = 0;
        // حساب التكلفة بناءً على نوع التطوير
        if (id === 'maxHearts') cost = Math.floor(100 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'maxStamina') cost = Math.floor(50 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'staminaRegen') cost = Math.floor(75 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'gold1') cost = Math.floor(200 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'gold2') cost = Math.floor(1000 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'rp1') cost = Math.floor(500 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'rp2') cost = Math.floor(2500 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'souls1') cost = Math.floor(300 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'souls2') cost = Math.floor(1500 * Math.pow(1.5, slayerUpgrades[id]));
        else if (id === 'infiniteStamina') cost = 50000;
        
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
        showNotification(`⚔️ Purchased ${bought} Upgrades!`, 'success');
    }
};

// Export functions to window to work with HTML onclick attributes and other modules
window.openSlayerShop = openSlayerShop;
