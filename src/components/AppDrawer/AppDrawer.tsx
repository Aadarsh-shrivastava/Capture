import {Dimensions, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {OverlayContainer} from '@/lib/OverlayContainer';

import {Box} from '@/components/ui/box';
import {useDrawerStore} from '@/store/drawerStore';
import {useThemeStore} from '@/store/themeStore';

import {DrawerGradient} from './components/DrawerGradient';
import {DrawerMenuItem} from './components/DrawerMenuItem';
import {DrawerProfile} from './components/DrawerProfile';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.52, 320);

const MENU_ITEMS = [
  {label: 'Settings', icon: 'settings-outline' as const, href: '/settings'},
  {label: 'About', icon: 'information-circle-outline' as const, href: '/about'},
  // { label: 'Habits', icon: 'repeat-outline' as const, href: '/habits' },
  // { label: 'Routines', icon: 'calendar-outline' as const, href: '/routines' },
  // { label: 'History', icon: 'time-outline' as const, href: '/history' },
];

export function AppDrawer() {
  const isOpen = useDrawerStore(state => state.isOpen);
  const close = useDrawerStore(state => state.close);
  const {theme} = useThemeStore();
  const {colors, spacing, rounded} = theme;
  const insets = useSafeAreaInsets();

  const drawerBorder = 'rgba(255, 255, 255, 0.14)';

  if (!isOpen) return null;

  return (
    <OverlayContainer>
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={close}
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: 'rgba(0, 0, 0, 0.55)'},
          ]}
        />

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            overflow: 'hidden',
            borderTopRightRadius: rounded.xl,
            borderBottomRightRadius: rounded.xl,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderColor: drawerBorder,
          }}>
          <DrawerGradient />

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
        </View>
      </View>
    </OverlayContainer>
  );
}
