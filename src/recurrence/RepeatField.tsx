import {View} from 'react-native';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {MultiSelectField, SelectField} from '@/ui/components/SelectField';

import {REPEAT_OPTIONS, repeatDaysOf, repeatUnitOf, withRepeat, type RepeatUnit} from './utils';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Repeat: Never / Daily / Weekly / Monthly, plus optional weekdays for weekly — all via sheets. */
export function RepeatField({draft, onChange}: {draft: CaptureItemDraft; onChange: (draft: CaptureItemDraft) => void}) {
  const current = repeatUnitOf(draft);
  const days = repeatDaysOf(draft);

  return (
    <View style={{gap: 8}}>
      <SelectField
        title="Repeat"
        icon="repeat-outline"
        options={REPEAT_OPTIONS.map(o => ({label: o.label, value: o.value ?? ''}))}
        value={current ?? ''}
        onChange={v => onChange(withRepeat(draft, (v || null) as RepeatUnit | null))}
      />
      {current === 'week' ? (
        <MultiSelectField
          title="On days"
          icon="calendar-outline"
          options={DAY_NAMES.map((label, day) => ({label, value: String(day)}))}
          values={days.map(String)}
          onChange={v => onChange(withRepeat(draft, 'week', v.map(Number)))}
          emptyText="Same weekday as the due date"
        />
      ) : null}
    </View>
  );
}
