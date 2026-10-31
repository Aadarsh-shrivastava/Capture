// Animated with useNativeDriver only (opacity/transform run on the UI thread).
// LayoutAnimation aborts the app on the new architecture (RN 0.77 LayoutAnimationDriver crash),
// so it is deliberately not used anywhere.
export {Appear} from './Appear';
export {SlideOut} from './SlideOut';
export {ThoughtTicker} from './ThoughtTicker';

/** Gap between rows when several slide out one after another. */
export const STAGGER_MS = 90;
/** Time for one row to slide out in a bulk action. */
export const BULK_SLIDE_MS = 350;
