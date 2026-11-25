import {useEffect, useState} from 'react';
import {Alert, Text, View} from 'react-native';

import {groupApi} from '@/api/groupApi';
import {itemApi} from '@/api/itemApi';
import {CAPTURE_TYPE_NAMES} from '@/capture/captureItemDraft';
import type {ItemWithType} from '@/models/item';
import {Appear, SwipeDismiss} from '@/motion';
import {itemRepository} from '@/repositories/itemRepository';
import {draftFromItemFull, saveItemDraft} from '@/services/captureItemService';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

/** Swiped left: not now. Comes back next launch. */
// ponytail: "later" lasts until the app restarts; persist it if that's too soon.
const later = new Set<number>();

/** Put it in this bucket. saveItemDraft sees it was unsure, so the classifier learns the user's words → this type. */
async function sort(item: ItemWithType, typeName: string): Promise<void> {
  const [full, groups] = await Promise.all([itemApi.getItemFull(item.id), groupApi.getGroups()]);
  const current = draftFromItemFull(full, groups);
  // A new type starts from its own defaults (a Note becoming a Task gets a pending to-do).
  const fresh = typeName === current.typeName ? {} : {behaviorData: {}, optionalBehaviorNames: []};
  await saveItemDraft({...current, ...fresh, typeName, unsure: false}, item.id);
  await itemRepository.clearUnsure(item.id);
  useDataVersionStore.getState().bump();
}

function useUnsureItems(): ItemWithType[] {
  const version = useDataVersionStore(s => s.version);
  const [items, setItems] = useState<ItemWithType[]>([]);
  useEffect(() => {
    itemRepository.findUnsure().then(setItems).catch(() => {});
  }, [version]);
  return items;
}

function Bucket({label, primary, onPress}: {label: string; primary?: boolean; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Put in ${label}`}
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
 * Captures the classifier wasn't sure about, one card at a time: swipe right = its guess is right, swipe left = decide
 * later, or tap the bucket it belongs in. Unsure tasks stay out of Now until sorted.
 */
export function QuickCheck() {
  const items = useUnsureItems();
  // Sorted or put off here: gone at once, before the save comes back.
  const [handled, setHandled] = useState<number[]>([]);
  const queue = items.filter(i => !later.has(i.id) && !handled.includes(i.id));
  const item = queue[0];
  if (!item) return null;

  const hide = () => setHandled(h => [...h, item.id]);
  const put = (typeName: string) => {
    hide();
    sort(item, typeName).catch(e => {
      setHandled(h => h.filter(id => id !== item.id));
      Alert.alert('Could not sort', e instanceof Error ? e.message : 'Try again');
    });
  };
  const putOff = () => {
    later.add(item.id);
    hide();
  };

  return (
    <View style={{marginTop: 16, gap: 8}}>
      <Text style={{color: designTokens.textTertiary, fontSize: 13, fontWeight: '600'}}>
        Where does this go?{queue.length > 1 ? `  ·  ${queue.length} to sort` : ''}
      </Text>
      {/* New card per item (key): it pops in, and a fresh swipe starts from the middle. */}
      <Appear key={item.id} from="up" duration={260}>
        <SwipeDismiss onDismiss={side => (side > 0 ? put(item.typeName) : putOff())}>
          <View style={{padding: 16, gap: 12, borderRadius: radius.xl, backgroundColor: designTokens.card, borderWidth: 1, borderColor: designTokens.surfaceBorder}}>
            <Text style={{color: designTokens.textPrimary, fontSize: 17, fontWeight: '500'}}>{item.content?.trim() || item.title}</Text>
            <Text style={{color: designTokens.textTertiary, fontSize: 13}}>
              Looks like {item.typeName === 'Idea' ? 'an' : 'a'} {item.typeName}? Swipe right if so, left for later.
            </Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {CAPTURE_TYPE_NAMES.map(t => (
                <Bucket key={t} label={t} primary={t === item.typeName} onPress={() => put(t)} />
              ))}
              <Pressable onPress={putOff} accessibilityRole="button" accessibilityLabel="Decide later" style={{height: 34, justifyContent: 'center', paddingHorizontal: 8}}>
                <Text style={{color: designTokens.textTertiary, fontSize: 14, fontWeight: '600'}}>Later</Text>
              </Pressable>
            </View>
          </View>
        </SwipeDismiss>
      </Appear>
      {queue.length > 1 ? (
        // The next card's edge, peeking out under this one.
        <View style={{marginTop: -8, marginHorizontal: 14, height: 10, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, backgroundColor: designTokens.cardPressed, zIndex: -1}} />
      ) : null}
    </View>
  );
}
