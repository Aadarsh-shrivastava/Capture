import {useCallback, useMemo} from 'react';
import {ScrollView, Text, useWindowDimensions, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';

import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {LibraryGroups} from '@/groups';
import {useItemsData} from '@/hooks/useItemsData';
import {TypeGridCard} from '@/ui/components/ItemCard';
import {designTokens} from '@/ui/designTokens';
import {allTypeNames} from '@/ui/itemTypeConfig';

const COLUMNS = 3;
const GRID_GAP = 12;
const SCREEN_PADDING = 20;

export function ItemsScreen() {
  const router = useRouter();
  const {width} = useWindowDimensions();
  const {items, types, error, refresh} = useItemsData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const availableTypes = useMemo(() => {
    const known = types.map((type) => type.name);
    return allTypeNames().filter((name) => known.includes(name));
  }, [types]);

  const cellWidth = (width - SCREEN_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  /** Pad the last row so cards keep their column width. */
  const placeholders = (COLUMNS - (availableTypes.length % COLUMNS)) % COLUMNS;

  return (
    <TabScreenShell
      title="Capture"
      action={{icon: 'search', label: 'Search library', onPress: () => router.push('/search')}}>
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {error ? (
          <Text style={{color: designTokens.textSecondary, fontSize: 13, marginBottom: 12}}>
            {error}
          </Text>
        ) : null}

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

        <LibraryGroups />
      </ScrollView>
    </TabScreenShell>
  );
}
