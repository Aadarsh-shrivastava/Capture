import {Ionicons} from '@expo/vector-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Grain} from '@/ui/Grain';
import {Pressable} from '@/ui/HapticPressable';
import {Composer} from '@/capture/Composer';
import {useKeyboardHeight} from '@/hooks/useKeyboardHeight';
import {useAppearance} from '@/store/appearanceStore';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasized?: boolean;
};

// Library lives in the side menu.
const TABS: TabConfig[] = [
  {name: 'index', label: 'Focus', icon: 'radio-button-on-outline', emphasized: true},
  {name: 'thoughts', label: 'Thoughts', icon: 'chatbubble-ellipses-outline'},
];

function TabItem({
  config,
  isFocused,
  onPress,
}: {
  config: TabConfig;
  isFocused: boolean;
  onPress: () => void;
}) {
  const accent = config.emphasized && isFocused;
  const color = isFocused ? designTokens.textPrimary : designTokens.textTertiary;
  const iconColor = accent ? designTokens.accent : color;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected: isFocused}}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 4,
      }}>
      <Ionicons name={config.icon} size={config.emphasized ? 24 : 22} color={iconColor} />
      <Text
        style={{
          color: accent ? designTokens.accent : color,
          fontSize: 11,
          fontWeight: isFocused ? '600' : '400',
        }}>
        {config.label}
      </Text>
    </Pressable>
  );
}

export function BottomTabBar({state, navigation}: BottomTabBarProps) {
  const {theme} = useThemeStore();
  const insets = useSafeAreaInsets();
  const visible = useAppearance((s) => s.tabBar);
  const keyboard = useKeyboardHeight();

  // No tab bar, or typing (the keyboard would cover the tabs): just the input bar, riding above the keyboard.
  // The same Composer element stays mounted either way, so it never loses focus when the keyboard appears.
  const barOnly = !visible || keyboard > 0;

  function renderTab(config: TabConfig) {
    const routeIndex = state.routes.findIndex((route: {name: string}) => route.name === config.name);
    const isFocused = state.index === routeIndex;

    return (
      <TabItem
        key={config.name}
        config={config}
        isFocused={isFocused}
        onPress={() => {
          if (!isFocused && routeIndex >= 0) {
            navigation.navigate(state.routes[routeIndex].name);
          }
        }}
      />
    );
  }

  return (
    <View
      style={
        barOnly
          ? undefined
          : {
              backgroundColor: theme.colors.surfaceContainer,
              experimental_backgroundImage: `linear-gradient(180deg, ${theme.colors.surfaceContainer} 0%, ${designTokens.black} 100%)`,
              boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
              borderTopWidth: 1,
              borderTopColor: designTokens.surfaceBorder,
              // Android can report a 0 inset (no edge-to-edge); keep the tabs off the curved screen edge.
              paddingBottom: Math.max(insets.bottom, 12),
            }
      }>
      {barOnly ? null : <Grain />}
      <Composer floating={barOnly} />
      {barOnly ? null : <View style={{flexDirection: 'row', minHeight: 56, paddingHorizontal: 8}}>{TABS.map(renderTab)}</View>}
    </View>
  );
}
