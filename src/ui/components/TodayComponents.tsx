import { Text, View } from 'react-native';

import { Pressable } from '@/ui/HapticPressable';
import { designTokens } from '@/ui/designTokens';

type NowTaskCardProps = {
  title: string;
  meta?: string;
  onPress?: () => void;
};

export function NowTaskCard({ title, meta, onPress }: NowTaskCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: designTokens.surfaceRaised,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        borderRadius: 12,
        padding: 20,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: designTokens.textPrimary,
          fontSize: 20,
          fontWeight: '600',
          lineHeight: 26,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {meta ? (
        <Text style={{ color: designTokens.textSecondary, fontSize: 14, marginBottom: 16 }}>
          {meta}
        </Text>
      ) : null}
      <Text
        style={{
          color: designTokens.accent,
          fontSize: 15,
          fontWeight: '600',
          alignSelf: 'flex-end',
        }}
      >
        Start →
      </Text>
    </Pressable>
  );
}

type TaskListItemProps = {
  title: string;
  variant?: 'next' | 'later';
  onPress?: () => void;
};

export function TaskListItem({ title, variant = 'next', onPress }: TaskListItemProps) {
  const isLater = variant === 'later';

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}
    >
      <Text
        style={{
          color: isLater ? designTokens.textTertiary : designTokens.textSecondary,
          fontSize: isLater ? 15 : 16,
          fontWeight: isLater ? '400' : '500',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

type ParkedSectionProps = {
  count: number;
};

export function ParkedSection({ count }: ParkedSectionProps) {
  return (
    <Pressable style={{ marginTop: 28, paddingVertical: 8 }}>
      <Text
        style={{
          color: designTokens.textTertiary,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1,
        }}
      >
        PARKED · {count}
      </Text>
    </Pressable>
  );
}

type FloatingAddButtonProps = {
  onPress: () => void;
};

export function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add item"
      style={{
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: designTokens.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: designTokens.white, fontSize: 28, lineHeight: 30, fontWeight: '300' }}>
        +
      </Text>
    </Pressable>
  );
}
