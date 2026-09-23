import { useCallback, useMemo } from 'react';
import { ScrollView, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { TabScreenShell } from '@/components/TabScreenShell/TabScreenShell';
import { getNonTasks, getTasks, useItemsData } from '@/hooks/useItemsData';
import { EmptyState } from '@/ui/components/EmptyState';
import { ItemRow } from '@/ui/components/ItemComponents';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { NowTaskCard, ParkedSection, TaskListItem } from '@/ui/components/TodayComponents';
import { designTokens, formatLongDate } from '@/ui/designTokens';
import { useThemeStore } from '@/store/themeStore';

export function TodayScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const router = useRouter();
  const { items, error, refresh } = useItemsData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const tasks = useMemo(() => getTasks(items), [items]);
  const captured = useMemo(() => getNonTasks(items).slice(0, 5), [items]);
  const nowTask = tasks[0];
  const nextTasks = tasks.slice(1, 4);
  const laterTasks = tasks.slice(4);
  const hasTasks = tasks.length > 0;
  const hasCaptured = captured.length > 0;

  return (
    <TabScreenShell title="Today">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: designTokens.textSecondary,
            fontSize: 15,
            marginBottom: 28,
          }}
        >
          {formatLongDate(new Date())}
        </Text>

        {error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginBottom: 12 }}>{error}</Text>
        ) : null}

        {!hasTasks && !hasCaptured ? (
          <EmptyState message="Nothing needs your attention right now." />
        ) : (
          <>
            {hasTasks ? (
              <>
                <SectionHeader label="Now" />
                {nowTask ? (
                  <NowTaskCard
                    title={nowTask.title}
                    meta={`Task · ${formatLongDate(new Date(nowTask.createdAt))}`}
                    onPress={() => router.push(`/item/${nowTask.id}`)}
                  />
                ) : null}

                {nextTasks.length > 0 ? (
                  <>
                    <SectionHeader label="Next" />
                    {nextTasks.map((task) => (
                      <TaskListItem
                        key={task.id}
                        title={task.title}
                        variant="next"
                        onPress={() => router.push(`/item/${task.id}`)}
                      />
                    ))}
                  </>
                ) : null}

                {laterTasks.length > 0 ? (
                  <>
                    <SectionHeader label="Later" />
                    {laterTasks.map((task) => (
                      <TaskListItem
                        key={task.id}
                        title={task.title}
                        variant="later"
                        onPress={() => router.push(`/item/${task.id}`)}
                      />
                    ))}
                  </>
                ) : null}

                <ParkedSection count={0} />
              </>
            ) : (
              <EmptyState message="Nothing needs your attention right now." />
            )}

            {hasCaptured ? (
              <>
                <SectionHeader label="Captured" trailing="Notes & Journal" />
                {captured.map((item) => (
                  <ItemRow
                    key={item.id}
                    title={item.title}
                    typeName={item.typeName}
                    createdAt={item.createdAt}
                    onPress={() => router.push(`/item/${item.id}`)}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </TabScreenShell>
  );
}
