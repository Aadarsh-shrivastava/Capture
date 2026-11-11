/**
 * Mascot characters. Every sheet is a grid with the SAME 16 poses in the SAME order (row by row):
 *   neutral, thinking, wink, reading · surprised, bored, smug, sheepish ·
 *   phone, happy, sleeping, cool · curious, pointing, annoyed, away
 * Add a character (cat, robot…) = drop a sheet in assets/images with that pose order + one entry below.
 */
export const POSES = [
  'neutral', 'thinking', 'wink', 'reading',
  'surprised', 'bored', 'smug', 'sheepish',
  'phone', 'happy', 'sleeping', 'cool',
  'curious', 'pointing', 'annoyed', 'away',
] as const;

export type MascotPose = (typeof POSES)[number];

export type Character = {
  label: string;
  /** require('…png') */
  sheet: number;
  /** Sheet size in px. */
  width: number;
  height: number;
  cols: number;
  rows: number;
  /** Where the face sits inside the neutral cell (0–1), for avatar crops. */
  face: {x: number; y: number};
  /** Fraction trimmed off each side of a cell, to hide bits of neighbouring poses. */
  inset?: number;
  /** Height the grid actually covers, if the sheet has empty space below it. */
  gridHeight?: number;
};

export const CHARACTERS = {
  male: {
    label: 'Him',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sheet: require('../../assets/images/mascot-male.png'),
    width: 1280,
    height: 1229,
    cols: 4,
    rows: 4,
    face: {x: 0.6, y: 0.48},
    inset: 0.06,
    gridHeight: 1160,
  },
  female: {
    label: 'Her',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sheet: require('../../assets/images/mascot-female.png'),
    width: 1218,
    height: 1291,
    cols: 4,
    rows: 4,
    face: {x: 0.6, y: 0.48},
    inset: 0.06,
  },
} satisfies Record<string, Character>;

export type CharacterKey = keyof typeof CHARACTERS;

/** Crop rectangle (sheet px) of a pose for a character. */
export function frameOf(character: Character, pose: MascotPose) {
  const index = POSES.indexOf(pose);
  const w = character.width / character.cols;
  const h = (character.gridHeight ?? character.height) / character.rows;
  const trim = w * (character.inset ?? 0);
  return {x: (index % character.cols) * w + trim, y: Math.floor(index / character.cols) * h, w: w - trim * 2, h};
}
