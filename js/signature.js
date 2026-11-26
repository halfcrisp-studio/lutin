// Signature line: "Signé A", "Signé A et B", "Signé A, B et C".

const NBSP = ' ';

export function cleanNames(names) {
  return (names || []).map((n) => String(n).replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Names as unbreakable units for the layout engine: a name is never split
 * across lines, commas stick to the name before, and the conjunction stays
 * with the last name ("et Biscotte").
 */
export function nameUnits(names, conjunction = 'et') {
  const list = cleanNames(names);
  return list.map((name, i) => {
    if (i < list.length - 2) return `${name},`;
    if (i === list.length - 1 && list.length > 1) return `${conjunction}${NBSP}${name}`;
    return name;
  });
}

/** "A", "A et B", "A, B et C" (plain spaces, for display). */
export function formatNames(names, conjunction = 'et') {
  return nameUnits(names, conjunction).join(' ').split(NBSP).join(' ');
}

/** Signature units, the prefix glued to the first name ("Signé A"), or [] without names. */
export function signatureUnits(names, prefix = 'Signé', conjunction = 'et') {
  const units = nameUnits(names, conjunction);
  if (!units.length) return [];
  units[0] = `${prefix}${NBSP}${units[0]}`;
  return units;
}
