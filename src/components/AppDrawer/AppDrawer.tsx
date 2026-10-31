import {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Pressable} from '@/ui/HapticPressable';
import {OverlayContainer} from '@/lib/OverlayContainer';

import {Box} from '@/components/ui/box';
import {useDrawerStore} from '@/store/drawerStore';
import {useThemeStore} from '@/store/themeStore';

import {DrawerMenuItem} from './components/DrawerMenuItem';
import {DrawerProfile} from './components/DrawerProfile';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.52, 320);

const MENU_ITEMS = [
  {label: 'Groups', icon: 'folder-outline' as const, href: '/(tabs)/groups'},
  {label: 'Library', icon: 'layers-outline' as const, href: '/(tabs)/library'},
  {label: 'Timeline', icon: 'time-outline' as const, href: '/(tabs)/timeline'},
  {label: 'Settings', icon: 'settings-outline' as const, href: '/settings'},
];

export function AppDrawer() {
  const isOpen = useDrawerStore(state => state.isOpen);
  const close = useDrawerStore(state => state.close);
  const {theme} = useThemeStore();
  const {colors, spacing} = theme;
  const insets = useSafeAreaInsets();
  // Stay mounted while sliding out; slide + backdrop fade run on the native thread.
  const [mounted, setMounted] = useState(isOpen);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) setMounted(true);
    const anim = Animated.timing(progress, {toValue: isOpen ? 1 : 0, duration: 240, useNativeDriver: true});
    anim.start(({finished}) => {
      if (finished && !isOpen) setMounted(false);
    });
    return () => anim.stop();
  }, [isOpen, progress]);

  if (!mounted) return null;

  return (
    <OverlayContainer>
      <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
        <Animated.View style={[StyleSheet.absoluteFill, {opacity: progress}]}>
          <Pressable onPress={close} style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0, 0, 0, 0.55)'}]} />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{translateX: progress.interpolate({inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0]})}],
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: colors.surfaceContainerLow,
            borderRightWidth: 1,
            borderRightColor: colors.border,
          }}>
          <Box
            style={{
              flex: 1,
              paddingTop: insets.top + spacing.stackMd,
              paddingBottom: insets.bottom + spacing.stackMd,
              paddingHorizontal: spacing.gutter,
            }}>
            <DrawerProfile />

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginBottom: spacing.stackSm,
              }}
            />

            {MENU_ITEMS.map(item => (
              <DrawerMenuItem key={item.href} {...item} />
            ))}
          </Box>
        </Animated.View>
      </View>
    </OverlayContainer>
  );
}
