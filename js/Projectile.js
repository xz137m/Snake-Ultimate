class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 100;
        this.radius = 18;
        this.color = '#ff4500';
        this.trail = [];
    }

    update() {
        this.trail.push({
            x: this.x + (Math.random() - 0.5) * 0.3,
            y: this.y + (Math.random() - 0.5) * 0.3
        });
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

        if (typeof camera !== 'undefined' && typeof canvas !== 'undefined') {
            const margin = 200;
            if (cx < camera.x - margin || cx > camera.x + canvas.width + margin ||
                cy < camera.y - margin || cy > camera.y + canvas.height + margin) {
                return;
            }
        }
        
        ctx.save();
        this.trail.forEach((point, index) => {
            const tCx = point.x * GRID_SIZE + GRID_SIZE / 2;
            const tCy = point.y * GRID_SIZE + GRID_SIZE / 2;
            
            const ratio = index / this.trail.length;
            
            const redComp = 80 + (100 * ratio);
            ctx.fillStyle = `rgba(${redComp}, 80, 80, ${ratio * 0.5})`;
            ctx.beginPath();
            ctx.arc(tCx, tCy, this.radius * (0.4 + 0.6 * ratio) + (index % 2), 0, Math.PI * 2);
            ctx.fill();

            if (Math.random() > 0.6) {
                ctx.fillStyle = `rgba(255, 220, 50, ${ratio})`;
                ctx.fillRect(tCx + (Math.random()-0.5)*20, tCy + (Math.random()-0.5)*20, 2, 2);
            }
        });
        ctx.restore();

        const time = Date.now();
        const pulse = Math.sin(time / 80) * 2;
        const flicker = (Math.random() - 0.5) * 2;

        ctx.save();
        
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 25 + pulse;
        
        const grd = ctx.createRadialGradient(cx, cy, this.radius * 0.2, cx, cy, this.radius + pulse);
        grd.addColorStop(0, '#ffff00');
        grd.addColorStop(0.4, '#ff8800');
        grd.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius + pulse + flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, (this.radius * 0.3) + flicker/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}