import {Ionicons} from '@expo/vector-icons';
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
};

/** Menu + action icon row with a large left-aligned title underneath. */
export function LargeHeader({title, action}: LargeHeaderProps) {
  return (
    <View style={{paddingHorizontal: 20, paddingTop: 8}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
        }}>
        <DrawerToggle color={designTokens.textPrimary} />

        {action ? (
          <Pressable
            onPress={action.onPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={action.label}>
            <Ionicons name={action.icon} size={22} color={designTokens.textPrimary} />
          </Pressable>
        ) : (
          <View style={{width: 22}} />
        )}
      </View>

      <Text style={{...typeScale.screenTitle, color: designTokens.textPrimary, marginTop: 10}}>
        {title}
      </Text>
    </View>
  );
}
