import {useCallback, useMemo, useState} from 'react';
import {ScrollView, Text, useWindowDimensions, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {useItemsData} from '@/hooks/useItemsData';
import {EmptyState} from '@/ui/components/EmptyState';
import {ItemCard, TypeGridCard} from '@/ui/components/ItemCard';
import {SearchBar} from '@/ui/components/SearchBar';
import {designTokens} from '@/ui/designTokens';
import {ITEM_TYPE_ORDER} from '@/ui/itemTypeConfig';

const COLUMNS = 3;
const GRID_GAP = 12;
const SCREEN_PADDING = 20;

export function ItemsScreen() {
  const router = useRouter();
  const {width} = useWindowDimensions();
  const {items, types, error, refresh} = useItemsData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const availableTypes = useMemo(() => {
    const known = types.map((type) => type.name);
    const ordered = ITEM_TYPE_ORDER.filter((name) => known.includes(name));
    const extra = known.filter((name) => !ordered.includes(name as never));
    return [...ordered, ...extra];
  }, [types]);

  const query = search.trim().toLowerCase();

  const matchingItems = useMemo(() => {
    if (!query) return [];
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.content?.toLowerCase().includes(query) ?? false),
    );
  }, [items, query]);

  const cellWidth = (width - SCREEN_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  /** Pad the last row so cards keep their column width. */
  const placeholders = (COLUMNS - (availableTypes.length % COLUMNS)) % COLUMNS;

  return (
    <TabScreenShell
      title="Library"
      action={{
        icon: searchOpen ? 'close' : 'search',
        label: 'Search library',
        onPress: () => {
          setSearchOpen((open) => !open);
          setSearch('');
        },
      }}>
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {searchOpen ? (
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search library" />
        ) : null}

        {error ? (
          <Text style={{color: designTokens.textSecondary, fontSize: 13, marginBottom: 12}}>
            {error}
          </Text>
        ) : null}

        {query ? (
          matchingItems.length === 0 ? (
            <EmptyState message="No matching items." />
          ) : (
            <View style={{gap: 10}}>
              {matchingItems.map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.title}
                  typeName={item.typeName}
                  createdAt={item.createdAt}
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              ))}
            </View>
          )
        ) : (
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP}}>
            {availableTypes.map((typeName) => (
              <View key={typeName} style={{width: cellWidth}}>
                <TypeGridCard
                  typeName={typeName}
                  count={items.filter((item) => item.typeName === typeName).length}
                  onPress={() =>
                    router.push({pathname: '/library/list', params: {type: typeName}})
                  }
                />
              </View>
            ))}
            {Array.from({length: placeholders}).map((_, index) => (
              <View key={`pad-${index}`} style={{width: cellWidth}} />
            ))}
          </View>
        )}
      </ScrollView>
    </TabScreenShell>
  );
}
