// Game State
let snake = [];
let particles = [];
let foods = [];
let projectiles = [];
let aiSnakes = [];
let velocity = { x: 0, y: 0 };
let nextVelocity = { x: 0, y: 0 };
let score = 0;
let enemiesKilled = 0;
let bossSpawnTimestamp = 0;
let growthBuffer = 0;
let prestigeLevel = 0;
let renderLoopId;
let isPaused = false;
let isGameOver = false;
let speed = 110;
let camera = { x: 0, y: 0 };
let TILE_COUNT_X = 20;
let TILE_COUNT_Y = 20;

// Player Data & Settings
let playerLevel = Number(localStorage.getItem('snakePlayerLevel')) || 1;
let currentXp = Number(localStorage.getItem('snakeXp')) || 0;
let coins = Number(localStorage.getItem('snakeCoins')) || 0;
let highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
let rebirthPoints = Number(localStorage.getItem('snakeRP')) || 0;
let upgrades = JSON.parse(localStorage.getItem('snakeUpgrades')) || {};
let prestigeUpgrades = JSON.parse(localStorage.getItem('snakePrestigeUpgrades')) || { permScore: 0, permXp: 0 };
let soundEnabled = localStorage.getItem('snakeSound') !== 'false';
let particlesEnabled = localStorage.getItem('snakeParticles') !== 'false';
let showEatRange = localStorage.getItem('snakeShowRange') !== 'false';
let glowEnabled = localStorage.getItem('snakeGlow') !== 'false';
let brightnessLevel = parseFloat(localStorage.getItem('snakeBrightness')) || 1.0;
let currentLanguage = localStorage.getItem('snakeLanguage') || 'en';

// Audio
let audioCtx;

// Touch Controls
let touchStartX = 0;
let touchStartY = 0;

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
if (typeof prestigeUpgrades.permScore === 'undefined') prestigeUpgrades.permScore = 0;
if (typeof prestigeUpgrades.permXp === 'undefined') prestigeUpgrades.permXp = 0;

// HTML Elements (will be assigned in main.js)
let canvas, ctx, minimapCanvas, minimapCtx, scoreElement, highScoreElement, coinsElement, rpElement, levelElement;
let menuOverlay, shopOverlay, guideOverlay, settingsOverlay, rebirthOverlay;
let startBtn, shopBtn, rebirthMenuBtn, guideBtn, settingsBtn, resetBtn;
let closeShopBtn, closeRebirthBtn, doRebirthBtn, closeGuideBtn, closeSettingsBtn;
let toggleSoundBtn, toggleParticlesBtn, toggleRangeBtn, toggleGlowBtn, toggleBrightnessBtn;
let langEnBtn, langArBtn;
let progressFill, progressText, xpFill, xpText;
