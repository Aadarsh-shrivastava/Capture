import {View} from 'react-native';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {SelectChip} from '@/ui/components/Primitives';

import {REPEAT_OPTIONS, repeatUnitOf, withRepeat} from './utils';

/** Never / Daily / Weekly / Monthly chips for the item form. */
export function RepeatField({draft, onChange}: {draft: CaptureItemDraft; onChange: (draft: CaptureItemDraft) => void}) {
  const current = repeatUnitOf(draft);
  return (
    <View style={{flexDirection: 'row', gap: 8}}>
      {REPEAT_OPTIONS.map(option => (
        <SelectChip
          key={option.label}
          label={option.label}
          active={current === option.value}
          onPress={() => onChange(withRepeat(draft, option.value))}
        />
      ))}
    </View>
  );
}
