class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 100; // زيادة العمر لضمان وصولها للاعب (حوالي 10 ثواني)
        this.radius = 18; // تكبير الحجم بشكل ملحوظ لتصبح أكبر من الفواكه
        this.color = '#ff4500'; // لون برتقالي محمر (ناري)
        this.trail = []; // مصفوفة لتخزين نقاط الذيل الدخاني
    }

    update() {
        // إضافة الموقع الحالي للذيل مع انحراف بسيط (Jitter) لمحاكاة الدخان المتطاير
        this.trail.push({
            x: this.x + (Math.random() - 0.5) * 0.3,
            y: this.y + (Math.random() - 0.5) * 0.3
        });
        // الحفاظ على طول الذيل (20 نقطة ليكون طويلاً وواضحاً)
        if (this.trail.length > 20) {
            this.trail.shift();
        }

        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        const cx = this.x * GRID_SIZE + GRID_SIZE / 2;
        const cy = this.y * GRID_SIZE + GRID_SIZE / 2;

        // تحسين الأداء: التحقق مما إذا كانت القذيفة داخل حدود العرض الحالية للكاميرا
        // نستخدم المتغيرات العامة للكاميرا والقماش المعرفة في state.js/main.js
        if (typeof camera !== 'undefined' && typeof canvas !== 'undefined') {
            const margin = 200; // هامش كبير لأن الذيل قد يكون طويلاً
            if (cx < camera.x - margin || cx > camera.x + canvas.width + margin ||
                cy < camera.y - margin || cy > camera.y + canvas.height + margin) {
                return; // لا ترسم إذا كانت بعيدة جداً
            }
        }
        
        // --- رسم الذيل الدخاني (Smoke Trail) ---
        ctx.save();
        this.trail.forEach((point, index) => {
            const tCx = point.x * GRID_SIZE + GRID_SIZE / 2;
            const tCy = point.y * GRID_SIZE + GRID_SIZE / 2;
            
            // النسبة: 0 (نهاية الذيل) -> 1 (بداية الذيل عند الكرة)
            const ratio = index / this.trail.length;
            
            // رسم دخان رمادي يتلاشى مع تدرج لوني (رمادي محمر قرب الكرة)
            const redComp = 80 + (100 * ratio);
            ctx.fillStyle = `rgba(${redComp}, 80, 80, ${ratio * 0.5})`;
            ctx.beginPath();
            // تنويع حجم الدخان قليلاً لتقليل التكرار
            ctx.arc(tCx, tCy, this.radius * (0.4 + 0.6 * ratio) + (index % 2), 0, Math.PI * 2);
            ctx.fill();

            // إضافة شرار (Sparks) عشوائي في الذيل لإعطاء تأثير الاحتراق
            if (Math.random() > 0.6) {
                ctx.fillStyle = `rgba(255, 220, 50, ${ratio})`;
                ctx.fillRect(tCx + (Math.random()-0.5)*20, tCy + (Math.random()-0.5)*20, 2, 2);
            }
        });
        ctx.restore();

        // تأثير النبض (Pulsing) لمحاكاة احتراق النار
        const time = Date.now();
        const pulse = Math.sin(time / 80) * 2;
        const flicker = (Math.random() - 0.5) * 2; // رجفة عشوائية للنار

        ctx.save();
        
        // 1. التوهج الخارجي الكبير (أحمر)
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 25 + pulse;
        
        // استخدام تدرج لوني (Gradient) للكرة الرئيسية لتبدو ثلاثية الأبعاد
        const grd = ctx.createRadialGradient(cx, cy, this.radius * 0.2, cx, cy, this.radius + pulse);
        grd.addColorStop(0, '#ffff00'); // أصفر في المركز
        grd.addColorStop(0.4, '#ff8800'); // برتقالي
        grd.addColorStop(1, '#ff0000'); // أحمر في الأطراف
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius + pulse + flicker, 0, Math.PI * 2);
        ctx.fill();

        // 2. النواة (أبيض ساطع) - مركز الحرارة
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, (this.radius * 0.3) + flicker/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}