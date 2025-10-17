import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  type: 'normal' | 'bright' | 'giant';
  originalOpacity: number;
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface SpaceBackgroundProps {
  cameraOffsetY: number;
}

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ cameraOffsetY }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
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

      // Generate stars when resizing
      generateStars();
    };

    const generateStars = () => {
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Generate 300 stars with different types
      const stars: Star[] = [];
      for (let i = 0; i < 300; i++) {
        const starType = Math.random();
        let type: 'normal' | 'bright' | 'giant';
        let size: number;
        let color: string;
        let opacity: number;
        
        if (starType < 0.7) {
          // Normal stars (70%)
          type = 'normal';
          size = Math.random() * 1.5 + 0.5;
          color = '#ffffff';
          opacity = Math.random() * 0.6 + 0.3;
        } else if (starType < 0.9) {
          // Bright stars (20%)
          type = 'bright';
          size = Math.random() * 2 + 1;
          color = Math.random() < 0.5 ? '#aaccff' : '#ffccaa';
          opacity = Math.random() * 0.8 + 0.5;
        } else {
          // Giant stars (10%)
          type = 'giant';
          size = Math.random() * 3 + 2;
          color = Math.random() < 0.3 ? '#ffaaaa' : Math.random() < 0.6 ? '#aaaaff' : '#ffffaa';
          opacity = Math.random() * 0.9 + 0.7;
        }
        
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 4 - height * 2, // Distribute stars above and below the viewport
          size,
          opacity,
          originalOpacity: opacity,
          speed: Math.random() * 0.08 + 0.02,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
          type
        });
      }
      starsRef.current = stars;
    };

    const drawStar = (ctx: CanvasRenderingContext2D, star: Star, x: number, y: number) => {
      const twinkle = Math.sin(timeRef.current * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      const currentOpacity = star.originalOpacity * twinkle;
      
      if (star.type === 'giant') {
        // Draw giant stars with glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3);
        gradient.addColorStop(0, hexToRgba(star.color, currentOpacity));
        gradient.addColorStop(0.5, hexToRgba(star.color, currentOpacity * 0.5));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (star.type === 'bright') {
        // Draw bright stars with small glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 2);
        gradient.addColorStop(0, hexToRgba(star.color, currentOpacity));
        gradient.addColorStop(0.7, hexToRgba(star.color, currentOpacity * 0.25));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, star.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw the star core
      ctx.fillStyle = `${star.color}${Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add star spikes for bright and giant stars
      if (star.type !== 'normal') {
        ctx.strokeStyle = `${star.color}${Math.floor(currentOpacity * 128).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        
        // Draw 4 spikes
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const spikeLength = star.size * 2;
          const startX = x + Math.cos(angle) * star.size;
          const startY = y + Math.sin(angle) * star.size;
          const endX = x + Math.cos(angle) * spikeLength;
          const endY = y + Math.sin(angle) * spikeLength;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    };

    const animate = (timestamp: number) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      timeRef.current = timestamp * 0.001; // Convert to seconds
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Clear canvas with a subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#000011');
      gradient.addColorStop(1, '#000022');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw stars
      starsRef.current.forEach(star => {
        // Adjust star position based on camera offset
        const adjustedY = star.y + cameraOffsetY * star.speed;
        
        // Wrap stars vertically
        const wrappedY = ((adjustedY % (height * 4)) + (height * 4)) % (height * 4) - height * 2;
        
        // Only draw stars that are visible
        if (wrappedY > -star.size && wrappedY < height + star.size) {
          drawStar(ctx, star, star.x, wrappedY);
        }
      });
      
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
        zIndex: 0
      }}
    />
  );
};

export default SpaceBackground;
