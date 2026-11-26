// Full-resolution outputs: the note as PNG, and the A4 sheet sent to the printer.
// Everything here is synchronous on purpose: phones only allow printing and
// sharing straight from the tap, without waiting in between.
import { drawScene } from './render.js';
import { MM, noteSizePx } from './formats.js';

function makeCanvas(w, h, target) {
  const c = target || document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** The note at 300 dpi, in its own orientation. */
export function renderNoteCanvas(scene) {
  const c = makeCanvas(scene.page.w, scene.page.h);
  drawScene(c.getContext('2d'), scene, 1);
  return c;
}

/**
 * The printed page is always an A4 portrait sheet: a landscape note is turned
 * a quarter, an A5 note takes the top half (and the bottom half for a second copy),
 * with small cut marks on the fold line.
 */
export function composePrintSheet(note, format, orientation, copies, target) {
  const a4 = noteSizePx('a4', 'portrait');
  const sheet = makeCanvas(a4.w, a4.h, target);
  const ctx = sheet.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, a4.w, a4.h);

  const drawFitted = (cx, cy, rotate) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (rotate) ctx.rotate(-Math.PI / 2);
    ctx.drawImage(note, -note.width / 2, -note.height / 2);
    ctx.restore();
  };

  if (format !== 'a5') {
    drawFitted(a4.w / 2, a4.h / 2, orientation === 'landscape');
    return sheet;
  }
  const half = a4.h / 2;
  const rotate = orientation !== 'landscape';
  drawFitted(a4.w / 2, half / 2, rotate);
  if (copies === 2) drawFitted(a4.w / 2, half + half / 2, rotate);

  ctx.strokeStyle = '#a8a8a8';
  ctx.lineWidth = 0.25 * MM;
  const mark = 7 * MM;
  ctx.beginPath();
  ctx.moveTo(0, half);
  ctx.lineTo(mark, half);
  ctx.moveTo(a4.w - mark, half);
  ctx.lineTo(a4.w, half);
  ctx.stroke();
  return sheet;
}

/** Draw the sheet into the print-only canvas and open the print dialog. */
export function printSheet(note, format, orientation, copies) {
  const target = document.getElementById('print-canvas');
  composePrintSheet(note, format, orientation, copies, target);
  const release = () => {
    target.width = 1;
    target.height = 1;
    window.removeEventListener('afterprint', release);
  };
  window.addEventListener('afterprint', release);
  window.print();
}

// ---- PNG with a 300 dpi tag, so photo apps print it at the right size ----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Insert a pHYs chunk (pixels per meter) right after the IHDR chunk. */
export function withDpi(src, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  chunk[16] = 1; // unit: meter
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const ihdrEnd = 8 + 25; // PNG signature + IHDR chunk
  const out = new Uint8Array(src.length + chunk.length);
  out.set(src.subarray(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(src.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}

export function notePngBlob(note) {
  const dataUrl = note.toDataURL('image/png');
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([withDpi(bytes, 300)], { type: 'image/png' });
}

/** Share the PNG on phones (photos, AirPrint…), download it elsewhere. */
export function savePng(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' });
  const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] }).catch((err) => {
      if (!err || err.name !== 'AbortError') download(blob, filename);
    });
    return;
  }
  download(blob, filename);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
