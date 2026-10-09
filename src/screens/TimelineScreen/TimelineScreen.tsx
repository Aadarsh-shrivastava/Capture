import {useCallback} from 'react';
import {ScrollView, Text} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {useTimelineData} from '@/hooks/useTimelineData';
import {
  TimelineEmptyState,
  TimelineEventRow,
  TimelineLoadingState,
} from '@/ui/components/TimelineComponents';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

export function TimelineScreen() {
  const {theme} = useThemeStore();
  const {spacing} = theme;
  const router = useRouter();
  const {events, loading, error, refresh} = useTimelineData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <TabScreenShell title="Timeline">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        showsVerticalScrollIndicator={false}>
        <Text
          style={{
            color: designTokens.textSecondary,
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 24,
          }}>
          A running log of what you've captured — useful for reflection later.
        </Text>

        {error ? (
          <Text style={{color: designTokens.textSecondary, fontSize: 13, marginBottom: 12}}>{error}</Text>
        ) : null}

        {loading ? <TimelineLoadingState /> : null}

        {!loading && events.length === 0 ? <TimelineEmptyState /> : null}

        {!loading
          ? events.map((event) => {
              const itemId = event.id.replace('created-', '');
              return (
                <TimelineEventRow
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/item/${itemId}`)}
                />
              );
            })
          : null}
      </ScrollView>
    </TabScreenShell>
  );
}
