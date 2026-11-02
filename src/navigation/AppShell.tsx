import { StyleSheet, View } from 'react-native';

import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { CaptureFlowHost } from '@/components/CaptureFlowHost/CaptureFlowHost';
import { CaptureModal } from '@/components/CaptureModal/CaptureModal';
import { CaptureVoiceHost } from '@/components/CaptureVoiceHost/CaptureVoiceHost';
import { TaskReminders } from '@/notifications';
import { DailyReviewSheet } from '@/dailyReview';
import { DevButton } from '@/dev';
import { SelectionBar } from '@/selection';
import { UndoToast } from '@/undo';
import { WeeklyReviewSheet } from '@/weeklyReview';
import { TypeCheckSheet } from '@/typeCheck';
import { HomeWidgetHandler } from '@/widget/HomeWidgetHandler';

import { RootNavigator } from './RootNavigator';

export function AppShell() {
  return (
    <View style={styles.root}>
      <RootNavigator />
      <SelectionBar />
      <AppDrawer />
      <CaptureModal />
      <CaptureFlowHost />
      <CaptureVoiceHost />
      <HomeWidgetHandler />
      <TaskReminders />
      <UndoToast />
      <TypeCheckSheet />
      <DailyReviewSheet />
      <WeeklyReviewSheet />
      <DevButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
