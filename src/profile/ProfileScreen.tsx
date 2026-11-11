import {Ionicons} from '@expo/vector-icons';
import moment from 'moment';
import {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {itemApi} from '@/api/itemApi';
import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {OptionsSheet} from '@/components/sheets/OptionsSheet';
import {taskHistoryRepository} from '@/repositories/taskHistoryRepository';
import {useDataVersionStore} from '@/store/dataVersionStore';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {EditProfileSheet} from './EditProfileSheet';
import {Avatar} from './Avatar';
import {useProfileStore} from './store';

type Stats = {done: number; week: number; total: number};

function Stat({label, value}: {label: string; value: number}) {
  return (
    <View style={{flex: 1, backgroundColor: designTokens.card, borderRadius: radius.lg, padding: 14, gap: 4}}>
      <Text style={{color: designTokens.textPrimary, fontSize: 22, fontWeight: '700'}}>{value}</Text>
      <Text style={{color: designTokens.textTertiary, fontSize: 12}}>{label}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const profile = useProfileStore();
  const version = useDataVersionStore(state => state.version);
  const [sheet, setSheet] = useState<'menu' | 'edit' | null>(null);
  const [stats, setStats] = useState<Stats>({done: 0, week: 0, total: 0});

  useEffect(() => {
    Promise.all([itemApi.getItems(), taskHistoryRepository.findAll()])
      .then(([items, tasks]) => {
        const weekAgo = moment().subtract(7, 'days');
        setStats({
          done: tasks.filter(t => t.status === 'completed').length,
          week: items.filter(i => moment(i.createdAt).isAfter(weekAgo)).length,
          total: items.length,
        });
      })
      .catch(() => {});
  }, [version]);

  return (
    <ScreenShell
      title="Profile"
      leading="back"
      right={
        <Pressable onPress={() => setSheet('menu')} hitSlop={12} accessibilityLabel="Profile options">
          <Ionicons name="ellipsis-horizontal" size={22} color={designTokens.textPrimary} />
        </Pressable>
      }>
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16}}>
        <Pressable onPress={() => setSheet('edit')} style={{alignItems: 'center', gap: 10, paddingVertical: 12}}>
          <Avatar size={88} />
          <Text style={{color: profile.name ? designTokens.textPrimary : designTokens.textTertiary, fontSize: 20, fontWeight: '600'}}>
            {profile.name || 'Add your name'}
          </Text>
        </Pressable>

        <View style={{flexDirection: 'row', gap: 10}}>
          <Stat label="Tasks done" value={stats.done} />
          <Stat label="Captured this week" value={stats.week} />
          <Stat label="Total items" value={stats.total} />
        </View>
      </ScrollView>

      <OptionsSheet
        visible={sheet === 'menu'}
        onClose={() => setSheet(null)}
        title="Profile"
        value={null}
        options={[{label: 'Edit profile', value: 'edit', icon: 'create-outline'}]}
        onSelect={() => setTimeout(() => setSheet('edit'), 300)} // after the menu sheet closes
      />
      <EditProfileSheet visible={sheet === 'edit'} onClose={() => setSheet(null)} />
    </ScreenShell>
  );
}
