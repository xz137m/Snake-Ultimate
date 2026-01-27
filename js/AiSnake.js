class AiSnake {
    constructor(isBoss = false) {
        this.body = [];
        this.isBoss = isBoss;
        this.health = isBoss ? 3 : 1;
        this.length = isBoss ? 25 : 10; // الزعيم أطول
        this.color = isBoss ? '#4a148c' : '#b71c1c'; // بنفسجي للزعيم، أحمر للعادي
        this.headColor = isBoss ? '#e040fb' : '#880e4f';
        this.velocity = { x: 1, y: 0 };
        this.isDead = false;
        this.deathTime = 0;
        this.detectionRange = isBoss ? 30 : 15; // مدى الزعيم أكبر
        this.shootCooldown = 2000; // مؤقت إطلاق النار (مللي ثانية)
        this.isInvulnerable = false; // هل هو في وضع الحماية؟
        this.invulnerabilityTime = 0; // وقت بدء الحماية
        this.respawn();
    }

    respawn() {
        // محاولة إيجاد مكان بعيد عن اللاعب للظهور
        let safe = false;
        let x, y;
        let attempts = 0;
        while (!safe && attempts < 100) {
            x = Math.floor(Math.random() * TILE_COUNT_X);
            y = Math.floor(Math.random() * TILE_COUNT_Y);
            
            // التأكد من البعد عن رأس اللاعب
            if (typeof snake !== 'undefined' && snake.length > 0) {
                const dx = x - snake[0].x;
                const dy = y - snake[0].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 10) safe = true;
            } else {
                safe = true;
            }
            attempts++;
        }

        this.body = [];
        for (let i = 0; i < this.length; i++) {
            this.body.push({ x: x - i, y: y });
        }
        
        // اتجاه عشوائي مبدئي
        const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
        this.velocity = dirs[Math.floor(Math.random() * dirs.length)];
    }

    update() {
        // إذا كان ميتاً، تحقق من وقت العودة (10 ثواني)
        if (this.isDead) {
            if (!this.isBoss && Date.now() - this.deathTime > 10000) {
                this.isDead = false;
                this.respawn();
            }
            return;
        }

        // إدارة مؤقت الحماية (2 ثانية)
        if (this.isInvulnerable) {
            if (Date.now() - this.invulnerabilityTime > 2000) {
                this.isInvulnerable = false;
            }
        }

        const head = this.body[0];
        const playerHead = (typeof snake !== 'undefined' && snake.length > 0) ? snake[0] : null;

        let isChasing = false;

        if (playerHead) {
            // حساب المسافة (نظام دائري)
            const dx = head.x - playerHead.x;
            const dy = head.y - playerHead.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance <= this.detectionRange) {
                isChasing = true;
            }
        }

        if (isChasing && playerHead) {
            // --- وضع المطاردة ---

            // إطلاق النار إذا كان زعيماً
            if (this.isBoss) {
                this.shootCooldown -= 16; // تقليل المؤقت في كل إطار تقريباً
                if (this.shootCooldown <= 0) {
                    this.shootCooldown = 2500; // إعادة تعيين المؤقت
                    const dx = playerHead.x - head.x;
                    const dy = playerHead.y - head.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    const projectileSpeed = 0.2;
                    projectiles.push(new Projectile(head.x, head.y, (dx / dist) * projectileSpeed, (dy / dist) * projectileSpeed));
                    playSound('over');
                }
            }

            // 1. تحديد الحركات الممكنة
            const moves = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, 
                { x: -1, y: 0 }, { x: 1, y: 0 }
            ].filter(m => !(m.x === -this.velocity.x && m.y === -this.velocity.y));

            // 2. ترتيب الحركات حسب القرب من اللاعب (المطاردة)
            moves.sort((a, b) => {
                // حساب المسافة التقريبية
                const distA = Math.abs((head.x + a.x) - playerHead.x) + Math.abs((head.y + a.y) - playerHead.y);
                const distB = Math.abs((head.x + b.x) - playerHead.x) + Math.abs((head.y + b.y) - playerHead.y);
                return distA - distB;
            });

            // 3. اختيار الحركة الأفضل مع فحص التصادم
            let selectedMove = moves[0]; // الافتراضي: أفضل حركة للمطاردة
            
            // دالة لفحص هل الحركة ستؤدي لاصطدام باللاعب
            const willCollide = (move) => {
                let nx = head.x + move.x;
                let ny = head.y + move.y;
                // التفاف الإحداثيات للفحص
                if (nx < 0) nx = TILE_COUNT_X - 1;
                if (nx >= TILE_COUNT_X) nx = 0;
                if (ny < 0) ny = TILE_COUNT_Y - 1;
                if (ny >= TILE_COUNT_Y) ny = 0;

                for (let part of snake) {
                    if (part.x === nx && part.y === ny) return true;
                }
                return false;
            };

            // إذا كانت الحركة الأفضل خطيرة (ستصدم اللاعب)
            if (willCollide(selectedMove)) {
                // نسبة 5% للخطأ (يصدمك ولا يغير الاتجاه)
                // نسبة 95% للذكاء (يغير الاتجاه)
                if (Math.random() > 0.05) {
                    // محاولة إيجاد حركة بديلة آمنة
                    for (let i = 1; i < moves.length; i++) {
                        if (!willCollide(moves[i])) {
                            selectedMove = moves[i];
                            break;
                        }
                    }
                }
            }
            
            this.velocity = selectedMove;
        } else {
            // --- وضع التجول (خارج المدى) ---
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

        // التفاف حول الشاشة
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
        this.body = []; // إخفاء الجسم
    }

    draw(ctx) {
        if (this.isDead) return;

        // تأثير بصري للحماية (وميض/شفافية)
        if (this.isInvulnerable) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        }

        this.body.forEach((part, index) => {
            const x = part.x * GRID_SIZE;
            const y = part.y * GRID_SIZE;
            
            if (index === 0) {
                // رسم الرأس بتصميم مميز
                ctx.fillStyle = this.headColor;
                ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                // عيون صفراء متوهجة
                ctx.fillStyle = this.isBoss ? '#00ff00' : '#ffeb3b'; // عيون خضراء للزعيم
                ctx.fillRect(x + 4, y + 4, 4, 4);
                ctx.fillRect(x + 12, y + 4, 4, 4);
            } else {
                // رسم الجسم بنمط مخطط
                ctx.fillStyle = index % 2 === 0 ? this.color : '#7f0000';
                ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
            }
        });

        // رسم شريط الصحة للزعيم
        if (this.isBoss) {
            const head = this.body[0];
            const barWidth = GRID_SIZE * 2;
            const healthPercent = this.health / 3;
            ctx.fillStyle = '#555';
            ctx.fillRect(head.x * GRID_SIZE - barWidth/4, head.y * GRID_SIZE - 10, barWidth, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(head.x * GRID_SIZE - barWidth/4, head.y * GRID_SIZE - 10, barWidth * healthPercent, 5);
        }

        // إعادة الشفافية للوضع الطبيعي
        ctx.globalAlpha = 1.0;
    }
}
