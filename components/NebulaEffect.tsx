import React, { useRef, useEffect } from 'react';
import { ColorTheme } from '@/types/game';
import { colorThemes } from '@/utils/themeSystem';

interface NebulaEffectProps {
  cameraOffsetY: number;
  score: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  driftSpeed: number;
  driftPhase: number;
  type: 'small' | 'medium' | 'large';
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const NebulaEffect: React.FC<NebulaEffectProps> = ({ cameraOffsetY, score }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nebulasRef = useRef<Nebula[]>([]);
  const requestRef = useRef<number>();
  const lastGeneratedYRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const THEME_SCORE_GAP = 3000;
  const THEME_CYCLE_LENGTH = colorThemes.length * THEME_SCORE_GAP;

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

    const generateNebula = (y: number) => {
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      
      // Get current theme based on score
      const normalizedScore = score % THEME_CYCLE_LENGTH;
      const themeIndex = Math.floor(normalizedScore / THEME_SCORE_GAP);
      const theme = colorThemes[themeIndex];
      
      // Use theme colors for nebula
      const colors = [
        theme.arrowPrimary,
        theme.arrowSecondary,
        theme.platformColor
      ];
      
      // Determine nebula type
      const typeRand = Math.random();
      let type: 'small' | 'medium' | 'large';
      let radius: number;
      let opacity: number;
      
      if (typeRand < 0.6) {
        type = 'small';
        radius = Math.random() * 60 + 30;
        opacity = Math.random() * 0.08 + 0.03;
      } else if (typeRand < 0.9) {
        type = 'medium';
        radius = Math.random() * 120 + 80;
        opacity = Math.random() * 0.12 + 0.05;
      } else {
        type = 'large';
        radius = Math.random() * 200 + 150;
        opacity = Math.random() * 0.18 + 0.08;
      }
      
      // Create a new nebula
      const nebula: Nebula = {
        x: Math.random() * width,
        y: y,
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity,
        pulseSpeed: Math.random() * 0.01 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.02 + 0.01,
        driftPhase: Math.random() * Math.PI * 2,
        type
      };
      
      nebulasRef.current.push(nebula);
      lastGeneratedYRef.current = y;
    };

    const checkAndGenerateNebulas = () => {
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const height = canvas.height / dpr;
      
      // Generate new nebulas as camera moves up
      const currentCameraTop = cameraOffsetY;
      const currentCameraBottom = cameraOffsetY + height;
      
      // Generate a nebula every 500-1000 pixels of height
      const nebulaSpacing = Math.random() * 500 + 500;
      
      // If we've moved up enough, generate a new nebula
      if (lastGeneratedYRef.current === 0 || currentCameraTop < lastGeneratedYRef.current - nebulaSpacing) {
        generateNebula(currentCameraTop - Math.random() * 200);
      }
      
      // Clean up nebulas that are too far below the camera
      nebulasRef.current = nebulasRef.current.filter(
        nebula => nebula.y > currentCameraTop - height * 2 && nebula.y < currentCameraBottom + height
      );
    };

    const animate = (timestamp: number) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      timeRef.current = timestamp * 0.001; // Convert to seconds
      
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Clear canvas with transparency
      ctx.clearRect(0, 0, width, height);
      
      // Check if we need to generate new nebulas
      checkAndGenerateNebulas();
      
      // Draw nebulas
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      nebulasRef.current.forEach(nebula => {
        // Calculate pulsing and drifting effects
        const pulse = Math.sin(timeRef.current * nebula.pulseSpeed + nebula.pulsePhase) * 0.3 + 0.7;
        const driftX = Math.sin(timeRef.current * nebula.driftSpeed + nebula.driftPhase) * 20;
        const driftY = Math.cos(timeRef.current * nebula.driftSpeed * 0.7 + nebula.driftPhase) * 10;
        
        const currentX = nebula.x + driftX;
        const currentY = nebula.y - cameraOffsetY + driftY;
        const currentRadius = nebula.radius * pulse;
        const currentOpacity = nebula.opacity * pulse;
        
        // Create multiple gradient layers for more realistic nebula effect
        const gradient1 = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, currentRadius * 0.3
        );
        gradient1.addColorStop(0, hexToRgba(nebula.color, currentOpacity));
        gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        const gradient2 = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, currentRadius * 0.7
        );
        gradient2.addColorStop(0, hexToRgba(nebula.color, currentOpacity * 0.5));
        gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        const gradient3 = ctx.createRadialGradient(
          currentX, currentY, 0,
          currentX, currentY, currentRadius
        );
        gradient3.addColorStop(0, hexToRgba(nebula.color, currentOpacity * 0.25));
        gradient3.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Draw the nebula layers
        ctx.fillStyle = gradient3;
        ctx.beginPath();
        ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(currentX, currentY, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(currentX, currentY, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.restore();
      
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
  }, [cameraOffsetY, score]);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default NebulaEffect;
