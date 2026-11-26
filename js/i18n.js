import fr from './strings-fr.js';

const dictionaries = { fr };
let current = fr;
export let locale = 'fr';

export function setLocale(code) {
  if (dictionaries[code]) {
    current = dictionaries[code];
    locale = code;
  }
}

/** Translate a key, replacing {param} placeholders. Missing keys return the key. */
export function t(key, params) {
  let s = current[key] ?? fr[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}
