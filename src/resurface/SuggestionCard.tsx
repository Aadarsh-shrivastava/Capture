import moment from 'moment';
import {Text} from 'react-native';

import {SwipeCard} from '@/ui/components/FocusComponents';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import type {Memo} from './schedule';

type Props = {memo: Memo; onOpen: () => void; onNext: () => void; onHide: () => void; onDone: () => void};

/**
 * Something coming back, on the same swipe card as the Now task. It never turns into a task:
 * right = next (another one), left = hide come-backs for a few hours, tap = open.
 */
export function SuggestionCard({memo, onOpen, onNext, onHide, onDone}: Props) {
  return (
    <SwipeCard
      eyebrow="COME BACK"
      badge={memo.typeName}
      title={memo.title}
      content={memo.content && memo.content !== memo.title ? memo.content : null}
      meta={`Saved ${moment(memo.createdAt).fromNow()}`}
      mascot={memo.mascot}
      fallbackPose="thinking"
      onPress={onOpen}
      right={{label: 'NEXT', icon: 'arrow-forward', onSwipe: onNext}}
      left={{label: 'HIDE', icon: 'eye-off-outline', onSwipe: onHide}}
      hint="← hide for now · next →"
      footer={
        <Pressable onPress={onDone} hitSlop={10} accessibilityRole="button" style={{alignSelf: 'center', marginTop: 12}}>
          <Text style={{color: designTokens.textTertiary, fontSize: 13, fontWeight: '500'}}>Don't bring this back</Text>
        </Pressable>
      }
    />
  );
}
