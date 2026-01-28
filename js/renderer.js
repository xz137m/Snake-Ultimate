// c:\Users\Welcome\OneDrive\سطح المكتب\Snake Ultimate\js\renderer.js

var activeShootingStars = []; // مصفوفة لتتبع الشهب المتحركة
var shockwaves = []; // مصفوفة لموجات الصدمة

function updateParticles() {
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
window.createShockwave = createShockwave; // تصدير للدالة

function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.0,
        vy: -1 // سرعة الصعود للأعلى
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 0.02; // سرعة التلاشي
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
    // حماية ضد الشاشة السوداء: التأكد من وجود سياق الرسم
    if (!ctx || !canvas) return;

    // 1. الخلفية العامة (The Void - فضاء عميق)
    const bgGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width);
    bgGrad.addColorStop(0, '#0a0a12'); // مركز داكن جداً
    bgGrad.addColorStop(1, '#000000'); // أطراف سوداء تماماً للتباين
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- سديم كوني (Nebula Atmosphere) - إضافة جوية ---
    ctx.save();
    const tNebula = Date.now() / 4000;
    // رسم 3 سحب ملونة تتحرك ببطء لتعطي عمقاً
    const nebulaColors = [
        'rgba(120, 0, 255, 0.15)', // بنفسجي أوضح
        'rgba(0, 150, 255, 0.15)', // أزرق أوضح
        'rgba(255, 0, 100, 0.12)'  // وردي أوضح
    ];
    nebulaColors.forEach((col, i) => {
        const nx = canvas.width/2 + Math.sin(tNebula + i) * 200;
        const ny = canvas.height/2 + Math.cos(tNebula * 0.8 + i) * 100;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, canvas.width * 0.6);
        grad.addColorStop(0, col);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    ctx.restore();

    // --- نجوم الخلفية (Parallax Stars) ---
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for(let i=0; i<100; i++) {
        // توليد مواقع عشوائية ثابتة بناءً على المؤشر i
        let sx = (Math.sin(i * 12.9898) * 43758.5453) % 1 * 2000; 
        let sy = (Math.cos(i * 78.233) * 43758.5453) % 1 * 2000;
        if(sx < 0) sx += 2000; if(sy < 0) sy += 2000;

        // حركة المنظر (Parallax) - تتحرك أبطأ من الكاميرا بـ 0.2
        let px = (sx - camera.x * 0.2) % (canvas.width + 200);
        let py = (sy - camera.y * 0.2) % (canvas.height + 200);
        if (px < -100) px += canvas.width + 200;
        if (py < -100) py += canvas.height + 200;

        const size = (i % 2) + 1;
        ctx.fillRect(px - 100, py - 100, size, size);
    }
    ctx.restore();

    // --- شهب (Shooting Stars) ---
    // إضافة شهب جديدة
    if (Math.random() < 0.05) {
        activeShootingStars.push({
            x: Math.random() * canvas.width + 200, // تبدأ من اليمين أو الأعلى
            y: Math.random() * canvas.height * 0.5 - 100,
            len: 100 + Math.random() * 150,
            speed: 20 + Math.random() * 15,
            life: 1.0
        });
    }

    // تحديث ورسم الشهب
    ctx.save();
    for (let i = activeShootingStars.length - 1; i >= 0; i--) {
        let s = activeShootingStars[i];
        s.x -= s.speed; // تتحرك لليسار
        s.y += s.speed * 0.6; // تتحرك للأسفل
        s.life -= 0.02;

        if (s.life <= 0) {
            activeShootingStars.splice(i, 1);
            continue;
        }

        // رسم الذيل المتلاشي
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
    
    ctx.filter = `brightness()`;
    
    // اهتزاز الشاشة
    ctx.save();
    if (Date.now() < shakeEndTime) {
        const dx = (Math.random() - 0.5) * 10;
        const dy = (Math.random() - 0.5) * 10;
        ctx.translate(dx, dy);
    }

    updateCamera();
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 2. رسم منطقة اللعب (The Platform)
    // إضافة ظل للمنصة لتبدو عائمة
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 80;
    ctx.fillStyle = '#0d0d15'; // أرضية سوداء تقريباً لزيادة تباين النيون
    ctx.fillRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.shadowBlur = 0; // إيقاف الظل

    // 3. رسم التفاصيل الأرضية (Checkerboard + Spotlight)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.clip();

    // حساب حدود الرسم الظاهرة فقط (Culling)
    const startX = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endX = startX + canvas.width + GRID_SIZE * 2;
    const startY = Math.floor(camera.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE;
    const endY = startY + canvas.height + GRID_SIZE * 2;

    // رسم نمط رقعة الشطرنج الخفيف
    const time = Date.now() / 2000;
    const scanPos = (time % 1) * (TILE_COUNT_X * GRID_SIZE + 800) - 400; // موجة المسح تتحرك قطرياً

    for (let x = startX; x <= endX; x += GRID_SIZE) {
        for (let y = startY; y <= endY; y += GRID_SIZE) {
            if (x >= 0 && x < TILE_COUNT_X * GRID_SIZE && y >= 0 && y < TILE_COUNT_Y * GRID_SIZE) {
                const col = Math.floor(x / GRID_SIZE);
                const row = Math.floor(y / GRID_SIZE);
                
                let alpha = 0.03;
                let scanIntensity = 0;
                // تأثير المسح الضوئي (Scanline Effect)
                const dist = Math.abs((x + y) - scanPos);
                if (dist < 200) {
                    alpha += (1 - dist / 200) * 0.15; // موجة ضوء قوية جداً
                    scanIntensity = (1 - dist / 200) * 0.15; // موجة ضوء
                }

                if ((col + row) % 2 === 0) {
                    ctx.fillStyle = `rgba(100, 200, 255, )`; // لون سماوي (Cyan) بدلاً من الأبيض
                    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                    // مربع فاتح (Light Tile)
                    ctx.fillStyle = `rgba(45, 50, 65, ${0.6 + scanIntensity})`; 
                } else {
                    // مربع غامق (Dark Tile)
                    ctx.fillStyle = `rgba(20, 25, 35, ${0.6 + scanIntensity})`;
                }
                ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    // إضاءة تتبع اللاعب (Spotlight)
    if (snake.length > 0) {
        const head = snake[0];
        const hx = head.x * GRID_SIZE + GRID_SIZE/2;
        const hy = head.y * GRID_SIZE + GRID_SIZE/2;
        
        const light = ctx.createRadialGradient(hx, hy, 50, hx, hy, 400);
        light.addColorStop(0, 'rgba(255, 255, 255, 0.1)'); // إضاءة أقوى حول اللاعب
        light.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = light;
        ctx.fillRect(startX, startY, endX - startX, endY - startY);
    }

    // --- رسم موجات الصدمة (Shockwaves) ---
    // تُرسم على الأرضية لتكون تحت العناصر
    ctx.save();
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        let sw = shockwaves[i];
        sw.radius += 8; // سرعة التوسع
        sw.alpha -= 0.04; // سرعة التلاشي
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

    ctx.restore(); // إنهاء القص
    
    // 4. رسم حدود العالم (Soft Border)
    const borderPulse = 10 + Math.sin(Date.now() / 800) * 5;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.6)'; // حدود سماوية ساطعة
    ctx.shadowBlur = borderPulse;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, TILE_COUNT_X * GRID_SIZE, TILE_COUNT_Y * GRID_SIZE);
    ctx.shadowBlur = 0; // إعادة تعيين الظل

    // حدود العرض (للاستبعاد - Culling)
    const viewLeft = camera.x - GRID_SIZE * 2;
    const viewRight = camera.x + canvas.width + GRID_SIZE * 2;
    const viewTop = camera.y - GRID_SIZE * 2;
    const viewBottom = camera.y + canvas.height + GRID_SIZE * 2;

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
        // تحسين الأداء: عدم رسم الطعام خارج الشاشة
        const fx = f.x * GRID_SIZE;
        const fy = f.y * GRID_SIZE;
        if (fx < viewLeft || fx > viewRight || fy < viewTop || fy > viewBottom) return;

        const type = FRUIT_TYPES[f.type];
        const cx = fx + GRID_SIZE / 2;
        const cy = fy + GRID_SIZE / 2;
        
        // تأثير التنفس (Breathing Animation)
        const bob = Math.sin(Date.now() / 200) * 1.5;
        const radius = (GRID_SIZE / 2 - 2) + bob;

        // --- منارة ضوئية (Light Beacon) للعناصر النادرة ---
        if (type.points >= 1000) { 
             ctx.save();
             // عمود ضوء يتلاشى للأعلى
             const grad = ctx.createLinearGradient(cx, cy, cx, cy - 400);
             grad.addColorStop(0, type.color.replace('rgb', 'rgba').replace(')', ', 0.3)'));
             grad.addColorStop(1, 'rgba(0,0,0,0)');
             
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.moveTo(cx - 15, cy);
             ctx.lineTo(cx + 15, cy);
             ctx.lineTo(cx, cy - 400);
             ctx.fill();
             
             // قاعدة المنارة
             ctx.fillStyle = type.color;
             ctx.globalAlpha = 0.4;
             ctx.beginPath();
             ctx.ellipse(cx, cy, 20, 6, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        }

        // 1. التوهج الخارجي والجسم الأساسي
        ctx.fillStyle = type.color;
        ctx.shadowColor = glowEnabled ? type.glow : 'transparent';
        ctx.shadowBlur = glowEnabled ? 15 : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. تأثير ثلاثي الأبعاد (لمعة وظل)
        const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.2, cx, cy, radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); // لمعة بيضاء قوية
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)'); // ظل خفيف للحواف
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3. الغصن (Stem) لإعطاء شكل الفاكهة
        ctx.strokeStyle = 'rgba(90, 60, 30, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius + 1);
        ctx.quadraticCurveTo(cx, cy - radius - 4, cx + 4, cy - radius - 2);
        ctx.stroke();

        // --- هالة للطعام النادر (Rare Food Aura) ---
        if (type.points >= 1000) { 
            ctx.save();
            ctx.translate(cx, cy);
            const time = Date.now() / 1000;
            
            // إعدادات التوهج المشتركة
            ctx.shadowColor = type.color;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = type.color;

            // 1. الحلقة الأساسية النابضة (للجميع فوق 1000)
            const pulse = Math.sin(time * 3) * 3;
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 6 + pulse, 0, Math.PI * 2);
            ctx.stroke();

            // 2. حلقة الطاقة الدوارة (للعناصر القوية >= 50,000)
            if (type.points >= 50000) {
                ctx.rotate(time); // دوران
                ctx.globalAlpha = 0.8;
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 12]); // نمط متقطع
                ctx.beginPath();
                ctx.arc(0, 0, radius + 9, 0, Math.PI * 2);
                ctx.setLineDash([3, 6]); // خط متقطع
                // شكل سداسي بدلاً من دائرة للعناصر القوية
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
                
                // جسيمات طاقة تدور (Orbiting Particles)
                ctx.setLineDash([]); // إعادة الخط المتصل
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

            // 3. هالة الفوضى (للعناصر الأسطورية >= 1,000,000)
            if (type.points >= 1000000) {
                ctx.rotate(-time * 2.5); // دوران عكسي سريع
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = type.color;
                const spikes = 8;
                const outerR = radius + 25 + Math.random() * 5; // اهتزاز
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
        // تحسين الأداء: عدم رسم الجسيمات خارج الشاشة
        if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) return;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    const unlockedColors = PRESTIGE_COLORS.filter(c => playerLevel >= c.reqLevel);
    // تثبيت اللون عند الوصول لآخر تطور بدلاً من التكرار
    let colorIndex = prestigeLevel;
    if (colorIndex >= unlockedColors.length) {
        colorIndex = unlockedColors.length - 1;
    }
    const currentColors = unlockedColors[colorIndex];

    // --- محركات الذيل (Tail Thrusters) ---
    if (snake.length > 0 && !isPaused) {
        const tail = snake[snake.length - 1];
        const tx = tail.x * GRID_SIZE + GRID_SIZE/2;
        const ty = tail.y * GRID_SIZE + GRID_SIZE/2;
        
        // انبعاث جسيمات من الذيل
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
        
        // تحسين الأداء: عدم رسم أجزاء الثعبان خارج الشاشة (مفيد للثعابين الطويلة جداً)
        if (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom) return;

        // --- عمود فقري نيون (Neon Spine) ---
        // رسم خط متوهج يربط أجزاء الجسم لتبدو متصلة
        if (index > 0) {
            const prev = snake[index - 1];
            // التحقق من أن الجزء السابق ليس بعيداً جداً (بسبب التفاف الشاشة)
            if (Math.abs(prev.x - part.x) <= 1 && Math.abs(prev.y - part.y) <= 1) {
                const px = prev.x * GRID_SIZE + GRID_SIZE/2;
                const py = prev.y * GRID_SIZE + GRID_SIZE/2;
                const cx = x + GRID_SIZE/2;
                const cy = y + GRID_SIZE/2;

                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // قلب أبيض ساطع للعمود الفقري
                ctx.shadowColor = currentColors.head;
                ctx.shadowBlur = 15; // توهج قوي
                ctx.lineWidth = 4; // خط أنحف لكن أكثر سطوعاً
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(cx, cy);
                ctx.stroke();
                ctx.restore();
            }
        }

        if (index === 0) {
            // --- HEAD ---
            ctx.fillStyle = currentColors.head;
            ctx.shadowColor = glowEnabled ? currentColors.head : 'transparent';
            ctx.shadowBlur = glowEnabled ? 30 : 0; // توهج الرأس مضاعف
            
            // رسم الرأس (مستطيل بحواف دائرية)
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 8);
            if (ctx.roundRect) ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 9);
            else ctx.rect(x, y, GRID_SIZE, GRID_SIZE);
            ctx.fill();
            ctx.shadowBlur = 0;

            // لمعة ثلاثية الأبعاد للرأس
            const headGrad = ctx.createRadialGradient(x + 6, y + 6, 1, x + 6, y + 6, 8);
            headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            headGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = headGrad;
            ctx.fill();

            // العيون (بياض + بؤبؤ)
            ctx.fillStyle = 'white';
            let lx, ly, rx, ry; // إحداثيات العين اليسرى واليمنى
            
            if (velocity.x === 1) { // يمين
                lx = x + 12; ly = y + 4; rx = x + 12; ry = y + 12;
            } else if (velocity.x === -1) { // يسار
                lx = x + 2; ly = y + 4; rx = x + 2; ry = y + 12;
            } else if (velocity.y === -1) { // فوق
                lx = x + 4; ly = y + 2; rx = x + 12; ry = y + 2;
            } else { // تحت
                lx = x + 4; ly = y + 12; rx = x + 12; ry = y + 12;
            }

            // رسم بياض العين
            ctx.beginPath(); ctx.arc(lx + 2, ly + 2, 3.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(rx + 2, ry + 2, 3.5, 0, Math.PI*2); ctx.fill();

            // رسم البؤبؤ (يتحرك مع الاتجاه)
            ctx.fillStyle = 'black';
            let px = velocity.x * 1.5;
            let py = velocity.y * 1.5;
            ctx.beginPath(); ctx.arc(lx + 2 + px, ly + 2 + py, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(rx + 2 + px, ry + 2 + py, 1.5, 0, Math.PI*2); ctx.fill();

            // فتحات الأنف (Nostrils)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            let nx1, ny1, nx2, ny2;
            if (velocity.x === 1) { nx1 = x+16; ny1 = y+7; nx2 = x+16; ny2 = y+13; }
            else if (velocity.x === -1) { nx1 = x+4; ny1 = y+7; nx2 = x+4; ny2 = y+13; }
            else if (velocity.y === -1) { nx1 = x+7; ny1 = y+4; nx2 = x+13; ny2 = y+4; }
            else { nx1 = x+7; ny1 = y+16; nx2 = x+13; ny2 = y+16; }
            ctx.beginPath(); ctx.arc(nx1, ny1, 1.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(nx2, ny2, 1.5, 0, Math.PI*2); ctx.fill();
        } else {
            // --- BODY ---
            // تصغير الذيل (Tapering)
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

            // لمعة (Shine) لإعطاء تأثير ثلاثي الأبعاد
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(x + 6, y + 6, 3, 0, Math.PI * 2);
            // تدرج لوني لإعطاء تأثير كروي/ثلاثي الأبعاد (Gradient Overlay)
            const cx = x + GRID_SIZE / 2;
            const cy = y + GRID_SIZE / 2;
            const bodyGrad = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, 8);
            bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = bodyGrad;
            ctx.fill();

            // --- درع (Armor Detail) ---
            // رسم صفيحة درع في المنتصف لتبدو كحراشف قوية
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'; // لمعة خفيفة
            ctx.beginPath();
            const pad = 5; // هامش للداخل
            if (ctx.roundRect) ctx.roundRect(x + pad, y + pad, GRID_SIZE - pad*2, GRID_SIZE - pad*2, 3);
            else ctx.fillRect(x + pad, y + pad, GRID_SIZE - pad*2, GRID_SIZE - pad*2);
            ctx.fill();
        }
    });

    // --- درع الحماية (Force Field) ---
    // بدلاً من الشفافية، نرسم حقلاً للطاقة حول الرأس
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

    // إعادة الشفافية للوضع الطبيعي لباقي العناصر
    ctx.globalAlpha = 1.0;

    // رسم الأعداء (AI Snakes)
    aiSnakes.forEach(ai => {
        ai.draw(ctx);
    });

    // رسم المقذوفات في النهاية لتظهر فوق الجميع
    projectiles.forEach(p => {
        p.draw(ctx);
    });

    // رسم النصوص العائمة (Floating Texts)
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

    // 5. تأثير العدسة (Vignette) - يضاف فوق كل شيء
    ctx.save();
    const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/3, canvas.width/2, canvas.height/2, canvas.width);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.restore(); // استعادة حالة الاهتزاز
    ctx.filter = 'none';
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
    
    // مسح الخريطة القديمة
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // خلفية الرادار
    minimapCtx.fillStyle = 'rgba(5, 10, 20, 0.85)';
    minimapCtx.fillRect(0, 0, w, h);

    // رسم شبكة الرادار (Square Grid)
    minimapCtx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    minimapCtx.lineWidth = 1;
    
    // رسم خطوط الشبكة بدلاً من الدوائر
    minimapCtx.beginPath(); minimapCtx.rect(w * 0.25, h * 0.25, w * 0.5, h * 0.5); minimapCtx.stroke();
    
    // خطوط التقاطع
    minimapCtx.beginPath(); minimapCtx.moveTo(0, cy); minimapCtx.lineTo(w, cy); minimapCtx.stroke();
    minimapCtx.beginPath(); minimapCtx.moveTo(cx, 0); minimapCtx.lineTo(cx, h); minimapCtx.stroke();
    
    // حساب نسبة التصغير بناءً على حجم الخريطة الحالي
    const scaleX = minimapCanvas.width / TILE_COUNT_X;
    const scaleY = minimapCanvas.height / TILE_COUNT_Y;

    // رسم الطعام (نقاط متوهجة)
    foods.forEach(f => {
        const type = FRUIT_TYPES[f.type];
        minimapCtx.fillStyle = type.color;
        minimapCtx.beginPath();
        minimapCtx.arc(f.x * scaleX + scaleX/2, f.y * scaleY + scaleY/2, Math.max(scaleX/2, 2), 0, Math.PI * 2);
        minimapCtx.fill();
    });

    // رسم الثعبان
    minimapCtx.fillStyle = 'rgba(0, 255, 136, 0.6)'; 
    snake.forEach(p => {
        minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(scaleX, 2), Math.max(scaleY, 2));
    });

    // رسم الأعداء في الخريطة المصغرة (باللون الأحمر)
    minimapCtx.fillStyle = 'rgba(255, 51, 51, 0.8)';
    aiSnakes.forEach(ai => {
        if(ai.isDead) return;
        ai.body.forEach(p => {
            minimapCtx.fillRect(p.x * scaleX, p.y * scaleY, Math.max(scaleX, 2), Math.max(scaleY, 2));
        });
    });

    // رسم سهم الاتجاه عند الرأس
    if (snake.length > 0) {
        const head = snake[0];
        // حساب مركز الرأس في الخريطة المصغرة
        const px = head.x * scaleX + (Math.max(scaleX, 2) / 2);
        const py = head.y * scaleY + (Math.max(scaleY, 2) / 2);
        const size = 3; // حجم السهم

        // حلقة حول اللاعب لتحديد موقعه بوضوح
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 1;
        minimapCtx.beginPath();
        minimapCtx.arc(px, py, 5, 0, Math.PI * 2);
        minimapCtx.stroke();

        minimapCtx.fillStyle = '#ffffff';
        minimapCtx.beginPath();
        if (velocity.x === 1) { // يمين
            minimapCtx.moveTo(px - size, py - size); minimapCtx.lineTo(px + size, py); minimapCtx.lineTo(px - size, py + size);
        } else if (velocity.x === -1) { // يسار
            minimapCtx.moveTo(px + size, py - size); minimapCtx.lineTo(px - size, py); minimapCtx.lineTo(px + size, py + size);
        } else if (velocity.y === 1) { // تحت
            minimapCtx.moveTo(px - size, py - size); minimapCtx.lineTo(px, py + size); minimapCtx.lineTo(px + size, py - size);
        } else if (velocity.y === -1) { // فوق
            minimapCtx.moveTo(px - size, py + size); minimapCtx.lineTo(px, py - size); minimapCtx.lineTo(px + size, py + size);
        }
        minimapCtx.fill();
    }

}