// Tiny DOM helpers shared by the control panels. Each control registers a
// sync callback that re-reads the state after every change.
import { t } from './i18n.js';

const syncs = [];
export function onSync(fn) {
  syncs.push(fn);
  fn();
}
export function syncAll() {
  for (const fn of syncs) fn();
}

// ---------- tiny DOM helpers ----------

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function section(id, titleKey, open, ...content) {
  return h(
    'details',
    { class: 'card', id: `sec-${id}`, open: open || null },
    h('summary', {}, h('span', { class: 'card-title' }, t(titleKey))),
    h('div', { class: 'card-body' }, ...content),
  );
}

export function field(labelKey, ...content) {
  return h('div', { class: 'field' }, h('div', { class: 'field-label' }, t(labelKey)), ...content);
}

export function segmented(options, get, set) {
  const wrap = h('div', { class: 'seg', role: 'group' });
  const buttons = options.map((o) => {
    const b = h('button', { type: 'button', class: 'seg-btn', onclick: () => set(o.value) }, o.label);
    wrap.append(b);
    return [o.value, b];
  });
  onSync(() => {
    const v = get();
    for (const [val, b] of buttons) b.setAttribute('aria-pressed', String(val === v));
  });
  return wrap;
}

export function toggle(labelKey, get, set) {
  const input = h('input', { type: 'checkbox', role: 'switch', onchange: (e) => set(e.target.checked) });
  const el = h(
    'label',
    { class: 'switch' },
    input,
    h('span', { class: 'switch-ui', 'aria-hidden': 'true' }),
    h('span', { class: 'switch-label' }, t(labelKey)),
  );
  onSync(() => {
    input.checked = !!get();
  });
  return el;
}

export function slider({ labelKey, min, max, step, get, set, format, disabled }) {
  const out = h('output', { class: 'slider-value' });
  const input = h('input', { type: 'range', min, max, step, oninput: (e) => set(Number(e.target.value)) });
  const el = h('label', { class: 'slider' }, h('span', { class: 'slider-head' }, h('span', {}, t(labelKey)), out), input);
  onSync(() => {
    const lim = typeof min === 'function' ? [min(), max()] : null;
    if (lim) {
      input.min = lim[0];
      input.max = lim[1];
    }
    const v = get();
    input.value = v;
    out.textContent = format ? format(v) : v;
    const off = disabled ? disabled() : false;
    input.disabled = off;
    el.classList.toggle('is-disabled', off);
  });
  return el;
}

export function showIf(el, cond) {
  onSync(() => {
    el.hidden = !cond();
  });
  return el;
}
