import {View} from 'react-native';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {SelectChip} from '@/ui/components/Primitives';

import {REPEAT_OPTIONS, repeatDaysOf, repeatUnitOf, WEEKDAY_LABELS, withRepeat} from './utils';

/** Never / Daily / Weekly / Monthly chips for the item form. */
export function RepeatField({draft, onChange}: {draft: CaptureItemDraft; onChange: (draft: CaptureItemDraft) => void}) {
  const current = repeatUnitOf(draft);
  const days = repeatDaysOf(draft);
  const toggleDay = (day: number) =>
    onChange(withRepeat(draft, 'week', days.includes(day) ? days.filter(d => d !== day) : [...days, day]));

  return (
    <View style={{gap: 10}}>
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
      {current === 'week' ? (
        // Optional: pick weekdays (none = same weekday as the due date).
        <View style={{flexDirection: 'row', gap: 6}}>
          {WEEKDAY_LABELS.map((label, day) => (
            <SelectChip key={day} label={label} active={days.includes(day)} onPress={() => toggleDay(day)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
