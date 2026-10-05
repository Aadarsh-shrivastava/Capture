import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {Modal, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Pressable} from '@/ui/HapticPressable';
import {designTokens, radius} from '@/ui/designTokens';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** 'left' matches the compact option sheets, 'center' the full capture sheet. */
  titleAlign?: 'left' | 'center';
  /** Fills the screen (capture flow) instead of hugging its content. */
  fullHeight?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/** Dark bottom sheet with grabber, close button and title — shared by every sheet. */
export function Sheet({
  visible,
  onClose,
  title,
  titleAlign = 'left',
  fullHeight = false,
  children,
  footer,
}: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end'}}>
        <Pressable
          style={{flex: fullHeight ? 0 : 1}}
          accessibilityLabel="Close"
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: designTokens.sheet,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingBottom: insets.bottom + 16,
            flex: fullHeight ? 1 : undefined,
            maxHeight: fullHeight ? undefined : '88%',
            marginTop: fullHeight ? insets.top + 12 : 0,
          }}>
          <View style={{alignItems: 'center', paddingTop: 10, paddingBottom: 6}}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.22)',
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 6,
              paddingBottom: 14,
            }}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{width: 32}}>
              <Ionicons name="close" size={24} color={designTokens.textPrimary} />
            </Pressable>

            {title ? (
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: designTokens.textPrimary,
                  fontSize: 17,
                  fontWeight: '600',
                  textAlign: titleAlign === 'center' ? 'center' : 'left',
                  marginLeft: titleAlign === 'center' ? 0 : 8,
                }}>
                {title}
              </Text>
            ) : (
              <View style={{flex: 1}} />
            )}

            <View style={{width: 32}} />
          </View>

          {children}

          {footer}
        </View>
      </View>
    </Modal>
  );
}
