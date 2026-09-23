import { StyleSheet, View } from 'react-native';

import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { CaptureFlowHost } from '@/components/CaptureFlowHost/CaptureFlowHost';
import { CaptureModal } from '@/components/CaptureModal/CaptureModal';
import { CaptureVoiceHost } from '@/components/CaptureVoiceHost/CaptureVoiceHost';

import { RootNavigator } from './RootNavigator';

export function AppShell() {
  return (
    <View style={styles.root}>
      <RootNavigator />
      <AppDrawer />
      <CaptureModal />
      <CaptureFlowHost />
      <CaptureVoiceHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
