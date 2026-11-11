import {useRouter} from 'expo-router';
import {useNavigation, type ParamListBase} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useEffect, useRef, useState} from 'react';
import {Keyboard, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {ItemWithType} from '@/models/item';
import {searchRepository} from '@/repositories/searchRepository';
import {Selectable} from '@/selection';
import {Mascot} from '@/mascot';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {ItemCard} from '@/ui/components/ItemCard';
import {SearchBar} from '@/ui/components/SearchBar';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

const DEBOUNCE_MS = 200;

/** Searches titles, content, tags and group names. */
export function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItemWithType[]>([]);
  const version = useDataVersionStore(state => state.version);
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const inputRef = useRef<TextInput>(null);

  // The keyboard must not ride along with the slide: open it once the screen has arrived,
  // and drop it the moment the screen starts leaving (Cancel or swipe back).
  useEffect(() => {
    const onEnd = navigation.addListener('transitionEnd', e => {
      if (!e.data.closing) inputRef.current?.focus();
    });
    const onStart = navigation.addListener('transitionStart', e => {
      if (e.data.closing) Keyboard.dismiss();
    });
    return () => {
      onEnd();
      onStart();
    };
  }, [navigation]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchRepository.search(query).then(setResults).catch(() => setResults([]));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, version]);

  return (
    <View style={{flex: 1, backgroundColor: designTokens.black, paddingTop: insets.top}}>
      {/* The field is the header: type, or Cancel to go back (swipe back works too). */}
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12}}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Titles, notes, tags, groups" inputRef={inputRef} style={{flex: 1, marginBottom: 0}} />
        <Pressable onPress={() => {
            Keyboard.dismiss();
            router.back();
          }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close search">
          <Text style={{color: designTokens.textPrimary, fontSize: 16}}>Cancel</Text>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 10}}>
        {results.length === 0 ? (
          // Stays until there are results to show.
          <View style={{alignItems: 'center', paddingVertical: 24, gap: 8}}>
            <Mascot pose="curious" width={110} />
            <Text style={{color: designTokens.textTertiary, fontSize: 14}}>
              {query.trim() ? 'No matches.' : 'Search titles, notes, tags and groups.'}
            </Text>
          </View>
        ) : null}
        {results.map(item => (
          <Selectable key={item.id} item={item} onOpen={() => router.push(`/item/${item.id}`)}>
            {select => <ItemCard title={item.title} typeName={item.typeName} createdAt={item.createdAt} mascot={item.mascot} {...select} />}
          </Selectable>
        ))}
      </ScrollView>
    </View>
  );
}
