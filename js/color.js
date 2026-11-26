// Color helpers: contrast on white paper, seeded randomness, color sequences.

export const INK_BLACK = '#111111';
export const MIN_CONTRAST = 3;

export function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (!/^[0-9a-fA-F]{6}$/.test(h) || Number.isNaN(n)) return [17, 17, 17];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function relativeLuminance(hex) {
  const c = hexToRgb(hex).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastWithWhite(hex) {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}

/** Darken a color step by step until it reaches the minimum contrast on white. */
export function ensureContrast(hex, min = MIN_CONTRAST) {
  let rgb = hexToRgb(hex);
  let out = rgbToHex(rgb);
  for (let i = 0; i < 40 && contrastWithWhite(out) < min; i++) {
    rgb = rgb.map((v) => v * 0.93);
    out = rgbToHex(rgb);
  }
  return out;
}

/** Small deterministic PRNG (mulberry32). Returns a function giving floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a picker that hands out palette colors at random, never the same
 * color twice in a row (when the palette has at least two colors).
 */
export function colorSequence(palette, seed) {
  const rng = mulberry32(seed);
  let last = -1;
  return function nextColor() {
    if (palette.length === 0) return INK_BLACK;
    if (palette.length === 1) return palette[0];
    let i = Math.floor(rng() * (palette.length - 1));
    if (i >= last && last >= 0) i += 1;
    last = i;
    return palette[i];
  };
}
