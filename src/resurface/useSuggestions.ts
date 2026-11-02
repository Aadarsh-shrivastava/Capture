import {useEffect, useState} from 'react';

import {useDataVersionStore} from '@/store/dataVersionStore';

import {rank, type Memo} from './schedule';
import {loadMemos} from './service';

/** The Come back items due now, best first (re-ranked after any save). */
export function useSuggestions(count = 3): Memo[] {
  const version = useDataVersionStore(state => state.version);
  const [memos, setMemos] = useState<Memo[]>([]);
  useEffect(() => {
    loadMemos()
      .then(all => setMemos(rank(all, Date.now(), count)))
      .catch(() => {});
  }, [version, count]);
  return memos;
}
