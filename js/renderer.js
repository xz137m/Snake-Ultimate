var activeShootingStars = [], shockwaves = [];

function updateParticles() {
    if (typeof lowQualityMode !== 'undefined' && lowQualityMode) {
        particles = [];
        return;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function createShockwave(x, y, color) {
    shockwaves.push({
        x: x,
        y: y,
        radius: 10,
        maxRadius: 200,
        color: color,
        alpha: 0.8,
        lineWidth: 15
    });
}
window.createShockwave = createShockwave;

function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.0,
        vy: -1
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 0.02;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function updateCamera() {
    if (snake.length === 0) return;
    const head = snake[0];
    const targetX = head.x * GRID_SIZE - canvas.width / 2 + GRID_SIZE / 2;
    const targetY = head.y * GRID_SIZE - canvas.height / 2 + GRID_SIZE / 2;
    camera.x = targetX;
    camera.y = targetY;
}

function draw() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!lowQualityMode) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for(let i=0; i<100; i++) {
        let sx = (Math.sin(i * 12.9898) * 43758.5453) % 1 * 2000; 
        let sy = (Math.cos(i * 78.233) * 43758.5453) % 1 * 2000;
        if(sx < 0) sx += 2000; if(sy < 0) sy += 2000;

        let px = (sx - camera.x * 0.2) % (canvas.width + 200);
        let py = (sy - camera.y * 0.2) % (canvas.height + 200);
        if (px < -100) px += canvas.width + 200;
        if (py < -100) py += canvas.height + 200;

        const size = (i % 2) + 1;
        ctx.fillRect(px - 100, py - 100, size, size);
    }
    ctx.restore();
    }

    if (!lowQualityMode) {
    if (Math.random() < 0.05) {
        activeShootingStars.push({
            x: Math.random() * canvas.width + 200,
            y: Math.random() * canvas.height * 0.5 - 100,
            len: 100 + Math.random() * 150,
            speed: 20 + Math.random() * 15,
            life: 1.0
        });
    }
    ctx.save();
    for (let i = activeShootingStars.length - 1; i >= 0; i--) {
        let s = activeShootingStars[i];
        s.x -= s.speed;
        s.y += s.speed * 0.6;
        s.life -= 0.02;

        if (s.life <= 0) {
            activeShootingStars.splice(i, 1);
            continue;
        }

        const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y - s.len * 0.6);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.life})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len, s.y - s.len * 0.6);
        ctx.stroke();
    }
    ctx.restore();
    }
    
    ctx.save();
    if (Date.now() < shakeEndTime) {
        const dx = (Math.random() - 0.5) * 10;
        const dy = (Math.random() - 0.5) * 10;
        ctx.translate(dx, dy);
    }

    updateCamera();
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = lowQualityMode ? 0 : 30;
    ctx.fillStyle = '#0d0d15';
    ctx.fillRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.shadowBlur = 0;

    const startX = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endX = startX + canvas.width + GRID_SIZE * 2;
    const startY = Math.floor(camera.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endY = startY + canvas.height + GRID_SIZE * 2;

    const time = Date.now() / 2000;
    const scanPos = (time % 1) * (TILE_COUNT_X * GRID_SIZE + 800) - 400;
    ctx.fillStyle = 'rgba(100, 200, 255, 0.05)';

    for (let x = startX; x <= endX; x += GRID_SIZE) {
        for (let y = startY; y <= endY; y += GRID_SIZE) {
            if (x >= 0 && x < TILE_COUNT_X * GRID_SIZE && y >= 0 && y < TILE_COUNT_Y * GRID_SIZE) {
                const col = Math.floor(x / GRID_SIZE);
                const row = Math.floor(y / GRID_SIZE);
                if ((col + row) % 2 === 0) {
                    const dist = Math.abs((x + y) - scanPos);
                    if (dist < 200) {
                        ctx.fillStyle = `rgba(100, 200, 255, ${0.05 + (1 - dist / 200) * 0.1})`;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                        ctx.fillStyle = 'rgba(100, 200, 255, 0.05)';
                    } else {
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                    }
                }
            }
        }
    }

    if (snake.length > 0 && !lowQualityMode) {
        const head = snake[0];
        const hx = head.x * GRID_SIZE + GRID_SIZE/2;
        const hy = head.y * GRID_SIZE + GRID_SIZE/2;
        const light = ctx.createRadialGradient(hx, hy, 50, hx, hy, 400);
        light.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        light.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = light;
        ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }

    if (!lowQualityMode) {
    ctx.save();
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        let sw = shockwaves[i];
        sw.radius += 8;
        sw.alpha -= 0.04;
        sw.lineWidth -= 0.5;
        
        if (sw.alpha <= 0 || sw.lineWidth <= 0) {
            shockwaves.splice(i, 1);
            continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = sw.lineWidth;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 20;
        ctx.stroke();
    }
    ctx.restore();
    }

    const borderPulse = 10 + Math.sin(Date.now() / 800) * 5;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
    ctx.shadowBlur = borderPulse;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.shadowBlur = 0;

    drawPlayerAura(); // Render Aura behind entities
    if (typeof petInstances !== 'undefined') {
        petInstances.forEach(p => p.draw(ctx));
    }

    const viewLeft = camera.x - GRID_SIZE * 4;
    const viewRight = camera.x + canvas.width + GRID_SIZE * 4;
    const viewTop = camera.y - GRID_SIZE * 4;
    const viewBottom = camera.y + canvas.height + GRID_SIZE * 4;

    if (showEatRange && upgrades.eatRange > 0 && snake.length > 0) {
        const head = snake[0];
        const range = upgrades.eatRange;
        let rx, ry, rw, rh;
        if (velocity.x === 1) { rx = (head.x + 1) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE; rw = range * GRID_SIZE; rh = (range * 2 + 1) * GRID_SIZE; }
        else if (velocity.x === -1) { rx = (head.x - range) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE; rw = range * GRID_SIZE; rh = (range * 2 + 1) * GRID_SIZE; }
        else if (velocity.y === 1) { rx = (head.x - range) * GRID_SIZE; ry = (head.y + 1) * GRID_SIZE; rw = (range * 2 + 1) * GRID_SIZE; rh = range * GRID_SIZE; }
        else if (velocity.y === -1) { rx = (head.x - range) * GRID_SIZE; ry = (head.y - range) * GRID_SIZE; rw = (range * 2 + 1) * GRID_SIZE; rh = range * GRID_SIZE; }
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
    }
    foods.forEach(f => {
        const fx = f.x * GRID_SIZE;
        const fy = f.y * GRID_SIZE;
        if (fx < viewLeft || fx > viewRight || fy < viewTop || fy > viewBottom) return;

        const type = FRUIT_TYPES[f.type];
        const cx = fx + GRID_SIZE / 2;
        const cy = fy + GRID_SIZE / 2;
        const bob = Math.sin(Date.now() / 200) * 1.5;
        const radius = (GRID_SIZE / 2 - 2) + bob;

        if (type.points >= 1000 && !lowQualityMode) { 
             ctx.save();
             const grad = ctx.createLinearGradient(cx, cy, cx, cy - 400);
             grad.addColorStop(0, type.color.replace('rgb', 'rgba').replace(')', ', 0.15)')); // Reduced opacity
             grad.addColorStop(1, 'rgba(0,0,0,0)');
             
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.moveTo(cx - 15, cy);
             ctx.lineTo(cx + 15, cy);
             ctx.lineTo(cx, cy - 400);
             ctx.fill();
             ctx.fillStyle = type.color;
             ctx.globalAlpha = 0.4;
             ctx.beginPath();
             ctx.ellipse(cx, cy, 20, 6, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        }

        ctx.fillStyle = type.color;
        ctx.shadowColor = (glowEnabled && !lowQualityMode) ? type.glow : 'transparent';
        ctx.shadowBlur = (glowEnabled && !lowQualityMode) ? 15 : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!lowQualityMode) {
            const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.2, cx, cy, radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(90, 60, 30, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius + 1);
        ctx.quadraticCurveTo(cx, cy - radius - 4, cx + 4, cy - radius - 2);
        ctx.stroke();

        if (type.points >= 1000 && !lowQualityMode) { 
            ctx.save();
            ctx.translate(cx, cy);
            const time = Date.now() / 1000;
            ctx.shadowColor = type.color;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = type.color;
            
            // Dynamic Opacity (30-40%) & Soft Pulse
            const opacity = 0.3 + Math.sin(time * 2) * 0.1;
            const pulse = Math.sin(time * 3) * 1.5; // Reduced size scaling
            
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 3 + pulse, 0, Math.PI * 2); // Shrunk radius
            ctx.stroke();

            if (type.points >= 50000) {
                ctx.rotate(time);
                ctx.globalAlpha = opacity * 1.2;
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 12]);
                ctx.beginPath();
                ctx.arc(0, 0, radius + 6, 0, Math.PI * 2); // Shrunk radius
                ctx.setLineDash([3, 6]);
                const sides = 6;
                const r = radius + 12;
                for (let i = 0; i <= sides; i++) {
                    const angle = (i * 2 * Math.PI / sides);
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                for(let i=0; i<3; i++) {
                    const angle = (time * 2) + (i * (Math.PI * 2 / 3));
                    const dist = radius + 18;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            if (type.points >= 1000000) {
                ctx.rotate(-time * 2.5);
                ctx.globalAlpha = opacity * 0.5;
                ctx.fillStyle = type.color;
                const spikes = 8;
                const outerR = radius + 25 + Math.random() * 5;
                const innerR = radius + 15;
                
                ctx.beginPath();
                for(let i=0; i<spikes*2; i++){
                  const r = (i%2 === 0) ? outerR : innerR;
                  const a = (Math.PI * i) / spikes;
                  ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
                }
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    });
    particles.forEach(p => {
        if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) return;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    const unlockedColors = PRESTIGE_COLORS.filter(c => playerLevel >= c.reqLevel);
    let colorIndex = prestigeLevel;
    if (colorIndex >= unlockedColors.length) {
        colorIndex = unlockedColors.length - 1;
    }
    const currentColors = unlockedColors[colorIndex];

    if (snake.length > 0 && !isPaused) {
        const tail = snake[snake.length - 1];
        const tx = tail.x * GRID_SIZE + GRID_SIZE/2;
        const ty = tail.y * GRID_SIZE + GRID_SIZE/2;
        if (Math.random() < (isSprinting ? 0.8 : 0.3)) {
             particles.push({
                x: tx + (Math.random()-0.5)*10,
                y: ty + (Math.random()-0.5)*10,
                vx: (Math.random()-0.5)*2,
                vy: (Math.random()-0.5)*2,
                life: 0.6,
                color: isSprinting ? '#00ffff' : 'rgba(100, 255, 100, 0.4)'
            });
        }
    }

    snake.forEach((part, index) => {
        const x = part.x * GRID_SIZE;
        const y = part.y * GRID_SIZE;
        if (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom) return;

        if (index > 0 && !lowQualityMode) {
            const prev = snake[index - 1];
            if (Math.abs(prev.x - part.x) <= 1 && Math.abs(prev.y - part.y) <= 1) {
                const px = prev.x * GRID_SIZE + GRID_SIZE/2;
                const py = prev.y * GRID_SIZE + GRID_SIZE/2;
                const cx = x + GRID_SIZE/2;
                const cy = y + GRID_SIZE/2;

                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowColor = currentColors.head;
                ctx.shadowBlur = 15;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(cx, cy);
                ctx.stroke();
                ctx.restore();
            }
        }

        if (index === 0) {
            ctx.fillStyle = currentColors.head;
            ctx.shadowColor = (glowEnabled && !lowQualityMode) ? currentColors.head : 'transparent';
            ctx.shadowBlur = (glowEnabled && !lowQualityMode) ? 30 : 0;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 8);
            if (ctx.roundRect) ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 9);
            else ctx.rect(x, y, GRID_SIZE, GRID_SIZE);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (!lowQualityMode) {
                const headGrad = ctx.createRadialGradient(x + 6, y + 6, 1, x + 6, y + 6, 8);
                headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                headGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = headGrad;
                ctx.fill();
            }

            ctx.fillStyle = 'white';
            let lx, ly, rx, ry;
            if (velocity.x === 1) {
                lx = x + 12; ly = y + 4; rx = x + 12; ry = y + 12;
            } else if (velocity.x === -1) {
                lx = x + 2; ly = y + 4; rx = x + 2; ry = y + 12;
            } else if (velocity.y === -1) {
                lx = x + 4; ly = y + 2; rx = x + 12; ry = y + 2;
            } else {
                lx = x + 4; ly = y + 12; rx = x + 12; ry = y + 12;
            }

            ctx.beginPath(); ctx.arc(lx + 2, ly + 2, 3.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(rx + 2, ry + 2, 3.5, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = 'black';
            let px = velocity.x * 1.5;
            let py = velocity.y * 1.5;
            ctx.beginPath(); ctx.arc(lx + 2 + px, ly + 2 + py, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(rx + 2 + px, ry + 2 + py, 1.5, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            let nx1, ny1, nx2, ny2;
            if (velocity.x === 1) { nx1 = x+16; ny1 = y+7; nx2 = x+16; ny2 = y+13; }
            else if (velocity.x === -1) { nx1 = x+4; ny1 = y+7; nx2 = x+4; ny2 = y+13; }
            else if (velocity.y === -1) { nx1 = x+7; ny1 = y+4; nx2 = x+13; ny2 = y+4; }
            else { nx1 = x+7; ny1 = y+16; nx2 = x+13; ny2 = y+16; }
            ctx.beginPath(); ctx.arc(nx1, ny1, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(nx2, ny2, 1.5, 0, Math.PI*2); ctx.fill();
        } else {
            let size = GRID_SIZE - 2;
            let offset = 1;
            let radius = 6;
            if (index === snake.length - 1) {
                size = GRID_SIZE - 6;
                offset = 3;
                radius = 4;
            }
            ctx.fillStyle = currentColors.body;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);
            else ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
            if (ctx.roundRect) ctx.roundRect(x + offset, y + offset, size, size, radius);
            else ctx.fillRect(x + offset, y + offset, size, size);
            ctx.fill();

            if (!lowQualityMode) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.beginPath();
                ctx.arc(x + 6, y + 6, 3, 0, Math.PI * 2);
                const cx = x + GRID_SIZE / 2;
                const cy = y + GRID_SIZE / 2;
                const bodyGrad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, 8);
                bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
                bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
                ctx.fillStyle = bodyGrad;
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            const pad = 5;
            if (ctx.roundRect) ctx.roundRect(x + pad, y + pad, GRID_SIZE - pad*2, GRID_SIZE - pad*2, 3);
            else ctx.fillRect(x + pad, y + pad, GRID_SIZE - pad*2, GRID_SIZE - pad*2);
            ctx.fill();
        }
    });

    if (typeof isPlayerInvulnerable !== 'undefined' && isPlayerInvulnerable && snake.length > 0) {
        const head = snake[0];
        const hx = head.x * GRID_SIZE + GRID_SIZE/2;
        const hy = head.y * GRID_SIZE + GRID_SIZE/2;
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        const pulse = Math.sin(Date.now() / 100) * 4;
        ctx.beginPath();
        ctx.arc(hx, hy, GRID_SIZE + 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.globalAlpha = 1.0;

    aiSnakes.forEach(ai => {
        ai.draw(ctx);
    });

    projectiles.forEach(p => {
        p.draw(ctx);
    });

    floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = "bold 16px 'Segoe UI', sans-serif";
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore();

    ctx.restore();
    
    if (brightnessLevel !== 1.0) {
        ctx.globalCompositeOperation = brightnessLevel > 1.0 ? 'screen' : 'multiply';
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(brightnessLevel - 1)})`;
        if (brightnessLevel < 1.0) ctx.fillStyle = `rgba(0, 0, 0, ${1 - brightnessLevel})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(TRANSLATIONS[currentLanguage].paused, canvas.width / 2, canvas.height / 2);
    }
}

function drawMinimap() {
    if (!minimapCtx || !minimapCanvas) return;
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    minimapCtx.fillStyle = 'rgba(5, 10, 20, 0.85)';
    minimapCtx.fillRect(0, 0, w, h);

    minimapCtx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath(); minimapCtx.rect(w * 0.25, h * 0.25, w * 0.5, h * 0.5); minimapCtx.stroke();
    minimapCtx.beginPath(); minimapCtx.moveTo(0, cy); minimapCtx.lineTo(w, cy); minimapCtx.stroke();
    minimapCtx.beginPath(); minimapCtx.moveTo(cx, 0); minimapCtx.lineTo(cx, h); minimapCtx.stroke();
    
    const scaleX = minimapCanvas.width / TILE_COUNT_X;
    const scaleY = minimapCanvas.height / TILE_COUNT_Y;

    foods.forEach(f => {
        const type = FRUIT_TYPES[f.type];
        minimapCtx.fillStyle = type.color;
        minimapCtx.beginPath();
        minimapCtx.arc(f.x * scaleX + scaleX/2, f.y * scaleY + scaleY/2, Math.max(scaleX/2, 2), 0, Math.PI * 2);
        minimapCtx.fill();
    });

    minimapCtx.fillStyle = 'rgba(0, 255, 136, 0.6)'; 
    snake.forEach(p => {
        minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(scaleX, 2), Math.max(scaleY, 2));
    });

    minimapCtx.fillStyle = 'rgba(255, 51, 51, 0.8)';
    aiSnakes.forEach(ai => {
        if(ai.isDead) return;
        ai.body.forEach(p => {
            minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(scaleX, 2), Math.max(scaleY, 2));
        });
    });

    if (snake.length > 0) {
        const head = snake[0];
        const px = head.x * scaleX + (Math.max(scaleX, 2) / 2);
        const py = head.y * scaleY + (Math.max(scaleY, 2) / 2);
        const size = 3;
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 1;
        minimapCtx.beginPath();
        minimapCtx.arc(px, py, 5, 0, Math.PI * 2);
        minimapCtx.stroke();

        minimapCtx.fillStyle = '#ffffff';
        minimapCtx.beginPath();
        if (velocity.x === 1) {
            minimapCtx.moveTo(px - size, py - size); minimapCtx.lineTo(px + size, py); minimapCtx.lineTo(px - size, py + size);
        } else if (velocity.x === -1) {
            minimapCtx.moveTo(px + size, py - size); minimapCtx.lineTo(px - size, py); minimapCtx.lineTo(px + size, py + size);
        } else if (velocity.y === 1) {
            minimapCtx.moveTo(px - size, py - size); minimapCtx.lineTo(px, py + size); minimapCtx.lineTo(px + size, py - size);
        } else if (velocity.y === -1) {
            minimapCtx.moveTo(px - size, py + size); minimapCtx.lineTo(px, py - size); minimapCtx.lineTo(px + size, py + size);
        }
        minimapCtx.fill();
    }
}

function drawPlayerAura() {
    if (snake.length === 0 || killStreak < 5) return;
    
    const head = snake[0];
    const cx = head.x * GRID_SIZE + GRID_SIZE/2;
    const cy = head.y * GRID_SIZE + GRID_SIZE/2;
    
    let color, radius;
    
    if (killStreak >= 35) { // Tier 7: Deep Purple
        color = 'rgba(148, 0, 211, 0.6)';
        radius = GRID_SIZE * 8;
        
        // Pulse Effect for Tier 7
        if (auraTimer < 5000) { // Active Phase
            const pulse = Math.sin(Date.now() / 100) * 10;
            radius += pulse;
            color = 'rgba(180, 0, 255, 0.8)'; // Brighter when active
        }
    } else if (killStreak >= 30) { color = 'rgba(255, 50, 50, 0.5)'; radius = GRID_SIZE * 6; } // Tier 6: Red
    else if (killStreak >= 25) { color = 'rgba(255, 165, 0, 0.4)'; radius = GRID_SIZE * 5; } // Tier 5: Orange
    else if (killStreak >= 20) { color = 'rgba(255, 255, 0, 0.35)'; radius = GRID_SIZE * 4.5; } // Tier 4: Yellow
    else if (killStreak >= 15) { color = 'rgba(0, 255, 100, 0.3)'; radius = GRID_SIZE * 4; } // Tier 3: Green
    else if (killStreak >= 10) { color = 'rgba(100, 200, 255, 0.25)'; radius = GRID_SIZE * 3.5; } // Tier 2: Blue
    else { color = 'rgba(255, 255, 255, 0.15)'; radius = GRID_SIZE * 3; } // Tier 1: White

    ctx.save();
    ctx.translate(cx, cy);
    
    // Draw Aura
    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}