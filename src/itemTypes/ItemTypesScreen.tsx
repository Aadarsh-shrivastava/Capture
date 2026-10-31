import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {ScrollView, Text, View} from 'react-native';

import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {getBehaviorLabel} from '@/domain/behaviorTypeConfig';
import {Mascot} from '@/mascot';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

import {useItemTypesStore} from './store';

/** Settings → Item types: every type with its behaviors; tap to edit, + to create. */
export function ItemTypesScreen() {
  const router = useRouter();
  const types = useItemTypesStore(state => state.types);

  return (
    <ScreenShell
      title="Item types"
      leading="back"
      right={
        <Pressable onPress={() => router.push('/settings/types/edit')} hitSlop={12} accessibilityLabel="New type">
          <Ionicons name="add" size={24} color={designTokens.textPrimary} />
        </Pressable>
      }>
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 10}}>
        <Mascot pose="thinking" width={96} style={{alignSelf: 'center'}} />
        {types.map(type => (
          <Pressable
            key={type.id}
            onPress={() => router.push({pathname: '/settings/types/edit', params: {id: String(type.id)}})}
            style={{flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: designTokens.card}}>
            <Ionicons name={getItemTypeConfig(type.name).icon} size={22} color={designTokens.textPrimary} />
            <View style={{flex: 1, gap: 3}}>
              <Text style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '600'}}>
                {type.name}
                {type.isSystem ? <Text style={{color: designTokens.textTertiary, fontSize: 12, fontWeight: '400'}}>  Built-in</Text> : null}
              </Text>
              <Text numberOfLines={2} style={{color: designTokens.textTertiary, fontSize: 13}}>
                {[...type.defaults, ...type.optional].map(getBehaviorLabel).join(' · ') || 'No behaviors'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={designTokens.textTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}
