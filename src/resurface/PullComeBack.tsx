import moment from 'moment';
import {useRouter} from 'expo-router';
import {useEffect, useState, type ReactNode} from 'react';

import {SwipeCard} from '@/ui/components/FocusComponents';

import {rank, weightOf, type Memo} from './schedule';
import {act, loadMemos} from './service';

/**
 * Pulled down on Focus: one old idea or note to look back on — a due come-back if there is one, else any item set to
 * come back. Swiping either way only puts it away (nothing is scheduled, done or hidden); tap opens it.
 * `fallback`: shown when nothing is set to come back yet.
 */
export function PullComeBack({onDismiss, fallback = null}: {onDismiss: () => void; fallback?: ReactNode}) {
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null | undefined>(undefined);

  useEffect(() => {
    loadMemos()
      .then(all => {
        const due = rank(all, Date.now(), 20);
        const pool = due.length > 0 ? due : all.filter(m => weightOf(m) > 0);
        setMemo(pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null);
      })
      .catch(() => setMemo(null));
  }, []);

  if (memo === undefined) return null;
  if (memo === null) return <>{fallback}</>;

  const putAway = {label: 'PUT AWAY', icon: 'close' as const, onSwipe: onDismiss};
  return (
    <SwipeCard
      eyebrow="COME BACK"
      badge={memo.typeName}
      title={memo.title}
      content={memo.content && memo.content !== memo.title ? memo.content : null}
      meta={`Saved ${moment(memo.createdAt).fromNow()}`}
      mascot={memo.mascot}
      fallbackPose="thinking"
      onPress={() => {
        act(memo, 'open').catch(() => {});
        router.push(`/item/${memo.itemId}`);
      }}
      right={putAway}
      left={putAway}
      hint="swipe to put away"
    />
  );
}
