// Sheet sizes. Everything is laid out at 300 dpi, the print and PNG resolution.
export const DPI = 300;
export const MM = DPI / 25.4;

const SIZES_MM = { a4: [210, 297], a5: [148, 210], a6: [105, 148] };
export const FORMATS = Object.keys(SIZES_MM);

// Formats offered per kind of sheet: notes stay at A5 or larger (player's rule),
// invitations are cards (A6 = four per A4 sheet).
export const FORMATS_BY_MODE = { note: ['a4', 'a5'], invite: ['a6', 'a5', 'a4'] };

// How the A4 print sheet is divided for each format (columns x rows).
export const SHEET_CELLS = { a4: [1, 1], a5: [1, 2], a6: [2, 2] };

export function noteSizePx(format, orientation) {
  let [w, h] = SIZES_MM[format] || SIZES_MM.a4;
  if (orientation === 'landscape') [w, h] = [h, w];
  return { w: Math.round(w * MM), h: Math.round(h * MM), wMm: w, hMm: h };
}

export const ptToPx = (pt) => (pt * DPI) / 72;
