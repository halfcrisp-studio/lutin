// Key logic checks, run in a browser: open dev/tests.html (the page prints ALL OK or the failures).
import { layoutText, tokenize } from '../js/layout.js';
import { formatNames, signatureUnits } from '../js/signature.js';
import { PALETTES, pastelLine } from '../js/palettes.js';
import { colorSequence, contrastWithWhite, ensureContrast } from '../js/color.js';
import { renderTemplate } from '../js/templates.js';
import { EXCUSES, IDEAS, LETTERS } from '../js/toolbox-fr.js';
import { remindersIcs } from '../js/toolbox.js';

const failures = [];
const check = (name, ok) => {
  if (!ok) failures.push(name);
};

// Fake font: every character is 0.6 em wide.
const measure = (s) => [...s].length * 600;
const metrics = { ascent: 0.8, descent: 0.2 };
const base = { signature: [], measure, metrics, lineHeight: 1.2, align: 'center', fixedSize: null, minSize: 10, maxSize: 400 };

// Words are never split: every placed token is a whole input token.
const text = 'Coucou les enfants ! Cette nuit, nous avons préparé une petite surprise… Saurez-vous la trouver ?';
const tokens = tokenize(text);
check('punctuation glued to its word', tokens.includes('enfants !') && tokens.includes('trouver ?'));
for (const w of [300, 600, 1200, 2400]) {
  const r = layoutText({ ...base, paragraphs: [text], box: { x: 0, y: 0, w, h: 3000 } });
  const placed = r.lines.flatMap((l) => l.tokens.map((t) => t.text));
  check(`no split word (width ${w})`, placed.join('|') === tokens.join('|'));
  check(`fits the box (width ${w})`, r.fits && r.height <= 3000 + 0.01);
  check(`lines inside the box (width ${w})`, r.lines.every((l) => l.width <= w + 0.01));
}

// A word longer than the line makes the text smaller instead of being cut.
const long = layoutText({ ...base, paragraphs: ['Abracadabrantesque'], box: { x: 0, y: 0, w: 500, h: 3000 } });
check('long word shrinks the size', long.fits && long.lines.length === 1 && long.lines[0].width <= 500.01);

// Signature.
check('one name', formatNames(['Biscotte']) === 'Biscotte');
check('two names', formatNames(['Farceur', 'Biscotte']) === 'Farceur et Biscotte');
check('three names', formatNames(['A', 'B', 'C']) === 'A, B et C');
check('signature units', signatureUnits(['Lutin Farceur', 'Biscotte']).join('|') === 'Signé Lutin Farceur|et Biscotte');

// Colors.
// Pastel fills are light on purpose: their border (pastelLine) must reach the contrast.
for (const p of PALETTES) for (const c of p.colors || []) check(`contrast ${p.id} ${c}`, contrastWithWhite(p.pastel ? pastelLine(c) : c) >= 3);
check('light color darkened', contrastWithWhite(ensureContrast('#ffee58')) >= 3);
const next = colorSequence(['#a00000', '#00a000', '#0000a0'], 42);
let prev = '';
let repeat = false;
for (let i = 0; i < 500; i++) {
  const c = next();
  if (c === prev) repeat = true;
  prev = c;
}
check('no color twice in a row', !repeat);

// Templates (future message bank).
check('template plural', renderTemplate("{s:j'ai|nous avons} un cadeau pour {d:toi|vous}", { signers: 2, recipients: 1 }) === 'nous avons un cadeau pour toi');

// Toolbox texts: every form (1 or several elves x 1 or several children) renders cleanly.
for (const item of [...IDEAS, ...EXCUSES, ...LETTERS]) {
  for (const signers of [1, 2]) for (const recipients of [1, 2]) {
    const text = renderTemplate(item.msg, { signers, recipients });
    if (/[{}|]/.test(text)) failures.push(`template ${item.id} s${signers} d${recipients}: ${text}`);
  }
}
const ics = remindersIcs({ hour: 21, now: new Date(2026, 10, 27), title: 'T', description: 'D' });
check('reminders from 1 December, 24 days', ics.count === 24 && ics.text.includes('DTSTART:20261201T210000') && ics.text.includes('COUNT=24'));
check('reminders from today in December', remindersIcs({ hour: 20, now: new Date(2026, 11, 10), title: 'T', description: 'D' }).count === 15);

const out = document.getElementById('out');
out.textContent = failures.length ? `FAIL\n${failures.join('\n')}` : 'ALL OK';
if (failures.length) out.className = 'fail';
