import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import {
  buildActivityMap,
  countByType,
  useItemsData,
} from '@/hooks/useItemsData';
import { ActivityHeatmap } from '@/ui/components/ActivityHeatmap';
import { SettingsRow } from '@/ui/components/ItemComponents';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { designTokens } from '@/ui/designTokens';
import { useThemeStore } from '@/store/themeStore';

export function ProfileScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const { items, refresh } = useItemsData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const activity = buildActivityMap(items, 3);
  const weekCaptured = items.filter((item) => {
    const created = new Date(item.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

  return (
    <ScreenShell title="Profile" leading="back">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: designTokens.surfaceRaised,
              borderWidth: 1,
              borderColor: designTokens.surfaceBorder,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Text style={{ color: designTokens.textPrimary, fontSize: 20, fontWeight: '600' }}>
              A
            </Text>
          </View>
          <Text style={{ color: designTokens.textPrimary, fontSize: 18, fontWeight: '500' }}>
            Aadarsh
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <View>
            <Text style={{ color: designTokens.textTertiary, fontSize: 12, marginBottom: 4 }}>
              Tasks completed
            </Text>
            <Text style={{ color: designTokens.textPrimary, fontSize: 20, fontWeight: '600' }}>
              {countByType(items, 'Task')}
            </Text>
          </View>
          <View>
            <Text style={{ color: designTokens.textTertiary, fontSize: 12, marginBottom: 4 }}>
              Focus time
            </Text>
            <Text style={{ color: designTokens.textPrimary, fontSize: 20, fontWeight: '600' }}>
              8h 32m
            </Text>
          </View>
          <View>
            <Text style={{ color: designTokens.textTertiary, fontSize: 12, marginBottom: 4 }}>
              Items captured
            </Text>
            <Text style={{ color: designTokens.textPrimary, fontSize: 20, fontWeight: '600' }}>
              {weekCaptured}
            </Text>
          </View>
        </View>

        <SectionHeader label="Activity" />
        <ActivityHeatmap activity={activity} />

        <SectionHeader label="Settings" />
        <SettingsRow label="Appearance" />
        <SettingsRow label="Notifications" />
        <SettingsRow label="Types" />
        <SettingsRow label="Behaviors" />
        <SettingsRow label="About" />
      </ScrollView>
    </ScreenShell>
  );
}
