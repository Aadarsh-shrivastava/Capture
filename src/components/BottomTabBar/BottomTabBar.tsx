import {Ionicons} from '@expo/vector-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Pressable} from '@/ui/HapticPressable';
import {useCaptureStore} from '@/store/captureStore';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasized?: boolean;
};

const LEFT_TABS: TabConfig[] = [
  {name: 'index', label: 'Focus', icon: 'radio-button-on-outline', emphasized: true},
  {name: 'groups', label: 'Groups', icon: 'folder-outline'},
];

const RIGHT_TABS: TabConfig[] = [
  {name: 'library', label: 'Library', icon: 'layers-outline'},
  {name: 'timeline', label: 'Timeline', icon: 'time-outline'},
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
      <View style={{alignItems: 'center'}}>
        <Ionicons name={config.icon} size={config.emphasized ? 24 : 22} color={iconColor} />
        {accent ? (
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: designTokens.accent,
              marginTop: 4,
            }}
          />
        ) : null}
      </View>
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

function CaptureButton() {
  const openQuickAdd = useCaptureStore((state) => state.openQuickAdd);

  return (
    <Pressable
      onPress={openQuickAdd}
      accessibilityRole="button"
      accessibilityLabel="Capture"
      accessibilityHint="Voice, type, or create manually"
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -28,
        backgroundColor: designTokens.accent,
      }}>
      <Ionicons name="add" size={30} color={designTokens.white} />
    </Pressable>
  );
}

export function BottomTabBar({state, navigation}: BottomTabBarProps) {
  const {theme} = useThemeStore();
  const insets = useSafeAreaInsets();

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
      style={{
        backgroundColor: theme.colors.surfaceContainer,
        borderTopWidth: 1,
        borderTopColor: designTokens.surfaceBorder,
        paddingBottom: insets.bottom,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          minHeight: 64,
          paddingHorizontal: 8,
        }}>
        <View style={{flex: 1, flexDirection: 'row'}}>{LEFT_TABS.map(renderTab)}</View>

        <CaptureButton />

        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>
          {RIGHT_TABS.map(renderTab)}
        </View>
      </View>
    </View>
  );
}
