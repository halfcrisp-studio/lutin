// Scene building (state -> positioned text, frame, decor) and drawing.
// The scene is computed once in sheet units (300 dpi) and drawn at any scale,
// so the preview, the print sheet and the PNG are the same picture.
import { REF_SIZE, layoutText } from './layout.js';
import { effectiveWeight, familyOf, fontString, getFont, isLoaded, supportsOutline } from './fonts.js';
import { resolveColors } from './palettes.js';
import { colorSequence, mulberry32 } from './color.js';
import { signatureUnits } from './signature.js';
import { buildDecor, buildFrame, drawDecorItem, drawFrame, getDecorSet } from './decor.js';
import { noteSizePx, ptToPx } from './formats.js';
import { t } from './i18n.js';

// ---------- Measuring ----------

const measureCtx = document.createElement('canvas').getContext('2d');
const measurers = new Map();

/** Width measuring for one font/weight, cached, at REF_SIZE. */
export function measurerFor(font, weight) {
  const key = `${familyOf(font)}|${weight}|${isLoaded(font) ? 1 : 0}`;
  let m = measurers.get(key);
  if (m) return m;
  const css = fontString(font, weight, REF_SIZE);
  const widths = new Map();
  const measure = (text) => {
    let w = widths.get(text);
    if (w === undefined) {
      measureCtx.font = css;
      w = text ? measureCtx.measureText(text).width : 0;
      widths.set(text, w);
    }
    return w;
  };
  measureCtx.font = css;
  const tm = measureCtx.measureText('Hgé');
  const ascent = (tm.fontBoundingBoxAscent || tm.actualBoundingBoxAscent || 800) / REF_SIZE;
  const descent = (tm.fontBoundingBoxDescent || tm.actualBoundingBoxDescent || 200) / REF_SIZE;
  m = { measure, metrics: { ascent, descent } };
  measurers.set(key, m);
  return m;
}

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('fr', { granularity: 'grapheme' }) : null;
export function graphemes(s) {
  return segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s);
}

const LETTER = /[\p{L}\p{N}]/u;

// ---------- Scene ----------

export function buildScene(state) {
  const page = noteSizePx(state.format, state.orientation);
  const short = Math.min(page.w, page.h);
  const font = getFont(state.fontId);
  const weight = effectiveWeight(font, state.weight);
  const colors = resolveColors(state);
  const seed = state.seed | 0;
  const set = getDecorSet(state.decorSet);

  let frame = null;
  let inner;
  if (state.frame) {
    frame = buildFrame({ page, short, style: state.frameStyle, colors, set, seed });
    inner = frame.inner;
  } else {
    const m = short * 0.055;
    inner = { x: m, y: m, w: page.w - 2 * m, h: page.h - 2 * m };
  }
  let decor = { items: [], inset: { top: 0, right: 0, bottom: 0, left: 0 } };
  if (state.decor) decor = buildDecor({ inner, short, set, placement: state.decorPlacement, colors, seed });

  const pad = short * 0.01;
  const box = {
    x: inner.x + decor.inset.left + pad,
    y: inner.y + decor.inset.top + pad,
    w: inner.w - decor.inset.left - decor.inset.right - 2 * pad,
    h: inner.h - decor.inset.top - decor.inset.bottom - 2 * pad,
  };

  const upper = (s) => (state.uppercase ? s.toLocaleUpperCase('fr-FR') : s);
  const text = upper((state.text || '').normalize('NFC'));
  const paragraphs = trimEmpty(text.replace(/\r\n?/g, '\n').split('\n').map((p) => p.trim()));
  const signature = state.showSignature
    ? signatureUnits(state.names, t('signature.prefix'), t('signature.and')).map(upper)
    : [];

  const m = measurerFor(font, weight);
  const layout = layoutText({
    paragraphs,
    signature,
    box,
    measure: m.measure,
    metrics: m.metrics,
    lineHeight: state.lineHeight,
    align: state.align,
    fixedSize: state.autoSize ? null : ptToPx(state.sizePt),
    minSize: ptToPx(8),
    maxSize: Math.min(box.h * 0.3, box.w * 0.45),
  });

  const runs = buildRuns(layout, {
    colors,
    mode: state.colorMode,
    seed,
    handmade: !!state.handmade,
    connected: !!font.connected,
    measure: m.measure,
  });

  return {
    page,
    font,
    weight,
    outline: !!state.outline && supportsOutline(font, weight),
    runs,
    frame,
    decor: decor.items,
    overflow: layout.overflow,
    size: layout.size,
  };
}

function trimEmpty(list) {
  let a = 0;
  let b = list.length;
  while (a < b && !list[a]) a++;
  while (b > a && !list[b - 1]) b--;
  return list.slice(a, b);
}

function buildRuns(layout, o) {
  const nextColor = colorSequence(o.colors, o.seed);
  const rng = mulberry32(o.seed * 7 + 13);
  const perLetter = o.mode === 'letter' && o.colors.length > 1;
  const jitterLetters = o.handmade && !o.connected;
  const runs = [];
  let lastColor = o.colors[0];

  for (const line of layout.lines) {
    const s = line.size;
    const k = s / REF_SIZE;
    for (const tok of line.tokens) {
      const wordColor = perLetter ? null : (lastColor = nextColor());
      if (!perLetter && !jitterLetters) {
        const rot = o.handmade ? (rng() - 0.5) * 2 * 0.035 : 0;
        const dy = o.handmade ? (rng() - 0.5) * 2 * 0.03 * s : 0;
        runs.push({ text: tok.text, x: tok.x, y: line.baseline + dy, w: tok.width, size: s, color: wordColor, rot });
        continue;
      }
      let prefix = '';
      for (const g of graphemes(tok.text)) {
        const x0 = o.measure(prefix) * k;
        prefix += g;
        const x1 = o.measure(prefix) * k;
        if (/\s/.test(g)) continue;
        let color = wordColor;
        if (perLetter) {
          if (LETTER.test(g)) lastColor = nextColor();
          color = lastColor;
        }
        const rot = jitterLetters ? (rng() - 0.5) * 2 * 0.07 : 0;
        const dy = jitterLetters ? (rng() - 0.5) * 2 * 0.035 * s : 0;
        runs.push({ text: g, x: tok.x + x0, y: line.baseline + dy, w: x1 - x0, size: s, color, rot });
      }
    }
  }
  return runs;
}

// ---------- Drawing ----------

export function drawScene(ctx, scene, scale) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, scene.page.w, scene.page.h);
  if (scene.frame) drawFrame(ctx, scene.frame);
  for (const item of scene.decor) drawDecorItem(ctx, item);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  let size = -1;
  for (const r of scene.runs) {
    if (r.size !== size) {
      size = r.size;
      ctx.font = fontString(scene.font, scene.weight, size);
      ctx.lineWidth = Math.max(2, size * 0.045);
    }
    let x = r.x;
    let y = r.y;
    if (r.rot) {
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y);
      ctx.rotate(r.rot);
      x = -r.w / 2;
      y = 0;
    }
    if (scene.outline) {
      ctx.strokeStyle = r.color;
      ctx.strokeText(r.text, x, y);
    } else {
      ctx.fillStyle = r.color;
      ctx.fillText(r.text, x, y);
    }
    if (r.rot) ctx.restore();
  }
  ctx.restore();
}
