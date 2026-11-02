import {View} from 'react-native';

import type {FocusTask} from '@/models/focusTask';
import {NextTaskRow} from '@/ui/components/FocusComponents';

/** A future repeat: dimmed and not tappable — the real item is acted on when it's actually due. */
export function GhostRow({task}: {task: FocusTask}) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden style={{opacity: 0.4}}>
      <NextTaskRow task={{...task, title: `${task.title} · repeats`}} onPress={() => {}} />
    </View>
  );
}
