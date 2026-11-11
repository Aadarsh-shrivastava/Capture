import {useRouter} from 'expo-router';
import {useEffect, useState, type ReactNode} from 'react';
import {Alert} from 'react-native';

import {Appear} from '@/motion';

import {canShow} from './budget';
import {useBudgetStore} from './budgetStore';
import {act} from './service';
import {SuggestionCard} from './SuggestionCard';
import {useSuggestions} from './useSuggestions';

/** How many due come-backs to pick from at random. */
const POOL = 20;

/**
 * `before`: shown above the card when there is one; `fallback`: shown instead when there isn't.
 * One come-back at a time, on the swipe card — only when one is due and today's budget allows
 * (budget.ts: a few per day, none for a few hours after hiding). Renders nothing otherwise.
 */
export function Suggestions({before, fallback = null}: {before?: ReactNode; fallback?: ReactNode} = {}) {
  const router = useRouter();
  const due = useSuggestions(POOL);
  const budget = useBudgetStore(state => state.budget);
  const markSeen = useBudgetStore(state => state.seen);
  const hide = useBudgetStore(state => state.hide);
  const allowed = due.filter(m => canShow(budget, m.itemId));

  // A random pick that stays put until it's no longer allowed (acted on, hidden, or out of budget).
  const [pickedId, setPickedId] = useState<number | null>(null);
  const memo = allowed.find(m => m.itemId === pickedId) ?? null;
  useEffect(() => {
    if (memo || allowed.length === 0) return;
    setPickedId(allowed[Math.floor(Math.random() * allowed.length)].itemId);
  }, [memo, allowed]);
  useEffect(() => {
    if (memo) markSeen(memo.itemId);
  }, [memo, markSeen]);

  if (!memo) return <>{fallback}</>;
  const run = (p: Promise<void>) => p.catch(e => Alert.alert('Could not update', e instanceof Error ? e.message : 'Try again'));

  return (
    // Keyed by item: after a swipe, the next one slides in fresh.
    <Appear key={memo.itemId} from="up" style={{marginTop: 20}}>
      {before}
      <SuggestionCard
        memo={memo}
        onOpen={() => {
          run(act(memo, 'open'));
          router.push(`/item/${memo.itemId}`);
        }}
        // Steps back a day, so a different one comes up next.
        onNext={() => run(act(memo, 'later'))}
        onHide={hide}
        onDone={() => run(act(memo, 'done'))}
      />
    </Appear>
  );
}
