/** Sprite sheet assets/images/mascot.png is 1536×1024: two rows of 4 busts, then 8 chibi poses. */
export const SHEET = {width: 1536, height: 1024};

type Frame = {x: number; y: number; w: number; h: number};

const bust = (col: number, row: number): Frame => ({x: col * 384, y: row * 372, w: 384, h: 372});
// Chibi poses aren't evenly spaced; frames are centered on each figure (measured from the sheet).
const chibi = (centerX: number, w = 176): Frame => ({x: Math.max(0, Math.min(SHEET.width - w, centerX - w / 2)), y: 760, w, h: 256});

export const MASCOT_FRAMES = {
  neutral: bust(0, 0),
  thinking: bust(1, 0),
  wink: bust(2, 0),
  reading: bust(3, 0),
  surprised: bust(0, 1),
  bored: bust(1, 1),
  smug: bust(2, 1),
  sheepish: bust(3, 1),
  chibiReading: chibi(95),
  chibiThinking: chibi(280),
  chibiIdea: chibi(492, 216),
  chibiHappy: chibi(670),
  chibiSleeping: chibi(875),
  chibiPeek: chibi(1060),
  chibiCool: chibi(1240),
  chibiAway: chibi(1425),
} satisfies Record<string, Frame>;

export type MascotPose = keyof typeof MASCOT_FRAMES;
