import { Ionicons } from '@expo/vector-icons';


import { Pressable } from '@/ui/HapticPressable';
import { useCaptureStore } from '@/store/captureStore';
import { useThemeStore } from '@/store/themeStore';

export function FloatingCaptureButton() {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const openQuickAdd = useCaptureStore((state) => state.openQuickAdd);

  return (
    <Pressable
      onPress={openQuickAdd}
      accessibilityRole="button"
      accessibilityLabel="Capture"
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -28,
        backgroundColor: colors.primaryContainer,
        shadowColor: colors.primaryContainer,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}
    >
      <Ionicons name="add" size={30} color={colors.onPrimary} />
    </Pressable>
  );
}
