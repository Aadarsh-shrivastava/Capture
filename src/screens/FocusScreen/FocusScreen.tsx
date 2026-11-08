import moment from 'moment';
import {useCallback, useMemo, useState} from 'react';
import {Alert, Platform, RefreshControl, ScrollView, Text, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {DateSheet} from '@/components/sheets/DateSheet';
import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {useFocusData} from '@/hooks/useFocusData';
import {useCaptureStore} from '@/store/captureStore';
import {useLingeringDone} from '@/hooks/useLingeringDone';
import {Appear, SlideOut} from '@/motion';
import {GhostRow, useRepeatPreview} from '@/recurrence';
import {Suggestions} from '@/resurface';
import {UpcomingView, useCurrentView, useViewStore, ViewPicker} from '@/views';
import {DayProgress, useDayProgress} from '@/progress';
import {useAppearance} from '@/store/appearanceStore';
import type {FocusTask} from '@/models/focusTask';
import {
  FocusEmptyState,
  FreeStretch,
  FocusLoadingState,
  NowCard,
  NextTaskRow,
} from '@/ui/components/FocusComponents';
import {Selectable} from '@/selection';
import {completeTask, rescheduleTask} from '@/taskActions';
import {SwipeRow} from '@/ui/components/SwipeRow';
import {CollapsibleSection} from '@/ui/components/CollapsibleSection';
import {dueMoment, splitFocusDay, tasksForDay} from '@/domain/focusSections';
import {designTokens} from '@/ui/designTokens';

/** How far past the top you pull before letting go opens capture. */
const PULL_TO_CAPTURE = 80;

export function FocusScreen() {
  const router = useRouter();
  const {tasks, loading, error, refresh} = useFocusData();
  const [rescheduling, setRescheduling] = useState<FocusTask | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openTextCapture = useCaptureStore(state => state.openTextCapture);
  // Week / Month live in src/views and replace this screen's body; Today / Tomorrow / Custom date pick the day shown here.
  const view = useCurrentView();
  const customDay = useViewStore(state => state.day);
  const selectedDate = useMemo(() => {
    if (view.key === 'tomorrow') return moment().add(1, 'day').startOf('day').toDate();
    if (view.key === 'custom') return moment(customDay, 'YYYY-MM-DD').toDate();
    return new Date();
  }, [view.key, customDay]);
  const selected = useMemo(() => moment(selectedDate), [selectedDate]);
  const {linger, withLingering, isLingering} = useLingeringDone();
  const isToday = selected.isSame(moment(), 'day');
  const progress = useDayProgress(selectedDate);
  const showProgress = useAppearance(state => state.progressBar);
  // Repeating tasks also appear as ghosts (dimmed, not tappable) on the future days they'll land on.
  const repeatPreview = useRepeatPreview(
    tasks,
    moment(selectedDate).add(14, 'days').toDate(),
  );
  const previewTasks = useMemo(
    () =>
      isToday ? [] : repeatPreview.get(selected.format('YYYY-MM-DD')) ?? [],
    [isToday, repeatPreview, selected],
  );
  // Real tasks only — ghosts never hide the empty state (and its mascot).
  const dayTasks = useMemo(
    () => tasksForDay(withLingering(tasks), selected),
    [tasks, selected, withLingering],
  );
  const {now, next, later} = useMemo(() => splitFocusDay(dayTasks), [dayTasks]);
  // A free stretch: today has tasks, but none to do yet (the next one starts later) — room for a suggestion.
  const freeUntil = isToday && !now && next[0] ? dueMoment(next[0]) : null;
  /** Other days: same order (timed first), no sections. */
  const dayList = useMemo(
    // `now` is null when nothing is actionable yet (e.g. all timed, later) — the day still has tasks.
    () => [...(now ? [now] : []), ...next, ...later],
    [now, next, later],
  );

  function openTask(task: FocusTask) {
    router.push(`/item/${task.id}`);
  }

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
      await refresh();
    } catch (err) {
      Alert.alert(
        'Unable to update task',
        err instanceof Error ? err.message : 'Try again',
      );
    }
  }

  function openReschedule(task: FocusTask) {
    setRescheduling(task);
  }

  /** `swiped`: the swipe already moved the row away, so no second slide-out. */
  function complete(task: FocusTask, swiped = false) {
    if (!swiped) linger(task);
    completeTask(task.id, task.title).catch(err =>
      Alert.alert(
        'Unable to update task',
        err instanceof Error ? err.message : 'Try again',
      ),
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
          left={{
            label: 'Complete',
            icon: 'checkmark',
            onTrigger: () => complete(task, true),
            stayOpen: true,
          }}
          right={{
            label: 'Reschedule',
            icon: 'calendar-outline',
            onTrigger: () => openReschedule(task),
          }}>
          <Selectable item={task} bleed={8} onOpen={() => openTask(task)}>
            {select => <NextTaskRow task={task} {...select} />}
          </Selectable>
        </SwipeRow>
      </Appear>
    );
  }

  return (
    <TabScreenShell
      title={view.label}
      titleNode={<ViewPicker />}
      secondaryAction={{
        icon: 'search',
        label: 'Search',
        onPress: () => router.push('/search'),
      }}>
      {view.days > 1 ? (
        <UpcomingView days={view.days} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          // iOS: overscroll bounce past the threshold. Android has no bounce, so its native pull gesture opens capture.
          refreshControl={
            Platform.OS === 'android' ? <RefreshControl refreshing={false} onRefresh={() => openTextCapture()} /> : undefined
          }
          onScrollEndDrag={e =>
            e.nativeEvent.contentOffset.y < -PULL_TO_CAPTURE &&
            openTextCapture()
          }
          showsVerticalScrollIndicator={false}>
          <Text
            style={{
              position: 'absolute',
              top: -40,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: designTokens.textTertiary,
              fontSize: 13,
            }}>
            Pull to capture
          </Text>
          {showProgress ? <DayProgress day={selectedDate} /> : null}

          {!loading && isToday && now ? (
            // The next task fades in once the done one has swiped away.
            <Appear key={now.id} style={{marginTop: 20}}>
              <Selectable item={now} onOpen={() => openTask(now)}>
                {select => (
                  <NowCard
                    task={now}
                    {...select}
                    onComplete={() => complete(now, true)}
                    onReschedule={() => openReschedule(now)}
                  />
                )}
              </Selectable>
            </Appear>
          ) : null}

          {error ? (
            <Text
              style={{
                color: designTokens.textSecondary,
                fontSize: 13,
                marginTop: 16,
              }}>
              {error}
            </Text>
          ) : null}

          {loading ? <FocusLoadingState /> : null}

          {!loading && dayTasks.length === 0 ? <FocusEmptyState allDone={progress.total > 0 && progress.done === progress.total} /> : null}

          {!loading && isToday && dayTasks.length === 0 ? <Suggestions /> : null}

          {!loading && !isToday && dayList.length > 0 ? (
            <View style={{marginTop: 20}}>{dayList.map(renderRow)}</View>
          ) : null}

          {!loading && previewTasks.length > 0 ? (
            <View style={{marginTop: dayList.length ? 0 : 20}}>
              {previewTasks.map(task => <GhostRow key={`repeat-${task.id}`} task={task} />)}
            </View>
          ) : null}

          {!loading && freeUntil ? (
            // A come-back fills the free stretch; with none (or hidden), the mascot says you're free.
            <Suggestions
              before={
                <Text style={{color: designTokens.textSecondary, fontSize: 15, marginBottom: 12}}>
                  Free until {freeUntil.format('h:mm A')}
                </Text>
              }
              fallback={<FreeStretch until={freeUntil.format('h:mm A')} />}
            />
          ) : null}

          {!loading && isToday && next.length > 0 ? (
            <CollapsibleSection label="Next" count={next.length}>
              {next.map(renderRow)}
            </CollapsibleSection>
          ) : null}

          {!loading && isToday && later.length > 0 ? (
            <CollapsibleSection
              label="Later"
              count={later.length}
              defaultOpen={false}>
              {later.map(renderRow)}
            </CollapsibleSection>
          ) : null}
        </ScrollView>
      )}

      <DateSheet
        visible={rescheduling !== null}
        onClose={() => setRescheduling(null)}
        withTime
        onSelect={date => {
          const task = rescheduling;
          if (task) runAction(() => rescheduleTask(task.id, date));
        }}
      />
    </TabScreenShell>
  );
}
