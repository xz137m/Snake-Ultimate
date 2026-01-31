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
        gachaBtn.innerText = `Summon Pet (250k Souls)`;
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
    const cost = 250000;
    if (souls < cost) {
        showNotification(`Not enough souls! Need ${window.formatNumber(cost)}`, "error");
        return;
    }
    souls -= cost;
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
            background: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #000000)',
            backgroundSize: '400% 400%', animation: 'bg-pan 10s ease infinite',
            zIndex: '10000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        });
        document.body.appendChild(overlay);
        
    }
    
    // Fix: Update Keyframes dynamically for the specific winning pet color
    let style = document.getElementById('gacha-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'gacha-style';
        document.head.appendChild(style);
    }
    style.innerHTML = `
        @keyframes gacha-pulse { 
            0% { transform: scale(1.2); box-shadow: 0 0 20px ${winningPet.color}; } 
            100% { transform: scale(1.3); box-shadow: 0 0 50px ${winningPet.color}; } 
        }
        @keyframes bg-pan {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes card-shine {
            0% { left: -150%; }
            50%, 100% { left: 150%; }
        }
        @keyframes shake {
            0% { transform: translate(0, 0); }
            10%, 90% { transform: translate(-2px, 0); }
            20%, 80% { transform: translate(4px, 0); }
            30%, 50%, 70% { transform: translate(-6px, 0); }
            40%, 60% { transform: translate(6px, 0); }
            100% { transform: translate(0, 0); }
        }
        @keyframes pulse-line {
            0% { opacity: 0.6; box-shadow: 0 0 10px #ffd700; }
            100% { opacity: 1; box-shadow: 0 0 25px #ffd700, 0 0 10px #fff; }
        }
    `;

    overlay.innerHTML = '';
    overlay.style.display = 'flex';

    // 2. Track Container
    const trackContainer = document.createElement('div');
    Object.assign(trackContainer.style, {
        width: '100%', height: '280px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(to bottom, #000 0%, rgba(20,20,20,0.5) 20%, rgba(20,20,20,0.5) 80%, #000 100%)',
        display: 'flex', alignItems: 'center', 
        borderTop: '1px solid #333', borderBottom: '1px solid #333',
        boxShadow: 'inset 0 0 50px #000'
    });

    // 3. Center Marker
    const centerLine = document.createElement('div');
    Object.assign(centerLine.style, {
        position: 'absolute', left: '50%', top: '0', bottom: '0', width: '4px',
        background: 'linear-gradient(to bottom, transparent, #ffd700, #fff, #ffd700, transparent)',
        zIndex: '10', transform: 'translateX(-50%)',
        boxShadow: '0 0 15px #ffd700, 0 0 5px #fff',
        animation: 'pulse-line 1s infinite alternate'
    });
    
    // Add Arrows to Center Marker
    const arrowStyle = {
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
        zIndex: '11', filter: 'drop-shadow(0 0 5px #ffd700)'
    };
    const arrowTop = document.createElement('div');
    Object.assign(arrowTop.style, arrowStyle, { top: '10px', borderTop: '20px solid #ffd700' });
    const arrowBottom = document.createElement('div');
    Object.assign(arrowBottom.style, arrowStyle, { bottom: '10px', borderBottom: '20px solid #ffd700' });
    
    centerLine.appendChild(arrowTop);
    centerLine.appendChild(arrowBottom);

    // 4. Generate Cards
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? 90 : 140;
    const cardHeight = isMobile ? 140 : 220;
    const gap = 20;
    const totalCards = 40; 
    const winnerIndex = 30; // Winner position
    
    const track = document.createElement('div');
    Object.assign(track.style, {
        display: 'flex', gap: `${gap}px`, paddingLeft: '50%', // 50% is more accurate for centering inside the container
        transition: 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)',
        willChange: 'transform'
    });

    for (let i = 0; i < totalCards; i++) {
        let pet = (i === winnerIndex) ? winningPet : PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
        
        const card = document.createElement('div');
        let borderColor = '#888';
        let bgGradient = 'linear-gradient(145deg, #252525, #101010)';
        
        if (pet.rarity.includes('Rare')) borderColor = '#00bfff';
        if (pet.rarity.includes('Epic')) borderColor = '#ffaa00';
        if (pet.rarity.includes('Legendary')) {
            borderColor = '#9400d3';
            bgGradient = 'linear-gradient(145deg, #2a0e35, #101010)'; // Purple tint for Legendary
        }

        Object.assign(card.style, {
            minWidth: `${cardWidth}px`, height: `${cardHeight}px`,
            border: `2px solid ${borderColor}`, borderRadius: '12px',
            background: bgGradient, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px ${borderColor}40`, 
            position: 'relative',
            flexShrink: '0',
            boxSizing: 'border-box' // Fix alignment: Includes border in width calculation
        });

        card.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border-radius: 12px; pointer-events: none;">
                <div style="position: absolute; top: 0; left: -150%; width: 50%; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent); transform: skewX(-25deg); animation: card-shine 3s infinite linear;"></div>
            </div>
            <div style="width: 90px; height: 90px; border-radius: 12px; background: ${pet.color}; margin-bottom: 20px; box-shadow: 0 0 20px ${pet.color}; border: 2px solid #fff; z-index: 2;"></div>
            <div style="color: #fff; font-weight: bold; font-size: 15px; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 2;">${pet.name}</div>
            <div style="color: ${borderColor}; font-size: 12px; margin-top: 5px; z-index: 2;">${pet.rarity}</div>
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

    // Skip Button
    const skipBtn = document.createElement('button');
    skipBtn.innerText = "⏩ Skip";
    Object.assign(skipBtn.style, {
        position: 'absolute', top: '20px', right: '20px',
        padding: '10px 20px', background: 'rgba(0, 0, 0, 0.5)', color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', cursor: 'pointer',
        backdropFilter: 'blur(5px)', transition: 'background 0.2s',
        zIndex: '10001', fontSize: '16px'
    });

    let animationTimeout;
    let revealTimeout;

    const finishAnimation = () => {
        if(animationTimeout) clearTimeout(animationTimeout);
        if(revealTimeout) clearTimeout(revealTimeout);
        if(skipBtn.parentNode) skipBtn.remove();
        
        // Force track to end position immediately
        track.style.transition = 'none';
        track.style.transform = `translateX(${targetTranslate}px)`;
        
        // Add shake effect to container
        trackContainer.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
        
        // Flash Effect
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: '#ffffff', zIndex: '20000', opacity: '0', pointerEvents: 'none',
            transition: 'opacity 0.1s ease-out'
        });
        overlay.appendChild(flash);
        
        requestAnimationFrame(() => {
            flash.style.opacity = '0.7';
            setTimeout(() => {
                flash.style.transition = 'opacity 0.8s ease-out';
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 800);
            }, 50);
        });
        
        // Show winning card effect
        const winningCard = track.children[winnerIndex];
        if(winningCard) {
            winningCard.style.animation = 'gacha-pulse 1s infinite alternate';
            winningCard.style.zIndex = '20';
            winningCard.style.background = '#252525';
        }
        
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
                showNotification(`Duplicate ${winningPet.name}.`, "warning");
            }
            updateScore();
            updatePetInventoryUI();
        };
        overlay.appendChild(closeBtn);
    };

    skipBtn.onclick = finishAnimation;
    overlay.appendChild(skipBtn);

    // Force Reflow
    void track.offsetWidth;
    
    animationTimeout = setTimeout(() => {
        track.style.transform = `translateX(${targetTranslate}px)`;
    }, 50);

    // 6. Reveal & Close
    revealTimeout = setTimeout(finishAnimation, 4000);
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

window.openPetMenu = openPetMenu;
window.closePetMenu = closePetMenu;
window.pullPetGacha = pullPetGacha;
window.togglePetEquip = togglePetEquip;
window.updatePetInventoryUI = updatePetInventoryUI;
window.debugPetUI = debugPetUI;
window.forceShowPetMenu = forceShowPetMenu;
