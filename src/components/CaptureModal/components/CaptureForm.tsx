import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalHeader } from '@/components/ScreenHeader/ModalHeader';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { useCaptureStore } from '@/store/captureStore';
import { useThemeStore } from '@/store/themeStore';

export function CaptureForm() {
  const { theme } = useThemeStore();
  const { colors, spacing, rounded, typography } = theme;
  const close = useCaptureStore((state) => state.close);
  const insets = useSafeAreaInsets();
  const [thought, setThought] = useState('');

  return (
    <Box
      style={{
        flex: 1,
        paddingTop: insets.top + spacing.stackMd,
        paddingBottom: insets.bottom + spacing.stackMd,
        paddingHorizontal: spacing.marginMobile,
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          flex: 1,
          maxHeight: '85%',
          borderRadius: rounded.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceContainer,
          padding: spacing.gutter,
          overflow: 'hidden',
        }}
      >
        <ModalHeader title="Capture" onClose={close} />

        <TextInput
          multiline
          placeholder="What's on your mind?"
          placeholderTextColor={colors.placeholder}
          value={thought}
          onChangeText={setThought}
          style={{
            flex: 1,
            color: colors.onSurface,
            fontSize: typography.bodyLg.fontSize,
            fontWeight: '400',
            lineHeight: typography.bodyLg.lineHeight,
            textAlignVertical: 'top',
            padding: 0,
            marginTop: spacing.stackMd,
          }}
        />

        <View style={{ marginTop: spacing.stackMd }}>
          <Button
            onPress={close}
            style={{
              backgroundColor: colors.primaryContainer,
              borderRadius: rounded.lg,
            }}
          >
            <ButtonText style={{ color: colors.onPrimaryContainer }}>Close</ButtonText>
          </Button>
        </View>
      </Box>
    </Box>
  );
}
