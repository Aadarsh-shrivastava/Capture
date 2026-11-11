import { StyleSheet, View } from 'react-native';

import { AppDrawer } from '@/components/AppDrawer/AppDrawer';
import { TaskReminders } from '@/notifications';
import { DailyReviewSheet } from '@/dailyReview';
import { DevButton } from '@/dev';
import { SelectionBar } from '@/selection';
import { UndoToast } from '@/undo';
import { WeeklyReviewSheet } from '@/weeklyReview';
import { HomeWidgetHandler } from '@/widget/HomeWidgetHandler';

import { RootNavigator } from './RootNavigator';

export function AppShell() {
  return (
    <View style={styles.root}>
      <RootNavigator />
      <SelectionBar />
      <AppDrawer />
      <HomeWidgetHandler />
      <TaskReminders />
      <UndoToast />
      <DailyReviewSheet />
      <WeeklyReviewSheet />
      <DevButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
