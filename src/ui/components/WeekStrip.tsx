import moment from 'moment';
import {Text, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {designTokens, radius} from '@/ui/designTokens';

type WeekStripProps = {
  /** Currently selected day. */
  value: Date;
  onChange: (date: Date) => void;
  /** Days that have at least one scheduled task. */
  markedDays?: string[];
};

/** Mon–Sun strip with a pill on the selected day, as in the Focus design. */
export function WeekStrip({value, onChange, markedDays = []}: WeekStripProps) {
  const selected = moment(value);
  const startOfWeek = selected.clone().startOf('isoWeek');
  const marked = new Set(markedDays);

  const days = Array.from({length: 7}, (_, index) => startOfWeek.clone().add(index, 'days'));

  return (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4}}>
      {days.map((day) => {
        const isSelected = day.isSame(selected, 'day');
        const key = day.format('YYYY-MM-DD');

        return (
          <Pressable
            key={key}
            onPress={() => onChange(day.toDate())}
            accessibilityRole="button"
            accessibilityState={{selected: isSelected}}
            accessibilityLabel={day.format('dddd, MMMM D')}
            style={{alignItems: 'center', width: 40, gap: 6}}>
            <Text
              style={{
                color: isSelected ? designTokens.textPrimary : designTokens.textTertiary,
                fontSize: 12,
                fontWeight: '500',
              }}>
              {day.format('ddd')}
            </Text>

            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? designTokens.white : 'transparent',
              }}>
              <Text
                style={{
                  color: isSelected ? designTokens.black : designTokens.textSecondary,
                  fontSize: 16,
                  fontWeight: isSelected ? '700' : '500',
                }}>
                {day.format('D')}
              </Text>
            </View>

            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor:
                  marked.has(key) && !isSelected ? designTokens.textTertiary : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
