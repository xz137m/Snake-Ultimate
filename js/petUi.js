// Helper for concise DOM creation
const mk = (tag, style, parent, txt) => {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (txt) el.innerText = txt;
    if (parent) parent.appendChild(el);
    return el;
};
const getEl = id => document.getElementById(id);

function togglePetMenu(show) {
    const overlay = getEl('pet-overlay');
    const menu = getEl('menu-overlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
        overlay.style.display = show ? 'flex' : 'none';
    }
    if (menu) menu.classList.toggle('hidden', show);
    if (show) updatePetInventoryUI();
}
window.openPetMenu = () => togglePetMenu(true);
window.closePetMenu = () => togglePetMenu(false);

function updatePetInventoryUI() {
    const container = getEl('pet-items');
    if (!container) return;
    container.innerHTML = '';
    
    // Improved Grid Layout & Container Styling
    Object.assign(container.style, { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', 
        gap: '12px', 
        padding: '15px', 
        width: '100%', maxWidth: '550px', boxSizing: 'border-box' 
    });

    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';
    let t = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]) ? TRANSLATIONS[lang] : null;
    if (!t && typeof TRANSLATIONS !== 'undefined') t = TRANSLATIONS['en'];
    if (!t) t = { summonPet: "Summon", active: "Active", notEnoughSouls: "Not enough souls", skip: "Skip", collectClose: "Close", petUnlocked: "Unlocked", petDuplicate: "Duplicate" };
    
    const soulsDisplay = getEl('petSoulsDisplay');
    if (soulsDisplay) soulsDisplay.innerText = window.formatNumber ? window.formatNumber(window.souls || 0) : (window.souls || 0);
    const gachaBtn = getEl('btnPullGacha');
    if (gachaBtn) gachaBtn.innerText = t.summonPet.replace('{0}', window.formatNumber ? window.formatNumber(250000) : "250k");

    const active = window.activePetIds = window.activePetIds || [];
    const owned = window.ownedPets = window.ownedPets || [];
    
    if (typeof PET_TYPES === 'undefined') return;

    const getPet = id => PET_TYPES.find(p => p.id === id);
    const equipped = active.map(getPet).filter(Boolean);
    const inventory = owned.filter(id => !active.includes(id)).map(getPet).filter(Boolean);

    for (let i = 0; i < 10; i++) {
        const isEquippedSlot = i < 2;
        const pet = isEquippedSlot ? equipped[i] : inventory[i - 2];
        
        // Enhanced Card Styling
        const style = {
            aspectRatio: '1', 
            borderRadius: '16px', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.3) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', 
            transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s', 
            cursor: pet ? 'pointer' : 'default',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            overflow: 'hidden'
        };

        if (isEquippedSlot) {
            Object.assign(style, { 
                borderColor: 'rgba(0, 255, 136, 0.5)', 
                background: 'linear-gradient(180deg, rgba(0, 255, 136, 0.1) 0%, rgba(0,0,0,0.4) 100%)', 
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.15)' 
            });
        }

        const div = mk('div', style, container);

        // Hover Effects
        if (pet) {
            div.onmouseenter = () => {
                div.style.transform = 'translateY(-3px)';
                div.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                div.style.boxShadow = '0 8px 15px rgba(0,0,0,0.4)';
            };
            div.onmouseleave = () => {
                div.style.transform = 'translateY(0)';
                div.style.borderColor = isEquippedSlot ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 255, 255, 0.1)';
                div.style.boxShadow = isEquippedSlot ? '0 0 15px rgba(0, 255, 136, 0.15)' : '0 4px 6px rgba(0,0,0,0.2)';
            };
        }

        if (isEquippedSlot && !pet) div.innerHTML = `<span style="color: rgba(0,255,136,0.6); font-size: 11px; font-weight: bold; letter-spacing: 1px;">${t.active.toUpperCase()}</span>`;
        else if (!isEquippedSlot && !pet) { div.style.opacity = '0.2'; div.style.background = 'rgba(0,0,0,0.2)'; }

        if (pet) {
            div.onclick = () => window.togglePetEquip(pet.id);
            
            // Pet Icon with Shine
            const icon = mk('div', {
                width: '60%', height: '60%', borderRadius: '12px', background: `linear-gradient(135deg, ${pet.color}, #1a1a1a)`,
                boxShadow: `0 0 15px ${pet.color}80`, border: '2px solid rgba(255,255,255,0.9)', marginBottom: '8px', position: 'relative'
            }, div);
            mk('div', { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)', borderRadius: '10px' }, icon);

            mk('div', { color: '#fff', fontSize: '11px', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '90%', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }, div, lang === 'ar' ? pet.nameAr : pet.name);
            
            if (active.includes(pet.id)) {
                const badge = mk('div', { position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', background: '#00ff88', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: '2' }, div);
                mk('div', { width: '5px', height: '9px', borderBottom: '2px solid #000', borderRight: '2px solid #000', transform: 'rotate(45deg) translateY(-1px)' }, badge);
            }
        }
    }
}

function pullPetGacha() {
    const cost = 250000;
    if ((window.souls || 0) < cost) {
        const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';
        const t = (typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS[lang] : null) || TRANSLATIONS['en'];
        return showNotification(t.notEnoughSouls.replace('{0}', window.formatNumber ? window.formatNumber(cost) : "250k"), "error");
    }
    window.souls -= cost;
    localStorage.setItem('snakeSouls', window.souls);
    updateScore();

    let rand = Math.random() * 100, cumulative = 0;
    const selected = PET_TYPES.find(p => (cumulative += p.chance) >= rand) || PET_TYPES[0];
    playGachaAnimation(selected);
}

function playGachaAnimation(winningPet) {
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';
    const t = (typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS[lang] : null) || TRANSLATIONS['en'];

    let overlay = getEl('gacha-overlay');
    if (!overlay) {
        overlay = mk('div', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #000000)', backgroundSize: '400% 400%',
            animation: 'bg-pan 10s ease infinite', zIndex: '10000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }, document.body);
        overlay.id = 'gacha-overlay';
    }
    overlay.innerHTML = ''; overlay.style.display = 'flex';

    let style = getEl('gacha-style');
    if (!style) { style = mk('style', {}, document.head); style.id = 'gacha-style'; }
    style.innerHTML = `@keyframes gacha-pulse{0%{transform:scale(1.2);box-shadow:0 0 20px ${winningPet.color}}100%{transform:scale(1.3);box-shadow:0 0 50px ${winningPet.color}}}@keyframes bg-pan{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes card-shine{0%{left:-150%}50%,100%{left:150%}}@keyframes shake{0%,100%{transform:translate(0,0)}10%,90%{transform:translate(-2px,0)}20%,80%{transform:translate(4px,0)}30%,50%,70%{transform:translate(-6px,0)}40%,60%{transform:translate(6px,0)}}@keyframes pulse-line{0%{opacity:0.6;box-shadow:0 0 10px #ffd700}100%{opacity:1;box-shadow:0 0 25px #ffd700,0 0 10px #fff}}`;

    const trackContainer = mk('div', {
        width: '100%', height: '280px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(to bottom, #000 0%, rgba(20,20,20,0.5) 20%, rgba(20,20,20,0.5) 80%, #000 100%)',
        display: 'flex', alignItems: 'center', borderTop: '1px solid #333', borderBottom: '1px solid #333', boxShadow: 'inset 0 0 50px #000'
    }, overlay);

    const centerLine = mk('div', {
        position: 'absolute', left: '50%', top: '0', bottom: '0', width: '4px', background: 'linear-gradient(to bottom, transparent, #ffd700, #fff, #ffd700, transparent)',
        zIndex: '10', transform: 'translateX(-50%)', boxShadow: '0 0 15px #ffd700, 0 0 5px #fff', animation: 'pulse-line 1s infinite alternate'
    }, trackContainer);
    
    const arrowStyle = { position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', zIndex: '11', filter: 'drop-shadow(0 0 5px #ffd700)' };
    mk('div', { ...arrowStyle, top: '10px', borderTop: '20px solid #ffd700' }, centerLine);
    mk('div', { ...arrowStyle, bottom: '10px', borderBottom: '20px solid #ffd700' }, centerLine);

    const isMobile = window.innerWidth < 768, cardWidth = isMobile ? 90 : 140, gap = 20, totalCards = 40, winnerIndex = 30;
    const track = mk('div', { display: 'flex', gap: `${gap}px`, paddingLeft: '50%', transition: 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)', willChange: 'transform' }, trackContainer);

    for (let i = 0; i < totalCards; i++) {
        const pet = (i === winnerIndex) ? winningPet : PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
        let borderColor = '#888', bg = 'linear-gradient(145deg, #252525, #101010)';
        if (pet.rarity.includes('Rare')) borderColor = '#00bfff';
        if (pet.rarity.includes('Epic')) borderColor = '#ffaa00';
        if (pet.rarity.includes('Legendary')) { borderColor = '#9400d3'; bg = 'linear-gradient(145deg, #2a0e35, #101010)'; }

        const card = mk('div', {
            minWidth: `${cardWidth}px`, height: `${isMobile ? 140 : 220}px`, border: `2px solid ${borderColor}`, borderRadius: '12px', background: bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: '0', boxSizing: 'border-box',
            boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px ${borderColor}40`
        }, track);
        
        card.innerHTML = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;border-radius:12px;pointer-events:none"><div style="position:absolute;top:0;left:-150%;width:50%;height:100%;background:linear-gradient(to right,transparent,rgba(255,255,255,0.15),transparent);transform:skewX(-25deg);animation:card-shine 3s infinite linear"></div></div><div style="width:90px;height:90px;border-radius:12px;background:${pet.color};margin-bottom:20px;box-shadow:0 0 20px ${pet.color};border:2px solid #fff;z-index:2"></div><div style="color:#fff;font-weight:bold;font-size:15px;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,0.8);z-index:2">${lang==='ar'?pet.nameAr:pet.name}</div><div style="color:;font-size:12px;margin-top:5px;z-index:2">${lang==='ar'?pet.rarityAr:pet.rarity}</div>`;
    }

    const targetTranslate = -(winnerIndex * (cardWidth + gap)) - (cardWidth / 2);
    let timers = [];

    const finish = () => {
        timers.forEach(clearTimeout);
        skipBtn.remove();
        track.style.transition = 'none';
        track.style.transform = `translateX(${targetTranslate}px)`;
        trackContainer.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
        
        const flash = mk('div', { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#fff', zIndex: '20000', opacity: '0', pointerEvents: 'none', transition: 'opacity 0.1s ease-out' }, overlay);
        requestAnimationFrame(() => { flash.style.opacity = '0.7'; setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 800); }, 50); });

        const winCard = track.children[winnerIndex];
        if(winCard) { winCard.style.animation = 'gacha-pulse 1s infinite alternate'; winCard.style.zIndex = '20'; winCard.style.background = '#252525'; }
        
        if (typeof playSound === 'function') playSound('gacha');
        createParticles(window.innerWidth / 2, window.innerHeight / 2, winningPet.color);

        const closeBtn = mk('button', {
            marginTop: '40px', padding: '12px 30px', fontSize: '20px', background: 'linear-gradient(45deg, #00c853, #64dd17)', border: 'none', borderRadius: '8px',
            color: 'white', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 20px rgba(0, 200, 83, 0.5)'
        }, overlay, t.collectClose);
        
        closeBtn.onclick = () => {
            overlay.style.display = 'none';
            const winName = lang === 'ar' ? winningPet.nameAr : winningPet.name;
            if (!window.ownedPets.includes(winningPet.id)) {
                window.ownedPets.push(winningPet.id);
                localStorage.setItem('snakeOwnedPets', JSON.stringify(window.ownedPets));
                showNotification(t.petUnlocked.replace('{0}', winName), "success");
            } else {
                showNotification(t.petDuplicate.replace('{0}', winName), "warning");
            }
            updateScore();
            updatePetInventoryUI();
        };
    };

    const skipBtn = mk('button', {
        position: 'absolute', top: '20px', right: '20px', padding: '10px 20px', background: 'rgba(0,0,0,0.5)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: '10001', fontSize: '16px'
    }, overlay, t.skip);
    skipBtn.onclick = finish;

    void track.offsetWidth;
    timers.push(setTimeout(() => track.style.transform = `translateX(${targetTranslate}px)`, 50));
    timers.push(setTimeout(finish, 4000));
}

window.togglePetEquip = (id) => {
    const idx = window.activePetIds.indexOf(id);
    if (idx > -1) window.activePetIds.splice(idx, 1);
    else {
        if (window.activePetIds.length >= 2) window.activePetIds.shift();
        window.activePetIds.push(id);
    }
    localStorage.setItem('snakeActivePets', JSON.stringify(window.activePetIds));
    if (window.refreshPets) window.refreshPets();
    updatePetInventoryUI();
};

window.debugPetUI = () => {
    console.group("🐾 Pet UI Debugger");
    console.log(`%c[DOM] #pet-items:`, "color: green", getEl('pet-items') ? "Found" : "Missing");
    console.log(`%c[DATA] Owned:`, "color: yellow", window.ownedPets || []);
    console.log(`%c[DATA] Equipped:`, "color: yellow", window.activePetIds || []);
    console.groupEnd();
};

window.forceShowPetMenu = () => {
    const o = getEl('pet-overlay');
    if (o) { o.classList.remove('hidden'); o.style.cssText = 'display:flex !important;z-index:9999 !important;opacity:1 !important;visibility:visible !important;pointer-events:auto !important;position:fixed !important;top:0;left:0;width:100%;height:100%;background:rgba(15,20,30,0.98);flex-direction:column;align-items:center;justify-content:center;'; updatePetInventoryUI(); }
};
