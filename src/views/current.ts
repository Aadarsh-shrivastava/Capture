import moment from 'moment';

import {VIEWS} from './registry';
import {useViewStore} from './store';

/** Current mode's entry (falls back to Today if a stored key no longer exists, e.g. old "board", or a custom date never picked). */
export function useCurrentView() {
  const view = useViewStore(state => state.view);
  const day = useViewStore(state => state.day);
  const entry = VIEWS.find(v => v.key === view && (v.key !== 'custom' || day)) ?? VIEWS[0];
  return entry.key === 'custom' ? {...entry, label: moment(day, 'YYYY-MM-DD').format('ddd, MMM D')} : entry;
}

