import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export function OverlayContainer({ children }: { children: ReactNode }) {
  return <View style={styles.overlay}>{children}</View>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
});
