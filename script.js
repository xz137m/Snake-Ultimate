document.addEventListener('DOMContentLoaded', () => {
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const coinsElement = document.getElementById('coinsDisplay');
const levelElement = document.getElementById('levelDisplay');
const menuOverlay = document.getElementById('menu-overlay');
const shopOverlay = document.getElementById('shop-overlay');
const guideOverlay = document.getElementById('guide-overlay');
const settingsOverlay = document.getElementById('settings-overlay');
const startBtn = document.getElementById('startBtn');
const shopBtn = document.getElementById('shopBtn');
const guideBtn = document.getElementById('guideBtn');
const settingsBtn = document.getElementById('settingsBtn');
const resetBtn = document.getElementById('resetBtn');
const closeShopBtn = document.getElementById('closeShopBtn');
const closeGuideBtn = document.getElementById('closeGuideBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const toggleSoundBtn = document.getElementById('toggleSoundBtn');
const toggleParticlesBtn = document.getElementById('toggleParticlesBtn');
const toggleRangeBtn = document.getElementById('toggleRangeBtn');
const langEnBtn = document.getElementById('langEnBtn');
const langArBtn = document.getElementById('langArBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const xpFill = document.getElementById('xpFill');
const xpText = document.getElementById('xpText');

// نظام الصوت (Web Audio API)
let audioCtx;

// إعدادات الشبكة
const GRID_SIZE = 20;
const TILE_COUNT_X = canvas.width / GRID_SIZE;
const TILE_COUNT_Y = canvas.height / GRID_SIZE;

// حدود التطويرات
const UPGRADE_LIMITS = {
    foodCount: TILE_COUNT_X * TILE_COUNT_Y,
    scoreMult: 10000,
    doublePoints: 10000,
    xpMult: 10000,
    growthBoost: 10,   // New: Hardest (Max 10)
    eatRange: 3,       // New: Super Hard (Max 3)
    luckBoost: 10      // New: Luck (Max 10)
};

// أسعار ثابتة للتطويرات الخاصة
const STATIC_COSTS = {
    eatRange: [
        1e12, // Level 1: 1T
        1e21, // Level 2: 1Sx
        1e36  // Level 3: 1UnD
    ],
    growthBoost: [
        1e8, 5e8, 1e9, 5e9, 1e10, 5e10, 1e11, 5e11, 1e12, 5e12 // 10 Levels (Cheaper & Closer)
    ]
};

// حدود المستويات (Level Caps)
const LEVEL_CAPS = [
    { limit: 15, req: 0 },
    { limit: 25, req: 1e15 },       // 1 Quadrillion (Harder)
    { limit: 40, req: 1e24 },       // 1 Septillion (Much Harder)
    { limit: 60, req: 1e36 },       // 1 Undecillion (Insane)
    { limit: 100, req: 1e50 }       // 1 Quindecillion (Impossible?)
];

// الألوان
const COLORS = {
    BACKGROUND: 'rgb(15, 21, 37)',
    GRID: 'rgb(42, 59, 90)',
    SNAKE_HEAD: 'rgb(0, 255, 136)',
    SNAKE_BODY: 'rgb(0, 204, 102)',
    FOOD: 'rgb(255, 51, 102)',
    FOOD_GLOW: 'rgb(255, 153, 204)'
};

const FRUIT_TYPES = [
    { name: 'Apple', color: 'rgb(255, 51, 102)', glow: 'rgb(255, 153, 204)', points: 25, gold: 2, xp: 5, growth: 1, reqLevel: 0 },
    { name: 'Orange', color: 'rgb(255, 200, 0)', glow: 'rgb(255, 230, 100)', points: 60, gold: 6, xp: 15, growth: 2, reqLevel: 0 },
    { name: 'Grape', color: 'rgb(180, 0, 255)', glow: 'rgb(220, 100, 255)', points: 200, gold: 15, xp: 50, growth: 5, reqLevel: 0 },
    { name: 'Diamond', color: 'rgb(0, 255, 255)', glow: 'rgb(150, 255, 255)', points: 1000, gold: 100, xp: 250, growth: 10, reqLevel: 0 },
    // New Fruits (Unlocked by Level)
    { name: 'Banana', color: 'rgb(255, 255, 0)', glow: 'rgb(255, 255, 150)', points: 5000, gold: 500, xp: 1000, growth: 15, reqLevel: 15 },
    { name: 'Plasma Berry', color: 'rgb(255, 0, 100)', glow: 'rgb(255, 100, 150)', points: 50000, gold: 5000, xp: 5000, growth: 20, reqLevel: 25 },
    { name: 'Void Fruit', color: 'rgb(50, 0, 100)', glow: 'rgb(100, 50, 200)', points: 1e6, gold: 1e5, xp: 50000, growth: 30, reqLevel: 40 },
    { name: 'Star Fragment', color: 'rgb(255, 255, 255)', glow: 'rgb(200, 200, 255)', points: 1e9, gold: 1e8, xp: 1e6, growth: 50, reqLevel: 60 },
    { name: 'Singularity', color: 'rgb(0, 0, 0)', glow: 'rgb(50, 50, 50)', points: 1e12, gold: 1e11, xp: 1e9, growth: 100, reqLevel: 100 }
];

const PRESTIGE_COLORS = [
    { name: 'Green Snake', head: 'rgb(0, 255, 136)', body: 'rgb(0, 204, 102)', reqLevel: 0 },
    { name: 'Blue Snake', head: 'rgb(0, 150, 255)', body: 'rgb(0, 100, 200)', reqLevel: 0 },
    { name: 'Red Snake', head: 'rgb(255, 50, 50)', body: 'rgb(200, 0, 0)', reqLevel: 0 },
    { name: 'Golden Snake', head: 'rgb(255, 215, 0)', body: 'rgb(200, 160, 0)', reqLevel: 0 },
    { name: 'Pink Snake', head: 'rgb(255, 0, 255)', body: 'rgb(200, 0, 200)', reqLevel: 0 },
    // New Colors (Unlocked by Level)
    { name: 'Neon Cyan', head: 'rgb(0, 255, 255)', body: 'rgb(0, 200, 200)', reqLevel: 15 },
    { name: 'Amethyst', head: 'rgb(153, 50, 204)', body: 'rgb(138, 43, 226)', reqLevel: 25 },
    { name: 'Magma', head: 'rgb(255, 69, 0)', body: 'rgb(139, 0, 0)', reqLevel: 40 },
    { name: 'Cyber Silver', head: 'rgb(192, 192, 192)', body: 'rgb(128, 128, 128)', reqLevel: 60 },
    { name: 'Cosmic Void', head: 'rgb(20, 20, 20)', body: 'rgb(50, 50, 50)', reqLevel: 100 }
];

// حالة اللعبة
let snake = [];
let particles = []; // مصفوفة الجسيمات
let foods = []; // مصفوفة الطعام
let velocity = { x: 0, y: 0 };
let nextVelocity = { x: 0, y: 0 };
let score = 0;
let growthBuffer = 0; // مخزون النمو المتبقي
let prestigeLevel = 0;
let playerLevel = Number(localStorage.getItem('snakePlayerLevel')) || 1;
let currentXp = Number(localStorage.getItem('snakeXp')) || 0;
let coins = Number(localStorage.getItem('snakeCoins')) || 0;
let highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
let upgrades = JSON.parse(localStorage.getItem('snakeUpgrades')) || {};
let soundEnabled = localStorage.getItem('snakeSound') !== 'false';
let particlesEnabled = localStorage.getItem('snakeParticles') !== 'false';
let showEatRange = localStorage.getItem('snakeShowRange') !== 'false';
let currentLanguage = localStorage.getItem('snakeLanguage') || 'en';

// ضمان وجود القيم الافتراضية للتطويرات
if (typeof upgrades.foodCount === 'undefined') upgrades.foodCount = 0;
if (typeof upgrades.scoreMult === 'undefined') upgrades.scoreMult = 0;
if (typeof upgrades.doublePoints === 'undefined') upgrades.doublePoints = 0;
if (typeof upgrades.xpMult === 'undefined') upgrades.xpMult = 0;
if (typeof upgrades.growthBoost === 'undefined') upgrades.growthBoost = 0;
if (typeof upgrades.eatRange === 'undefined') upgrades.eatRange = 0;
if (typeof upgrades.luckBoost === 'undefined') upgrades.luckBoost = 0;

let gameLoop;
let renderLoopId; // معرف حلقة الرسم
let isPaused = false;
let isGameOver = false;
let speed = 110; // Slower speed (was 80)

// قاموس الترجمة
const TRANSLATIONS = {
    en: {
        score: "Score:",
        level: "Level:",
        gold: "Gold:",
        highScore: "High Score:",
        play: "▶ Play",
        shop: "🛒 Shop",
        guide: "📜 Guide",
        settings: "⚙️ Settings",
        reset: "🗑️ Reset Data",
        gameOver: "Game Over!",
        finalScore: "Final Score:",
        goldEarned: "Gold Earned:",
        playAgain: "🔄 Play Again",
        mainMenu: "🏠 Main Menu",
        shopTitle: "🛒 Upgrade Shop",
        guideTitle: "📜 Game Guide",
        settingsTitle: "⚙️ Settings",
        balance: "Balance:",
        close: "❌ Close",
        soundOn: "🔊 Sound: ON",
        soundOff: "🔊 Sound: OFF",
        particlesOn: "✨ Particles: ON",
        particlesOff: "✨ Particles: OFF",
        rangeOn: "📏 Show Range: ON",
        rangeOff: "📏 Show Range: OFF",
        nextEvo: "Next Evolution (50 Length)",
        moreFood: "🍎 More Food",
        moreFoodDesc: "Increase max food on screen (+1)",
        scoreBonus: "💎 Score Bonus",
        scoreBonusDesc: "Increase base Score & Gold (+1%) [Max 300%]",
        globalMult: "⚡ Global Multiplier",
        globalMultDesc: "Multiply total Score & Gold (+1%) [Max 300%]",
        xpBonus: "🧠 XP Bonus",
        xpBonusDesc: "Increase XP gain (+1%) [Max 300%]",
        growthSurge: "💪 Growth Surge",
        growthSurgeDesc: "Gain extra length per fruit (+1 unit) [Max 10]",
        magnetRange: "🧲 Magnet Range",
        magnetRangeDesc: "Eat food from a distance (+1 block) [Max 3]",
        luckyCharm: "🍀 Lucky Charm",
        luckyCharmDesc: "Increase chance of Rare Fruits [Max 10]",
        buy: "Buy",
        max: "MAX",
        locked: "🔒 LOCKED",
        unlocked: "✅ UNLOCKED",
        req: "Requirement:",
        currentLevel: "Current Level:",
        levelEffect: "Each level doubles all Score and Gold (x2)",
        currentMult: "Current Multiplier:",
        fruitsSection: "🍎 Fruits (Current Values)",
        snakesSection: "🐍 Snakes (Evolution)",
        capsSection: "🔒 Level Caps (Requirements)",
        playerLevelSection: "⭐ Player Level (XP)",
        confirmReset: "Are you sure? This will wipe all your progress (Gold, Levels, Upgrades) forever!",
        paused: "⏸️ PAUSED",
        instructions: "Use WASD / Arrows to move<br>SPACE to Pause<br>Collect food to grow & earn gold"
    },
    ar: {
        score: "النقاط:",
        level: "المستوى:",
        gold: "الذهب:",
        highScore: "أعلى نقاط:",
        play: "▶ ابدأ اللعب",
        shop: "🛒 المتجر",
        guide: "📜 الدليل",
        settings: "⚙️ الإعدادات",
        reset: "🗑️ إعادة تعيين",
        gameOver: "خسرت!",
        finalScore: "النقاط النهائية:",
        goldEarned: "الذهب المكتسب:",
        playAgain: "🔄 العب مجدداً",
        mainMenu: "🏠 القائمة الرئيسية",
        shopTitle: "🛒 متجر التطويرات",
        guideTitle: "📜 دليل اللعبة",
        settingsTitle: "⚙️ الإعدادات",
        balance: "الرصيد:",
        close: "❌ إغلاق",
        soundOn: "🔊 الصوت: مفعل",
        soundOff: "🔊 الصوت: معطل",
        particlesOn: "✨ المؤثرات: مفعل",
        particlesOff: "✨ المؤثرات: معطل",
        rangeOn: "📏 المدى: مفعل",
        rangeOff: "📏 المدى: معطل",
        nextEvo: "التطور التالي (طول 50)",
        moreFood: "🍎 زيادة التفاح",
        moreFoodDesc: "زيادة عدد التفاح في الشاشة (+1)",
        scoreBonus: "💎 زيادة النقاط",
        scoreBonusDesc: "زيادة النقاط والذهب الأساسي (+1%) [حد 300%]",
        globalMult: "⚡ مضاعف شامل",
        globalMultDesc: "مضاعفة مجموع النقاط والذهب (+1%) [حد 300%]",
        xpBonus: "🧠 زيادة الخبرة",
        xpBonusDesc: "زيادة كسب الخبرة (+1%) [حد 300%]",
        growthSurge: "💪 طفرة النمو",
        growthSurgeDesc: "زيادة الطول لكل فاكهة (+1 وحدة) [حد 10]",
        magnetRange: "🧲 مدى المغناطيس",
        magnetRangeDesc: "أكل الطعام عن بعد (+1 مربع) [حد 3]",
        luckyCharm: "🍀 الحظ السعيد",
        luckyCharmDesc: "زيادة فرصة الفواكه النادرة [حد 10]",
        buy: "شراء",
        max: "الحد الأقصى",
        locked: "🔒 مغلق",
        unlocked: "✅ مفتوح",
        req: "المتطلبات:",
        currentLevel: "المستوى الحالي:",
        levelEffect: "كل مستوى يضاعف النقاط والذهب (x2)",
        currentMult: "المضاعف الحالي:",
        fruitsSection: "🍎 الفواكه (القيم الحالية)",
        snakesSection: "🐍 الثعابين (التطور)",
        capsSection: "🔒 حدود المستوى (المتطلبات)",
        playerLevelSection: "⭐ مستوى اللاعب (XP)",
        confirmReset: "هل أنت متأكد؟ سيتم مسح كل تقدمك (الذهب، المستوى، التطويرات) للأبد!",
        paused: "⏸️ موقوف",
        instructions: "استخدم WASD أو الأسهم للتحرك<br>SPACE للإيقاف<br>اجمع الطعام لتكبر وتكسب الذهب"
    }
};

// دالة تنسيق الأرقام الكبيرة
function formatNumber(num) {
    if (num === 0) return "0";
    if (num < 1000) return Math.floor(num).toString();
    
    const suffixes = [
        "", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De", 
        "UnD", "DoD", "TrD", "QaD", "QiD", "SxD", "SpD", "OcD", "NoD", "Vg", "Tg"
    ];
    
    const tier = Math.floor(Math.log10(num) / 3);
    
    if (tier <= 0) return Math.floor(num).toString();
    if (tier >= suffixes.length) return num.toExponential(2);
    
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    
    return scaled.toFixed(2) + suffix;
}

// دالة حساب سقف المستوى الحالي
function getCurrentLevelCap() {
    // نتحقق من أعلى سكور وصل له اللاعب (سواء المخزن أو الحالي)
    let bestScore = Math.max(score, highScore);
    let cap = LEVEL_CAPS[0].limit;
    
    for (let i = 0; i < LEVEL_CAPS.length; i++) {
        if (bestScore >= LEVEL_CAPS[i].req) {
            cap = LEVEL_CAPS[i].limit;
        }
    }
    return cap;
}

// تهيئة العرض
highScoreElement.innerText = formatNumber(highScore);
coinsElement.innerText = formatNumber(coins);
levelElement.innerText = playerLevel;

// مستمعات الأحداث
startBtn.addEventListener('click', startGame);
shopBtn.addEventListener('click', openShop);
guideBtn.addEventListener('click', openGuide);
settingsBtn.addEventListener('click', openSettings);
resetBtn.addEventListener('click', resetGameProgress);
closeShopBtn.addEventListener('click', closeShop);
closeGuideBtn.addEventListener('click', closeGuide);
closeSettingsBtn.addEventListener('click', closeSettings);
toggleSoundBtn.addEventListener('click', toggleSound);
toggleParticlesBtn.addEventListener('click', toggleParticles);
if(toggleRangeBtn) toggleRangeBtn.addEventListener('click', toggleRange);
langEnBtn.addEventListener('click', () => setLanguage('en'));
langArBtn.addEventListener('click', () => setLanguage('ar'));
document.addEventListener('keydown', handleKeyPress);

// دعم اللمس (Touch Support)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, {passive: false});

// منع التمرير عند اللعب باللمس
document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

// دالة تشغيل الأصوات
function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        if (type === 'eat') {
            osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'over') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        }
    } catch (e) {
        console.error("Audio Error:", e);
    }
}

// دالة إنشاء الجسيمات (انفجار)
function createParticles(x, y, color) {
    if (!particlesEnabled) return;
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color
        });
    }
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('snakeLanguage', lang);
    
    // تحديث اتجاه الصفحة
    document.documentElement.lang = lang;
    // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; // يمكن تفعيلها إذا أردت قلب التصميم

    updateTexts();
}

function updateTexts() {
    const t = TRANSLATIONS[currentLanguage];
    
    document.getElementById('lblScore').innerText = t.score;
    document.getElementById('lblLevel').innerText = t.level;
    document.getElementById('lblGold').innerText = t.gold;
    document.getElementById('lblHighScore').innerText = t.highScore;
    
    document.getElementById('startBtn').innerText = t.play;
    document.getElementById('shopBtn').innerText = t.shop;
    document.getElementById('guideBtn').innerText = t.guide;
    document.getElementById('settingsBtn').innerText = t.settings;
    document.getElementById('resetBtn').innerText = t.reset;
    document.getElementById('menuInstructions').innerHTML = t.instructions;
    
    document.getElementById('shopTitle').innerText = t.shopTitle;
    document.getElementById('lblBalance').innerText = t.balance;
    document.getElementById('closeShopBtn').innerText = t.close;
    
    document.getElementById('guideTitle').innerText = t.guideTitle;
    document.getElementById('closeGuideBtn').innerText = t.close;
    
    document.getElementById('settingsTitle').innerText = t.settingsTitle;
    document.getElementById('closeSettingsBtn').innerText = t.close;
    
    document.getElementById('lblProgress').innerText = t.nextEvo;
    
    updateSettingsButtons();
}

function resetGameProgress() {
    if(confirm(TRANSLATIONS[currentLanguage].confirmReset)) {
        localStorage.clear();
        location.reload();
    }
}

function initGame() {
    snake = [{ x: 10, y: 10 }];
    particles = [];
    foods = [];
    velocity = { x: 1, y: 0 };
    nextVelocity = { x: 1, y: 0 };
    score = 0;
    growthBuffer = 0;
    prestigeLevel = 0;
    speed = 110;
    isPaused = false;
    isGameOver = false;
    
    // عدد التفاح الأساسي 3 + الترقيات
    const foodCount = 3 + upgrades.foodCount;
    for(let i=0; i<foodCount; i++) {
        placeFood();
    }
    
    updateScore();
    updateProgress();
    updateXpBar();
}

function placeFood() {
    // تحديد الفواكه المفتوحة بناءً على المستوى
    const unlockedIndices = [];
    for(let i=0; i<FRUIT_TYPES.length; i++) {
        if(playerLevel >= FRUIT_TYPES[i].reqLevel) {
            unlockedIndices.push(i);
        }
    }

    // اختيار عشوائي مرجح (الفواكه الأقوى أندر قليلاً)
    let totalWeight = 0;
    
    // Luck Logic: Reduces the rarity decay based on luck level
    // Base decay is 1.2. Max luck (10) reduces it to ~1.0 (equal chance)
    let decay = Math.max(1.01, 1.2 - (upgrades.luckBoost * 0.02));

    const weights = unlockedIndices.map(i => {
        const w = 100 / Math.pow(decay, i); 
        totalWeight += w;
        return w;
    });

    let randomVal = Math.random() * totalWeight;
    let type = unlockedIndices[0];
    
    for(let i=0; i<weights.length; i++) {
        randomVal -= weights[i];
        if(randomVal <= 0) {
            type = unlockedIndices[i];
            break;
        }
    }

    let newFood = {
        x: Math.floor(Math.random() * TILE_COUNT_X),
        y: Math.floor(Math.random() * TILE_COUNT_Y),
        type: type
    };
    
    // التأكد من عدم ظهور الطعام فوق الثعبان
    for (let part of snake) {
        if (part.x === newFood.x && part.y === newFood.y) {
            return placeFood();
        }
    }
    foods.push(newFood);
}

function startGame() {
    menuOverlay.classList.add('hidden');
    initGame();
    
    // تشغيل الصوت (للتأكد من تفعيل السياق الصوتي)
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (gameLoop) clearInterval(gameLoop);
    if (renderLoopId) cancelAnimationFrame(renderLoopId);
    
    gameLoop = setInterval(updateSnake, speed); // حلقة المنطق (تعتمد على السرعة)
    renderLoop(); // حلقة الرسم (سلسة دائماً)
}

function gameOver() {
    clearInterval(gameLoop);
    cancelAnimationFrame(renderLoopId);
    isGameOver = true;
    playSound('over');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.innerText = highScore;
    }

    const t = TRANSLATIONS[currentLanguage];
    menuOverlay.innerHTML = `
        <h1 style="color: #ff3366">${t.gameOver}</h1>
        <p>${t.finalScore} ${formatNumber(score)}</p>
        <p style="color: #ffd700">${t.goldEarned} ${formatNumber(coins)}</p>
        <button onclick="startGame()">${t.playAgain}</button>
        <button onclick="location.reload()">${t.mainMenu}</button>
    `;
    menuOverlay.classList.remove('hidden');
}

// تحديث منطق الثعبان فقط
function updateSnake() {
    if (isPaused) return;

    velocity = { ...nextVelocity };
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // التفاف حول الجدران
    if (head.x < 0) head.x = TILE_COUNT_X - 1;
    if (head.x >= TILE_COUNT_X) head.x = 0;
    if (head.y < 0) head.y = TILE_COUNT_Y - 1;
    if (head.y >= TILE_COUNT_Y) head.y = 0;

    // التحقق من التصادم مع الذات
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // التحقق من أكل أي تفاحة
    let eatenIndex = -1;
    let range = upgrades.eatRange; // 0 to 3
    for (let i = 0; i < foods.length; i++) {
        let dx = foods[i].x - head.x;
        let dy = foods[i].y - head.y;
        let isDirectHit = (head.x === foods[i].x && head.y === foods[i].y);
        let inRange = false;

        // التحقق من وجود الطعام أمام الوجه بناءً على الاتجاه
        if (velocity.x === 1) inRange = (dx >= 1 && dx <= range) && (Math.abs(dy) <= range);       // يمين
        else if (velocity.x === -1) inRange = (dx >= -range && dx <= -1) && (Math.abs(dy) <= range); // يسار
        else if (velocity.y === 1) inRange = (dy >= 1 && dy <= range) && (Math.abs(dx) <= range);    // تحت
        else if (velocity.y === -1) inRange = (dy >= -range && dy <= -1) && (Math.abs(dx) <= range); // فوق

        if (isDirectHit || inRange) {
            eatenIndex = i;
            break;
        }
    }

    if (eatenIndex !== -1) {
        let fruit = FRUIT_TYPES[foods[eatenIndex].type];
        let prestigeMult = Math.pow(2, prestigeLevel); // مضاعفة حسب مستوى التطور
        let shopMult = (1 + Math.min(upgrades.doublePoints, 300) * 0.01); // زيادة 1% لكل مستوى (حد أقصى 300%)
        let levelMult = Math.pow(2, playerLevel - 1); // مضاعفة بحسب مضاعفات الاثنين
        let xpUpgradeMult = (1 + Math.min(upgrades.xpMult, 300) * 0.01); // زيادة 1% لكل مستوى (حد أقصى 300%)

        // حساب النقاط والذهب
        let scoreUpgrade = (1 + Math.min(upgrades.scoreMult, 300) * 0.01);
        let points = (fruit.points * scoreUpgrade) * shopMult * prestigeMult * levelMult;
        let gold = (fruit.gold * scoreUpgrade) * shopMult * prestigeMult * levelMult;
        let xpGain = fruit.xp * prestigeMult * xpUpgradeMult; // الـ XP يتأثر بالتطور وتطويرة الـ XP فقط
        
        score += Math.floor(points);
        coins += Math.floor(gold);
        
        // نظام XP
        let currentCap = getCurrentLevelCap();
        if (playerLevel < currentCap) {
            currentXp += Math.floor(xpGain);
            let xpNeeded = Math.floor(100 * Math.pow(1.2, playerLevel - 1)); // صعوبة متزايدة (أسية)
            if (currentXp >= xpNeeded) {
                currentXp -= xpNeeded;
                playerLevel++;
                playSound('eat'); // صوت عند ارتفاع المستوى
            }
        }

        localStorage.setItem('snakePlayerLevel', playerLevel);
        localStorage.setItem('snakeXp', currentXp);
        localStorage.setItem('snakeCoins', coins);
        
        updateScore();
        updateXpBar();
        updateProgress();
        
        // إضافة النمو للمخزون (نطرح 1 لأن الإطار الحالي يضيف 1 تلقائياً بعدم الحذف)
        // Growth Boost adds extra units per fruit
        growthBuffer += (fruit.growth + upgrades.growthBoost - 1);

        playSound('eat');
        // إنشاء جسيمات في موقع الطعام
        createParticles(
            foods[eatenIndex].x * GRID_SIZE + GRID_SIZE/2, 
            foods[eatenIndex].y * GRID_SIZE + GRID_SIZE/2, 
            fruit.color
        );
        
        foods.splice(eatenIndex, 1); // حذف التفاحة المأكولة
        placeFood();
        
        // زيادة السرعة
        if (score % 50 === 0 && speed > 30) {
            clearInterval(gameLoop);
            speed -= 2;
            gameLoop = setInterval(updateSnake, speed);
        }

        // التحقق من التطور (Prestige) عند طول 50
        if (snake.length >= 50) {
            snake = [snake[0]]; // إعادة الثعبان صغيراً (الرأس فقط)
            prestigeLevel++;    // زيادة المستوى
            playSound('eat');   // صوت للتنبيه
            updateProgress();
        }
    } else {
        // إذا كان هناك نمو متبقي، لا نحذف الذيل
        if (growthBuffer > 0) {
            growthBuffer--;
        } else {
            snake.pop();
        }
    }
}

// --- نظام الإعدادات ---
function openSettings() {
    menuOverlay.classList.add('hidden');
    settingsOverlay.classList.remove('hidden');
    updateSettingsButtons();
}

function closeSettings() {
    settingsOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
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

function updateSettingsButtons() {
    const t = TRANSLATIONS[currentLanguage];
    toggleSoundBtn.innerText = soundEnabled ? t.soundOn : t.soundOff;
    toggleParticlesBtn.innerText = particlesEnabled ? t.particlesOn : t.particlesOff;
    if(toggleRangeBtn) toggleRangeBtn.innerText = showEatRange ? t.rangeOn : t.rangeOff;
}

// حلقة الرسم وتحديث الجسيمات (تعمل بـ 60 إطار)
function renderLoop() {
    if (isGameOver) return;
    
    renderLoopId = requestAnimationFrame(renderLoop);
    
    if (!isPaused) {
        updateParticles();
    }
    draw();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04; // سرعة اختفاء الجسيمات
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    // الخلفية
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الشبكة
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // رسم مدى الأكل (Magnet Range Indicator)
    if (showEatRange && upgrades.eatRange > 0 && snake.length > 0) {
        const head = snake[0];
        const range = upgrades.eatRange;
        
        let rx, ry, rw, rh;
        
        if (velocity.x === 1) { // يمين
            rx = (head.x + 1) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE;
            rw = range * GRID_SIZE; rh = (range * 2 + 1) * GRID_SIZE;
        } else if (velocity.x === -1) { // يسار
            rx = (head.x - range) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE;
            rw = range * GRID_SIZE; rh = (range * 2 + 1) * GRID_SIZE;
        } else if (velocity.y === 1) { // تحت
            rx = (head.x - range) * GRID_SIZE; ry = (head.y + 1) * GRID_SIZE;
            rw = (range * 2 + 1) * GRID_SIZE; rh = range * GRID_SIZE;
        } else if (velocity.y === -1) { // فوق
            rx = (head.x - range) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE;
            rw = (range * 2 + 1) * GRID_SIZE; rh = range * GRID_SIZE;
        }

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // خط متقطع
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
    }

    // الطعام
    foods.forEach(f => {
        const type = FRUIT_TYPES[f.type];
        const pulse = Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = type.color;
        ctx.shadowColor = type.glow;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(
            f.x * GRID_SIZE + GRID_SIZE/2, 
            f.y * GRID_SIZE + GRID_SIZE/2, 
            GRID_SIZE/2 - 2 + pulse, 
            0, Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // رسم الجسيمات
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // الثعبان
    const unlockedColors = PRESTIGE_COLORS.filter(c => playerLevel >= c.reqLevel);
    const currentColors = unlockedColors[prestigeLevel % unlockedColors.length];
    snake.forEach((part, index) => {
        const x = part.x * GRID_SIZE;
        const y = part.y * GRID_SIZE;

        if (index === 0) {
            // الرأس
            ctx.fillStyle = currentColors.head;
            ctx.shadowColor = currentColors.head;
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
            ctx.shadowBlur = 0;
            
            // العيون
            ctx.fillStyle = 'black';
            const eyeSize = 4;
            if (velocity.x === 1) { // يمين
                ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
            } else if (velocity.x === -1) { // يسار
                ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
            } else if (velocity.y === -1) { // فوق
                ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
            } else { // تحت
                ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
                ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
            }
        } else {
            // الجسم
            ctx.fillStyle = currentColors.body;
            ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    });

    // رسم نص التوقف
    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(TRANSLATIONS[currentLanguage].paused, canvas.width / 2, canvas.height / 2);
    }
}

function updateScore() {
    scoreElement.innerText = formatNumber(score);
    coinsElement.innerText = formatNumber(coins);
    levelElement.innerText = playerLevel;
    updateXpBar();
}

function updateXpBar() {
    let currentCap = getCurrentLevelCap();
    
    if (playerLevel >= currentCap) {
        if(xpFill) xpFill.style.width = `100%`;
        let nextTier = LEVEL_CAPS.find(t => t.limit > currentCap);
        let msg = nextTier ? `CAP REACHED! Need ${formatNumber(nextTier.req)} Score` : `MAX LEVEL REACHED`;
        if(xpText) xpText.innerText = msg;
    } else {
        let xpNeeded = Math.floor(100 * Math.pow(1.2, playerLevel - 1));
        let percent = Math.min((currentXp / xpNeeded) * 100, 100);
        if(xpFill) xpFill.style.width = `${percent}%`;
        if(xpText) xpText.innerText = `${formatNumber(Math.floor(currentXp))} / ${formatNumber(xpNeeded)}`;
    }
}

function updateProgress() {
    const current = snake.length;
    const max = 50;
    const percent = Math.min((current / max) * 100, 100);
    progressFill.style.width = `${percent}%`;
    progressText.innerText = `${current}/${max}`;
}

function handleKeyPress(e) {
    // استخدام e.code بدلاً من e.key لدعم جميع لغات لوحة المفاتيح (عربي/إنجليزي)
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
            break;
        case 'Space':
            if (!isGameOver) isPaused = !isPaused;
            break;
    }
}

function handleSwipe(startX, startY, endX, endY) {
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // حركة أفقية
        if (diffX > 0 && velocity.x !== -1) nextVelocity = { x: 1, y: 0 };
        else if (diffX < 0 && velocity.x !== 1) nextVelocity = { x: -1, y: 0 };
    } else {
        // حركة عمودية
        if (diffY > 0 && velocity.y !== -1) nextVelocity = { x: 0, y: 1 };
        else if (diffY < 0 && velocity.y !== 1) nextVelocity = { x: 0, y: -1 };
    }
}

// --- نظام المتجر ---
function openShop() {
    menuOverlay.classList.add('hidden');
    shopOverlay.classList.remove('hidden');
    renderShopItems();
}

function closeShop() {
    shopOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
}

// --- نظام الدليل ---
function openGuide() {
    menuOverlay.classList.add('hidden');
    guideOverlay.classList.remove('hidden');
    renderGuideItems();
}

function closeGuide() {
    guideOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
}

function renderGuideItems() {
    const container = document.getElementById('guide-items');
    container.innerHTML = '';
    const t = TRANSLATIONS[currentLanguage];
    
    let prestigeMult = Math.pow(2, prestigeLevel);
    let shopMult = (1 + Math.min(upgrades.doublePoints, 300) * 0.01);
    let levelMult = Math.pow(2, playerLevel - 1);
    let xpUpgradeMult = (1 + Math.min(upgrades.xpMult, 300) * 0.01);

    // قسم المستوى (شرح الفائدة)
    const levelHeader = document.createElement('h2');
    levelHeader.className = 'guide-section-title';
    levelHeader.innerText = t.playerLevelSection;
    container.appendChild(levelHeader);

    const levelDiv = document.createElement('div');
    levelDiv.className = 'shop-item';
    levelDiv.style.borderColor = '#00ffff';
    levelDiv.style.gridColumn = '1 / -1'; // عرض كامل
    levelDiv.innerHTML = `
        <h3 style="color: #00ffff">${t.currentLevel} ${playerLevel}</h3>
        <p>${t.levelEffect}</p>
        <p>${t.currentMult} <span style="color: #ffd700">x${formatNumber(levelMult)}</span>!</p>
    `;
    container.appendChild(levelDiv);

    // قسم حدود المستوى
    const capHeader = document.createElement('h2');
    capHeader.className = 'guide-section-title';
    capHeader.innerText = t.capsSection;
    container.appendChild(capHeader);

    LEVEL_CAPS.forEach(tier => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        let isUnlocked = Math.max(score, highScore) >= tier.req;
        div.style.borderColor = isUnlocked ? '#00ff00' : '#ff3366';
        div.innerHTML = `
            <h3 style="color: ${isUnlocked ? '#00ff00' : '#ff3366'}">Max Level: ${tier.limit}</h3>
            <p>${t.req}</p>
            <p style="color: #ffd700">${formatNumber(tier.req)} Score</p>
            <p>${isUnlocked ? t.unlocked : t.locked}</p>
        `;
        container.appendChild(div);
    });

    // قسم الفواكه
    const fruitHeader = document.createElement('h2');
    fruitHeader.className = 'guide-section-title';
    fruitHeader.innerText = t.fruitsSection;
    container.appendChild(fruitHeader);

    FRUIT_TYPES.forEach(fruit => {
        // حساب القيم الحالية بناءً على التطويرات
        let scoreUpgrade = (1 + Math.min(upgrades.scoreMult, 300) * 0.01);
        let currentPoints = (fruit.points * scoreUpgrade) * shopMult * prestigeMult * levelMult;
        let currentGold = (fruit.gold * scoreUpgrade) * shopMult * prestigeMult * levelMult;
        let currentXp = fruit.xp * prestigeMult * xpUpgradeMult;
        
        let isUnlocked = playerLevel >= fruit.reqLevel;

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = isUnlocked ? fruit.color : '#555';
        div.style.opacity = isUnlocked ? '1' : '0.5';
        div.innerHTML = `
            <h3 style="color: ${fruit.color}">${fruit.name} ${!isUnlocked ? t.locked : ''}</h3>
            ${!isUnlocked ? `<p style="color: #ff3366">Level ${fruit.reqLevel}</p>` : ''}
            <div style="width: 20px; height: 20px; background: ${fruit.color}; border-radius: 50%; margin: 10px auto; box-shadow: 0 0 10px ${fruit.glow}"></div>
            <p>Growth: +${fruit.growth}</p>
            <p>Score: ${formatNumber(Math.floor(currentPoints))}</p>
            <p>XP: ${formatNumber(Math.floor(currentXp))}</p>
            <p>Gold: ${formatNumber(Math.floor(currentGold))}</p>
        `;
        container.appendChild(div);
    });

    // قسم الثعابين
    const snakeHeader = document.createElement('h2');
    snakeHeader.className = 'guide-section-title';
    snakeHeader.innerText = t.snakesSection;
    container.appendChild(snakeHeader);

    PRESTIGE_COLORS.forEach((snakeType, index) => {
        let isUnlocked = playerLevel >= snakeType.reqLevel;
        const mult = Math.pow(2, index); // This logic might need adjustment if index changes based on filter, but for guide we show all.
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.style.borderColor = isUnlocked ? snakeType.head : '#555';
        div.style.opacity = isUnlocked ? '1' : '0.5';
        div.innerHTML = `
            <h3 style="color: ${snakeType.head}">${snakeType.name} ${!isUnlocked ? t.locked : ''}</h3>
            ${!isUnlocked ? `<p style="color: #ff3366">Level ${snakeType.reqLevel}</p>` : ''}
            <div style="width: 40px; height: 40px; background: ${snakeType.body}; border: 4px solid ${snakeType.head}; margin: 10px auto;"></div>
            <p>Multiplier: x${mult}</p>
            <p>XP Multiplier: x${mult}</p>
            <p>${index === 0 ? 'Starter' : 'Evolution Tier ' + index}</p>
        `;
        container.appendChild(div);
    });
}
 
// Function to calculate upgrade cost (Iterative based on cumulative percentage)
function getUpgradeCost(baseCost, currentLevel, id) {
    // التحقق من وجود سعر ثابت
    if (STATIC_COSTS[id]) {
        return STATIC_COSTS[id][currentLevel] || Infinity; // Infinity if maxed
    }

    let cost = baseCost;
    for (let i = 0; i < currentLevel; i++) {
        let percentage = Math.min(50 + i, 300);
        cost = cost * (1 + percentage / 100);
    }
    return cost;
}

function renderShopItems() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    const t = TRANSLATIONS[currentLanguage];
    
    // تحديث عرض الرصيد في المتجر
    document.getElementById('shopCoins').innerText = formatNumber(coins);

    const items = [
        {
            id: 'foodCount',
            baseCost: 10,
            name: t.moreFood,
            desc: t.moreFoodDesc,
            level: upgrades.foodCount,
            maxLevel: UPGRADE_LIMITS.foodCount,
            cost: getUpgradeCost(10, upgrades.foodCount, 'foodCount')
        },
        {
            id: 'scoreMult',
            baseCost: 25,
            name: t.scoreBonus,
            desc: t.scoreBonusDesc,
            level: upgrades.scoreMult,
            maxLevel: UPGRADE_LIMITS.scoreMult,
            cost: getUpgradeCost(25, upgrades.scoreMult, 'scoreMult')
        },
        {
            id: 'doublePoints',
            baseCost: 100,
            name: t.globalMult,
            desc: t.globalMultDesc,
            level: upgrades.doublePoints,
            maxLevel: UPGRADE_LIMITS.doublePoints,
            cost: getUpgradeCost(100, upgrades.doublePoints, 'doublePoints')
        },
        {
            id: 'xpMult',
            baseCost: 50,
            name: t.xpBonus,
            desc: t.xpBonusDesc,
            level: upgrades.xpMult,
            maxLevel: UPGRADE_LIMITS.xpMult,
            cost: getUpgradeCost(50, upgrades.xpMult, 'xpMult')
        },
        {
            id: 'growthBoost',
            baseCost: 100000000,
            name: t.growthSurge,
            desc: t.growthSurgeDesc,
            level: upgrades.growthBoost,
            maxLevel: UPGRADE_LIMITS.growthBoost,
            cost: getUpgradeCost(0, upgrades.growthBoost, 'growthBoost')
        },
        {
            id: 'eatRange',
            baseCost: 1000000000,
            name: t.magnetRange,
            desc: t.magnetRangeDesc,
            level: upgrades.eatRange,
            maxLevel: UPGRADE_LIMITS.eatRange,
            cost: getUpgradeCost(0, upgrades.eatRange, 'eatRange')
        },
        {
            id: 'luckBoost',
            baseCost: 1000000, // 1 Million
            name: t.luckyCharm,
            desc: t.luckyCharmDesc,
            level: upgrades.luckBoost,
            maxLevel: UPGRADE_LIMITS.luckBoost,
            cost: getUpgradeCost(1000000, upgrades.luckBoost, 'luckBoost')
        }
    ];

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.desc}</p>
            <p>Level: ${item.level} / ${item.maxLevel}</p>
            <div class="shop-buttons">
                <button onclick="buyUpgrade('${item.id}', ${item.cost})" ${coins < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''}>
                    ${item.level >= item.maxLevel ? t.max : `${t.buy} (${formatNumber(item.cost)})`}
                </button>
                <button class="btn-max" onclick="buyMaxUpgrade('${item.id}', ${item.baseCost})" ${coins < item.cost || item.level >= item.maxLevel ? 'disabled style="opacity:0.5"' : ''}>
                    Max
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.buyMaxUpgrade = function(id, baseCost) {
    let currentLevel = upgrades[id];
    let maxLevel = UPGRADE_LIMITS[id];
    
    if (currentLevel >= maxLevel) return;

    // معالجة الأسعار الثابتة بشكل خاص
    if (STATIC_COSTS[id]) {
        // في حالة الأسعار الثابتة، نشتري مستوى واحد فقط إذا توفر المال
        // لأن الأسعار تقفز بشكل هائل
        let cost = STATIC_COSTS[id][currentLevel];
        if (coins >= cost) {
            buyUpgrade(id, cost);
        }
        return;
    }

    // Calculate initial cost for the next level
    let cost = getUpgradeCost(baseCost, currentLevel, id);
    
    let n = 0;
    let totalCost = 0;
    let tempLevel = currentLevel;
    
    while (tempLevel < maxLevel) {
        if (coins >= totalCost + cost) {
            totalCost += cost;
            n++;
            
            // Calculate next cost incrementally
            let percentage = Math.min(50 + tempLevel, 300);
            cost = cost * (1 + percentage / 100);
            
            tempLevel++;
        } else {
            break;
        }
    }
    
    if (n > 0) {
        coins -= totalCost;
        upgrades[id] += n;
        localStorage.setItem('snakeCoins', coins);
        localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
        updateScore();
        renderShopItems();
        playSound('eat');
    }
};

window.buyUpgrade = function(id, cost) {
    if (upgrades[id] >= UPGRADE_LIMITS[id]) return;
    if (coins >= cost) {
        coins -= cost;
        upgrades[id]++;
        localStorage.setItem('snakeCoins', coins);
        localStorage.setItem('snakeUpgrades', JSON.stringify(upgrades));
        updateScore();
        renderShopItems();
        playSound('eat'); // صوت نجاح الشراء
    }
};

// تطبيق اللغة عند البدء
setLanguage(currentLanguage);
});