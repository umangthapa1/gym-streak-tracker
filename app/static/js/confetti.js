// Confetti Animation
class Confetti {
    constructor() {
        this.canvas = document.getElementById('confetti');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    burst(x, y, count = 50) {
        const colors = ['#818cf8', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 5 + Math.random() * 8;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 2,
                life: 1,
                decay: Math.random() * 0.015 + 0.015
            });
        }

        if (!this.animationId) {
            this.animate();
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles = this.particles.filter(p => p.life > 0);

        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life -= particle.decay;

            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.animationId = null;
        }
    }
}

const confetti = new Confetti();
