import { useState } from 'react';
import { Alert, Platform, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import { OptionsSheet } from '@/components/sheets/OptionsSheet';
import { ModelRow } from '@/model';
import { setCaptureNotificationEnabled, useCaptureNotificationSetting, useReminderSettings } from '@/notifications';
import { POSTPONE_OPTIONS, usePostponeSettings } from '@/taskActions';
import { SettingsCard } from '@/ui/components/SettingsCard';
import { getVaultConfig } from '@/vault';

const hoursLabel = (h: number) => `${h} hour${h === 1 ? '' : 's'}`;

/** Every setting is one card; options open a bottom sheet. */
export function SettingsScreen() {
  const router = useRouter();
  const reminders = useReminderSettings();
  const postpone = usePostponeSettings();
  const captureNotification = useCaptureNotificationSetting();
  const vault = getVaultConfig();
  const [postponeOpen, setPostponeOpen] = useState(false);

  return (
    <ScreenShell title="Settings" leading="back">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 10 }}>
        <SettingsCard
          icon="shapes-outline"
          title="Item types"
          subtitle="Create types and choose their behaviors"
          onPress={() => router.push('/settings/types')}
        />
        <ModelRow />
        <SettingsCard
          icon="color-palette-outline"
          title="Appearance"
          subtitle="Companion, progress bar, tab bar"
          onPress={() => router.push('/settings/appearance')}
        />
        <SettingsCard
          icon="notifications-outline"
          title="Task reminders"
          subtitle="Nudges before timed tasks, plus an 8 AM summary"
          trailing={<Switch value={reminders.enabled} onValueChange={reminders.setEnabled} />}
        />
        <SettingsCard
          icon="create-outline"
          title={Platform.OS === 'ios' ? 'Dynamic Island' : 'Capture notification'}
          subtitle={
            Platform.OS === 'ios'
              ? 'Your current task, plus Type or Talk, in the Dynamic Island and lock screen'
              : 'Type or Talk from the shade and lock screen'
          }
          trailing={
            <Switch
              value={captureNotification.enabled}
              onValueChange={async v => {
                if (!(await setCaptureNotificationEnabled(v))) {
                  Alert.alert('Notifications are off', 'Allow notifications for Capture in system settings.');
                }
              }}
            />
          }
        />
        <SettingsCard
          icon="time-outline"
          title="Later pushes a task by"
          trailing={hoursLabel(postpone.hours)}
          onPress={() => setPostponeOpen(true)}
        />
        {vault ? (
          <SettingsCard
            icon="folder-outline"
            title="Vault"
            subtitle={vault.location === 'files' ? 'In the Files app' : 'Private to the app'}
            trailing={vault.name}
          />
        ) : null}
        <SettingsCard icon="information-circle-outline" title="Version" trailing="0.0.1" />
      </ScrollView>

      <OptionsSheet
        visible={postponeOpen}
        onClose={() => setPostponeOpen(false)}
        title="Later pushes a task by"
        value={String(postpone.hours)}
        options={POSTPONE_OPTIONS.map((h) => ({ label: hoursLabel(h), value: String(h) }))}
        onSelect={(v) => postpone.setHours(Number(v))}
      />
    </ScreenShell>
  );
}
