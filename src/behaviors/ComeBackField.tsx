import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {BEHAVIOR_DEFINITIONS} from '@/domain/behaviorDefinitions';
import {SelectField} from '@/ui/components/SelectField';

import {behaviorData, withBehavior} from './data';

const WEIGHTS = BEHAVIOR_DEFINITIONS.Memorable.fields.find(f => f.name === 'weight')?.options ?? [];

/** Memorable: how often this item comes back as a suggestion. Auto ('') = decided by kind (questions often, notes rarely). */
export function ComeBackField({draft, onChange}: {draft: CaptureItemDraft; onChange: (d: CaptureItemDraft) => void}) {
  const data = behaviorData(draft, 'Memorable');
  return (
    <SelectField
      title="Come back"
      icon="sparkles-outline"
      options={WEIGHTS}
      value={data.weight ?? ''}
      onChange={v => onChange(withBehavior(draft, 'Memorable', {...data, weight: v}))}
    />
  );
}
