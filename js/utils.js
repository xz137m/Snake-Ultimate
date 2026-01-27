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
    
    return scaled.toFixed(2) + (suffix ? " " + suffix : "");
}

function getCurrentLevelCap() {
    let bestScore = Math.max(score, highScore);
    let cap = LEVEL_CAPS[0].limit;
    for (let i = 0; i < LEVEL_CAPS.length; i++) {
        if (bestScore >= LEVEL_CAPS[i].req) {
            cap = LEVEL_CAPS[i].limit;
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
        }
    } catch (e) {
        console.error("Audio Error:", e);
    }
}

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

function getUpgradeCost(baseCost, currentLevel, id) {
    if (STATIC_COSTS[id]) {
        return STATIC_COSTS[id][currentLevel] || Infinity;
    }
    if (id === 'luckBoost') {
        return Math.floor(baseCost * Math.pow(1.1, currentLevel));
    }
    let cost = baseCost;
    for (let i = 0; i < currentLevel; i++) {
        let percentage = Math.min(50 + i, 300);
        cost = cost * (1 + percentage / 100);
    }
    return cost;
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
