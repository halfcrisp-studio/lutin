// Text layout for the sheet. Pure: measuring is injected, and the result is in
// sheet units, so the preview, the print sheet and the PNG share the very same
// line breaks. A word (or a signature name) is never split across two lines.

export const REF_SIZE = 1000; // measure(text) returns the width at this font size

const NBSP = ' ';
const STICKS_TO_PREVIOUS = /^[!?:;»…%)\]]+$/u;
const STICKS_TO_NEXT = /^[«(\[]$/u;

/**
 * Split a paragraph into unbreakable words. French spaced punctuation
 * ("enfants !", "« oui »") stays glued to its word with a no-break space,
 * so a "!" never starts a line on its own. No-break spaces typed by the user are kept.
 */
export function tokenize(paragraph) {
  const out = [];
  let open = '';
  for (const w of paragraph.split(/[ \t\f\v\r\n]+/).filter(Boolean)) {
    if (STICKS_TO_NEXT.test(w)) {
      open += w + NBSP;
      continue;
    }
    const word = open + w;
    open = '';
    if (STICKS_TO_PREVIOUS.test(word) && out.length) out[out.length - 1] += NBSP + word;
    else out.push(word);
  }
  if (open) out.push(open.slice(0, -1));
  return out;
}

/**
 * @param {object} o
 * @param {string[]} o.paragraphs   message split on line breaks ('' = empty line)
 * @param {string[]} o.signature    unbreakable signature units ([] = no signature)
 * @param {{x:number,y:number,w:number,h:number}} o.box
 * @param {(text:string)=>number} o.measure  width at REF_SIZE
 * @param {{ascent:number,descent:number}} o.metrics  ratios of the font size
 * @param {number} o.lineHeight     line spacing factor (1.2 = 120 %)
 * @param {number} [o.sigScale]     signature size relative to the message
 * @param {'center'|'left'} o.align
 * @param {number|null} o.fixedSize font size in px, or null for automatic fitting
 * @param {number} o.minSize
 * @param {number} o.maxSize
 */
export function layoutText(o) {
  const attempt = (size) => layoutAtSize(o, size);
  if (o.fixedSize) {
    const r = attempt(o.fixedSize);
    return { ...r, overflow: !r.fits };
  }
  let lo = o.minSize;
  let hi = Math.max(o.minSize, o.maxSize);
  let best = attempt(lo);
  if (!best.fits) return { ...best, overflow: true };
  const top = attempt(hi);
  if (top.fits) return { ...top, overflow: false };
  for (let i = 0; i < 30 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    const r = attempt(mid);
    if (r.fits) {
      best = r;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { ...best, overflow: false };
}

function layoutAtSize(o, size) {
  const { box, measure, metrics, lineHeight, align } = o;
  const sigScale = o.sigScale ?? 0.78;
  const width = (text, s) => (measure(text) * s) / REF_SIZE;
  const rows = [];
  let tooWide = false;

  const wrap = (tokens, s, signature) => {
    const space = width(' ', s);
    let line = [];
    let lineW = 0;
    const flush = () => {
      rows.push({ size: s, signature, tokens: line, width: lineW });
      line = [];
      lineW = 0;
    };
    for (const text of tokens) {
      const w = width(text, s);
      if (w > box.w) tooWide = true;
      if (line.length && lineW + space + w > box.w) flush();
      line.push({ text, w });
      lineW += (line.length > 1 ? space : 0) + w;
    }
    if (line.length) flush();
    return space;
  };

  for (const p of o.paragraphs) {
    const words = tokenize(p);
    if (words.length === 0) rows.push({ size, signature: false, tokens: [], width: 0 });
    else wrap(words, size, false);
  }
  const hasText = rows.length > 0;
  const sigSize = size * sigScale;
  const gap = hasText && o.signature.length ? size * lineHeight * 0.45 : 0;
  if (o.signature.length) wrap(o.signature, sigSize, true);

  let height = gap;
  for (const r of rows) height += r.size * lineHeight;
  const fits = !tooWide && height <= box.h + 0.01;

  // Positions: block centered vertically when it fits, otherwise from the top.
  let y = box.y + (fits ? (box.h - height) / 2 : 0);
  const lines = [];
  let gapDone = false;
  for (const r of rows) {
    if (r.signature && !gapDone) {
      y += gap;
      gapDone = true;
    }
    const lh = r.size * lineHeight;
    const inkH = (metrics.ascent + metrics.descent) * r.size;
    const baseline = y + (lh - inkH) / 2 + metrics.ascent * r.size;
    let x;
    if (r.signature) x = box.x + box.w - r.width;
    else if (align === 'left') x = box.x;
    else x = box.x + (box.w - r.width) / 2;
    const space = width(' ', r.size);
    const tokens = [];
    let cx = x;
    for (const tk of r.tokens) {
      tokens.push({ text: tk.text, x: cx, width: tk.w });
      cx += tk.w + space;
    }
    lines.push({ baseline, x, width: r.width, size: r.size, signature: r.signature, tokens });
    y += lh;
  }
  return { size, lines, height, fits };
}
