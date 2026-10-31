import {useMemo, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import type {ItemWithType} from '@/models/item';
import {SearchBar} from '@/ui/components/SearchBar';
import {TypeBadge} from '@/ui/components/TypeBadge';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';
import {Ionicons} from '@expo/vector-icons';

import {addCandidates} from './utils';

type Props = {
  visible: boolean;
  onClose: () => void;
  allItems: ItemWithType[];
  inGroup: ItemWithType[];
  onAdd: (itemId: number) => void;
};

/** Search existing items and tap to add; the sheet stays open for adding several. */
export function AddItemsSheet({visible, onClose, allItems, inGroup, onAdd}: Props) {
  const [query, setQuery] = useState('');
  const candidates = useMemo(() => addCandidates(allItems, inGroup, query), [allItems, inGroup, query]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Add to group" fullHeight>
      <View style={{paddingHorizontal: 20, flex: 1}}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search items" />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom: 24}}>
          {candidates.length === 0 ? (
            <Text style={{color: designTokens.textTertiary, fontSize: 14, paddingVertical: 24, textAlign: 'center'}}>
              {query ? 'No matching items.' : 'Everything is already in this group.'}
            </Text>
          ) : (
            candidates.map(item => (
              <Pressable
                key={item.id}
                onPress={() => onAdd(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.title}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: designTokens.divider,
                }}>
                <Ionicons name="add-circle-outline" size={20} color={designTokens.textSecondary} />
                <Text numberOfLines={1} style={{flex: 1, color: designTokens.textPrimary, fontSize: 15}}>
                  {item.title}
                </Text>
                <TypeBadge typeName={item.typeName} />
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
}
