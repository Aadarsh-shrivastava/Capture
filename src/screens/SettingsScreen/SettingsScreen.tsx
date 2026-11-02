import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Pressable } from '@/ui/HapticPressable';
import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import { useReminderSettings } from '@/notifications';
import { POSTPONE_OPTIONS, usePostponeSettings } from '@/taskActions';
import { SelectField } from '@/ui/components/SelectField';
import { useThemeStore } from '@/store/themeStore';
import { getVaultConfig } from '@/vault';
import { useRouter } from 'expo-router';
import { useAppStyles } from '@/ui/appStyles';

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: string;
};

function SettingsRow({ icon, title, subtitle, onPress, trailing }: SettingsRowProps) {
  const styles = useAppStyles();
  const { theme } = useThemeStore();
  const { colors } = theme;

  const content = (
    <View style={[styles.row, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
      <Ionicons name={icon} size={20} color={colors.onSurfaceVariant} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowMeta}>{subtitle}</Text> : null}
      </View>
      {trailing ? (
        <Text style={[styles.rowMeta, { marginTop: 0 }]}>{trailing}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

export function SettingsScreen() {
  const styles = useAppStyles();
  const router = useRouter();
  const reminders = useReminderSettings();
  const postpone = usePostponeSettings();
  const vault = getVaultConfig();

  return (
    <ScreenShell title="Settings" leading="back">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Items</Text>
        <SettingsRow
          icon="shapes-outline"
          title="Item types"
          subtitle="Create types and choose their behaviors"
          onPress={() => router.push('/settings/types')}
        />

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={[styles.row, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Task reminders</Text>
            <Text style={styles.rowMeta}>Nudges before timed tasks, plus an 8 AM summary.</Text>
          </View>
          <Switch value={reminders.enabled} onValueChange={reminders.setEnabled} />
        </View>

        <Text style={styles.sectionLabel}>Tasks</Text>
        <View style={[styles.row, { gap: 10 }]}>
          <Text style={styles.rowTitle}>"Later" pushes a task by</Text>
          <SelectField
            title='"Later" pushes a task by'
            icon="time-outline"
            options={POSTPONE_OPTIONS.map((h) => ({ label: `${h} hour${h === 1 ? '' : 's'}`, value: String(h) }))}
            value={String(postpone.hours)}
            onChange={(v) => postpone.setHours(Number(v))}
          />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        {vault ? (
          <SettingsRow
            icon="folder-outline"
            title="Vault"
            subtitle={vault.location === 'files' ? 'In the Files app' : 'Private to the app'}
            trailing={vault.name}
          />
        ) : null}
        <SettingsRow icon="information-circle-outline" title="Version" trailing="0.0.1" />
      </ScrollView>
    </ScreenShell>
  );
}
