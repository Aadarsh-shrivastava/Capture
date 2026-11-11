import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {Text, View} from 'react-native';

import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Right side: a value, a switch, a small button… With onPress and no trailing, a chevron. */
  trailing?: ReactNode;
  onPress?: () => void;
};

/** Height of an Item types row (title + one subtitle line), so every card matches with or without a subtitle. */
const ROW_HEIGHT = 70;

/** One setting as a rounded card (same look as the Item types list). */
export function SettingsCard({icon, title, subtitle, trailing, onPress}: Props) {
  const body = (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: ROW_HEIGHT, borderRadius: radius.lg, backgroundColor: designTokens.card}}>
      <Ionicons name={icon} size={22} color={designTokens.textPrimary} />
      <View style={{flex: 1, gap: 3}}>
        <Text style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '600'}}>{title}</Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{color: designTokens.textTertiary, fontSize: 13}}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {typeof trailing === 'string' ? (
        <Text style={{color: designTokens.textSecondary, fontSize: 14}}>{trailing}</Text>
      ) : (
        trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={designTokens.textTertiary} /> : null)
      )}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  ) : (
    body
  );
}
