import {useRouter} from 'expo-router';
import {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import type {ItemWithType} from '@/models/item';
import {searchRepository} from '@/repositories/searchRepository';
import {Selectable} from '@/selection';
import {Mascot} from '@/mascot';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {ItemCard} from '@/ui/components/ItemCard';
import {SearchBar} from '@/ui/components/SearchBar';
import {designTokens} from '@/ui/designTokens';

const DEBOUNCE_MS = 200;

/** Searches titles, content, tags and group names. */
export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItemWithType[]>([]);
  const version = useDataVersionStore(state => state.version);

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
    <ScreenShell title="Search" leading="back">
      <View style={{paddingHorizontal: 20}}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Titles, notes, tags, groups" autoFocus />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 10}}>
        {results.length === 0 ? (
          // Stays until there are results to show.
          <View style={{alignItems: 'center', paddingVertical: 24, gap: 8}}>
            <Mascot pose="chibiPeek" width={110} />
            <Text style={{color: designTokens.textTertiary, fontSize: 14}}>
              {query.trim() ? 'No matches.' : 'Search titles, notes, tags and groups.'}
            </Text>
          </View>
        ) : null}
        {results.map(item => (
          <Selectable key={item.id} item={item} onOpen={() => router.push(`/item/${item.id}`)}>
            {select => <ItemCard title={item.title} typeName={item.typeName} createdAt={item.createdAt} {...select} />}
          </Selectable>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}
