import { t } from './i18n.js';
import { messageText, state, subscribe } from './state.js';
import { getFont, isLoaded, loadFont, restoreCustomFonts } from './fonts.js';
import { buildScene, drawScene } from './render.js';
import { notePngBlob, printSheet, renderNoteCanvas, savePng } from './sheet.js';
import { initUI, refreshFonts, syncAll } from './ui.js';
import { DPI } from './formats.js';

const preview = document.getElementById('preview');
const previewCtx = preview.getContext('2d');
const wrap = document.getElementById('paper-wrap');
const overflowEl = document.getElementById('overflow');
let scene = null;
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
  const font = getFont(state.fontId);
  if (!isLoaded(font)) await loadFont(font);
  scene = buildScene(sceneState());
  const scale = sizeCanvas(scene.page);
  drawScene(previewCtx, scene, scale);
  overflowEl.hidden = !scene.overflow;
  syncAll(); // the size slider follows the automatic size
}

function requestRender() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    render();
  });
}

/** Fresh full-resolution note (the font is already loaded by the preview). */
function exportNote() {
  const s = buildScene(sceneState());
  return renderNoteCanvas(s);
}

function onPrint() {
  const note = exportNote();
  printSheet(note, state.format, state.orientation, state.copies);
  note.width = 1;
}

function onImage() {
  const note = exportNote();
  const blob = notePngBlob(note);
  note.width = 1;
  const day = new Date().toISOString().slice(0, 10);
  savePng(blob, `lutin-${day}.png`);
}

function init() {
  document.documentElement.lang = 'fr';
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  preview.setAttribute('aria-label', t('preview.label'));
  overflowEl.textContent = t('layout.overflow');

  initUI(document.getElementById('controls'), { currentSizePt });
  subscribe(requestRender);
  document.getElementById('btn-print').addEventListener('click', onPrint);
  document.getElementById('btn-image').addEventListener('click', onImage);
  new ResizeObserver(requestRender).observe(wrap);
  requestRender();

  restoreCustomFonts().then((fonts) => {
    if (fonts.length) {
      refreshFonts();
      requestRender();
    }
  });
}

init();
