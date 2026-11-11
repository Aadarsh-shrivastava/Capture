import moment from 'moment';
import {useRouter} from 'expo-router';
import {ScrollView, Text, View} from 'react-native';

import {useFocusData} from '@/hooks/useFocusData';
import {MascotMessage} from '@/mascot';
import {GhostRow, useRepeatPreview} from '@/recurrence';
import {NextTaskRow} from '@/ui/components/FocusComponents';
import {designTokens} from '@/ui/designTokens';

import {groupByDay} from './groupByDay';

/** The next `days` days as one agenda. Repeats show as ghosts: display only, you act on the real one when it's due. */
export function UpcomingView({days}: {days: number}) {
  const router = useRouter();
  const {tasks} = useFocusData();
  const now = new Date();
  const previews = useRepeatPreview(tasks, moment(now).add(days - 1, 'days').toDate());
  const ghosts = new Set([...previews.values()].flat());
  const groups = groupByDay([...tasks, ...ghosts], now, days);
  // Ghosts don't count: with nothing real planned, the mascot still shows.
  const empty = groups.every(g => g.tasks.every(t => ghosts.has(t)));

  return (
    <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 120}}>
      {empty ? <MascotMessage pose="sleeping" message="Nothing planned yet. Enjoy the space." /> : null}
      {groups.map(group =>
        group.tasks.length === 0 ? null : (
          <View key={group.day} style={{marginTop: 20}}>
            <Text style={{color: designTokens.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 4}}>
              {moment(group.day).calendar(null, {sameDay: '[Today]', nextDay: '[Tomorrow]', nextWeek: 'dddd', sameElse: 'ddd, MMM D'})}
            </Text>
            {group.tasks.map(task =>
              ghosts.has(task) ? (
                <GhostRow key={`r-${task.id}-${task.dueAt}`} task={task} />
              ) : (
                <NextTaskRow key={`t-${task.id}`} task={task} onPress={() => router.push(`/item/${task.id}`)} />
              ),
            )}
          </View>
        ),
      )}
    </ScrollView>
  );
}
