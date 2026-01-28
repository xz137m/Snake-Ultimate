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
        this.turnCooldown = 0; // سرعة الدوران: عدد الإطارات قبل السماح بانعطاف جديد
        this.lastDecisionTime = 0; // لتطبيق قاعدة الـ 500ms
        
        // متغيرات التنعيم (Lerp) وتتبع اللاعب
        this.smoothTargetX = 0;
        this.smoothTargetY = 0;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        
        // تحديد نوع الذكاء الاصطناعي
        // 0: المطارد (يلاحقك مباشرة)
        // 1: المعترض (يتوقع مكانك المستقبلي)
        // 2: المحاصر (يحاول قطع الطريق)
        if (this.isBoss) {
            this.aiType = 1; // الزعيم دائماً ذكي (معترض)
        } else {
            this.aiType = Math.floor(Math.random() * 3); // توزيع عشوائي للأعداء العاديين
        }

        // --- العشوائية المكانية (Random Offset) ---
        // بدلاً من التجمع في نقطة واحدة، كل عدو يختار نقطة مختلفة حول اللاعب
        this.targetOffsetX = 0;
        this.targetOffsetY = 0;

        if (this.aiType === 0) { 
            // المطارد: يستهدف الرأس مباشرة أو قريباً جداً منه
            this.targetOffsetX = Math.floor(Math.random() * 3) - 1; 
            this.targetOffsetY = Math.floor(Math.random() * 3) - 1;
        } else {
            // الآخرون: يستهدفون نقاطاً حول اللاعب (تطويق)
            this.targetOffsetX = Math.floor(Math.random() * 20) - 10; // توسيع النطاق ليتوزعوا (Offset 20)
            this.targetOffsetY = Math.floor(Math.random() * 20) - 10;
        }

        // تمييز الألوان حسب النوع لكي يلاحظ اللاعب الفرق
        if (!this.isBoss) {
            if (this.aiType === 0) { // المطارد (أحمر - غبي)
                this.color = '#b71c1c'; 
                this.headColor = '#880e4f';
            } else if (this.aiType === 1) { // المعترض (أزرق - ذكي)
                this.color = '#0277bd'; 
                this.headColor = '#01579b';
            } else if (this.aiType === 2) { // المحاصر (برتقالي - ماكر)
                this.color = '#ef6c00'; 
                this.headColor = '#e65100';
            }
        }
        console.log(`Enemy Spawned: Type ${this.aiType} (${this.color})`); // تأكيد في الكونسل أن الملف يعمل
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

        // تقليل مؤقت الدوران
        if (this.turnCooldown > 0) this.turnCooldown--;

        let isChasing = false;
        let distance = 0; // تعريف المتغير هنا ليكون متاحاً في كل الدالة
        if (playerHead) {
            // حساب المسافة (نظام دائري)
            const dx = head.x - playerHead.x;
            const dy = head.y - playerHead.y;
            distance = Math.sqrt(dx*dx + dy*dy); // تحديث القيمة بدلاً من إعادة التعريف

            if (distance <= this.detectionRange) {
                isChasing = true;
            }
        }

        if (isChasing && playerHead) {
            // --- وضع المطاردة ---

            // إطلاق النار إذا كان زعيماً
            if (this.isBoss) {
                // بما أن هذا التحديث يحدث كل `worldSpeed` (الموجود في المتغير العام `speed`)
                // نطرح قيمة `speed` لجعل المؤقت يعتمد على الوقت الفعلي وليس على الإطارات
                this.shootCooldown -= speed; 
                if (this.shootCooldown <= 0) {
                    this.shootCooldown = 5000; // إعادة تعيين المؤقت إلى 5 ثواني
                    const dx = playerHead.x - head.x;
                    const dy = playerHead.y - head.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    const projectileSpeed = 1.2; // أسرع من اللاعب (اللاعب سرعته 1.0)
                    projectiles.push(new Projectile(head.x + (dx/dist)*0.5, head.y + (dy/dist)*0.5, (dx / dist) * projectileSpeed, (dy / dist) * projectileSpeed));
                    playSound('over');
                }
            }

            // دالة لفحص هل الحركة ستؤدي لاصطدام (نحتاجها الآن لاتخاذ القرار المبكر)
            const willCollide = (move) => {
                let nx = head.x + move.x;
                let ny = head.y + move.y;
                // التفاف الإحداثيات للفحص
                if (nx < 0) nx = TILE_COUNT_X - 1;
                if (nx >= TILE_COUNT_X) nx = 0;
                if (ny < 0) ny = TILE_COUNT_Y - 1;
                if (ny >= TILE_COUNT_Y) ny = 0;

                // فحص الاصطدام مع النفس
                for (let part of this.body) {
                    if (part.x === nx && part.y === ny) return true;
                }
                // فحص الاصطدام مع اللاعب
                for (let part of snake) {
                    if (part.x === nx && part.y === ny) return true;
                }
                return false;
            };

            // 1. تحديد الحركات الممكنة
            const moves = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, 
                { x: -1, y: 0 }, { x: 1, y: 0 }
            ].filter(m => !(m.x === -this.velocity.x && m.y === -this.velocity.y));

            // 2. تحديد الهدف (Position Based) مع التنعيم (Lerp)
            let rawTargetX = playerHead.x + this.targetOffsetX;
            let rawTargetY = playerHead.y + this.targetOffsetY;

            // تهيئة القيم عند أول تشغيل
            if (this.smoothTargetX === 0 && this.smoothTargetY === 0) {
                this.smoothTargetX = rawTargetX;
                this.smoothTargetY = rawTargetY;
            }

            // تطبيق Lerp لتنعيم حركة الهدف (يمنع القفزات الفجائية)
            this.smoothTargetX += (rawTargetX - this.smoothTargetX) * 0.1;
            this.smoothTargetY += (rawTargetY - this.smoothTargetY) * 0.1;

            let targetX = Math.round(this.smoothTargetX);
            let targetY = Math.round(this.smoothTargetY);
            
            // التعامل مع التفاف العالم (إذا كان الهدف خارج الحدود)
            if (targetX < 0) targetX += TILE_COUNT_X;
            if (targetX >= TILE_COUNT_X) targetX -= TILE_COUNT_X;
            if (targetY < 0) targetY += TILE_COUNT_Y;
            if (targetY >= TILE_COUNT_Y) targetY -= TILE_COUNT_Y;

            // دالة مساعدة لحساب المسافة مع مراعاة التفاف العالم (Toroidal Distance)
            // هذا يمنع العدو من التردد عند الحواف
            const getWrappedDist = (x1, y1, x2, y2) => {
                let dx = Math.abs(x1 - x2);
                let dy = Math.abs(y1 - y2);
                if (dx > TILE_COUNT_X / 2) dx = TILE_COUNT_X - dx;
                if (dy > TILE_COUNT_Y / 2) dy = TILE_COUNT_Y - dy;
                return dx + dy;
            };

            // --- Update Limiter (محدد التحديث) ---
            const now = Date.now();
            // حساب مسافة حركة اللاعب منذ آخر قرار
            const playerMoveDist = Math.abs(playerHead.x - this.lastPlayerX) + Math.abs(playerHead.y - this.lastPlayerY);
            
            // نحدث المسار فقط إذا:
            // 1. المسار الحالي سيؤدي لاصطدام (أولوية قصوى)
            // 2. اللاعب تحرك مسافة كافية (أكثر من 3 مربعات)
            // 3. مر وقت طويل جداً (1 ثانية) كاحتياط
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

                // --- إصلاح الاهتزاز (Distance Check) ---
                // إذا كان العدو قريباً من اللاعب، نزيد ثبات الاتجاه لمنع التغيير المفاجئ
                let stabilityThreshold = distance < 10 ? 1.5 : 0.1;

                if (Math.abs(distA - distB) < stabilityThreshold) {
                    if (a.x === this.velocity.x && a.y === this.velocity.y) return -1;
                    if (b.x === this.velocity.x && b.y === this.velocity.y) return 1;
                }

                return distA - distB;
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
                // --- تطبيق سرعة الدوران (Rotation Speed) ---
                // إذا كانت الحركة الآمنة تتطلب تغيير الاتجاه
                if (safeMove.x !== this.velocity.x || safeMove.y !== this.velocity.y) {
                    // هل مسموح لي بالدوران الآن؟
                    if (this.turnCooldown <= 0) {
                        this.velocity = safeMove;
                        this.turnCooldown = 3; // تحديد سرعة الدوران (Rotation Speed) لمنع الالتفاف السريع
                    } else {
                        // لا يمكن الدوران بعد، حاول الاستمرار للأمام إذا كان آمناً
                        if (!willCollide(this.velocity)) {
                            // استمر في نفس الاتجاه (تأخير الانعطاف)
                        } else {
                            // مضطر للدوران لأن الأمام مسدود
                            this.velocity = safeMove;
                            this.turnCooldown = 3;
                        }
                    }
                } else {
                    // الحركة في نفس الاتجاه، استمر
                    this.velocity = safeMove;
                }
            }
            } // نهاية else (تحديث المسار)
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

        // حدود العرض للاستبعاد (Culling)
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
            
            // تحسين الأداء: لا ترسم هذا الجزء إذا كان خارج الشاشة
            if (viewRight > 0 && (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom)) return;
            
            if (index === 0) {
                // --- HEAD ---
                // توهج للزعيم
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

                // عيون صفراء متوهجة
                ctx.fillStyle = this.isBoss ? '#00ff00' : '#ffeb3b'; // عيون خضراء للزعيم
                ctx.beginPath(); ctx.arc(x + 6, y + 6, 2.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(x + 14, y + 6, 2.5, 0, Math.PI*2); ctx.fill();
            } else {
                // --- BODY ---
                ctx.fillStyle = this.color;
                ctx.beginPath();
                // تصغير الجسم قليلاً ليكون أنعم
                if (ctx.roundRect) ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);
                else ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                ctx.fill();

                // تدرج لوني لإعطاء عمق (3D Effect)
                const cx = x + GRID_SIZE / 2;
                const cy = y + GRID_SIZE / 2;
                const grad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, 8);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                ctx.fillStyle = grad;
                ctx.fill();
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
