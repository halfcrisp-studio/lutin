import { INK_BLACK, ensureContrast } from './color.js';

// Every color reaches a contrast of at least 3:1 on white paper, except the
// pastel sets: their light fill is drawn with a thin border in a darker shade
// of the same hue (that border reaches the contrast instead).
export const PALETTE_GROUPS = ['simple', 'festive', 'pastel', 'vivid', 'universe'];
export const PASTEL_LINE_CONTRAST = 3.2;

export const PALETTES = [
  { id: 'noir', group: 'simple', colors: [INK_BLACK] },
  { id: 'single', group: 'simple', colors: null },
  { id: 'custom', group: 'simple', colors: null },

  { id: 'sapin', group: 'festive', colors: ['#C62828', '#1B5E20', '#2E7D32'] },
  { id: 'pain', group: 'festive', colors: ['#8B4513', '#B71C1C', '#2E7D32', '#A0522D'] },
  { id: 'givre', group: 'festive', colors: ['#0277BD', '#283593', '#5E35B1', '#00838F'] },
  { id: 'dore', group: 'festive', colors: ['#9C7A00', '#B71C1C', '#1B5E20'] },

  { id: 'pastel', group: 'pastel', pastel: true, colors: ['#F8BBD0', '#C5CAE9', '#B2DFDB', '#FFCCBC', '#B3E5FC', '#E1BEE7'] },
  { id: 'macarons', group: 'pastel', pastel: true, colors: ['#F4A6B7', '#A8D8B9', '#FFD59E', '#A7C7E7', '#D7B8F3'] },
  { id: 'guimauve', group: 'pastel', pastel: true, colors: ['#FFC1E3', '#BDEFF5', '#FFF3B0', '#D9C8FF'] },

  { id: 'arc', group: 'vivid', colors: ['#D32F2F', '#E65100', '#B26A00', '#2E7D32', '#1565C0', '#6A1B9A'] },
  { id: 'licorne', group: 'vivid', colors: ['#D81B60', '#8E24AA', '#00838F', '#5E35B1', '#C2185B'] },
  { id: 'bonbons', group: 'vivid', colors: ['#E91E63', '#E64A19', '#00897B', '#7B1FA2'] },
  { id: 'ocean', group: 'vivid', colors: ['#01579B', '#0277BD', '#00838F', '#00695C'] },
  { id: 'foret', group: 'vivid', colors: ['#33691E', '#5D4037', '#2E7D32', '#827717'] },
  { id: 'tropical', group: 'vivid', colors: ['#D81B60', '#E65100', '#00897B', '#1565C0'] },
  { id: 'halloween', group: 'vivid', colors: ['#E65100', '#6A1B9A', '#2E7D32', INK_BLACK] },
  { id: 'chocolat', group: 'vivid', colors: ['#4E342E', '#6D4C41', '#8D6E63', '#BF360C'] },

  { id: 'heros', group: 'universe', colors: ['#D50000', '#0D47A1', '#E65100', '#212121'] },
  { id: 'araignee', group: 'universe', colors: ['#C62828', '#1565C0', INK_BLACK] },
  { id: 'grognon', group: 'universe', colors: ['#4C8C00', '#2E7D32', '#3E7B00', '#1B5E20'] },
  { id: 'magie', group: 'universe', colors: ['#7B1E2B', '#9C6B00', '#1A237E', '#00695C'] },
  { id: 'idoles', group: 'universe', colors: ['#7B1FA2', '#D6007A', '#00838F', INK_BLACK] },
  { id: 'chiots', group: 'universe', colors: ['#1E40AF', '#D32F2F', '#E65100', '#B45309'] },
];

export function getPalette(id) {
  return PALETTES.find((p) => p.id === id) || PALETTES.find((p) => p.id === 'sapin');
}

/** Fill colors of the letters for the current state (pastels stay light). */
export function resolveColors(state) {
  if (state.paletteId === 'single') return [ensureContrast(state.singleColor)];
  if (state.paletteId === 'custom') {
    const list = (state.customColors || []).filter(Boolean).map((c) => ensureContrast(c));
    return list.length ? list : [INK_BLACK];
  }
  return getPalette(state.paletteId).colors;
}

/** Darker shade used to border a pastel color (and to draw lines: decor, frame). */
export function pastelLine(color) {
  return ensureContrast(color, PASTEL_LINE_CONTRAST);
}

/**
 * Everything the renderer needs: `fills` for the letters, `lines` for strokes
 * (decorations, frame, pastel borders) and whether the set is pastel.
 */
export function resolveInk(state) {
  const fills = resolveColors(state);
  const pastel = !!(PALETTES.find((p) => p.id === state.paletteId) || {}).pastel;
  return { fills, lines: pastel ? fills.map(pastelLine) : fills, pastel };
}
