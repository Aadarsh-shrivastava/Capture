import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {formatDueLabel} from '@/domain/focusPriority';
import type {FocusTask} from '@/models/focusTask';
import {designTokens} from '@/ui/designTokens';

type TaskActionsProps = {
  onComplete: () => void;
  onReschedule: () => void;
  onDefer: () => void;
  compact?: boolean;
};

function TaskActions({onComplete, onReschedule, onDefer, compact}: TaskActionsProps) {
  const btnStyle = compact
    ? {paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8}
    : {paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10};

  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: compact ? 10 : 14}}>
      <Pressable
        onPress={onComplete}
        style={[btnStyle, {backgroundColor: designTokens.accent}]}>
        <Text style={{color: '#fff', fontWeight: '600', fontSize: compact ? 13 : 14}}>Complete</Text>
      </Pressable>
      <Pressable
        onPress={onReschedule}
        style={[btnStyle, {borderWidth: 1, borderColor: designTokens.surfaceBorder}]}>
        <Text style={{color: designTokens.textSecondary, fontWeight: '500', fontSize: compact ? 13 : 14}}>
          Reschedule
        </Text>
      </Pressable>
      <Pressable onPress={onDefer} style={[btnStyle, {borderWidth: 1, borderColor: designTokens.surfaceBorder}]}>
        <Text style={{color: designTokens.textTertiary, fontWeight: '500', fontSize: compact ? 13 : 14}}>
          Later
        </Text>
      </Pressable>
    </View>
  );
}

type OverdueTaskCardProps = {
  task: FocusTask;
  onPress: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onDefer: () => void;
};

export function OverdueTaskCard({
  task,
  onPress,
  onComplete,
  onReschedule,
  onDefer,
}: OverdueTaskCardProps) {
  const dueLabel = formatDueLabel(task.dueAt);

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: 'rgba(184, 75, 62, 0.45)',
        backgroundColor: 'rgba(184, 75, 62, 0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
      }}>
      <Text style={{color: designTokens.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8}}>
        OVERDUE
      </Text>
      <Text style={{color: designTokens.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24}}>
        {task.title}
      </Text>
      {dueLabel ? (
        <Text style={{color: designTokens.accent, fontSize: 13, marginTop: 6}}>{dueLabel}</Text>
      ) : null}
      <TaskActions compact onComplete={onComplete} onReschedule={onReschedule} onDefer={onDefer} />
    </Pressable>
  );
}

type DoNowCardProps = {
  task: FocusTask;
  onPress: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onDefer: () => void;
};

export function DoNowCard({task, onPress, onComplete, onReschedule, onDefer}: DoNowCardProps) {
  const dueLabel = formatDueLabel(task.dueAt);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: designTokens.surfaceRaised,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        borderRadius: 14,
        padding: 22,
        marginBottom: 8,
      }}>
      <Text style={{color: designTokens.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12}}>
        DO NOW
      </Text>
      <Text style={{color: designTokens.textPrimary, fontSize: 24, fontWeight: '700', lineHeight: 30}}>
        {task.title}
      </Text>
      {dueLabel ? (
        <Text style={{color: designTokens.textSecondary, fontSize: 14, marginTop: 10}}>{dueLabel}</Text>
      ) : null}
      <TaskActions onComplete={onComplete} onReschedule={onReschedule} onDefer={onDefer} />
    </Pressable>
  );
}

type NextTaskRowProps = {
  task: FocusTask;
  onPress: () => void;
};

export function NextTaskRow({task, onPress}: NextTaskRowProps) {
  const dueLabel = formatDueLabel(task.dueAt);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}>
      <Text style={{color: designTokens.textTertiary, fontSize: 18}}>○</Text>
      <View style={{flex: 1}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>{task.title}</Text>
        {dueLabel ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 2}}>{dueLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

type LaterSectionProps = {
  tasks: FocusTask[];
  onPressTask: (task: FocusTask) => void;
};

export function LaterSection({tasks, onPressTask}: LaterSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={{flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8}}>
        <Text style={{color: designTokens.textTertiary, fontSize: 13, fontWeight: '600'}}>
          {tasks.length} deferred {tasks.length === 1 ? 'task' : 'tasks'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color={designTokens.textTertiary}
        />
        {!expanded ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 12}}>Show</Text>
        ) : null}
      </Pressable>

      {expanded
        ? tasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => onPressTask(task)}
              style={{
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: designTokens.surfaceBorder,
              }}>
              <Text style={{color: designTokens.textTertiary, fontSize: 15}}>{task.title}</Text>
            </Pressable>
          ))
        : null}
    </View>
  );
}

export function FocusEmptyState() {
  return (
    <View style={{paddingVertical: 48, alignItems: 'center', gap: 8}}>
      <Ionicons name="checkmark-circle-outline" size={36} color={designTokens.textTertiary} />
      <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>
        Nothing needs your attention
      </Text>
      <Text style={{color: designTokens.textTertiary, fontSize: 14, textAlign: 'center', lineHeight: 20}}>
        Tap + to capture a thought. Tasks will show up here when they need action.
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
