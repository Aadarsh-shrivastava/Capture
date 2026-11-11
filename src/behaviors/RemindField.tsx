import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {MultiSelectField} from '@/ui/components/SelectField';

import {behaviorData, encode, leadLabel, parseNumbers, withBehavior} from './data';

const PRESETS = [0, 5, 15, 30, 60, 1440];

/** Remindable: pick when to be reminded. None = default reminders (30 and 5 min). */
export function RemindField({draft, onChange}: {draft: CaptureItemDraft; onChange: (d: CaptureItemDraft) => void}) {
  const offsets = parseNumbers(behaviorData(draft, 'Remindable').offsets);
  return (
    <MultiSelectField
      title="Reminders"
      icon="notifications-outline"
      options={PRESETS.map(m => ({label: m === 0 ? 'At the time' : `${leadLabel(m)} before`, value: String(m)}))}
      values={offsets.map(String)}
      onChange={v => {
        const next = v.map(Number).sort((a, b) => b - a);
        onChange(withBehavior(draft, 'Remindable', next.length ? {offsets: encode(next)} : null));
      }}
      emptyText="Default (30 and 5 min before)"
    />
  );
}
