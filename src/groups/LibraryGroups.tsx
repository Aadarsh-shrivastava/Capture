import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect, useRouter} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import type {GroupWithCount} from '@/models/group';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {designTokens, radius} from '@/ui/designTokens';
import {itemCountLabel} from '@/ui/components/ItemCard';
import {Pressable} from '@/ui/HapticPressable';

import {EditGroupSheet} from './EditGroupSheet';
import {groupsService} from './service';

const CARD = {
  width: 116,
  height: 108,
  padding: 12,
  gap: 8,
  borderRadius: radius.lg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

/** "Groups" row for the Library: one card per group plus a New card. */
export function LibraryGroups() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const version = useDataVersionStore(state => state.version);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    groupsService.getActiveGroups().then(setGroups).catch(() => setGroups([]));
  }, []);
  useFocusEffect(load);
  useEffect(load, [load, version]);

  return (
    <View style={{marginTop: 28}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
        <Text style={{color: designTokens.textPrimary, fontSize: 17, fontWeight: '600'}}>Groups</Text>
        <Pressable onPress={() => router.push('/groups')} hitSlop={10}>
          <Text style={{color: designTokens.textSecondary, fontSize: 14}}>See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12}}>
        {groups.map(group => (
          <Pressable
            key={group.id}
            onPress={() => router.push(`/group/${group.id}`)}
            accessibilityRole="button"
            style={({pressed}) => ({...CARD, backgroundColor: pressed ? designTokens.cardPressed : designTokens.card})}>
            <Ionicons name="folder-outline" size={22} color={designTokens.textSecondary} />
            <View style={{alignItems: 'center', gap: 2}}>
              <Text numberOfLines={1} style={{color: designTokens.white, fontSize: 15, fontWeight: '700'}}>
                {group.name}
              </Text>
              <Text style={{color: designTokens.textTertiary, fontSize: 12, minHeight: 15}}>
                {itemCountLabel(group.itemCount)}
              </Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setCreating(true)}
          accessibilityRole="button"
          accessibilityLabel="New group"
          style={{...CARD, borderWidth: 1, borderStyle: 'dashed', borderColor: designTokens.surfaceBorder}}>
          <Ionicons name="add" size={22} color={designTokens.textSecondary} />
          <Text style={{color: designTokens.textSecondary, fontSize: 15}}>New group</Text>
        </Pressable>
      </ScrollView>
      <EditGroupSheet
        visible={creating}
        onClose={() => setCreating(false)}
        title="New group"
        name=""
        description=""
        onSave={async (name, description) => {
          const group = await groupsService.createGroup(name, description);
          router.push(`/group/${group.id}`);
        }}
      />
    </View>
  );
}
