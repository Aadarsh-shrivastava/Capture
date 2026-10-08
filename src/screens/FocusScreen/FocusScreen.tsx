import moment from 'moment';
import {useCallback, useMemo, useState} from 'react';
import {Alert, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {DateSheet} from '@/components/sheets/DateSheet';
import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {isTaskOverdue, scoreFocusTask} from '@/domain/focusPriority';
import {useFocusData} from '@/hooks/useFocusData';
import type {FocusTask} from '@/models/focusTask';
import {focusTaskService} from '@/services/focusTaskService';
import {
  FocusEmptyState,
  FocusLoadingState,
  LaterSection,
  NowTaskCard,
  TaskListRow,
} from '@/ui/components/FocusComponents';
import {SectionHeader} from '@/ui/components/SectionHeader';
import {WeekStrip} from '@/ui/components/WeekStrip';
import {designTokens} from '@/ui/designTokens';

function dueMoment(task: FocusTask) {
  if (!task.dueAt?.trim()) return null;
  const parsed = moment(task.dueAt, moment.ISO_8601, false);
  return parsed.isValid() ? parsed : null;
}

/** Tasks shown for a day: everything due that day, plus undated and overdue work on today. */
function tasksForDay(tasks: FocusTask[], day: moment.Moment) {
  const isToday = day.isSame(moment(), 'day');

  return tasks
    .filter((task) => task.status !== 'deferred')
    .filter((task) => {
      const due = dueMoment(task);
      if (!due) return isToday;
      if (due.isSame(day, 'day')) return true;
      return isToday && isTaskOverdue(task);
    })
    .sort((a, b) => {
      const aDue = dueMoment(a);
      const bDue = dueMoment(b);
      if (aDue && bDue) return aDue.valueOf() - bDue.valueOf();
      if (aDue) return -1;
      if (bDue) return 1;
      return scoreFocusTask(b) - scoreFocusTask(a);
    });
}

export function FocusScreen() {
  const router = useRouter();
  const {tasks, queue, loading, error, refresh} = useFocusData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const selected = useMemo(() => moment(selectedDate), [selectedDate]);
  const dayTasks = useMemo(() => tasksForDay(tasks, selected), [tasks, selected]);
  const now = dayTasks[0] ?? null;
  const next = dayTasks.slice(1);

  const markedDays = useMemo(
    () =>
      tasks
        .map((task) => dueMoment(task)?.format('YYYY-MM-DD'))
        .filter((value): value is string => Boolean(value)),
    [tasks],
  );

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

  function toggleRunning(task: FocusTask) {
    const action =
      task.doableStatus === 'in_progress'
        ? () => focusTaskService.pauseTask(task)
        : () => focusTaskService.startTask(task);
    runAction(action);
  }

  return (
    <TabScreenShell
      title="Focus"
      action={{icon: 'calendar-outline', label: 'Pick a day', onPress: () => setDateSheetOpen(true)}}>
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={designTokens.textSecondary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <WeekStrip value={selectedDate} onChange={setSelectedDate} markedDays={markedDays} />

        {error ? (
          <Text style={{color: designTokens.textSecondary, fontSize: 13, marginTop: 16}}>{error}</Text>
        ) : null}

        {loading ? <FocusLoadingState /> : null}

        {!loading && dayTasks.length === 0 ? (
          <FocusEmptyState
            label={selected.isSame(moment(), 'day') ? 'All clear for today' : 'Nothing scheduled'}
          />
        ) : null}

        {!loading && now ? (
          <>
            <SectionHeader label="Now" />
            <NowTaskCard
              task={now}
              overdue={isTaskOverdue(now)}
              onPress={() => openTask(now)}
              onComplete={() => runAction(() => focusTaskService.completeTask(now))}
              onStart={() => toggleRunning(now)}
            />
          </>
        ) : null}

        {!loading && next.length > 0 ? (
          <>
            <SectionHeader label="Next" />
            <View style={{gap: 10}}>
              {next.map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  onPress={() => openTask(task)}
                  onComplete={() => runAction(() => focusTaskService.completeTask(task))}
                />
              ))}
            </View>
          </>
        ) : null}

        {!loading && queue.later.length > 0 ? (
          <>
            <SectionHeader label="Later" />
            <LaterSection tasks={queue.later} onPressTask={openTask} />
          </>
        ) : null}
      </ScrollView>

      <DateSheet
        visible={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        onSelect={(date) => setSelectedDate(moment(date, 'YYYY-MM-DD').toDate())}
      />
    </TabScreenShell>
  );
}
