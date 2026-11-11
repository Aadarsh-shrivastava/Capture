import {useDailyReviewStore} from './store';

export {DailyReviewSheet} from './DailyReviewSheet';

export function isDailyReviewOpen(): boolean {
  return useDailyReviewStore.getState().visible;
}

/** Open the leftovers review now (dev / summary tap). */
export function openDailyReview(): void {
  useDailyReviewStore.getState().open();
}
