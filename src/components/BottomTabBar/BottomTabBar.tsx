import {Ionicons} from '@expo/vector-icons';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Grain} from '@/ui/Grain';
import {Pressable} from '@/ui/HapticPressable';
import {useCaptureStore} from '@/store/captureStore';
import {useAppearance} from '@/store/appearanceStore';
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
];

const RIGHT_TABS: TabConfig[] = [
  {name: 'library', label: 'Library', icon: 'layers-outline'},
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
      <Ionicons name="add" size={30} color={designTokens.black} />
    </Pressable>
  );
}

/** Tab bar turned off (Settings): only a small quiet "+ Add" at the bottom right. */
function FloatingCaptureButton() {
  const openQuickAdd = useCaptureStore((state) => state.openQuickAdd);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{position: 'absolute', right: 20, bottom: Math.max(insets.bottom, 16) + 8}}>
      <Pressable
        onPress={openQuickAdd}
        accessibilityRole="button"
        accessibilityLabel="Capture"
        accessibilityHint="Voice, type, or create manually"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 16,
          height: 40,
          borderRadius: 20,
          backgroundColor: designTokens.surfaceRaised,
          borderWidth: 1,
          borderColor: designTokens.surfaceBorder,
        }}>
        <Ionicons name="add" size={20} color={designTokens.textPrimary} />
        <Text style={{color: designTokens.textPrimary, fontSize: 15, fontWeight: '600'}}>Add</Text>
      </Pressable>
    </View>
  );
}

export function BottomTabBar({state, navigation}: BottomTabBarProps) {
  const {theme} = useThemeStore();
  const insets = useSafeAreaInsets();
  const visible = useAppearance((s) => s.tabBar);
  if (!visible) return <FloatingCaptureButton />;

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
        experimental_backgroundImage: `linear-gradient(180deg, ${theme.colors.surfaceContainer} 0%, ${designTokens.black} 100%)`,
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
        borderTopWidth: 1,
        borderTopColor: designTokens.surfaceBorder,
        // Android can report a 0 inset (no edge-to-edge); keep the capture button off the curved screen edge.
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      <Grain />
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
