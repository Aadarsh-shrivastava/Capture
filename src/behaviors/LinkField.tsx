import {TextInput} from 'react-native';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {designTokens, radius} from '@/ui/designTokens';

import {behaviorData, withBehavior} from './data';

/** Visitable: one URL. Empty = behavior detached. */
export function LinkField({draft, onChange}: {draft: CaptureItemDraft; onChange: (d: CaptureItemDraft) => void}) {
  const data = behaviorData(draft, 'Visitable');
  return (
    <TextInput
      value={data.url ?? ''}
      onChangeText={url => onChange(withBehavior(draft, 'Visitable', url.trim() ? {...data, url: url.trim()} : null))}
      placeholder="https://…"
      placeholderTextColor={designTokens.textTertiary}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="url"
      style={{
        backgroundColor: designTokens.field,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: designTokens.textPrimary,
        fontSize: 16,
      }}
    />
  );
}
