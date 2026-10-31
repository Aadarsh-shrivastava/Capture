import {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Mascot} from '@/mascot';
import {Appear} from '@/motion';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {useUndoStore} from './store';

const VISIBLE_MS = 5000;
/** Sits above the bottom tab bar. */
const BOTTOM_OFFSET = 96;

export function UndoToast() {
  const current = useUndoStore(state => state.current);
  const hide = useUndoStore(state => state.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [current, hide]);

  if (!current) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{position: 'absolute', left: 16, right: 16, bottom: insets.bottom + BOTTOM_OFFSET}}>
      <Appear
        key={current.id}
        from="up"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: radius.md,
          backgroundColor: designTokens.surfaceRaised,
          borderWidth: 1,
          borderColor: designTokens.surfaceBorder,
        }}>
        {current.pose ? <Mascot pose={current.pose} width={34} halo={false} /> : null}
        <Text numberOfLines={1} style={{flex: 1, color: designTokens.textPrimary, fontSize: 15}}>
          {current.label}
        </Text>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          onPress={() => {
            hide();
            Promise.resolve(current.undo()).catch(() => {});
          }}>
          <Text style={{color: designTokens.textPrimary, fontSize: 15, fontWeight: '700'}}>Undo</Text>
        </Pressable>
      </Appear>
    </View>
  );
}
