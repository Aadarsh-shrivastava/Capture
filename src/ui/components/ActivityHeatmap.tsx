import { Text, View } from 'react-native';

import { designTokens } from '@/ui/designTokens';

type ActivityHeatmapProps = {
  activity: Map<string, number>;
};

function intensityColor(count: number, max: number) {
  if (count <= 0) return designTokens.heatEmpty;
  const ratio = count / Math.max(max, 1);
  if (ratio < 0.34) return designTokens.heatLow;
  if (ratio < 0.67) return designTokens.heatMid;
  return designTokens.heatHigh;
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const entries = Array.from(activity.entries());
  const max = Math.max(...entries.map(([, count]) => count), 1);
  const weeks: string[][] = [];

  for (let i = 0; i < entries.length; i += 7) {
    weeks.push(entries.slice(i, i + 7).map(([day]) => day));
  }

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long' }).toUpperCase();

  return (
    <View>
      <Text
        style={{
          color: designTokens.textTertiary,
          fontSize: 11,
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {monthLabel}
      </Text>
      <View style={{ gap: 6 }}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={{ flexDirection: 'row', gap: 6 }}>
            {week.map((day) => {
              const count = activity.get(day) ?? 0;
              return (
                <View
                  key={day}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: intensityColor(count, max),
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
