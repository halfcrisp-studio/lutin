// Development sheet: renders several combinations side by side (same code as the app).
import { buildScene, drawScene } from '../js/render.js';
import { DEFAULTS } from '../js/state.js';
import { universePatch } from '../js/universes.js';
import { loadAllFonts } from '../js/fonts.js';
import { t } from '../js/i18n.js';

const example = t('message.example');
const base = { ...DEFAULTS, text: example, frame: true, decor: true, signers: ['Lutin Farceur', 'Biscotte'] };

const variants = [
  ['Lutins de Noël', { ...base, ...universePatch('lutins') }],
  ['Journée Grognon', { ...base, ...universePatch('grognon'), signers: ['Grincheux'] }],
  ['Académie de Magie', { ...base, ...universePatch('magie') }],
  ['Idoles contre les Ombres', { ...base, ...universePatch('idoles') }],
  ['Chiots Sauveteurs', { ...base, ...universePatch('chiots'), signers: ['Pompon', 'Caramel', 'Filou'] }],
  ['Héros Araignée', { ...base, ...universePatch('araignee') }],
  ["Contour à colorier, cadre sucre d'orge", { ...base, outline: true, frameStyle: 'candy' }],
  ["Cadre sucre d'orge couleurs du texte", { ...base, frameStyle: 'candy', frameColor: 'auto' }],
  ["Cadre sucre d'orge bleu, paysage", { ...base, orientation: 'landscape', frameStyle: 'candy', frameColor: '#1565C0', paletteId: 'givre', decorSet: 'flocons' }],
  ['A5 paysage, Pacifico, arc-en-ciel par mot', { ...base, format: 'a5', orientation: 'landscape', fontId: 'pacifico', paletteId: 'arc', colorMode: 'word', decorSet: 'cadeaux', decorPlacement: 'edges', frame: false }],
  ['Andika MAJUSCULES, noir, sans décor', { ...base, fontId: 'andika', uppercase: true, paletteId: 'noir', decor: false, frame: false, handmade: false }],
  ['Pas de lutin, haut et bas', { ...base, decorSet: 'empreintes', decorPlacement: 'edges', frameStyle: 'dots', fontId: 'fredoka' }],
  ['Licorne tout autour, Comfortaa fine', { ...base, paletteId: 'licorne', decorSet: 'licorne', decorPlacement: 'scatter', fontId: 'comfortaa', weight: 300, frame: false }],
  ['Texte long, A4 paysage', { ...base, orientation: 'landscape', fontId: 'christmas', text: `${example}\n\nIndice : regardez près de quelque chose qui brille… et n'oubliez pas de dire merci au sapin !`, frameStyle: 'double' }],
];

async function main() {
  await loadAllFonts();
  const grid = document.getElementById('grid');
  for (const [label, s] of variants) {
    const scene = buildScene(s);
    const c = document.createElement('canvas');
    const w = 600;
    c.width = w;
    c.height = Math.round((w * scene.page.h) / scene.page.w);
    drawScene(c.getContext('2d'), scene, w / scene.page.w);
    const fig = document.createElement('figure');
    const cap = document.createElement('figcaption');
    cap.textContent = label + (scene.overflow ? ' (DÉPASSE)' : '');
    fig.append(c, cap);
    grid.append(fig);
  }
  document.body.dataset.ready = '1';
}

main();
