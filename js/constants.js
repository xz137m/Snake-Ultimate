// إعدادات الشبكة
const GRID_SIZE = 20;

// Game Logic Constants
const BOSS_SPAWN_COOLDOWN = 180000; // 3 Minutes
const ENEMY_RESPAWN_TIME = 3000;    // 3 Seconds
const SAFE_SPAWN_RADIUS = 15;       // 300px (15 blocks * 20px)

// حدود التطويرات
const UPGRADE_LIMITS = {
    foodCount: 100000,
    scoreMult: 10000,
    doublePoints: 10000,
    xpMult: 10000,
    growthBoost: 10,
    eatRange: 5,
    luckBoost: 10000,
    soulsMult: 1000,
    soulsExp: 100
};

// أسعار ثابتة للتطويرات الخاصة
const STATIC_COSTS = {
    eatRange: [1e12, 1e21, 1e36, 1e50, 1e65],
    growthBoost: [1e8, 5e8, 1e9, 5e9, 1e10, 5e10, 1e11, 5e11, 1e12, 5e12]
};

// حدود المستويات
const LEVEL_CAPS = [
    { limit: 15, req: 0, type: 'none', desc: "Start" },
    { limit: 25, req: 1e9, type: 'score', desc: "Reach 1B Score" },
    { limit: 40, req: 1e12, type: 'score', desc: "Reach 1T Score" },
    { limit: 60, req: 1e15, type: 'score', desc: "Reach 1Qa Score" },
    { limit: 100, req: 1e18, type: 'score', desc: "Reach 1Qi Score" },
    { limit: 150, req: 1e21, type: 'score', desc: "Reach 1Sx Score" },
    { limit: 200, req: 1e24, type: 'score', desc: "Reach 1Sp Score" },
    { limit: 300, req: 1e27, type: 'score', desc: "Reach 1Oc Score" }
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
    { name: 'Apple', nameAr: 'تفاح', color: 'rgb(255, 51, 102)', glow: 'rgb(255, 153, 204)', points: 25, gold: 2, xp: 5, growth: 1, reqLevel: 0 },
    { name: 'Orange', nameAr: 'برتقال', color: 'rgb(255, 200, 0)', glow: 'rgb(255, 230, 100)', points: 60, gold: 6, xp: 15, growth: 2, reqLevel: 0 },
    { name: 'Grape', nameAr: 'عنب', color: 'rgb(180, 0, 255)', glow: 'rgb(220, 100, 255)', points: 200, gold: 15, xp: 50, growth: 5, reqLevel: 0 },
    { name: 'Diamond', nameAr: 'ماس', color: 'rgb(0, 255, 255)', glow: 'rgb(150, 255, 255)', points: 1000, gold: 100, xp: 250, growth: 10, reqLevel: 0 },
    { name: 'Banana', nameAr: 'موز', color: 'rgb(255, 255, 0)', glow: 'rgb(255, 255, 150)', points: 5000, gold: 500, xp: 1000, growth: 15, reqLevel: 15 },
    { name: 'Plasma Berry', nameAr: 'توت البلازما', color: 'rgb(255, 0, 100)', glow: 'rgb(255, 100, 150)', points: 50000, gold: 5000, xp: 5000, growth: 20, reqLevel: 25 },
    { name: 'Void Fruit', nameAr: 'فاكهة الفراغ', color: 'rgb(50, 0, 100)', glow: 'rgb(100, 50, 200)', points: 1e6, gold: 1e5, xp: 50000, growth: 30, reqLevel: 40 },
    { name: 'Star Fragment', nameAr: 'شظية نجم', color: 'rgb(255, 255, 255)', glow: 'rgb(200, 200, 255)', points: 1e9, gold: 1e8, xp: 1e6, growth: 50, reqLevel: 60 },
    { name: 'Singularity', nameAr: 'تفرد', color: 'rgb(0, 0, 0)', glow: 'rgb(50, 50, 50)', points: 1e12, gold: 1e11, xp: 1e9, growth: 100, reqLevel: 100 },
    { name: 'Quantum Apple', nameAr: 'تفاحة كمية', color: 'rgb(0, 255, 100)', glow: 'rgb(0, 255, 150)', points: 1e15, gold: 1e14, xp: 1e12, growth: 150, reqLevel: 150 },
    { name: 'Time Orb', nameAr: 'كرة الزمن', color: 'rgb(255, 215, 0)', glow: 'rgb(255, 255, 200)', points: 1e18, gold: 1e17, xp: 1e15, growth: 200, reqLevel: 200 },
    { name: 'Reality Glitch', nameAr: 'خلل واقعي', color: 'rgb(255, 0, 255)', glow: 'rgb(255, 100, 255)', points: 1e21, gold: 1e20, xp: 1e18, growth: 300, reqLevel: 300 }
];

const PRESTIGE_COLORS = [
    { name: 'Green Snake', nameAr: 'الثعبان الأخضر', head: 'rgb(0, 255, 136)', body: 'rgb(0, 204, 102)', reqLevel: 0 },
    { name: 'Blue Snake', nameAr: 'الثعبان الأزرق', head: 'rgb(0, 150, 255)', body: 'rgb(0, 100, 200)', reqLevel: 0 },
    { name: 'Red Snake', nameAr: 'الثعبان الأحمر', head: 'rgb(255, 50, 50)', body: 'rgb(200, 0, 0)', reqLevel: 0 },
    { name: 'Golden Snake', nameAr: 'الثعبان الذهبي', head: 'rgb(255, 215, 0)', body: 'rgb(200, 160, 0)', reqLevel: 0 },
    { name: 'Pink Snake', nameAr: 'الثعبان الوردي', head: 'rgb(255, 0, 255)', body: 'rgb(200, 0, 200)', reqLevel: 0 },
    { name: 'Neon Cyan', nameAr: 'سماوي نيون', head: 'rgb(0, 255, 255)', body: 'rgb(0, 200, 200)', reqLevel: 15 },
    { name: 'Amethyst', nameAr: 'جمشت', head: 'rgb(153, 50, 204)', body: 'rgb(138, 43, 226)', reqLevel: 25 },
    { name: 'Magma', nameAr: 'حمم', head: 'rgb(255, 69, 0)', body: 'rgb(139, 0, 0)', reqLevel: 40 },
    { name: 'Cyber Silver', nameAr: 'فضي سايبر', head: 'rgb(192, 192, 192)', body: 'rgb(128, 128, 128)', reqLevel: 60 },
    { name: 'Cosmic Void', nameAr: 'فراغ كوني', head: 'rgb(20, 20, 20)', body: 'rgb(50, 50, 50)', reqLevel: 100 },
    { name: 'Quantum Ghost', nameAr: 'شبح كمي', head: 'rgb(0, 255, 100)', body: 'rgb(0, 200, 100)', reqLevel: 150 },
    { name: 'Time Weaver', nameAr: 'حائك الزمن', head: 'rgb(255, 215, 0)', body: 'rgb(200, 180, 50)', reqLevel: 200 },
    { name: 'Reality Breaker', nameAr: 'محطم الواقع', head: 'rgb(255, 0, 255)', body: 'rgb(200, 0, 200)', reqLevel: 300 }
];

const PET_TYPES = [
    { id: 'rock', name: 'Pet Rock', rarity: 'Common', color: '#888888', speed: 0.03, intel: 0.0, chance: 40, desc: "Dumb/Slow: Moves slowly towards fruits." },
    { id: 'snail', name: 'Racing Snail', rarity: 'Common+', color: '#a1887f', speed: 0.05, intel: 0.1, chance: 25, desc: "Slow: Tries to gather fruits." },
    { id: 'rabbit', name: 'Speedy Bun', rarity: 'Uncommon', color: '#00ffff', speed: 0.15, intel: 0.2, chance: 15, desc: "Fast/Dumb: Races towards fruits." },
    { id: 'turtle', name: 'Ninja Turtle', rarity: 'Rare', color: '#00ff00', speed: 0.06, intel: 0.8, chance: 10, desc: "Slow/Killer: Slowly hunts enemies." },
    { id: 'wolf', name: 'Alpha Wolf', rarity: 'Epic', color: '#ff8000', speed: 0.12, intel: 0.6, chance: 6, desc: "Balanced: Hunts fruits and enemies." },
    { id: 'phoenix', name: 'Solar Phoenix', rarity: 'Epic+', color: '#ffeb3b', speed: 0.18, intel: 0.7, chance: 3, desc: "Fast/Balanced: Burns enemies." },
    { id: 'dragon', name: 'Void Dragon', rarity: 'Legendary', color: '#9400d3', speed: 0.30, intel: 1.0, chance: 1, desc: "Legendary: Fast Killer. Destroys everything." }
];

const TRANSLATIONS = {
    en: {
        score: "Score:", level: "Level:", gold: "Gold:", highScore: "High Score:", play: "▶ Play", shop: "🛒 Shop", rebirth: "🌀 Rebirth", guide: "📜 Guide", settings: "⚙️ Settings", reset: "🗑️ Reset Data", gameOver: "Game Over!", finalScore: "Final Score:", goldEarned: "Gold Earned:", playAgain: "🔄 Play Again", mainMenu: "🏠 Main Menu", shopTitle: "🛒 Upgrade Shop", rebirthTitle: "🌀 Prestige Shop", guideTitle: "📜 Game Guide", settingsTitle: "⚙️ Settings", balance: "Balance:", close: "❌ Close", audioGame: "🔊 Audio & Gameplay", graphics: "🎨 Graphics & Performance", soundOn: "🔊 Sound: ON", soundOff: "🔊 Sound: OFF", particlesOn: "✨ Particles: ON", particlesOff: "✨ Particles: OFF", rangeOn: "📏 Show Range: ON", rangeOff: "📏 Show Range: OFF", nextEvo: "Next Evolution (50 Length)", glowOn: "💡 Glow: ON", glowOff: "💡 Glow: OFF", brightness: "☀️ Brightness:", moreFood: "🍎 More Food", moreFoodDesc: "Increase max food on screen (+1)", 
        tabProgression: "📈 Progression",
        tabCaps: "🔒 Milestones",
        tabFruits: "🍎 Encyclopedia",
        tabEvo: "🐍 Evolution",
        tabAuras: "💀 Slayer Auras",
        tabPets: "🐾 Pets",
        scoreBonus: "💎 Score Bonus", scoreBonusDesc: "Increase base Score & Gold (+1%) [Max 250%]", 
        globalMult: "⚡ Global Multiplier", globalMultDesc: "Multiplies Score & Gold. Effect doubles every 10 levels!", 
        xpBonus: "🧠 XP Bonus", xpBonusDesc: "Increase XP gain (+1%) [Max 250%]", 
        qualityHigh: "💎 Quality: HIGH",
        qualityLow: "🚀 Quality: LOW",
        permGold1: "👑 Efficient Gold", permGold1Desc: "Gain +50% Gold per level (x1.5 Base)",
        permGold2: "👑 Power Gold", permGold2Desc: "Gain +400% Gold per level (x5.0 Base)",
        permRP1: "🌀 Efficient Rebirth", permRP1Desc: "Gain +50% RP per level (x1.5 Base)",
        permRP2: "🌀 Power Rebirth", permRP2Desc: "Gain +400% RP per level (x5.0 Base)",
        permSouls1: "👻 Efficient Souls", permSouls1Desc: "Gain +50% Souls per level (x1.5 Base)",
        permSouls2: "👻 Power Souls", permSouls2Desc: "Gain +400% Souls per level (x5.0 Base)",
        growthSurge: "💪 Growth Surge", growthSurgeDesc: "Gain extra length per fruit (+1 unit) [Max 10]", magnetRange: "🧲 Magnet Range", magnetRangeDesc: "Eat food from a distance (+1 block) [Max 3]", luckyCharm: "🍀 Lucky Charm", luckyCharmDesc: "Increase chance of Rare Fruits [Max 10000]", soulsMult: "👻 Soul Harvester", soulsMultDesc: "Increase Souls gained from enemies (+5%)", soulsExp: "🔮 Soul Resonance", soulsExpDesc: "+1 Soul/Level. Bonus doubles every 10 levels!", currentBonus: "Current Bonus:", buy: "Buy", max: "MAX", locked: "🔒 LOCKED", unlocked: "✅ UNLOCKED", req: "Requirement:", currentLevel: "Current Level:", levelEffect: "Each level multiplies all Score and Gold", currentMult: "Current Multiplier:", fruitsSection: "🍎 Fruits", snakesSection: "🐍 Evolution", capsSection: "🔒 Level Caps", playerLevelSection: "⭐ Player Level", confirmReset: "Are you sure? This will wipe all your progress (Gold, Levels, Upgrades) forever!", confirmRebirth: "Are you sure? You will lose Gold, Levels, and Standard Upgrades to gain RP!", paused: "⏸️ PAUSED", instructions: "Use WASD / Arrows to move<br>SPACE to Pause<br>Collect food to grow & earn gold", rp: "RP:", permScore: "👑 Perm. Gold/Score", permScoreDesc: "Permanent +10% multiplier per level", permXp: "🧠 Perm. XP", permXpDesc: "Permanent +10% XP multiplier per level", rebirthBtn: "🔥 Rebirth Now (+{0} RP)", xp: "XP:", maxLevel: "Max Level:", growth: "Growth:", multiplier: "Multiplier:", xpMultiplier: "XP Multiplier:", starter: "Starter", evolutionTier: "Evolution Tier", levelReq: "Level", slayerShop: "👹 Slayer Shop", slayerShopTitle: "👹 Slayer Shop", soulsBalance: "Souls:", souls: "Souls:", heartUpgrade: "Max Hearts", heartUpgradeDesc: "Increase maximum health (+1 Heart)", staminaUpgrade: "Max Stamina", staminaUpgradeDesc: "Increase maximum stamina for sprinting", regenUpgrade: "Stamina Regen", regenUpgradeDesc: "Recover stamina faster", saving: "Saving...",
        slayerGold1: "💰 Greed I", slayerGold1Desc: "+5% Gold gain per level",
        slayerGold2: "💰 Greed II", slayerGold2Desc: "+10% Gold gain per level",
        slayerRP1: "🌀 Rebirth Power I", slayerRP1Desc: "+5% RP gain per level",
        slayerRP2: "🌀 Rebirth Power II", slayerRP2Desc: "+10% RP gain per level",
        slayerSouls1: "👻 Soul Harvest I", slayerSouls1Desc: "+5% Souls gain per level",
        slayerSouls2: "👻 Soul Harvest II", slayerSouls2Desc: "+10% Souls gain per level",
        infiniteStamina: "⚡ Infinite Stamina", infiniteStaminaDesc: "Sprint forever without getting exhausted!",
        slayerAuras: "Slayer Auras",
        back: "⬅️ Back",
        auraReq: "Kills Required:",
        auraAbility: "Ability:",
        autoKill: "Passive: Auto-Kill Pulse (20s)",
        petsTitle: "🐾 Pet Companion",
        gachaBtn: "Summon Pet (1M Souls)",
        equip: "Equip",
        unequip: "Unequip",
        rebirthGoldReq: "Need {0} Gold to Rebirth!",
        rebirthLevelReq: "You must reach Level {0} to Rebirth!"
    },
    ar: {
        score: "النقاط:", level: "المستوى:", gold: "الذهب:", highScore: "أعلى نقاط:", play: "▶ ابدأ اللعب", shop: "🛒 المتجر", rebirth: "🌀 إعادة ولادة", guide: "📜 الدليل", settings: "⚙️ الإعدادات", reset: "🗑️ إعادة تعيين", gameOver: "خسرت!", finalScore: "النقاط النهائية:", goldEarned: "الذهب المكتسب:", playAgain: "🔄 العب مجدداً", mainMenu: "🏠 القائمة الرئيسية", shopTitle: "🛒 متجر التطويرات", rebirthTitle: "🌀 متجر الولادة", guideTitle: "📜 دليل اللعبة", settingsTitle: "⚙️ الإعدادات", balance: "الرصيد:", close: "❌ إغلاق", audioGame: "🔊 الصوت واللعب", graphics: "🎨 الجرافيكس والأداء", soundOn: "🔊 الصوت: مفعل", soundOff: "🔊 الصوت: معطل", particlesOn: "✨ المؤثرات: مفعل", particlesOff: "✨ المؤثرات: معطل", rangeOn: "📏 المدى: مفعل", rangeOff: "📏 المدى: معطل", nextEvo: "التطور التالي (طول 50)", glowOn: "💡 التوهج: مفعل", glowOff: "💡 التوهج: معطل", brightness: "☀️ السطوع:", moreFood: "🍎 زيادة التفاح", moreFoodDesc: "زيادة عدد التفاح في الشاشة (+1)",
        tabProgression: "📈 التقدم",
        tabCaps: "🔒 الإنجازات",
        tabFruits: "🍎 الموسوعة",
        tabEvo: "🐍 التطور",
        tabAuras: "💀 هالات القاتل",
        tabPets: "🐾 الحيوانات",
        scoreBonus: "💎 زيادة النقاط", scoreBonusDesc: "زيادة النقاط والذهب الأساسي (+1%) [حد 250%]", 
        globalMult: "⚡ مضاعف شامل", globalMultDesc: "يضاعف النقاط والذهب. يتضاعف التأثير كل 10 مستويات!", 
        xpBonus: "🧠 زيادة الخبرة", xpBonusDesc: "زيادة كسب الخبرة (+1%) [حد 250%]", 
        permGold1: "👑 ذهب فعال", permGold1Desc: "زيادة +50% ذهب لكل مستوى (x1.5 أساسي)",
        permGold2: "👑 ذهب قوي", permGold2Desc: "زيادة +400% ذهب لكل مستوى (x5.0 أساسي)",
        permRP1: "🌀 ولادة فعالة", permRP1Desc: "زيادة +50% نقاط ولادة لكل مستوى (x1.5 أساسي)",
        permRP2: "🌀 ولادة قوية", permRP2Desc: "زيادة +400% نقاط ولادة لكل مستوى (x5.0 أساسي)",
        permSouls1: "👻 أرواح فعالة", permSouls1Desc: "زيادة +50% أرواح لكل مستوى (x1.5 أساسي)",
        permSouls2: "👻 أرواح قوية", permSouls2Desc: "زيادة +400% أرواح لكل مستوى (x5.0 أساسي)",
        slayerGold1: "💰 جشع 1", slayerGold1Desc: "+5% ذهب لكل مستوى",
        slayerGold2: "💰 جشع 2", slayerGold2Desc: "+10% ذهب لكل مستوى",
        slayerRP1: "🌀 قوة الولادة 1", slayerRP1Desc: "+5% نقاط ولادة لكل مستوى",
        slayerRP2: "🌀 قوة الولادة 2", slayerRP2Desc: "+10% نقاط ولادة لكل مستوى",
        slayerSouls1: "👻 حصاد الأرواح 1", slayerSouls1Desc: "+5% أرواح لكل مستوى",
        slayerSouls2: "👻 حصاد الأرواح 2", slayerSouls2Desc: "+10% أرواح لكل مستوى",
        infiniteStamina: "⚡ طاقة لا نهائية", infiniteStaminaDesc: "اجرِ للأبد دون تعب!",
        slayerAuras: "هالات القاتل",
        back: "⬅️ رجوع",
        auraReq: "القتلات المطلوبة:",
        auraAbility: "القدرة:",
        autoKill: "سلبي: نبضة القتل التلقائي (20ث)",
        petsTitle: "🐾 المرافق الأليف",
        gachaBtn: "استدعاء مرافق (1,000 روح)",
        equip: "تجهيز",
        unequip: "إلغاء التجهيز",
        growthSurge: "💪 طفرة النمو", growthSurgeDesc: "زيادة الطول لكل فاكهة (+1 وحدة) [حد 10]", magnetRange: "🧲 مدى المغناطيس", magnetRangeDesc: "أكل الطعام عن بعد (+1 مربع) [حد 3]", luckyCharm: "🍀 الحظ السعيد", luckyCharmDesc: "زيادة فرصة الفواكه النادرة [حد 10000]", soulsMult: "👻 حاصد الأرواح", soulsMultDesc: "زيادة الأرواح المكتسبة من الأعداء (+5%)", soulsExp: "🔮 رنين الأرواح", soulsExpDesc: "+1 روح/مستوى. يتضاعف البونص كل 10 مستويات!", currentBonus: "البونص الحالي:", buy: "شراء", max: "الحد الأقصى", locked: "🔒 مغلق", unlocked: "✅ مفتوح", req: "المتطلبات:", currentLevel: "المستوى الحالي:", levelEffect: "كل مستوى يضاعف النقاط والذهب (x2)", currentMult: "المضاعف الحالي:", fruitsSection: "🍎 الفواكه (القيم الحالية)", snakesSection: "🐍 الثعابين (التطور)", capsSection: "🔒 حدود المستوى (المتطلبات)", playerLevelSection: "⭐ مستوى اللاعب (XP)", confirmReset: "هل أنت متأكد؟ سيتم مسح كل تقدمك (الذهب، المستوى، التطويرات) للأبد!", confirmRebirth: "هل أنت متأكد؟ ستفقد الذهب والمستويات والتطويرات العادية مقابل نقاط الولادة!", paused: "⏸️ موقوف", instructions: "استخدم WASD أو الأسهم للتحرك<br>SPACE للإيقاف<br>اجمع الطعام لتكبر وتكسب الذهب", rp: "نقاط:", permScore: "👑 ذهب/نقاط دائم", permScoreDesc: "مضاعف دائم +10% لكل مستوى", permXp: "🧠 خبرة دائمة", permXpDesc: "مضاعف خبرة دائم +10% لكل مستوى", rebirthBtn: "🔥 إعادة ولادة (+{0} نقطة)", xp: "الخبرة:", maxLevel: "أقصى مستوى:", growth: "النمو:", multiplier: "المضاعف:", xpMultiplier: "مضاعف الخبرة:", starter: "البداية", evolutionTier: "مرحلة التطور", levelReq: "مستوى", slayerShop: "👹 متجر القاتل", slayerShopTitle: "👹 متجر القاتل", soulsBalance: "الأرواح:", souls: "الأرواح:", heartUpgrade: "زيادة القلوب", heartUpgradeDesc: "زيادة الحد الأقصى للصحة (+1 قلب)", staminaUpgrade: "زيادة اللياقة", staminaUpgradeDesc: "زيادة الحد الأقصى للياقة للجري", regenUpgrade: "تجديد اللياقة", regenUpgradeDesc: "استعادة اللياقة بشكل أسرع", saving: "جاري الحفظ...",
        rebirthGoldReq: "تحتاج {0} ذهب لإعادة الولادة!",
        rebirthLevelReq: "يجب أن تصل للمستوى {0} لإعادة الولادة!"
    }
};
