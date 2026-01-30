
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
    
    updateSettingsButtons();
    updateScore();
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

    const yesBtn = createBtn('✅ Yes', 'linear-gradient(45deg, #00c853, #64dd17)', () => {
        close();
        if (onConfirm) onConfirm();
    });

    const noBtn = createBtn('❌ No', 'linear-gradient(45deg, #d50000, #ff1744)', () => {
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
