class AiSnake {
    constructor(isBoss = false) {
        this.body = [];
        this.isBoss = isBoss;
        let baseHealth = isBoss ? 3 : 1;
        // Only Bosses get health scaling. Normal enemies always have 1 HP.
        const pLevel = typeof playerLevel !== 'undefined' ? playerLevel : 1;
        const pSouls = typeof souls !== 'undefined' ? souls : 0;
        let scaling = isBoss ? (Math.floor(pLevel / 5) + Math.floor(pSouls / 500)) : 0;
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
            const colors = [
                { c: '#b71c1c', h: '#880e4f' }, // Type 0
                { c: '#0277bd', h: '#01579b' }, // Type 1
                { c: '#ef6c00', h: '#e65100' }  // Type 2
            ];
            if (colors[this.aiType]) {
                this.color = colors[this.aiType].c;
                this.headColor = colors[this.aiType].h;
            }
        }
        this.respawn();
    }

    willCollide(nx, ny) {
        if (nx < 0) nx = TILE_COUNT_X - 1;
        else if (nx >= TILE_COUNT_X) nx = 0;
        if (ny < 0) ny = TILE_COUNT_Y - 1;
        else if (ny >= TILE_COUNT_Y) ny = 0;

        for (let i = 0; i < this.body.length; i++) {
            if (this.body[i].x === nx && this.body[i].y === ny) return true;
        }
        if (typeof snake !== 'undefined') {
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === nx && snake[i].y === ny) return true;
            }
        }
        return false;
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

        // 5-Chunk Optimization: Freeze AI if outside active zones
        if (this.body.length > 0 && typeof window.isPositionActive === 'function') {
            const head = this.body[0];
            if (!window.isPositionActive(head.x, head.y)) return;
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
        let distSq = 0;
        if (playerHead) {
            const dx = head.x - playerHead.x;
            const dy = head.y - playerHead.y;
            distSq = dx*dx + dy*dy;
            if (distSq <= this.detectionRange * this.detectionRange) {
                isChasing = true;
            }
        }

        if (isChasing && playerHead) {
            if (this.isBoss) {
                this.shootCooldown -= speed; 
                if (this.shootCooldown <= 0) {
                    this.shootCooldown = 5000;
                    distance = Math.sqrt(distSq) || 1;
                    const dx = playerHead.x - head.x;
                    const dy = playerHead.y - head.y;
                    const projectileSpeed = 1.2;
                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(new Projectile(head.x + (dx/distance)*0.5, head.y + (dy/distance)*0.5, (dx / distance) * projectileSpeed, (dy / distance) * projectileSpeed));
                    }
                    if (typeof playSound === 'function') playSound('over');
                }
            }

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
            
            let nextX = head.x + this.velocity.x;
            let nextY = head.y + this.velocity.y;
            if (nextX < 0) nextX = TILE_COUNT_X - 1;
            else if (nextX >= TILE_COUNT_X) nextX = 0;
            if (nextY < 0) nextY = TILE_COUNT_Y - 1;
            else if (nextY >= TILE_COUNT_Y) nextY = 0;
            const currentIsSafe = !this.willCollide(nextX, nextY);
            const shouldUpdatePath = !currentIsSafe || (playerMoveDist > 3) || (now - this.lastDecisionTime > 1000);

            if (!shouldUpdatePath) {
                // استمر في نفس الاتجاه (تثبيت الحركة ومنع الرجفة)
            } else {
                this.lastDecisionTime = now;
                this.lastPlayerX = playerHead.x;
                this.lastPlayerY = playerHead.y;

                const moves = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];

            // 3. ترتيب الحركات حسب القرب من "الهدف المحسوب"
            moves.sort((a, b) => {
                // حساب الإحداثيات المستقبلية لكل حركة مع الالتفاف
                const getPos = (m) => ({ x: (head.x + m.x + TILE_COUNT_X) % TILE_COUNT_X, y: (head.y + m.y + TILE_COUNT_Y) % TILE_COUNT_Y });
                const posA = getPos(a), posB = getPos(b);

                // استخدام المسافة الملتفة
                const distA = getWrappedDist(posA.x, posA.y, targetX, targetY);
                const distB = getWrappedDist(posB.x, posB.y, targetX, targetY);

                // --- Pet Evasion Logic ---
                // Penalize moves that get too close to active pets
                let penaltyA = 0;
                let penaltyB = 0;
                if (typeof petInstances !== 'undefined') {
                    for (let p of petInstances) {
                        if (p.isDead) continue;
                        let dPetA = Math.hypot(posA.x - p.x, posA.y - p.y);
                        let dPetB = Math.hypot(posB.x - p.x, posB.y - p.y);
                        
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
                let mx = head.x + m.x;
                if (mx < 0) mx = TILE_COUNT_X - 1;
                else if (mx >= TILE_COUNT_X) mx = 0;
                let my = head.y + m.y;
                if (my < 0) my = TILE_COUNT_Y - 1;
                else if (my >= TILE_COUNT_Y) my = 0;
                if (!this.willCollide(mx, my)) {
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
                        let cx = head.x + this.velocity.x;
                        if (cx < 0) cx = TILE_COUNT_X - 1;
                        else if (cx >= TILE_COUNT_X) cx = 0;
                        let cy = head.y + this.velocity.y;
                        if (cy < 0) cy = TILE_COUNT_Y - 1;
                        else if (cy >= TILE_COUNT_Y) cy = 0;
                        if (this.willCollide(cx, cy)) {
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
        
        const isLowQuality = (typeof lowQualityMode !== 'undefined' && lowQualityMode);
        const PI2 = Math.PI * 2;

        for (let index = 0; index < this.body.length; index++) {
            const part = this.body[index];
            const x = part.x * GRID_SIZE;
            const y = part.y * GRID_SIZE;
            if (viewRight > 0 && (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom)) continue;
            
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
                ctx.beginPath(); ctx.arc(x + 6, y + 6, 2.5, 0, PI2); ctx.fill();
                ctx.beginPath(); ctx.arc(x + 14, y + 6, 2.5, 0, PI2); ctx.fill();
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);
                else ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                ctx.fill();
                if (!isLowQuality) {
                    const cx = x + GRID_SIZE / 2;
                    const cy = y + GRID_SIZE / 2;
                    const grad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, 8);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                }
            }
        }
        if (this.isBoss) {
            const head = this.body[0];
            const barWidth = GRID_SIZE * 2;
            const healthPercent = Math.max(0, this.health / this.maxHealth);
            const bx = head.x * GRID_SIZE - barWidth/4;
            const by = head.y * GRID_SIZE - 10;
            if (!(viewRight > 0 && (bx < viewLeft || bx > viewRight || by < viewTop || by > viewBottom))) {
                ctx.fillStyle = '#555';
                ctx.fillRect(bx, by, barWidth, 5);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(bx, by, barWidth * healthPercent, 5);
            }
        }
        ctx.globalAlpha = 1.0;
    }
}
