import React, { useRef, useEffect } from 'react';

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

interface CosmicDust {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  driftX: number;
  driftY: number;
}

interface SpaceEffectsProps {
  cameraOffsetY: number;
}

const SpaceEffects: React.FC<SpaceEffectsProps> = ({ cameraOffsetY }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const cosmicDustRef = useRef<CosmicDust[]>([]);
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const lastShootingStarTimeRef = useRef<number>(0);

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

      // Generate cosmic dust when resizing
      generateCosmicDust();
    };

    const generateCosmicDust = () => {
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Generate 50 cosmic dust particles
      const dust: CosmicDust[] = [];
      for (let i = 0; i < 50; i++) {
        dust.push({
          x: Math.random() * width,
          y: Math.random() * height * 3 - height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.1,
          speed: Math.random() * 0.03 + 0.01,
          driftX: (Math.random() - 0.5) * 0.5,
          driftY: (Math.random() - 0.5) * 0.5
        });
      }
      cosmicDustRef.current = dust;
    };

    const createShootingStar = () => {
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Create shooting star from random edge
      const edge = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      
      switch (edge) {
        case 0: // Top
          x = Math.random() * width;
          y = -50;
          vx = (Math.random() - 0.5) * 200;
          vy = Math.random() * 300 + 200;
          break;
        case 1: // Right
          x = width + 50;
          y = Math.random() * height;
          vx = -(Math.random() * 300 + 200);
          vy = (Math.random() - 0.5) * 200;
          break;
        case 2: // Bottom
          x = Math.random() * width;
          y = height + 50;
          vx = (Math.random() - 0.5) * 200;
          vy = -(Math.random() * 300 + 200);
          break;
        default: // Left
          x = -50;
          y = Math.random() * height;
          vx = Math.random() * 300 + 200;
          vy = (Math.random() - 0.5) * 200;
      }
      
      const shootingStar: ShootingStar = {
        x,
        y,
        vx,
        vy,
        life: 1,
        maxLife: 1,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.5
      };
      
      shootingStarsRef.current.push(shootingStar);
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
      
      // Create shooting stars occasionally
      if (timestamp - lastShootingStarTimeRef.current > 3000 + Math.random() * 5000) {
        createShootingStar();
        lastShootingStarTimeRef.current = timestamp;
      }
      
      // Update and draw cosmic dust
      cosmicDustRef.current.forEach(dust => {
        // Update position
        dust.y += cameraOffsetY * dust.speed;
        dust.x += dust.driftX;
        dust.y += dust.driftY;
        
        // Wrap dust vertically
        const wrappedY = ((dust.y % (height * 3)) + (height * 3)) % (height * 3) - height;
        
        // Only draw if visible
        if (wrappedY > -dust.size && wrappedY < height + dust.size && 
            dust.x > -dust.size && dust.x < width + dust.size) {
          
          // Twinkling effect
          const twinkle = Math.sin(timeRef.current * 2 + dust.x * 0.01) * 0.3 + 0.7;
          const currentOpacity = dust.opacity * twinkle;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(dust.x, wrappedY, dust.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Update and draw shooting stars
      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const star = shootingStarsRef.current[i];
        
        // Update position
        star.x += star.vx * 0.016; // Assuming 60fps
        star.y += star.vy * 0.016;
        star.life -= 0.016;
        
        // Remove if dead or off screen
        if (star.life <= 0 || star.x < -100 || star.x > width + 100 || 
            star.y < -100 || star.y > height + 100) {
          shootingStarsRef.current.splice(i, 1);
          continue;
        }
        
        // Draw shooting star with trail
        const alpha = star.life / star.maxLife;
        const trailLength = 30 * alpha;
        
        // Create gradient for trail
        const gradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x - star.vx * 0.1, star.y - star.vy * 0.1
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Draw trail
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.vx * 0.1, star.y - star.vy * 0.1);
        ctx.stroke();
        
        // Draw star head
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
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
  }, [cameraOffsetY]);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none'
      }}
    />
  );
};

export default SpaceEffects;
