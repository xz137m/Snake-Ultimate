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
    slayerShopOverlay = document.getElementById('slayer-shop-overlay');

    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    xpFill = document.getElementById('xpFill');
    xpText = document.getElementById('xpText');

    // ربط الأزرار بالدوال
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', startGame);

    // --- ربط أزرار القوائم الرئيسية ---
    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) shopBtn.addEventListener('click', () => window.openShop());

    const slayerShopBtn = document.getElementById('slayerShopBtn');
    if (slayerShopBtn) slayerShopBtn.addEventListener('click', () => window.openSlayerShop());

    const guideBtn = document.getElementById('guideBtn');
    if (guideBtn) guideBtn.addEventListener('click', () => window.openGuide());

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => window.openSettings());

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => window.resetGameProgress());

    const rebirthMenuBtn = document.getElementById('rebirthMenuBtn');
    if (rebirthMenuBtn) rebirthMenuBtn.addEventListener('click', () => window.openRebirth());
    
    // --- ربط أزرار الإغلاق ---
    const closeShopBtn = document.getElementById('closeShopBtn');
    if (closeShopBtn) closeShopBtn.addEventListener('click', () => {
        console.log('Shop Close Button Clicked!');
        window.hidePanel('shop-overlay');
    });
    
    const closeSlayerBtn = document.getElementById('closeSlayerShopBtn');
    if (closeSlayerBtn) closeSlayerBtn.addEventListener('click', () => {
        console.log('Slayer Shop Close Button Clicked!');
        window.hidePanel('slayer-shop-overlay');
    });
    
    const closeGuideBtn = document.getElementById('closeGuideBtn');
    if (closeGuideBtn) closeGuideBtn.addEventListener('click', () => {
        console.log('Guide Close Button Clicked!');
        window.hidePanel('guide-overlay');
    });
    
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => {
        console.log('Settings Close Button Clicked!');
        window.hidePanel('settings-overlay');
    });
    
    const closeRebirthBtn = document.getElementById('closeRebirthBtn');
    if (closeRebirthBtn) closeRebirthBtn.addEventListener('click', () => {
        console.log('Rebirth Close Button Clicked!');
        window.hidePanel('rebirth-overlay');
    });
    
    const doRebirthBtn = document.getElementById('doRebirthBtn');
    if (doRebirthBtn) doRebirthBtn.addEventListener('click', () => window.performRebirth());
    
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
window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        isSprinting = false;
    }
});
window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // منع تكرار الحدث عند التعليق على الزر
    if (e.key === 'Shift') {
        isSprinting = true;
    }
});

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
