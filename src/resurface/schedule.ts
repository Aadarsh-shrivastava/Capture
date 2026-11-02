/**
 * "Come back" scheduling for Memorable items — pure, no DB or UI.
 * weight: 3 often · 2 sometimes · 1 rarely · 0 off. null = auto (decided by kind).
 * Each Open grows the gap (spaced repetition), so things you keep visiting fade out slowly.
 */

export type ResurfaceAction = 'open' | 'later' | 'doIt' | 'done';

export type Memo = {
  itemId: number;
  typeName: string;
  title: string;
  content: string | null;
  createdAt: string;
  hasLink: boolean;
  weight: number | null;
  reviewAt: string | null;
  intervalDays: number | null;
  timesShown: number;
};

const DAY = 86400000;
const FIRST_GAP: Record<number, number> = {1: 7, 2: 3, 3: 1};
const GROWTH: Record<number, number> = {1: 4, 2: 2.5, 3: 1.5};

/** Auto weight: open questions often, ideas and links sometimes, notes rarely, journal off. */
export function autoWeight(m: Pick<Memo, 'typeName' | 'title' | 'content' | 'hasLink'>): number {
  if (m.typeName === 'Journal') return 0;
  if (/\?/.test(`${m.title} ${m.content ?? ''}`)) return 3;
  if (m.typeName === 'Idea' || m.hasLink) return 2;
  return 1;
}

export const weightOf = (m: Memo) => m.weight ?? autoWeight(m);
const gapOf = (m: Memo, w: number) => m.intervalDays ?? FIRST_GAP[w];

/** When it's next due: its scheduled date, or creation + the first gap. */
export function dueTime(m: Memo): number {
  const w = weightOf(m);
  return m.reviewAt ? new Date(m.reviewAt).getTime() : new Date(m.createdAt).getTime() + (FIRST_GAP[w] ?? 0) * DAY;
}

/** Due items, best first: weight × how overdue relative to its gap. At most one per type, up to `count`. */
export function rank(memos: Memo[], now = Date.now(), count = 3): Memo[] {
  const scored = memos
    .map(m => ({m, w: weightOf(m)}))
    .filter(({m, w}) => w > 0 && dueTime(m) <= now)
    .map(({m, w}) => ({m, score: w * (1 + (now - dueTime(m)) / DAY / gapOf(m, w))}))
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const picked: Memo[] = [];
  for (const {m} of scored) {
    if (seen.has(m.typeName)) continue;
    seen.add(m.typeName);
    picked.push(m);
    if (picked.length === count) break;
  }
  return picked;
}

/** New Memorable fields after the user acts on a suggestion. */
export function nextState(m: Memo, action: ResurfaceAction, now = Date.now()): Record<string, string> {
  const w = weightOf(m);
  const base = {weight: m.weight == null ? '' : String(m.weight), last_reviewed_at: new Date(now).toISOString(), times_shown: String(m.timesShown + 1)};
  if (action === 'doIt' || action === 'done' || w === 0) return {...base, weight: '0', review_at: '', interval_days: ''};
  const gap = action === 'open' ? gapOf(m, w) * GROWTH[w] : gapOf(m, w);
  const wait = action === 'open' ? gap : 1;
  return {...base, review_at: new Date(now + wait * DAY).toISOString(), interval_days: String(Math.round(gap * 10) / 10)};
}
