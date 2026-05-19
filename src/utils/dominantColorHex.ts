import type { Palette } from '@vibrant/color';

/**
 * Dominant colour from background media extraction. On any failure or
 * invalid sample, consumers should use pure black.
 */

export const DOMINANT_COLOR_FALLBACK_HEX = '#000000';

const HEX6 = /^#?([0-9a-fA-F]{6})$/;

/** Validates and normalizes to `#RRGGBB`, or `null` if invalid / missing. */
export function parseDominantHex6(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const m = HEX6.exec(value.trim());
  if (!m) return null;
  return `#${m[1].toUpperCase()}`;
}

/** Use for export (`dc`) and anywhere a definite hex is required. */
export function dominantColorHexOrBlack(value: string | null | undefined): string {
  return parseDominantHex6(value) ?? DOMINANT_COLOR_FALLBACK_HEX;
}

function lumaFromHex(hex: string): number {
  const m = HEX6.exec(hex.trim());
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * When multiple frames are sampled (e.g. video), prefer the brighter result so
 * black fades / intros are less likely to win.
 */
export function pickBrighterDominantHex(candidates: string[]): string | null {
  const parsed = candidates
    .map((c) => parseDominantHex6(c))
    .filter((c): c is string => c != null);
  if (parsed.length === 0) return null;
  let best = parsed[0];
  let bestL = lumaFromHex(best);
  for (let i = 1; i < parsed.length; i++) {
    const L = lumaFromHex(parsed[i]);
    if (L > bestL) {
      best = parsed[i];
      bestL = L;
    }
  }
  return best;
}

/** Normalize Color Thief's `Color` object to `#RRGGBB` or `null`. */
export function hexFromColorthiefColor(
  color: { hex?: () => string } | null | undefined,
): string | null {
  if (!color) return null;
  try {
    const h = color.hex?.();
    if (typeof h !== 'string') return null;
    return parseDominantHex6(h);
  } catch {
    return null;
  }
}

/** Pick the highest-population swatch from a Vibrant palette. */
export function hexFromVibrantPalette(palette: Palette | null | undefined): string | null {
  if (!palette) return null;

  const swatches = Object.values(palette).filter((swatch): swatch is NonNullable<typeof swatch> => swatch != null);
  if (swatches.length === 0) return null;

  let best = swatches[0];
  for (let i = 1; i < swatches.length; i += 1) {
    if (swatches[i].population > best.population) {
      best = swatches[i];
    }
  }

  return parseDominantHex6(best.hex);
}
