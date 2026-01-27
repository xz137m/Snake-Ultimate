document.addEventListener('DOMContentLoaded', () => {
    // 1. ربط المتغيرات العامة (من state.js) بعناصر HTML
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
    
    minimapCanvas = document.getElementById('minimapCanvas');
    if (minimapCanvas) {
        minimapCtx = minimapCanvas.getContext('2d');
    }

    // ربط عناصر الواجهة
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('highScore');
    coinsElement = document.getElementById('coinsDisplay');
    levelElement = document.getElementById('levelDisplay');
    rpElement = document.getElementById('rpDisplay');
    
    menuOverlay = document.getElementById('menu-overlay');
    shopOverlay = document.getElementById('shop-overlay');
    guideOverlay = document.getElementById('guide-overlay');
    settingsOverlay = document.getElementById('settings-overlay');
    rebirthOverlay = document.getElementById('rebirth-overlay');

    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    xpFill = document.getElementById('xpFill');
    xpText = document.getElementById('xpText');

    // ربط الأزرار بالدوال
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', startGame);

    document.getElementById('shopBtn').addEventListener('click', openShop);
    document.getElementById('guideBtn').addEventListener('click', openGuide);
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('resetBtn').addEventListener('click', resetGameProgress);
    document.getElementById('rebirthMenuBtn').addEventListener('click', openRebirth);
    
    document.getElementById('closeShopBtn').addEventListener('click', closeShop);
    document.getElementById('closeGuideBtn').addEventListener('click', closeGuide);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    
    toggleSoundBtn = document.getElementById('toggleSoundBtn');
    toggleSoundBtn.addEventListener('click', toggleSound);
    
    toggleParticlesBtn = document.getElementById('toggleParticlesBtn');
    toggleParticlesBtn.addEventListener('click', toggleParticles);
    
    toggleRangeBtn = document.getElementById('toggleRangeBtn');
    if(toggleRangeBtn) toggleRangeBtn.addEventListener('click', toggleRange);
    
    toggleGlowBtn = document.getElementById('toggleGlowBtn');
    if(toggleGlowBtn) toggleGlowBtn.addEventListener('click', toggleGlow);
    
    toggleBrightnessBtn = document.getElementById('toggleBrightnessBtn');
    if(toggleBrightnessBtn) toggleBrightnessBtn.addEventListener('click', cycleBrightness);

    document.getElementById('langEnBtn').addEventListener('click', () => setLanguage('en'));
    document.getElementById('langArBtn').addEventListener('click', () => setLanguage('ar'));

    // 2. الإعداد الأولي للعبة
    setLanguage(currentLanguage);
    initGame(); // تهيئة الثعبان والطعام
    // رسم إطار واحد لإظهار الخلفية والشبكة بدلاً من الشاشة السوداء
    if (typeof draw === 'function') requestAnimationFrame(draw);
});

// إضافة مستمعي الأحداث العامة
window.addEventListener('keydown', handleKeyPress);

// دعم اللمس
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, {passive: false});

document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });