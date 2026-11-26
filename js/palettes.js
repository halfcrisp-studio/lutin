import { INK_BLACK, ensureContrast } from './color.js';

// Every built-in color reaches a contrast of at least 3:1 on white paper.
export const PALETTES = [
  { id: 'noir', colors: [INK_BLACK] },
  { id: 'single', colors: null },
  { id: 'custom', colors: null },
  { id: 'sapin', colors: ['#C62828', '#1B5E20', '#2E7D32'] },
  { id: 'pain', colors: ['#8B4513', '#B71C1C', '#2E7D32', '#A0522D'] },
  { id: 'givre', colors: ['#0277BD', '#283593', '#5E35B1', '#00838F'] },
  { id: 'dore', colors: ['#9C7A00', '#B71C1C', '#1B5E20'] },
  { id: 'arc', colors: ['#D32F2F', '#E65100', '#B26A00', '#2E7D32', '#1565C0', '#6A1B9A'] },
  { id: 'licorne', colors: ['#D81B60', '#8E24AA', '#00838F', '#5E35B1', '#C2185B'] },
  { id: 'bonbons', colors: ['#E91E63', '#E64A19', '#00897B', '#7B1FA2'] },
  { id: 'heros', colors: ['#D50000', '#0D47A1', '#E65100', '#212121'] },
  { id: 'araignee', colors: ['#C62828', '#1565C0', INK_BLACK] },
  { id: 'grognon', colors: ['#4C8C00', '#C62828', INK_BLACK] },
  { id: 'magie', colors: ['#7B1E2B', '#9C6B00', '#1A237E', '#00695C'] },
  { id: 'idoles', colors: ['#7B1FA2', '#D6007A', '#00838F', INK_BLACK] },
  { id: 'chiots', colors: ['#1E40AF', '#D32F2F', '#E65100', '#B45309'] },
];

export function getPalette(id) {
  return PALETTES.find((p) => p.id === id) || PALETTES.find((p) => p.id === 'sapin');
}

/** Colors actually used on the sheet for the current state (always readable on white). */
export function resolveColors(state) {
  if (state.paletteId === 'single') return [ensureContrast(state.singleColor)];
  if (state.paletteId === 'custom') {
    const list = (state.customColors || []).filter(Boolean).map((c) => ensureContrast(c));
    return list.length ? list : [INK_BLACK];
  }
  return getPalette(state.paletteId).colors;
}
