class Pet {
    constructor(typeId) {
        this.data = PET_TYPES.find(p => p.id === typeId);
        if (!this.data) this.data = PET_TYPES[0]; // Fallback
        
        // Start near player
        if (typeof snake !== 'undefined' && snake.length > 0) {
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
        this.floatOffset = 0;
        this.tick = 0; // AI Throttle Counter
        this.cachedTarget = null; // Store target between frames
    }

    update() {
        if (typeof snake === 'undefined' || snake.length === 0) return;
        const head = snake[0];
        this.floatOffset += 0.1;
        this.tick++;

        // Animation Decay
        if (this.scale > 1.0) this.scale -= 0.05;
        else this.scale = 1.0;

        // 1. Find Target (Throttled: Run every 10 frames)
        let target = this.cachedTarget;
        
        if (this.tick % 10 === 0 || !target) {
            let minDist = Infinity;
            target = null;
            
            for (let f of foods) {
                const dx = this.x - f.x;
                const dy = this.y - f.y;
                const distSq = dx*dx + dy*dy;
                if (distSq < minDist) {
                    minDist = distSq;
                    target = { x: f.x, y: f.y, type: 'fruit', obj: f };
                }
            }
            // If no target, follow player
            if (!target) {
                target = { x: head.x - (velocity.x * 2), y: head.y - (velocity.y * 2), type: 'player' };
            }
            this.cachedTarget = target;
        }

        // Fallback safety
        if (!target) target = { x: head.x, y: head.y };

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
        // Optimization: Reduced from 50 to 15 (Strictly for 3 segments)
        if (this.history.length > 15) this.history.pop();

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
            const dx = this.x - f.x;
            const dy = this.y - f.y;
            if (dx*dx + dy*dy < 2.25) { // 1.5 * 1.5 = 2.25 (Squared check is faster)
                // Use Unified Reward Function
                if (typeof window.givePlayerRewards === 'function') {
                    window.givePlayerRewards(f.type, f.x, f.y);
                }
                
                this.scale = 1.4; // Scale-up Animation
                foods.splice(i, 1);
                // Note: manageChunks in game.js will automatically refill food
                break;
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
            
            // Floating Animation (Wave effect)
            const floatY = Math.sin(this.floatOffset + index * 0.5) * 3;
            const cx = x + GRID_SIZE / 2;
            const cy = y + GRID_SIZE / 2 + floatY;
            
            if (viewRight > 0 && (x < viewLeft || x > viewRight || y < viewTop || y > viewBottom)) return;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.scale, this.scale);

            // Tapering Size (Tail gets smaller)
            let currentSize = GRID_SIZE - 2;
            if (index > 0) {
                currentSize *= (1 - (index * 0.12)); 
            }

            // Shadow underneath (to emphasize floating)
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, currentSize/2 + 4, currentSize/2, currentSize/4, 0, 0, Math.PI*2);
            ctx.fill();

            // Professional Design: Gradient & Glow
            const grad = ctx.createLinearGradient(-currentSize/2, -currentSize/2, currentSize/2, currentSize/2);
            grad.addColorStop(0, this.data.color);
            grad.addColorStop(1, 'rgba(0,0,0,0.6)'); // Simple gradient

            ctx.fillStyle = grad;
            // Removed shadowBlur for performance

            if (index === 0) {
                // Head with Directional Eyes
                ctx.rotate(this.angle);
                
                // Draw Head (Rounded)
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-currentSize/2, -currentSize/2, currentSize, currentSize, 8);
                else ctx.rect(-currentSize/2, -currentSize/2, currentSize, currentSize);
                ctx.fill();
                
                // Glossy Highlight
                const shine = ctx.createLinearGradient(-currentSize/2, -currentSize/2, currentSize/2, currentSize/2);
                shine.addColorStop(0, 'rgba(255,255,255,0.5)');
                shine.addColorStop(0.5, 'rgba(255,255,255,0)');
                ctx.fillStyle = shine;
                ctx.fill();
                
                // Rim Light (Edge Highlight)
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Eyes (Detailed)
                
                // Eye Whites
                ctx.fillStyle = '#ffffff'; 
                ctx.beginPath(); ctx.ellipse(4, -4, 4, 4.5, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(4, 4, 4, 4.5, 0, 0, Math.PI*2); ctx.fill();
                
                // Pupils
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(5, -4, 2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(5, 4, 2, 0, Math.PI*2); ctx.fill();
                
                // Eye Sparkle
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(6, -5, 1, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(6, 3, 1, 0, Math.PI*2); ctx.fill();
            } else {
                // Body Segments
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(-currentSize/2, -currentSize/2, currentSize, currentSize, 6);
                else ctx.rect(-currentSize/2, -currentSize/2, currentSize, currentSize);
                ctx.fill();
                
                // Body Highlight
                const shine = ctx.createLinearGradient(-currentSize/2, -currentSize/2, currentSize/2, currentSize/2);
                shine.addColorStop(0, 'rgba(255,255,255,0.3)');
                shine.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = shine;
                ctx.fill();
                
                // Rim Light
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        });
    }
}
