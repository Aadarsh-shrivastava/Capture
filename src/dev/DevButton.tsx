import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sheet } from '@/components/Sheet/Sheet';
import { designTokens } from '@/ui/designTokens';
import { Pressable } from '@/ui/HapticPressable';

import { DevPanel } from './DevPanel';

/** Small floating button (dev builds only) that opens the dev tools sheet. */
export function DevButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  if (!__DEV__) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Dev tools"
        hitSlop={8}
        style={{
          position: 'absolute',
          left: 16,
          bottom: insets.bottom + 96,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: designTokens.surfaceRaised,
          borderWidth: 1,
          borderColor: designTokens.surfaceBorder,
        }}>
        <Ionicons name="construct-outline" size={16} color={designTokens.textSecondary} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Dev tools">
        <DevPanel onClose={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
