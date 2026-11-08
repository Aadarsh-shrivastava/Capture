import {NoTypeError, rawThought, runSelectiveAgent, type Complete} from './agent';

const now = new Date(2026, 9, 31, 10, 0); // Sat 31 Oct 2026, 10:00 local
const text = 'I need to go to gym tomorrow, at 6 pm, and hit those leg muscles';

/** Fake model: answers by which knowledge file the step loaded. */
function fakeModel(answers: Record<string, string>): Complete {
  return async messages => {
    const system = messages[0].content;
    if (system.startsWith('Is this something the user still has to DO')) return answers.type === 'Task' ? 'yes' : 'no';
    if (system.startsWith('This is not a task')) return answers.type;
    if (system.startsWith('Write a short title')) return answers.title;
    if (system.startsWith("Rewrite the user's text")) return answers.description ?? '';
    if (system.startsWith('How pressing')) return answers.priority ?? 'normal';
    if (system.startsWith('Does this item clearly belong')) return answers.group ?? 'NONE';
    if (system.startsWith('The user has their own item types')) return answers.customType ?? 'NONE';
    if (system.startsWith('How often should this come back')) return answers.memorable ?? 'sometimes';
    if (system.startsWith('Pick the sticker')) return answers.mascot ?? 'done';
    throw new Error('unknown step');
  };
}
const gymAnswers = {type: 'Task', title: 'Go to gym', description: 'I need to go to the gym tomorrow at 6 pm and hit those leg muscles.'};

test('a task: model picks type, title, description; the date is read from the words', async () => {
  const {draft, journey} = await runSelectiveAgent(text, fakeModel(gymAnswers), {now});
  expect(draft.typeName).toBe('Task');
  expect(draft.title).toBe('Go to gym');
  expect(draft.content).toBe('I need to go to the gym tomorrow at 6 pm and hit those leg muscles.');
  expect(new Date(draft.behaviorData!.Doable.due_at).getTime()).toBe(new Date(2026, 10, 1, 18, 0).getTime());
  expect(draft.behaviorData!.Doable.due_at).not.toMatch(/Z$/); // stored with local offset, not UTC
  expect(journey[0]).toBe('type: Task');
});

test('no type from the model is an error (retried later)', async () => {
  const broken: Complete = async () => {
    throw new Error('model crashed');
  };
  await expect(runSelectiveAgent(text, broken, {now})).rejects.toBeInstanceOf(NoTypeError);
});

test('a title or description with words the user never said is replaced by their own words', async () => {
  const {draft} = await runSelectiveAgent(
    'fix the leaking tap in the kitchen',
    fakeModel({type: 'Task', title: 'Fix the leaky faucet', description: 'Fix the tap by checking for water damage.'}),
    {now},
  );
  expect(draft.title).toBe('Fix the leaking tap');
  expect(draft.content).toBe('Fix the leaking tap in the kitchen');
});

test('dates never stay in the title', async () => {
  const {draft} = await runSelectiveAgent('dentist appointment on friday at 3pm', fakeModel({type: 'Task', title: 'Dentist appointment on Friday at 3 pm'}), {now});
  expect(draft.title).toBe('Dentist appointment');
});

test('nothing beyond the title: no description', async () => {
  const {draft} = await runSelectiveAgent('buy groceries', fakeModel({type: 'Task', title: 'Buy groceries', description: 'Buy groceries.'}), {now});
  expect(draft.content).toBeNull();
});

test('no ghost facts: a plain task gets no date, repeat, reminder or steps whatever the model would say', async () => {
  const {draft} = await runSelectiveAgent('pick up the laundry', fakeModel({type: 'Task', title: 'Pick up laundry'}), {now});
  expect(draft.behaviorData).toEqual({Doable: {status: 'pending', due_at: '', estimated_minutes: ''}});
  expect(draft.optionalBehaviorNames).toEqual([]);
});

test('repeat, reminder and steps come from the words the user said', async () => {
  const {draft} = await runSelectiveAgent(
    'gym every monday and thursday at 7am, remind me 10 minutes before',
    fakeModel({type: 'Task', title: 'Gym'}),
    {now},
  );
  expect(draft.behaviorData?.Repeatable?.days).toBe('[1,4]');
  expect(draft.behaviorData?.Remindable?.offsets).toBe('[10]');
  expect(new Date(draft.behaviorData!.Doable.due_at).getTime()).toBe(new Date(2026, 10, 2, 7, 0).getTime());
});

test('priority is a fixed choice', async () => {
  const {draft} = await runSelectiveAgent('urgent: fix the login bug', fakeModel({type: 'Task', title: 'Fix login bug', priority: 'urgent'}), {now});
  expect([draft.urgency, draft.importance]).toEqual([5, null]);
});

test('raw thought keeps the exact words as a Note', () => {
  expect(rawThought('buy milk')).toMatchObject({typeName: 'Note', title: 'buy milk', content: 'buy milk'});
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

test('a hedging model keeps the built-in type; a wrapped answer still counts', async () => {
  const types = [{name: 'Apply', description: 'job applications', defaults: ['Doable'], optional: [], keywords: ['cv', 'resume', 'amazon']}];
  const answers = {type: 'Task', title: 'Send CV', description: 'NONE', datetime: 'NONE', customType: 'NONE'};
  const {draft} = await runSelectiveAgent('send my cv to amazon', fakeModel(answers), {now, types});
  expect(draft.typeName).toBe('Task');
  const wrapped = await runSelectiveAgent('send my cv', fakeModel({...answers, customType: 'Type: **Apply**'}), {now, types});
  expect(wrapped.draft.typeName).toBe('Apply');
});

test('not something to do: the second pick decides information / idea / journal', async () => {
  const model: Complete = async messages => {
    const system = messages[0].content;
    if (system.startsWith('Is this something the user still has to DO')) return 'no';
    if (system.startsWith('This is not a task')) return 'Note';
    return '';
  };
  const {draft} = await runSelectiveAgent('delhi is the capital of india', model, {now});
  expect(draft.typeName).toBe('Note');
});

test('sticker: one of the fixed list, or none', async () => {
  const picked = await runSelectiveAgent('gym tomorrow at 7am', fakeModel({type: 'Task', title: 'Gym', mascot: 'workout'}), {now});
  expect(picked.draft.mascot).toBe('workout');
  const unknown = await runSelectiveAgent('gym tomorrow at 7am', fakeModel({type: 'Task', title: 'Gym', mascot: 'dragon'}), {now});
  expect(unknown.draft.mascot).toBeNull();
});
