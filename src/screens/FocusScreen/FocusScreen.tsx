import moment from 'moment';
import {useCallback, useMemo, useState} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {DateSheet} from '@/components/sheets/DateSheet';
import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {isTaskOverdue} from '@/domain/focusPriority';
import {useFocusData} from '@/hooks/useFocusData';
import {useCaptureStore} from '@/store/captureStore';
import {useLingeringDone} from '@/hooks/useLingeringDone';
import {Appear, SlideOut} from '@/motion';
import {DayProgress} from '@/progress';
import type {FocusTask} from '@/models/focusTask';
import {
  FocusEmptyState,
  FocusLoadingState,
  DoNowCard,
  NextTaskRow,
} from '@/ui/components/FocusComponents';
import {Selectable} from '@/selection';
import {completeTask, postponeTask, rescheduleTask} from '@/taskActions';
import {SectionHeader} from '@/ui/components/SectionHeader';
import {SwipeRow} from '@/ui/components/SwipeRow';
import {CollapsibleSection} from '@/ui/components/CollapsibleSection';
import {splitFocusDay} from '@/domain/focusSections';
import {WeekStrip} from '@/ui/components/WeekStrip';
import {designTokens} from '@/ui/designTokens';

/** How far past the top you pull before letting go opens capture. */
const PULL_TO_CAPTURE = 80;

function dueMoment(task: FocusTask) {
  if (!task.dueAt?.trim()) return null;
  const parsed = moment(task.dueAt, moment.ISO_8601, false);
  return parsed.isValid() ? parsed : null;
}

/** Tasks shown for a day: everything due that day, plus undated and overdue work on today. */
function tasksForDay(tasks: FocusTask[], day: moment.Moment) {
  const isToday = day.isSame(moment(), 'day');

  return tasks.filter((task) => {
    const due = dueMoment(task);
    if (!due) return isToday;
    if (due.isSame(day, 'day')) return true;
    return isToday && isTaskOverdue(task);
  });
}

export function FocusScreen() {
  const router = useRouter();
  const {tasks, loading, error, refresh} = useFocusData();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<FocusTask | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );


  const selected = useMemo(() => moment(selectedDate), [selectedDate]);
  const openTextCapture = useCaptureStore((state) => state.openTextCapture);
  const {linger, withLingering, isLingering} = useLingeringDone();
  const dayTasks = useMemo(() => tasksForDay(withLingering(tasks), selected), [tasks, selected, withLingering]);
  const isToday = selected.isSame(moment(), 'day');
  const {now, next, later} = useMemo(() => splitFocusDay(dayTasks), [dayTasks]);
  /** Other days: same order (timed first), no sections. */
  const dayList = useMemo(() => (now ? [now, ...next, ...later] : []), [now, next, later]);

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

  function openReschedule(task: FocusTask) {
    setRescheduling(task);
    setDateSheetOpen(true);
  }

  function complete(task: FocusTask) {
    linger(task);
    completeTask(task.id, task.title).catch((err) =>
      Alert.alert('Unable to update task', err instanceof Error ? err.message : 'Try again'),
    );
  }

  function postpone(task: FocusTask) {
    postponeTask(task.id, task.title).catch((err) =>
      Alert.alert('Unable to update task', err instanceof Error ? err.message : 'Try again'),
    );
  }

  function renderRow(task: FocusTask) {
    if (isLingering(task.id)) {
      return (
        <SlideOut key={task.id} out>
          <NextTaskRow task={task} onPress={() => {}} />
        </SlideOut>
      );
    }
    return (
      <Appear key={task.id}>
        <SwipeRow
          left={{label: 'Complete', icon: 'checkmark', onTrigger: () => complete(task)}}
          right={{label: 'Reschedule', icon: 'calendar-outline', onTrigger: () => openReschedule(task)}}>
          <Selectable item={task} bleed={8} onOpen={() => openTask(task)}>
            {(select) => <NextTaskRow task={task} {...select} />}
          </Selectable>
        </SwipeRow>
      </Appear>
    );
  }

  function closeDateSheet() {
    setDateSheetOpen(false);
    setRescheduling(null);
  }

  return (
    <TabScreenShell
      title="Capture"
      action={{icon: 'calendar-outline', label: 'Pick a day', onPress: () => setDateSheetOpen(true)}}
      secondaryAction={{icon: 'search', label: 'Search', onPress: () => router.push('/search')}}>
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40}}
        // ponytail: uses iOS overscroll bounce; Android has none, add a RefreshControl there if needed.
        onScrollEndDrag={(e) => e.nativeEvent.contentOffset.y < -PULL_TO_CAPTURE && openTextCapture()}
        showsVerticalScrollIndicator={false}>
        <Text
          style={{position: 'absolute', top: -40, left: 0, right: 0, textAlign: 'center', color: designTokens.textTertiary, fontSize: 13}}>
          Pull to capture
        </Text>
        <WeekStrip value={selectedDate} onChange={setSelectedDate} markedDays={markedDays} />
        <DayProgress day={selectedDate} />

        {error ? (
          <Text style={{color: designTokens.textSecondary, fontSize: 13, marginTop: 16}}>{error}</Text>
        ) : null}

        {loading ? <FocusLoadingState /> : null}

        {!loading && dayTasks.length === 0 ? (
          <FocusEmptyState />
        ) : null}

        {!loading && !isToday && dayList.length > 0 ? (
          <View style={{marginTop: 20}}>{dayList.map(renderRow)}</View>
        ) : null}

        {!loading && isToday && now ? (
          <>
            <SectionHeader label="Now" />
            <SlideOut key={now.id} out={isLingering(now.id)}>
              <Selectable item={now} onOpen={() => openTask(now)}>
                {(select) => (
                  <DoNowCard
                    task={now}
                    {...select}
                    onComplete={() => complete(now)}
                    onReschedule={() => openReschedule(now)}
                    onDefer={() => postpone(now)}
                  />
                )}
              </Selectable>
            </SlideOut>
          </>
        ) : null}

        {!loading && isToday && next.length > 0 ? (
          <CollapsibleSection label="Next" count={next.length}>
            {next.map(renderRow)}
          </CollapsibleSection>
        ) : null}

        {!loading && isToday && later.length > 0 ? (
          <CollapsibleSection label="Later" count={later.length} defaultOpen={false}>
            {later.map(renderRow)}
          </CollapsibleSection>
        ) : null}
      </ScrollView>

      <DateSheet
        visible={dateSheetOpen}
        onClose={closeDateSheet}
        withTime={rescheduling !== null}
        onSelect={(date) => {
          if (rescheduling) {
            const task = rescheduling;
            runAction(() => rescheduleTask(task.id, date));
          } else {
            setSelectedDate(moment(date, 'YYYY-MM-DD').toDate());
          }
          closeDateSheet();
        }}
      />
    </TabScreenShell>
  );
}
