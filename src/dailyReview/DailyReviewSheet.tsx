import {useCallback, useEffect, useState} from 'react';
import {AppState, ScrollView, Text, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import type {FocusTask} from '@/models/focusTask';
import {useDatabaseReady} from '@/providers/DatabaseProvider';
import {completeTask, deleteItem} from '@/taskActions';
import {PrimaryButton} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';
import {formatDueDateLabel} from '@/ui/formatDateTime';
import {Pressable} from '@/ui/HapticPressable';
import {Ionicons} from '@expo/vector-icons';

import {dailyReviewService} from './service';
import {useDailyReviewStore} from './store';

function Chip({label, icon, onPress}: {label?: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={{
        paddingHorizontal: 10,
        height: 30,
        justifyContent: 'center',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
      }}>
      {icon ? (
        <Ionicons name={icon} size={15} color={designTokens.textSecondary} />
      ) : (
        <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '500'}}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Once a day: leftover tasks from earlier days, each one tap to move, finish or drop. */
export function DailyReviewSheet() {
  const dbReady = useDatabaseReady();
  const {visible, open, close} = useDailyReviewStore();
  const [tasks, setTasks] = useState<FocusTask[]>([]);

  const reload = useCallback(async () => {
    const leftovers = await dailyReviewService.loadLeftovers();
    setTasks(leftovers);
    return leftovers;
  }, []);

  // Auto-open on first launch/foreground of the day when there's something to review.
  useEffect(() => {
    if (!dbReady) return;
    const check = async () => {
      if (dailyReviewService.alreadyShownToday()) return;
      if ((await reload()).length === 0) return;
      dailyReviewService.markShown();
      open();
    };
    check().catch(() => {});
    const sub = AppState.addEventListener('change', state => state === 'active' && check().catch(() => {}));
    return () => sub.remove();
  }, [dbReady, reload, open]);

  useEffect(() => {
    if (visible) reload().catch(() => {});
  }, [visible, reload]);

  async function act(action: () => Promise<unknown>) {
    await action().catch(() => {});
    if ((await reload()).length === 0) close();
  }

  const title = `${tasks.length} left over`;

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={title}
      footer={
        tasks.length > 1 ? (
          <View style={{paddingHorizontal: 20}}>
            <PrimaryButton compact label="Move all to today" onPress={() => act(() => dailyReviewService.moveAllToToday(tasks))} />
          </View>
        ) : undefined
      }>
      <ScrollView style={{maxHeight: 420}} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 12}}>
        {tasks.length === 0 ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 14, paddingVertical: 16}}>All caught up.</Text>
        ) : (
          tasks.map(task => (
            <View key={task.id} style={{paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: designTokens.divider, gap: 8}}>
              <View>
                <Text numberOfLines={1} style={{color: designTokens.textPrimary, fontSize: 15, fontWeight: '500'}}>
                  {task.title}
                </Text>
                <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 2}}>
                  {formatDueDateLabel(task.dueAt)}
                </Text>
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                <Chip label="Today" onPress={() => act(() => dailyReviewService.moveTo(task, 0))} />
                <Chip label="Tomorrow" onPress={() => act(() => dailyReviewService.moveTo(task, 1))} />
                <View style={{flex: 1}} />
                <Chip icon="checkmark" onPress={() => act(() => completeTask(task.id, task.title))} />
                <Chip icon="trash-outline" onPress={() => act(() => deleteItem(task.id, task.title))} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}
