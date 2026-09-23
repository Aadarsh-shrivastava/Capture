import {useCallback} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {useFocusData} from '@/hooks/useFocusData';
import type {FocusTask} from '@/models/focusTask';
import {focusTaskService} from '@/services/focusTaskService';
import {
  DoNowCard,
  FocusEmptyState,
  FocusLoadingState,
  LaterSection,
  NextTaskRow,
  OverdueTaskCard,
} from '@/ui/components/FocusComponents';
import {SectionHeader} from '@/ui/components/SectionHeader';
import {designTokens, formatLongDate} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

export function FocusScreen() {
  const {theme} = useThemeStore();
  const {spacing} = theme;
  const router = useRouter();
  const {queue, loading, error, refresh} = useFocusData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const hasFocusWork =
    queue.overdue.length > 0 || queue.doNow != null || queue.next.length > 0;

  function openTask(task: FocusTask) {
    router.push(`/item/${task.id}`);
  }

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
      await refresh();
    } catch (err) {
      Alert.alert('Unable to update task', err instanceof Error ? err.message : 'Try again');
    }
  }

  function confirmReschedule(task: FocusTask) {
    const options = focusTaskService.rescheduleOptions();
    Alert.alert('Reschedule', task.title, [
      ...options.map((option) => ({
        text: option.label,
        onPress: () => runAction(() => focusTaskService.rescheduleTask(task, option.value)),
      })),
      {text: 'Cancel', style: 'cancel' as const},
    ]);
  }

  return (
    <TabScreenShell title="Focus">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        showsVerticalScrollIndicator={false}>
        <Text style={{color: designTokens.textSecondary, fontSize: 15, marginBottom: 28}}>
          {formatLongDate(new Date())}
        </Text>

        {error ? (
          <Text style={{color: '#ff8a80', fontSize: 13, marginBottom: 12}}>{error}</Text>
        ) : null}

        {loading ? <FocusLoadingState /> : null}

        {!loading && !hasFocusWork && queue.later.length === 0 ? <FocusEmptyState /> : null}

        {!loading && queue.overdue.length > 0 ? (
          <>
            <SectionHeader label="Overdue" />
            {queue.overdue.map((task) => (
              <OverdueTaskCard
                key={task.id}
                task={task}
                onPress={() => openTask(task)}
                onComplete={() => runAction(() => focusTaskService.completeTask(task))}
                onReschedule={() => confirmReschedule(task)}
                onDefer={() => runAction(() => focusTaskService.deferTask(task))}
              />
            ))}
          </>
        ) : null}

        {!loading && queue.doNow ? (
          <>
            <SectionHeader label="Do now" />
            <DoNowCard
              task={queue.doNow}
              onPress={() => openTask(queue.doNow!)}
              onComplete={() => runAction(() => focusTaskService.completeTask(queue.doNow!))}
              onReschedule={() => confirmReschedule(queue.doNow!)}
              onDefer={() => runAction(() => focusTaskService.deferTask(queue.doNow!))}
            />
          </>
        ) : null}

        {!loading && queue.next.length > 0 ? (
          <>
            <SectionHeader label="Next" />
            {queue.next.map((task) => (
              <NextTaskRow key={task.id} task={task} onPress={() => openTask(task)} />
            ))}
          </>
        ) : null}

        {!loading && queue.later.length > 0 ? (
          <>
            <SectionHeader label="Later" />
            <LaterSection tasks={queue.later} onPressTask={openTask} />
          </>
        ) : null}

        {!loading && !hasFocusWork && queue.later.length > 0 ? (
          <View style={{marginTop: 16}}>
            <Text style={{color: designTokens.textTertiary, fontSize: 13, textAlign: 'center'}}>
              Active tasks are deferred. Expand Later to review them.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </TabScreenShell>
  );
}
