import {Ionicons} from '@expo/vector-icons';
import {Alert, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Appear, BULK_SLIDE_MS, STAGGER_MS} from '@/motion';
import {completeTasks, deleteItems} from '@/taskActions';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {selectedList, useSelectionStore} from './store';

function BarButton({icon, label, onPress, disabled}: {icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={10} accessibilityLabel={label} style={{opacity: disabled ? 0.35 : 1}}>
      <Ionicons name={icon} size={22} color={designTokens.textPrimary} />
    </Pressable>
  );
}

/** WhatsApp-style bar that covers the screen header while items are selected. */
export function SelectionBar() {
  const insets = useSafeAreaInsets();
  const items = useSelectionStore(state => state.items);
  const clear = useSelectionStore(state => state.clear);
  const setLeaving = useSelectionStore(state => state.setLeaving);
  const list = selectedList(items);
  if (list.length === 0) return null;

  const tasks = list.filter(item => item.typeName === 'Task');
  /** Slide the affected rows out one by one, then run the action. */
  const run = (affected: {id: number}[], action: () => Promise<void>) => {
    clear();
    setLeaving(affected.map(item => item.id));
    setTimeout(() => {
      action()
        .catch(err => Alert.alert('Something went wrong', err instanceof Error ? err.message : String(err)))
        // Let lists reload first so deleted rows don't flash back in.
        .finally(() => setTimeout(() => setLeaving([]), 600));
    }, affected.length * STAGGER_MS + BULK_SLIDE_MS);
  };

  return (
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
        <BarButton icon="close" label="Cancel selection" onPress={clear} />
        <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 18, fontWeight: '600'}}>{list.length}</Text>
        <BarButton icon="checkmark-done" label="Complete selected" disabled={tasks.length === 0} onPress={() => run(tasks, () => completeTasks(tasks))} />
        <BarButton icon="trash-outline" label="Delete selected" onPress={() => run(list, () => deleteItems(list))} />
      </View>
    </Appear>
  );
}
