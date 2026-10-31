import moment from 'moment';
import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';

import { openDailyReview } from '@/dailyReview';
import { openWeeklyReview } from '@/weeklyReview';
import { runReminderJobNow } from '@/notifications';
import { useSelectiveKnowledgeStore } from '@/selectiveKnowledge/store';
import { useAppStyles } from '@/ui/appStyles';
import { PrimaryButton } from '@/ui/components/Primitives';

/** Dev-only tools. Add new test buttons and experimental switches here. */
export function DevPanel({ onClose }: { onClose: () => void }) {
  const styles = useAppStyles();
  const selective = useSelectiveKnowledgeStore();
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

        <Text style={styles.sectionLabel}>Capture</Text>
        <View style={[styles.row, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Agentic capture (selective knowledge)</Text>
            <Text style={styles.rowMeta}>
              On by default. Off = old single-prompt parser. Resets on app restart.
            </Text>
          </View>
          <Switch value={selective.enabled} onValueChange={selective.setEnabled} />
        </View>
    </View>
  );
}
