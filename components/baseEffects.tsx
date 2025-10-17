import React, { useRef, useEffect } from 'react';

interface baseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'hexagon' | 'bar' | 'sparkle';
}

interface baseEffectsProps {
  cameraOffsetY: number;
  playerX: number;
  playerY: number;
  isLaunching: boolean;
}

const baseEffects: React.FC<baseEffectsProps> = ({ 
  cameraOffsetY, 
  playerX, 
  playerY, 
  isLaunching 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<baseParticle[]>([]);
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    const createbaseParticle = (x: number, y: number, type: 'hexagon' | 'bar' | 'sparkle'): baseParticle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 100;
      
      let color: string;
      let size: number;
      
      switch (type) {
        case 'hexagon':
          color = Math.random() < 0.5 ? '#4A90E2' : '#2D374B';
          size = Math.random() * 4 + 2;
          break;
        case 'bar':
          color = Math.random() < 0.3 ? '#FFFFFF' : '#4A90E2';
          size = Math.random() * 3 + 1;
          break;
        case 'sparkle':
          color = '#4A90E2';
          size = Math.random() * 2 + 1;
          break;
      }
      
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size,
        color,
        type
      };
    };

    const spawnbaseParticles = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const type = Math.random() < 0.4 ? 'hexagon' : Math.random() < 0.7 ? 'bar' : 'sparkle';
        particlesRef.current.push(createbaseParticle(x, y, type));
      }
    };

    const drawbaseParticle = (ctx: CanvasRenderingContext2D, particle: baseParticle) => {
      const alpha = particle.life / particle.maxLife;
      const x = particle.x;
      const y = particle.y - cameraOffsetY;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      switch (particle.type) {
        case 'hexagon':
          // Draw hexagon shape
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + Math.cos(angle) * particle.size;
            const py = y + Math.sin(angle) * particle.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'bar':
          // Draw base-style bar
          ctx.fillStyle = particle.color;
          ctx.fillRect(x - particle.size/2, y - particle.size * 2, particle.size, particle.size * 4);
          break;
          
        case 'sparkle':
          // Draw sparkle
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(x, y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add sparkle lines
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - particle.size * 2, y);
          ctx.lineTo(x + particle.size * 2, y);
          ctx.moveTo(x, y - particle.size * 2);
          ctx.lineTo(x, y + particle.size * 2);
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    };

    const animate = (timestamp: number) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      timeRef.current = timestamp * 0.001;
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Spawn particles when launching
      if (isLaunching && Math.random() < 0.3) {
        spawnbaseParticles(playerX, playerY, 3);
      }
      
      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        
        // Update position
        particle.x += particle.vx * 0.016;
        particle.y += particle.vy * 0.016;
        particle.life -= 0.016;
        
        // Remove if dead
        if (particle.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        
        // Only draw if visible
        const screenY = particle.y - cameraOffsetY;
        if (screenY > -particle.size && screenY < height + particle.size) {
          drawbaseParticle(ctx, particle);
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraOffsetY, playerX, playerY, isLaunching]);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none'
      }}
    />
  );
};

export default baseEffects;
