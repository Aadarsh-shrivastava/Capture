import {useState} from 'react';
import {Alert, Text, View} from 'react-native';

import {groupApi} from '@/api/groupApi';
import {itemApi} from '@/api/itemApi';
import {analyzeText} from '@/hooks/useCaptureAnalysis';
import type {ItemWithType} from '@/models/item';
import {itemRepository} from '@/repositories/itemRepository';
import {draftFromItemFull, saveItemDraft} from '@/services/captureItemService';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

/**
 * Answer "to do or thought?" for one item. It was saved as said, without the model's later steps: run them now with
 * the answer as the kind (title, description, date, sticker, priority…). No model → just switch the type.
 */
async function answer(item: ItemWithType, toDo: boolean): Promise<void> {
  const [full, groups] = await Promise.all([itemApi.getItemFull(item.id), groupApi.getGroups()]);
  const current = draftFromItemFull(full, groups);
  const said = full.content?.trim() || item.title;
  const draft = await analyzeText(said, undefined, new Date(item.createdAt), toDo ? 'todo' : 'keep').catch(() => null);
  if (draft) {
    // A group picked when capturing stays.
    await saveItemDraft({...draft, unsure: false, groupNames: draft.groupNames?.length ? draft.groupNames : current.groupNames}, item.id);
  } else if (!toDo) {
    await saveItemDraft({...current, typeName: 'Note'}, item.id);
  }
  await itemRepository.clearUnsure(item.id);
  useDataVersionStore.getState().bump();
}

function Choice({label, primary, onPress}: {label: string; primary?: boolean; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        paddingHorizontal: 14,
        height: 34,
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: primary ? designTokens.accent : designTokens.surfaceRaised,
      }}>
      <Text style={{color: primary ? designTokens.black : designTokens.textPrimary, fontSize: 14, fontWeight: '600'}}>{label}</Text>
    </Pressable>
  );
}

/**
 * Things the model guessed are to-dos (nothing you said made it sure). Kept out of Now until you answer, so a wrong
 * guess never takes over Focus — one tap each.
 */
export function QuickCheck({items}: {items: ItemWithType[]}) {
  // Answering runs the model on the thought (a few seconds): those show "Sorting…" instead of the choices.
  const [busy, setBusy] = useState<number[]>([]);
  if (items.length === 0) return null;
  const run = (id: number, p: () => Promise<void>) => {
    setBusy(b => [...b, id]);
    p()
      .catch(e => Alert.alert('Could not update', e instanceof Error ? e.message : 'Try again'))
      .finally(() => setBusy(b => b.filter(x => x !== id)));
  };
  return (
    <View style={{marginTop: 16, gap: 8}}>
      <Text style={{color: designTokens.textTertiary, fontSize: 13, fontWeight: '600'}}>Is this something to do?</Text>
      {items.map(item => (
        <View key={item.id} style={{padding: 14, gap: 10, borderRadius: radius.lg, backgroundColor: designTokens.card}}>
          <Text style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '500'}}>{item.title}</Text>
          {busy.includes(item.id) ? (
            <Text style={{color: designTokens.textTertiary, fontSize: 13, fontWeight: '600'}}>Sorting…</Text>
          ) : (
            <View style={{flexDirection: 'row', gap: 8}}>
              <Choice label="To do" primary onPress={() => run(item.id, () => answer(item, true))} />
              <Choice label="Just a thought" onPress={() => run(item.id, () => answer(item, false))} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
