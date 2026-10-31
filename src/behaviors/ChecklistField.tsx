import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {behaviorData, encode, parseSteps, withBehavior, type Step} from './data';

/** Divisible: edit a task's steps in the form. No steps = behavior detached. */
export function ChecklistField({draft, onChange}: {draft: CaptureItemDraft; onChange: (d: CaptureItemDraft) => void}) {
  const steps = parseSteps(behaviorData(draft, 'Divisible').steps);
  const [text, setText] = useState('');
  const save = (next: Step[]) => onChange(withBehavior(draft, 'Divisible', next.length ? {steps: encode(next)} : null));

  function add() {
    if (!text.trim()) return;
    save([...steps, {text: text.trim(), done: false}]);
    setText('');
  }

  return (
    <View style={{gap: 6}}>
      {steps.map((step, i) => (
        <View key={`${i}-${step.text}`} style={{flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4}}>
          <Pressable onPress={() => save(steps.map((s, j) => (j === i ? {...s, done: !s.done} : s)))} hitSlop={8}>
            <Ionicons name={step.done ? 'checkbox' : 'square-outline'} size={20} color={designTokens.textSecondary} />
          </Pressable>
          <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 15, textDecorationLine: step.done ? 'line-through' : 'none'}}>
            {step.text}
          </Text>
          <Pressable onPress={() => save(steps.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel={`Remove ${step.text}`}>
            <Ionicons name="close" size={18} color={designTokens.textTertiary} />
          </Pressable>
        </View>
      ))}
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={add}
        blurOnSubmit={false}
        returnKeyType="done"
        placeholder="Add a step"
        placeholderTextColor={designTokens.textTertiary}
        style={{
          backgroundColor: designTokens.field,
          borderRadius: radius.md,
          paddingHorizontal: 16,
          paddingVertical: 12,
          color: designTokens.textPrimary,
          fontSize: 15,
        }}
      />
    </View>
  );
}
