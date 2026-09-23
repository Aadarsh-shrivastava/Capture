import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { TabScreenShell } from '@/components/TabScreenShell/TabScreenShell';
import {
  buildActivityMap,
  countByType,
  useItemsData,
} from '@/hooks/useItemsData';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { useThemeStore } from '@/store/themeStore';

import { ActionGrid } from './components/ActionGrid';
import { ActivitySection } from './components/ActivitySection';
import { HomeHeader } from './components/HomeHeader';
import { ActiveSessionCard } from './components/PriorityCard';

export function HomeScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const { items, refresh } = useItemsData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const activity = buildActivityMap(items);
  const weekCaptured = items.filter((item) => {
    const created = new Date(item.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  }).length;

  return (
    <TabScreenShell title="Home">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <ActiveSessionCard />
        <SectionHeader label="Quick Access" />
        <ActionGrid
          taskCount={countByType(items, 'Task')}
          noteCount={countByType(items, 'Note')}
          journalCount={countByType(items, 'Journal')}
          ideaCount={countByType(items, 'Idea')}
        />
        <ActivitySection
          activity={activity}
          completedCount={countByType(items, 'Task')}
          capturedCount={weekCaptured}
        />
      </ScrollView>
    </TabScreenShell>
  );
}
