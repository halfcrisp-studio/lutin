// Frames and decorations: line drawings only (no solid areas), to save ink and
// to stay colorable. Geometry is built in sheet units, drawing works at any scale.
import { ICONS } from './decor-icons.js';
import { colorSequence, mulberry32 } from './color.js';
import { MM } from './formats.js';

export const DECOR_SETS = [
  { id: 'sapins', icons: ['tree-pine', 'star', 'sparkles'] },
  { id: 'flocons', icons: ['snowflake', 'sparkles', 'star'] },
  { id: 'cadeaux', icons: ['gift', 'candy-cane', 'bell'] },
  { id: 'empreintes', icons: ['footprints'] },
  { id: 'grognon', icons: ['angry', 'gift', 'frown'] },
  { id: 'magie', icons: ['wand-sparkles', 'moon-star', 'star', 'sparkles'] },
  { id: 'musique', icons: ['music', 'mic-vocal', 'star', 'sparkles'] },
  { id: 'pattes', icons: ['paw-print', 'bone', 'heart'] },
  { id: 'heros', icons: ['zap', 'shield', 'star'] },
  { id: 'toile', icons: ['star'], web: true },
  { id: 'licorne', icons: ['rainbow', 'heart', 'sparkles', 'gem', 'cloud'] },
  { id: 'bonbons', icons: ['lollipop', 'candy-cane', 'cookie', 'heart'] },
  { id: 'fleurs', icons: ['flower-2', 'heart', 'sparkles'] },
];
export const FRAME_STYLES = ['candy', 'simple', 'double', 'dots', 'festive'];
export const PLACEMENTS = ['corners', 'edges', 'scatter'];

const ICON_STROKE = 1.6; // line width inside the 24-unit icon box
const DEG = Math.PI / 180;

export function getDecorSet(id) {
  return DECOR_SETS.find((d) => d.id === id) || DECOR_SETS[0];
}

// ---------- Geometry ----------

/**
 * Frame around the sheet. `colors` are the frame colors (the text palette or the
 * color picked for the frame). Returns the frame and the inner area left for content.
 */
export function buildFrame({ page, short, style, colors, set, seed, outline }) {
  // At least 7 mm from the edge: home printers cannot print the last few millimeters.
  const inset = Math.max(short * 0.035, 7 * MM);
  const rect = { x: inset, y: inset, w: page.w - 2 * inset, h: page.h - 2 * inset };
  const lw = short * 0.0045;
  const frame = { style, rect, lw, radius: short * 0.03, color: colors[0], icons: [] };
  if (style === 'candy') {
    // Candy cane: diagonal stripes in a band, colored stripes between white ones.
    frame.band = short * 0.024;
    frame.stripes = colors.slice(0, 2);
    frame.outline = !!outline;
    const pad = frame.band + short * 0.035;
    frame.inner = { x: rect.x + pad, y: rect.y + pad, w: rect.w - 2 * pad, h: rect.h - 2 * pad };
    return frame;
  }
  if (style === 'festive') {
    const size = short * 0.05;
    const next = colorSequence(colors, seed + 303);
    const names = set.web ? ['star', 'sparkles'] : set.icons;
    const along = (x0, y0, x1, y1, startIndex) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(2, Math.round(len / (size * 3.4)));
      for (let i = 1; i < n; i++) {
        const f = i / n;
        frame.icons.push({
          type: 'icon',
          icon: names[(startIndex + i) % names.length],
          x: x0 + (x1 - x0) * f,
          y: y0 + (y1 - y0) * f,
          size,
          rot: 0,
          color: next(),
          knockout: size * 0.62,
        });
      }
    };
    const { x, y, w, h } = rect;
    along(x, y, x + w, y, 0);
    along(x + w, y, x + w, y + h, 1);
    along(x + w, y + h, x, y + h, 2);
    along(x, y + h, x, y, 3);
  }
  const pad = short * (style === 'festive' ? 0.06 : 0.04);
  frame.inner = { x: rect.x + pad, y: rect.y + pad, w: rect.w - 2 * pad, h: rect.h - 2 * pad };
  return frame;
}

/** Decorations inside `inner`. Returns the items and how much room the text must leave. */
export function buildDecor({ inner, short, set, placement, colors, seed }) {
  const s = short * 0.12;
  const next = colorSequence(colors, seed + 101);
  const rng = mulberry32(seed + 202);
  const items = [];
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const icon = (i) => set.icons[i % set.icons.length];
  const { x, y, w, h } = inner;
  // Corner drawings take room on the short axis: top/bottom in portrait, sides in landscape.
  const cornerInset = (v) => {
    if (w > h) inset.left = inset.right = v;
    else inset.top = inset.bottom = v;
  };

  if (set.web) {
    const r = s * 1.7;
    items.push({ type: 'web', x, y, r, corner: 'tl', color: next() });
    items.push({ type: 'web', x: x + w, y: y + h, r, corner: 'br', color: next() });
    cornerInset(r * 0.92);
    return { items, inset };
  }

  if (placement === 'edges') {
    const sz = s * 0.78;
    const n = Math.max(3, Math.floor(w / (sz * 1.7)));
    const step = w / n;
    const walk = set.id === 'empreintes';
    for (let i = 0; i < n; i++) {
      const cx = x + step * (i + 0.5);
      const tilt = (i % 2 ? 1 : -1) * 8 * DEG;
      const rot = walk ? 90 * DEG + tilt / 2 : tilt;
      const dy = walk ? (i % 2 ? 1 : -1) * sz * 0.12 : 0;
      items.push({ type: 'icon', icon: icon(i), x: cx, y: y + sz * 0.6 + dy, size: sz, rot, color: next() });
      items.push({ type: 'icon', icon: icon(i + 1), x: cx, y: y + h - sz * 0.6 - dy, size: sz, rot: -rot, color: next() });
    }
    inset.top = inset.bottom = sz * 1.25;
    return { items, inset };
  }

  if (placement === 'scatter') {
    const sz = s * 0.68;
    const jitter = () => (rng() - 0.5) * sz * 0.25;
    const add = (cx, cy, i) =>
      items.push({
        type: 'icon',
        icon: icon(i),
        x: cx + jitter(),
        y: cy + jitter(),
        size: sz * (0.78 + rng() * 0.32),
        rot: (rng() - 0.5) * 40 * DEG,
        color: next(),
      });
    const nx = Math.max(3, Math.floor(w / (sz * 1.9)));
    for (let i = 0; i < nx; i++) {
      const cx = x + (w / nx) * (i + 0.5);
      add(cx, y + sz * 0.6, i);
      add(cx, y + h - sz * 0.6, i + 2);
    }
    const top = y + sz * 1.6;
    const bottom = y + h - sz * 1.6;
    const ny = Math.max(1, Math.floor((bottom - top) / (sz * 1.9)));
    for (let i = 0; i < ny; i++) {
      const cy = top + ((bottom - top) / ny) * (i + 0.5);
      add(x + sz * 0.6, cy, i + 1);
      add(x + w - sz * 0.6, cy, i + 3);
    }
    inset.top = inset.bottom = inset.left = inset.right = sz * 1.3;
    return { items, inset };
  }

  // corners (default): main icon on one diagonal, the others on the second one
  const c = s * 0.62;
  const spots = [
    [x + c, y + c, -10, 0],
    [x + w - c, y + c, 10, 1],
    [x + c, y + h - c, 8, 2],
    [x + w - c, y + h - c, -8, 0],
  ];
  for (const [cx, cy, deg, i] of spots) {
    items.push({ type: 'icon', icon: icon(i), x: cx, y: cy, size: s, rot: deg * DEG, color: next() });
  }
  cornerInset(s * 1.3);
  return { items, inset };
}

// ---------- Drawing ----------

const pathCache = new Map();
function iconPaths(name) {
  let list = pathCache.get(name);
  if (!list) {
    list = (ICONS[name] || []).map((d) => new Path2D(d));
    pathCache.set(name, list);
  }
  return list;
}

export function drawIcon(ctx, item) {
  ctx.save();
  if (item.knockout) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.knockout, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.translate(item.x, item.y);
  if (item.rot) ctx.rotate(item.rot);
  const k = item.size / 24;
  ctx.scale(k, k);
  ctx.translate(-12, -12);
  ctx.lineWidth = item.stroke || ICON_STROKE;
  ctx.strokeStyle = item.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of iconPaths(item.icon)) ctx.stroke(p);
  ctx.restore();
}

const CORNER_ANGLE = { tl: 0, tr: 90, br: 180, bl: 270 };

function drawWeb(ctx, item) {
  const { x, y, r } = item;
  const base = CORNER_ANGLE[item.corner] * DEG;
  const spokes = 6;
  const rings = [0.28, 0.46, 0.64, 0.82, 1];
  const pt = (a, rad) => [x + Math.cos(a) * rad, y + Math.sin(a) * rad];
  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.lineWidth = r * 0.016;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= spokes; i++) {
    const a = base + (i / spokes) * 90 * DEG;
    ctx.moveTo(x, y);
    ctx.lineTo(...pt(a, r * 1.04));
  }
  for (const f of rings) {
    const rad = r * f;
    for (let i = 0; i < spokes; i++) {
      const a0 = base + (i / spokes) * 90 * DEG;
      const a1 = base + ((i + 1) / spokes) * 90 * DEG;
      const [x0, y0] = pt(a0, rad);
      const [x1, y1] = pt(a1, rad);
      const [cx, cy] = pt((a0 + a1) / 2, rad * 0.84);
      if (i === 0) ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function drawDecorItem(ctx, item) {
  if (item.type === 'web') drawWeb(ctx, item);
  else drawIcon(ctx, item);
}

function addRoundRect(ctx, { x, y, w, h }, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function roundRectPath(ctx, rect, r) {
  ctx.beginPath();
  addRoundRect(ctx, rect, r);
}

function drawCandy(ctx, f) {
  const { rect, radius, band } = f;
  const inner = { x: rect.x + band, y: rect.y + band, w: rect.w - 2 * band, h: rect.h - 2 * band };
  const innerRadius = Math.max(0, radius - band);
  const stripe = band * 0.85; // horizontal width of one stripe
  ctx.save();
  ctx.beginPath();
  addRoundRect(ctx, rect, radius);
  addRoundRect(ctx, inner, innerRadius);
  ctx.clip('evenodd');
  ctx.lineWidth = f.lw * 0.6;
  ctx.lineJoin = 'round';
  let i = 0;
  for (let k = -rect.h; k < rect.w + stripe; k += stripe * 2) {
    const x0 = rect.x + k;
    ctx.beginPath();
    ctx.moveTo(x0, rect.y);
    ctx.lineTo(x0 + stripe, rect.y);
    ctx.lineTo(x0 + stripe + rect.h, rect.y + rect.h);
    ctx.lineTo(x0 + rect.h, rect.y + rect.h);
    ctx.closePath();
    const color = f.stripes[i++ % f.stripes.length];
    if (f.outline) {
      ctx.strokeStyle = color;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = f.stripes[0];
  ctx.lineWidth = f.lw * 0.6;
  roundRectPath(ctx, rect, radius);
  ctx.stroke();
  roundRectPath(ctx, inner, innerRadius);
  ctx.stroke();
  ctx.restore();
}

export function drawFrame(ctx, f) {
  if (f.style === 'candy') {
    drawCandy(ctx, f);
    return;
  }
  ctx.save();
  ctx.strokeStyle = f.color;
  ctx.lineJoin = 'round';
  const { rect, lw, radius } = f;
  if (f.style === 'double') {
    ctx.lineWidth = lw * 1.3;
    roundRectPath(ctx, rect, radius);
    ctx.stroke();
    const g = lw * 3.4;
    ctx.lineWidth = lw * 0.7;
    roundRectPath(ctx, { x: rect.x + g, y: rect.y + g, w: rect.w - 2 * g, h: rect.h - 2 * g }, Math.max(0, radius - g));
    ctx.stroke();
  } else if (f.style === 'dots') {
    ctx.lineWidth = lw * 1.7;
    ctx.lineCap = 'round';
    ctx.setLineDash([0.001, lw * 3.6]);
    roundRectPath(ctx, rect, radius);
    ctx.stroke();
  } else {
    ctx.lineWidth = f.style === 'festive' ? lw * 0.8 : lw;
    roundRectPath(ctx, rect, radius);
    ctx.stroke();
  }
  ctx.restore();
  for (const it of f.icons) drawIcon(ctx, it);
}
