// App state, kept in the browser between visits (never sent anywhere).
import { loadJSON, saveJSON } from './storage.js';
import { t } from './i18n.js';
import { PALETTES } from './palettes.js';
import { DECOR_SETS, FRAME_STYLES, PLACEMENTS } from './decor.js';
import { FORMATS } from './formats.js';
import { UNIVERSES, universePatch } from './universes.js';

export const DEFAULTS = {
  ...universePatch('lutins'),
  names: ['Lutin Farceur'],
  showSignature: true,
  text: null, // null = example message
  singleColor: '#C62828',
  customColors: ['#C62828', '#1B5E20', '#1565C0'],
  colorMode: 'letter',
  seed: 7,
  outline: false,
  uppercase: false,
  handmade: true,
  format: 'a4',
  orientation: 'portrait',
  copies: 1,
  autoSize: true,
  sizePt: 48,
  lineHeight: 1.2,
  align: 'center',
  frame: false,
  decor: true,
};

const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const num = (v, min, max, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);

function sanitize(s) {
  const d = DEFAULTS;
  return {
    universe: oneOf(s.universe, UNIVERSES.map((u) => u.id), d.universe),
    paletteId: oneOf(s.paletteId, PALETTES.map((p) => p.id), d.paletteId),
    fontId: typeof s.fontId === 'string' ? s.fontId : d.fontId,
    weight: typeof s.weight === 'number' ? s.weight : null,
    decorSet: oneOf(s.decorSet, DECOR_SETS.map((x) => x.id), d.decorSet),
    decorPlacement: oneOf(s.decorPlacement, PLACEMENTS, d.decorPlacement),
    frameStyle: oneOf(s.frameStyle, FRAME_STYLES, d.frameStyle),
    names: Array.isArray(s.names) ? s.names.filter((n) => typeof n === 'string').slice(0, 12) : d.names,
    showSignature: s.showSignature !== false,
    text: typeof s.text === 'string' ? s.text : null,
    singleColor: typeof s.singleColor === 'string' ? s.singleColor : d.singleColor,
    customColors: Array.isArray(s.customColors) && s.customColors.length ? s.customColors.slice(0, 5) : d.customColors,
    colorMode: oneOf(s.colorMode, ['letter', 'word'], d.colorMode),
    seed: num(s.seed, 0, 1e9, d.seed),
    outline: !!s.outline,
    uppercase: !!s.uppercase,
    handmade: s.handmade !== false,
    format: oneOf(s.format, FORMATS, d.format),
    orientation: oneOf(s.orientation, ['portrait', 'landscape'], d.orientation),
    copies: s.copies === 2 ? 2 : 1,
    autoSize: s.autoSize !== false,
    sizePt: num(s.sizePt, 10, 200, d.sizePt),
    lineHeight: num(s.lineHeight, 0.9, 2.2, d.lineHeight),
    align: oneOf(s.align, ['center', 'left'], d.align),
    frame: !!s.frame,
    decor: s.decor !== false,
  };
}

const saved = loadJSON('state', null);
export const state = sanitize(saved ? { ...DEFAULTS, ...saved } : DEFAULTS);

/** The message actually shown: the example until the user types their own. */
export function messageText() {
  return state.text === null ? t('message.example') : state.text;
}

const listeners = new Set();
let saveTimer = 0;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(patch) {
  Object.assign(state, patch);
  for (const fn of listeners) fn(state, patch);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveJSON('state', state), 300);
}

// ---- Favorite names ----

export const favorites = new Set(loadJSON('favorites', []).filter((n) => typeof n === 'string'));

export function toggleFavorite(name) {
  if (favorites.has(name)) favorites.delete(name);
  else favorites.add(name);
  saveJSON('favorites', [...favorites]);
  for (const fn of listeners) fn(state, {});
}
