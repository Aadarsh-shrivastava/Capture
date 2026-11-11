import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect, useRouter} from 'expo-router';
import {useCallback, useEffect, useState} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import type {GroupWithCount} from '@/models/group';
import {Appear} from '@/motion';
import {MascotMessage} from '@/mascot';
import {SelectionTint} from '@/selection';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {showUndo} from '@/undo';
import {CollapsibleSection} from '@/ui/components/CollapsibleSection';
import {itemCountLabel} from '@/ui/components/ItemCard';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {EditGroupSheet} from './EditGroupSheet';
import {groupsService} from './service';

function GroupListRow({group, selected, dim, onPress, onLongPress}: {group: GroupWithCount; selected: boolean; dim?: boolean; onPress: () => void; onLongPress: () => void}) {
  return (
    <View style={{marginBottom: 6}}>
      <SelectionTint selected={selected} bleed={8}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          style={{flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: dim ? 0.5 : 1}}>
          <Ionicons name={dim ? 'archive-outline' : 'folder-outline'} size={20} color={designTokens.textSecondary} />
          <Text numberOfLines={1} style={{flex: 1, color: designTokens.textPrimary, fontSize: 16, fontWeight: '500'}}>
            {group.name}
          </Text>
          <Text style={{color: designTokens.textTertiary, fontSize: 13}}>{itemCountLabel(group.itemCount)}</Text>
        </Pressable>
      </SelectionTint>
    </View>
  );
}

/** All groups: tap to open, long press to select, then archive or delete in bulk. */
export function GroupsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const version = useDataVersionStore(state => state.version);
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [archived, setArchived] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    groupsService
      .getGroups()
      .then(list => {
        setGroups(list);
        setArchived(groupsService.archivedIds());
      })
      .catch(() => setGroups([]));
  }, []);
  useFocusEffect(load);
  useEffect(load, [load, version]);

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clear = () => {
    setSelected(new Set());
  };

  const picked = groups.filter(g => selected.has(g.id));
  const allArchived = picked.length > 0 && picked.every(g => archived.has(g.id));
  const label = (n: number) => `${n} group${n === 1 ? '' : 's'}`;

  function archiveSelected() {
    const ids = picked.map(g => g.id);
    groupsService.setArchived(ids, !allArchived);
    clear();
    showUndo(`${allArchived ? 'Unarchived' : 'Archived'} ${label(ids.length)}`, () => groupsService.setArchived(ids, allArchived));
  }

  async function deleteSelected(withItems: boolean) {
    const snapshots = await groupsService.deleteGroups(picked, withItems);
    clear();
    showUndo(`Deleted ${label(snapshots.length)}${withItems ? ' and their items' : ''}`, () => groupsService.restoreGroups(snapshots));
  }

  function confirmDelete() {
    const itemCount = picked.reduce((sum, g) => sum + g.itemCount, 0);
    if (itemCount === 0) return void deleteSelected(false);
    Alert.alert(
      `Delete ${label(picked.length)}?`,
      `${itemCountLabel(itemCount)} inside. Delete them too, or keep them in your library?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Keep items', onPress: () => deleteSelected(false)},
        {text: 'Delete items too', style: 'destructive', onPress: () => deleteSelected(true)},
      ],
    );
  }

  const open = (g: GroupWithCount) => (selected.size ? toggle(g.id) : router.push(`/group/${g.id}`));
  const active = groups.filter(g => !archived.has(g.id));
  const archivedGroups = groups.filter(g => archived.has(g.id));

  return (
    <View style={{flex: 1}}>
      <TabScreenShell title="Groups" action={{icon: 'add', label: 'New group', onPress: () => setCreating(true)}}>
        <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40}}>
          {active.length === 0 ? (
            <MascotMessage pose="curious" message="No groups yet. Tap + to create one." />
          ) : (
            active.map(g => (
              <GroupListRow key={g.id} group={g} selected={selected.has(g.id)} onPress={() => open(g)} onLongPress={() => toggle(g.id)} />
            ))
          )}
          {archivedGroups.length > 0 ? (
            <CollapsibleSection label="Archived" count={archivedGroups.length} defaultOpen={false}>
              {archivedGroups.map(g => (
                <GroupListRow key={g.id} group={g} dim selected={selected.has(g.id)} onPress={() => open(g)} onLongPress={() => toggle(g.id)} />
              ))}
            </CollapsibleSection>
          ) : null}
        </ScrollView>
      </TabScreenShell>

      {selected.size > 0 ? (
        <Appear
          from="down"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top,
            backgroundColor: designTokens.surfaceRaised,
            borderBottomWidth: 1,
            borderBottomColor: designTokens.surfaceBorder,
          }}>
          <View style={{height: 56, flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 20}}>
            <Pressable onPress={clear} hitSlop={10} accessibilityLabel="Cancel selection">
              <Ionicons name="close" size={22} color={designTokens.textPrimary} />
            </Pressable>
            <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 18, fontWeight: '600'}}>{selected.size}</Text>
            <Pressable onPress={archiveSelected} hitSlop={10} accessibilityLabel={allArchived ? 'Unarchive' : 'Archive'}>
              <Ionicons name={allArchived ? 'arrow-undo-outline' : 'archive-outline'} size={22} color={designTokens.textPrimary} />
            </Pressable>
            <Pressable onPress={confirmDelete} hitSlop={10} accessibilityLabel="Delete groups">
              <Ionicons name="trash-outline" size={22} color={designTokens.textPrimary} />
            </Pressable>
          </View>
        </Appear>
      ) : null}

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
