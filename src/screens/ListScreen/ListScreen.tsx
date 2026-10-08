import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import { useItemsData } from '@/hooks/useItemsData';
import { EmptyState } from '@/ui/components/EmptyState';
import { ItemCard } from '@/ui/components/ItemCard';
import { SearchBar } from '@/ui/components/SearchBar';
import { getItemTypeConfig } from '@/ui/itemTypeConfig';
import { designTokens } from '@/ui/designTokens';

export function ListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { items, types, error, refresh } = useItemsData();
  const [search, setSearch] = useState('');

  const activeType = useMemo(() => {
    if (!params.type || types.length === 0) return null;
    return types.find((t) => t.name === params.type) ?? null;
  }, [params.type, types]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (types.length === 0) return;
    if (!params.type || !activeType) {
      router.back();
    }
  }, [types.length, params.type, activeType, router]);

  const typeConfig = activeType ? getItemTypeConfig(activeType.name) : null;

  const filteredItems = useMemo(() => {
    if (!activeType) return [];

    let result = items.filter((item) => item.typeId === activeType.id);

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.content?.toLowerCase().includes(query) ?? false),
      );
    }

    return result;
  }, [items, activeType, search]);

  const emptyMessage = useMemo(() => {
    if (search.trim()) return 'No matching items.';
    if (activeType?.name === 'Journal') return 'Start writing.';
    if (activeType?.name === 'Note') return 'No notes yet.';
    if (activeType?.name === 'Idea') return 'No ideas yet.';
    if (activeType?.name === 'Task') return 'No tasks yet.';
    return 'Nothing here yet.';
  }, [activeType?.name, search]);

  if (!activeType) {
    return null;
  }

  return (
    <ScreenShell title={typeConfig?.plural ?? activeType.name} leading="back">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchBar value={search} onChangeText={setSearch} />

        {error ? (
          <Text style={{ color: designTokens.textSecondary, fontSize: 13, marginBottom: 12 }}>
            {error}
          </Text>
        ) : null}

        {filteredItems.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <View style={{ gap: 10 }}>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                typeName={item.typeName}
                createdAt={item.createdAt}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
