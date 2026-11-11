import moment from 'moment';
import * as Haptics from 'expo-haptics';
import {useCallback, useMemo, useRef, useState} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {DateSheet} from '@/components/sheets/DateSheet';
import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {useFocusData} from '@/hooks/useFocusData';
import {useCaptureStore} from '@/store/captureStore';
import {useLingeringDone} from '@/hooks/useLingeringDone';
import {Appear, SlideOut} from '@/motion';
import {GhostRow, useRepeatPreview} from '@/recurrence';
import {PullComeBack, Suggestions} from '@/resurface';
import {UpcomingView, useCurrentView, useViewStore, ViewPicker} from '@/views';
import {useDayProgress} from '@/progress';
import {Composer} from '@/capture/Composer';
import {QuickCheck} from '@/capture/QuickCheck';
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
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

/** How far down you pull from the top before letting go shows (or hides) the peek. */
const PULL_TO_PEEK = 80;

/** Shown on a pull when today has tasks: one at a time, a different one each pull. */
const TIPS = [
  'Pull the Now card down to push it 2 hours later.',
  'Swipe the Now card right when it’s done, left to pick another day.',
  'Long-press any empty space to speak a thought.',
  'Say when: “tomorrow at 6”, “next friday”, “in 2 hours” become the due date.',
  'Notes, ideas and journal entries are kept word for word.',
  'Long-press a task to select several at once.',
];

export function FocusScreen() {
  const router = useRouter();
  const {tasks, loading, error, refresh} = useFocusData();
  const [rescheduling, setRescheduling] = useState<FocusTask | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const openVoiceCapture = useCaptureStore(state => state.openVoiceCapture);
  // Pull down from the top: a come-back when the day is empty, else a tip. Nothing refreshes (the data is live).
  const [peek, setPeek] = useState<number | null>(null);
  // `snoozed`: this drag dropped the Now card (+2 h), so it isn't also a page pull.
  const pull = useRef<{startY: number; atTop: boolean; snoozed: boolean}>({startY: 0, atTop: true, snoozed: false});
  const scrollY = useRef(0);
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
  // Guessed to-dos wait in "Is this something to do?" until answered — they never take over Now.
  const unsureTasks = useMemo(() => tasks.filter(t => t.unsure), [tasks]);
  const dayTasks = useMemo(
    () => tasksForDay(withLingering(tasks.filter(t => !t.unsure)), selected),
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

  /** Pulled down: 2 hours from now, or from its own time if that's later. */
  function snooze(task: FocusTask) {
    pull.current.snoozed = true;
    const due = dueMoment(task);
    const from = due && due.isAfter(moment()) ? due : moment();
    runAction(() => rescheduleTask(task.id, from.clone().add(2, 'hours').seconds(0).format()));
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
            paddingBottom: 120, // clear of the input bar
            flexGrow: 1,
          }}
          // Raw touches, not scroll events: Android has no overscroll, and this sees the drag even when nothing scrolls.
          scrollEventThrottle={16}
          onScroll={e => (scrollY.current = e.nativeEvent.contentOffset.y)}
          onTouchStart={e => {
            pull.current = {startY: e.nativeEvent.pageY, atTop: scrollY.current <= 0, snoozed: false};
          }}
          onTouchEnd={e => {
            const {startY, atTop} = pull.current;
            if (!atTop || e.nativeEvent.pageY - startY < PULL_TO_PEEK) return;
            // A quick pull on the Now card is a page pull too; only a slow drag-and-drop on it snoozes. The card's
            // release runs in this same touch end, so check its flag once this event is done.
            setTimeout(() => {
              if (pull.current.snoozed) return;
              void Haptics.selectionAsync();
              setPeek(p => (p === null ? Math.floor(Math.random() * TIPS.length) : null));
            }, 0);
          }}
          showsVerticalScrollIndicator={false}>
          {/* Long-press empty space: speak a thought. Taps and presses on anything inside still go to that thing. */}
          <Pressable haptic={false} pressScale={false} onLongPress={openVoiceCapture} delayLongPress={450} accessible={false} style={{flexGrow: 1}}>
          {isToday ? <QuickCheck items={unsureTasks} /> : null}

          {peek !== null ? (
            // Pulled down: an old idea or note, on top of the Now card — only an edge of it shows underneath.
            <Appear from="up" style={{marginTop: 20, marginBottom: now ? 10 : 0}}>
              {now && isToday && !loading ? (
                <View
                  pointerEvents="none"
                  style={{position: 'absolute', left: 14, right: 14, bottom: -10, height: 40, borderRadius: radius.xl, backgroundColor: designTokens.cardPressed, borderWidth: 1, borderColor: designTokens.surfaceBorder}}
                />
              ) : null}
              <PullComeBack onDismiss={() => setPeek(null)} fallback={<PeekTip text={TIPS[peek]} onClose={() => setPeek(null)} />} />
            </Appear>
          ) : null}

          {!loading && isToday && now && peek === null ? (
            // The next task fades in once the done one has swiped away (and again when the come-back is put away).
            <Appear key={now.id} style={{marginTop: 20}}>
              <Selectable item={now} onOpen={() => openTask(now)}>
                {select => (
                  <NowCard
                    task={now}
                    {...select}
                    onComplete={() => complete(now, true)}
                    onReschedule={() => openReschedule(now)}
                    onSnooze={() => snooze(now)}
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
          </Pressable>
        </ScrollView>
      )}

      <Composer floating />

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

/** The pull-down peek when nothing is set to come back yet: one tip, tap to put it away. */
function PeekTip({text, onClose}: {text: string; onClose: () => void}) {
  return (
    <Pressable onPress={onClose} accessibilityRole="button" accessibilityHint="Hides the tip" style={{padding: 16, borderRadius: radius.lg, backgroundColor: designTokens.card, borderWidth: 1, borderColor: designTokens.surfaceBorder}}>
      <Text style={{color: designTokens.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4}}>TIP</Text>
      <Text style={{color: designTokens.textPrimary, fontSize: 15, lineHeight: 21}}>{text}</Text>
    </Pressable>
  );
}
