/**
 * Shared visual contract for the bottom "name strip" layout used both in the
 * web editor preview and in the consumer render (RN app, downloaded video/image).
 *
 * Strip background = pure black mixed with `dominantColor` at 50% opacity.
 * Result RGB = dominantColor * 0.5 (since black contributes 0).
 *
 * Missing or invalid dominant colour uses pure black (`#000000`), same as export `dc`.
 */

import { dominantColorHexOrBlack } from '@/utils/dominantColorHex';

/** Fixed design-pixel height of the strip attached below the background region. */
export const NAME_STRIP_HEIGHT_PX = 72;

/** Fixed design-pixel font size for strip text. */
export const NAME_STRIP_FONT_SIZE_PX = 48;

export function stripDesignHeightPx(backgroundDesignHeightPx: number): number {
  void backgroundDesignHeightPx;
  return NAME_STRIP_HEIGHT_PX;
}

/** Total poster height = background band + strip (strip only when caller uses strip layout). */
export function posterDesignHeightPx(backgroundDesignHeightPx: number, stripLayout: boolean): number {
  if (!stripLayout) return backgroundDesignHeightPx;
  return backgroundDesignHeightPx + stripDesignHeightPx(backgroundDesignHeightPx);
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

function toHex(r: number, g: number, b: number) {
  const h = (n: number) => clamp255(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

/** black + 50% dominant => result RGB = dominant * 0.5. */
export function nameStripBackgroundHex(dominantColorHex: string | null | undefined): string {
  const base = dominantColorHexOrBlack(dominantColorHex);
  const rgb = parseHex(base);
  if (!rgb) return dominantColorHexOrBlack(null);
  return toHex(rgb.r * 0.5, rgb.g * 0.5, rgb.b * 0.5);
}
