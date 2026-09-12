/**
 * Brand color theming utility
 * Generates and applies dynamic CSS variables to document.documentElement
 */

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export const BRAND_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'electric-blue',
    name: 'Electric Royal Blue (Default)',
    hex: '#0022DA',
    description: 'Original signature Nestuge vibrant royal blue'
  },
  {
    id: 'ocean-navy',
    name: 'Ocean Navy',
    hex: '#1E40AF',
    description: 'Deep authoritative slate navy with high contrast'
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    hex: '#059669',
    description: 'Calm, nurturing, respectful growth green'
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta / Rust',
    hex: '#C2410C',
    description: 'Earthy, authentic, warm parenting aesthetic'
  },
  {
    id: 'crimson-ruby',
    name: 'Crimson Ruby',
    hex: '#BE123C',
    description: 'High-urgency, bold, passionate conversion tone'
  },
  {
    id: 'amethyst-violet',
    name: 'Amethyst Violet',
    hex: '#7C3AED',
    description: 'Modern, mindful, premium brand purple'
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    hex: '#D97706',
    description: 'Warm, vibrant, eye-catching golden amber'
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    hex: '#334155',
    description: 'Minimalist, sophisticated editorial dark slate'
  }
];

/**
 * Converts Hex string (#RRGGBB or #RGB) to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

/**
 * Converts RGB numbers to #RRGGBB string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Darkens a hex color by a given factor (0.0 to 1.0).
 */
export function darkenColor(hex: string, factor = 0.15): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mult = 1 - factor;
  return rgbToHex(rgb.r * mult, rgb.g * mult, rgb.b * mult);
}

/**
 * Mixes a hex color with pure white to create a soft pastel tint (e.g., 0.92 white, 0.08 color).
 */
export function lightenToTint(hex: string, tintRatio = 0.07): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#EFF4FE';
  const r = 255 * (1 - tintRatio) + rgb.r * tintRatio;
  const g = 255 * (1 - tintRatio) + rgb.g * tintRatio;
  const b = 255 * (1 - tintRatio) + rgb.b * tintRatio;
  return rgbToHex(r, g, b);
}

/**
 * Computes all dependent CSS theme variables based on a single primary brand color hex.
 */
export function computeThemeVariables(primaryHex: string) {
  const cleanHex = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`;
  const rgb = hexToRgb(cleanHex) || { r: 0, g: 34, b: 218 };

  const hoverHex = darkenColor(cleanHex, 0.12);
  const activeHex = darkenColor(cleanHex, 0.22);
  const lightHex = lightenToTint(cleanHex, 0.07);
  const borderRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
  const subtleBorderRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
  const glowRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;

  return {
    primary: cleanHex,
    hover: hoverHex,
    active: activeHex,
    light: lightHex,
    border: borderRgba,
    subtleBorder: subtleBorderRgba,
    glow: glowRgba,
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`
  };
}

/**
 * Dynamically updates CSS variables on document.documentElement
 */
export function applyBrandColor(primaryHex: string): void {
  if (typeof document === 'undefined') return;

  const vars = computeThemeVariables(primaryHex);
  const root = document.documentElement;

  root.style.setProperty('--blue-primary', vars.primary);
  root.style.setProperty('--blue-hover', vars.hover);
  root.style.setProperty('--blue-active', vars.active);
  root.style.setProperty('--blue-light', vars.light);
  root.style.setProperty('--blue-border', vars.border);
  root.style.setProperty('--rust', vars.primary);
  root.style.setProperty('--rust-dark', vars.hover);

  // Modern brand aliases
  root.style.setProperty('--brand-primary', vars.primary);
  root.style.setProperty('--brand-hover', vars.hover);
  root.style.setProperty('--brand-active', vars.active);
  root.style.setProperty('--brand-light', vars.light);
  root.style.setProperty('--brand-border', vars.border);
  root.style.setProperty('--brand-rgb', vars.rgb);

  // Update theme-color meta tag for mobile browsers
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', vars.primary);
}
