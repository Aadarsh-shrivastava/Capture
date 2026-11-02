import {useItemTypesStore} from '@/itemTypes/store';

import {runSelectiveAgent, type Complete} from './agent';

const now = new Date(2026, 9, 31, 10, 0); // Sat 31 Oct 2026, 10:00 local
const text = 'I need to go to gym tomorrow, at 6 pm, and hit those leg muscles';

/** Fake model: answers by which knowledge file the step loaded. */
function fakeModel(answers: Record<string, string>): Complete {
  return async messages => {
    const system = messages[0].content;
    if (system.startsWith('Classify')) return answers.type;
    if (system.startsWith('Write a title')) return answers.title;
    if (system.startsWith('Write a one-sentence')) return answers.description;
    if (system.startsWith('Copy the exact words')) return answers.datetime;
    if (system.startsWith('Does this item clearly belong')) return answers.group ?? 'NONE';
    if (system.startsWith('The user has their own item types')) return answers.customType ?? 'NONE';
    if (system.startsWith('Does this repeat')) return answers.repeat ?? 'NONE';
    if (system.startsWith('When should the user be reminded')) return answers.remind ?? 'NONE';
    if (system.startsWith('List the separate steps')) return answers.steps ?? 'NONE';
    throw new Error('unknown step');
  };
}

test('runs each step and resolves the date phrase', async () => {
  const {draft, journey} = await runSelectiveAgent(
    text,
    fakeModel({type: 'Task', title: 'Go to gym', description: 'Focus on leg muscles.', datetime: 'tomorrow at 6 pm'}),
    {now},
  );
  expect(draft.typeName).toBe('Task');
  expect(draft.title).toBe('Go to gym');
  expect(draft.content).toBe('Focus on leg muscles.');
  expect(new Date(draft.behaviorData!.Doable.due_at).getTime()).toBe(new Date(2026, 10, 1, 18, 0).getTime());
  expect(draft.behaviorData!.Doable.due_at).not.toMatch(/Z$/); // stored with local offset, not UTC
  expect(journey).toHaveLength(4);
});

test('falls back to heuristics when the model fails', async () => {
  const broken: Complete = async () => {
    throw new Error('model crashed');
  };
  const {draft, journey} = await runSelectiveAgent(text, broken, {now});
  expect(draft.typeName).toBe('Task');
  expect(draft.title.length).toBeGreaterThan(0);
  expect(draft.behaviorData!.Doable.due_at).not.toBe('');
  expect(journey[0]).toContain('(heuristic)');
});

test('group step picks an existing group and ignores made-up ones', async () => {
  const groups = [{name: 'Gym', description: 'workouts, diet'}, {name: 'Work'}];
  const answers = {type: 'Task', title: 'Go to gym', description: 'NONE', datetime: 'NONE'};
  const picked = await runSelectiveAgent(text, fakeModel({...answers, group: 'gym'}), {now, groups});
  expect(picked.draft.groupNames).toEqual(['Gym']);
  const invented = await runSelectiveAgent(text, fakeModel({...answers, group: 'Fitness'}), {now, groups});
  expect(invented.draft.groupNames).not.toContain('Fitness');
});

test('no group when the model forces one that does not fit the text', async () => {
  const groups = [{name: 'Gym', description: 'workouts, diet'}];
  const answers = {type: 'Task', title: 'Buy milk', description: 'NONE', datetime: 'NONE', group: 'Gym'};
  const {draft} = await runSelectiveAgent('buy milk today', fakeModel(answers), {now, groups});
  expect(draft.groupNames).toEqual([]);
});

test('behavior steps run only on signal and attach behaviors', async () => {
  const answers = {type: 'Task', title: 'Gym', description: 'NONE', datetime: 'at 6 pm', repeat: 'weekly on mon,fri', remind: '15 minutes before'};
  const {draft, journey} = await runSelectiveAgent('gym every monday and friday at 6 pm, remind me before', fakeModel(answers), {now});
  expect(draft.optionalBehaviorNames).toEqual(expect.arrayContaining(['Repeatable', 'Remindable']));
  expect(draft.behaviorData?.Repeatable?.days).toBe('[1,5]');
  expect(draft.behaviorData?.Remindable?.offsets).toBe('[15]');
  expect(journey.some(line => line.startsWith('repeats:'))).toBe(true);

  const plain = await runSelectiveAgent('call mom tomorrow', fakeModel({...answers, repeat: 'weekly'}), {now});
  expect(plain.draft.optionalBehaviorNames ?? []).not.toContain('Remindable');
});

test('narrows to a custom type of the same kind, guarded by the text', async () => {
  const types = [
    {name: 'Apply', description: 'job applications', defaults: ['Doable'], optional: ['Visitable']},
    {name: 'Recipe', description: 'cooking', defaults: ['Notable'], optional: []},
  ];
  const answers = {type: 'Task', title: 'Apply to Acme', description: 'NONE', datetime: 'NONE', customType: 'Apply'};
  const {draft, journey} = await runSelectiveAgent('apply for the acme job application by friday', fakeModel(answers), {now, types});
  expect(draft.typeName).toBe('Apply');
  expect(journey[0]).toContain('your type, like Task');

  // Model insists on Apply but the text has nothing to do with it → stays Task.
  const other = await runSelectiveAgent('buy milk today', fakeModel({...answers, customType: 'Apply'}), {now, types});
  expect(other.draft.typeName).toBe('Task');

  // A link makes step 1 say Note; Apply (doable) must still be offered and chosen.
  const withLink = await runSelectiveAgent('apply for job in google at www.google.com', fakeModel({...answers, type: 'Note'}), {now, types});
  expect(withLink.draft.typeName).toBe('Apply');
});

test('keywords let a type match without sharing words with its name or description', async () => {
  const types = [{name: 'Apply', description: 'job applications', defaults: ['Doable'], optional: [], keywords: ['cv', 'resume', 'recruiter']}];
  const answers = {type: 'Task', title: 'Send CV to Acme', description: 'NONE', datetime: 'NONE', customType: 'Apply'};
  const {draft} = await runSelectiveAgent('send my cv to acme', fakeModel(answers), {now, types});
  expect(draft.typeName).toBe('Apply');
});

test('clear keyword winner beats a hedging model', async () => {
  const types = [{name: 'Apply', description: 'job applications', defaults: ['Doable'], optional: [], keywords: ['cv', 'resume', 'amazon']}];
  const answers = {type: 'Task', title: 'Send CV', description: 'NONE', datetime: 'NONE', customType: 'NONE'};
  const {draft} = await runSelectiveAgent('send my cv to amazon', fakeModel(answers), {now, types});
  expect(draft.typeName).toBe('Apply');
  const wrapped = await runSelectiveAgent('send my cv', fakeModel({...answers, customType: 'Type: **Apply**'}), {now, types});
  expect(wrapped.draft.typeName).toBe('Apply');
});

test('no model at all: rule-based parser still picks the custom type by keywords', async () => {
  useItemTypesStore.getState().setTypes([
    {id: 9, name: 'Apply', description: 'job applications', icon: null, isSystem: false, defaults: ['Doable'], optional: [], keywords: ['cv', 'resume', 'amazon']},
  ]);
  const broken: Complete = async () => {
    throw new Error('no model');
  };
  const {draft} = await runSelectiveAgent('send my cv to amazon', broken, {now});
  expect(draft.typeName).toBe('Apply');
  useItemTypesStore.getState().setTypes([]);
});
