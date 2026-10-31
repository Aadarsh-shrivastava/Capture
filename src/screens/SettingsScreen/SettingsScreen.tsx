import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Pressable } from '@/ui/HapticPressable';
import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import { DB_VERSION } from '@/db/database';
import { useReminderSettings } from '@/notifications';
import { POSTPONE_OPTIONS, usePostponeSettings } from '@/taskActions';
import { SelectChip } from '@/ui/components/Primitives';
import { useThemeStore } from '@/store/themeStore';
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
  const { themeName, theme } = useThemeStore();
  const reminders = useReminderSettings();
  const postpone = usePostponeSettings();

  return (
    <ScreenShell title="Settings" leading="back">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>LockedIn V1 · Focus-first</Text>

        <Text style={styles.sectionLabel}>General</Text>
        <SettingsRow
          icon="color-palette-outline"
          title="Appearance"
          subtitle="Theme switching is not available yet — app uses a single dark theme."
          trailing={theme.name}
        />

        <Text style={styles.sectionLabel}>Data</Text>
        <SettingsRow
          icon="server-outline"
          title="Storage"
          subtitle="All items stored locally on device"
          trailing="SQLite"
        />
        <SettingsRow
          icon="git-branch-outline"
          title="Database schema"
          trailing={`v${DB_VERSION}`}
        />

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={[styles.row, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Task reminders</Text>
            <Text style={styles.rowMeta}>Nudges 30 and 5 min before timed tasks, plus an 8 AM summary.</Text>
          </View>
          <Switch value={reminders.enabled} onValueChange={reminders.setEnabled} />
        </View>

        <Text style={styles.sectionLabel}>Tasks</Text>
        <View style={[styles.row, { gap: 10 }]}>
          <Text style={styles.rowTitle}>"Later" pushes a task by</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {POSTPONE_OPTIONS.map((h) => (
              <SelectChip key={h} label={`${h}h`} active={postpone.hours === h} onPress={() => postpone.setHours(h)} />
            ))}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Capture</Text>
        <SettingsRow
          icon="mic-outline"
          title="Voice capture"
          subtitle="Uses on-device speech recognition. Works best on a physical device."
        />
        <SettingsRow
          icon="sparkles-outline"
          title="AI analysis"
          subtitle="Optional on-device Qwen model for smarter capture parsing"
        />

        <Text style={styles.sectionLabel}>About</Text>
        <SettingsRow icon="information-circle-outline" title="Version" trailing="0.0.1" />
        <SettingsRow
          icon="code-slash-outline"
          title="Active theme key"
          trailing={themeName}
        />
      </ScrollView>
    </ScreenShell>
  );
}
