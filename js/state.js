// App state, kept in the browser between visits (never sent anywhere).
import { loadJSON, saveJSON } from './storage.js';
import { t } from './i18n.js';
import { PALETTES } from './palettes.js';
import { DECOR_SETS, FRAME_STYLES, PLACEMENTS } from './decor.js';
import { FORMATS } from './formats.js';
import { UNIVERSES, universePatch } from './universes.js';

export const SIZE_MIN_PT = 8;
export const SIZE_MAX_PT = 300;
export const MAX_COLLECTION = 40;

export const DEFAULTS = {
  ...universePatch('lutins'),
  // The family's elves; the ones in `signers` sign today's note, in that order.
  collection: ['Lutin Farceur', 'Biscotte'],
  signers: ['Lutin Farceur'],
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
};

const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const num = (v, min, max, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);
const names = (v) => (Array.isArray(v) ? [...new Set(v.filter((n) => typeof n === 'string' && n.trim()))] : null);
const isColor = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

/** Older saves had `names` (signers) and starred favorites: they become the collection. */
function migrate(s) {
  if (!Array.isArray(s.collection) && Array.isArray(s.names)) {
    const favs = loadJSON('favorites', []);
    s.collection = [...s.names, ...(Array.isArray(favs) ? favs : [])];
    s.signers = s.names;
  }
  return s;
}

function sanitize(s) {
  const d = DEFAULTS;
  const collection = (names(s.collection) || d.collection).slice(0, MAX_COLLECTION);
  const signers = (names(s.signers) || d.signers).filter((n) => collection.includes(n));
  return {
    universe: oneOf(s.universe, UNIVERSES.map((u) => u.id), d.universe),
    paletteId: oneOf(s.paletteId, PALETTES.map((p) => p.id), d.paletteId),
    fontId: typeof s.fontId === 'string' ? s.fontId : d.fontId,
    weight: typeof s.weight === 'number' ? s.weight : null,
    decor: s.decor !== false,
    decorSet: oneOf(s.decorSet, DECOR_SETS.map((x) => x.id), d.decorSet),
    decorPlacement: oneOf(s.decorPlacement, PLACEMENTS, d.decorPlacement),
    frame: !!s.frame,
    frameStyle: oneOf(s.frameStyle, FRAME_STYLES, d.frameStyle),
    frameColor: s.frameColor === 'auto' || isColor(s.frameColor) ? s.frameColor : d.frameColor,
    collection,
    signers,
    showSignature: s.showSignature !== false,
    text: typeof s.text === 'string' ? s.text : null,
    singleColor: isColor(s.singleColor) ? s.singleColor : d.singleColor,
    customColors: Array.isArray(s.customColors) && s.customColors.some(isColor) ? s.customColors.filter(isColor).slice(0, 5) : d.customColors,
    colorMode: oneOf(s.colorMode, ['letter', 'word'], d.colorMode),
    seed: num(s.seed, 0, 1e9, d.seed),
    outline: !!s.outline,
    uppercase: !!s.uppercase,
    handmade: s.handmade !== false,
    format: oneOf(s.format, FORMATS, d.format),
    orientation: oneOf(s.orientation, ['portrait', 'landscape'], d.orientation),
    copies: s.copies === 2 ? 2 : 1,
    autoSize: s.autoSize !== false,
    sizePt: num(s.sizePt, SIZE_MIN_PT, SIZE_MAX_PT, d.sizePt),
    lineHeight: num(s.lineHeight, 0.9, 2.2, d.lineHeight),
    align: oneOf(s.align, ['center', 'left'], d.align),
  };
}

const saved = loadJSON('state', null);
const usable = saved && typeof saved === 'object' && !Array.isArray(saved);
export const state = sanitize(usable ? migrate({ ...DEFAULTS, ...saved }) : DEFAULTS);

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

// ---- Collection of elves ----

export function addElf(name) {
  const n = String(name).replace(/\s+/g, ' ').trim();
  if (!n) return;
  const collection = state.collection.includes(n) ? state.collection : [...state.collection, n].slice(0, MAX_COLLECTION);
  // A newly added elf signs right away (one more tap removes it).
  const signers = state.signers.includes(n) || !collection.includes(n) ? state.signers : [...state.signers, n];
  update({ collection, signers });
}

/** Tap on an elf: signs or stops signing (signature order = order of taps). */
export function toggleSigner(name) {
  const signers = state.signers.includes(name) ? state.signers.filter((n) => n !== name) : [...state.signers, name];
  update({ signers });
}

export function removeElf(name) {
  update({ collection: state.collection.filter((n) => n !== name), signers: state.signers.filter((n) => n !== name) });
}
