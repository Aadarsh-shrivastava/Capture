import {useEffect, useState} from 'react';

import {useDataVersionStore} from '@/store/dataVersionStore';

import {rank, weightOf, type Memo} from './schedule';
import {loadMemos} from './service';

// Last ranking per count, so a remount (e.g. switching back to today) shows cards at once instead of popping in.
const lastRanked = new Map<number, Memo[]>();

/** The Come back items due now, best first (re-ranked after any save). */
export function useSuggestions(count = 3): Memo[] {
  const version = useDataVersionStore(state => state.version);
  const [memos, setMemos] = useState<Memo[]>(() => lastRanked.get(count) ?? []);
  useEffect(() => {
    loadMemos()
      .then(all => {
        const ranked = rank(all, Date.now(), count);
        lastRanked.set(count, ranked);
        setMemos(ranked);
      })
      .catch(() => {});
  }, [version, count]);
  return memos;
}

/** Items set to come back (not turned off) — for the "comes back" label on Thoughts. */
export function useComingBackIds(): Set<number> {
  const version = useDataVersionStore(state => state.version);
  const [ids, setIds] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    loadMemos()
      .then(all => setIds(new Set(all.filter(m => weightOf(m) > 0).map(m => m.itemId))))
      .catch(() => {});
  }, [version]);
  return ids;
}
