import { Text, View } from 'react-native';

import { ActivityHeatmap } from '@/ui/components/ActivityHeatmap';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { designTokens } from '@/ui/designTokens';

type ActivitySectionProps = {
  activity: Map<string, number>;
  completedCount: number;
  capturedCount: number;
};

export function ActivitySection({
  activity,
  completedCount,
  capturedCount,
}: ActivitySectionProps) {
  return (
    <View>
      <SectionHeader label="Activity" />
      <ActivityHeatmap activity={activity} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 16,
        }}
      >
        <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>
          {completedCount} completed
        </Text>
        <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>8h 32m focused</Text>
        <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>
          {capturedCount} captured
        </Text>
      </View>
    </View>
  );
}
