import {VIEWS} from './registry';
import {useViewStore} from './store';

/** Current mode's entry (falls back to Today if a stored key no longer exists, e.g. old "board"). */
export function useCurrentView() {
  const view = useViewStore(state => state.view);
  return VIEWS.find(v => v.key === view) ?? VIEWS[0];
}
