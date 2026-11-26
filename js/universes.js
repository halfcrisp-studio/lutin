// Universes are plain configuration. Picking one sets everything at once
// (font, colors, frame, decorations); every setting can be changed afterwards.
// They work for both the elves' notes and the invitations.
// Adding one (Halloween, Petite Souris…) means adding an entry here and its label.
export const UNIVERSE_GROUPS = ['noel', 'fete', 'aventure', 'heros'];

const u = (id, group, palette, font, decorSet, placement, frame, frameStyle) => ({
  id, group, palette, font, decor: true, decorSet, placement, frame, frameStyle, frameColor: 'auto',
});

export const UNIVERSES = [
  u('lutins', 'noel', 'sapin', 'titan', 'lutins', 'corners', false, 'candy'),
  u('grognon', 'noel', 'grognon', 'freckle', 'grognon', 'corners', true, 'simple'),

  u('anniversaire', 'fete', 'arc', 'chewy', 'anniversaire', 'corners', true, 'festive'),
  u('pyjama', 'fete', 'pyjama', 'chewy', 'pyjama', 'corners', true, 'dots'),
  u('deguisee', 'fete', 'fete', 'bungee', 'deguisee', 'scatter', false, 'simple'),
  u('boum', 'fete', 'boum', 'righteous', 'boum', 'edges', true, 'simple'),

  u('pirates', 'aventure', 'pirates', 'pirata', 'pirates', 'corners', true, 'dots'),
  u('dino', 'aventure', 'dino', 'sniglet', 'dino', 'edges', false, 'simple'),
  u('espace', 'aventure', 'espace', 'orbitron', 'espace', 'scatter', false, 'simple'),
  u('sirenes', 'aventure', 'sirenes', 'pacifico', 'sirenes', 'corners', true, 'festive'),
  u('chevaliers', 'aventure', 'chevaliers', 'almendra', 'chevaliers', 'corners', true, 'double'),
  u('police', 'aventure', 'police', 'elite', 'police', 'corners', true, 'candy'),

  u('magie', 'heros', 'magie', 'hennypenny', 'magie', 'corners', true, 'double'),
  u('princesse', 'heros', 'princesse', 'yeseva', 'conte', 'corners', true, 'festive'),
  u('araignee', 'heros', 'araignee', 'bangers', 'toile', 'corners', true, 'simple'),
  u('idoles', 'heros', 'idoles', 'bungee', 'musique', 'scatter', false, 'simple'),
  u('chiots', 'heros', 'chiots', 'titan', 'pattes', 'edges', true, 'dots'),
];

export function getUniverse(id) {
  return UNIVERSES.find((x) => x.id === id) || UNIVERSES[0];
}

/** Everything a universe sets when it is picked. */
export function universePatch(id) {
  const x = getUniverse(id);
  return {
    universe: x.id,
    paletteId: x.palette,
    fontId: x.font,
    weight: null,
    decor: x.decor,
    decorSet: x.decorSet,
    decorPlacement: x.placement,
    frame: x.frame,
    frameStyle: x.frameStyle,
    frameColor: x.frameColor,
  };
}
