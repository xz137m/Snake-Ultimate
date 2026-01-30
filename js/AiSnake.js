class AiSnake {
    constructor(isBoss = false) {
        this.body = [];
        this.isBoss = isBoss;
        let baseHealth = isBoss ? 3 : 1;
        // Only Bosses get health scaling. Normal enemies always have 1 HP.
        let scaling = isBoss ? (Math.floor(playerLevel / 5) + Math.floor(souls / 500)) : 0;
        this.health = baseHealth + scaling;
        this.maxHealth = this.health;
        this.length = isBoss ? 25 : 10;
        this.color = isBoss ? '#4a148c' : '#b71c1c';
        this.headColor = isBoss ? '#e040fb' : '#880e4f';
        this.velocity = { x: 1, y: 0 };
        this.isDead = false;
        this.deathTime = 0;
        this.detectionRange = isBoss ? 30 : 15;
        this.shootCooldown = 2000;
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
        this.turnCooldown = 0;
        this.lastDecisionTime = 0;
        this.smoothTargetX = 0;
        this.smoothTargetY = 0;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.aiType = this.isBoss ? 1 : Math.floor(Math.random() * 3);
        this.targetOffsetX = 0;
        this.targetOffsetY = 0;
        if (this.aiType === 0) {
            this.targetOffsetX = Math.floor(Math.random() * 3) - 1; 
            this.targetOffsetY = Math.floor(Math.random() * 3) - 1;
        } else {
            this.targetOffsetX = Math.floor(Math.random() * 20) - 10;
            this.targetOffsetY = Math.floor(Math.random() * 20) - 10;
        }
        if (!this.isBoss) {
            if (this.aiType === 0) {
                this.color = '#b71c1c'; 
                this.headColor = '#880e4f';
            } else if (this.aiType === 1) {
                this.color = '#0277bd'; 
                this.headColor = '#01579b';
            } else if (this.aiType === 2) {
                this.color = '#ef6c00'; 
                this.headColor = '#e65100';
            }
        }
        this.respawn();
    }

    respawn() {
        let point = { x: 0, y: 0 };
        if (typeof getSafeSpawnPoint === 'function') {
            point = getSafeSpawnPoint();
        } else {
            point.x = Math.floor(Math.random() * TILE_COUNT_X);
            point.y = Math.floor(Math.random() * TILE_COUNT_Y);
        }
        this.body = [];
        for (let i = 0; i < this.length; i++) {
            this.body.push({ x: point.x - i, y: point.y });
        }
        const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
        this.velocity = dirs[Math.floor(Math.random() * dirs.length)];
    }

    update() {
        if (this.isDead) {
            const respawnTime = (typeof ENEMY_RESPAWN_TIME !== 'undefined') ? ENEMY_RESPAWN_TIME : 3000;
            if (!this.isBoss && Date.now() - this.deathTime > respawnTime) {
                this.isDead = false;
                this.respawn();
            }
            return;
        }
        if (this.isInvulnerable) {
            if (Date.now() - this.invulnerabilityTime > 2000) {
                this.isInvulnerable = false;
            }
        }

        const head = this.body[0];
        const playerHead = (typeof snake !== 'undefined' && snake.length > 0) ? snake[0] : null;
        if (this.turnCooldown > 0) this.turnCooldown--;

        let isChasing = false;
        let distance = 0;
        if (playerHead) {
            const dx = head.x - playerHead.x;
            const dy = head.y - playerHead.y;
            distance = Math.sqrt(dx*dx + dy*dy);
            if (distance <= this.detectionRange) {
                isChasing = true;
            }
        }

        if (isChasing && playerHead) {
            if (this.isBoss) {
                this.shootCooldown -= speed; 
                if (this.shootCooldown <= 0) {
                    this.shootCooldown = 5000;
                    const dx = playerHead.x - head.x;
                    const dy = playerHead.y - head.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    const projectileSpeed = 1.2;
                    projectiles.push(new Projectile(head.x + (dx/dist)*0.5, head.y + (dy/dist)*0.5, (dx / dist) * projectileSpeed, (dy / dist) * projectileSpeed));
                    playSound('over');
                }
            }
            const willCollide = (move) => {
                let nx = head.x + move.x;
                let ny = head.y + move.y;
                if (nx < 0) nx = TILE_COUNT_X - 1;
                if (nx >= TILE_COUNT_X) nx = 0;
                if (ny < 0) ny = TILE_COUNT_Y - 1;
                if (ny >= TILE_COUNT_Y) ny = 0;
                for (let part of this.body) {
                    if (part.x === nx && part.y === ny) return true;
                }
                for (let part of snake) {
                    if (part.x === nx && part.y === ny) return true;
                }
                return false;
            };
            const moves = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, 
                { x: -1, y: 0 }, { x: 1, y: 0 }
            ].filter(m => !(m.x === -this.velocity.x && m.y === -this.velocity.y));

            let rawTargetX = playerHead.x + this.targetOffsetX;
            let rawTargetY = playerHead.y + this.targetOffsetY;
            if (this.smoothTargetX === 0 && this.smoothTargetY === 0) {
                this.smoothTargetX = rawTargetX;
                this.smoothTargetY = rawTargetY;
            }
            this.smoothTargetX += (rawTargetX - this.smoothTargetX) * 0.1;
            this.smoothTargetY += (rawTargetY - this.smoothTargetY) * 0.1;

            let targetX = Math.round(this.smoothTargetX);
            let targetY = Math.round(this.smoothTargetY);
            if (targetX < 0) targetX += TILE_COUNT_X;
            if (targetX >= TILE_COUNT_X) targetX -= TILE_COUNT_X;
            if (targetY < 0) targetY += TILE_COUNT_Y;
            if (targetY >= TILE_COUNT_Y) targetY -= TILE_COUNT_Y;

            const getWrappedDist = (x1, y1, x2, y2) => {
                let dx = Math.abs(x1 - x2);
                let dy = Math.abs(y1 - y2);
                if (dx > TILE_COUNT_X / 2) dx = TILE_COUNT_X - dx;
                if (dy > TILE_COUNT_Y / 2) dy = TILE_COUNT_Y - dy;
                return dx + dy;
            };
            const now = Date.now();
            const playerMoveDist = Math.abs(playerHead.x - this.lastPlayerX) + Math.abs(playerHead.y - this.lastPlayerY);
            const currentIsSafe = !willCollide(this.velocity);
            const shouldUpdatePath = !currentIsSafe || (playerMoveDist > 3) || (now - this.lastDecisionTime > 1000);

            if (!shouldUpdatePath) {
                // استمر في نفس الاتجاه (تثبيت الحركة ومنع الرجفة)
            } else {
                this.lastDecisionTime = now;
                this.lastPlayerX = playerHead.x;
                this.lastPlayerY = playerHead.y;

            // 3. ترتيب الحركات حسب القرب من "الهدف المحسوب"
            moves.sort((a, b) => {
                // حساب الإحداثيات المستقبلية لكل حركة مع الالتفاف
                let ax = head.x + a.x; if(ax < 0) ax = TILE_COUNT_X-1; else if(ax >= TILE_COUNT_X) ax = 0;
                let ay = head.y + a.y; if(ay < 0) ay = TILE_COUNT_Y-1; else if(ay >= TILE_COUNT_Y) ay = 0;

                let bx = head.x + b.x; if(bx < 0) bx = TILE_COUNT_X-1; else if(bx >= TILE_COUNT_X) bx = 0;
                let by = head.y + b.y; if(by < 0) by = TILE_COUNT_Y-1; else if(by >= TILE_COUNT_Y) by = 0;

                // استخدام المسافة الملتفة
                const distA = getWrappedDist(ax, ay, targetX, targetY);
                const distB = getWrappedDist(bx, by, targetX, targetY);

                // --- Pet Evasion Logic ---
                // Penalize moves that get too close to active pets
                let penaltyA = 0;
                let penaltyB = 0;
                if (typeof petInstances !== 'undefined') {
                    for (let p of petInstances) {
                        if (p.isDead) continue;
                        // 150px ~ 7.5 grid units
                        let dPetA = Math.hypot(ax - p.x, ay - p.y);
                        let dPetB = Math.hypot(bx - p.x, by - p.y);
                        
                        if (dPetA < 7.5) penaltyA += (100 / (dPetA + 0.1));
                        if (dPetB < 7.5) penaltyB += (100 / (dPetB + 0.1));
                    }
                }

                // --- إصلاح الاهتزاز (Distance Check) ---
                // إذا كان العدو قريباً من اللاعب، نزيد ثبات الاتجاه لمنع التغيير المفاجئ
                let stabilityThreshold = distance < 10 ? 1.5 : 0.1;

                if (Math.abs(distA - distB) < stabilityThreshold) {
                    if (a.x === this.velocity.x && a.y === this.velocity.y) return -1;
                    if (b.x === this.velocity.x && b.y === this.velocity.y) return 1;
                }

                return (distA + penaltyA) - (distB + penaltyB);
            });

            // 4. اختيار الحركة الأفضل مع فحص التصادم و "سرعة الدوران"
            let bestMove = moves[0]; 
            
            // البحث عن أفضل حركة آمنة
            let safeMove = null;
            for (let m of moves) {
                if (!willCollide(m)) {
                    safeMove = m;
                    break;
                }
            }
            if (safeMove) {
                if (safeMove.x !== this.velocity.x || safeMove.y !== this.velocity.y) {
                    if (this.turnCooldown <= 0) {
                        this.velocity = safeMove;
                        this.turnCooldown = 3;
                    } else {
                        if (willCollide(this.velocity)) {
                            this.velocity = safeMove;
                            this.turnCooldown = 3;
                        }
                    }
                } else {
                    this.velocity = safeMove;
                }
            }
            }
        } else {
            if (Math.random() < 0.05) {
                const dirs = [];
                if (this.velocity.x === 0) dirs.push({x:1, y:0}, {x:-1, y:0});
                else dirs.push({x:0, y:1}, {x:0, y:-1});
                this.velocity = dirs[Math.floor(Math.random() * dirs.length)];
            }
        }
        const newHead = { 
            x: head.x + this.velocity.x, 
            y: head.y + this.velocity.y 
        };
        if (newHead.x < 0) newHead.x = TILE_COUNT_X - 1;
        if (newHead.x >= TILE_COUNT_X) newHead.x = 0;
        if (newHead.y < 0) newHead.y = TILE_COUNT_Y - 1;
        if (newHead.y >= TILE_COUNT_Y) newHead.y = 0;
        this.body.unshift(newHead);
        if (this.body.length > this.length) {
            this.body.pop();
        }
    }
    die() {
        this.isDead = true;
        this.deathTime = Date.now();
        this.body = [];
    }
    draw(ctx) {
        if (this.isDead) return;
        if (this.isInvulnerable) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        }
        let viewLeft = 0, viewRight = 0, viewTop = 0, viewBottom = 0;
        if (typeof camera !== 'undefined' && typeof canvas !== 'undefined') {
            viewLeft = camera.x - GRID_SIZE * 2;
            viewRight = camera.x + canvas.width + GRID_SIZE * 2;
            viewTop = camera.y - GRID_SIZE * 2;
            viewBottom = camera.y + canvas.height + GRID_SIZE * 2;
        }
        this.body.forEach((part, index) => {
            const x = part.x * GRID_SIZE;
            const y = part.y * GRID_SIZE;
            if (viewRight > 0 && (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom)) return;
            
            if (index === 0) {
                if (this.isBoss) {
                    ctx.shadowColor = this.headColor;
                    ctx.shadowBlur = 15;
                }
                ctx.fillStyle = this.headColor;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 8);
                else ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = this.isBoss ? '#00ff00' : '#ffeb3b';
                ctx.beginPath(); ctx.arc(x + 6, y + 6, 2.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(x + 14, y + 6, 2.5, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);
                else ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                ctx.fill();
                if (typeof lowQualityMode === 'undefined' || !lowQualityMode) {
                    const cx = x + GRID_SIZE / 2;
                    const cy = y + GRID_SIZE / 2;
                    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, 8);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                }
            }
        });
        if (this.isBoss) {
            const head = this.body[0];
            const barWidth = GRID_SIZE * 2;
            const healthPercent = Math.max(0, this.health / this.maxHealth);
            ctx.fillStyle = '#555';
            ctx.fillRect(head.x * GRID_SIZE - barWidth/4, head.y * GRID_SIZE - 10, barWidth, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(head.x * GRID_SIZE - barWidth/4, head.y * GRID_SIZE - 10, barWidth * healthPercent, 5);
        }
        ctx.globalAlpha = 1.0;
    }
}
