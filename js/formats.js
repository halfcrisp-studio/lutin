// Sheet sizes. Everything is laid out at 300 dpi, the print and PNG resolution.
export const DPI = 300;
export const MM = DPI / 25.4;

const SIZES_MM = { a4: [210, 297], a5: [148, 210] };
export const FORMATS = Object.keys(SIZES_MM);

export function noteSizePx(format, orientation) {
  let [w, h] = SIZES_MM[format] || SIZES_MM.a4;
  if (orientation === 'landscape') [w, h] = [h, w];
  return { w: Math.round(w * MM), h: Math.round(h * MM), wMm: w, hMm: h };
}

export const ptToPx = (pt) => (pt * DPI) / 72;
