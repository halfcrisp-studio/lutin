// Universes are plain configuration: a palette, a font, a decor and a frame.
// Adding one (Halloween, Petite Souris…) means adding an entry here and its label.
export const UNIVERSES = [
  { id: 'lutins', palette: 'sapin', font: 'luckiest', decorSet: 'sapins', placement: 'corners', frameStyle: 'festive' },
  { id: 'grognon', palette: 'grognon', font: 'chewy', decorSet: 'grognon', placement: 'scatter', frameStyle: 'simple' },
  { id: 'magie', palette: 'magie', font: 'cinzel', decorSet: 'magie', placement: 'corners', frameStyle: 'double' },
  { id: 'idoles', palette: 'idoles', font: 'baloo', decorSet: 'musique', placement: 'scatter', frameStyle: 'simple' },
  { id: 'chiots', palette: 'chiots', font: 'titan', decorSet: 'pattes', placement: 'edges', frameStyle: 'dots' },
  { id: 'araignee', palette: 'araignee', font: 'bangers', decorSet: 'toile', placement: 'corners', frameStyle: 'simple' },
];

export function getUniverse(id) {
  return UNIVERSES.find((u) => u.id === id) || UNIVERSES[0];
}

/** State changes applied when a universe is picked (on/off switches are kept). */
export function universePatch(id) {
  const u = getUniverse(id);
  return {
    universe: u.id,
    paletteId: u.palette,
    fontId: u.font,
    weight: null,
    decorSet: u.decorSet,
    decorPlacement: u.placement,
    frameStyle: u.frameStyle,
  };
}
