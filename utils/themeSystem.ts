import { ColorTheme } from '@/types/game';
import { hexToRgb, rgbToHex, lerp } from './colorUtils';

export const colorThemes: ColorTheme[] = [
  // Green (start)
  {
    bgColor: "#091c1e",
    platformColor: "#4BEA69",
    particleColor: "75, 234, 105",
    arrowPrimary: "#34AC80",
    arrowSecondary: "#4BEA69",
    arrowAccent: "#0B5027",
  },
  // Blue (3000)
  {
    bgColor: "#051a2e",
    platformColor: "#4B8AEA",
    particleColor: "75, 138, 234",
    arrowPrimary: "#3469AC",
    arrowSecondary: "#4B8AEA",
    arrowAccent: "#0B2750",
  },
  // Indigo (6000)
  {
    bgColor: "#130a36",
    platformColor: "#7C4BEA",
    particleColor: "124, 75, 234",
    arrowPrimary: "#5834AC",
    arrowSecondary: "#7C4BEA",
    arrowAccent: "#1F0B50",
  },
  // Violet (9000)
  {
    bgColor: "#2e0533",
    platformColor: "#D44BEA",
    particleColor: "212, 75, 234",
    arrowPrimary: "#A434AC",
    arrowSecondary: "#D44BEA",
    arrowAccent: "#500B50",
  },
  // Red (12000)
  {
    bgColor: "#350505",
    platformColor: "#EA4B4B",
    particleColor: "234, 75, 75",
    arrowPrimary: "#AC3434",
    arrowSecondary: "#EA4B4B",
    arrowAccent: "#500B0B",
  },
  // Orange (15000)
  {
    bgColor: "#361a05",
    platformColor: "#EA9A4B",
    particleColor: "234, 154, 75",
    arrowPrimary: "#AC7234",
    arrowSecondary: "#EA9A4B",
    arrowAccent: "#502d0B",
  },
  // Yellow (18000)
  {
    bgColor: "#2e2e05",
    platformColor: "#EAE44B",
    particleColor: "234, 228, 75",
    arrowPrimary: "#ACAA34",
    arrowSecondary: "#EAE44B",
    arrowAccent: "#50500B",
  },
];

export const THEME_SCORE_GAP = 3000;
export const THEME_CYCLE_LENGTH = colorThemes.length * THEME_SCORE_GAP;

export function getCSSVariable(varName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export function updateThemeBasedOnScore(score: number): number {
  const normalizedScore = score % THEME_CYCLE_LENGTH;
  return Math.floor(normalizedScore / THEME_SCORE_GAP);
}

export function animateThemeTransition(
  targetTheme: ColorTheme,
  duration: number,
  callback?: () => void
): void {
  if (typeof window === 'undefined') return;
  
  const startTime = performance.now();
  const initialTheme: ColorTheme = {
    bgColor: getCSSVariable("--bg-color"),
    platformColor: getCSSVariable("--platform-color"),
    particleColor: getCSSVariable("--particle-color"),
    arrowPrimary: getCSSVariable("--arrow-primary"),
    arrowSecondary: getCSSVariable("--arrow-secondary"),
    arrowAccent: getCSSVariable("--arrow-accent"),
  };

  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    const interpolatedTheme: ColorTheme = {} as ColorTheme;
    
    for (const key in targetTheme) {
      const themeKey = key as keyof ColorTheme;
      if (targetTheme[themeKey].charAt(0) === "#") {
        const startRgb = hexToRgb(initialTheme[themeKey]);
        const targetRgb = hexToRgb(targetTheme[themeKey]);
        const r = Math.round(lerp(startRgb.r, targetRgb.r, t));
        const g = Math.round(lerp(startRgb.g, targetRgb.g, t));
        const b = Math.round(lerp(startRgb.b, targetRgb.b, t));
        interpolatedTheme[themeKey] = rgbToHex({ r, g, b });
      } else {
        const startParts = initialTheme[themeKey].split(",").map((x) => parseInt(x.trim()));
        const targetParts = targetTheme[themeKey].split(",").map((x) => parseInt(x.trim()));
        const r = Math.round(lerp(startParts[0], targetParts[0], t));
        const g = Math.round(lerp(startParts[1], targetParts[1], t));
        const b = Math.round(lerp(startParts[2], targetParts[2], t));
        interpolatedTheme[themeKey] = `${r}, ${g}, ${b}`;
      }
    }
    
    document.documentElement.style.setProperty("--bg-color", interpolatedTheme.bgColor);
    document.documentElement.style.setProperty("--platform-color", interpolatedTheme.platformColor);
    document.documentElement.style.setProperty("--particle-color", interpolatedTheme.particleColor);
    document.documentElement.style.setProperty("--arrow-primary", interpolatedTheme.arrowPrimary);
    document.documentElement.style.setProperty("--arrow-secondary", interpolatedTheme.arrowSecondary);
    document.documentElement.style.setProperty("--arrow-accent", interpolatedTheme.arrowAccent);
    
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      if (callback) callback();
    }
  }
  
  requestAnimationFrame(step);
}
