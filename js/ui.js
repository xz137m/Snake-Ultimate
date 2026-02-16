
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('snakeLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    updateTexts();
}

function updateTexts() {
    const t = TRANSLATIONS[currentLanguage];
    document.getElementById('lblScore').innerText = t.score;
    document.getElementById('lblLevel').innerText = t.level;
    document.getElementById('lblGold').innerText = t.gold;
    document.getElementById('lblRP').innerText = t.rp;
    document.getElementById('lblSouls').innerText = t.souls;
    document.getElementById('lblHighScore').innerText = t.highScore;
    document.getElementById('startBtn').innerText = t.play;
    document.getElementById('shopBtn').innerText = t.shop;
    document.getElementById('guideBtn').innerText = t.guide;
    document.getElementById('settingsBtn').innerText = t.settings;
    document.getElementById('resetBtn').innerText = t.reset;
    document.getElementById('rebirthMenuBtn').innerText = t.rebirth;
    document.getElementById('menuInstructions').innerHTML = t.instructions;
    document.getElementById('shopTitle').innerText = t.shopTitle;
    document.getElementById('lblBalance').innerText = t.balance;
    document.getElementById('closeShopBtn').innerText = t.close;
    document.getElementById('rebirthTitle').innerText = t.rebirthTitle;
    document.getElementById('closeRebirthBtn').innerText = t.close;
    document.getElementById('guideTitle').innerText = t.guideTitle;
    document.getElementById('closeGuideBtn').innerText = t.close;
    document.getElementById('settingsTitle').innerText = t.settingsTitle;
    document.getElementById('closeSettingsBtn').innerText = t.close;
    document.getElementById('lblAudioGame').innerText = t.audioGame;
    document.getElementById('lblGraphics').innerText = t.graphics;
    document.getElementById('lblProgress').innerText = t.nextEvo;
    
    const btnCloseSlayer = document.getElementById('closeSlayerShopBtn');
    if (btnCloseSlayer) {
        btnCloseSlayer.innerText = t.close;
    }

    if(document.getElementById('resumeBtn')) document.getElementById('resumeBtn').innerText = t.resume;
    if(document.getElementById('mainMenuBtn')) document.getElementById('mainMenuBtn').innerText = t.mainMenu;
    if(document.getElementById('pauseTitle')) document.getElementById('pauseTitle').innerText = t.pauseTitle;
    
    updateSettingsButtons();
    updateScore();
    if (typeof window.updateKillCounter === 'function') window.updateKillCounter();
    updateProgress();
}

function updateScore() {
    if(document.getElementById('score')) document.getElementById('score').innerText = formatNumber(score);
    if(highScoreElement) highScoreElement.innerText = formatNumber(highScore);
    if(document.getElementById('coinsDisplay')) document.getElementById('coinsDisplay').innerText = formatNumber(coins);
    if(document.getElementById('rpDisplay')) document.getElementById('rpDisplay').innerText = formatNumber(rebirthPoints);
    if(document.getElementById('soulsDisplay')) document.getElementById('soulsDisplay').innerText = formatNumber(souls);
    if(document.getElementById('levelDisplay')) document.getElementById('levelDisplay').innerText = playerLevel;
    updateHearts();
    updateStaminaBar();
    updateProgress();
}

function updateXpBar() {
    let currentCap = getCurrentLevelCap();
    if (playerLevel >= currentCap) {
        const fill = document.getElementById('xpFill');
        if(fill) fill.style.width = `100%`;
        let nextTier = LEVEL_CAPS.find(t => t.limit > currentCap);
        let msg = nextTier ? `CAP REACHED! Need ${formatNumber(nextTier.req)} Score` : `MAX LEVEL REACHED`;
        if(document.getElementById('xpText')) document.getElementById('xpText').innerText = msg;
    } else {
        let xpNeeded = Math.floor(1000 * Math.pow(playerLevel, 2.5));
        let percent = Math.min((currentXp / xpNeeded) * 100, 100);
        const fill = document.getElementById('xpFill');
        if(fill) fill.style.width = `${percent}%`;
        if(document.getElementById('xpText')) document.getElementById('xpText').innerText = `${formatNumber(Math.floor(currentXp))} / ${formatNumber(xpNeeded)}`;
    }
}

function updateProgress() {
    const current = snake.length;
    const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
    
    let max = 0;
    let isMax = false;

    if (prestigeLevel >= thresholds.length) {
        isMax = true;
    } else {
        max = thresholds[prestigeLevel];
    }

    if (isMax) {
        document.getElementById('progressFill').style.width = `100%`;
        document.getElementById('progressText').innerText = `MAX EVOLUTION`;
        document.getElementById('lblProgress').innerText = "Ultimate Snake";
    } else {
        const percent = Math.min((current / max) * 100, 100);
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressText').innerText = `${current} / ${max}`;
    }
}

function updateHearts() {
    const container = document.getElementById('heartsContainer');
    if (!container) return;
    container.innerHTML = '';
    const totalHearts = 1 + slayerUpgrades.maxHearts;
    
    for (let i = 0; i < totalHearts; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart-block';
        const isActive = i < currentHearts;
        heart.style.background = isActive ? 'linear-gradient(135deg, #ff3333, #ff1111)' : 'rgba(30, 30, 30, 0.6)';
        heart.style.boxShadow = isActive ? '0 0 8px #ff3333' : 'none';
        heart.style.borderColor = isActive ? '#ffaaaa' : '#444';
        
        container.appendChild(heart);
    }
}

function updateStaminaBar() {
    const fill = document.getElementById('staminaFill');
    if (fill) {
        const max = 100 + (slayerUpgrades.maxStamina * 20);
        const pct = Math.max(0, Math.min(100, (currentStamina / max) * 100));
        fill.style.width = `${pct}%`;
        
        if (typeof isExhausted !== 'undefined' && isExhausted) fill.style.background = '#777';
        else if (currentStamina < (max * 0.2)) fill.style.background = '#ff0000';
        else fill.style.background = 'linear-gradient(90deg, #ffff00, #ff9800)';
    }
}

function openSettings() {
    menuOverlay.classList.add('hidden');
    settingsOverlay.classList.remove('hidden');
    updateSettingsButtons();
}

function closeSettings() {
    window.hidePanel('settings-overlay');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('snakeSound', soundEnabled);
    updateSettingsButtons();
}

function toggleParticles() {
    particlesEnabled = !particlesEnabled;
    localStorage.setItem('snakeParticles', particlesEnabled);
    updateSettingsButtons();
}

function toggleRange() {
    showEatRange = !showEatRange;
    localStorage.setItem('snakeShowRange', showEatRange);
    updateSettingsButtons();
}

function toggleGlow() {
    glowEnabled = !glowEnabled;
    localStorage.setItem('snakeGlow', glowEnabled);
    updateSettingsButtons();
}

function toggleQuality() {
    lowQualityMode = !lowQualityMode;
    localStorage.setItem('snakeLowQuality', lowQualityMode);
    updateSettingsButtons();
}

function cycleBrightness() {
    brightnessLevel += 0.25;
    if (brightnessLevel > 1.5) brightnessLevel = 0.5;
    brightnessLevel = Math.round(brightnessLevel * 100) / 100;
    localStorage.setItem('snakeBrightness', brightnessLevel);
    updateSettingsButtons();
}

function updateSettingsButtons() {
    const t = TRANSLATIONS[currentLanguage];
    toggleSoundBtn.innerText = soundEnabled ? t.soundOn : t.soundOff;
    toggleParticlesBtn.innerText = particlesEnabled ? t.particlesOn : t.particlesOff;
    if(toggleRangeBtn) toggleRangeBtn.innerText = showEatRange ? t.rangeOn : t.rangeOff;
    if(toggleGlowBtn) toggleGlowBtn.innerText = glowEnabled ? t.glowOn : t.glowOff;
    if(toggleQualityBtn) toggleQualityBtn.innerText = lowQualityMode ? t.qualityLow : t.qualityHigh;
    if(toggleBrightnessBtn) toggleBrightnessBtn.innerText = `${t.brightness} ${Math.round(brightnessLevel * 100)}%`;
}


function showNotification(text, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2000',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);
    }

    const notif = document.createElement('div');
    notif.innerHTML = text;
    
    Object.assign(notif.style, {
        padding: '12px 24px',
        borderRadius: '12px',
        color: '#fff',
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        minWidth: '250px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    });

    if (type === 'success') {
        notif.style.background = 'linear-gradient(135deg, rgba(0, 200, 83, 0.9), rgba(0, 150, 36, 0.9))';
    } else if (type === 'error') {
        notif.style.background = 'linear-gradient(135deg, rgba(213, 0, 0, 0.9), rgba(150, 0, 0, 0.9))';
    } else if (type === 'warning') {
        notif.style.background = 'linear-gradient(135deg, rgba(255, 171, 0, 0.9), rgba(255, 140, 0, 0.9))';
        notif.style.color = '#000';
    } else {
        notif.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(25, 118, 210, 0.9))';
    }

    container.appendChild(notif);

    requestAnimationFrame(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notif.parentNode) notif.parentNode.removeChild(notif);
        }, 300);
    }, 2500);
}

function showConfirmation(text, onConfirm) {
    if (document.getElementById('custom-confirm-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: '3000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(5px)',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        padding: '30px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        maxWidth: '90%',
        width: '400px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transform: 'scale(0.8)',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

    const icon = document.createElement('div');
    icon.innerText = '⚠️';
    icon.style.fontSize = '50px';
    icon.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.innerText = text;
    Object.assign(msg.style, {
        color: '#fff',
        fontSize: '18px',
        marginBottom: '30px',
        lineHeight: '1.5',
        fontFamily: "'Segoe UI', sans-serif"
    });

    const btnContainer = document.createElement('div');
    Object.assign(btnContainer.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
    });

    const createBtn = (text, bg, onClick) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '12px 30px',
            border: 'none',
            borderRadius: '12px',
            background: bg,
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'transform 0.1s',
            flex: '1'
        });
        btn.onmousedown = () => btn.style.transform = 'scale(0.95)';
        btn.onmouseup = () => btn.style.transform = 'scale(1)';
        btn.onclick = onClick;
        return btn;
    };

    const close = () => {
        overlay.style.opacity = '0';
        box.style.transform = 'scale(0.8)';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 300);
    };

    const yesBtn = createBtn(TRANSLATIONS[currentLanguage].yes, 'linear-gradient(45deg, #00c853, #64dd17)', () => {
        close();
        if (onConfirm) onConfirm();
    });

    const noBtn = createBtn(TRANSLATIONS[currentLanguage].no, 'linear-gradient(45deg, #d50000, #ff1744)', () => {
        close();
    });

    btnContainer.appendChild(noBtn);
    btnContainer.appendChild(yesBtn);

    box.appendChild(icon);
    box.appendChild(msg);
    box.appendChild(btnContainer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'scale(1)';
    });
}

function showSaveIndicator() {
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        Object.assign(indicator.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '20px',
            color: '#00ff88',
            fontFamily: 'monospace',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #00ff88',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)',
            transition: 'opacity 0.5s ease'
        });
        document.body.appendChild(indicator);
    }
    indicator.innerHTML = '💾 ' + (TRANSLATIONS[currentLanguage].saving || "Saving...");
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 1500);
}

function setupResponsiveUI() {
    if (document.getElementById('responsive-ui-styles')) return;

    // 1. Inject CSS for PC Sidebar, Mobile Topbar, and Fixes
    const style = document.createElement('style');
    style.id = 'responsive-ui-styles';
    style.innerHTML = `
        /* --- Global Reset & Mobile Fixes --- */
        html, body {
            width: 100%; height: 100%; margin: 0; padding: 0;
            overflow: hidden; touch-action: none; /* Prevents scroll & zoom */
            user-select: none; -webkit-user-select: none;
            position: fixed; /* Prevents iOS scroll bounce */
            background: #000;
        }
        canvas { display: block; }

        /* --- Shared Styles --- */
        #game-stats-container {
            position: fixed;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
            font-family: 'Segoe UI', sans-serif;
            color: white;
            pointer-events: none;
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            text-shadow: 1px 1px 2px black;
            margin-bottom: 4px;
        }
        .stat-icon { width: 20px; text-align: center; font-size: 16px; }

        #evo-container {
            position: fixed;
            z-index: 900;
            background: rgba(0,0,0,0.5);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            overflow: hidden;
            pointer-events: none;
        }

        /* --- Overlays (Scrollable & Centered) --- */
        #menu-overlay, #shop-overlay, #slayer-shop-overlay, #guide-overlay, #settings-overlay, #rebirth-overlay, #pet-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            z-index: 2000;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
        }

        /* Scrollable Content Areas */
        #pet-items, #shop-items, #slayer-shop-items, #rebirth-items, #guide-items {
            max-height: 60vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            width: 100%;
            padding-right: 5px;
        }

        /* --- PC Layout (Sidebar) --- */
        @media (min-width: 769px) {
            #game-stats-container {
                top: 50px; /* Below FPS counter */
                left: 20px;
                display: flex;
                flex-direction: column;
                min-width: 160px;
            }
            #evo-container {
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 400px;
                height: 24px;
            }
        }

        /* --- Mobile Layout (Top Bar & Fixes) --- */
        @media (max-width: 768px) {
            #game-stats-container {
                top: env(safe-area-inset-top, 0); 
                left: 0; width: 100%;
                display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
                border-radius: 0; border: none; border-bottom: 1px solid rgba(255,255,255,0.1);
                padding: 4px;
                background: rgba(0,0,0,0.8);
            }
            .stat-item { font-size: 12px; margin-bottom: 0; }
            
            #evo-container {
                bottom: calc(60px + env(safe-area-inset-bottom, 10px)); 
                left: 50%; transform: translateX(-50%);
                width: 90%; height: 16px;
            }

            /* Mobile Fixes */
            #minimapCanvas { display: none !important; }
            
            /* Virtual Joystick Styles */
            #virtual-joystick-zone {
                position: fixed; 
                bottom: calc(30px + env(safe-area-inset-bottom, 0px)); 
                left: 30px; width: 120px; height: 120px;
                background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.15);
                border-radius: 50%; z-index: 9999; touch-action: none;
                display: flex; align-items: center; justifyContent: center; backdrop-filter: blur(2px);
            }
            #virtual-joystick-knob {
                width: 50px; height: 50px; background: rgba(0, 255, 255, 0.5);
                border-radius: 50%; pointer-events: none;
            }
            #mobile-boost-btn {
                position: fixed; 
                bottom: calc(50px + env(safe-area-inset-bottom, 0px)); 
                right: 30px; width: 80px; height: 80px;
                background: rgba(255, 50, 50, 0.4); border: 2px solid rgba(255, 50, 50, 0.6);
                border-radius: 50%; color: white; font-weight: bold; display: flex;
                align-items: center; justify-content: center; z-index: 9999; font-size: 24px;
            }

            /* Scale Menu Buttons */
            button {
                min-height: 44px; /* Touch target size */
                font-size: 16px;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. Restructure Stats (Move to Sidebar/Topbar)
    let statsContainer = document.getElementById('game-stats-container');
    if (!statsContainer) {
        statsContainer = document.createElement('div');
        statsContainer.id = 'game-stats-container';
        document.body.appendChild(statsContainer);

        const stats = [
            { id: 'score', icon: '🏆' },
            { id: 'levelDisplay', icon: '⭐' },
            { id: 'highScore', icon: '👑' },
            { id: 'coinsDisplay', icon: '💰' },
            { id: 'rpDisplay', icon: '🌀' },
            { id: 'soulsDisplay', icon: '👻' }
        ];

        stats.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) {
                const wrapper = document.createElement('div');
                wrapper.className = 'stat-item';
                wrapper.innerHTML = `<span class="stat-icon">${s.icon}</span>`;
                wrapper.appendChild(el); // Move element
                statsContainer.appendChild(wrapper);
            }
        });
    }

    // 3. Restructure Evolution Bar
    let evoContainer = document.getElementById('evo-container');
    if (!evoContainer) {
        evoContainer = document.createElement('div');
        evoContainer.id = 'evo-container';
        document.body.appendChild(evoContainer);

        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        if (fill) { fill.style.height = '100%'; evoContainer.appendChild(fill); }
        if (text) {
            Object.assign(text.style, {
                position: 'absolute', width: '100%', textAlign: 'center', top: '50%',
                transform: 'translateY(-50%)', color: '#fff', fontSize: '12px',
                fontWeight: 'bold', textShadow: '1px 1px 2px black'
            });
            evoContainer.appendChild(text);
        }
    }

    // 4. Mobile Controls (Only if Mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;
    if (isMobile && !document.getElementById('mobile-controls-container')) {
        injectMobileControls();
    }
}

function injectMobileControls() {
    // حاوية التحكم الكاملة
    const container = document.createElement('div');
    container.id = 'mobile-controls-container';
    Object.assign(container.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        zIndex: '9999', pointerEvents: 'none'
    });
    document.body.appendChild(container);

    // منطقة الحركة (النصف الأيسر من الشاشة)
    const moveZone = document.createElement('div');
    Object.assign(moveZone.style, {
        position: 'absolute', top: '0', left: '0', width: '50%', height: '100%',
        pointerEvents: 'auto', touchAction: 'none'
    });
    container.appendChild(moveZone);

    // عناصر الجويستيك (مخفية في البداية)
    const joyBase = document.createElement('div');
    Object.assign(joyBase.style, {
        position: 'absolute', width: '100px', height: '100px',
        borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        display: 'none', transform: 'translate(-50%, -50%)', pointerEvents: 'none'
    });
    container.appendChild(joyBase);

    const joyKnob = document.createElement('div');
    Object.assign(joyKnob.style, {
        position: 'absolute', width: '50px', height: '50px',
        borderRadius: '50%', background: 'rgba(0, 255, 255, 0.5)',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
        display: 'none', transform: 'translate(-50%, -50%)', pointerEvents: 'none'
    });
    container.appendChild(joyKnob);

    // زر السرعة (النصف الأيمن - زر ثابت)
    const sprintBtn = document.createElement('div');
    Object.assign(sprintBtn.style, {
        position: 'absolute', bottom: '60px', right: '40px', width: '90px', height: '90px',
        background: 'rgba(255, 50, 50, 0.3)', border: '3px solid rgba(255, 50, 50, 0.5)',
        borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '32px', pointerEvents: 'auto',
        touchAction: 'none', backdropFilter: 'blur(4px)', userSelect: 'none'
    });
    sprintBtn.innerHTML = '⚡';
    container.appendChild(sprintBtn);

    // منطق الجويستيك
    let joyStartX = 0, joyStartY = 0;
    let joyActive = false;
    let joyId = null;
    const maxDist = 40;

    moveZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joyId = touch.identifier;
        joyStartX = touch.clientX;
        joyStartY = touch.clientY;
        joyActive = true;

        // إظهار الجويستيك مكان اللمس
        joyBase.style.display = 'block';
        joyKnob.style.display = 'block';
        joyBase.style.left = joyStartX + 'px';
        joyBase.style.top = joyStartY + 'px';
        joyKnob.style.left = joyStartX + 'px';
        joyKnob.style.top = joyStartY + 'px';
        joyKnob.style.transform = `translate(-50%, -50%)`;
    }, { passive: false });

    moveZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!joyActive) return;
        
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joyId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return;

        let dx = touch.clientX - joyStartX;
        let dy = touch.clientY - joyStartY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // تقييد حركة المقبض داخل الدائرة
        let visualDx = dx;
        let visualDy = dy;
        if (dist > maxDist) {
            const ratio = maxDist / dist;
            visualDx *= ratio;
            visualDy *= ratio;
        }
        
        joyKnob.style.transform = `translate(calc(-50% + ${visualDx}px), calc(-50% + ${visualDy}px))`;

        // تحديد الاتجاه (مع عتبة بسيطة لمنع الاهتزاز)
        if (dist > 10) {
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
                else if (dx < 0 && velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
            } else {
                if (dy > 0 && velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
                else if (dy < 0 && velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
            }
        }
    }, { passive: false });

    const resetJoystick = (e) => {
        e.preventDefault();
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joyId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return;

        joyActive = false;
        joyId = null;
        joyBase.style.display = 'none';
        joyKnob.style.display = 'none';
    };

    moveZone.addEventListener('touchend', resetJoystick, { passive: false });
    moveZone.addEventListener('touchcancel', resetJoystick, { passive: false });

    // منطق زر السرعة
    sprintBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isSprinting = true;
        sprintBtn.style.background = 'rgba(255, 50, 50, 0.6)';
        sprintBtn.style.transform = 'scale(0.9)';
    }, { passive: false });

    sprintBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        isSprinting = false;
        sprintBtn.style.background = 'rgba(255, 50, 50, 0.3)';
        sprintBtn.style.transform = 'scale(1)';
    }, { passive: false });
}

window.setLanguage = setLanguage;
window.updateTexts = updateTexts;
window.updateScore = updateScore;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.toggleSound = toggleSound;
window.toggleParticles = toggleParticles;
window.toggleRange = toggleRange;
window.toggleGlow = toggleGlow;
window.toggleQuality = toggleQuality;
window.cycleBrightness = cycleBrightness;
window.showSaveIndicator = showSaveIndicator;
window.showNotification = showNotification;
window.showConfirmation = showConfirmation;
window.setupResponsiveUI = setupResponsiveUI;
