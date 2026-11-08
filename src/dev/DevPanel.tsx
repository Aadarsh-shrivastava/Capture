import moment from 'moment';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { openDailyReview } from '@/dailyReview';
import { useOnboardingPreview } from '@/onboarding';
import { openWeeklyReview } from '@/weeklyReview';
import { runReminderJobNow } from '@/notifications';
import { makeAllDue } from '@/resurface';
import { useAppStyles } from '@/ui/appStyles';
import { PrimaryButton } from '@/ui/components/Primitives';

/** Dev-only tools. Add new test buttons and experimental switches here. */
export function DevPanel({ onClose }: { onClose: () => void }) {
  const styles = useAppStyles();
  const [running, setRunning] = useState(false);

  async function runReminderJob() {
    setRunning(true);
    try {
      const reminders = await runReminderJobNow();
      const lines = reminders.map(
        (r) => `${moment(r.at).format('h:mm A')} · ${r.task.title} (${r.minutesBefore} min before)`,
      );
      Alert.alert(
        `Scheduled ${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`,
        lines.length ? `${lines.join('\n')}\n\nSent the first one now as a preview.` : 'No timed tasks due later today.',
      );
    } catch (err) {
      Alert.alert('Reminder job failed', err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <Text style={styles.rowMeta}>
          Runs the reminder job now (today → not done → timed) and shows the next reminder immediately.
        </Text>
        <PrimaryButton label="Run reminder job" icon="notifications-outline" loading={running} onPress={runReminderJob} />

        <Text style={styles.sectionLabel}>Daily review</Text>
        <PrimaryButton compact label="Show leftovers review" icon="albums-outline" onPress={() => {
          onClose();
          setTimeout(openDailyReview, 350); // iOS can't present a sheet over another
        }} />

        <PrimaryButton compact label="Show weekly review" icon="calendar-outline" onPress={() => {
          onClose();
          setTimeout(openWeeklyReview, 350);
        }} />

        <Text style={styles.sectionLabel}>Come back</Text>
        <PrimaryButton compact label="Make all suggestions due now" icon="sparkles-outline" onPress={async () => {
          try {
            const n = await makeAllDue();
            Alert.alert(
              `${n} suggestion${n === 1 ? '' : 's'} due`,
              n ? 'Cards show on Focus when today is clear, or under Now when it is 45+ min away (up to 3, one per kind).' : 'No items with Come back on. Capture an idea first.',
            );
          } catch (err) {
            Alert.alert('Failed', err instanceof Error ? err.message : String(err));
          }
        }} />

        <Text style={styles.sectionLabel}>Onboarding</Text>
        <PrimaryButton compact label="Replay onboarding" icon="play-outline" onPress={() => {
          onClose();
          // Preview mode: your vault and data are untouched; only the profile step saves.
          setTimeout(() => useOnboardingPreview.getState().setPreview(true), 350);
        }} />

    </View>
  );
}
