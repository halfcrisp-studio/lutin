// Text layout for the sheet. Pure: measuring is injected, and the result is in
// sheet units, so the preview, the print sheet and the PNG share the very same
// line breaks. A word (or a signature name) is never split across two lines.
//
// The text is a list of blocks (message, signature, invitation title, details…),
// each with its own size ratio, alignment and optional leading icon. One base
// size is fitted for the whole page.

export const REF_SIZE = 1000; // measure(text) returns the width at this font size

const NBSP = ' ';
const STICKS_TO_PREVIOUS = /^[!?:;»…%)\]]+$/u;
const STICKS_TO_NEXT = /^[«(\[]$/u;
const ICON_EM = 1.15; // width of a leading icon, in font sizes

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
 * @param {Array<object>} [o.blocks]  { paragraphs?: string[], units?: string[] (already
 *   unbreakable), scale?: number, align?: 'center'|'left'|'right', gapBefore?: number
 *   (in lines of the base size, only after other text), icon?: string, signature?: boolean }
 * @param {string[]} [o.paragraphs]  short form: the message…
 * @param {string[]} [o.signature]   …and its signature units ([] = none)
 * @param {{x:number,y:number,w:number,h:number}} o.box
 * @param {(text:string)=>number} o.measure  width at REF_SIZE
 * @param {{ascent:number,descent:number}} o.metrics  ratios of the font size
 * @param {number} o.lineHeight     line spacing factor (1.2 = 120 %)
 * @param {number} [o.sigScale]     signature size relative to the message (short form)
 * @param {'center'|'left'} [o.align] message alignment (short form)
 * @param {number|null} o.fixedSize base font size in px, or null for automatic fitting
 * @param {number} o.minSize
 * @param {number} o.maxSize
 */
export function layoutText(o) {
  const blocks = o.blocks || messageBlocks(o);
  const attempt = (size) => layoutAtSize(o, blocks, size);
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

/** The message and its signature as blocks (signature smaller, on the right). */
export function messageBlocks({ paragraphs = [], signature = [], sigScale = 0.78, align = 'center' }) {
  const blocks = [{ paragraphs, scale: 1, align }];
  if (signature.length) blocks.push({ units: signature, scale: sigScale, align: 'right', gapBefore: 0.45, signature: true });
  return blocks;
}

function layoutAtSize(o, blocks, size) {
  const { box, measure, metrics, lineHeight } = o;
  const width = (text, s) => (measure(text) * s) / REF_SIZE;
  const rows = [];
  let tooWide = false;

  for (const block of blocks) {
    const s = size * (block.scale ?? 1);
    const align = block.align || 'center';
    const signature = !!block.signature;
    let gap = rows.length && block.gapBefore ? size * lineHeight * block.gapBefore : 0;
    let icon = block.icon || null;
    const space = width(' ', s);

    const wrap = (tokens) => {
      let line = [];
      let lineW = 0;
      const flush = () => {
        rows.push({ size: s, align, signature, tokens: line, width: lineW, gap });
        gap = 0;
        line = [];
        lineW = 0;
      };
      if (icon) {
        const iw = s * ICON_EM;
        line.push({ icon, w: iw });
        lineW = iw;
        icon = null;
      }
      for (const text of tokens) {
        const w = width(text, s);
        if (w > box.w) tooWide = true;
        const hasWord = line.some((t) => !t.icon);
        if (hasWord && lineW + space + w > box.w) flush();
        line.push({ text, w });
        lineW += (line.length > 1 ? space : 0) + w;
        if (line.length === 2 && line[0].icon && lineW > box.w) tooWide = true;
      }
      if (line.length) flush();
    };

    if (block.units) {
      if (block.units.length) wrap(block.units);
    } else {
      for (const p of block.paragraphs || []) {
        const words = tokenize(p);
        if (words.length === 0) {
          rows.push({ size: s, align, signature, tokens: [], width: 0, gap });
          gap = 0;
        } else {
          wrap(words);
        }
      }
    }
  }

  let height = 0;
  for (const r of rows) height += r.gap + r.size * lineHeight;
  const fits = !tooWide && height <= box.h + 0.01;

  // Positions: text centered vertically when it fits, otherwise from the top.
  let y = box.y + (fits ? (box.h - height) / 2 : 0);
  const lines = [];
  for (const r of rows) {
    y += r.gap;
    const lh = r.size * lineHeight;
    const inkH = (metrics.ascent + metrics.descent) * r.size;
    const baseline = y + (lh - inkH) / 2 + metrics.ascent * r.size;
    let x;
    if (r.align === 'right') x = box.x + box.w - r.width;
    else if (r.align === 'left') x = box.x;
    else x = box.x + (box.w - r.width) / 2;
    const space = width(' ', r.size);
    const tokens = [];
    let cx = x;
    for (const tk of r.tokens) {
      tokens.push(tk.icon ? { icon: tk.icon, x: cx, width: tk.w } : { text: tk.text, x: cx, width: tk.w });
      cx += tk.w + space;
    }
    lines.push({ baseline, x, width: r.width, size: r.size, signature: r.signature, tokens });
    y += lh;
  }
  return { size, lines, height, fits };
}
