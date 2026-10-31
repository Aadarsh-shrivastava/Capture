import {Text, View} from 'react-native';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {SelectChip} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

import {behaviorData, encode, leadLabel, parseNumbers, withBehavior} from './data';

const PRESETS = [0, 5, 15, 30, 60, 1440];

/** Remindable: pick when to be reminded. None picked = default reminders (30 and 5 min). */
export function RemindField({draft, onChange}: {draft: CaptureItemDraft; onChange: (d: CaptureItemDraft) => void}) {
  const offsets = parseNumbers(behaviorData(draft, 'Remindable').offsets);
  const toggle = (m: number) => {
    const next = offsets.includes(m) ? offsets.filter(o => o !== m) : [...offsets, m].sort((a, b) => b - a);
    onChange(withBehavior(draft, 'Remindable', next.length ? {offsets: encode(next)} : null));
  };

  return (
    <View style={{gap: 8}}>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {PRESETS.map(m => (
          <SelectChip key={m} label={m === 0 ? 'At time' : `${leadLabel(m)} before`} active={offsets.includes(m)} onPress={() => toggle(m)} />
        ))}
      </View>
      {offsets.length === 0 ? (
        <Text style={{color: designTokens.textTertiary, fontSize: 12}}>Default: 30 and 5 min before. Needs a due time.</Text>
      ) : null}
    </View>
  );
}
