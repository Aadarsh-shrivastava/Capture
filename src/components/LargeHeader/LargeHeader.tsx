import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {Text, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {DrawerToggle} from '@/components/DrawerToggle/DrawerToggle';
import {designTokens, typeScale} from '@/ui/designTokens';

type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type LargeHeaderProps = {
  title: string;
  action?: HeaderAction;
  /** Extra icon left of `action`. */
  secondaryAction?: HeaderAction;
  /** Shows a back chevron instead of the drawer toggle. */
  onBack?: () => void;
  /** Replaces the title text, e.g. view tabs. */
  titleNode?: ReactNode;
};

/** One compact row: menu/back on the left, centered title, action icons on the right. */
export function LargeHeader({title, action, secondaryAction, onBack, titleNode}: LargeHeaderProps) {
  const actions = [secondaryAction, action].filter((a): a is HeaderAction => Boolean(a));

  return (
    <View style={{flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 20}}>
      <View style={{flex: 1, alignItems: 'flex-start'}}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={designTokens.textPrimary} />
          </Pressable>
        ) : (
          <DrawerToggle color={designTokens.textPrimary} />
        )}
      </View>

      {titleNode ?? (
        <Text numberOfLines={1} accessibilityRole="header" style={{...typeScale.sheetTitle, color: designTokens.textPrimary}}>
          {title}
        </Text>
      )}

      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 20}}>
        {actions.map(a => (
          <Pressable key={a.label} onPress={a.onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel={a.label}>
            <Ionicons name={a.icon} size={22} color={designTokens.textPrimary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
