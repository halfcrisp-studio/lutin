// Day / night look: follows the device setting; the header button forces one
// or the other (remembered in the browser). The saved choice is applied before
// the first paint by a small inline script in index.html.
import { saveJSON } from './storage.js';
import { t } from './i18n.js';

const root = document.documentElement;
const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

// Lucide "sun" and "moon" (ISC License)
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

function systemTheme() {
  return systemDark && systemDark.matches ? 'dark' : 'light';
}

export function currentTheme() {
  return root.dataset.theme || systemTheme();
}

export function initThemeToggle(button) {
  const sync = () => {
    const dark = currentTheme() === 'dark';
    button.innerHTML = dark ? SUN : MOON;
    const label = t(dark ? 'theme.toLight' : 'theme.toDark');
    button.setAttribute('aria-label', label);
    button.title = label;
  };
  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (next === systemTheme()) {
      delete root.dataset.theme; // back to following the device
      saveJSON('theme', null);
    } else {
      root.dataset.theme = next;
      saveJSON('theme', next);
    }
    sync();
  });
  if (systemDark && systemDark.addEventListener) systemDark.addEventListener('change', sync);
  sync();
}
