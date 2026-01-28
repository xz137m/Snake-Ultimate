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

    // تشغيل خلفية الصفحة المتحركة
    initBackgroundAnimation();

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

// --- دالة تحريك خلفية الصفحة (خارج اللعبة) ---
function initBackgroundAnimation() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    // تتبع الماوس
    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        createParticles();
    }

    function createParticles() {
        particles = [];
        const count = Math.floor((width * height) / 9000); // زيادة الكثافة قليلاً
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2,
                alpha: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // رسم تدرج لوني هادئ
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0f172a'); // أزرق ليلي غامق
        grad.addColorStop(1, '#151b2e'); // أفتح قليلاً في الأسفل
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // رسم شبكة متحركة خفيفة جداً
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const time = Date.now() / 50;
        const gridSize = 80;
        
        ctx.beginPath();
        for (let x = (time % gridSize); x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = (time % gridSize); y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        // رسم الجسيمات والخطوط المتصلة
        particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.pulse += 0.05;
            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

            // تفاعل مع الماوس (هروب خفيف)
            if (mouse.x != null) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < 150) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (150 - distance) / 150;
                    p.vx -= forceDirectionX * force * 0.05;
                    p.vy -= forceDirectionY * force * 0.05;
                }
            }

            const alpha = p.alpha + Math.sin(p.pulse) * 0.1;
            ctx.fillStyle = `rgba(100, 200, 255, ${Math.max(0, alpha)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();

            // رسم خطوط بين النقاط القريبة
            for (let j = index + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dx = p.x - p2.x;
                let dy = p.y - p2.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.1 * (1 - dist/100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}
