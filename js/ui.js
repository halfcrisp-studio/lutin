// Controls panel. Built once; each control re-syncs from the state on change.
import { t } from './i18n.js';
import { SIZE_MAX_PT, SIZE_MIN_PT, addElf, messageText, removeElf, setInvitationField, setMode, setOccasion, state, toggleSigner, update } from './state.js';
import { OCCASIONS } from './invitation.js';
import { FORMATS_BY_MODE, SHEET_CELLS } from './formats.js';
import { formatNames } from './signature.js';
import { UNIVERSES, UNIVERSE_GROUPS, universePatch } from './universes.js';
import { PALETTES, PALETTE_GROUPS, pastelLine, resolveColors, resolveInk } from './palettes.js';
import {
  DEFAULT_FONT_ID,
  FONT_GROUPS,
  allFonts,
  effectiveWeight,
  familyOf,
  getFont,
  importFontFile,
  loadAllFonts,
  removeCustomFont,
  supportsOutline,
} from './fonts.js';
import { DECOR_SETS, FRAME_STYLES, PLACEMENTS, drawDecorItem, getDecorSet } from './decor.js';
import { ensureContrast } from './color.js';

import { field, h, onSync, section, segmented, showIf, slider, syncAll, toggle } from './dom.js';
import { toolboxSection } from './toolbox-ui.js';

export { syncAll };

// ---------- sections ----------

function universeSection() {
  const grid = h('div', { class: 'font-groups' });
  const buttons = [];
  for (const group of UNIVERSE_GROUPS) {
    const chips = h('div', { class: 'chips' });
    for (const u of UNIVERSES.filter((x) => x.group === group)) {
      const b = h('button', { type: 'button', class: 'chip', onclick: () => update(universePatch(u.id)) }, t(`universe.${u.id}`));
      chips.append(b);
      buttons.push([u.id, b]);
    }
    grid.append(h('div', { class: 'font-group' }, h('div', { class: 'field-label small' }, t(`universe.group.${group}`)), chips));
  }
  onSync(() => {
    for (const [id, b] of buttons) b.setAttribute('aria-pressed', String(state.universe === id));
  });
  return section('universe', 'section.universe', true, grid, h('p', { class: 'hint' }, t('universe.hint')));
}

function namesSection() {
  const input = h('input', {
    type: 'text',
    class: 'text-input',
    placeholder: t('names.placeholder'),
    maxlength: 40,
    autocomplete: 'off',
    enterkeyhint: 'done',
    'aria-label': t('names.placeholder'),
  });
  const add = () => {
    if (!input.value.trim()) return;
    addElf(input.value);
    input.value = '';
    input.focus();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  });
  const list = h('div', { class: 'chips' });
  const empty = h('p', { class: 'hint' }, t('names.empty'));
  const preview = h('p', { class: 'signature-preview' });

  // Rebuild the chips only when the collection or the signers change (keeps keyboard focus).
  let lastKey = null;
  onSync(() => {
    empty.hidden = state.signers.length > 0 || !state.showSignature;
    preview.hidden = !state.showSignature || state.signers.length === 0;
    preview.textContent = `${t('signature.prefix')} ${formatNames(state.signers, t('signature.and'))}`;
    const key = `${state.collection.join('\n')}|${state.signers.join('\n')}`;
    if (key === lastKey) return;
    lastKey = key;
    list.replaceChildren(
      ...state.collection.map((name) => {
        const on = state.signers.includes(name);
        return h(
          'span',
          { class: `elf-chip${on ? ' is-on' : ''}` },
          h('button', { type: 'button', class: 'elf-btn', 'aria-pressed': String(on), title: t(on ? 'names.unsign' : 'names.sign', { name }), onclick: () => toggleSigner(name) }, on ? `✓ ${name}` : name),
          h('button', { type: 'button', class: 'icon-btn', title: t('names.remove', { name }), 'aria-label': t('names.remove', { name }), onclick: () => removeElf(name) }, '×'),
        );
      }),
    );
  });

  return section(
    'names',
    'section.names',
    true,
    h('div', { class: 'row' }, input, h('button', { type: 'button', class: 'btn', onclick: add }, t('names.add'))),
    h('p', { class: 'hint' }, t('names.hint')),
    list,
    empty,
    preview,
    toggle('names.showSignature', () => state.showSignature, (v) => update({ showSignature: v })),
  );
}

function messageSection() {
  const ta = h('textarea', {
    class: 'textarea',
    rows: 6,
    placeholder: t('message.placeholder'),
    'aria-label': t('section.message'),
    oninput: (e) => update({ text: e.target.value }),
  });
  ta.value = messageText();
  onSync(() => {
    if (document.activeElement !== ta) ta.value = messageText();
  });
  const clear = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-quiet',
      onclick: () => {
        update({ text: '' });
        ta.value = '';
        ta.focus();
      },
    },
    t('message.clear'),
  );
  return section('message', 'section.message', true, ta, h('div', { class: 'row end' }, clear));
}

function fontButton(font) {
  const css = { fontFamily: `"${familyOf(font)}", sans-serif`, fontWeight: String(effectiveWeight(font, null)) };
  const btn = h('button', { type: 'button', class: 'font-btn', style: css, 'data-font': font.id, onclick: () => update({ fontId: font.id, weight: null }) }, font.label);
  if (!font.custom) return btn;
  const remove = h(
    'button',
    {
      type: 'button',
      class: 'icon-btn',
      title: t('style.removeFont'),
      'aria-label': t('style.removeFont'),
      onclick: async () => {
        await removeCustomFont(font.id);
        if (state.fontId === font.id) update({ fontId: DEFAULT_FONT_ID, weight: null });
        renderFontGrid();
      },
    },
    '×',
  );
  return h('span', { class: 'font-custom' }, btn, remove);
}

const fontGroups = document.createElement('div');
fontGroups.className = 'font-groups';

function renderFontGrid() {
  fontGroups.replaceChildren(
    ...FONT_GROUPS.map((g) => {
      const fonts = allFonts().filter((f) => f.group === g);
      if (!fonts.length) return null;
      return h('div', { class: 'font-group' }, h('div', { class: 'field-label small' }, t(`style.fontGroup.${g}`)), h('div', { class: 'font-grid' }, ...fonts.map(fontButton)));
    }).filter(Boolean),
  );
  syncFontButtons();
}

function syncFontButtons() {
  for (const b of fontGroups.querySelectorAll('.font-btn')) b.setAttribute('aria-pressed', String(b.dataset.font === state.fontId));
}

function paletteSwatches(p) {
  const colors = p.id === 'single' ? [ensureContrast(state.singleColor)] : p.id === 'custom' ? resolveColors({ ...state, paletteId: 'custom' }) : p.colors;
  return h(
    'span',
    { class: 'swatches' },
    ...colors.slice(0, 6).map((c) => h('span', { class: 'swatch', style: { background: c, boxShadow: p.pastel ? `inset 0 0 0 2px ${pastelLine(c)}` : '' } })),
  );
}

function colorsField() {
  const grid = h('div', { class: 'palette-groups' });
  const paletteButtons = [];
  for (const group of PALETTE_GROUPS) {
    const sub = h('div', { class: 'palette-grid' });
    for (const p of PALETTES.filter((x) => x.group === group)) {
      const b = h('button', { type: 'button', class: 'palette-btn', onclick: () => update({ paletteId: p.id }) }, paletteSwatches(p), h('span', { class: 'palette-name' }, t(`palette.${p.id}`)));
      sub.append(b);
      paletteButtons.push([p, b]);
    }
    grid.append(h('div', { class: 'font-group' }, h('div', { class: 'field-label small' }, t(`palette.group.${group}`)), sub));
  }
  onSync(() => {
    for (const [p, b] of paletteButtons) {
      b.setAttribute('aria-pressed', String(state.paletteId === p.id));
      if (p.id === 'single' || p.id === 'custom') b.firstChild.replaceWith(paletteSwatches(p));
    }
  });

  const single = h('input', { type: 'color', class: 'color-input', 'aria-label': t('style.singleColor'), oninput: (e) => update({ singleColor: e.target.value }) });
  onSync(() => {
    single.value = state.singleColor;
  });
  const singleRow = showIf(h('label', { class: 'row' }, single, h('span', {}, t('style.singleColor'))), () => state.paletteId === 'single');

  const customList = h('div', { class: 'row wrap' });
  const renderCustom = () => {
    const colors = state.customColors;
    customList.replaceChildren(
      ...colors.map((c, i) =>
        h(
          'span',
          { class: 'color-chip' },
          h('input', {
            type: 'color',
            class: 'color-input',
            value: c,
            'aria-label': `${t('style.customColors')} ${i + 1}`,
            onchange: (e) => update({ customColors: colors.map((x, j) => (j === i ? e.target.value : x)) }),
          }),
          colors.length > 1
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'icon-btn',
                  title: t('style.removeColor'),
                  'aria-label': t('style.removeColor'),
                  onclick: () => update({ customColors: colors.filter((_, j) => j !== i) }),
                },
                '×',
              )
            : null,
        ),
      ),
      colors.length < 5
        ? h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => update({ customColors: [...colors, '#1565C0'] }) }, `+ ${t('style.addColor')}`)
        : null,
    );
  };
  let lastCustom = '';
  onSync(() => {
    const key = state.customColors.join(',');
    if (key !== lastCustom) {
      lastCustom = key;
      renderCustom();
    }
  });
  const customRow = showIf(customList, () => state.paletteId === 'custom');
  const hint = showIf(h('p', { class: 'hint' }, t('style.contrastHint')), () => state.paletteId === 'single' || state.paletteId === 'custom');
  const pastelHint = showIf(h('p', { class: 'hint' }, t('style.pastelHint')), () => resolveInk(state).pastel);

  const multi = () => resolveColors(state).length > 1;
  const mode = showIf(
    field(
      'style.colorMode',
      h(
        'div',
        { class: 'row wrap' },
        segmented(
          [
            { value: 'letter', label: t('style.colorMode.letter') },
            { value: 'word', label: t('style.colorMode.word') },
          ],
          () => state.colorMode,
          (v) => update({ colorMode: v }),
        ),
        h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => update({ seed: Math.floor(Math.random() * 1e9) }) }, `🎲 ${t('style.shuffle')}`),
      ),
    ),
    multi,
  );

  return field('style.colors', grid, singleRow, customRow, hint, pastelHint, mode);
}

function styleSection() {
  const fileInput = h('input', { type: 'file', accept: '.ttf,.otf,.woff,.woff2', class: 'visually-hidden', tabindex: '-1' });
  const importMsg = h('p', { class: 'hint error', hidden: true }, t('style.importError'));
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    importMsg.hidden = true;
    try {
      const font = await importFontFile(file);
      renderFontGrid();
      update({ fontId: font.id, weight: null });
    } catch {
      importMsg.hidden = false;
    }
  });
  renderFontGrid();
  onSync(syncFontButtons);

  const currentFont = () => getFont(state.fontId);
  const weight = showIf(
    slider({
      labelKey: 'style.weight',
      min: () => (currentFont().weights || [400, 400])[0],
      max: () => (currentFont().weights || [400, 400])[1],
      step: 50,
      get: () => effectiveWeight(currentFont(), state.weight),
      set: (v) => update({ weight: v }),
    }),
    () => !!currentFont().weights,
  );

  const outlineOk = () => supportsOutline(currentFont(), state.weight);
  const render = field(
    'style.render',
    segmented(
      [
        { value: false, label: t('style.render.fill') },
        { value: true, label: t('style.render.outline') },
      ],
      () => !!state.outline && outlineOk(),
      (v) => update({ outline: v }),
    ),
    showIf(h('p', { class: 'hint' }, t('style.outlineUnavailable')), () => state.outline && !outlineOk()),
  );

  const sec = section(
    'style',
    'section.style',
    false,
    field('style.font', fontGroups),
    weight,
    colorsField(),
    render,
    toggle('style.uppercase', () => state.uppercase, (v) => update({ uppercase: v })),
    toggle('style.handmade', () => state.handmade, (v) => update({ handmade: v })),
    // Importing a font is rare: tucked away in a closed panel at the very end,
    // so that it is never tapped by mistake while picking a font.
    h(
      'details',
      { class: 'sub-panel' },
      h('summary', {}, t('style.ownFont')),
      h('p', { class: 'hint' }, t('style.importHint')),
      h('div', { class: 'row wrap' }, h('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() }, t('style.importFont')), fileInput),
      importMsg,
    ),
  );
  // Font previews need every font: load them when the section is first opened.
  sec.addEventListener('toggle', () => {
    if (sec.open) loadAllFonts();
  });
  return sec;
}

const clampPt = (v) => Math.min(SIZE_MAX_PT, Math.max(SIZE_MIN_PT, Math.round(v)));

/** "Fill the sheet (2 or 4 copies)" for formats smaller than A4. */
function fillToggle() {
  const el = toggle('layout.fill', () => state.fillSheet, (v) => update({ fillSheet: v }));
  const label = el.querySelector('.switch-label');
  onSync(() => {
    const [cols, rows] = SHEET_CELLS[state.format] || [1, 1];
    el.hidden = cols * rows < 2;
    label.textContent = t('layout.fill', { count: cols * rows });
  });
  return el;
}

function inviteSection() {
  const inputs = [];
  const fieldInput = (key, opts = {}) => {
    const id = `invite-${key}`;
    const input = opts.multiline
      ? h('textarea', { id, class: 'textarea textarea-small', rows: 2 })
      : h('input', { id, type: 'text', class: 'text-input', autocomplete: 'off', inputmode: opts.numeric ? 'numeric' : null, maxlength: opts.max || 120 });
    input.addEventListener('input', () => setInvitationField(key, input.value));
    inputs.push([key, input]);
    return h('label', { class: `field${opts.small ? ' field-small' : ''}`, for: id }, h('span', { class: 'field-label' }, t(`invite.${key}`)), input);
  };
  onSync(() => {
    for (const [key, input] of inputs) if (document.activeElement !== input) input.value = state.invitation[key] || '';
  });
  return section(
    'invite',
    'section.invite',
    true,
    field(
      'invite.occasion',
      segmented(
        OCCASIONS.map((o) => ({ value: o, label: t(`invite.occasion.${o}`) })),
        () => state.occasion,
        (v) => setOccasion(v),
      ),
    ),
    fieldInput('title'),
    h('div', { class: 'field-row' }, fieldInput('name', { max: 40 }), fieldInput('age', { numeric: true, max: 3, small: true })),
    fieldInput('message', { multiline: true }),
    fieldInput('date'),
    fieldInput('time'),
    fieldInput('place'),
    fieldInput('rsvp'),
    h('p', { class: 'hint' }, t('invite.privacy')),
  );
}

function modeBar() {
  return h(
    'div',
    { class: 'mode-bar' },
    h('span', { class: 'mode-label' }, t('mode.label')),
    segmented(
      [
        { value: 'note', label: t('mode.note') },
        { value: 'invite', label: t('mode.invite') },
        { value: 'tools', label: t('mode.tools') },
      ],
      () => state.mode,
      (v) => setMode(v),
    ),
  );
}

function layoutSection(hooks) {
  return section(
    'layout',
    'section.layout',
    false,
    // Formats depend on what is being made (notes: A5 or larger; invitations: cards).
    ...Object.entries(FORMATS_BY_MODE).map(([mode, formats]) =>
      showIf(
        field(
          'layout.format',
          segmented(
            formats.map((f) => ({ value: f, label: t(`layout.format.${f}`) })),
            () => state.format,
            (v) => update({ format: v }),
          ),
        ),
        () => state.mode === mode,
      ),
    ),
    fillToggle(),
    field(
      'layout.orientation',
      segmented(
        [
          { value: 'portrait', label: t('layout.orientation.portrait') },
          { value: 'landscape', label: t('layout.orientation.landscape') },
        ],
        () => state.orientation,
        (v) => update({ orientation: v }),
      ),
    ),
    toggle(
      'layout.autoSize',
      () => state.autoSize,
      (v) => update(v ? { autoSize: true } : { autoSize: false, sizePt: clampPt(hooks.currentSizePt() || state.sizePt) }),
    ),
    slider({
      labelKey: 'layout.size',
      min: SIZE_MIN_PT,
      max: SIZE_MAX_PT,
      step: 1,
      get: () => (state.autoSize ? clampPt(hooks.currentSizePt() || state.sizePt) : state.sizePt),
      set: (v) => update({ sizePt: v, autoSize: false }),
      format: (v) => `${v} pt`,
      disabled: () => state.autoSize,
    }),
    slider({
      labelKey: 'layout.lineHeight',
      min: 0.9,
      max: 2,
      step: 0.05,
      get: () => state.lineHeight,
      set: (v) => update({ lineHeight: v }),
      format: (v) => `${Math.round(v * 100)} %`,
    }),
    showIf(
      field(
        'layout.align',
        segmented(
          [
            { value: 'center', label: t('layout.align.center') },
            { value: 'left', label: t('layout.align.left') },
          ],
          () => state.align,
          (v) => update({ align: v }),
        ),
      ),
      () => state.mode !== 'invite',
    ),
  );
}

function setPreview(set) {
  const size = 40;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const c = h('canvas', { class: 'set-preview', width: size * dpr, height: size * dpr, 'aria-hidden': 'true' });
  const draw = () => {
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = resolveInk(state).lines;
    if (set.web) drawDecorItem(ctx, { type: 'web', x: 3, y: 3, r: 34, corner: 'tl', color: colors[0] });
    else drawDecorItem(ctx, { type: 'icon', icon: set.icons[0], x: size / 2, y: size / 2, size: 30, rot: 0, color: colors[0], stroke: 2 });
  };
  return { c, draw };
}

const FRAME_SWATCHES = ['#C62828', '#1B5E20', '#1565C0', '#9C7A00', '#D81B60', '#6A1B9A', '#111111'];

function frameColorField() {
  const row = h('div', { class: 'row wrap' });
  const auto = h('button', { type: 'button', class: 'seg-btn', onclick: () => update({ frameColor: 'auto' }) }, t('decor.frameColor.auto'));
  row.append(auto);
  const swatches = FRAME_SWATCHES.map((c) => {
    const b = h('button', { type: 'button', class: 'swatch-btn', style: { background: c }, title: c, 'aria-label': c, onclick: () => update({ frameColor: c }) });
    row.append(b);
    return [c, b];
  });
  const custom = h('input', { type: 'color', class: 'color-input', title: t('decor.frameColor.custom'), 'aria-label': t('decor.frameColor.custom'), oninput: (e) => update({ frameColor: e.target.value.toUpperCase() }) });
  row.append(custom);
  onSync(() => {
    const v = state.frameColor;
    auto.setAttribute('aria-pressed', String(v === 'auto'));
    for (const [c, b] of swatches) b.setAttribute('aria-pressed', String(v.toUpperCase() === c));
    const isCustom = v !== 'auto' && !FRAME_SWATCHES.includes(v.toUpperCase());
    custom.classList.toggle('is-on', isCustom);
    if (v !== 'auto') custom.value = v.toLowerCase();
  });
  return field('decor.frameColor', row);
}

function decorSection() {
  const setGrid = h('div', { class: 'set-grid' });
  const previews = [];
  const buttons = DECOR_SETS.map((set) => {
    const p = setPreview(set);
    previews.push(p);
    const b = h('button', { type: 'button', class: 'set-btn', onclick: () => update({ decorSet: set.id }) }, p.c, h('span', {}, t(`decor.set.${set.id}`)));
    setGrid.append(b);
    return [set.id, b];
  });
  let lastColors = '';
  onSync(() => {
    for (const [id, b] of buttons) b.setAttribute('aria-pressed', String(state.decorSet === id));
    const key = resolveColors(state).join(',');
    if (key !== lastColors) {
      lastColors = key;
      for (const p of previews) p.draw();
    }
  });

  return section(
    'decor',
    'section.decor',
    false,
    toggle('decor.frame', () => state.frame, (v) => update({ frame: v })),
    showIf(
      segmented(
        FRAME_STYLES.map((s) => ({ value: s, label: t(`decor.frame.${s}`) })),
        () => state.frameStyle,
        (v) => update({ frameStyle: v }),
      ),
      () => state.frame,
    ),
    showIf(frameColorField(), () => state.frame),
    toggle('decor.decor', () => state.decor, (v) => update({ decor: v })),
    showIf(field('decor.set', setGrid), () => state.decor),
    showIf(
      field(
        'decor.placement',
        segmented(
          PLACEMENTS.map((p) => ({ value: p, label: t(`decor.placement.${p}`) })),
          () => state.decorPlacement,
          (v) => update({ decorPlacement: v }),
        ),
      ),
      () => state.decor && !getDecorSet(state.decorSet).web,
    ),
  );
}

/** Rebuild the font list (after imported fonts are restored). */
export function refreshFonts() {
  renderFontGrid();
}

export function initUI(root, hooks) {
  const isNote = () => state.mode === 'note';
  // "I make" sits above the preview, at the very top of the page.
  document.getElementById('mode-bar').replaceChildren(modeBar());
  root.replaceChildren(
    universeSection(),
    showIf(toolboxSection(), () => state.mode === 'tools'),
    showIf(namesSection(), () => state.mode !== 'invite'),
    showIf(messageSection(), isNote),
    showIf(inviteSection(), () => state.mode === 'invite'),
    styleSection(),
    layoutSection(hooks),
    decorSection(),
  );
}
