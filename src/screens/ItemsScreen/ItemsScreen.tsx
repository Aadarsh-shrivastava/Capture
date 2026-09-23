import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { TabScreenShell } from '@/components/TabScreenShell/TabScreenShell';
import { useItemsData } from '@/hooks/useItemsData';
import { EmptyState } from '@/ui/components/EmptyState';
import { FilterChip, ItemRow } from '@/ui/components/ItemComponents';
import { SearchBar } from '@/ui/components/SearchBar';
import { getItemTypeConfig, ITEM_TYPE_ORDER } from '@/ui/itemTypeConfig';
import { useThemeStore } from '@/store/themeStore';

type FilterKey = 'all' | number;

export function ItemsScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { items, types, error, refresh } = useItemsData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const orderedTypes = useMemo(() => {
    return [...types].sort((a, b) => {
      const aIndex = ITEM_TYPE_ORDER.indexOf(a.name as (typeof ITEM_TYPE_ORDER)[number]);
      const bIndex = ITEM_TYPE_ORDER.indexOf(b.name as (typeof ITEM_TYPE_ORDER)[number]);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [types]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (params.type && types.length > 0) {
      const match = types.find((type) => type.name === params.type);
      if (match) setFilter(match.id);
    }
  }, [params.type, types]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (filter !== 'all') {
      result = result.filter((item) => item.typeId === filter);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.content?.toLowerCase().includes(query) ?? false)
      );
    }

    return result;
  }, [filter, items, search]);

  const activeTypeName =
    filter !== 'all' ? types.find((type) => type.id === filter)?.name : undefined;

  const emptyMessage = useMemo(() => {
    if (search.trim()) return 'No matching items.';
    if (activeTypeName === 'Journal') return 'Start writing.';
    if (activeTypeName === 'Note') return 'No notes yet.';
    if (activeTypeName === 'Idea') return 'No ideas yet.';
    return 'Nothing here yet.';
  }, [activeTypeName, search]);

  return (
    <TabScreenShell title="Library">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBar value={search} onChangeText={setSearch} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          {orderedTypes.map((type) => {
            const config = getItemTypeConfig(type.name);
            return (
              <FilterChip
                key={type.id}
                label={type.name}
                icon={config.icon}
                active={filter === type.id}
                onPress={() => setFilter(type.id)}
              />
            );
          })}
        </View>

        {error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginTop: 12 }}>{error}</Text>
        ) : null}

        {filteredItems.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          filteredItems.map((item) => (
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
    </TabScreenShell>
  );
}
