import { t } from './i18n.js';
import { messageText, state, subscribe, update } from './state.js';
import { getFont, loadFont, restoreCustomFonts } from './fonts.js';
import { buildScene, drawScene } from './render.js';
import { canShareFile, download, notePngBlob, prefersShare, printSheet, renderNoteCanvas, shareFile } from './sheet.js';
import { initUI, refreshFonts, syncAll } from './ui.js';
import { DPI } from './formats.js';
import { initThemeToggle } from './theme.js';

const preview = document.getElementById('preview');
const previewCtx = preview.getContext('2d');
const wrap = document.getElementById('paper-wrap');
const overflowEl = document.getElementById('overflow');
const btnPrint = document.getElementById('btn-print');
const btnImage = document.getElementById('btn-image');
let scene = null;
let renderedFontId = null;
let frame = 0;

function sceneState() {
  return { ...state, text: messageText() };
}

function currentSizePt() {
  return scene ? (scene.size * 72) / DPI : null;
}

function sizeCanvas(page) {
  const ratio = page.h / page.w;
  const wide = window.innerWidth >= 900;
  const maxH = wide ? window.innerHeight - 140 : window.innerHeight * 0.62;
  const cssW = Math.max(120, Math.min(wrap.clientWidth, maxH / ratio));
  const cssH = cssW * ratio;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const pxW = Math.round(cssW * dpr);
  const pxH = Math.round(cssH * dpr);
  if (preview.width !== pxW || preview.height !== pxH) {
    preview.width = pxW;
    preview.height = pxH;
  }
  preview.style.width = `${cssW}px`;
  preview.style.height = `${cssH}px`;
  return pxW / page.w;
}

async function render() {
  try {
    const fontId = state.fontId;
    await loadFont(getFont(fontId)); // resolves false if it fails: the fallback is drawn
    scene = buildScene(sceneState());
    renderedFontId = fontId;
    drawScene(previewCtx, scene, sizeCanvas(scene.page));
    overflowEl.hidden = !scene.overflow;
  } finally {
    syncAll(); // the size slider follows the automatic size
  }
}

function requestRender() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    render();
  });
}

/** Exports wait for the chosen font, so the output matches the preview. */
function readyToExport() {
  if (renderedFontId === state.fontId) return true;
  requestRender();
  return false;
}

/** Fresh full-resolution note, built from the same state as the preview. */
function exportNote() {
  return renderNoteCanvas(buildScene(sceneState()));
}

function onPrint() {
  if (!readyToExport()) return;
  const note = exportNote();
  printSheet(note, state.format, state.orientation, state.copies);
  note.width = 1;
}

let busy = false;
async function onImage() {
  if (busy || !readyToExport()) return;
  busy = true;
  btnImage.disabled = true;
  btnImage.textContent = t('action.preparing');
  try {
    const note = exportNote();
    const blob = await notePngBlob(note);
    note.width = 1;
    const name = `lutin-${new Date().toISOString().slice(0, 10)}.png`;
    if (!prefersShare()) download(blob, name);
    else if ((await shareFile(blob, name)) === 'blocked') showImageDialog(blob, name);
  } finally {
    busy = false;
    btnImage.disabled = false;
    btnImage.textContent = t('action.image');
  }
}

// Fallback when the phone refused to share straight away: a fresh tap shares,
// and a long press on the picture saves it on every phone.
let dialogUrl = null;
function showImageDialog(blob, name) {
  const dialog = document.getElementById('image-dialog');
  if (dialogUrl) URL.revokeObjectURL(dialogUrl);
  dialogUrl = URL.createObjectURL(blob);
  document.getElementById('image-dialog-img').src = dialogUrl;
  const share = document.getElementById('image-share');
  share.hidden = !canShareFile(blob, name);
  share.onclick = () => shareFile(blob, name);
  document.getElementById('image-download').onclick = () => download(blob, name);
  if (dialog.showModal) dialog.showModal();
  else download(blob, name);
}

function init() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  preview.setAttribute('aria-label', t('preview.label'));
  overflowEl.textContent = t('layout.overflow');

  initThemeToggle(document.getElementById('theme-toggle'));
  initUI(document.getElementById('controls'), { currentSizePt });
  subscribe(() => {
    syncAll();
    requestRender();
  });
  btnPrint.addEventListener('click', onPrint);
  btnImage.addEventListener('click', onImage);
  document.getElementById('image-close').addEventListener('click', () => document.getElementById('image-dialog').close());
  new ResizeObserver(requestRender).observe(wrap);
  requestRender();

  restoreCustomFonts().then((fonts) => {
    if (fonts.length) refreshFonts();
    // A saved imported font that is gone (site data cleared…): back to the default.
    if (getFont(state.fontId).id !== state.fontId) update({ fontId: 'luckiest', weight: null });
    else if (fonts.length) requestRender();
  });
}

init();
