var activeShootingStars = [], shockwaves = [];
const PI2 = Math.PI * 2;

// Pre-calculate star positions to save CPU cycles in the render loop
const starCache = Array.from({ length: 100 }, (_, i) => ({
    x: (Math.sin(i * 12.9898) * 43758.5453 % 1 * 2000 + 2000) % 2000,
    y: (Math.cos(i * 78.233) * 43758.5453 % 1 * 2000 + 2000) % 2000,
    size: (i % 2) + 1
}));

function updateParticles() {
    if (typeof particles === 'undefined') return;
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx; particles[i].y += particles[i].vy;
        if ((particles[i].life -= 0.04) <= 0) particles.splice(i, 1);
    }
}

function createShockwave(x, y, color) {
    if (shockwaves.length > 20) shockwaves.shift();
    shockwaves.push({ x, y, radius: 10, color, alpha: 1.0, lineWidth: 20 });
}

function createFloatingText(x, y, text, color) {
    if (floatingTexts.length > 30) floatingTexts.shift();
    floatingTexts.push({ x, y, text, color, life: 1.0, vy: -1 });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y += floatingTexts[i].vy;
        if ((floatingTexts[i].life -= 0.02) <= 0) floatingTexts.splice(i, 1);
    }
}

function updateCamera() {
    if (!snake.length) return;
    const head = snake[0];
    const tx = head.x * GRID_SIZE - canvas.width / 2 + GRID_SIZE / 2;
    const ty = head.y * GRID_SIZE - canvas.height / 2 + GRID_SIZE / 2;
    // Smooth Lerp with Wrap check
    camera.x = Math.abs(tx - camera.x) > (TILE_COUNT_X * GRID_SIZE) / 2 ? tx : camera.x + (tx - camera.x) * 0.1;
    camera.y = Math.abs(ty - camera.y) > (TILE_COUNT_Y * GRID_SIZE) / 2 ? ty : camera.y + (ty - camera.y) * 0.1;
}

function draw() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, W, H);

    // Stars
    if (!lowQualityMode) {
        ctx.save(); ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        starCache.forEach(s => {
            let px = (s.x - camera.x * 0.2) % (W + 200), py = (s.y - camera.y * 0.2) % (H + 200);
            if (px < -100) px += W + 200; if (py < -100) py += H + 200;
            ctx.fillRect(px - 100, py - 100, s.size, s.size);
        });
        ctx.restore();
    }

    // Shooting Stars
    if (!lowQualityMode) {
        if (Math.random() < 0.05) activeShootingStars.push({ x: Math.random() * W + 200, y: Math.random() * H * 0.5 - 100, len: 100 + Math.random() * 150, speed: 20 + Math.random() * 15, life: 1.0 });
        ctx.save();
        for (let i = activeShootingStars.length - 1; i >= 0; i--) {
            let s = activeShootingStars[i];
            s.x -= s.speed; s.y += s.speed * 0.6;
            if ((s.life -= 0.02) <= 0) { activeShootingStars.splice(i, 1); continue; }
            const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y - s.len * 0.6);
            grad.addColorStop(0, `rgba(255, 255, 255, ${s.life})`); grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
            ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.len, s.y - s.len * 0.6); ctx.stroke();
        }
        ctx.restore();
    }

    // Camera Shake & Transform
    ctx.save();
    if (Date.now() < shakeEndTime) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    updateCamera();
    ctx.translate(-camera.x, -camera.y);

    // World Background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; ctx.shadowBlur = lowQualityMode ? 0 : 30;
    ctx.fillStyle = '#0d0d15'; ctx.fillRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.shadowBlur = 0;

    // Checkerboard
    const sx = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE, ex = sx + W + GRID_SIZE * 2;
    const sy = Math.floor(camera.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE, ey = sy + H + GRID_SIZE * 2;
    ctx.fillStyle = 'rgba(25, 30, 45, 0.3)';
    for (let x = sx; x < ex; x += GRID_SIZE) {
        for (let y = sy; y < ey; y += GRID_SIZE) {
            if ((Math.floor(x / GRID_SIZE) + Math.floor(y / GRID_SIZE)) % 2 === 0) ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
        }
    }

    // Scanline
    if (!lowQualityMode) {
        const scanPos = (Date.now() / 2000 % 1) * (TILE_COUNT_X * GRID_SIZE + 800) - 400;
        const sg = ctx.createLinearGradient(scanPos - 200, scanPos - 200, scanPos + 200, scanPos + 200);
        sg.addColorStop(0, 'rgba(100, 200, 255, 0)'); sg.addColorStop(0.5, 'rgba(100, 200, 255, 0.08)'); sg.addColorStop(1, 'rgba(100, 200, 255, 0)');
        ctx.fillStyle = sg; ctx.fillRect(sx, sy, ex - sx, ey - sy);
    }

    // Light
    if (snake.length > 0 && !lowQualityMode) {
        const h = snake[0], hx = h.x * GRID_SIZE + GRID_SIZE/2, hy = h.y * GRID_SIZE + GRID_SIZE/2, r = 400;
        if (hx + r > camera.x && hx - r < camera.x + W && hy + r > camera.y && hy - r < camera.y + H) {
            const lg = ctx.createRadialGradient(hx, hy, 50, hx, hy, r);
            lg.addColorStop(0, 'rgba(255, 255, 255, 0.1)'); lg.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = lg; ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
        }
    }

    // Shockwaves
    if (!lowQualityMode) {
        ctx.save();
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            let sw = shockwaves[i];
            sw.radius += 8; sw.alpha -= 0.04; sw.lineWidth -= 0.5;
            if (sw.alpha <= 0 || sw.lineWidth <= 0) { shockwaves.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, PI2);
            ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.alpha; ctx.lineWidth = sw.lineWidth;
            ctx.shadowColor = sw.color; ctx.shadowBlur = 20; ctx.stroke();
        }
        ctx.restore();
    }

    // Border
    ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'; ctx.shadowBlur = 10 + Math.sin(Date.now() / 800) * 5;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.shadowBlur = 0;

    drawPlayerAura();
    if (typeof petInstances !== 'undefined') petInstances.forEach(p => p.draw(ctx));

    // Eat Range
    const vl = camera.x - GRID_SIZE * 4, vr = camera.x + W + GRID_SIZE * 4, vt = camera.y - GRID_SIZE * 4, vb = camera.y + H + GRID_SIZE * 4;
    if (showEatRange && upgrades.eatRange > 0 && snake.length > 0) {
        const h = snake[0], r = upgrades.eatRange, gs = GRID_SIZE;
        let rx, ry, rw, rh;
        if (velocity.x) { rx = velocity.x > 0 ? (h.x + 1) * gs : (h.x - r) * gs; ry = (h.y - r) * gs; rw = r * gs; rh = (r * 2 + 1) * gs; }
        else { rx = (h.x - r) * gs; ry = velocity.y > 0 ? (h.y + 1) * gs : (h.y - r) * gs; rw = (r * 2 + 1) * gs; rh = r * gs; }
        ctx.save(); ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.strokeRect(rx, ry, rw, rh); ctx.restore();
    }

    // Foods
    foods.forEach(f => {
        const fx = f.x * GRID_SIZE, fy = f.y * GRID_SIZE;
        if (fx < vl || fx > vr || fy < vt || fy > vb) return;
        const type = FRUIT_TYPES[f.type], cx = fx + GRID_SIZE / 2, cy = fy + GRID_SIZE / 2;
        const r = (GRID_SIZE / 2 - 2) + Math.sin(Date.now() / 200) * 1.5;

        // High Tier Beam
        if (type.points >= 1000 && !lowQualityMode) { 
            ctx.save(); const g = ctx.createLinearGradient(cx, cy, cx, cy - 400);
            g.addColorStop(0, type.color.replace('rgb', 'rgba').replace(')', ', 0.15)')); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy); ctx.lineTo(cx, cy - 400); ctx.fill();
            ctx.fillStyle = type.color; ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.ellipse(cx, cy, 20, 6, 0, 0, PI2); ctx.fill(); ctx.restore();
        }

        ctx.fillStyle = type.color; ctx.shadowColor = (glowEnabled && !lowQualityMode) ? type.glow : 'transparent';
        ctx.shadowBlur = (glowEnabled && !lowQualityMode) ? 15 : 0;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2); ctx.fill(); ctx.shadowBlur = 0;

        if (!lowQualityMode) {
            const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
            g.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); g.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, PI2); ctx.fill();
        }
        // Stem
        ctx.strokeStyle = 'rgba(90, 60, 30, 0.8)'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(cx, cy - r + 1); ctx.quadraticCurveTo(cx, cy - r - 4, cx + 4, cy - r - 2); ctx.stroke();
    });

    // Particles
    particles.forEach(p => {
        if (p.x < vl || p.x > vr || p.y < vt || p.y > vb) return;
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Snake
    const unlockedColors = PRESTIGE_COLORS.filter(c => playerLevel >= c.reqLevel);
    const currentColors = unlockedColors[Math.min(prestigeLevel, unlockedColors.length - 1)];
    
    // Trail Particles
    if (snake.length > 0 && !isPaused && Math.random() < (isSprinting ? 0.8 : 0.3)) {
        const t = snake[snake.length - 1];
        particles.push({ x: t.x * GRID_SIZE + GRID_SIZE/2 + (Math.random()-0.5)*10, y: t.y * GRID_SIZE + GRID_SIZE/2 + (Math.random()-0.5)*10, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 0.6, color: isSprinting ? '#00ffff' : 'rgba(100, 255, 100, 0.4)' });
    }

    for (let index = snake.length - 1; index >= 0; index--) {
        const p = snake[index], x = p.x * GRID_SIZE, y = p.y * GRID_SIZE;
        if (x < vl || x > vr || y < vt || y > vb) continue;

        if (index > 0 && !lowQualityMode) {
            const prev = snake[index - 1];
            if (Math.abs(prev.x - p.x) <= 1 && Math.abs(prev.y - p.y) <= 1) {
                ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.shadowColor = currentColors.head;
                ctx.shadowBlur = 15; ctx.lineWidth = 4; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(prev.x * GRID_SIZE + GRID_SIZE/2, prev.y * GRID_SIZE + GRID_SIZE/2);
                ctx.lineTo(x + GRID_SIZE/2, y + GRID_SIZE/2); ctx.stroke(); ctx.restore();
            }
        }

        if (index === 0) { // Head
            ctx.fillStyle = currentColors.head;
            ctx.shadowColor = (glowEnabled && !lowQualityMode) ? currentColors.head : 'transparent';
            ctx.shadowBlur = (glowEnabled && !lowQualityMode) ? 30 : 0;
            ctx.beginPath(); 
            if (ctx.roundRect) ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 8); else ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
            ctx.fill(); ctx.shadowBlur = 0;

            // Eyes using rotation
            ctx.save();
            ctx.translate(x + GRID_SIZE/2, y + GRID_SIZE/2);
            ctx.rotate(Math.atan2(velocity.y, velocity.x));
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(4, -4, 3.5, 0, PI2); ctx.fill(); // Right Eye (relative to rotation)
            ctx.beginPath(); ctx.arc(4, 4, 3.5, 0, PI2); ctx.fill();  // Left Eye
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(5.5, -4, 1.5, 0, PI2); ctx.fill();
            ctx.beginPath(); ctx.arc(5.5, 4, 1.5, 0, PI2); ctx.fill();
            ctx.restore();
        } else { // Body
            let s = GRID_SIZE - (index === snake.length - 1 ? 6 : 2), off = (GRID_SIZE - s) / 2;
            ctx.fillStyle = currentColors.body;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5); else ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            if (ctx.roundRect) ctx.roundRect(x + off, y + off, s, s, 4); else ctx.fillRect(x + off, y + off, s, s);
            ctx.fill();
        }
    }

    // Invulnerability
    if (typeof isPlayerInvulnerable !== 'undefined' && isPlayerInvulnerable && snake.length > 0) {
        const h = snake[0];
        ctx.save(); ctx.strokeStyle = '#00ffff'; ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 20; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(h.x * GRID_SIZE + GRID_SIZE/2, h.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE + 2 + Math.sin(Date.now() / 100) * 4, 0, PI2);
        ctx.fill(); ctx.stroke(); ctx.restore();
    }

    ctx.globalAlpha = 1.0;
    aiSnakes.forEach(ai => ai.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.max(0, ft.life); ctx.fillStyle = ft.color; ctx.font = "bold 16px 'Segoe UI', sans-serif";
        ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y); ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore(); ctx.restore(); // Restore camera & shake
    
    // Brightness
    if (brightnessLevel !== 1.0) {
        ctx.globalCompositeOperation = brightnessLevel > 1.0 ? 'screen' : 'multiply';
        ctx.fillStyle = `rgba(${brightnessLevel < 1 ? '0,0,0' : '255,255,255'}, ${Math.abs(brightnessLevel - 1)})`;
        ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
}

function drawMinimap() {
    if (!minimapCtx || !minimapCanvas) return;
    const W = minimapCanvas.width, H = minimapCanvas.height, sx = W / TILE_COUNT_X, sy = H / TILE_COUNT_Y;
    minimapCtx.clearRect(0, 0, W, H);
    minimapCtx.fillStyle = 'rgba(5, 10, 20, 0.85)'; minimapCtx.fillRect(0, 0, W, H);
    
    // Grid Lines
    minimapCtx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath(); minimapCtx.rect(W * 0.25, H * 0.25, W * 0.5, H * 0.5); minimapCtx.stroke();
    minimapCtx.beginPath(); minimapCtx.moveTo(0, H/2); minimapCtx.lineTo(W, H/2); minimapCtx.stroke();
    minimapCtx.beginPath(); minimapCtx.moveTo(W/2, 0); minimapCtx.lineTo(W/2, H); minimapCtx.stroke();

    // Entities
    const drawDot = (e, c) => { minimapCtx.fillStyle = c; minimapCtx.fillRect(e.x * sx, e.y * sy, Math.max(sx, 2), Math.max(sy, 2)); };
    foods.forEach(f => drawDot(f, FRUIT_TYPES[f.type].color));
    minimapCtx.fillStyle = 'rgba(0, 255, 136, 0.6)'; snake.forEach(p => minimapCtx.fillRect(p.x * sx, p.y * sy, Math.max(sx, 2), Math.max(sy, 2)));
    minimapCtx.fillStyle = 'rgba(255, 51, 51, 0.8)'; aiSnakes.forEach(ai => !ai.isDead && ai.body.forEach(p => minimapCtx.fillRect(p.x * sx, p.y * sy, Math.max(sx, 2), Math.max(sy, 2))));

    // Player Head
    if (snake.length > 0) {
        const h = snake[0], px = h.x * sx + sx/2, py = h.y * sy + sy/2;
        minimapCtx.strokeStyle = '#ffffff'; minimapCtx.beginPath(); minimapCtx.arc(px, py, 5, 0, PI2); minimapCtx.stroke();
        minimapCtx.fillStyle = '#ffffff'; minimapCtx.beginPath();
        minimapCtx.arc(px + velocity.x * 3, py + velocity.y * 3, 2, 0, PI2); minimapCtx.fill();
    }
}

function drawPlayerAura() {
    if (snake.length === 0 || killStreak < 5) return;
    const h = snake[0], cx = h.x * GRID_SIZE + GRID_SIZE/2, cy = h.y * GRID_SIZE + GRID_SIZE/2, t = Date.now();
    const tiers = [
        { k: 35, c: 'rgba(180, 0, 255, 0.6)', i: '#e040fb', r: 8 }, { k: 30, c: 'rgba(255, 50, 50, 0.5)', i: '#ff1744', r: 6.5 },
        { k: 25, c: 'rgba(255, 165, 0, 0.45)', i: '#ff9100', r: 5.5 }, { k: 20, c: 'rgba(255, 215, 0, 0.4)', i: '#ffd700', r: 4.5 },
        { k: 15, c: 'rgba(0, 255, 100, 0.35)', i: '#00e676', r: 4 }, { k: 10, c: 'rgba(0, 191, 255, 0.3)', i: '#00b0ff', r: 3.5 },
        { k: 0, c: 'rgba(255, 255, 255, 0.25)', i: '#ffffff', r: 3 }
    ];
    const data = tiers.find(x => killStreak >= x.k), tierIdx = 7 - tiers.indexOf(data);
    let r = data.r * GRID_SIZE + Math.sin(t / (300 - tierIdx * 20)) * (GRID_SIZE * (0.1 + tierIdx * 0.05));
    if (tierIdx === 7 && auraTimer < 5000) { data.c = 'rgba(220, 100, 255, 0.8)'; data.i = '#ffffff'; r += GRID_SIZE; }

    ctx.save(); ctx.translate(cx, cy);
    if (typeof lowQualityMode === 'undefined' || !lowQualityMode) ctx.globalCompositeOperation = 'screen';
    
    const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r); g.addColorStop(0, data.c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, PI2); ctx.fill();

    if (tierIdx >= 2) {
        ctx.save(); ctx.rotate(t / (2000 - tierIdx * 100)); ctx.strokeStyle = data.i; ctx.lineWidth = 1 + tierIdx * 0.5;
        ctx.globalAlpha = 0.6; ctx.setLineDash([15 + tierIdx, 10]); ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, PI2); ctx.stroke(); ctx.restore();
    }
    if (tierIdx >= 3) {
        ctx.save(); ctx.rotate(-t / (2500 - tierIdx * 150)); ctx.strokeStyle = data.i; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let i = 0; i <= tierIdx; i++) {
            const a = i * 2 * Math.PI / tierIdx; ctx[i===0?'moveTo':'lineTo'](Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
        }
        ctx.closePath(); ctx.stroke(); if (tierIdx >= 5) { ctx.fillStyle = data.c; ctx.globalAlpha = 0.2; ctx.fill(); }
        ctx.restore();
    }
    if (tierIdx >= 4 && !lowQualityMode) {
        ctx.fillStyle = data.i;
        for(let i=0; i<(tierIdx-3)*3; i++) {
            const a = (t/1000) + (i * PI2 / ((tierIdx-3)*3));
            ctx.beginPath(); ctx.arc(Math.cos(a)*r*0.9, Math.sin(a)*r*0.9, 3, 0, PI2); ctx.fill();
        }
    }
    ctx.restore();
}