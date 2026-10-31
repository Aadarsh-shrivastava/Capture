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
    throw new Error('unknown step');
  };
}

test('runs each step and resolves the date phrase', async () => {
  const {draft, journey} = await runSelectiveAgent(
    text,
    fakeModel({type: 'Task', title: 'Go to gym', description: 'Focus on leg muscles.', datetime: 'tomorrow at 6 pm'}),
    now,
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
  const {draft, journey} = await runSelectiveAgent(text, broken, now);
  expect(draft.typeName).toBe('Task');
  expect(draft.title.length).toBeGreaterThan(0);
  expect(draft.behaviorData!.Doable.due_at).not.toBe('');
  expect(journey[0]).toContain('(heuristic)');
});

test('group step picks an existing group and ignores made-up ones', async () => {
  const groups = [{name: 'Gym', description: 'workouts, diet'}, {name: 'Work'}];
  const answers = {type: 'Task', title: 'Go to gym', description: 'NONE', datetime: 'NONE'};
  const picked = await runSelectiveAgent(text, fakeModel({...answers, group: 'gym'}), now, undefined, groups);
  expect(picked.draft.groupNames).toEqual(['Gym']);
  const invented = await runSelectiveAgent(text, fakeModel({...answers, group: 'Fitness'}), now, undefined, groups);
  expect(invented.draft.groupNames).not.toContain('Fitness');
});

test('no group when the model forces one that does not fit the text', async () => {
  const groups = [{name: 'Gym', description: 'workouts, diet'}];
  const answers = {type: 'Task', title: 'Buy milk', description: 'NONE', datetime: 'NONE', group: 'Gym'};
  const {draft} = await runSelectiveAgent('buy milk today', fakeModel(answers), now, undefined, groups);
  expect(draft.groupNames).toEqual([]);
});
