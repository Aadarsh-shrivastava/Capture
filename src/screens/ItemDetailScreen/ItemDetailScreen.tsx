import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { itemApi } from '@/api/itemApi';
import { HeaderButton } from '@/components/ScreenHeader/ScreenHeader';
import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import type { ItemFull } from '@/models/behaviorData';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { TypeBadge } from '@/ui/components/TypeBadge';
import { designTokens, formatRelativeDay } from '@/ui/designTokens';
import { formatDateTimeForDisplay } from '@/ui/formatDateTime';
import { getItemTypeConfig } from '@/ui/itemTypeConfig';
import { useThemeStore } from '@/store/themeStore';

export function ItemDetailScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = Number(params.id);

  const [item, setItem] = useState<ItemFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    if (Number.isNaN(itemId)) {
      setError('Invalid item');
      return;
    }

    try {
      setError(null);
      const full = await itemApi.getItemFull(itemId);
      setItem(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load item');
    }
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  function confirmDelete() {
    if (!item) return;
    Alert.alert('Delete item', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await itemApi.deleteItem(item.id);
          router.replace('/(tabs)/library');
        },
      },
    ]);
  }

  if (!item) {
    return (
      <ScreenShell title="Item" leading="back">
        <View style={{ padding: spacing.marginMobile }}>
          <Text style={{ color: designTokens.textSecondary }}>{error ?? 'Loading…'}</Text>
        </View>
      </ScreenShell>
    );
  }

  const typeConfig = getItemTypeConfig(item.typeName);
  const visitable = item.behaviorData.Visitable;
  const doable = item.behaviorData.Doable;
  const dueAt = doable?.due_at?.trim();

  return (
    <ScreenShell
      title={item.typeName}
      leading="back"
      right={<HeaderButton label="Edit" onPress={() => router.push(`/create-item?id=${item.id}`)} />}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
      >
        <TypeBadge typeName={item.typeName} size="md" />

        <Text
          style={{
            color: designTokens.textPrimary,
            fontSize: 28,
            fontWeight: '600',
            letterSpacing: -0.4,
            lineHeight: 34,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          {item.title}
        </Text>

        <Text style={{ color: designTokens.textTertiary, fontSize: 13, marginBottom: 16 }}>
          {typeConfig.hint} · {formatRelativeDay(item.createdAt)}
        </Text>

        {item.content ? (
          <>
            <SectionHeader label="Content" />
            <Text style={{ color: designTokens.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 20 }}>
              {item.content}
            </Text>
          </>
        ) : null}

        {(item.importance != null || item.urgency != null || dueAt) && (
          <Text style={{ color: designTokens.textTertiary, fontSize: 13, marginBottom: 16 }}>
            {item.importance != null ? `Importance ${item.importance}` : ''}
            {item.importance != null && item.urgency != null ? ' · ' : ''}
            {item.urgency != null ? `Urgency ${item.urgency}` : ''}
            {(item.importance != null || item.urgency != null) && dueAt ? ' · ' : ''}
            {dueAt ? `Due ${formatDateTimeForDisplay(dueAt)}` : ''}
          </Text>
        )}

        {doable && doable.status !== 'completed' ? (
          <Pressable
            style={{
              backgroundColor: designTokens.accent,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 12,
            }}
            onPress={async () => {
              await itemApi.saveItem(
                {
                  typeId: item.typeId,
                  title: item.title,
                  content: item.content,
                  importance: item.importance,
                  urgency: item.urgency,
                  status: item.status,
                  optionalBehaviorIds: item.optionalBehaviorIds,
                  behaviorData: {
                    ...item.behaviorData,
                    Doable: { ...doable, status: 'completed' },
                  },
                  groupIds: item.groupIds,
                  tagNames: item.tagNames,
                },
                item.id
              );
              await loadItem();
            }}
          >
            <Text style={{ color: designTokens.white, fontSize: 16, fontWeight: '600' }}>
              Complete
            </Text>
          </Pressable>
        ) : null}

        {visitable?.url ? (
          <Pressable
            onPress={() => Linking.openURL(visitable.url)}
            style={{
              borderWidth: 1,
              borderColor: designTokens.surfaceBorder,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: designTokens.accent, fontSize: 16, fontWeight: '500' }}>
              Open link →
            </Text>
          </Pressable>
        ) : null}

        {item.tagNames.length > 0 ? (
          <>
            <SectionHeader label="Tags" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {item.tagNames.map((tag) => (
                <View
                  key={tag}
                  style={{
                    borderWidth: 1,
                    borderColor: designTokens.surfaceBorder,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: designTokens.textSecondary, fontSize: 13 }}>#{tag}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Pressable onPress={confirmDelete} style={{ alignItems: 'center', paddingVertical: 14 }}>
          <Text style={{ color: '#ff8a80', fontSize: 15 }}>Delete</Text>
        </Pressable>

        {error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginTop: 12 }}>{error}</Text>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}
