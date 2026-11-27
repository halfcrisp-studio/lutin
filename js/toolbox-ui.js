// "Elf toolbox" panel: idea of the night, SOS, key letters, calendar reminders.
import { t } from './i18n.js';
import { field, h, onSync, section, segmented, showIf, toggle } from './dom.js';
import { state, update } from './state.js';
import {
  EXCUSES,
  LETTERS,
  MATERIALS,
  SOS_IDEAS,
  TOOL_TABS,
  currentIdea,
  filteredIdeas,
  randomIdeaId,
  remindersIcs,
  toolItem,
  toolMessage,
} from './toolbox.js';
import { download } from './sheet.js';

const tab = (name) => () => state.toolsTab === name;

/** Switch to the note editor with the current message, to change a word or two. */
function editButton() {
  return h('button', { type: 'button', class: 'btn', onclick: () => update({ mode: 'note', text: toolMessage(state) }) }, t('tools.edit'));
}

function badges(idea) {
  return h(
    'div',
    { class: 'idea-badges' },
    h('span', { class: 'badge' }, t('tools.badge.time', { min: idea.time })),
    h('span', { class: 'badge' }, t(`tools.mess.${idea.mess}`)),
    h('span', { class: 'badge' }, t(`tools.mat.${idea.mat}`)),
  );
}

/** A list of items (ideas, excuses, letters) as buttons; the selected one is pressed. */
function pickList(getItems, getSelected, select) {
  const list = h('div', { class: 'pick-list' });
  let lastKey = '';
  onSync(() => {
    const items = getItems();
    const selected = getSelected();
    const key = `${items.map((i) => i.id).join(',')}|${selected}|${state.doneIdeas.join(',')}`;
    if (key === lastKey) return;
    lastKey = key;
    list.replaceChildren(
      ...items.map((i) =>
        h(
          'button',
          { type: 'button', class: 'pick-item', 'aria-pressed': String(i.id === selected), onclick: () => select(i.id) },
          state.doneIdeas.includes(i.id) ? `✓ ${i.title}` : i.title,
        ),
      ),
    );
  });
  return list;
}

function ideaPanel() {
  const filters = h(
    'div',
    { class: 'idea-filters' },
    field(
      'tools.filter.time',
      segmented(
        ['all', '2', '10', '30'].map((v) => ({ value: v, label: t(`tools.time.${v}`) })),
        () => state.ideaFilters.time,
        (v) => update({ ideaFilters: { ...state.ideaFilters, time: v } }),
      ),
    ),
    field(
      'tools.filter.mess',
      segmented(
        ['all', '0', '1'].map((v) => ({ value: v, label: t(`tools.messFilter.${v}`) })),
        () => state.ideaFilters.mess,
        (v) => update({ ideaFilters: { ...state.ideaFilters, mess: v } }),
      ),
    ),
    field(
      'tools.filter.mat',
      segmented(
        ['all', ...MATERIALS].map((v) => ({ value: v, label: v === 'all' ? t('tools.mat.all') : t(`tools.mat.${v}`) })),
        () => state.ideaFilters.mat,
        (v) => update({ ideaFilters: { ...state.ideaFilters, mat: v } }),
      ),
    ),
    toggle('tools.hideDone', () => state.hideDone, (v) => update({ hideDone: v })),
  );

  const card = h('div', { class: 'idea-card' });
  const empty = h('p', { class: 'hint' }, t('tools.noIdea'));
  const count = h('p', { class: 'hint' });
  const doneBtn = h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => toggleDone() });
  const toggleDone = () => {
    const idea = currentIdea(state);
    if (!idea) return;
    const done = state.doneIdeas.includes(idea.id) ? state.doneIdeas.filter((x) => x !== idea.id) : [...state.doneIdeas, idea.id];
    update({ doneIdeas: done });
  };
  const actions = h(
    'div',
    { class: 'row wrap' },
    h('button', { type: 'button', class: 'btn', onclick: () => update({ ideaId: randomIdeaId(state) }) }, `🎲 ${t('tools.another')}`),
    doneBtn,
    editButton(),
  );
  let lastId = null;
  onSync(() => {
    const idea = currentIdea(state);
    const n = filteredIdeas(state).length;
    count.textContent = t('tools.count', { n });
    empty.hidden = !!idea;
    card.hidden = !idea;
    actions.hidden = !idea;
    if (!idea) return;
    const done = state.doneIdeas.includes(idea.id);
    doneBtn.textContent = done ? `✓ ${t('tools.done')}` : t('tools.markDone');
    doneBtn.setAttribute('aria-pressed', String(done));
    if (idea.id === lastId) return;
    lastId = idea.id;
    card.replaceChildren(h('h3', { class: 'idea-title' }, idea.title), badges(idea), h('p', { class: 'idea-how' }, idea.how));
  });

  return showIf(
    h(
      'div',
      { class: 'tool-panel' },
      filters,
      count,
      card,
      empty,
      actions,
      h(
        'details',
        { class: 'sub-panel' },
        h('summary', {}, t('tools.allIdeas')),
        pickList(() => filteredIdeas(state), () => currentIdea(state)?.id, (id) => update({ ideaId: id })),
      ),
    ),
    tab('idea'),
  );
}

function sosPanel() {
  const how = h('p', { class: 'idea-how' });
  onSync(() => {
    const item = toolItem(state);
    how.hidden = !(state.toolsTab === 'sos' && item.how);
    how.textContent = item.how || '';
  });
  return showIf(
    h(
      'div',
      { class: 'tool-panel' },
      h('p', { class: 'hint' }, t('tools.sos.intro')),
      field('tools.sos.quick', pickList(() => SOS_IDEAS, () => state.sosId, (id) => update({ sosId: id }))),
      how,
      field('tools.sos.excuses', pickList(() => EXCUSES, () => state.sosId, (id) => update({ sosId: id }))),
      h('div', { class: 'row wrap' }, editButton()),
    ),
    tab('sos'),
  );
}

function lettersPanel() {
  return showIf(
    h(
      'div',
      { class: 'tool-panel' },
      h('p', { class: 'hint' }, t('tools.letters.intro')),
      pickList(() => LETTERS, () => state.letterId, (id) => update({ letterId: id })),
      h('div', { class: 'row wrap' }, editButton()),
    ),
    tab('letters'),
  );
}

function remindersPanel() {
  const result = h('p', { class: 'hint' });
  const add = () => {
    const url = `${location.origin}${location.pathname}`;
    const ics = remindersIcs({ hour: state.reminderHour, title: t('tools.reminders.title'), description: t('tools.reminders.description'), url });
    download(new Blob([ics.text], { type: 'text/calendar' }), 'rappels-lutin.ics');
    result.textContent = t('tools.reminders.done', { count: ics.count });
  };
  return showIf(
    h(
      'div',
      { class: 'tool-panel' },
      h('p', {}, t('tools.reminders.intro')),
      field(
        'tools.reminders.hour',
        segmented(
          [20, 21, 22].map((v) => ({ value: v, label: `${v} h` })),
          () => state.reminderHour,
          (v) => update({ reminderHour: v }),
        ),
      ),
      h('div', { class: 'row wrap' }, h('button', { type: 'button', class: 'btn btn-strong', onclick: add }, t('tools.reminders.add'))),
      result,
      h('p', { class: 'hint' }, t('tools.reminders.hint')),
    ),
    tab('reminders'),
  );
}

export function toolboxSection() {
  return section(
    'tools',
    'section.tools',
    true,
    segmented(
      TOOL_TABS.map((v) => ({ value: v, label: t(`tools.tab.${v}`) })),
      () => state.toolsTab,
      (v) => update({ toolsTab: v }),
    ),
    showIf(
      field(
        'tools.recipients',
        segmented(
          [
            { value: 1, label: t('tools.recipients.one') },
            { value: 2, label: t('tools.recipients.many') },
          ],
          () => state.recipients,
          (v) => update({ recipients: v }),
        ),
      ),
      () => state.toolsTab !== 'reminders',
    ),
    ideaPanel(),
    sosPanel(),
    lettersPanel(),
    remindersPanel(),
  );
}
