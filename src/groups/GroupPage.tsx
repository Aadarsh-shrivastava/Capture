import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useState} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {groupApi} from '@/api/groupApi';
import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {typeHasBehavior} from '@/domain/behaviorTypeConfig';
import {Selectable} from '@/selection';
import {useCaptureStore} from '@/store/captureStore';
import {OptionsSheet} from '@/components/sheets/OptionsSheet';
import type {ItemWithType} from '@/models/item';
import {PrimaryButton} from '@/ui/components/Primitives';
import {SectionHeader} from '@/ui/components/SectionHeader';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

import {AddItemsSheet} from './AddItemsSheet';
import {EditGroupSheet} from './EditGroupSheet';
import {useGroupPage} from './useGroupPage';
import {sectionsByType} from './utils';

function MemberRow({item, onPress, onLongPress, onRemove}: {item: ItemWithType; onPress: () => void; onLongPress: () => void; onRemove: () => void}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.divider,
      }}>
      <Pressable onPress={onPress} onLongPress={onLongPress} style={{flex: 1}} accessibilityRole="button">
        <Text numberOfLines={1} style={{color: designTokens.textPrimary, fontSize: 15}}>
          {item.title}
        </Text>
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${item.title} from group`}>
        <Ionicons name="remove-circle-outline" size={20} color={designTokens.textTertiary} />
      </Pressable>
    </View>
  );
}

/** Group page: what's in it, grouped by type, with quick add/remove. */
export function GroupPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{id: string}>();
  const groupId = Number(params.id);
  const {group, items, allItems, error, add, remove, rename} = useGroupPage(groupId);
  const [sheet, setSheet] = useState<'add' | 'edit' | 'menu' | null>(null);
  const openTextCapture = useCaptureStore(state => state.openTextCapture);

  if (!group) {
    return (
      <ScreenShell title="Group" leading="back">
        <Text style={{color: designTokens.textSecondary, padding: 20}}>{error ?? 'Loading…'}</Text>
      </ScreenShell>
    );
  }

  const openTasks = items.filter(i => typeHasBehavior(i.typeName, 'Doable')).length;
  const confirmDelete = () =>
    Alert.alert('Delete group', `Delete "${group.name}"? Items stay in your library.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await groupApi.deleteGroup(group.id);
          router.back();
        },
      },
    ]);

  return (
    <ScreenShell
      title={group.name}
      leading="back"
      right={
        <Pressable onPress={() => setSheet('menu')} hitSlop={12} accessibilityLabel="Group options">
          <Ionicons name="ellipsis-horizontal" size={22} color={designTokens.textPrimary} />
        </Pressable>
      }>
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24}}>
        <Pressable onPress={() => setSheet('edit')}>
          <Text style={{color: group.description ? designTokens.textSecondary : designTokens.textTertiary, fontSize: 15, lineHeight: 22}}>
            {group.description || 'Add a description so capture can sort items here automatically.'}
          </Text>
        </Pressable>
        <Text style={{color: designTokens.textTertiary, fontSize: 13, marginTop: 8, marginBottom: 8}}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
          {openTasks ? ` · ${openTasks} ${openTasks === 1 ? 'task' : 'tasks'}` : ''}
        </Text>

        {error ? <Text style={{color: designTokens.textSecondary, fontSize: 13}}>{error}</Text> : null}

        {items.length === 0 ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 14, paddingVertical: 32, textAlign: 'center'}}>
            Nothing here yet. Add items below, or capture something that fits.
          </Text>
        ) : (
          sectionsByType(items).map(section => (
            <View key={section.typeName}>
              <SectionHeader label={getItemTypeConfig(section.typeName).plural} />
              {section.items.map(item => (
                <Selectable key={item.id} item={item} bleed={8} onOpen={() => router.push(`/item/${item.id}`)}>
                  {(select) => <MemberRow item={item} {...select} onRemove={() => remove(item)} />}
                </Selectable>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          borderTopWidth: 1,
          borderTopColor: designTokens.divider,
        }}>
        <View style={{flexDirection: 'row', gap: 10}}>
          <PrimaryButton compact label="Add existing" icon="add" onPress={() => setSheet('add')} style={{flex: 1}} />
          <PrimaryButton compact label="Capture new" icon="create-outline" onPress={() => openTextCapture('', group.name)} style={{flex: 1}} />
        </View>
      </View>

      <AddItemsSheet
        visible={sheet === 'add'}
        onClose={() => setSheet(null)}
        allItems={allItems}
        inGroup={items}
        onAdd={add}
      />
      <EditGroupSheet
        visible={sheet === 'edit'}
        onClose={() => setSheet(null)}
        name={group.name}
        description={group.description ?? ''}
        onSave={rename}
      />
      <OptionsSheet
        visible={sheet === 'menu'}
        onClose={() => setSheet(null)}
        title={group.name}
        value={null}
        options={[
          {label: 'Edit details', value: 'edit', icon: 'create-outline'},
          {label: 'Delete group', value: 'delete', icon: 'trash-outline'},
        ]}
        onSelect={value => {
          if (value === 'edit') setTimeout(() => setSheet('edit'), 300); // after the menu closes
          if (value === 'delete') setTimeout(confirmDelete, 300);
        }}
      />
    </ScreenShell>
  );
}
