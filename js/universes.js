// Universes are plain configuration. Picking one sets everything at once
// (font, colors, frame, decorations); every setting can be changed afterwards.
// Adding one (Halloween, Petite Souris…) means adding an entry here and its label.
export const UNIVERSES = [
  {
    id: 'lutins',
    palette: 'sapin', font: 'luckiest',
    decor: true, decorSet: 'sapins', placement: 'corners',
    frame: false, frameStyle: 'candy', frameColor: 'auto',
  },
  {
    id: 'grognon',
    palette: 'grognon', font: 'freckle',
    decor: true, decorSet: 'grognon', placement: 'corners',
    frame: true, frameStyle: 'simple', frameColor: 'auto',
  },
  {
    id: 'magie',
    palette: 'magie', font: 'hennypenny',
    decor: true, decorSet: 'magie', placement: 'corners',
    frame: true, frameStyle: 'double', frameColor: 'auto',
  },
  {
    id: 'idoles',
    palette: 'idoles', font: 'bungee',
    decor: true, decorSet: 'musique', placement: 'scatter',
    frame: false, frameStyle: 'simple', frameColor: 'auto',
  },
  {
    id: 'chiots',
    palette: 'chiots', font: 'titan',
    decor: true, decorSet: 'pattes', placement: 'edges',
    frame: true, frameStyle: 'dots', frameColor: 'auto',
  },
  {
    id: 'araignee',
    palette: 'araignee', font: 'bangers',
    decor: true, decorSet: 'toile', placement: 'corners',
    frame: true, frameStyle: 'simple', frameColor: 'auto',
  },
];

export function getUniverse(id) {
  return UNIVERSES.find((u) => u.id === id) || UNIVERSES[0];
}

/** Everything a universe sets when it is picked. */
export function universePatch(id) {
  const u = getUniverse(id);
  return {
    universe: u.id,
    paletteId: u.palette,
    fontId: u.font,
    weight: null,
    decor: u.decor,
    decorSet: u.decorSet,
    decorPlacement: u.placement,
    frame: u.frame,
    frameStyle: u.frameStyle,
    frameColor: u.frameColor,
  };
}
