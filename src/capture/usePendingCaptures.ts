import {useEffect, useState} from 'react';

import {getDatabase} from '@/db/database';
import {useDataVersionStore} from '@/store/dataVersionStore';

import {useCaptureQueue} from './queue';

export type PendingCapture = {id: number; text: string; createdAt: string};

/** Thoughts said but not sorted yet (still in the queue), newest first — shown as "sorting…" bubbles. */
export function usePendingCaptures(): PendingCapture[] {
  const pending = useCaptureQueue(s => s.pending);
  const version = useDataVersionStore(s => s.version);
  const [rows, setRows] = useState<PendingCapture[]>([]);
  useEffect(() => {
    getDatabase()
      .then(db => db.getAllAsync<PendingCapture>('SELECT id, text, created_at AS createdAt FROM capture_queue ORDER BY id DESC'))
      .then(setRows)
      .catch(() => {});
  }, [pending, version]);
  return rows;
}
