import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardHint } from '@/components/KeyboardHint/KeyboardHint';
import { ModalHeader } from '@/components/ScreenHeader/ModalHeader';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { ArrowRightIcon, CalendarDaysIcon } from '@/components/ui/icon';
import { useCaptureStore } from '@/store/captureStore';
import { useThemeStore } from '@/store/themeStore';
import { ChipButton } from './ChipButton';


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
          borderRadius: rounded.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceContainer,
          padding: spacing.gutter,
          overflow: 'hidden',
        }}
      >
        <ModalHeader
          title="Capture"
          subtitle="Get it out of your head."
          onClose={close}
        />

        <TextInput
          multiline
          placeholder="What's on your mind?..."
          placeholderTextColor={colors.placeholder}
          value={thought}
          onChangeText={setThought}
          style={{
            flex: 1,
            color: colors.onSurface,
            fontSize: typography.headlineMd.fontSize,
            fontWeight: typography.headlineMd.fontWeight,
            lineHeight: typography.headlineMd.lineHeight,
            textAlignVertical: 'top',
            padding: 0,
          }}
        />

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: spacing.stackMd,
          }}
        />

        <Box
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.stackSm,
          }}
        >
          <ChipButton
            label="Priority"
            icon={
              <Ionicons name="flag-outline" size={16} color={colors.onSurfaceVariant} />
            }
          />
          <ChipButton
            label="Due Date"
            icon={<CalendarDaysIcon width={16} height={16} color={colors.onSurfaceVariant} />}
          />
          <ChipButton
            label="Category"
            icon={
              <Ionicons name="folder-outline" size={16} color={colors.onSurfaceVariant} />
            }
          />
          <Button
            onPress={close}
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: colors.primaryContainer,
              borderRadius: rounded.lg,
              shadowColor: colors.primaryContainer,
              shadowOpacity: 0.4,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <ButtonText style={{ color: colors.onPrimary }}>Capture</ButtonText>
            <ButtonIcon as={ArrowRightIcon} color={colors.onPrimary} />
          </Button>
        </Box>
      </Box>

      <KeyboardHint keyLabel="Enter" action="to capture instantly" />
    </Box>
  );
}
