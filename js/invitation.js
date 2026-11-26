// Invitations (birthday, pyjama party, costume party, disco): fields -> text blocks
// for the layout engine. The fields (child's first name, age, date, address…) are
// never saved: they live in memory only and start from an example on each visit.
import { t } from './i18n.js';

export const INVITE_FIELDS = ['title', 'name', 'age', 'message', 'date', 'time', 'place', 'rsvp'];
// Each kind of party has the universe of the same id (style suggested when picked).
export const OCCASIONS = ['anniversaire', 'pyjama', 'deguisee', 'boum'];

const occasionKey = (key, occasion) => (occasion && occasion !== 'anniversaire' ? `${key}.${occasion}` : key);

export function exampleInvitation(occasion = 'anniversaire') {
  const out = {};
  for (const k of INVITE_FIELDS) {
    const specific = k === 'title' || k === 'message';
    out[k] = t(specific ? occasionKey(`invite.example.${k}`, occasion) : `invite.example.${k}`);
  }
  return out;
}

/** "Camille fête ses 7 ans !", with the special cases (no age, 1 year, no name). */
export function ageLine(name, age, occasion = 'anniversaire') {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  const a = parseInt(String(age || '').trim(), 10);
  const hasAge = Number.isFinite(a) && a > 0;
  if (!n && !hasAge) return '';
  if (!n) return t('invite.line.ageOnly', { age: a });
  if (!hasAge) return t(occasionKey('invite.line.nameOnly', occasion), { name: n });
  if (a === 1) return t('invite.line.first', { name: n });
  return t('invite.line.nameAge', { name: n, age: a });
}

// French typography: a number stays with the word after it ("7 ans", "12 décembre",
// "14 h") and phone number groups stay together ("06 00 00 00 00").
const NBSP = ' ';
const keepNumbersTogether = (s) => s.replace(/(\d)[ \t]+(?=[\p{L}\d])/gu, `$1${NBSP}`);
const clean = (v) => keepNumbersTogether(String(v || '').trim());

/** Text blocks of the card: title, who and how old, message, details with icons, reply. */
export function invitationBlocks(inv, prepare = (s) => s, occasion = 'anniversaire') {
  const blocks = [];
  const add = (text, scale, extra = {}) => {
    if (!text) return;
    blocks.push({ paragraphs: prepare(text).split(/\r?\n/), scale, align: 'center', ...extra });
  };
  add(clean(inv.title), 0.8);
  add(keepNumbersTogether(ageLine(inv.name, inv.age, occasion)), 1.25, { gapBefore: 0.2 });
  add(clean(inv.message), 0.75, { gapBefore: 0.3 });
  let firstDetail = true;
  for (const [key, icon] of [['date', 'calendar'], ['time', 'clock'], ['place', 'map-pin']]) {
    const v = clean(inv[key]);
    if (!v) continue;
    add(v, 0.68, { icon, gapBefore: firstDetail ? 0.55 : 0.05 });
    firstDetail = false;
  }
  add(clean(inv.rsvp), 0.55, { icon: 'phone', gapBefore: 0.5 });
  return blocks;
}
