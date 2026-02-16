document.addEventListener('DOMContentLoaded', () => {
    // Mobile Block: منع الجوالات وإظهار رسالة
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:99999;text-align:center;font-family:\'Segoe UI\', sans-serif;"><h1>⛔</h1><h2 style="margin:10px 0;color:#ff3333;">اللعبة مخصصة لأجهزة الكمبيوتر فقط</h2><h3 style="color:#aaa;">PC Only</h3></div>';
        return;
    }

    // 1. ربط المتغيرات العامة (الموجودة في state.js) بعناصر HTML
    // لا نستخدم var هنا لكي نحدث المتغيرات العامة مباشرة
    canvas = document.getElementById('gameCanvas');
    if (canvas) ctx = canvas.getContext('2d');
    
    minimapCanvas = document.getElementById('minimapCanvas');
    if (minimapCanvas) minimapCtx = minimapCanvas.getContext('2d');

    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('highScore'); // هذا هو الإصلاح: تحديث المتغير العام
    coinsElement = document.getElementById('coinsDisplay');
    levelElement = document.getElementById('levelDisplay');
    rpElement = document.getElementById('rpDisplay');
    
    menuOverlay = document.getElementById('menu-overlay');
    shopOverlay = document.getElementById('shop-overlay');
    guideOverlay = document.getElementById('guide-overlay');
    settingsOverlay = document.getElementById('settings-overlay');
    rebirthOverlay = document.getElementById('rebirth-overlay');
    slayerShopOverlay = document.getElementById('slayer-shop-overlay');
    // petOverlay handled dynamically

    progressFill = document.getElementById('progressFill');
    progressText = document.getElementById('progressText');
    xpFill = document.getElementById('xpFill');
    xpText = document.getElementById('xpText');

    // 2. ربط الأزرار بالدوال العامة (Window Functions)
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => window.startGame());

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
    
    const petMenuBtn = document.getElementById('petMenuBtn');
    if (petMenuBtn) petMenuBtn.addEventListener('click', () => window.openPetMenu());

    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.addEventListener('click', () => window.togglePause());

    const mainMenuBtn = document.getElementById('mainMenuBtn');
    if (mainMenuBtn) mainMenuBtn.addEventListener('click', () => location.reload());

    // أزرار الإغلاق
    const closeShopBtn = document.getElementById('closeShopBtn');
    if (closeShopBtn) closeShopBtn.addEventListener('click', () => window.hidePanel('shop-overlay'));
    
    const closeSlayerBtn = document.getElementById('closeSlayerShopBtn');
    if (closeSlayerBtn) closeSlayerBtn.addEventListener('click', () => window.hidePanel('slayer-shop-overlay'));
    
    const closeGuideBtn = document.getElementById('closeGuideBtn');
    if (closeGuideBtn) closeGuideBtn.addEventListener('click', () => window.hidePanel('guide-overlay'));
    
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => window.hidePanel('settings-overlay'));
    
    const closeRebirthBtn = document.getElementById('closeRebirthBtn');
    if (closeRebirthBtn) closeRebirthBtn.addEventListener('click', () => window.hidePanel('rebirth-overlay'));
    
    const doRebirthBtn = document.getElementById('doRebirthBtn');
    if (doRebirthBtn) doRebirthBtn.addEventListener('click', () => window.performRebirth());

    // Removed dynamic closePetBtn listener to avoid conflicts with HTML onclick
    // أزرار الإعدادات
    toggleSoundBtn = document.getElementById('toggleSoundBtn');
    if(toggleSoundBtn) toggleSoundBtn.addEventListener('click', window.toggleSound);
    
    toggleParticlesBtn = document.getElementById('toggleParticlesBtn');
    if(toggleParticlesBtn) toggleParticlesBtn.addEventListener('click', window.toggleParticles);
    
    toggleRangeBtn = document.getElementById('toggleRangeBtn');
    if(toggleRangeBtn) toggleRangeBtn.addEventListener('click', window.toggleRange);
    
    toggleGlowBtn = document.getElementById('toggleGlowBtn');
    if(toggleGlowBtn) toggleGlowBtn.addEventListener('click', window.toggleGlow);
    
    toggleQualityBtn = document.getElementById('toggleQualityBtn');
    if(toggleQualityBtn) toggleQualityBtn.addEventListener('click', window.toggleQuality);

    toggleBrightnessBtn = document.getElementById('toggleBrightnessBtn');
    if(toggleBrightnessBtn) toggleBrightnessBtn.addEventListener('click', window.cycleBrightness);

    if(document.getElementById('langEnBtn')) document.getElementById('langEnBtn').addEventListener('click', () => window.setLanguage('en'));
    if(document.getElementById('langArBtn')) document.getElementById('langArBtn').addEventListener('click', () => window.setLanguage('ar'));

    // 3. التهيئة الأولية
    initBackgroundAnimation();
    
    // Enforce Viewport Meta Tag for Mobile (Fixes Zoom & Scaling)
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = "viewport";
        document.head.appendChild(meta);
    }
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";

    // Dynamic Scaling for Mobile
    function resizeGame() {
        if (canvas) {
            // JS Resize Function: حساب الدقة الداخلية لضمان رؤية كاملة
            // نستخدم عرض منطقي لا يقل عن 1280 بكسل لضمان عدم تكبير اللعبة بشكل مبالغ فيه
            const minLogicalWidth = 1280; 
            const targetWidth = Math.max(window.innerWidth, minLogicalWidth);
            
            canvas.width = targetWidth;
            canvas.height = targetWidth / (window.innerWidth / window.innerHeight);
        }
    }
    window.addEventListener('resize', resizeGame);
    window.addEventListener('orientationchange', () => setTimeout(resizeGame, 200)); // Delay for iOS rotation
    resizeGame();

    // تطبيق اللغة وتحديث النصوص (بما في ذلك أعلى نقاط)
    if(typeof window.setLanguage === 'function') window.setLanguage(currentLanguage);
    
    // تحديث الواجهة فوراً للتأكد من ظهور الأرقام
    if(typeof window.updateScore === 'function') window.updateScore();
    
    // رسم إطار واحد للخلفية
    if (typeof draw === 'function') requestAnimationFrame(draw);
});

// --- وظائف الواجهة الخاصة (الخلفية والتحكم) ---

function initBackgroundAnimation() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
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
        const count = Math.floor((width * height) / 35000);
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
        if (typeof lowQualityMode !== 'undefined' && lowQualityMode) {
             ctx.clearRect(0, 0, width, height);
             ctx.fillStyle = '#0f172a';
             ctx.fillRect(0, 0, width, height);
             requestAnimationFrame(animate);
             return;
        }
        ctx.clearRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#151b2e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const time = Date.now() / 50;
        const gridSize = 80;
        
        ctx.beginPath();
        for (let x = (time % gridSize); x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = (time % gridSize); y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.pulse += 0.05;
            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

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
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
}
