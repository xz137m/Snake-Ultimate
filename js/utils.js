function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 1000) return Math.floor(num).toString();
    
    const suffixes = [
        "", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De", 
        "UnD", "DoD", "TrD", "QaD", "QiD", "SxD", "SpD", "OcD", "NoD", 
        "Vg", "UnVg", "DoVg", "TrVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
        "Tg"
    ];
    
    const tier = Math.floor(Math.log10(num) / 3);
    
    if (tier <= 0) return Math.floor(num).toString();
    if (tier >= suffixes.length) return num.toExponential(2);
    
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    
    return scaled.toFixed(2) + (suffix ? " " + suffix : "");
}

function getCurrentLevelCap() {
    if (typeof LEVEL_CAPS === 'undefined') return 15;
    let cap = 15;
    
    for (let i = 0; i < LEVEL_CAPS.length; i++) {
        let tier = LEVEL_CAPS[i];
        let met = false;
        
        if (tier.type === 'none') met = true;
        else if (tier.type === 'score') met = (window.highScore || 0) >= tier.req;
        else if (tier.type === 'bossKills') met = (window.enemiesKilled || 0) >= tier.req;
        else if (tier.type === 'souls') met = (window.souls || 0) >= tier.req;
        else if (tier.type === 'rebirths') met = (window.rebirthCount || 0) >= tier.req;
        
        if (met) {
            cap = tier.limit;
        } else {
            break;
        }
    }
    return cap;
}

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
        } else if (type === 'gacha') {
            // Magical Reveal Sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.2);
            osc.frequency.linearRampToValueAtTime(1000, now + 0.4);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    } catch (e) {
        console.error("Audio Error:", e);
    }
}

function createParticles(x, y, color) {
    if (typeof particles === 'undefined') return;
    if (!particlesEnabled) return;
    
    // Optimization: Limit total particles to 50
    if (particles.length > 50) {
        particles.splice(0, particles.length - 50 + 12);
    }

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

function getUpgradeCost(baseCost, currentLevel, id) {
    if (typeof STATIC_COSTS === 'undefined') return baseCost;
    if (STATIC_COSTS[id]) {
        return STATIC_COSTS[id][currentLevel] || Infinity;
    }
    return Math.floor(baseCost * Math.pow(1.3, currentLevel));
}

function getEvolutionStage(length) {
    const thresholds = [50, 75, 100, 150, 250, 400, 600, 900, 1300, 2000];
    for (let i = 0; i < thresholds.length; i++) {
        if (length < thresholds[i]) {
            return i;
        }
    }
    return thresholds.length; // يرجع أقصى مرحلة ولا يعود للصفر
}

// --- دالة عامة لإخفاء اللوحات ---
function hidePanel(id) {
    const panel = document.getElementById(id);
    const menu = document.getElementById('menu-overlay');
    if (panel) panel.classList.add('hidden');
    if (menu) menu.classList.remove('hidden');
}

// --- تصدير الدوال للنطاق العام (Global Scope) ---
window.formatNumber = formatNumber;
window.getCurrentLevelCap = getCurrentLevelCap;
window.playSound = playSound;
window.createParticles = createParticles;
window.getUpgradeCost = getUpgradeCost;
window.getEvolutionStage = getEvolutionStage;
window.hidePanel = hidePanel;
