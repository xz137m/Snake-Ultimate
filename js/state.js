// Game State
var snake = [];
var particles = [];
var foods = [];
var floatingTexts = [];
var projectiles = [];
var aiSnakes = [];
var velocity = { x: 0, y: 0 };
var nextVelocity = { x: 0, y: 0 };
var score = 0;
var enemiesKilled = 0;
var bossSpawnTimestamp = 0;
var growthBuffer = 0;
var prestigeLevel = 0;
var renderLoopId;
var isPaused = false;
var isGameOver = false;
var speed = 110;
var camera = { x: 0, y: 0 };
var TILE_COUNT_X = 20;
var TILE_COUNT_Y = 20;

// Player Data & Settings
var playerLevel = Number(localStorage.getItem('snakePlayerLevel')) || 1;
var currentXp = Number(localStorage.getItem('snakeXp')) || 0;
var coins = Number(localStorage.getItem('snakeCoins')) || 0;
var souls = Number(localStorage.getItem('snakeSouls')) || 0;
var highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
var rebirthPoints = Number(localStorage.getItem('snakeRP')) || 0;
var upgrades = JSON.parse(localStorage.getItem('snakeUpgrades')) || {};
var prestigeUpgrades = JSON.parse(localStorage.getItem('snakePrestigeUpgrades')) || { permScore: 0, permXp: 0 };
var slayerUpgrades = JSON.parse(localStorage.getItem('snakeSlayerUpgrades')) || { maxHearts: 0, maxStamina: 0, staminaRegen: 0 };

// Combat State
var currentHearts = 1;
var currentStamina = 100;
var isSprinting = false;
var isExhausted = false; // هل اللاعب مرهق؟
var staminaRegenTimestamp = 0; // متى يبدأ الشحن؟
var isPlayerInvulnerable = false; // هل اللاعب في وضع الحماية؟
var playerInvulnerabilityTime = 0; // وقت بدء الحماية
var shakeEndTime = 0; // متغير لاهتزاز الشاشة

var soundEnabled = localStorage.getItem('snakeSound') !== 'false';
var particlesEnabled = localStorage.getItem('snakeParticles') !== 'false';
var showEatRange = localStorage.getItem('snakeShowRange') !== 'false';
var glowEnabled = localStorage.getItem('snakeGlow') !== 'false';
var brightnessLevel = parseFloat(localStorage.getItem('snakeBrightness')) || 1.0;
var lowQualityMode = localStorage.getItem('snakeLowQuality') === 'true';
var currentLanguage = localStorage.getItem('snakeLanguage') || 'en';

// Audio
var audioCtx;

// Touch Controls
var touchStartX = 0;
var touchStartY = 0;

// Initialize dynamic world size
TILE_COUNT_X = 20 + playerLevel;
TILE_COUNT_Y = 20 + playerLevel;

// Ensure default upgrade values
if (typeof upgrades.foodCount === 'undefined') upgrades.foodCount = 0;
if (typeof upgrades.scoreMult === 'undefined') upgrades.scoreMult = 0;
if (typeof upgrades.doublePoints === 'undefined') upgrades.doublePoints = 0;
if (typeof upgrades.xpMult === 'undefined') upgrades.xpMult = 0;
if (typeof upgrades.growthBoost === 'undefined') upgrades.growthBoost = 0;
if (typeof upgrades.eatRange === 'undefined') upgrades.eatRange = 0;
if (typeof upgrades.luckBoost === 'undefined') upgrades.luckBoost = 0;
if (typeof upgrades.soulsMult === 'undefined') upgrades.soulsMult = 0;
if (typeof upgrades.soulsExp === 'undefined') upgrades.soulsExp = 0;
if (typeof prestigeUpgrades.permScore === 'undefined') prestigeUpgrades.permScore = 0;
if (typeof prestigeUpgrades.permXp === 'undefined') prestigeUpgrades.permXp = 0;
if (typeof prestigeUpgrades.permRP1 === 'undefined') prestigeUpgrades.permRP1 = 0;
if (typeof prestigeUpgrades.permRP2 === 'undefined') prestigeUpgrades.permRP2 = 0;
if (typeof prestigeUpgrades.permSouls1 === 'undefined') prestigeUpgrades.permSouls1 = 0;
if (typeof prestigeUpgrades.permSouls2 === 'undefined') prestigeUpgrades.permSouls2 = 0;
if (typeof slayerUpgrades.maxHearts === 'undefined') slayerUpgrades.maxHearts = 0;
if (typeof slayerUpgrades.maxStamina === 'undefined') slayerUpgrades.maxStamina = 0;
if (typeof slayerUpgrades.staminaRegen === 'undefined') slayerUpgrades.staminaRegen = 0;
if (typeof slayerUpgrades.gold1 === 'undefined') slayerUpgrades.gold1 = 0;
if (typeof slayerUpgrades.gold2 === 'undefined') slayerUpgrades.gold2 = 0;
if (typeof slayerUpgrades.rp1 === 'undefined') slayerUpgrades.rp1 = 0;
if (typeof slayerUpgrades.rp2 === 'undefined') slayerUpgrades.rp2 = 0;
if (typeof slayerUpgrades.souls1 === 'undefined') slayerUpgrades.souls1 = 0;
if (typeof slayerUpgrades.souls2 === 'undefined') slayerUpgrades.souls2 = 0;
if (typeof slayerUpgrades.infiniteStamina === 'undefined') slayerUpgrades.infiniteStamina = 0;

// HTML Elements (will be assigned in main.js)
var canvas, ctx, minimapCanvas, minimapCtx, scoreElement, highScoreElement, coinsElement, rpElement, levelElement;
var menuOverlay, shopOverlay, guideOverlay, settingsOverlay, rebirthOverlay, slayerShopOverlay;
var startBtn, shopBtn, rebirthMenuBtn, guideBtn, settingsBtn, resetBtn, slayerShopBtn;
var closeShopBtn, closeRebirthBtn, doRebirthBtn, closeGuideBtn, closeSettingsBtn, closeSlayerShopBtn;
var toggleSoundBtn, toggleParticlesBtn, toggleRangeBtn, toggleGlowBtn, toggleBrightnessBtn, toggleQualityBtn;
var langEnBtn, langArBtn;
var progressFill, progressText, xpFill, xpText;
