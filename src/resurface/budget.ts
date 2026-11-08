/**
 * How often come-backs may appear at all — so the app doesn't always have something popping up.
 * Pure: the store (budgetStore.ts) persists the state.
 */

/** Hiding the card (left swipe) keeps all come-backs away this long. */
export const HIDE_HOURS = 4;
/** At most this many different come-backs per day. */
export const DAILY_LIMIT = 3;

export type Budget = {
  /** Epoch ms until which come-backs stay hidden. */
  hiddenUntil: number;
  /** YYYY-MM-DD the `seen` list is for. */
  day: string;
  /** Items already shown today. */
  seen: number[];
};

const dayOf = (now: number) => new Date(now).toLocaleDateString('en-CA');

/** May this come-back show now? Items already seen today keep showing; new ones need room in today's limit. */
export function canShow(b: Budget, itemId: number, now = Date.now()): boolean {
  if (now < b.hiddenUntil) return false;
  const seen = b.day === dayOf(now) ? b.seen : [];
  return seen.includes(itemId) || seen.length < DAILY_LIMIT;
}

/** Record that an item was shown (new day = fresh list). */
export function markSeen(b: Budget, itemId: number, now = Date.now()): Budget {
  const today = dayOf(now);
  const seen = b.day === today ? b.seen : [];
  return seen.includes(itemId) ? b : {...b, day: today, seen: [...seen, itemId]};
}

export function hide(b: Budget, now = Date.now()): Budget {
  return {...b, hiddenUntil: now + HIDE_HOURS * 3600000};
}
