import {create} from 'zustand';

import {getDatabase} from '@/db/database';
import {analyzeText, ModelUnavailableError, splitCapture} from '@/hooks/useCaptureAnalysis';
import {ensureLoaded} from '@/hooks/useLlamaModel';
import {rawThought} from '@/selectiveKnowledge/agent';
import {announceSaved, saveCaptures, type SavedCapture} from '@/services/saveCaptures';

type Row = {id: number; text: string; group_name: string | null; created_at: string; attempts: number; needs_split: number; kind: ShareKind | null};

/** Thoughts still waiting for the model (drives the "Processing…" strip). */
export const useCaptureQueue = create<{pending: number}>(() => ({pending: 0}));

/** A row the model already failed on this many times (or crashed the app on) is saved as the raw thought instead. */
const MAX_MODEL_ATTEMPTS = 2;

let draining = false;
let rerun = false;

/** A thought, with when it was said if that was earlier than now (Siri / widget captures waiting in native storage). */
/** What the user picked when sharing; decides the kind instead of the model. */
export type ShareKind = 'todo' | 'read' | 'remember' | 'keep';

/**
 * A thought, with when it was said if that was earlier than now (Siri / widget / share captures waiting in native
 * storage). `split: false` keeps it whole (a shared article isn't a dump of thoughts); `kind` is the user's own pick.
 */
export type QueuedThought = string | {text: string; at: Date; split?: boolean; kind?: ShareKind};

/**
 * Say and forget: store the thoughts, let the worker turn them into items. `needsSplit`: store as-is and let the
 * worker split (texts handed over from native storage must be in the DB at once, before any slow model step).
 * All or nothing: one transaction.
 */
export async function enqueue(parts: QueuedThought[], groupName?: string, needsSplit = false): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  await db.withTransactionAsync(async () => {
    for (const part of parts) {
      const {text, at, split = needsSplit, kind = null} = typeof part === 'string' ? {text: part, at: now} : part;
      await db.runAsync(
        'INSERT INTO capture_queue (text, group_name, created_at, needs_split, kind) VALUES (?, ?, ?, ?, ?)',
        text,
        groupName ?? null,
        at.toISOString(),
        split ? 1 : 0,
        kind,
      );
    }
  });
  useCaptureQueue.setState(s => ({pending: s.pending + parts.length}));
  void drain();
}

/** Split one stored dump into its thoughts (each keeps the dump's capture time), or turn one thought into an item. */
async function processRow(db: Awaited<ReturnType<typeof getDatabase>>, row: Row, saved: SavedCapture[]): Promise<void> {
  // No model: leave everything queued (attempts untouched) until it's back.
  if (!(await ensureLoaded())) throw new ModelUnavailableError('AI model not available');

  if (row.needs_split) {
    const parts = await splitCapture(row.text).catch(e => {
      if (e instanceof ModelUnavailableError) throw e;
      return [row.text];
    });
    await db.withTransactionAsync(async () => {
      for (const text of parts) {
        await db.runAsync(
          'INSERT INTO capture_queue (text, group_name, created_at) VALUES (?, ?, ?)',
          text,
          row.group_name,
          row.created_at,
        );
      }
      await db.runAsync('DELETE FROM capture_queue WHERE id = ?', row.id);
    });
    return;
  }

  await db.runAsync('UPDATE capture_queue SET attempts = attempts + 1 WHERE id = ?', row.id);
  // Relative dates resolve against when it was said, not when the worker got to it.
  const capturedAt = new Date(row.created_at);
  const draft = row.attempts < MAX_MODEL_ATTEMPTS ? await analyzeText(row.text, undefined, capturedAt, row.kind ?? undefined) : rawThought(row.text);
  // ponytail: app killed between save and delete re-saves this row next launch (one duplicate); fix = save + delete in one transaction.
  saved.push(...(await saveCaptures([row.group_name ? {...draft, groupNames: [row.group_name]} : draft], false)));
  await db.runAsync('DELETE FROM capture_queue WHERE id = ?', row.id);
}

/**
 * One row at a time (one model), oldest first; a row is deleted only once its item is saved. Also run at launch.
 * A row that fails stays in the table for the next launch and is skipped for the rest of this run, so it never blocks the rows behind it.
 */
export async function drain(): Promise<void> {
  if (draining) {
    rerun = true;
    return;
  }
  draining = true;
  const saved: SavedCapture[] = [];
  const failed: number[] = [];
  try {
    const db = await getDatabase();
    for (;;) {
      const count = await db.getFirstAsync<{n: number}>('SELECT COUNT(*) AS n FROM capture_queue');
      useCaptureQueue.setState({pending: Math.max(0, (count?.n ?? 0) - failed.length)});
      const row = await db.getFirstAsync<Row>(
        `SELECT * FROM capture_queue WHERE id NOT IN (${failed.map(() => '?').join(',')}) ORDER BY id LIMIT 1`,
        ...failed,
      );
      if (!row) break;
      try {
        await processRow(db, row, saved);
      } catch (e) {
        if (e instanceof ModelUnavailableError) break; // everything waits for the model; run again once it's loaded
        if (__DEV__) console.warn('[capture-queue] row', row.id, e);
        failed.push(row.id);
      }
    }
  } catch (e) {
    // Rows stay in the table and are retried next launch.
    if (__DEV__) console.warn('[capture-queue]', e);
    useCaptureQueue.setState({pending: 0});
  } finally {
    draining = false;
    announceSaved(saved);
    if (rerun) {
      rerun = false;
      void drain();
    }
  }
}
