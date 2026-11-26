// Font registry and loading. Built-in fonts are self-hosted (fonts/*.woff2,
// latin subset). Imported fonts stay in the browser (IndexedDB).
import { idbDelete, idbGetAll, idbPut } from './storage.js';

// group: bubble | round | hand | reading | classic | theme
// weights: [min, max] for variable fonts; outline: thick enough for the outline mode
// (for variable fonts, from outlineMin weight); connected: script letters that join;
// noEllipsis: the font has no "…" glyph (three dots are drawn instead).
export const FONTS = [
  { id: 'luckiest', label: 'Luckiest Guy', file: 'luckiest-guy-400.woff2', group: 'bubble', outline: true },
  { id: 'titan', label: 'Titan One', file: 'titan-one-400.woff2', group: 'bubble', outline: true },
  { id: 'chewy', label: 'Chewy', file: 'chewy-400.woff2', group: 'bubble', outline: true },
  { id: 'fredoka', label: 'Fredoka', file: 'fredoka-vf.woff2', group: 'round', weights: [300, 700], weight: 600, outlineMin: 550 },
  { id: 'baloo', label: 'Baloo 2', file: 'baloo-2-vf.woff2', group: 'round', weights: [400, 800], weight: 700, outlineMin: 650 },
  { id: 'comfortaa', label: 'Comfortaa', file: 'comfortaa-vf.woff2', group: 'round', weights: [300, 700], weight: 500, outlineMin: 650 },
  { id: 'patrick', label: 'Patrick Hand', file: 'patrick-hand-400.woff2', group: 'hand' },
  { id: 'gochi', label: 'Gochi Hand', file: 'gochi-hand-400.woff2', group: 'hand' },
  { id: 'caveat', label: 'Caveat', file: 'caveat-vf.woff2', group: 'hand', weights: [400, 700], weight: 500 },
  { id: 'shadows', label: 'Shadows Into Light', file: 'shadows-into-light-400.woff2', group: 'hand' },
  { id: 'andika', label: 'Andika', file: 'andika-400.woff2', group: 'reading' },
  { id: 'dancing', label: 'Dancing Script', file: 'dancing-script-vf.woff2', group: 'classic', weights: [400, 700], weight: 600, connected: true },
  { id: 'pacifico', label: 'Pacifico', file: 'pacifico-400.woff2', group: 'classic', connected: true },
  { id: 'lobster', label: 'Lobster', file: 'lobster-400.woff2', group: 'classic', connected: true },
  { id: 'greatvibes', label: 'Great Vibes', file: 'great-vibes-400.woff2', group: 'classic', connected: true },
  { id: 'playfair', label: 'Playfair Display', file: 'playfair-display-vf.woff2', group: 'classic', weights: [400, 900], weight: 700, outlineMin: 850 },
  { id: 'christmas', label: 'Mountains of Christmas', file: 'mountains-of-christmas-700.woff2', group: 'theme', fixedWeight: 700 },
  { id: 'cinzel', label: 'Cinzel Decorative', file: 'cinzel-decorative-700.woff2', group: 'theme', fixedWeight: 700 },
  { id: 'bangers', label: 'Bangers', file: 'bangers-400.woff2', group: 'theme', outline: true },
  { id: 'freckle', label: 'Freckle Face', file: 'freckle-face-400.woff2', group: 'theme', outline: true },
  { id: 'hennypenny', label: 'Henny Penny', file: 'henny-penny-400.woff2', group: 'theme', noEllipsis: true },
  { id: 'bungee', label: 'Bungee', file: 'bungee-400.woff2', group: 'theme', outline: true },
];

export const FONT_GROUPS = ['bubble', 'round', 'hand', 'reading', 'classic', 'theme', 'custom'];
export const FALLBACK_STACK = '"Trebuchet MS", "Segoe UI", sans-serif';

const customFonts = [];
const loading = new Map();
const loaded = new Set();

export function allFonts() {
  return [...FONTS, ...customFonts];
}

export function getFont(id) {
  return allFonts().find((f) => f.id === id) || FONTS[0];
}

export function familyOf(font) {
  return `lutin-${font.id.replace(/[^a-z0-9-]/gi, '-')}`;
}

/** Weight actually used for a font given the user's choice. */
export function effectiveWeight(font, weight) {
  if (font.weights) {
    const w = Number(weight) || font.weight || 400;
    return Math.max(font.weights[0], Math.min(font.weights[1], w));
  }
  return font.fixedWeight || 400;
}

export function supportsOutline(font, weight) {
  if (font.outline) return true;
  if (font.outlineMin) return effectiveWeight(font, weight) >= font.outlineMin;
  return false;
}

/** CSS / canvas font shorthand for a font at a pixel size. */
export function fontString(font, weight, sizePx) {
  return `${effectiveWeight(font, weight)} ${sizePx}px "${familyOf(font)}", ${FALLBACK_STACK}`;
}

export function isLoaded(font) {
  return loaded.has(font.id);
}

const failedAt = new Map();
const RETRY_MS = 30000;

/** Load a font into document.fonts (once). Resolves even on failure (fallback is used). */
export function loadFont(font) {
  if (loaded.has(font.id)) return Promise.resolve(true);
  if (loading.has(font.id)) return loading.get(font.id);
  // A font that just failed (offline…) is not fetched again on every keystroke.
  if (Date.now() - (failedAt.get(font.id) || 0) < RETRY_MS) return Promise.resolve(false);
  const source = font.buffer ? font.buffer : `url("${new URL(`../fonts/${font.file}`, import.meta.url).href}")`;
  const descriptors = font.weights ? { weight: `${font.weights[0]} ${font.weights[1]}` } : { weight: String(font.fixedWeight || 400) };
  const face = new FontFace(familyOf(font), source, descriptors);
  const p = face
    .load()
    .then((f) => {
      document.fonts.add(f);
      loaded.add(font.id);
      return true;
    })
    .catch(() => {
      failedAt.set(font.id, Date.now());
      return false;
    })
    .finally(() => loading.delete(font.id));
  loading.set(font.id, p);
  return p;
}

export function loadAllFonts() {
  return Promise.all(allFonts().map(loadFont));
}

// ---- Imported fonts (kept in IndexedDB, never sent anywhere) ----

const FONT_EXT = /\.(ttf|otf|woff2?)$/i;

export async function restoreCustomFonts() {
  try {
    const rows = await idbGetAll('fonts');
    for (const row of rows) {
      if (!customFonts.some((f) => f.id === row.id)) customFonts.push(toCustomFont(row));
    }
  } catch {
    // IndexedDB unavailable (private mode…): imported fonts just are not kept.
  }
  return customFonts;
}

function toCustomFont(row) {
  return { id: row.id, label: row.label, buffer: row.buffer, group: 'custom', outline: true, custom: true };
}

/** Import a font file. Returns the new font, or throws if the browser cannot read it. */
export async function importFontFile(file) {
  if (!FONT_EXT.test(file.name)) throw new Error('bad-extension');
  const buffer = await file.arrayBuffer();
  const id = `custom-${Date.now().toString(36)}`;
  const label = file.name.replace(FONT_EXT, '');
  const font = toCustomFont({ id, label, buffer });
  const ok = await loadFont(font);
  if (!ok) throw new Error('unreadable');
  customFonts.push(font);
  try {
    await idbPut('fonts', { id, label, buffer });
  } catch {
    // Not persisted, still usable for this visit.
  }
  return font;
}

export async function removeCustomFont(id) {
  const i = customFonts.findIndex((f) => f.id === id);
  if (i >= 0) customFonts.splice(i, 1);
  try {
    await idbDelete('fonts', id);
  } catch {
    // ignore
  }
}
