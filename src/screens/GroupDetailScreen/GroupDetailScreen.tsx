import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { groupApi } from '@/api/groupApi';
import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import type { GroupWithCount } from '@/models/group';
import type { ItemWithType } from '@/models/item';
import { EmptyState } from '@/ui/components/EmptyState';
import { ItemRow } from '@/ui/components/ItemComponents';
import { designTokens } from '@/ui/designTokens';
import { useThemeStore } from '@/store/themeStore';

export function GroupDetailScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = Number(params.id);

  const [group, setGroup] = useState<GroupWithCount | null>(null);
  const [items, setItems] = useState<ItemWithType[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    if (Number.isNaN(groupId)) {
      setError('Invalid group');
      return;
    }

    try {
      setError(null);
      const [loadedGroup, loadedItems] = await Promise.all([
        groupApi.getGroup(groupId),
        groupApi.getGroupItems(groupId),
      ]);
      setGroup(loadedGroup);
      setItems(loadedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load group');
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [loadGroup])
  );

  if (!group) {
    return (
      <ScreenShell title="Group" leading="back">
        <View style={{ padding: spacing.marginMobile }}>
          <Text style={{ color: designTokens.textSecondary }}>{error ?? 'Loading…'}</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={group.name} leading="back">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
      >
        <Text style={{ color: designTokens.textTertiary, fontSize: 14, marginBottom: 24 }}>
          {group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}
        </Text>

        {error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginBottom: 12 }}>{error}</Text>
        ) : null}

        {items.length === 0 ? (
          <EmptyState message="No items in this group yet." />
        ) : (
          items.map((item) => (
            <ItemRow
              key={item.id}
              title={item.title}
              typeName={item.typeName}
              createdAt={item.createdAt}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}
