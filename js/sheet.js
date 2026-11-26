// Full-resolution outputs: the note as PNG, and the A4 sheet sent to the printer.
// Everything here is synchronous on purpose: phones only allow printing and
// sharing straight from the tap, without waiting in between.
import { drawScene } from './render.js';
import { MM, SHEET_CELLS, noteSizePx } from './formats.js';

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
 * The printed page is always an A4 portrait sheet divided into cells: one for A4,
 * two halves for A5, four quarters for A6. The note is turned a quarter when its
 * orientation differs from the cell's. With `fill`, every cell gets a copy.
 * Small cut marks on the sheet edges show where to cut.
 */
export function composePrintSheet(note, format, fill, target) {
  const a4 = noteSizePx('a4', 'portrait');
  const sheet = makeCanvas(a4.w, a4.h, target);
  const ctx = sheet.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, a4.w, a4.h);

  const [cols, rows] = SHEET_CELLS[format] || SHEET_CELLS.a4;
  const cw = a4.w / cols;
  const ch = a4.h / rows;
  const rotate = cw > ch !== note.width > note.height;
  const count = fill ? cols * rows : 1;
  for (let i = 0; i < count; i++) {
    const cx = (i % cols) * cw + cw / 2;
    const cy = Math.floor(i / cols) * ch + ch / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (rotate) ctx.rotate(-Math.PI / 2);
    ctx.drawImage(note, -note.width / 2, -note.height / 2);
    ctx.restore();
  }

  if (cols * rows > 1) {
    ctx.strokeStyle = '#a8a8a8';
    ctx.lineWidth = 0.25 * MM;
    const mark = 7 * MM;
    ctx.beginPath();
    for (let c = 1; c < cols; c++) {
      const x = c * cw;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mark);
      ctx.moveTo(x, a4.h - mark);
      ctx.lineTo(x, a4.h);
    }
    for (let r = 1; r < rows; r++) {
      const y = r * ch;
      ctx.moveTo(0, y);
      ctx.lineTo(mark, y);
      ctx.moveTo(a4.w - mark, y);
      ctx.lineTo(a4.w, y);
    }
    ctx.stroke();
  }
  return sheet;
}

/** Draw the sheet into the print-only canvas and open the print dialog. */
export function printSheet(note, format, fill) {
  const target = document.getElementById('print-canvas');
  composePrintSheet(note, format, fill, target);
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

export async function notePngBlob(note) {
  const blob = await new Promise((resolve, reject) => {
    note.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
  try {
    return new Blob([withDpi(new Uint8Array(await blob.arrayBuffer()), 300)], { type: 'image/png' });
  } catch {
    return blob;
  }
}

/** Phones and tablets: share sheet (photos, AirPrint…). Touch laptops keep the download. */
export function prefersShare() {
  return !!(window.matchMedia && window.matchMedia('(pointer: coarse) and (hover: none)').matches);
}

export function canShareFile(blob, filename) {
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    return !!(navigator.canShare && navigator.canShare({ files: [file] }));
  } catch {
    return false;
  }
}

/** Resolves 'shared', 'aborted' (user closed the sheet) or 'blocked' (no gesture / not supported). */
export async function shareFile(blob, filename) {
  if (!canShareFile(blob, filename)) return 'blocked';
  try {
    await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] });
    return 'shared';
  } catch (err) {
    return err && err.name === 'AbortError' ? 'aborted' : 'blocked';
  }
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
