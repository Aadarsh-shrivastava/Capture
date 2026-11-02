import {useRouter} from 'expo-router';
import {Alert, ScrollView, useWindowDimensions} from 'react-native';

import {Appear} from '@/motion';

import {act} from './service';
import {SuggestionCard} from './SuggestionCard';
import {useSuggestions} from './useSuggestions';

const GAP = 12;
const GUTTER = 20;

/** Ideas, questions and links due to come back, as swipeable cards. Renders nothing when none are due. */
export function Suggestions({count = 3}: {count?: number}) {
  const router = useRouter();
  const memos = useSuggestions(count);
  const {width} = useWindowDimensions();
  if (memos.length === 0) return null;

  // One card fills the row; several peek so it's clear you can swipe.
  const cardWidth = memos.length === 1 ? width - GUTTER * 2 : width - GUTTER * 2 - 28;
  const run = (p: Promise<void>) => p.catch(e => Alert.alert('Could not update', e instanceof Error ? e.message : 'Try again'));

  return (
    <Appear from="up" style={{marginHorizontal: -GUTTER, marginTop: 8}}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + GAP}
        contentContainerStyle={{paddingHorizontal: GUTTER, gap: GAP}}>
        {memos.map(memo => (
          <SuggestionCard
            key={memo.itemId}
            memo={memo}
            width={cardWidth}
            onOpen={() => {
              run(act(memo, 'open'));
              router.push(`/item/${memo.itemId}`);
            }}
            onAct={action => run(act(memo, action))}
          />
        ))}
      </ScrollView>
    </Appear>
  );
}
