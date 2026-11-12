import moment from 'moment';
import {useFocusEffect, useRouter} from 'expo-router';
import {useCallback, useMemo} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Composer} from '@/capture/Composer';
import {usePendingCaptures} from '@/capture/usePendingCaptures';
import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {GROUPS_ENABLED, LibraryGroups} from '@/groups';
import {useItemsData} from '@/hooks/useItemsData';
import {useLlamaStore} from '@/hooks/useLlamaModel';
import {Mascot} from '@/mascot';
import {useModelStore} from '@/model';
import {useComingBackIds} from '@/resurface';
import {Selectable} from '@/selection';
import {ItemCard, TypeGridCard} from '@/ui/components/ItemCard';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';
import {allTypeNames} from '@/ui/itemTypeConfig';

import {groupByDay, thoughtLabel} from './thoughts';

/** The library (one card per type) on top, then everything you've said, newest first by day. Focus is the main screen. */
export function ThoughtsScreen() {
  const router = useRouter();
  const {items, types, error, refresh} = useItemsData();
  const pending = usePendingCaptures();
  const comingBack = useComingBackIds();
  const loadFailed = useLlamaStore(s => s.loadFailed);
  const removeModel = useModelStore(s => s.remove);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const days = useMemo(() => groupByDay(items), [items]);
  const typeNames = useMemo(() => allTypeNames().filter(name => types.some(t => t.name === name)), [types]);

  return (
    <TabScreenShell title="Thoughts" secondaryAction={{icon: 'search', label: 'Search', onPress: () => router.push('/search')}}>
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120}} showsVerticalScrollIndicator={false}>
        {error ? <Text style={{color: designTokens.textSecondary, fontSize: 13, marginBottom: 12}}>{error}</Text> : null}

        {/* The library: one card per type, scrolled sideways so the thoughts stay in view. */}
        {typeNames.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -20}} contentContainerStyle={{paddingHorizontal: 20, paddingVertical: 8, gap: 10}}>
            {typeNames.map(typeName => (
              <View key={typeName} style={{width: 104}}>
                <TypeGridCard
                  typeName={typeName}
                  count={items.filter(item => item.typeName === typeName).length}
                  onPress={() => router.push({pathname: '/library/list', params: {type: typeName}})}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
        {GROUPS_ENABLED ? <LibraryGroups /> : null}

        {/* Said, not sorted yet. */}
        {pending.map(p => (
          <View key={p.id} style={{padding: 14, gap: 4, marginTop: 8, borderRadius: radius.lg, backgroundColor: designTokens.card}}>
            <Text style={{color: designTokens.textTertiary, fontSize: 12, fontWeight: '600'}}>Sorting…</Text>
            <Text numberOfLines={2} style={{color: designTokens.textPrimary, fontSize: 16}}>{p.text}</Text>
          </View>
        ))}
        {loadFailed && pending.length > 0 ? (
          <Pressable onPress={() => removeModel().catch(() => {})} accessibilityRole="button" style={{paddingVertical: 12}}>
            <Text style={{color: designTokens.textSecondary, fontSize: 13}}>
              The AI couldn't start; your thoughts are safe. <Text style={{color: designTokens.textPrimary, fontWeight: '700'}}>Re-download</Text>
            </Text>
          </Pressable>
        ) : null}

        {items.length === 0 && pending.length === 0 ? (
          <View style={{alignItems: 'center', paddingVertical: 64, gap: 8}}>
            <Mascot pose="thinking" width={130} />
            <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>Nothing yet</Text>
            <Text style={{color: designTokens.textTertiary, fontSize: 14, textAlign: 'center'}}>Everything you say lands here; anything to do also shows in Focus.</Text>
          </View>
        ) : null}

        {days.map(day => (
          <View key={day.heading} style={{marginTop: 16, gap: 8}}>
            <Text style={{color: designTokens.textTertiary, fontSize: 13, fontWeight: '600', letterSpacing: 0.4}}>{day.heading}</Text>
            {day.items.map(item => (
              <Selectable key={item.id} item={item} onOpen={() => router.push(`/item/${item.id}`)}>
                {select => (
                  <ItemCard
                    title={item.title}
                    typeName={item.typeName}
                    createdAt={item.createdAt}
                    label={thoughtLabel(item.typeName, comingBack.has(item.id))}
                    meta={moment(item.createdAt).format('h:mm A')}
                    mascot={item.mascot}
                    {...select}
                  />
                )}
              </Selectable>
            ))}
          </View>
        ))}
      </ScrollView>
      <Composer floating />
    </TabScreenShell>
  );
}
