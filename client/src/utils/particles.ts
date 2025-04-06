export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  addExplosion(x: number, y: number, color: string = '#ff0000') {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: Math.random() * 4 + 2
      });
    }
  }

  addSmoke(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        color: `rgba(100, 100, 100, ${Math.random() * 0.5 + 0.5})`,
        size: Math.random() * 6 + 4
      });
    }
  }

  addTankTrail(x: number, y: number, angle: number) {
    const trailX = x - Math.cos(angle) * 20;
    const trailY = y - Math.sin(angle) * 20;
    
    this.particles.push({
      x: trailX,
      y: trailY,
      vx: 0,
      vy: 0,
      life: 0.5,
      color: 'rgba(50, 50, 50, 0.3)',
      size: Math.random() * 3 + 2
    });
  }

  addParticle(particle: Particle) {
    this.particles.push(particle);
  }

  update(deltaTime: number = 0.016) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= deltaTime;
      particle.size *= 0.98;
      return particle.life > 0;
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    });
  }
} 