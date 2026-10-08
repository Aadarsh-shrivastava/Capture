import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import {itemApi} from '@/api/itemApi';
import type {FocusTask} from '@/models/focusTask';

function addDays(base: Date, days: number): string {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

async function saveTaskUpdate(task: FocusTask, updates: {
  status?: string;
  doable?: Record<string, string>;
}) {
  const full = await itemApi.getItemFull(task.id);
  const doable = {
    ...getDefaultFieldValues('Doable'),
    ...(full.behaviorData.Doable ?? {}),
    ...(updates.doable ?? {}),
  };

  await itemApi.saveItem(
    {
      typeId: full.typeId,
      title: full.title,
      content: full.content,
      importance: full.importance,
      urgency: full.urgency,
      status: updates.status ?? full.status,
      optionalBehaviorIds: full.optionalBehaviorIds,
      behaviorData: {...full.behaviorData, Doable: doable},
      groupIds: full.groupIds,
      tagNames: full.tagNames,
    },
    task.id,
  );
}

export const focusTaskService = {
  async completeTask(task: FocusTask) {
    await saveTaskUpdate(task, {
      status: 'active',
      doable: {status: 'completed'},
    });
  },

  async startTask(task: FocusTask) {
    await saveTaskUpdate(task, {
      status: 'active',
      doable: {status: 'in_progress'},
    });
  },

  async pauseTask(task: FocusTask) {
    await saveTaskUpdate(task, {
      status: 'active',
      doable: {status: 'pending'},
    });
  },

  async deferTask(task: FocusTask) {
    await saveTaskUpdate(task, {status: 'deferred'});
  },

  async reactivateTask(task: FocusTask) {
    await saveTaskUpdate(task, {status: 'active'});
  },

  async rescheduleTask(task: FocusTask, dueAt: string) {
    await saveTaskUpdate(task, {
      status: 'active',
      doable: {due_at: dueAt},
    });
  },

  rescheduleOptions() {
    const today = new Date();
    return [
      {label: 'Today', value: addDays(today, 0)},
      {label: 'Tomorrow', value: addDays(today, 1)},
      {label: 'In 3 days', value: addDays(today, 3)},
      {label: 'Next week', value: addDays(today, 7)},
    ] as const;
  },
};
