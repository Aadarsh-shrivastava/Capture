import { Ionicons } from '@expo/vector-icons';

import { SectionLabel } from '@/components/SectionLabel/SectionLabel';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';

type MetricRowProps = {
  label: string;
  value: string;
  accent?: boolean;
  showTrend?: boolean;
};

function MetricRow({ label, value, accent, showTrend }: MetricRowProps) {
  const { theme } = useThemeStore();
  const { colors, spacing, typography } = theme;

  return (
    <Box
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.stackMd,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          color: colors.onSurfaceVariant,
          fontSize: typography.bodyMd.fontSize,
        }}
      >
        {label}
      </Text>
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text
          style={{
            color: accent ? colors.primaryContainer : colors.onSurface,
            fontSize: typography.bodyLg.fontSize,
            fontWeight: '600',
          }}
        >
          {value}
        </Text>
        {showTrend ? (
          <Ionicons name="trending-up" size={16} color={colors.primaryContainer} />
        ) : null}
      </Box>
    </Box>
  );
}

export function MetricsSection() {
  return (
    <Box>
      <SectionLabel label="Metrics" />
      <MetricRow label="Attention Score" value="94" accent showTrend />
      <MetricRow label="Tasks Completed" value="12" />
      <MetricRow label="Focus Time" value="4h 20m" />
    </Box>
  );
}
