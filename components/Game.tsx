import React, { useRef, useEffect, useState } from 'react';
import { Player, Platform, Particle, DragState, GameState, ArrowImages, PlatformImages } from '@/types/game';
import { colorThemes, THEME_SCORE_GAP, THEME_CYCLE_LENGTH, updateThemeBasedOnScore, animateThemeTransition } from '@/utils/themeSystem';
import { lerp } from '@/utils/colorUtils';
import SpaceBackground from './SpaceBackground';
import NebulaEffect from './NebulaEffect';
import SpaceEffects from './SpaceEffects';
import BaseEffects from './baseEffects';
import GameOverlay from './GameOverlay';
import GameLoader from './GameLoader';
import GiftBox from './GiftBox';

// Constants
const DRAG_THRESHOLD_MEDIUM = 35;
const DRAG_THRESHOLD_LARGE = 70;
const MAX_VELOCITY = 3000;
const GRAVITY = 3000;

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showGameOverlay, setShowGameOverlay] = useState(false);
  const [showGiftBox, setShowGiftBox] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  // Game state
  const gameStateRef = useRef<GameState>({
    gameOver: false,
    score: 0,
    cameraOffsetY: 0,
    startY: 0,
    highestY: 0,
    lastTime: 0
  });
  
  // Player state
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    baseSize: 20,
    onPlatform: true,
    attachedPlatform: null
  });
  
  // Platforms and particles
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Drag state
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    start: null,
    current: null
  });
  
  // Arrow images
  const arrowImagesRef = useRef<ArrowImages>({
    short: new Image(),
    medium: new Image(),
    large: new Image(),
    shortLoaded: false,
    mediumLoaded: false,
    largeLoaded: false
  });

  // Platform images
  const platformImagesRef = useRef<PlatformImages>({
    asteroid: new Image(),
    spaceStation: new Image(),
    crystal: new Image(),
    energy: new Image(),
    asteroidLoaded: false,
    spaceStationLoaded: false,
    crystalLoaded: false,
    energyLoaded: false
  });
  
  // Theme state
  const currentThemeIndexRef = useRef(0);
  const isAnimatingThemeRef = useRef(false);
  const lastSVGUpdateTimeRef = useRef(0);
  
  // Farcade SDK
  const farcadeSDKRef = useRef<any>(null);
  
  // Initialize the game
  useEffect(() => {
    if (isInitialized || !assetsLoaded) return;
    
    // Listen for specific connector error and refresh the page as a recovery
    const shouldRefreshForError = (message?: string) => {
      return Boolean(message && message.toLowerCase().includes('connector.getchainid is not a function'))
    }
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason
      const message = typeof reason === 'string' ? reason : reason?.message
      if (shouldRefreshForError(message)) {
        window.location.reload()
      }
    }
    const handleError = (event: ErrorEvent) => {
      if (shouldRefreshForError(event.message)) {
        window.location.reload()
      }
    }
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Load Farcade SDK if available
    if (typeof window !== 'undefined' && (window as any).FarcadeSDK) {
      farcadeSDKRef.current = (window as any).FarcadeSDK;
    }
    
    // Load arrow images
    loadArrowImages();
    loadPlatformImages();
    
    // Initialize game state
    initGame();
    
    setIsInitialized(true);
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [assetsLoaded]);
  
  // Start the game loop once initialized
  useEffect(() => {
    if (!isInitialized) return;
    
    gameStateRef.current.lastTime = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
    
    // Add event listeners for the game canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', startDrag);
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('mousemove', dragMove);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('mouseup', endDrag);
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    
    // Setup Farcade SDK events
    if (farcadeSDKRef.current) {
      farcadeSDKRef.current.on('play_again', resetGame);
      farcadeSDKRef.current.on('toggle_mute', (data: { isMuted: boolean }) => {
        console.log("Audio toggled. Muted:", data.isMuted);
      });
      farcadeSDKRef.current.singlePlayer.actions.ready();
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', startDrag);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('mousemove', dragMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('mouseup', endDrag);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isInitialized]);
  
  // Load Base Rocket images
  const loadArrowImages = () => {
    const { short, medium, large } = arrowImagesRef.current;
    
    short.src = '/assets/rocket-base-short.svg';
    medium.src = '/assets/rocket-base-medium.svg';
    large.src = '/assets/rocket-base-large.svg';
    
    short.onload = () => {
      arrowImagesRef.current.shortLoaded = true;
    };
    medium.onload = () => {
      arrowImagesRef.current.mediumLoaded = true;
    };
    large.onload = () => {
      arrowImagesRef.current.largeLoaded = true;
    };
  };

  // Load platform images
  const loadPlatformImages = () => {
    const { asteroid, spaceStation, crystal, energy } = platformImagesRef.current;
    
    asteroid.src = '/assets/platform-asteroid.svg';
    spaceStation.src = '/assets/platform-space-station.svg';
    crystal.src = '/assets/platform-crystal.svg';
    energy.src = '/assets/platform-energy.svg';
    
    asteroid.onload = () => {
      platformImagesRef.current.asteroidLoaded = true;
    };
    spaceStation.onload = () => {
      platformImagesRef.current.spaceStationLoaded = true;
    };
    crystal.onload = () => {
      platformImagesRef.current.crystalLoaded = true;
    };
    energy.onload = () => {
      platformImagesRef.current.energyLoaded = true;
    };
  };
  
  // Handle window resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
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
  
  // Initialize the game
  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set up canvas
    handleResize();
    
    // Initialize player and platforms
    initPlayerAndPlatform();
    generateInitialPlatforms();
    generatePlatforms();
  };
  
  // Initialize player and starting platform
  const initPlayerAndPlatform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const player = playerRef.current;
    
    player.x = canvas.width / dpr / 2;
    player.y = canvas.height / dpr - 200;
    player.attachedPlatform = null;
    
    gameStateRef.current.startY = player.y;
    gameStateRef.current.highestY = player.y;
    
    const initialPlatformWidth = 100;
    const initialPlatformX = (canvas.width / dpr - initialPlatformWidth) / 2;
    const initialPlatformY = player.y;
    
    platformsRef.current = [];
    platformsRef.current.push(createPlatform(initialPlatformX, initialPlatformY, initialPlatformWidth));
  };
  
  // Create a platform
  const createPlatform = (x: number, y: number, width: number, moving = false, vx = 0): Platform => {
    return { x, y, width, height: 10, moving, vx };
  };
  
  // Generate initial platforms
  const generateInitialPlatforms = () => {
    const { score } = gameStateRef.current;
    const platforms = platformsRef.current;
    
    let gap = 80 + score / 200;
    let y = platforms[0].y - gap;
    
    while (y > 20) {
      const width = Math.max(40, 100 - score / 100);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const x = Math.random() * (canvas.width / dpr - width);
      
      platforms.push(createPlatform(x, y, width));
      y -= gap;
    }
  };
  
  // Generate platforms as the player moves up
  const generatePlatforms = () => {
    const { cameraOffsetY, score } = gameStateRef.current;
    const platforms = platformsRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const offScreenPlatforms = platforms.filter((p) => p.y < cameraOffsetY);
    
    let highestPlatformY =
      offScreenPlatforms.length > 0 ? Math.min(...offScreenPlatforms.map((p) => p.y)) : cameraOffsetY;
    
    while (highestPlatformY > cameraOffsetY - 300) {
      highestPlatformY -= 80 + score / 200;
      const width = Math.max(40, 100 - score / 100);
      const x = Math.random() * (canvas.width / dpr - width);
      
      if (score >= 2500 && Math.random() < 0.1) {
        const vx = (Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 50);
        platforms.push(createPlatform(x, highestPlatformY, width, true, vx));
      } else {
        platforms.push(createPlatform(x, highestPlatformY, width));
      }
    }
  };
  
  // Create a particle
  const createParticle = (x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 300 + 1;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35,
      maxLife: 0.35,
    };
  };
  
  // Spawn multiple particles
  const spawnParticles = (x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(createParticle(x, y));
    }
  };
  
  // Get pointer position in world coordinates
  const getPointerWorldPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const { cameraOffsetY } = gameStateRef.current;
    
    let clientX, clientY;
    
    if ('touches' in e && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr + cameraOffsetY;
    
    return { x, y };
  };
  
  // Start dragging
  const startDrag = (e: MouseEvent) => {
    const { gameOver } = gameStateRef.current;
    const { onPlatform } = playerRef.current;
    
    if (gameOver || !onPlatform) return;
    
    const pointer = getPointerWorldPos(e);
    dragStateRef.current.isDragging = true;
    dragStateRef.current.start = { x: pointer.x, y: pointer.y };
    dragStateRef.current.current = { x: pointer.x, y: pointer.y };
  };
  
  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    startDrag(e as unknown as MouseEvent);
  };
  
  // Handle drag move
  const dragMove = (e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;
    dragStateRef.current.current = getPointerWorldPos(e);
  };
  
  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    dragMove(e as unknown as MouseEvent);
  };
  
  // End dragging
  const endDrag = (e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    const { start, current } = dragStateRef.current;
    dragStateRef.current.isDragging = false;
    
    if (!start || !current) return;
    
    const dx = start.x - current.x;
    const dy = start.y - current.y;
    const magnitude = Math.hypot(dx, dy);
    
    if (magnitude < 10) return;
    
    let power = /Mobi|Android/i.test(navigator.userAgent) ? 10 : 20;
    let vx = dx * power;
    let vy = dy * power;
    
    const velMag = Math.hypot(vx, vy);
    if (velMag > MAX_VELOCITY) {
      const scale = MAX_VELOCITY / velMag;
      vx *= scale;
      vy *= scale;
    }
    
    const player = playerRef.current;
    player.vx = vx;
    player.vy = vy;
    player.angle = Math.atan2(player.vy, player.vx);
    player.onPlatform = false;
    player.attachedPlatform = null;
    
    // Set launching state for Arbitrum effects
    setIsLaunching(true);
    setTimeout(() => setIsLaunching(false), 1000);
    
    spawnParticles(player.x, player.y, 20);
    
    if (instructionRef.current) {
      instructionRef.current.style.display = 'none';
    }
    
    // Haptic feedback if Farcade SDK is available
    if (farcadeSDKRef.current) {
      farcadeSDKRef.current.singlePlayer.actions.hapticFeedback();
    }
  };
  
  // Handle touch end
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    endDrag(e as unknown as MouseEvent);
  };
  
  // Reset the game
  const resetGame = () => {
    const gameState = gameStateRef.current;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.cameraOffsetY = 0;
    
    const player = playerRef.current;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    player.onPlatform = true;
    player.attachedPlatform = null;
    
    particlesRef.current = [];
    
    initPlayerAndPlatform();
    generateInitialPlatforms();
    generatePlatforms();
    
    if (instructionRef.current) {
      instructionRef.current.style.display = 'block';
    }
    
    gameState.lastTime = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Update the game state
  const update = (dt: number) => {
    const gameState = gameStateRef.current;
    const player = playerRef.current;
    const platforms = platformsRef.current;
    const particles = particlesRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    
    // Update player physics
    if (!player.onPlatform) {
      const oldY = player.y;
      player.vy += GRAVITY * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      
      const arrowWidth = 25;
      if (player.x < arrowWidth) {
        player.x = arrowWidth;
        player.vx = -player.vx * 0.8;
        player.angle = Math.atan2(player.vy, player.vx);
        spawnParticles(player.x, player.y, 10);
      } else if (player.x > canvas.width / dpr - arrowWidth) {
        player.x = canvas.width / dpr - arrowWidth;
        player.vx = -player.vx * 0.8;
        player.angle = Math.atan2(player.vy, player.vx);
        spawnParticles(player.x, player.y, 10);
      }
      
      // Check for platform collisions
      if (player.vy > 0) {
        for (let plat of platforms) {
          const platTop = plat.y;
          if (oldY <= platTop && player.y >= platTop) {
            if (player.x > plat.x && player.x < plat.x + plat.width) {
              player.y = platTop;
              player.vx = 0;
              player.vy = 0;
              player.onPlatform = true;
              spawnParticles(player.x, platTop, 15);
              player.attachedPlatform = plat.moving ? plat : null;
              break;
            }
          }
        }
      }
    }
    
    // Update player position if attached to moving platform
    if (player.onPlatform && player.attachedPlatform) {
      player.x += player.attachedPlatform.vx * dt;
    }
    
    // Update moving platforms
    for (let plat of platforms) {
      if (plat.moving) {
        plat.x += plat.vx * dt;
        if (plat.x < 0 || plat.x + plat.width > canvas.width / dpr) {
          plat.vx = -plat.vx;
          plat.x = Math.max(0, Math.min(plat.x, canvas.width / dpr - plat.width));
        }
      }
    }
    
    // Update camera position
    const screenCenterY = canvas.height / (2 * dpr);
    if (player.y - gameState.cameraOffsetY < screenCenterY) {
      gameState.cameraOffsetY = player.y - screenCenterY;
    }
    
    // Check for game over
    if (player.y - gameState.cameraOffsetY > canvas.height / dpr || player.y - gameState.cameraOffsetY < 0) {
      gameState.gameOver = true;
      setFinalScore(gameState.score);
      
      // Show gift box after a short delay for better UX
      setTimeout(() => {
        setShowGiftBox(true);
      }, 1500);
      
      if (farcadeSDKRef.current) {
        farcadeSDKRef.current.singlePlayer.actions.gameOver({ score: gameState.score });
      }
    }
    
    // Update score
    if (player.y < gameState.highestY) gameState.highestY = player.y;
    gameState.score = Math.floor(gameState.startY - gameState.highestY);
    
    if (scoreRef.current) {
      scoreRef.current.textContent = "Score: " + gameState.score;
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Update player angle
    if (!player.onPlatform) {
      player.angle = Math.atan2(player.vy, player.vx);
    }
    
    // Smooth camera follow when player is at the bottom
    if (player.onPlatform && player.y - gameState.cameraOffsetY > gameState.startY) {
      const targetCameraOffset = player.y - gameState.startY;
      gameState.cameraOffsetY = lerp(gameState.cameraOffsetY, targetCameraOffset, 0.1);
    }
    
    // Generate new platforms and remove off-screen ones
    generatePlatforms();
    platformsRef.current = platforms.filter((p) => p.y < gameState.cameraOffsetY + canvas.height / dpr);
    
    // Update theme based on score
    updateThemeBasedOnScore(gameState.score);
  };
  
  // Update theme based on score
  const updateThemeBasedOnScore = (score: number) => {
    const normalizedScore = score % THEME_CYCLE_LENGTH;
    const targetThemeIndex = Math.floor(normalizedScore / THEME_SCORE_GAP);
    
    if (targetThemeIndex !== currentThemeIndexRef.current && !isAnimatingThemeRef.current) {
      currentThemeIndexRef.current = targetThemeIndex;
      const targetTheme = colorThemes[currentThemeIndexRef.current];
      isAnimatingThemeRef.current = true;
      
      // Change duration from 2000ms to 1000ms for faster transition
      animateThemeTransition(targetTheme, 1000, () => {
        isAnimatingThemeRef.current = false;
      });
      
      // Update SVG images
      updateSVGImages();
    }
  };
  
  // Update SVG images with current theme colors
  const updateSVGImages = () => {
    const arrowPrimary = getComputedStyle(document.documentElement).getPropertyValue("--arrow-primary").trim();
    const arrowSecondary = getComputedStyle(document.documentElement).getPropertyValue("--arrow-secondary").trim();
    const arrowAccent = getComputedStyle(document.documentElement).getPropertyValue("--arrow-accent").trim();
    
    function replaceColors(svg: string) {
      return svg
        .replace(/#34AC80/g, arrowPrimary)
        .replace(/#4BEA69/g, arrowSecondary)
        .replace(/#0B5027/g, arrowAccent);
    }
    
    // Fetch the SVGs and replace colors
    fetch('/assets/rocket-base-short.svg')
      .then(response => response.text())
      .then(svg => {
        const newSvg = replaceColors(svg);
        const newSrc = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(newSvg);
        arrowImagesRef.current.short.src = newSrc;
      });
    
    fetch('/assets/rocket-base-medium.svg')
      .then(response => response.text())
      .then(svg => {
        const newSvg = replaceColors(svg);
        const newSrc = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(newSvg);
        arrowImagesRef.current.medium.src = newSrc;
      });
    
    fetch('/assets/rocket-base-large.svg')
      .then(response => response.text())
      .then(svg => {
        const newSvg = replaceColors(svg);
        const newSrc = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(newSvg);
        arrowImagesRef.current.large.src = newSrc;
      });
  };
  
  // Draw the game
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { cameraOffsetY } = gameStateRef.current;
    const { isDragging, start, current } = dragStateRef.current;
    const player = playerRef.current;
    const platforms = platformsRef.current;
    const particles = particlesRef.current;
    const arrowImages = arrowImagesRef.current;
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context for camera transform
    ctx.save();
    ctx.translate(0, -cameraOffsetY);
    
    // Draw platforms with cool space-themed images
    platforms.forEach((plat, index) => {
      const platformImages = platformImagesRef.current;
      let platformImage: HTMLImageElement | null = null;
      
      // Select platform type based on index and position
      const platformType = index % 4;
      switch (platformType) {
        case 0:
          if (platformImages.asteroidLoaded) platformImage = platformImages.asteroid;
          break;
        case 1:
          if (platformImages.spaceStationLoaded) platformImage = platformImages.spaceStation;
          break;
        case 2:
          if (platformImages.crystalLoaded) platformImage = platformImages.crystal;
          break;
        case 3:
          if (platformImages.energyLoaded) platformImage = platformImages.energy;
          break;
      }
      
      if (platformImage) {
        // Draw platform image
        ctx.drawImage(platformImage, plat.x, plat.y, plat.width, plat.height);
      } else {
        // Fallback to colored rectangle
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--platform-color");
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      }
    });
    
    // Select arrow image based on drag distance
    let selectedImage;
    let imageLoaded = false;
    
    if (isDragging && start && current) {
      const dx = start.x - current.x;
      const dy = start.y - current.y;
      const dragMag = Math.hypot(dx, dy);
      
      if (dragMag < DRAG_THRESHOLD_MEDIUM) {
        selectedImage = arrowImages.short;
        imageLoaded = arrowImages.shortLoaded;
      } else if (dragMag < DRAG_THRESHOLD_LARGE) {
        selectedImage = arrowImages.medium;
        imageLoaded = arrowImages.mediumLoaded;
      } else {
        selectedImage = arrowImages.large;
        imageLoaded = arrowImages.largeLoaded;
      }
    } else {
      selectedImage = arrowImages.short;
      imageLoaded = arrowImages.shortLoaded;
    }
    
    // Draw arrow
    if (imageLoaded && selectedImage) {
      ctx.save();
      ctx.translate(player.x, player.y);
      
      let drawAngle;
      if (isDragging && start && current) {
        const dx = start.x - current.x;
        const dy = start.y - current.y;
        const dragMag = Math.hypot(dx, dy);
        drawAngle = dragMag < 5 ? 0 : Math.atan2(start.y - current.y, start.x - current.x) + Math.PI / 2;
      } else if (player.onPlatform) {
        drawAngle = 0;
      } else {
        drawAngle = player.angle + Math.PI / 2;
      }
      
      ctx.rotate(drawAngle);
      
      const targetWidth = 50;
      const baseScale = targetWidth / selectedImage.width;
      ctx.scale(baseScale, baseScale);
      
      let offset =
        isDragging && selectedImage !== arrowImages.short
          ? -((arrowImages.short.height * selectedImage.width) / arrowImages.short.width)
          : -selectedImage.height;
      
      ctx.drawImage(selectedImage, -selectedImage.width / 2, offset);
      ctx.restore();
    }
    
    // Draw particles
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      const particleRGB = getComputedStyle(document.documentElement).getPropertyValue("--particle-color");
      ctx.fillStyle = `rgba(${particleRGB}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Restore context
    ctx.restore();
  };
  
  // Game loop
  const gameLoop = (timestamp: number) => {
    const gameState = gameStateRef.current;
    const dt = (timestamp - gameState.lastTime) / 1000;
    gameState.lastTime = timestamp;
    
    update(dt);
    draw();
    
    if (!gameState.gameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };
  
  const handlePlayAgain = () => {
    setShowGameOverlay(false);
    setShowGiftBox(false);
    // Reset game state
    gameStateRef.current.gameOver = false;
    gameStateRef.current.score = 0;
    gameStateRef.current.cameraOffsetY = 0;
    gameStateRef.current.startY = 0;
    gameStateRef.current.highestY = 0;
    
    // Reset player position and state
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.angle = 0;
    playerRef.current.onPlatform = true;
    playerRef.current.attachedPlatform = null;
    
    // Reset platforms and particles
    platformsRef.current = [];
    particlesRef.current = [];
    
    // Reinitialize player and platforms to center position
    initPlayerAndPlatform();
    generateInitialPlatforms();
    generatePlatforms();
    
    // Show instruction
    if (instructionRef.current) {
      instructionRef.current.style.display = 'block';
    }
    
    // Start game loop
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleGiftBoxComplete = () => {
    setShowGiftBox(false);
    // Show the game overlay after gift box is complete
    setShowGameOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowGameOverlay(false);
  };

  if (!assetsLoaded) {
    return <GameLoader onAssetsLoaded={() => setAssetsLoaded(true)} />;
  }

  return (
    <div id="game-container">
      <SpaceBackground cameraOffsetY={gameStateRef.current.cameraOffsetY} />
      <NebulaEffect cameraOffsetY={gameStateRef.current.cameraOffsetY} score={gameStateRef.current.score} />
      <SpaceEffects cameraOffsetY={gameStateRef.current.cameraOffsetY} />
      <BaseEffects 
        cameraOffsetY={gameStateRef.current.cameraOffsetY}
        playerX={playerRef.current.x}
        playerY={playerRef.current.y}
        isLaunching={isLaunching}
      />
      <canvas ref={canvasRef} id="game-canvas" />
      <div ref={scoreRef} id="score">Score: 0</div>
      <div ref={instructionRef} id="instruction">Click or drag down on the Base Rocket to launch</div>
      
      {showGiftBox && (
        <GiftBox
          onClose={() => setShowGiftBox(false)}
          onClaimComplete={handleGiftBoxComplete}
        />
      )}
      
      {showGameOverlay && (
        <GameOverlay
          score={finalScore}
          onPlayAgain={handlePlayAgain}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
};

export default Game;
