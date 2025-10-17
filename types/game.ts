export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  baseSize: number;
  onPlatform: boolean;
  attachedPlatform: Platform | null;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  moving: boolean;
  vx: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface ColorTheme {
  bgColor: string;
  platformColor: string;
  particleColor: string;
  arrowPrimary: string;
  arrowSecondary: string;
  arrowAccent: string;
}

export interface DragState {
  isDragging: boolean;
  start: { x: number; y: number } | null;
  current: { x: number; y: number } | null;
}

export interface GameState {
  gameOver: boolean;
  score: number;
  cameraOffsetY: number;
  startY: number;
  highestY: number;
  lastTime: number;
}

export interface ArrowImages {
  short: HTMLImageElement;
  medium: HTMLImageElement;
  large: HTMLImageElement;
  shortLoaded: boolean;
  mediumLoaded: boolean;
  largeLoaded: boolean;
}

export interface PlatformImages {
  asteroid: HTMLImageElement;
  spaceStation: HTMLImageElement;
  crystal: HTMLImageElement;
  energy: HTMLImageElement;
  asteroidLoaded: boolean;
  spaceStationLoaded: boolean;
  crystalLoaded: boolean;
  energyLoaded: boolean;
}
