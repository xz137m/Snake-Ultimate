class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 150; // عدد الإطارات قبل أن تختفي
        this.radius = 5;
        this.color = '#ab47bc'; // لون السم
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#f06292';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(
            this.x * GRID_SIZE + GRID_SIZE / 2, 
            this.y * GRID_SIZE + GRID_SIZE / 2, 
            this.radius, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }
}