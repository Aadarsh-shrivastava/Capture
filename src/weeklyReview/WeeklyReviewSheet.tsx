import Storage from 'expo-sqlite/kv-store';
import {useCallback, useEffect, useState} from 'react';
import {AppState, ScrollView, Text, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {isDailyReviewOpen, openDailyReview} from '@/dailyReview';
import {useDatabaseReady} from '@/providers/DatabaseProvider';
import {taskHistoryRepository, type TaskHistoryRow} from '@/repositories/taskHistoryRepository';
import {SecondaryButton} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

import {useWeeklyReviewStore} from './store';
import {isReviewTime, weekKey, weekSummary, type WeekSummary} from './utils';

const SHOWN_KEY = 'weeklyReview.lastShownWeek';
const LIST_LIMIT = 5;

function Section({label, rows, empty}: {label: string; rows: TaskHistoryRow[]; empty: string}) {
  return (
    <View style={{marginBottom: 18}}>
      <Text style={{color: designTokens.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 6}}>
        {label} <Text style={{color: designTokens.textTertiary, fontWeight: '400'}}>{rows.length}</Text>
      </Text>
      {rows.length === 0 ? (
        <Text style={{color: designTokens.textTertiary, fontSize: 14}}>{empty}</Text>
      ) : (
        rows.slice(0, LIST_LIMIT).map(r => (
          <Text key={r.id} numberOfLines={1} style={{color: designTokens.textPrimary, fontSize: 15, paddingVertical: 4}}>
            {r.title}
          </Text>
        ))
      )}
      {rows.length > LIST_LIMIT ? (
        <Text style={{color: designTokens.textTertiary, fontSize: 13}}>+{rows.length - LIST_LIMIT} more</Text>
      ) : null}
    </View>
  );
}

/** Sunday evening: what got done, what slipped, what's next week. */
export function WeeklyReviewSheet() {
  const dbReady = useDatabaseReady();
  const {visible, open, close} = useWeeklyReviewStore();
  const [summary, setSummary] = useState<WeekSummary | null>(null);

  const load = useCallback(async () => setSummary(weekSummary(await taskHistoryRepository.findAll(), new Date())), []);

  useEffect(() => {
    if (!dbReady) return;
    const check = () => {
      const now = new Date();
      if (!isReviewTime(now) || Storage.getItemSync(SHOWN_KEY) === weekKey(now) || isDailyReviewOpen()) return;
      Storage.setItemSync(SHOWN_KEY, weekKey(now));
      open();
    };
    const timer = setTimeout(check, 1500); // let the daily review claim the screen first
    const sub = AppState.addEventListener('change', state => state === 'active' && check());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [dbReady, open]);

  useEffect(() => {
    if (visible) load().catch(() => {});
  }, [visible, load]);

  return (
    <Sheet visible={visible} onClose={close} title="Your week">
      <ScrollView style={{maxHeight: 460}} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 12}}>
        {summary ? (
          <>
            <Section label="Done" rows={summary.done} empty="Nothing completed this week." />
            <Section label="Slipped" rows={summary.slipped} empty="Nothing overdue. Nice." />
            <Section label="Coming up next week" rows={summary.upcoming} empty="Next week is open." />
            {summary.slipped.length > 0 ? (
              <SecondaryButton
                label="Sort out slipped tasks"
                onPress={() => {
                  close();
                  setTimeout(openDailyReview, 350); // iOS can't present a sheet over another
                }}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
