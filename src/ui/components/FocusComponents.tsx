import {ActivityIndicator, Text, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {formatDueLabel} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {designTokens} from '@/ui/designTokens';
import {Mascot, type MascotPose} from '@/mascot';

type TaskActionsProps = {
  onComplete: () => void;
  onReschedule: () => void;
  onDefer: () => void;
  compact?: boolean;
};

function TextAction({label, onPress, strong}: {label: string; onPress: () => void; strong?: boolean}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button">
      <Text
        style={{
          color: strong ? designTokens.textPrimary : designTokens.textTertiary,
          fontSize: 14,
          fontWeight: strong ? '600' : '500',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Text-only actions: Reschedule · Later on the left, Complete on the right. */
function TaskActions({onComplete, onReschedule, onDefer, compact}: TaskActionsProps) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: compact ? 14 : 20}}>
      <TextAction label="Reschedule" onPress={onReschedule} />
      <TextAction label="Later" onPress={onDefer} />
      <View style={{flex: 1}} />
      <TextAction label="Complete" onPress={onComplete} strong />
    </View>
  );
}

type DoNowCardProps = {
  task: FocusTask;
  onPress: () => void;
  onLongPress?: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onDefer: () => void;
};

export function DoNowCard({task, onPress, onLongPress, onComplete, onReschedule, onDefer}: DoNowCardProps) {
  const dueLabel = formatDueLabel(task.dueAt);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        backgroundColor: designTokens.surfaceRaised,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        borderRadius: 14,
        padding: 22,
        marginBottom: 8,
      }}>
      <Text style={{color: designTokens.textPrimary, fontSize: 24, fontWeight: '700', lineHeight: 30}}>
        {task.title}
      </Text>
      {dueLabel ? (
        <Text style={{color: designTokens.textSecondary, fontSize: 14, marginTop: 10}}>{dueLabel}</Text>
      ) : null}
      <TaskActions compact onComplete={onComplete} onReschedule={onReschedule} onDefer={onDefer} />
    </Pressable>
  );
}

type NextTaskRowProps = {
  task: FocusTask;
  onPress: () => void;
  onLongPress?: () => void;
};

export function NextTaskRow({task, onPress, onLongPress}: NextTaskRowProps) {
  const dueLabel = formatDueLabel(task.dueAt);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}>
      <View style={{flex: 1}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>{task.title}</Text>
        {dueLabel ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 2}}>{dueLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function emptyMessage(hour = new Date().getHours()): {title: string; body: string; pose: MascotPose} {
  if (hour < 12) return {title: 'Fresh start', body: "What's first today? Pull down or tap + to capture.", pose: 'wink'};
  if (hour < 18) return {title: 'Nothing pressing', body: 'Good moment to capture something you have been putting off.', pose: 'thinking'};
  return {title: 'Quiet evening', body: 'Anything for tomorrow? Capture it now and sleep on a clear head.', pose: 'chibiSleeping'};
}

export function FocusEmptyState() {
  const message = emptyMessage();
  return (
    <View style={{paddingVertical: 48, alignItems: 'center', gap: 8}}>
      <Mascot pose={message.pose} width={140} />
      <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>
        {message.title}
      </Text>
      <Text style={{color: designTokens.textTertiary, fontSize: 14, textAlign: 'center', lineHeight: 20}}>
        {message.body}
      </Text>
    </View>
  );
}

export function FocusLoadingState() {
  return (
    <View style={{paddingVertical: 48, alignItems: 'center'}}>
      <ActivityIndicator color={designTokens.accent} />
    </View>
  );
}
