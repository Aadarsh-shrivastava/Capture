import {Ionicons} from '@expo/vector-icons';
import {Text, View} from 'react-native';

import {updateBehaviorData} from '@/taskActions';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {encode, parseSteps} from './data';

/** Read-and-tick checklist for the item detail page; each tick saves right away. */
export function ChecklistView({itemId, data}: {itemId: number; data?: Record<string, string>}) {
  const steps = parseSteps(data?.steps);
  if (steps.length === 0) return null;
  const done = steps.filter(s => s.done).length;

  return (
    <View style={{gap: 4, marginBottom: 16}}>
      <Text style={{color: designTokens.textTertiary, fontSize: 13, marginBottom: 4}}>
        Steps · {done} of {steps.length} done
      </Text>
      {steps.map((step, i) => (
        <Pressable
          key={`${i}-${step.text}`}
          onPress={() => updateBehaviorData(itemId, 'Divisible', {steps: encode(steps.map((s, j) => (j === i ? {...s, done: !s.done} : s)))})}
          style={{flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8}}>
          <Ionicons name={step.done ? 'checkbox' : 'square-outline'} size={20} color={designTokens.textSecondary} />
          <Text
            style={{
              flex: 1,
              color: step.done ? designTokens.textTertiary : designTokens.textPrimary,
              fontSize: 15,
              textDecorationLine: step.done ? 'line-through' : 'none',
            }}>
            {step.text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
