class Pet {
    constructor(typeId) {
        this.data = PET_TYPES.find(p => p.id === typeId);
        if (!this.data) this.data = PET_TYPES[0]; // Fallback
        
        // Start near player
        if (snake.length > 0) {
            this.x = snake[0].x;
            this.y = snake[0].y;
        } else {
            this.x = 10;
            this.y = 10;
        }
        
        this.history = []; // History of positions for smooth trailing
        this.body = []; // Visual body segments
        
        // Physics & State
        this.angle = 0;
        // Legendary pets turn faster (better maneuvering)
        this.turnSpeed = this.data.rarity === 'Legendary' ? 0.2 : 0.1; 
        this.scale = 1.0; // For animation
    }

    update() {
        if (typeof snake === 'undefined' || snake.length === 0) return;
        const head = snake[0];

        // Animation Decay
        if (this.scale > 1.0) this.scale -= 0.05;
        else this.scale = 1.0;

        // 1. Find Target (Food Only)
        let target = null;
        let minDist = Infinity;

        for (let f of foods) {
            const dist = Math.sqrt(Math.pow(this.x - f.x, 2) + Math.pow(this.y - f.y, 2));
            if (dist < minDist) {
                minDist = dist;
                target = { x: f.x, y: f.y, type: 'fruit', obj: f };
            }
        }

        // If no target, follow player
        if (!target) {
            target = { x: head.x - (velocity.x * 2), y: head.y - (velocity.y * 2), type: 'player' };
        }

        // 2. AI Steering (Gradual Turn)
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        let desiredAngle = Math.atan2(dy, dx);

        // Smooth Rotation
        let diff = desiredAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        if (Math.abs(diff) < this.turnSpeed) {
            this.angle = desiredAngle;
        } else {
            this.angle += Math.sign(diff) * this.turnSpeed;
        }

        // Apply Velocity
        this.x += Math.cos(this.angle) * this.data.speed;
        this.y += Math.sin(this.angle) * this.data.speed;

        // 3. Update History & Body (Segment Follow Logic)
        this.history.unshift({x: this.x, y: this.y});
        
        // Keep enough history for 3 segments (approx 1.0 distance apart)
        // Speed varies, so we keep a safe buffer
        if (this.history.length > 50) this.history.pop();

        this.body = [];
        let currentDist = 0;
        let lastNode = this.history[0];
        
        for(let i=1; i<this.history.length; i++) {
            const node = this.history[i];
            currentDist += Math.hypot(node.x - lastNode.x, node.y - lastNode.y);
            if (currentDist >= 0.8) { // Spacing between squares
                this.body.push(node);
                lastNode = node;
                currentDist = 0;
                if (this.body.length >= 3) break; // Max 3 segments
            }
        }

        // 4. Interaction (Eat Food)
        for (let i = 0; i < foods.length; i++) {
            const f = foods[i];
            if (Math.hypot(this.x - f.x, this.y - f.y) < 1.5) {
                // Eat the food
                let fruit = FRUIT_TYPES[f.type];
                
                // Calculate Rewards (Simplified)
                let prestigeMult = Math.pow(2, prestigeLevel || 0);
                let levelMult = Math.pow(1.5, (playerLevel || 1) - 1);
                let scoreUpgrade = 1 + Math.log10(1 + (upgrades.scoreMult || 0)) * 0.5;
                
                let points = fruit.points * scoreUpgrade * prestigeMult * levelMult;
                let gold = fruit.gold * scoreUpgrade * prestigeMult * levelMult;
                let xp = fruit.xp * prestigeMult;

                // Shared Rewards: Add directly to player stats
                if (typeof score !== 'undefined') score += Math.floor(points);
                if (typeof coins !== 'undefined') coins += Math.floor(gold);
                if (typeof currentXp !== 'undefined') currentXp += Math.floor(xp);
                if (typeof growthBuffer !== 'undefined') growthBuffer += (fruit.growth + (upgrades.growthBoost || 0) - 1);
                
                if (typeof updateScore === 'function') updateScore();
                if (typeof createParticles === 'function') createParticles(f.x * GRID_SIZE + GRID_SIZE/2, f.y * GRID_SIZE + GRID_SIZE/2, fruit.color);
                if (typeof playSound === 'function') playSound('eat');
                
                this.scale = 1.4; // Scale-up Animation
                foods.splice(i, 1);
                // Note: manageChunks in game.js will automatically refill food
                break;
            }
        }

        // 5. Interaction (Enemies) - Shared Kill Rewards
        if (typeof aiSnakes !== 'undefined') {
            for (let ai of aiSnakes) {
                if (ai.isDead || ai.body.length === 0) continue;
                const aiHead = ai.body[0];
                if (Math.hypot(this.x - aiHead.x, this.y - aiHead.y) < 1.5) {
                    let slayerGoldMult = (1 + (slayerUpgrades.gold1 || 0) * 0.05) * (1 + (slayerUpgrades.gold2 || 0) * 0.10);
                    if (typeof grantKillRewards === 'function') grantKillRewards(ai, slayerGoldMult);
                    createParticles(this.x * GRID_SIZE, this.y * GRID_SIZE, this.data.color);
                    this.scale = 1.4; // Attack Animation
                }
            }
        }
    }

    draw(ctx) {
        let viewLeft = 0, viewRight = 0, viewTop = 0, viewBottom = 0;
        if (typeof camera !== 'undefined' && typeof canvas !== 'undefined') {
            viewLeft = camera.x - GRID_SIZE * 2;
            viewRight = camera.x + canvas.width + GRID_SIZE * 2;
            viewTop = camera.y - GRID_SIZE * 2;
            viewBottom = camera.y + canvas.height + GRID_SIZE * 2;
        }

        // Legendary Particle Trail
        if (this.data.rarity === 'Legendary' && !isPaused) {
            const tail = this.body.length > 0 ? this.body[this.body.length - 1] : {x: this.x, y: this.y};
            if (Math.random() < 0.4) {
                createParticles(tail.x * GRID_SIZE + GRID_SIZE/2, tail.y * GRID_SIZE + GRID_SIZE/2, '#9400d3');
            }
        }

        const fullBody = [{x: this.x, y: this.y}, ...this.body];

        fullBody.forEach((part, index) => {
            const x = part.x * GRID_SIZE;
            const y = part.y * GRID_SIZE;
            const cx = x + GRID_SIZE / 2;
            const cy = y + GRID_SIZE / 2;
            
            if (viewRight > 0 && (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom)) return;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.scale, this.scale);

            // Professional Design: Gradient & Glow
            const size = GRID_SIZE - 2;
            const grad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
            grad.addColorStop(0, this.data.color);
            grad.addColorStop(1, 'rgba(0,0,0,0.6)'); // Darker shade for depth

            ctx.fillStyle = grad;
            ctx.shadowColor = this.data.color;
            ctx.shadowBlur = 15;

            if (index === 0) {
                // Head with Directional Eyes
                ctx.rotate(this.angle);
                ctx.fillRect(-size/2, -size/2, size, size);

                // Eyes
                ctx.fillStyle = '#ffffff'; 
                ctx.beginPath(); ctx.arc(4, -4, 3, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI*2); ctx.fill();
                
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(5, -4, 1.5, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(5, 4, 1.5, 0, Math.PI*2); ctx.fill();
            } else {
                // Body Segments
                ctx.fillRect(-size/2 + 1, -size/2 + 1, size - 2, size - 2);
            }
            ctx.restore();
        });
    }
}