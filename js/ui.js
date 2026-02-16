// Cache frequently used elements to improve performance
const uiCache = {};
const $ = (id) => uiCache[id] || (uiCache[id] = document.getElementById(id));
const setTxt = (id, t) => { const el = $(id); if(el) el.innerText = t; };
const setStyle = (el, s) => Object.assign(el.style, s);
const mkDiv = (s, p, html) => { 
    const el = document.createElement('div'); 
    if(s) setStyle(el, s); 
    if(html) el.innerHTML = html; 
    if(p) p.appendChild(el); 
    return el; 
};

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('snakeLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    updateTexts();
}

function updateTexts() {
    const t = TRANSLATIONS[currentLanguage];
    const map = {
        lblScore: t.score, lblLevel: t.level, lblGold: t.gold, lblRP: t.rp, lblSouls: t.souls,
        lblHighScore: t.highScore, startBtn: t.play, shopBtn: t.shop, guideBtn: t.guide,
        settingsBtn: t.settings, resetBtn: t.reset, rebirthMenuBtn: t.rebirth, shopTitle: t.shopTitle,
        lblBalance: t.balance, closeShopBtn: t.close, rebirthTitle: t.rebirthTitle, closeRebirthBtn: t.close,
        guideTitle: t.guideTitle, closeGuideBtn: t.close, settingsTitle: t.settingsTitle, closeSettingsBtn: t.close,
        lblAudioGame: t.audioGame, lblGraphics: t.graphics, lblProgress: t.nextEvo, closeSlayerShopBtn: t.close,
        resumeBtn: t.resume, mainMenuBtn: t.mainMenu, pauseTitle: t.pauseTitle
    };
    for (const [id, txt] of Object.entries(map)) setTxt(id, txt);
    if($('menuInstructions')) $('menuInstructions').innerHTML = t.instructions;
    
    updateSettingsButtons();
    updateScore();
    if (window.updateKillCounter) window.updateKillCounter();
    updateProgress();
}

function updateScore() {
    setTxt('score', formatNumber(score));
    setTxt('highScore', formatNumber(highScore));
    setTxt('coinsDisplay', formatNumber(coins));
    setTxt('rpDisplay', formatNumber(rebirthPoints));
    setTxt('soulsDisplay', formatNumber(souls));
    setTxt('levelDisplay', playerLevel);
    updateHearts();
    updateStaminaBar();
    updateProgress();
}

function updateXpBar() {
    const cap = getCurrentLevelCap(), fill = $('xpFill'), txt = $('xpText');
    if (playerLevel >= cap) {
        if(fill) fill.style.width = '100%';
        const next = LEVEL_CAPS.find(t => t.limit > cap);
        if(txt) txt.innerText = next ? `CAP REACHED! Need ${formatNumber(next.req)} Score` : `MAX LEVEL REACHED`;
    } else {
        const need = Math.floor(1000 * Math.pow(playerLevel, 2.5));
        if(fill) fill.style.width = `${Math.min((currentXp / need) * 100, 100)}%`;
        if(txt) txt.innerText = `${formatNumber(Math.floor(currentXp))} / ${formatNumber(need)}`;
    }
}

function updateProgress() {
    const thres = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
    const max = prestigeLevel >= thres.length ? 0 : thres[prestigeLevel];
    const fill = $('progressFill'), txt = $('progressText');
    if (!max) {
        if(fill) fill.style.width = '100%';
        if(txt) txt.innerText = 'MAX EVOLUTION';
        setTxt('lblProgress', "Ultimate Snake");
    } else {
        if(fill) fill.style.width = `${Math.min((snake.length / max) * 100, 100)}%`;
        if(txt) txt.innerText = `${snake.length} / ${max}`;
    }
}

function updateHearts() {
    const c = $('heartsContainer');
    if (!c) return;
    c.innerHTML = '';
    for (let i = 0; i < 1 + slayerUpgrades.maxHearts; i++) {
        const active = i < currentHearts;
        mkDiv({
            background: active ? 'linear-gradient(135deg, #ff3333, #ff1111)' : 'rgba(30, 30, 30, 0.6)',
            boxShadow: active ? '0 0 8px #ff3333' : 'none',
            borderColor: active ? '#ffaaaa' : '#444',
            width: '20px', height: '20px', borderRadius: '4px', border: '2px solid', margin: '2px'
        }, c).className = 'heart-block';
    }
}

function updateStaminaBar() {
    const fill = $('staminaFill');
    if (!fill) return;
    const max = 100 + (slayerUpgrades.maxStamina * 20);
    fill.style.width = `${Math.max(0, Math.min(100, (currentStamina / max) * 100))}%`;
    fill.style.background = (typeof isExhausted !== 'undefined' && isExhausted) ? '#777' : (currentStamina < max * 0.2 ? '#ff0000' : 'linear-gradient(90deg, #ffff00, #ff9800)');
}

// Settings & Toggles
const toggleBool = (k, v) => { window[v] = !window[v]; localStorage.setItem(k, window[v]); updateSettingsButtons(); };
window.toggleSound = () => toggleBool('snakeSound', 'soundEnabled');
window.toggleParticles = () => toggleBool('snakeParticles', 'particlesEnabled');
window.toggleRange = () => toggleBool('snakeShowRange', 'showEatRange');
window.toggleGlow = () => toggleBool('snakeGlow', 'glowEnabled');
window.toggleQuality = () => toggleBool('snakeLowQuality', 'lowQualityMode');
window.cycleBrightness = () => {
    brightnessLevel = (brightnessLevel + 0.25 > 1.5) ? 0.5 : brightnessLevel + 0.25;
    localStorage.setItem('snakeBrightness', Math.round(brightnessLevel * 100) / 100);
    updateSettingsButtons();
};

function updateSettingsButtons() {
    const t = TRANSLATIONS[currentLanguage];
    setTxt('toggleSoundBtn', soundEnabled ? t.soundOn : t.soundOff);
    setTxt('toggleParticlesBtn', particlesEnabled ? t.particlesOn : t.particlesOff);
    setTxt('toggleRangeBtn', showEatRange ? t.rangeOn : t.rangeOff);
    setTxt('toggleGlowBtn', glowEnabled ? t.glowOn : t.glowOff);
    setTxt('toggleQualityBtn', lowQualityMode ? t.qualityLow : t.qualityHigh);
    setTxt('toggleBrightnessBtn', `${t.brightness} ${Math.round(brightnessLevel * 100)}%`);
}

function openSettings() { $('menu-overlay').classList.add('hidden'); $('settings-overlay').classList.remove('hidden'); updateSettingsButtons(); }
function closeSettings() { hidePanel('settings-overlay'); }

// Notifications & Confirmations
function showNotification(text, type = 'success') {
    let c = $('notification-container');
    if (!c) {
        c = mkDiv({ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: '2000', display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }, document.body);
        c.id = 'notification-container';
    }
    const bg = { success: 'linear-gradient(135deg, rgba(0, 200, 83, 0.9), rgba(0, 150, 36, 0.9))', error: 'linear-gradient(135deg, rgba(213, 0, 0, 0.9), rgba(150, 0, 0, 0.9))', warning: 'linear-gradient(135deg, rgba(255, 171, 0, 0.9), rgba(255, 140, 0, 0.9))' }[type] || 'linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(25, 118, 210, 0.9))';
    
    const n = mkDiv({
        padding: '12px 24px', borderRadius: '12px', color: type === 'warning' ? '#000' : '#fff', fontFamily: "'Segoe UI', sans-serif", fontWeight: 'bold', fontSize: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', opacity: '0', transform: 'translateY(-20px)', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.18)', minWidth: '250px', textAlign: 'center', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
    }, c, text);

    requestAnimationFrame(() => { setStyle(n, { opacity: '1', transform: 'translateY(0)' }); });
    setTimeout(() => { setStyle(n, { opacity: '0', transform: 'translateY(-20px)' }); setTimeout(() => n.remove(), 300); }, 2500);
}

function showConfirmation(text, onConfirm) {
    if ($('custom-confirm-overlay')) return;
    const ov = mkDiv({ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.8)', zIndex: '3000', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', opacity: '0', transition: 'opacity 0.3s ease' }, document.body);
    ov.id = 'custom-confirm-overlay';
    
    const box = mkDiv({ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center', maxWidth: '90%', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transform: 'scale(0.8)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }, ov);
    mkDiv({ fontSize: '50px', marginBottom: '15px' }, box, '⚠️');
    const msg = document.createElement('p');
    setStyle(msg, { color: '#fff', fontSize: '18px', marginBottom: '30px', lineHeight: '1.5', fontFamily: "'Segoe UI', sans-serif" });
    msg.innerText = text; box.appendChild(msg);

    const btns = mkDiv({ display: 'flex', justifyContent: 'center', gap: '15px' }, box);
    const mkBtn = (txt, bg, cb) => {
        const b = document.createElement('button');
        b.innerText = txt;
        setStyle(b, { padding: '12px 30px', border: 'none', borderRadius: '12px', background: bg, color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.1s', flex: '1' });
        b.onmousedown = () => b.style.transform = 'scale(0.95)';
        b.onmouseup = () => b.style.transform = 'scale(1)';
        b.onclick = () => { setStyle(ov, { opacity: '0' }); setStyle(box, { transform: 'scale(0.8)' }); setTimeout(() => ov.remove(), 300); if(cb) cb(); };
        btns.appendChild(b);
    };
    mkBtn(TRANSLATIONS[currentLanguage].no, 'linear-gradient(45deg, #d50000, #ff1744)');
    mkBtn(TRANSLATIONS[currentLanguage].yes, 'linear-gradient(45deg, #00c853, #64dd17)', onConfirm);

    requestAnimationFrame(() => { setStyle(ov, { opacity: '1' }); setStyle(box, { transform: 'scale(1)' }); });
}

function showSaveIndicator() {
    let ind = $('saveIndicator');
    if (!ind) {
        ind = mkDiv({ position: 'fixed', bottom: '20px', right: '20px', padding: '8px 16px', background: 'rgba(0, 0, 0, 0.6)', borderRadius: '20px', color: '#00ff88', fontFamily: 'monospace', fontSize: '14px', pointerEvents: 'none', zIndex: '1000', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #00ff88', boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)', transition: 'opacity 0.5s ease', opacity: '0' }, document.body);
        ind.id = 'saveIndicator';
    }
    ind.innerHTML = '💾 ' + (TRANSLATIONS[currentLanguage].saving || "Saving...");
    ind.style.opacity = '1';
    setTimeout(() => ind.style.opacity = '0', 1500);
}

function setupResponsiveUI() {
    if ($('responsive-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'responsive-ui-styles';
    style.innerHTML = `html,body{width:100%;height:100%;margin:0;padding:0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;position:fixed;background:#000}canvas{display:block;width:100%;height:100%;max-width:100vw;max-height:100vh;object-fit:contain}#game-stats-container{position:fixed;z-index:1000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;font-family:'Segoe UI',sans-serif;color:white;pointer-events:none}.stat-item{display:flex;align-items:center;gap:8px;font-size:14px;text-shadow:1px 1px 2px black;margin-bottom:4px}.stat-icon{width:20px;text-align:center;font-size:16px}#evo-container{position:fixed;z-index:900;background:rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.2);border-radius:12px;overflow:hidden;pointer-events:none}#menu-overlay,#shop-overlay,#slayer-shop-overlay,#guide-overlay,#settings-overlay,#rebirth-overlay,#pet-overlay{position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:2000;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}#pet-items,#shop-items,#slayer-shop-items,#rebirth-items,#guide-items{max-height:60vh;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;width:100%;padding-right:5px}@media(min-width:769px){#game-stats-container{top:50px;left:20px;display:flex;flex-direction:column;min-width:160px}#evo-container{bottom:20px;left:50%;transform:translateX(-50%);width:400px;height:24px}}@media(max-width:768px){#game-stats-container{top:env(safe-area-inset-top,0);left:0;width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:12px;border-radius:0;border:none;border-bottom:1px solid rgba(255,255,255,0.1);padding:4px;background:rgba(0,0,0,0.8)}.stat-item{font-size:12px;margin-bottom:0}#evo-container{bottom:calc(60px + env(safe-area-inset-bottom,10px));left:50%;transform:translateX(-50%);width:90%;height:16px}#minimapCanvas{display:none!important}#virtual-joystick-zone{position:fixed;bottom:calc(5vh + env(safe-area-inset-bottom,0px));left:5vw;width:18vmin;height:18vmin;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.15);border-radius:50%;z-index:9999;touch-action:none;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)}#virtual-joystick-knob{width:40%;height:40%;background:rgba(0,255,255,0.5);border-radius:50%;pointer-events:none}#mobile-boost-btn{position:fixed;bottom:calc(8vh + env(safe-area-inset-bottom,0px));right:5vw;width:12vmin;height:12vmin;background:rgba(255,50,50,0.4);border:2px solid rgba(255,50,50,0.6);border-radius:50%;color:white;font-weight:bold;display:flex;align-items:center;justify-content:center;z-index:9999;font-size:24px}button{min-height:44px;font-size:16px}}`;
    document.head.appendChild(style);

    let statsC = $('game-stats-container');
    if (!statsC) {
        statsC = mkDiv(null, document.body); statsC.id = 'game-stats-container';
        [{id:'score',i:'🏆'},{id:'levelDisplay',i:'⭐'},{id:'highScore',i:'👑'},{id:'coinsDisplay',i:'💰'},{id:'rpDisplay',i:'🌀'},{id:'soulsDisplay',i:'👻'}].forEach(s => {
            const el = $(s.id);
            if (el) {
                const w = mkDiv(null, statsC); w.className = 'stat-item';
                w.innerHTML = `<span class="stat-icon">${s.i}</span>`; w.appendChild(el);
            }
        });
    }

    let evoC = $('evo-container');
    if (!evoC) {
        evoC = mkDiv(null, document.body); evoC.id = 'evo-container';
        const fill = $('progressFill'), text = $('progressText');
        if (fill) { fill.style.height = '100%'; evoC.appendChild(fill); }
        if (text) { setStyle(text, { position: 'absolute', width: '100%', textAlign: 'center', top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '12px', fontWeight: 'bold', textShadow: '1px 1px 2px black' }); evoC.appendChild(text); }
    }

    if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800) && !$('mobile-controls-container')) injectMobileControls();
}

function injectMobileControls() {
    const c = mkDiv({ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', zIndex: '9999', pointerEvents: 'none' }, document.body);
    c.id = 'mobile-controls-container';
    const zone = mkDiv({ position: 'absolute', top: '0', left: '0', width: '50%', height: '100%', pointerEvents: 'auto', touchAction: 'none' }, c);
    
    const base = mkDiv({ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'none', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }, c);
    base.id = 'virtual-joystick-zone';
    const knob = mkDiv({ position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(0,255,255,0.5)', boxShadow: '0 0 15px rgba(0,255,255,0.4)', display: 'none', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }, c);
    knob.id = 'virtual-joystick-knob';
    
    const sprint = mkDiv({ position: 'absolute', bottom: '60px', right: '40px', width: '90px', height: '90px', background: 'rgba(255,50,50,0.3)', border: '3px solid rgba(255,50,50,0.5)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', pointerEvents: 'auto', touchAction: 'none', backdropFilter: 'blur(4px)', userSelect: 'none' }, c, '⚡');
    sprint.id = 'mobile-boost-btn';

    let jId = null, startX = 0, startY = 0;
    zone.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; jId = t.identifier; startX = t.clientX; startY = t.clientY; setStyle(base, { display: 'block', left: startX+'px', top: startY+'px' }); setStyle(knob, { display: 'block', left: startX+'px', top: startY+'px', transform: 'translate(-50%,-50%)' }); }, {passive:false});
    zone.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = Array.from(e.changedTouches).find(x => x.identifier === jId);
        if (!t) return;
        let dx = t.clientX - startX, dy = t.clientY - startY, dist = Math.sqrt(dx*dx+dy*dy);
        if (dist > 40) { const r = 40/dist; dx *= r; dy *= r; }
        knob.style.transform = `translate(calc(-50% + px), calc(-50% + px))`;
        if (dist > 10) {
            if (Math.abs(dx) > Math.abs(dy)) nextVelocity = { x: dx > 0 ? 1 : -1, y: 0 };
            else nextVelocity = { x: 0, y: dy > 0 ? 1 : -1 };
        }
    }, {passive:false});
    const end = e => { if (Array.from(e.changedTouches).some(x => x.identifier === jId)) { jId = null; base.style.display = 'none'; knob.style.display = 'none'; } };
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);

    sprint.addEventListener('touchstart', e => { e.preventDefault(); isSprinting = true; setStyle(sprint, { background: 'rgba(255,50,50,0.6)', transform: 'scale(0.9)' }); }, {passive:false});
    sprint.addEventListener('touchend', e => { e.preventDefault(); isSprinting = false; setStyle(sprint, { background: 'rgba(255,50,50,0.3)', transform: 'scale(1)' }); }, {passive:false});
}

// Exports
window.setLanguage = setLanguage; window.updateTexts = updateTexts; window.updateScore = updateScore;
window.openSettings = openSettings; window.closeSettings = closeSettings;
window.showSaveIndicator = showSaveIndicator; window.showNotification = showNotification; window.showConfirmation = showConfirmation;
window.setupResponsiveUI = setupResponsiveUI;
