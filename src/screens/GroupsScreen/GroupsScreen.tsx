import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { groupApi } from '@/api/groupApi';
import { TabScreenShell } from '@/components/TabScreenShell/TabScreenShell';
import type { GroupWithCount } from '@/models/group';
import { EmptyState } from '@/ui/components/EmptyState';
import { GroupRow } from '@/ui/components/ItemComponents';
import { designTokens } from '@/ui/designTokens';
import { useThemeStore } from '@/store/themeStore';

export function GroupsScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      setError(null);
      const data = await groupApi.getGroups();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load groups');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;

    try {
      await groupApi.createGroup({ name: newGroupName.trim() });
      setNewGroupName('');
      setCreating(false);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create group');
    }
  }

  function confirmDelete(group: GroupWithCount) {
    Alert.alert('Delete group', `Delete "${group.name}"? Items will not be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupApi.deleteGroup(group.id);
            await loadGroups();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to delete group');
          }
        },
      },
    ]);
  }

  return (
    <TabScreenShell
      title="Groups"
      action={{
        icon: creating ? 'close' : 'add',
        label: creating ? 'Cancel new group' : 'New group',
        onPress: () => setCreating((value) => !value),
      }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {creating ? (
          <View style={{ marginBottom: 20 }}>
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Group name"
              placeholderTextColor={designTokens.textTertiary}
              autoFocus
              style={{
                color: designTokens.textPrimary,
                fontSize: 16,
                borderBottomWidth: 1,
                borderBottomColor: designTokens.surfaceBorder,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            />
            <Pressable
              onPress={handleCreateGroup}
              style={{
                backgroundColor: designTokens.accent,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: designTokens.white, fontSize: 15, fontWeight: '600' }}>
                Create Group
              </Text>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginBottom: 12 }}>{error}</Text>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState message="No groups yet. Create one to organize your items." />
        ) : (
          groups.map((group) => (
            <Pressable key={group.id} onLongPress={() => confirmDelete(group)}>
              <GroupRow
                name={group.name}
                itemCount={group.itemCount}
                onPress={() => router.push(`/group/${group.id}`)}
              />
            </Pressable>
          ))
        )}
      </ScrollView>
    </TabScreenShell>
  );
}
