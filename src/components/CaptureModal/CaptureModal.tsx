import { Pressable, StyleSheet, View } from 'react-native';

import { useCaptureStore } from '@/store/captureStore';

import { CaptureForm } from './components/CaptureForm';
import { OverlayContainer } from '@/lib/OverlayContainer';

export function CaptureModal() {
  const isOpen = useCaptureStore((state) => state.isOpen);
  const close = useCaptureStore((state) => state.close);

  if (!isOpen) return null;

  return (
    <OverlayContainer>
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <CaptureForm />
        </View>
      </View>
    </OverlayContainer>
  );
}
