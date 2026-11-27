// Elf toolbox logic: idea of the night (filters, random pick, done ideas),
// SOS (zero-prep ideas + excuses), key letters, calendar reminders.
import { EXCUSES, IDEAS, LETTERS, MATERIALS } from './toolbox-fr.js';
import { renderTemplate } from './templates.js';

export { EXCUSES, IDEAS, LETTERS, MATERIALS };
export const TOOL_TABS = ['idea', 'sos', 'letters', 'reminders'];
export const SOS_IDEAS = IDEAS.filter((i) => i.sos);

/** Ideas matching the filters ("up to N minutes", "up to this much mess", material). */
export function filteredIdeas(state) {
  const f = state.ideaFilters;
  return IDEAS.filter(
    (i) =>
      (f.time === 'all' || i.time <= Number(f.time)) &&
      (f.mess === 'all' || i.mess <= Number(f.mess)) &&
      (f.mat === 'all' || i.mat === f.mat) &&
      (!state.hideDone || !state.doneIdeas.includes(i.id)),
  );
}

export function currentIdea(state) {
  const list = filteredIdeas(state);
  return list.find((i) => i.id === state.ideaId) || list[0] || null;
}

/** Another idea among the filtered ones, never the same as the current one. */
export function randomIdeaId(state, rng = Math.random) {
  const list = filteredIdeas(state);
  const others = list.filter((i) => i.id !== state.ideaId);
  const pool = others.length ? others : list;
  return pool.length ? pool[Math.floor(rng() * pool.length)].id : null;
}

export function sosItem(state) {
  return [...SOS_IDEAS, ...EXCUSES].find((i) => i.id === state.sosId) || EXCUSES[0];
}

export function letterItem(state) {
  return LETTERS.find((l) => l.id === state.letterId) || LETTERS[0];
}

/** The item whose note is shown in the preview for the current tab. */
export function toolItem(state) {
  if (state.toolsTab === 'sos') return sosItem(state);
  if (state.toolsTab === 'letters' || state.toolsTab === 'reminders') return letterItem(state);
  return currentIdea(state) || letterItem(state);
}

/** The note text, with the right forms for the number of elves and children. */
export function toolMessage(state, item = toolItem(state)) {
  if (!item) return '';
  return renderTemplate(item.msg, { signers: Math.max(1, state.signers.length), recipients: state.recipients });
}

// ---- Calendar reminders (.ics, opened by the phone's calendar; nothing is sent) ----

const pad = (n) => String(n).padStart(2, '0');
const escapeText = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** One daily reminder from 1 December (or today) to 24 December, at `hour`. */
export function remindersIcs({ hour = 21, now = new Date(), title, description, url }) {
  const year = now.getMonth() === 11 && now.getDate() > 24 ? now.getFullYear() + 1 : now.getFullYear();
  let start = new Date(year, 11, 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today > start) start = today;
  const count = 24 - start.getDate() + 1;
  const day = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}`;
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lutin//Rappels//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:lutin-rappel-${year}-${Math.random().toString(36).slice(2, 10)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${day}T${pad(hour)}0000`,
    'DURATION:PT10M',
    `RRULE:FREQ=DAILY;COUNT=${count}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(`${description}${url ? `\n${url}` : ''}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return { text: `${lines.join('\r\n')}\r\n`, count, start };
}
