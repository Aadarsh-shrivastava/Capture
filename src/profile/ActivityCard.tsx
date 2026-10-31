import moment from 'moment';
import {useState} from 'react';
import {Text, View} from 'react-native';

import {designTokens, radius} from '@/ui/designTokens';

import {weekColumns} from './activity';

const WEEKS = 17;
const GAP = 4;
const PADDING = 16;

function shade(count: number, max: number): string {
  if (count <= 0) return designTokens.heatEmpty;
  const ratio = count / Math.max(max, 1);
  if (ratio < 0.34) return designTokens.heatLow;
  if (ratio < 0.67) return designTokens.heatMid;
  return designTokens.heatHigh;
}

/** GitHub-style map: one column per week, filling the card width. */
export function ActivityCard({activity}: {activity: Map<string, number>}) {
  const [width, setWidth] = useState(0);
  const columns = weekColumns(WEEKS);
  const days = columns.flat();
  const counts = days.map(day => activity.get(day) ?? 0);
  const max = Math.max(...counts, 1);
  const total = counts.reduce((a, b) => a + b, 0);
  const cell = width ? (width - GAP * (WEEKS - 1)) / WEEKS : 0;
  const today = moment().format('YYYY-MM-DD');

  return (
    <View style={{backgroundColor: designTokens.card, borderRadius: radius.lg, padding: PADDING, gap: 12}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <Text style={{color: designTokens.textPrimary, fontSize: 15, fontWeight: '600'}}>Activity</Text>
        <Text style={{color: designTokens.textTertiary, fontSize: 12}}>
          {total} in the last {WEEKS} weeks
        </Text>
      </View>

      <View style={{flexDirection: 'row', gap: GAP}} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {cell
          ? columns.map(week => (
              <View key={week[0]} style={{gap: GAP}}>
                {week.map(day => (
                  <View
                    key={day}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: 3,
                      backgroundColor: day > today ? 'transparent' : shade(activity.get(day) ?? 0, max),
                    }}
                  />
                ))}
              </View>
            ))
          : null}
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={{color: designTokens.textTertiary, fontSize: 11}}>
          {moment(columns[0][0]).format('MMM D')} – today
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
          <Text style={{color: designTokens.textTertiary, fontSize: 11}}>Less</Text>
          {[0, 0.2, 0.5, 1].map(r => (
            <View key={r} style={{width: 10, height: 10, borderRadius: 2, backgroundColor: shade(r, 1)}} />
          ))}
          <Text style={{color: designTokens.textTertiary, fontSize: 11}}>More</Text>
        </View>
      </View>
    </View>
  );
}
